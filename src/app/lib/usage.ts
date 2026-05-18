import { db } from "../lib/db";

// Definisanje limita za svaki plan na mjesečnom nivou
const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  STARTER: 50,
  PRO: 200,
};

export async function checkAndIncrementUsage(userId: string) {
  // 1. Povuci korisnika (samo neophodna polja)
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      plan: true, // Npr: "FREE", "STARTER", "PRO"
      auditsCount: true,
      lastAuditDate: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Izvlačenje limita za korisnikov plan (fallback je FREE ako plan nije prepoznat)
  const userPlan = user.plan?.toUpperCase() || "FREE";
  const allowedLimit = PLAN_LIMITS[userPlan] ?? PLAN_LIMITS.FREE;

  const now = new Date();
  let currentAuditsCount = user.auditsCount;

  // 2. PROVJERA MJESEČNOG RESETA (Gleda se kalendarski mjesec i godina)
  const lastAudit = user.lastAuditDate ? new Date(user.lastAuditDate) : null;
  
  const isNewMonth = 
    !lastAudit || 
    now.getMonth() !== lastAudit.getMonth() || 
    now.getFullYear() !== lastAudit.getFullYear();

  if (isNewMonth) {
    currentAuditsCount = 0;
  }

  // 3. Provjera limita za specifičan plan korisnika
  if (currentAuditsCount >= allowedLimit) {
    return { allowed: false };
  }

  // 4. ATOMSKA OPERACIJA: Jedan upit prema Neon bazi za reset ILI inkrement
  await db.user.update({
    where: { clerkUserId: userId },
    data: {
      auditsCount: isNewMonth ? 1 : { increment: 1 },
      lastAuditDate: now,
    },
  });

  return { allowed: true };
}