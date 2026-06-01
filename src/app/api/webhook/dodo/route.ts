import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

export const dynamic = "force-dynamic";

// 🛡️ REŠEN PROBLEM SA ANY: Koristimo duboko mapirani unknown tip za maksimalnu bezbednost
type WebhookPayload = {
  type: string;
  data: {
    product_id?: string;
    plan_id?: string;
    subscription_id?: string;
    product?: { id?: string };
    plan?: { product_id?: string };
    metadata?: {
      clerkUserId?: string;
    };
    [key: string]: unknown; // Zamena za any
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

  const data = evt.data ?? {};
  const clerkUserId = data.metadata?.clerkUserId;

  if (!clerkUserId) {
    console.warn("Webhook missing metadata.clerkUserId; nothing to update.");
    return NextResponse.json({ received: true });
  }

  const environment = process.env.NODE_ENV === "production" ? "live_mode" : "test_mode";

  async function resolvePlanOrProductId(): Promise<string | null> {
    const direct =
      data.product_id ||
      data.plan_id ||
      data.product?.id ||
      data.plan?.product_id ||
      null;
    if (direct) return String(direct);

    if (data.subscription_id && process.env.DODO_PAYMENTS_API_KEY) {
      try {
        const client = new DodoPayments({
          bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
          environment,
        });
        const sub = await client.subscriptions.retrieve(String(data.subscription_id));
        
        // Bezbedno čitanje iz SDK odgovora bez korišćenja 'any' keywords-a
        // ✅ POPRAVLJENI KOD (Prvo kroz unknown, pa u Record):
        const planId = (sub as unknown as Record<string, unknown>)["plan_id"] as string | undefined;
        if (planId) return planId;
      } catch (e) {
        console.warn("Subscription lookup failed; cannot resolve plan_id.", e);
      }
    }
    return null;
  }

  async function setPlan(plan: "STARTER" | "AGENCY", limit: number) {
    // 🔄 KORISNIK JE PLATIO / OBNOVIO PRETPLATU: Resetujemo used_audits i radar_used na nulu

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

  // Usklađeno sa zvaničnim Dodo eventima (Dodat i created i active za svaki slučaj)
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
    // 🔄 KORISNIK OTKAZAO PRETPLATU: Vraćamo ga na FREE plan i resetujemo sve kredite
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

  console.log(`Unhandled Dodo event type: ${evt.type}`);
  return NextResponse.json({ received: true, ignored: evt.type });
}