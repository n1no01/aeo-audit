import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 

export async function POST(req: Request) {
  const { db } = await import("@/app/lib/db");
  // 1. Pokupi Webhook Secret iz .env.local fajla
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response('Error: Please add WEBHOOK_SECRET from Clerk Dashboard to .env.local', {
      status: 500,
    })
  }

  // 2. Pokupi Svix headere za verifikaciju potpisa
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // 3. Pokupi body sadržaj paketa
  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  // 4. Bezbjednosna provjera (Verifikacija potpisa)
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  // 5. Ako je korisnik uspješno kreiran na Clerku, upiši ga u Neon bazu
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data
    const primaryEmail = email_addresses[0]?.email_address

    if (!id || !primaryEmail) {
      return new Response('Error: Missing user fields', { status: 400 })
    }

    try {
      // UPIS U TVOJU NOVU TABELU (Primjer za Prismu)
      await db.user.create({
        data: {
          clerkUserId: id,
          email: primaryEmail,
          plan: 'FREE',        // Automatski free tier pri registraciji
          auditsCount: 0,      // Startuje sa 0 iskorištenih kredita
        },
      })
      
      console.log(`Korisnik ${primaryEmail} je uspješno upisan u Neon bazu!`)
    } catch (error) {
      console.error('Greška pri upisu u Neon bazu:', error)
      return new Response('Database error', { status: 500 })
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}