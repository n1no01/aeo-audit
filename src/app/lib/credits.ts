import { supabase } from "./supabase";

export interface CreditReservation {
  ok: boolean;
  plan: string;
  limit: number;
  used: number;
  /** true when the atomic RPC is missing and the legacy (racy) path was used */
  legacy?: boolean;
}

/**
 * Atomically reserves ONE audit credit BEFORE the expensive work starts.
 * Previously the quota was checked first and incremented last, so N parallel requests all passed the check
 * (unlimited free audits) and a failed audit still burned a credit.
 *
 * Requires the `reserve_audit_credit` RPC from supabase/migrations/001_audit_hardening.sql.
 */
export async function reserveAuditCredit(userId: string): Promise<CreditReservation | null> {
  const { data, error } = await supabase.rpc("reserve_audit_credit", { p_user_id: userId });

  if (!error && Array.isArray(data) && data[0]) {
    const r = data[0] as { ok: boolean; plan: string; audit_limit: number; used_audits: number };
    return { ok: r.ok, plan: r.plan, limit: r.audit_limit, used: r.used_audits };
  }

  if (error) console.error("[credits] reserve_audit_credit failed, using legacy path:", error.message);

  // Legacy fallback (not atomic) so the app keeps working before the migration is applied.
  const { data: u } = await supabase.from("users").select("plan, audit_limit, used_audits").eq("id", userId).maybeSingle();
  if (!u) return null;
  const used = u.used_audits || 0;
  if (used >= u.audit_limit) return { ok: false, plan: u.plan, limit: u.audit_limit, used, legacy: true };

  const { error: upErr } = await supabase.from("users").update({ used_audits: used + 1 }).eq("id", userId).eq("used_audits", used);
  if (upErr) return null;
  return { ok: true, plan: u.plan, limit: u.audit_limit, used: used + 1, legacy: true };
}

/** Gives the credit back when the audit failed after it was reserved. Never throws. */
export async function refundAuditCredit(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("refund_audit_credit", { p_user_id: userId });
    if (!error) return;

    const { data: u } = await supabase.from("users").select("used_audits").eq("id", userId).maybeSingle();
    if (u && (u.used_audits || 0) > 0) {
      await supabase.from("users").update({ used_audits: u.used_audits - 1 }).eq("id", userId).eq("used_audits", u.used_audits);
    }
  } catch (e) {
    console.error("[credits] refund failed:", e);
  }
}

/** Atomically reserves one AI Radar credit. Returns false when the plan/limit does not allow it. */
export async function reserveRadarCredit(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("reserve_radar_credit", { p_user_id: userId });
  if (!error) return Boolean(Array.isArray(data) ? data[0]?.ok ?? data[0] : data);

  console.error("[credits] reserve_radar_credit failed, using legacy path:", error.message);
  const { data: u } = await supabase.from("users").select("plan, radar_used, radar_limit").eq("id", userId).maybeSingle();
  if (!u || u.plan === "FREE") return false;
  const limit = u.radar_limit ?? (u.plan === "STARTER" ? 100 : 500);
  const used = u.radar_used || 0;
  if (used >= limit) return false;
  const { error: upErr } = await supabase.from("users").update({ radar_used: used + 1 }).eq("id", userId).eq("radar_used", used);
  return !upErr;
}

export async function refundRadarCredit(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("refund_radar_credit", { p_user_id: userId });
    if (error) {
      const { data: u } = await supabase.from("users").select("radar_used").eq("id", userId).maybeSingle();
      if (u && (u.radar_used || 0) > 0) await supabase.from("users").update({ radar_used: u.radar_used - 1 }).eq("id", userId);
    }
  } catch (e) {
    console.error("[credits] radar refund failed:", e);
  }
}
