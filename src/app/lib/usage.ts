import { db } from "../lib/db"; // Prilagodi putanju do tvog db.ts fajla (kod tebe je u app/lib/db)

const FREE_LIMIT = 3; // Usklađeno sa biznis logikom od 3 audita dnevno

export async function checkAndIncrementUsage(userId: string) {
  // 1. Pronađi korisnika preko clerkUserId umjesto id
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // PRO / PREMIUM korisnici imaju neograničen pristup
  if (user.plan === "PREMIUM") {
    return { allowed: true };
  }

  const now = new Date();
  const today = new Date().setHours(0, 0, 0, 0);
  const lastAuditDate = new Date(user.lastAuditDate).setHours(0, 0, 0, 0);

  let currentAuditsCount = user.auditsCount;

  // 2. Reset brojača ako je počeo novi kalendarski dan
  if (today > lastAuditDate) {
    currentAuditsCount = 0;
    
    await db.user.update({
      where: { clerkUserId: userId },
      data: {
        auditsCount: 0,
        lastAuditDate: now,
      },
    });
  }

  // 3. Provjera limita za FREE korisnike
  if (currentAuditsCount >= FREE_LIMIT) {
    return { allowed: false };
  }

  // 4. Inkrementiraj broj iskorištenih audita u Neon bazi
  await db.user.update({
    where: { clerkUserId: userId },
    data: {
      auditsCount: { increment: 1 },
      lastAuditDate: now,
    },
  });

  return { allowed: true };
}