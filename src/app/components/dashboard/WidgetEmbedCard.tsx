"use client";

import { useState, useEffect } from "react";
import { getOrCreateApiKey } from "../../actions";

export default function WidgetEmbedCard() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const getCleanDomain = () => {
    let domain = process.env.NEXT_PUBLIC_APP_URL || "";
    
    if (typeof window !== "undefined" && !domain) {
      domain = window.location.origin;
    }
    if (!domain) {
      domain = "https://aeoaudit-pro.com";
    }

    return domain
      .replace("www.", "")
      .split(" ")[0]
      .replace(/"/g, "")
      .replace(/'/g, "")
      .replace(/\/$/, "")
      .trim();
  };

  const [appUrl] = useState<string>(getCleanDomain);

  useEffect(() => {
    async function loadKey() {
      try {
        const res = await getOrCreateApiKey();
        if (res && "apiKey" in res && res.apiKey) {
          setApiKey(res.apiKey);
        }
      } catch (err) {
        console.error("Error loading API key:", err);
      } finally {
        setLoading(false);
      }
    }
    loadKey();
  }, []);

  const embedCode = `<div id="aeo-audit-widget"></div>
<script>
(function() {
  const API_KEY = "${apiKey || "YOUR_API_KEY"}";
  const API_URL = "${appUrl}/api/widget";
  const container = document.getElementById("aeo-audit-widget");
  if (!container) return;

  container.innerHTML = \`
    <div style="max-width:420px; padding:24px; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; font-family:sans-serif; box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
      <h3 style="margin:0 0 6px 0; font-size:18px; color:#0f172a; font-weight:800;">Check Your AEO Score</h3>
      <p style="margin:0 0 16px 0; font-size:12px; color:#64748b;">Instant AI Search Engine Optimization readiness check.</p>

      <form id="aeo-widget-form" style="display:flex; flex-direction:column; gap:10px;">
        <input type="url" id="aeo-url" placeholder="https://yourwebsite.com" required style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px;" />
        <input type="email" id="aeo-email" placeholder="your@email.com" required style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px;" />
        <button type="submit" id="aeo-btn" style="padding:10px; background:#2563eb; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">Get Your Free Score →</button>
      </form>

      <div id="aeo-result" style="margin-top:16px; display:none;"></div>

      <p style="margin-top:14px; font-size:10px; color:#94a3b8; text-align:center;">
        Powered by <a href="${appUrl}" rel="nofollow" target="_blank" style="color:#2563eb; text-decoration:none; font-weight:bold;">AEO Audit Pro</a>
      </p>
    </div>
  \`;

  document.getElementById("aeo-widget-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("aeo-btn");
    const resultDiv = document.getElementById("aeo-result");
    btn.innerText = "Analyzing Website...";
    btn.disabled = true;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: document.getElementById("aeo-url").value,
          leadEmail: document.getElementById("aeo-email").value,
          apiKey: API_KEY
        })
      });

      const data = await res.json();
      if(data.success) {
        const isGood = data.score >= 85;
        const statusText = isGood ? "High Recommendation Odds" : "Needs AEO Optimization";
        const statusColor = isGood ? "#16a34a" : "#dc2626";

        resultDiv.style.display = "block";
        resultDiv.innerHTML = \`
          <div style="padding:14px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:10px; color:#64748b; font-weight:bold; text-transform:uppercase;">Overall AEO Score</div>
              <div style="font-size:28px; font-weight:900; color:\${statusColor};">\${data.score}/100</div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:11px; font-weight:bold; color:\${statusColor}; background:\${isGood ? '#f0fdf4' : '#fef2f2'}; padding:6px 10px; border-radius:8px; border:1px solid \${isGood ? '#bbf7d0' : '#fecaca'};">
                \${statusText}
              </span>
            </div>
          </div>
        \`;
      } else {
        alert(data.error || "Scan failed.");
      }
    } catch(err) {
      console.error(err);
      alert("Error connecting to AEO Audit engine.");
    } finally {
      btn.innerText = "Get Your Free Score →";
      btn.disabled = false;
    }
  });
})();
</script>`;

  const handleCopy = () => {
    if (loading || !apiKey) return;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-xl shadow-blue-900/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            🚀 Lead Generation Widget
          </div>
          <h3 className="text-xl font-black text-slate-900">Embed AEO Audit Pro on Your Website</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Capture prospective B2B clients by embedding a free instant AEO scanner on your agency site or blog.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KOD KUTIJA */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900 rounded-2xl p-4 border border-slate-800 min-h-[260px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Embed Code (Snippet)
            </span>
            <button
              onClick={handleCopy}
              disabled={loading || !apiKey}
              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {loading ? "Generating Key..." : copied ? "Copied to Clipboard! ✓" : "Copy Code"}
            </button>
          </div>

          {loading ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 animate-pulse my-auto">
              <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-800 rounded w-2/3"></div>
            </div>
          ) : (
            <pre className="text-[11px] font-mono text-blue-400 overflow-x-auto max-h-[220px] whitespace-pre-wrap leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {embedCode}
            </pre>
          )}

          <p className="text-[10px] text-slate-500 mt-2">
            💡 Simply paste this snippet anywhere inside your WordPress, Webflow, or custom HTML page.
          </p>
        </div>

        {/* PREVIEW WIDGETA */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Widget Live Preview
          </span>
          <div className="w-full max-w-[340px] bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left font-sans">
            <h4 className="text-sm font-extrabold text-slate-900">Check Your AEO Score</h4>
            <p className="text-[11px] text-slate-500 mb-3 mt-0.5">Instant AI Search Engine Optimization readiness check.</p>
            <div className="space-y-2 opacity-70 pointer-events-none">
              <div className="p-2 border border-slate-200 rounded-lg text-xs text-slate-400">https://yourwebsite.com</div>
              <div className="p-2 border border-slate-200 rounded-lg text-xs text-slate-400">your@email.com</div>
              <div className="p-2 bg-blue-600 text-white rounded-lg text-xs font-bold text-center">Get Your Free Score →</div>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-3">
              Powered by <span className="font-bold text-blue-600">AEO Audit Pro</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}