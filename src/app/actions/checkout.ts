"use server";

import DodoPayments from "dodopayments";

const ACADEMY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_ACADEMY_PRODUCT_ID || "pdt_0NipGjvEpOXk5b2pkxaVt";
const SINGLE_AUDIT_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_SINGLE_AUDIT_PRODUCT_ID;

export async function getDodoCheckoutUrl(
  productId: string,
  clerkUserId: string,
  email: string
): Promise<string | null> {
  console.log(`Creating Dodo checkout for product=${productId}, user=${clerkUserId}`);

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    console.error("Missing DODO_PAYMENTS_API_KEY");
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const environment = process.env.NODE_ENV === "production" ? "live_mode" : "test_mode";

  // 🚀 Dinamička putanja povratka ovisno o proizvodu
  let returnUrl = `${appUrl}/dashboard?payment=success`;

  if (productId === ACADEMY_PRODUCT_ID) {
    returnUrl = `${appUrl}/academy?payment=success`;
  } else if (SINGLE_AUDIT_PRODUCT_ID && productId === SINGLE_AUDIT_PRODUCT_ID) {
    returnUrl = `${appUrl}/dashboard?audit_credit_added=true&status=succeeded`;
  }

  try {
    const client = new DodoPayments({
      bearerToken: apiKey,
      environment,
    });

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email },
      metadata: { clerkUserId: String(clerkUserId) },
      return_url: returnUrl,
    });

    const checkoutUrl = (session as { checkout_url?: string }).checkout_url ?? null;
    if (!checkoutUrl) {
      console.error("Dodo checkoutSessions.create returned no checkout_url", session);
      return null;
    }
    return checkoutUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Dodo Checkout Error:", message);
    return null;
  }
}