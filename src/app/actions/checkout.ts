"use server";

export async function getDodoCheckoutUrl(productId: string, clerkUserId: string, email: string) {
  try {
    console.log(`Creating session for product: ${productId}, user: ${clerkUserId}, email: ${email}`);

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      throw new Error("Missing DODO_PAYMENTS_API_KEY inside environment variables.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 🚨 FIX: Dodo Payments traži ugniježđeni customer objekat i ispravne nazive polja
    const response = await fetch("https://testapi.dodopayments.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: 1,
        customer: {
          email: email, // ✅ Ispravljeno: customer_email prebačen u customer.email objekat
        },
        metadata: {
          clerkUserId: String(clerkUserId), // Osiguravamo da je čisti string
        },
        return_url: `${appUrl}/dashboard`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Dodo API Error Response:", errorData);
      throw new Error(`Dodo API responded with status ${response.status}: ${errorData}`);
    }

    const session = await response.json();

    // Dodo može vratiti 'url' ili 'checkout_url', hvatamo oba radi sigurnosti
    const finalUrl = session.checkout_url || session.url;

    if (!finalUrl) {
      console.error("Full Dodo response payload:", session);
      throw new Error("Dodo API did not return a checkout_url or url");
    }

    return finalUrl as string;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Dodo Checkout Error:", errorMessage);
    return null;
  }
}