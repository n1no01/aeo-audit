import { supabase } from "../../lib/supabase"; 
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const dynamic = "force-dynamic";



interface VerifyPageProps {
  params: Promise<{
    token: string;
  }>;
}


export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const token = decodeURIComponent(resolvedParams.token);

  // Povlačimo ime korisnika da bismo ga personalizovali u LinkedIn objavi
  const { data: user } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", token)
    .maybeSingle();

  const name = user?.full_name ? user.full_name : "Specialist";

  return {
    title: `AEO Technical Specialist Certification - ${name}`,
    description: "Verified credential reinforcing edge architectures, structured JSON-LD data graphs, and LLM parsing optimization protocols.",
    openGraph: {
      title: `🏆 Certified AEO Technical Specialist — ${name}`,
      description: "Successfully cleared all advanced server architecture tests, DOM structural validation routines, and real-time RAG context evaluations.",
      url: `https://www.aeoaudit-pro.com/verify/${token}`,
      siteName: "AEO Audit Pro Academy",
      images: [
        {
          url: "https://www.aeoaudit-pro.com/logo.png", // Puna putanja do tvog produkcijskog logotipa
          width: 1200,
          height: 630,
          alt: "AEO Audit Pro Certification Seal",
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `AEO Technical Specialist Certification — ${name}`,
      description: "Verified pipeline optimization credential for Large Language Models.",
      images: ["https://www.aeoaudit-pro.com/logo.png"],
    },
  };
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const resolvedParams = await params;
  const token = decodeURIComponent(resolvedParams.token);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white border border-slate-200 p-8 rounded-3xl max-w-md shadow-sm">
          <span className="text-3xl">⚠️</span>
          <h1 className="text-lg font-black text-slate-900 mt-2">Invalid Format</h1>
          <p className="text-slate-500 text-xs mt-1">The provided identifier cannot be empty.</p>
        </div>
      </div>
    );
  }

  // Povlačimo email, full_name, cert_issued_at i status prolaza
  const { data: user, error } = await supabase
    .from("users")
    .select("email, full_name, exam_passed, cert_issued_at")
    .eq("id", token) 
    .maybeSingle();

  if (error || !user || !user.exam_passed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white border border-slate-200 p-8 rounded-3xl max-w-md shadow-sm">
          <span className="text-3xl">🔒</span>
          <h1 className="text-lg font-black text-slate-900 mt-2">Credential Not Found</h1>
          <p className="text-slate-500 text-xs mt-1">This specific technical certification token is unverified or active exam records were not found.</p>
        </div>
      </div>
    );
  }

  // 🚀 TAČAN DATUM IZDAVANJA: Primarno uzima cert_issued_at vremenski pečat
  const displayDate = user.cert_issued_at 
    ? new Date(user.cert_issued_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    : "OFFICIALLY VERIFIED";

  // 🚀 PRAVO IME: Uzima full_name iz baze, a email je čisti fallback
  const displayName = user.full_name && user.full_name.trim() !== ""
    ? user.full_name.toUpperCase()
    : (user.email ? user.email.split("@")[0].toUpperCase() : "VERIFIED SPECIALIST");

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-blue-50">
      
      {/* TOP HEADER BRANDING */}
      <header className="max-w-4xl w-full mx-auto flex justify-between items-center border-b border-slate-200/60 pb-6">
        <div className="flex items-center gap-3">
          {/* 🚀 LOGO INTEGRACIJA: Povlači sliku iz /public/logo.png */}
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="AEO Audit Pro Logo" 
              width={32} 
              height={32} 
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-slate-900">AEO Audit Pro</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Academy Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/60 text-[11px] font-black tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Registry Secure: Active
        </div>
      </header>

      {/* THE VISUAL DIPLOMA CONTAINER */}
      <main className="max-w-3xl w-full mx-auto my-12 bg-white border border-slate-200/80 p-8 sm:p-16 rounded-[32px] shadow-xl shadow-slate-200/40 relative overflow-hidden ring-8 ring-slate-100/50">
        
        {/* Subtle geometric background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-full pointer-events-none opacity-50 border-b border-l border-slate-100" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50/50 rounded-tr-full pointer-events-none opacity-40 border-t border-r border-slate-100" />

        {/* Golden/Blue Elegant Border Accent Ribbon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 rounded-b-full" />

        <div className="relative z-10 space-y-12 text-center">
          
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-full">
              Technical Verification Token
            </span>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-6">This is to officially certify that</h2>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-xl mx-auto uppercase py-2 font-serif decoration-blue-600">
              {displayName}
            </h1>
            <div className="w-24 h-0.5 bg-slate-900 mx-auto mt-2" />
          </div>

          <div className="max-w-xl mx-auto space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              has successfully cleared all advanced server architecture tests, DOM structural validation routines, and real-time retrieval-augmented context evaluations to hold the rank of:
            </p>
            <h3 className="text-xl sm:text-3xl font-black text-blue-600 tracking-tight uppercase bg-slate-50/80 py-4 rounded-2xl border border-slate-100 shadow-inner">
              AEO Technical Specialist
            </h3>
          </div>

          <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            Demonstrating professional-grade competency in Edge Infrastructure Optimization, Semantic Layout Segmentation, JSON-LD Graph Architectures, and original information synthesis frameworks.
          </p>

          {/* SIGNATURE FIELDS */}
          <div className="grid grid-cols-2 gap-8 pt-8 max-w-md mx-auto border-t border-slate-100 text-left">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date of Verification</p>
              <p className="text-xs font-bold text-slate-800 mt-1">{displayDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Issuing Authority</p>
              <p className="text-xs font-bold text-slate-800 mt-1">AEO Audit Pro Engine</p>
            </div>
          </div>

          {/* SECURITY LOG FOOTER */}
          <div className="pt-6 border-t border-slate-50 flex items-center justify-center gap-2">
            <p className="text-[9px] font-mono text-slate-300 tracking-tight">UUID Token: {token}</p>
          </div>

        </div>
      </main>

      {/* FOOTER CALL TO ACTION */}
      <footer className="max-w-4xl w-full mx-auto text-center border-t border-slate-200/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400">
        <p>© 2026 AEO Audit Pro Ecosystem. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/" className="text-slate-600 hover:text-slate-900 transition">Audit Your Domain &rarr;</Link>
        </div>
      </footer>

    </div>
  );
}