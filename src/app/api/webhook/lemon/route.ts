import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Mapiranje Lemon Squeezy Variant ID-eva na tvoje planove i tačne limite
const PLAN_CONFIG = {
  '1681365': { name: 'STARTER', limit: 50 },
  '1681413': { name: 'AGENCY PRO', limit: 200 },
};

export async function POST(req: Request) {
  try {
    // 💡 Inicijalizacija unutar funkcije pomoću ANON ključa - sprječava pucanje Vercel build-a!
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // 1. Pokupi sirovi tekst (raw body) i potpis iz Lemon Squeezy zahtjeva
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

    // 2. Sigurnosna provjera: Generiši naš potpis pomoću secreta i uporedi ga sa njihovim
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');

    if (signature !== digest) {
      console.error('❌ Webhook sigurnosna provjera neuspješna! Potpisi se ne poklapaju.');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // 3. Parsiranje podataka i izvlačenje Clerk userId-ja
    const data = JSON.parse(rawBody);
    const eventName = data.meta.event_name;
    const customData = data.meta.custom_data || {};
    const userId = customData.user_id; 

    if (!userId) {
      console.error('❌ Webhook primljen, ali nedostaje user_id u custom_data.');
      return new NextResponse('Missing user_id', { status: 400 });
    }

    console.log(`🔔 Primljen Lemon Squeezy Webhook: ${eventName} za korisnika ${userId}`);

    // 4. Obrada događaja
    
    // SLUČAJ A: Korisnik je kupio ili obnovio pretplatu
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const variantId = String(data.data.attributes.variant_id);
      const status = data.data.attributes.status; // npr. "active"

      if (status === 'active') {
        const selectedPlan = PLAN_CONFIG[variantId as keyof typeof PLAN_CONFIG];

        if (selectedPlan) {
          // Ažuriranje tvoje 'users' tabele uz usklađeno ime kolone (audit_limit)
          const { error } = await supabase
            .from('users') 
            .update({ 
              plan: selectedPlan.name,          // Upisuje "STARTER" ili "AGENCY PRO"
              audit_limit: selectedPlan.limit, // Postavlja fiksno na 50 ili 200
            })
            .eq('id', userId); 

          if (error) {
            console.error('❌ Greška prilikom ažuriranja baze u Supabase:', error);
            throw error;
          }
          console.log(`🚀 Korisnik ${userId} uspješno prebačen na plan: ${selectedPlan.name} (Limit: ${selectedPlan.limit})`);
        } else {
          console.error(`⚠️ Primljen nepoznat Variant ID: ${variantId}. Provjeri PLAN_CONFIG.`);
        }
      }
    }

    // SLUČAJ B: Korisnik je otkazao pretplatu ili mu je istekla
    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      const { error } = await supabase
        .from('users')
        .update({ 
          plan: 'FREE',        // Vraćamo naziv plana na FREE
          audit_limit: 1,     // Tvoj podrazumijevani besplatni limit
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Greška prilikom vraćanja korisnika na FREE plan:', error);
        throw error;
      }
      console.log(`ℹ️ Pretplata prekinuta. Korisnik ${userId} je vraćen na FREE plan.`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });
  } catch (error) {
    console.error('❌ Greška unutar webhook rute:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}