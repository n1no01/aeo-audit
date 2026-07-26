"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAgencyLeads, getUserStats } from "@/app/actions"; 
import WidgetEmbedCard from "@/app/components/dashboard/WidgetEmbedCard"; 
import Navbar from "@/app/components/Navbar";

interface Lead {
  id: number;
  lead_email: string;
  website_url: string;
  score: number;
  created_at: string;
}

export default function AgencyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFreeUser, setIsFreeUser] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const statsRes = await getUserStats();
        if (statsRes && statsRes.plan) {
          setIsFreeUser(statsRes.plan === "FREE");
        } else {
          setIsFreeUser(true);
        }

        if (statsRes?.plan !== "FREE") {
          const leadsRes = await getAgencyLeads();
          if (leadsRes && leadsRes.success && leadsRes.leads) {
            setLeads(leadsRes.leads);
          }
        }
      } catch (err) {
        console.error("Error loading leads page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = "ID,Email,Website URL,Score,Date\n";
    const rows = leads
      .map(
        (l) =>
          `${l.id},"${l.lead_email}","${l.website_url}",${l.score},"${new Date(l.created_at).toLocaleDateString()}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aeo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    // 🚀 Uklonjen min-h-screen i zamijenjen prilagođenom pozadinom
    <div className="bg-slate-50/50 pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* SKELETON LOADER DOK PROVJERAVAMO PLAN */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm animate-pulse space-y-6 my-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            <div className="h-48 bg-slate-100 rounded-2xl"></div>
          </div>
        ) : isFreeUser ? (

          /* 🔒 PAYWALL UPGRADE BANNER ZA BESPLATNE KORISNIKE */
          // 🚀 Zamijenjen my-12 sa my-4 i smanjeni unutarnji padding-i da stane u jedan ekran bez skrola
          <div className="bg-white border border-slate-200/80 rounded-[28px] sm:rounded-[32px] p-6 sm:p-10 shadow-xl shadow-blue-900/5 text-center max-w-3xl mx-auto my-4">

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Turn Your Website Into an AEO Lead Generation Machine
            </h2>

            <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
              Embed our instant AEO readiness scanner on your agency site or blog. Capture high-intent B2B prospective clients, generate full reports, and view leads in real-time.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                Upgrade to Unlock Lead Magnet →
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-800">⚡ Instant Embedding</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Paste 1-line JS snippet into Webflow, WordPress or HTML.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-800">📊 Automatic Scoring</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Prospects get real-time scores right on your site.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-800">📥 CSV Lead Export</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Download all captured client emails & domains anytime.</p>
              </div>
            </div>
          </div>

        ) : (

          /* 🔓 FUNKCIONALNI SADRŽAJ ZA PLAĆENE KORISNIKE */
          <>
            {/* 1. EMBED WIDGET KARTICA */}
            <WidgetEmbedCard />

            {/* 2. TABELA S PRIKUPLJENIM LEADOVIMA */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Captured AEO Leads</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Leads generated in real-time through your embedded widget.
                  </p>
                </div>
                <button
                  onClick={exportToCSV}
                  disabled={leads.length === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Export CSV 📥
                </button>
              </div>

              {leads.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <p className="text-slate-500 text-sm font-medium">No leads captured yet.</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Embed the widget above on your website to start capturing potential clients!
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Date</th>
                          <th className="p-4">Target Website</th>
                          <th className="p-4">Lead Email</th>
                          <th className="p-4">AEO Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 text-slate-400">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 font-bold text-slate-800">{lead.website_url}</td>
                            <td className="p-4 text-slate-600">{lead.lead_email}</td>
                            <td className="p-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black ${
                                  lead.score >= 70
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : lead.score >= 40
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {lead.score}/100
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}