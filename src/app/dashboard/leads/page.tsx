"use client";

import { useEffect, useState } from "react";
import { getAgencyLeads } from "@/app/actions"; // Podesi import putanju prema tvom projektu
import WidgetEmbedCard from "@/app/components/dashboard/WidgetEmbedCard"; // Uvozi novu komponentu za widget

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

  useEffect(() => {
    async function loadLeads() {
      const res = await getAgencyLeads();
      if (res.success && res.leads) {
        setLeads(res.leads);
      }
      setLoading(false);
    }
    loadLeads();
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
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      
      {/* 1. SEKOVIJA S EMBED KODOM I PREVIEW-OM WIDGETA */}
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

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
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
                    <th className="p-4 text-right">Action</th>
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
                      <td className="p-4 text-right">
                        <a
                          href={`/dashboard?url=${encodeURIComponent(lead.website_url)}`}
                          className="inline-block px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition-colors text-[11px]"
                        >
                          Run Full Audit →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}