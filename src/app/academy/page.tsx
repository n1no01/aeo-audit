import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getUserStats } from "../actions"; // Serverska akcija za profil
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AcademyDashboardClient from "./certification/AcademyDashboardClient";
import { CheckoutButton } from "../pricing/CheckoutButton"; // 🚀 Uvozimo tvoje postojeće dugme

export default async function AcademyPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  
  let hasPaid = false;
  let attemptsUsed = 0;
  let hasPassed = false;
  let userEmail = "";

  if (userId && clerkUser) {
    userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
    const stats = await getUserStats();
    if (stats?.aeo_academy_paid) {
      hasPaid = true;
    }
    attemptsUsed = stats?.exam_attempts_used || 0;
    hasPassed = stats?.exam_passed || false;
  }

  const ACADEMY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_ACADEMY_PRODUCT_ID || "";

  // ===================================================================
  // 🎓 ZONA ZA KORISNIKE KOJI SU PLATILI
  // ===================================================================
  if (userId && hasPaid) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between relative overflow-x-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />
        
        <Navbar userId={userId} />

        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 relative z-10 flex-1">
          <AcademyDashboardClient 
            userId={userId} 
            attemptsUsed={attemptsUsed} 
            hasPassed={hasPassed} 
          />
        </main>

        <Footer />
      </div>
    );
  }

  // ===================================================================
  // 💰 LANDING / PRODAJNA ZONA (Iskorišten tvoj CheckoutButton)
  // ===================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />
      
      <Navbar userId={userId} />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center relative z-10">
        
        {/* Badge */}
        <div className="inline-block px-3 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100 text-center">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-600 block">
            Industry Recognized Credential
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center max-w-3xl leading-[1.15] mb-6 text-slate-900">
          Become a Certified <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">AEO Specialist</span>
        </h1>

        <p className="text-slate-500 text-base sm:text-lg text-center max-w-2xl mb-12 font-medium leading-relaxed">
          Stop optimizing for human clicks and start optimizing for LLM parsers. Learn how to optimize websites for RAG architectures, bypass crawler firewalls, and force ChatGPT, Gemini & Perplexity to cite your brand.
        </p>

        {/* Tri ključna stuba programa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
            <div className="text-xl mb-3">📘</div>
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 mb-2">Technical Playbook</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Complete text-based, documentation-style guide optimized for fast, in-depth learning.</p>
          </div>
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
            <div className="text-xl mb-3">📝</div>
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 mb-2">Rigorous Exam</h3>
            <p className="text-slate-500 text-sm leading-relaxed">20 expert-level engineering & SEO questions. Requires 18/20 (90%) score to pass.</p>
          </div>
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
            <div className="text-xl mb-3">💼</div>
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 mb-2">LinkedIn Authority</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Get a unique verification URL and verifiable badge to display on your professional profiles.</p>
          </div>
        </div>

        {/* Šta se uči (Curriculum) */}
        <div className="w-full max-w-2xl bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm mb-12">
        <h2 className="text-xl font-black text-slate-900 mb-6">Certification Curriculum</h2>
        <div className="space-y-4">
            
            {/* CH 1 */}
            <div className="flex gap-4 items-start">
            <span className="font-black text-blue-600 bg-blue-50 text-xs px-2 py-1 rounded">CH 1</span>
            <div>
                <h4 className="font-bold text-sm text-slate-800">AEO Fundamentals & RAG Infrastructure</h4>
                <p className="text-slate-400 text-xs mt-0.5">Understanding vector shifts from blue links to direct synthesis, machine-intake timelines, and Retrieval-Augmented Generation.</p>
            </div>
            </div>
            
            <div className="border-t border-slate-100 my-2" />
            
            {/* CH 2 */}
            <div className="flex gap-4 items-start">
            <span className="font-black text-blue-600 bg-blue-50 text-xs px-2 py-1 rounded">CH 2</span>
            <div>
                <h4 className="font-bold text-sm text-slate-800">Crawler Operations & WAF Operations</h4>
                <p className="text-slate-400 text-xs mt-0.5">Configuring Robots.txt for AI user-agents, optimizing TTFB latency, and bypassing silent HTTP 403 firewall/captcha blocks.</p>
            </div>
            </div>
            
            <div className="border-t border-slate-100 my-2" />
            
            {/* CH 3 */}
            <div className="flex gap-4 items-start">
            <span className="font-black text-blue-600 bg-blue-50 text-xs px-2 py-1 rounded">CH 3</span>
            <div>
                <h4 className="font-bold text-sm text-slate-800">DOM Architecture & Semantic Graphs</h4>
                <p className="text-slate-400 text-xs mt-0.5">Enforcing heading continuity, shields for &quot;Lost in the Middle&quot; anomalies, multi-modal vision tags, and consolidated JSON-LD @graph schemas.</p>
            </div>
            </div>
            
            <div className="border-t border-slate-100 my-2" />
            
            {/* CH 4 */}
            <div className="flex gap-4 items-start">
            <span className="font-black text-blue-600 bg-blue-50 text-xs px-2 py-1 rounded">CH 4</span>
            <div>
                <h4 className="font-bold text-sm text-slate-800">Ingestion Ingestion & AI Scoring Triad</h4>
                <p className="text-slate-400 text-xs mt-0.5">Optimizing high-density data tables, token budget controls, and passing Google Non-Commodity, Entity Density, and Bluff score metrics.</p>
            </div>
            </div>

        </div>
        </div>

        {/* CTA CARD */}
        <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-lg font-black tracking-wide uppercase mb-2">Get Certified Today</h3>
          <div className="flex items-center justify-center gap-2 mb-6">       
            <span className="text-3xl font-black text-white">$10</span>
            <span className="text-slate-400 text-xs font-semibold">one-time access</span>
          </div>

          {/* CLERK + STRIPE/DODO LOGIKA KROZ TVOJ CHECKOUT BUTTON */}
          {userId ? (
            /* 🚀 KORISTIMO TVOJE DUGME: Automatski će povući API link i obraditi preusmjeravanje */
            <CheckoutButton
              productId={ACADEMY_PRODUCT_ID}
              userId={userId}
              userEmail={userEmail}
              text="GET STARTED"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl tracking-wide transition-all duration-200 shadow-lg shadow-blue-600/20 text-sm flex items-center justify-center"
            />
          ) : (
            <Link 
              href="/sign-in?redirectUrl=/academy" 
              className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl tracking-wide transition-all duration-200 shadow-lg shadow-blue-600/20 text-sm"
            >
              SIGN IN TO UNLOCK ACCESS
            </Link>
          )}
          <p className="text-slate-400 text-[11px] mt-4 font-medium">Includes lifelong playbook updates and 2 official exam attempts.</p>
        </div>

      </main>
      <Footer />
    </div>
  );
}