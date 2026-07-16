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

  const { data: user } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", token)
    .maybeSingle();

  const name = user?.full_name || "Certified Specialist";

  return {
    title: `Certified AEO Specialist - ${name}`,
    description: "Verified AEO Audit Pro certification recognizing expertise in AI Search Optimization, semantic SEO, structured data, and AEO auditing.",
    openGraph: {
      title: `🏆 Certified AEO Specialist — ${name}`,
      description: "Official certification issued by AEO Audit Pro Academy.",
      url: `https://www.aeoaudit-pro.com/verify/${token}`,
      siteName: "AEO Audit Pro Academy",
      images: [
        {
          url: "https://www.aeoaudit-pro.com/Logo.jpg",
          width: 1200,
          height: 630,
          alt: "AEO Audit Pro Certification",
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `Certified AEO Specialist — ${name}`,
      description: "AI Search Optimization certification verified by AEO Audit Pro Academy.",
      images: ["https://www.aeoaudit-pro.com/Logo.jpg"]
    }
  };
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const resolvedParams = await params;
  const token = decodeURIComponent(resolvedParams.token);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border p-10 text-center max-w-md">
          <div className="text-4xl">⚠️</div>
          <h1 className="mt-4 text-xl font-black">Invalid Certificate</h1>
          <p className="mt-2 text-sm text-slate-500">Certificate identifier is missing.</p>
        </div>
      </div>
    );
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("email, full_name, exam_passed, cert_issued_at")
    .eq("id", token)
    .maybeSingle();

  if (error || !user || !user.exam_passed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border rounded-3xl shadow-xl p-10 max-w-md text-center">
          <div className="text-4xl">🔒</div>
          <h1 className="text-xl font-black mt-4">Certificate Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">This credential could not be verified.</p>
        </div>
      </div>
    );
  }

  const displayDate = user.cert_issued_at
    ? new Date(user.cert_issued_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Verified";

  const displayName = user.full_name && user.full_name.trim() !== ""
    ? user.full_name.toUpperCase()
    : user.email
      ? user.email.split("@")[0].toUpperCase()
      : "CERTIFIED SPECIALIST";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
      
      <main className="max-w-3xl w-full mx-auto my-4 bg-white border border-slate-200 rounded-[32px] shadow-2xl overflow-hidden relative">
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700"/>

        <div className="p-6 sm:p-10 text-center relative">
          
          {/* HEADER SECTIONS */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
              <Image
                src="/Logo.jpg"
                alt="AEO Audit Pro Logo"
                width={48}
                height={48}
                className="object-contain scale-125"
                priority
              />
            </div>

            <p className="text-[10px] font-black tracking-[0.25em] text-blue-600 uppercase mt-1">
              AEO Audit Pro Academy
            </p>

            <h2 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-4">
              Certificate of Completion
            </h2>
          </div>

          {/* NAME */}
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight font-serif text-slate-900 uppercase leading-none">
            {displayName}
          </h1>

          <div className="w-20 h-0.5 bg-slate-900 mx-auto mt-4 rounded-full"/>

          <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl mx-auto font-medium">
            has successfully completed the AEO Audit Pro Academy certification program and demonstrated practical knowledge of modern AI Search Optimization principles.
          </p>

          {/* CERTIFICATE TITLE & STAMP SPLIT */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 max-w-xl mx-auto shadow-inner">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase block">
                Certified
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight uppercase leading-none mt-1">
                AEO Specialist
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                AI Search Optimization Credential
              </p>
            </div>

            <div className="w-px h-10 bg-slate-200 hidden sm:block"/>

            {/* KOMPAKTNI STAMP */}
            <div className="w-16 h-16 rounded-full border-2 border-blue-100 bg-blue-50 flex flex-col items-center justify-center relative shrink-0">
              <div className="absolute inset-1 rounded-full border border-blue-200/60"/>
              <span className="text-blue-600 font-black text-sm leading-none">✓</span>
              <span className="text-[8px] font-black tracking-wider text-blue-700 uppercase leading-none mt-0.5">
                Verified
              </span>
            </div>
          </div>

          {/* SKILLS VERIFIED CONTAINER */}
          <div className="mt-6 w-full max-w-xl mx-auto">
            <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-3">
              Skills Verified
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {[
                "AI Search Optimization",
                "Answer Engine Optimization",
                "Semantic SEO",
                "Structured Data Implementation",
                "Entity Optimization",
                "AEO Audit Methodology"
              ].map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-2.5 bg-slate-50/50 border border-slate-100 rounded-lg py-1.5 px-3"
                >
                  <span className="text-blue-600 font-black text-xs">✓</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {skill}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* METADATA DETAILS FIELD */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center items-center gap-12 text-center">
            <div>
              <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">
                Issued Date
              </p>
              <p className="mt-1 text-xs font-bold text-slate-800">
                {displayDate}
              </p>
            </div>

            <div className="w-px h-6 bg-slate-200"/>

            <div>
              <p className="text-[9px] font-black tracking-widest uppercase text-slate-400">
                Issued By
              </p>
              <p className="mt-1 text-xs font-bold text-slate-800">
                AEO Academy
              </p>
            </div>
          </div>

          {/* SECURITY TOKEN ID */}
          <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-center">
            <p className="text-[8px] font-mono text-slate-300 tracking-tight">
              Registry Token: {token}
            </p>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="no-print max-w-3xl w-full mx-auto border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] font-bold text-slate-400">
        <p>© 2026 AEO Audit Pro Academy. All rights reserved.</p>
        <Link href="/" className="text-slate-600 hover:text-blue-600 transition">
          Audit Your Domain →
        </Link>
      </footer>

    </div>
  );
}