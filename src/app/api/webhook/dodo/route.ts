import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

export const dynamic = "force-dynamic";

type WebhookPayload = {
  type: string;
  data: {
    product_id?: string;
    plan_id?: string;
    subscription_id?: string;
    product?: { id?: string };
    plan?: { product_id?: string };
    product_cart?: Array<{ product_id: string; quantity: number }>;
    metadata?: {
      clerkUserId?: string;
      userId?: string; 
      payment_type?: string;
    };
    [key: string]: unknown;
  };
};

export async function POST(req: Request) {
  console.log("🚀 [DODO WEBHOOK] Request received!");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    console.error("❌ [DODO WEBHOOK] Missing Supabase configuration!");
    return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

  const payload = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const webhookSignature = req.headers.get("webhook-signature");
  const webhookTimestamp = req.headers.get("webhook-timestamp");

  console.log("🔍 [DODO WEBHOOK] Headers check:", {
    webhookId,
    hasSignature: Boolean(webhookSignature),
    webhookTimestamp,
  });

  const secret =
    process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  if (!secret || !webhookId || !webhookSignature || !webhookTimestamp) {
    console.error("❌ [DODO WEBHOOK] Missing signature headers or secret!", {
      hasSecret: Boolean(secret),
      webhookId,
      webhookSignature,
      webhookTimestamp
    });
    return NextResponse.json({ error: "Unauthorized missing headers" }, { status: 401 });
  }

  const verifier = new Webhook(secret);

  try {
    await verifier.verify(payload, {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
    });
    console.log("✅ [DODO WEBHOOK] Signature verification passed!");
  } catch (e) {
    console.error("❌ [DODO WEBHOOK] Signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let evt: WebhookPayload;
  try {
    evt = JSON.parse(payload) as WebhookPayload;
    console.log("📦 [DODO WEBHOOK] Event type parsed:", evt.type);
  } catch {
    console.error("❌ [DODO WEBHOOK] Failed to parse JSON body!");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Idempotency check
  const { data: existing, error: alreadyErr } = await supabaseAdmin
    .from("webhook_events")
    .select("id")
    .eq("webhook_id", webhookId)
    .maybeSingle();

  if (alreadyErr) {
    console.warn("⚠️ [DODO WEBHOOK] Idempotency check failed:", alreadyErr.message);
  }
  if (existing) {
    console.log("⚠️ [DODO WEBHOOK] Duplicate webhook detected; skipping processing. ID:", webhookId);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Log raw event
  const { error: insertLogErr } = await supabaseAdmin.from("webhook_events").insert({
    webhook_id: webhookId,
    event_type: evt.type,
    payload: evt as unknown as Record<string, unknown>,
  });
  if (insertLogErr) {
    console.warn("⚠️ [DODO WEBHOOK] Failed to log webhook event into Supabase:", insertLogErr.message);
  } else {
    console.log("✅ [DODO WEBHOOK] Webhook event logged in database successfully!");
  }

  const STARTER_ID = process.env.NEXT_PUBLIC_DODO_STARTER_PLAN_ID;
  const AGENCY_ID = process.env.NEXT_PUBLIC_DODO_AGENCY_PLAN_ID;
  const ACADEMY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_ACADEMY_PRODUCT_ID;
  const SINGLE_AUDIT_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_SINGLE_AUDIT_PRODUCT_ID;

  const data = evt.data ?? {};
  const clerkUserId = data.metadata?.clerkUserId || data.metadata?.userId;

  console.log("👤 [DODO WEBHOOK] Extracted Clerk User ID:", clerkUserId);

  if (!clerkUserId) {
    console.warn("⚠️ [DODO WEBHOOK] Missing metadata.clerkUserId / metadata.userId; nothing to update.");
    return NextResponse.json({ received: true });
  }

  const environment = process.env.NODE_ENV === "production" ? "live_mode" : "test_mode";

  async function resolvePlanOrProductId(): Promise<string | null> {
    if (data.product_id) return String(data.product_id);
    if (data.plan_id) return String(data.plan_id);
    if (data.product?.id) return String(data.product.id);
    if (data.plan?.product_id) return String(data.plan.product_id);

    if (data.product_cart && data.product_cart.length > 0 && data.product_cart[0]?.product_id) {
      return String(data.product_cart[0].product_id);
    }

    const rawData = data as Record<string, unknown>;
    if (rawData.product_id) return String(rawData.product_id);

    if (data.subscription_id && process.env.DODO_PAYMENTS_API_KEY) {
      try {
        const client = new DodoPayments({
          bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
          environment,
        });
        const sub = await client.subscriptions.retrieve(String(data.subscription_id));
        const planId = (sub as unknown as Record<string, unknown>)["plan_id"] as string | undefined;
        if (planId) return planId;
      } catch (e) {
        console.warn("⚠️ [DODO WEBHOOK] Subscription lookup failed:", e);
      }
    }
    return null;
  }

  async function setPlan(plan: "STARTER" | "AGENCY", limit: number) {
    const radarLimit = plan === "AGENCY" ? 500 : 100;
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ 
        plan, 
        audit_limit: limit, 
        used_audits: 0,
        radar_used: 0,
        radar_limit: radarLimit
      })
      .eq("id", clerkUserId);

    if (dbError) {
      console.error("❌ [DODO WEBHOOK] Supabase update failed:", dbError.message);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
    console.log(`✅ [DODO WEBHOOK] Successfully set plan ${plan} for user ${clerkUserId}`);
    return NextResponse.json({ received: true });
  }

  // Pretplate
  if (
    evt.type === "subscription.created" ||
    evt.type === "subscription.active" ||
    evt.type === "subscription.renewed" ||
    evt.type === "subscription.plan_changed"
  ) {
    const resolvedId = await resolvePlanOrProductId();
    console.log(`📘 [DODO WEBHOOK] Processing subscription. Resolved ID: ${resolvedId}`);

    if (!resolvedId) {
      console.warn("⚠️ [DODO WEBHOOK] Unknown plan/product in subscription event.");
      return NextResponse.json({ received: true });
    }
    if (AGENCY_ID && resolvedId === AGENCY_ID) {
      return setPlan("AGENCY", 200);
    }
    if (STARTER_ID && resolvedId === STARTER_ID) {
      return setPlan("STARTER", 50);
    }
    console.warn("⚠️ [DODO WEBHOOK] Subscription ID match not found:", resolvedId);
    return NextResponse.json({ received: true });
  }

  if (evt.type === "subscription.cancelled" || evt.type === "subscription.on_hold") {
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ 
        plan: "FREE", 
        audit_limit: 1, 
        used_audits: 0,
        radar_used: 0,
        radar_limit: 1
      })
      .eq("id", clerkUserId);

    if (dbError) {
      console.error("❌ [DODO WEBHOOK] Cancellation DB update failed:", dbError.message);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  // Jednokratne uplate
  if (evt.type === "payment.succeeded") {
    const resolvedId = await resolvePlanOrProductId();

    console.log("💳 [DODO WEBHOOK] Processing payment.succeeded", {
      resolvedId,
      EXPECTED_SINGLE_AUDIT_ID: SINGLE_AUDIT_PRODUCT_ID,
      EXPECTED_ACADEMY_ID: ACADEMY_PRODUCT_ID,
      isMatchSingleAudit: SINGLE_AUDIT_PRODUCT_ID === resolvedId
    });

    // 1. Akademija
    if (ACADEMY_PRODUCT_ID && resolvedId === ACADEMY_PRODUCT_ID) {
      console.log(`🎓 [DODO WEBHOOK] Unlocking Academy for user: ${clerkUserId}`);
      
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .update({ 
          aeo_academy_paid: true,
          exam_attempts_used: 0, 
          exam_passed: false
        })
        .eq("id", clerkUserId);

      if (dbError) {
        console.error("❌ [DODO WEBHOOK] Academy update failed:", dbError.message);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      return NextResponse.json({ received: true, academy_unlocked: true });
    }

    // 2. Single Audit ($5)
    if (SINGLE_AUDIT_PRODUCT_ID && resolvedId === SINGLE_AUDIT_PRODUCT_ID) {
      console.log(`🎯 [DODO WEBHOOK] Target matched: SINGLE AUDIT! User: ${clerkUserId}`);

      const { data: user, error: fetchErr } = await supabaseAdmin
        .from("users")
        .select("audit_limit")
        .eq("id", clerkUserId)
        .maybeSingle();

      if (fetchErr) {
        console.error("❌ [DODO WEBHOOK] Supabase fetch error:", fetchErr.message);
        return NextResponse.json({ error: "Database fetch failed" }, { status: 500 });
      }

      if (!user) {
        console.error("❌ [DODO WEBHOOK] User not found in 'users' table with id:", clerkUserId);
        return NextResponse.json({ error: "User not found for credit increment" }, { status: 404 });
      }

      const currentLimit = Number(user.audit_limit) || 0;
      const newLimit = currentLimit + 1;

      console.log(`🔄 [DODO WEBHOOK] Updating audit_limit from ${currentLimit} to ${newLimit} for user ${clerkUserId}...`);

      const { error: updateErr } = await supabaseAdmin
        .from("users")
        .update({ audit_limit: newLimit })
        .eq("id", clerkUserId);

      if (updateErr) {
        console.error("❌ [DODO WEBHOOK] Single Audit update failed:", updateErr.message);
        return NextResponse.json({ error: "Failed to increment audit_limit" }, { status: 500 });
      }

      console.log(`🎉 [DODO WEBHOOK SUCCESS] User ${clerkUserId} updated successfully to new limit: ${newLimit}`);
      return NextResponse.json({ received: true, audit_credit_added: true, new_limit: newLimit });
    }

    console.warn(`⚠️ [DODO WEBHOOK] Unhandled product ID under payment.succeeded: ${resolvedId}`);
  }

  console.log(`ℹ️ [DODO WEBHOOK] Unhandled event type: ${evt.type}`);
  return NextResponse.json({ received: true, ignored: evt.type });
}