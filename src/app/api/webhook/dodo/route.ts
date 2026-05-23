import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("==================================================");
  console.log("🚨 WEBHOOK OKINUT: Stigao zahtjev sa Dodo Paymentsa!");
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL; 
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRole) {
      console.error("❌ KRIZNA GREŠKA: Nedostaju Supabase ključevi u okruženju!");
      return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
    
    const rawBody = await req.text();
    const signature = req.headers.get("x-dodo-signature");
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    console.log("🔒 Pokrećem ručnu verifikaciju Dodo Payments potpisa...");

    if (!signature || !webhookSecret) {
      console.error("❌ BEZBJEDNOSNA GREŠKA: Nedostaje x-dodo-signature ili DODO_WEBHOOK_SECRET!");
      return NextResponse.json({ error: "Unauthorized missing headers" }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const trusted = Buffer.from(expectedSignature, "ascii");
    const untrusted = Buffer.from(signature, "ascii");

    if (trusted.length !== untrusted.length || !crypto.timingSafeEqual(trusted, untrusted)) {
      console.error("❌ KRITIČNO: Verifikacija potpisa nije uspjela! Zahtjev je ODBIJEN.");
      return NextResponse.json({ error: "Invalid signature verification" }, { status: 401 });
    }

    console.log("✅ Potpis je VALIDAN! Paket je bezbjedan za obradu.");

    const body = JSON.parse(rawBody);
    const eventType = body.type;
    console.log("📦 Tip događaja (Event Type):", eventType);

    // OBRADA LOGIKE: Aktivacija (created) ILI Obnova (renewed)
    if (eventType === "subscription.created" || eventType === "subscription.renewed") {
      const data = body.data;
      const clerkUserId = data.metadata?.clerkUserId;
      const productId = data.product_id;

      console.log("👤 Korisnik iz metapodataka (clerkUserId):", clerkUserId);
      console.log("🆔 ID Proizvoda (productId):", productId);

      if (!clerkUserId) {
        console.error("❌ GREŠKA: Dodo Payments nije poslao clerkUserId unutar metadata paketa!");
        return NextResponse.json({ error: "No metadata client ID" }, { status: 400 });
      }

      let planName = "STARTER";
      let auditLimit = 50;

      if (productId === process.env.NEXT_PUBLIC_DODO_AGENCY_PLAN_ID) {
        planName = "AGENCY";
        auditLimit = 200;
      }
      
      console.log(`🔄 Izvršavam UPDATE u Supabase za ID: ${clerkUserId} na plan ${planName}...`);

      // ⚠️ Proveri da li su kolone u tvojoj bazi "plan", "limit", "used" ili "audit_limit", "used_audits"
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .update({
          plan: planName,
          audit_limit: auditLimit, // Promijeni u "limit" ako ti se kolona tako zove
          used_audits: 0           // Promijeni u "used" ako ti se kolona tako zove
        })
        .eq("id", clerkUserId);    // Promijeni u "user_id" ako preko toga mapiraš Clerk unose

      if (dbError) {
        console.error("❌ SUPABASE JE ODBIO UPIS! Detalji greške:", dbError.message);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
      
      console.log(`✅ USPIJEH! Korisnik ${clerkUserId} je uspješno nadograđen na ${planName}!`);
    } 
    
    // OBRADA LOGIKE: Otkazano ili suspendovano
    else if (eventType === "subscription.cancelled" || eventType === "subscription.on_hold") {
      const data = body.data;
      const clerkUserId = data.metadata?.clerkUserId;

      console.log(`⚠️ Pretplata suspendovana. Tip: ${eventType} za korisnika: ${clerkUserId}`);

      if (clerkUserId) {
        await supabaseAdmin
          .from("users")
          .update({ 
            plan: "FREE", 
            audit_limit: 1, // Vraća na free limit od 1 audit
            used_audits: 0
          })
          .eq("id", clerkUserId);
        console.log(`✅ Korisniku ${clerkUserId} su uspješno zamrznuti limiti.`);
      }
    } 
    
    else {
      console.log(`ℹ️ Događaj '${eventType}' primljen, ali trenutno nema definisanu akciju.`);
    }

    console.log("==================================================");
    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("💥 TOTALNI KRAŠ WEBHOOKA:", errorMessage);
    console.log("==================================================");
    return NextResponse.json({ error: "Webhook failed internal" }, { status: 500 });
  }
}