import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

export const dynamic = "force-dynamic";

// 🛡️ REŠEN PROBLEM SA ANY: Precizno tipiziran payload prema Dodo JSON strukturi
type WebhookPayload = {
  type: string;
  data: {
    product_id?: string;
    plan_id?: string;
    subscription_id?: string;
    product?: { id?: string };
    plan?: { product_id?: string };
    product_cart?: Array<{ product_id: string; quantity: number }>; // 🚀 Dodato za jednokratne korpe
    metadata?: {
      clerkUserId?: string;
      userId?: string; 
      payment_type?: string;
    };
    [key: string]: unknown;
  };
};

export async function POST(req: Request) {
  console.log("===== Dodo Webhook: received =====");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    console.error("Missing Supabase configuration");
    return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

  const payload = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const webhookSignature = req.headers.get("webhook-signature");
  const webhookTimestamp = req.headers.get("webhook-timestamp");

  const secret =
    process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  if (!secret || !webhookId || !webhookSignature || !webhookTimestamp) {
    console.error("Missing webhook signature headers or secret");
    return NextResponse.json({ error: "Unauthorized missing headers" }, { status: 401 });
  }

  const verifier = new Webhook(secret);

  try {
    await verifier.verify(payload, {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
    });
  } catch (e) {
    console.error("Invalid webhook signature", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let evt: WebhookPayload;
  try {
    evt = JSON.parse(payload) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Idempotency: skip if we've already processed this webhook-id
  const { data: existing, error: alreadyErr } = await supabaseAdmin
    .from("webhook_events")
    .select("id")
    .eq("webhook_id", webhookId)
    .maybeSingle();

  if (alreadyErr) {
    console.warn("Idempotency check failed:", alreadyErr.message);
  }
  if (existing) {
    console.log("Duplicate webhook detected; skipping.", webhookId);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Store the raw event for audit trail
  const { error: insertLogErr } = await supabaseAdmin.from("webhook_events").insert({
    webhook_id: webhookId,
    event_type: evt.type,
    payload: evt as unknown as Record<string, unknown>,
  });
  if (insertLogErr) {
    console.warn("Failed to log webhook event:", insertLogErr.message);
  }

  const STARTER_ID = process.env.NEXT_PUBLIC_DODO_STARTER_PLAN_ID;
  const AGENCY_ID = process.env.NEXT_PUBLIC_DODO_AGENCY_PLAN_ID;
  const ACADEMY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_ACADEMY_PRODUCT_ID;
  const SINGLE_AUDIT_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_SINGLE_AUDIT_PRODUCT_ID;

  const data = evt.data ?? {};
  const clerkUserId = data.metadata?.clerkUserId || data.metadata?.userId;

  if (!clerkUserId) {
    console.warn("Webhook missing metadata.clerkUserId / metadata.userId; nothing to update.");
    return NextResponse.json({ received: true });
  }

  const environment = process.env.NODE_ENV === "production" ? "live_mode" : "test_mode";

  async function resolvePlanOrProductId(): Promise<string | null> {
    // 1. Provjera direktnih ID polja
    if (data.product_id) return String(data.product_id);
    if (data.plan_id) return String(data.plan_id);
    if (data.product?.id) return String(data.product.id);
    if (data.plan?.product_id) return String(data.plan.product_id);

    // 2. 🚀 POPRAVLJENO: Izvlačenje iz Dodo product_cart niza za jednokratne uplate
    if (data.product_cart && data.product_cart.length > 0 && data.product_cart[0]?.product_id) {
      return String(data.product_cart[0].product_id);
    }

    // Fallback na sirovo mapiranje strukture
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
        console.warn("Subscription lookup failed; cannot resolve plan_id.", e);
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
      console.error("Supabase update failed:", dbError.message);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  // ===================================================================
  // 📘 OBRADA SIGNALA ZA PRETPLATE (Starter i Agency Planovi)
  // ===================================================================
  if (
    evt.type === "subscription.created" ||
    evt.type === "subscription.active" ||
    evt.type === "subscription.renewed" ||
    evt.type === "subscription.plan_changed"
  ) {
    const resolvedId = await resolvePlanOrProductId();
    if (!resolvedId) {
      console.warn("Unknown plan/product in event; skipping entitlement update.");
      return NextResponse.json({ received: true });
    }
    if (AGENCY_ID && resolvedId === AGENCY_ID) {
      return setPlan("AGENCY", 200);
    }
    if (STARTER_ID && resolvedId === STARTER_ID) {
      return setPlan("STARTER", 50);
    }
    console.warn("Resolved plan/product does not match known IDs; skipping:", resolvedId);
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
      console.error("Supabase update failed:", dbError.message);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  // ===================================================================
  // 🎓 OBRADA SIGNALA ZA JEDNOKRATNE UPLATE (Akademija i Single Audit)
  // ===================================================================
  if (evt.type === "payment.succeeded") {
    const resolvedId = await resolvePlanOrProductId();

    console.log(`[DODO WEBHOOK] Processing payment.succeeded. Resolved ID: ${resolvedId}`);

    // 1. Uplatila se Akademija ($10)
    if (ACADEMY_PRODUCT_ID && resolvedId === ACADEMY_PRODUCT_ID) {
      console.log(`Unlocking Academy Access for Clerk User: ${clerkUserId}`);
      
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .update({ 
          aeo_academy_paid: true,
          exam_attempts_used: 0, 
          exam_passed: false
        })
        .eq("id", clerkUserId);

      if (dbError) {
        console.error("Supabase Academy payment unlock failed:", dbError.message);
        return NextResponse.json({ error: "Database update failed for academy node" }, { status: 500 });
      }

      return NextResponse.json({ received: true, academy_unlocked: true });
    }

    // 2. 🚀 Uplatila se pojedinačna analiza ($5 Single Audit)
    if (SINGLE_AUDIT_PRODUCT_ID && resolvedId === SINGLE_AUDIT_PRODUCT_ID) {
      console.log(`Adding +1 Audit Credit for Clerk User: ${clerkUserId}`);

      const { data: user, error: fetchErr } = await supabaseAdmin
        .from("users")
        .select("audit_limit")
        .eq("id", clerkUserId)
        .maybeSingle();

      if (fetchErr || !user) {
        console.error("Supabase Single Audit fetch failed for user:", clerkUserId, fetchErr?.message);
        return NextResponse.json({ error: "User not found for credit increment" }, { status: 404 });
      }

      const currentLimit = Number(user.audit_limit) || 0;
      const newLimit = currentLimit + 1;

      const { error: updateErr } = await supabaseAdmin
        .from("users")
        .update({ audit_limit: newLimit })
        .eq("id", clerkUserId);

      if (updateErr) {
        console.error("Supabase Single Audit update failed:", updateErr.message);
        return NextResponse.json({ error: "Failed to increment audit_limit" }, { status: 500 });
      }

      console.log(`[SUCCESS] User ${clerkUserId} audit_limit updated from ${currentLimit} to ${newLimit}`);
      return NextResponse.json({ received: true, audit_credit_added: true, new_limit: newLimit });
    }

    console.warn(`[DODO WEBHOOK] ID Mismatch or unhandled one-time product layout. Resolved: ${resolvedId}`);
  }

  console.log(`Unhandled Dodo event type: ${evt.type}`);
  return NextResponse.json({ received: true, ignored: evt.type });
}