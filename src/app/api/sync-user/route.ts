export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    // Dinamički import baze tek kada se funkcija stvarno izvrši uživo
    const { db } = await import("../../lib/db"); 

    const body = await req.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Tvoja logika za bazu...
    const user = await db.user.upsert({
      where: { clerkUserId: userId },
      update: { email },
      create: {
        clerkUserId: userId,
        email,
        plan: "FREE",
        auditsCount: 0,
      },
    });

    return new Response(JSON.stringify({ success: true, user }), { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in sync-user:", error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}