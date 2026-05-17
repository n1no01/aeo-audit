export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    // Sakrivamo bazu od Next.js build procesa
    const { db } = await import("../../lib/db");

    // Tvoj postojeći kod za provjeru Clerk webhooka (Webhook secret, headers...)
    // ...
    
    // Unutar dijela koda gdje kreiraš korisnika u bazi nakon uspješne verifikacije:
    /*
    await db.user.create({
      data: {
        clerkUserId: userId,
        email: email,
        plan: "FREE",
        auditsCount: 0,
      }
    });
    */

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in webhook:", error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}