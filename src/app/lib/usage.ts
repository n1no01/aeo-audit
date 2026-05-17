import { prisma } from "./prisma";

const FREE_LIMIT = 5;

export async function checkAndIncrementUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const now = new Date();

  // reset ako je novi dan (24h window)
  const lastReset = user.lastReset;

  const shouldReset =
    !lastReset || now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000;

  if (shouldReset) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        usage: 0,
        lastReset: now,
      },
    });

    user.usage = 0;
  }

  // PRO user = unlimited (kasnije Stripe)
  if (user.plan !== "free") {
    return { allowed: true };
  }

  // FREE LIMIT CHECK
  if (user.usage >= FREE_LIMIT) {
    return { allowed: false };
  }

  // increment usage
  await prisma.user.update({
    where: { id: userId },
    data: {
      usage: { increment: 1 },
    },
  });

  return { allowed: true };
}