import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 🔥 BITNO: clerkClient je async
  const client = await clerkClient();

  const user = await client.users.getUser(userId);

  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    return new Response("No email", { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        id: userId,
        email,
        plan: "free",
        usage: 0,
      },
    });
  }

  return Response.json({ success: true });
}