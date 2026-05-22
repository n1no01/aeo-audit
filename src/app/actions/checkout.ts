"use server";

export async function getDodoCheckoutUrl(productId: string, clerkUserId: string, email: string) {
  try {
    console.log(`Creating session for product: ${productId}, user: ${clerkUserId}, email: ${email}`);

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      throw new Error("Missing DODO_PAYMENTS_API_KEY inside environment variables.");
    }

    const response = await fetch("https://testapi.dodopayments.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: 1,
        customer_email: email,
        metadata: {
          clerkUserId: clerkUserId,
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Dodo API Error Response:", errorData);
      throw new Error(`Dodo API responded with status ${response.status}`);
    }

    const session = await response.json();

    if (!session.checkout_url) {
      throw new Error("Dodo API did not return a checkout_url");
    }

    return session.checkout_url as string;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Dodo Checkout Error:", errorMessage);
    return null;
  }
}