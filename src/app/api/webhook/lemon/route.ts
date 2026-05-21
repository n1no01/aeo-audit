import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const PLAN_CONFIG = {
  '1681365': { name: 'STARTER', limit: 50 },
  '1681413': { name: 'AGENCY PRO', limit: 200 },
};

export async function POST(req: Request) {
  try {
    // 💡 KORISTI SERVICE_ROLE_KEY: Webhook dolazi izvana i mora zaobići RLS da bi ažurirao bazu!
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Promijenjeno sa ANON na SERVICE_ROLE
    );

    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');

    if (signature !== digest) {
      console.error('❌ Webhook sigurnosna provjera neuspješna! Potpisi se ne poklapaju.');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const data = JSON.parse(rawBody);
    const eventName = data.meta.event_name;
    const customData = data.meta.custom_data || {};
    const userId = customData.user_id; 

    if (!userId) {
      console.error('❌ Webhook primljen, ali nedostaje user_id u custom_data.');
      return new NextResponse('Missing user_id', { status: 400 });
    }

    console.log(`🔔 Primljen Lemon Squeezy Webhook: ${eventName} za korisnika ${userId}`);

    const attributes = data.data.attributes;
    const variantId = String(attributes.variant_id);
    const status = attributes.status; // active, cancelled, expired, unpaused, past_due

    // ------------------------------------------------------------------------
    // SLUČAJ A: Korisnik je kupio, obnovio, ili uradio Upgrade/Downgrade
    // ------------------------------------------------------------------------
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      
      // Korisnik je platio i pretplata je u redu (ili je otkazao ali plaćeni period još traje)
      if (status === 'active' || status === 'cancelled') {
        const selectedPlan = PLAN_CONFIG[variantId as keyof typeof PLAN_CONFIG];

        if (selectedPlan) {
          // Izvlačimo tačan datum kada se plaćeni ciklus završava (Lemon Squeezy šalje ISO string)
          const currentPeriodEnd = attributes.renews_at || attributes.ends_at;

          const { error } = await supabase
            .from('users') 
            .update({ 
              plan: selectedPlan.name,          // "STARTER" ili "AGENCY PRO"
              audit_limit: selectedPlan.limit,  // Fiksni mjesečni limit (50 ili 200)
              // Ovdje možeš dodati i: ends_at: currentPeriodEnd (ako želiš pratiti rok u bazi)
            })
            .eq('id', userId); 

          if (error) {
            console.error('❌ Greška prilikom ažuriranja baze u Supabase:', error);
            throw error;
          }
          console.log(`🚀 Korisnik ${userId} uspješno postavljen na plan: ${selectedPlan.name} (Status: ${status})`);
        } else {
          console.error(`⚠️ Primljen nepoznat Variant ID: ${variantId}. Provjeri PLAN_CONFIG.`);
        }
      }
      
      // Pod-slučaj: Kartica je odbijena, privremeno suspenduj prava dok ne prođe naplata
      if (status === 'past_due') {
        await supabase
          .from('users')
          .update({ plan: 'PAST_DUE', audit_limit: 0 })
          .eq('id', userId);
        console.log(`⚠️ Pretplata za ${userId} je PAST_DUE (kartica odbijena). Pristup blokiran.`);
      }
    }

    // ------------------------------------------------------------------------
    // SLUČAJ B: Pretplata je ZVANIČNO ISTEKLA (Kraj plaćenog perioda ili propale naplate)
    // ------------------------------------------------------------------------
    if (eventName === 'subscription_expired') {
      const { error } = await supabase
        .from('users')
        .update({ 
          plan: 'FREE',       // Tek sada ga stvarno vraćamo na besplatni paket
          audit_limit: 1,     // Tvoj podrazumijevani besplatni limit
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Greška prilikom vraćanja korisnika na FREE plan:', error);
        throw error;
      }
      console.log(`ℹ️ Pretplata zvanično ISTEKLA. Korisnik ${userId} je vraćen na FREE plan.`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });
  } catch (error) {
    console.error('❌ Greška unutar webhook rute:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}