"use server";

import DodoPayments from "dodopayments";

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // Kada kreneš uživo, promijeni u 'live_mode'
});

export async function getDodoCheckoutUrl(productId: string, userId: string, email: string) {
  try {
    const session = await client.checkoutSessions.create({
      product_cart: [
        { 
          product_id: productId, 
          quantity: 1 
        }
      ],
      customer: {
        email: email,
      },
      metadata: {
        clerkUserId: userId, // Poveznica koju će naš webhook pročitati
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    });

    // Zvanično polje iz API-ja je checkout_url
    return session.checkout_url; 
  } catch (error) {
    console.error("Dodo Payments Error:", error);
    return null;
  }
}