"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitAeoExam } from "../../actions";
import CurriculumDropdown from "../components/CurriculumDropdown";

// 20 High-Level Technical Questions
const questions = [
  { 
    id: 1, 
    q: "What is the primary technical paradigm shift when moving from traditional SEO to AEO?", 
    options: { 
      a: "Increasing the density of meta keyword tags in the DOM header.", 
      b: "Optimizing code so AI bots can slice, embed, and synthesize content into direct answers rather than sorting blue links.", 
      c: "Minimizing the volume of server database tables." 
    } 
  },
  { 
    id: 2, 
    q: "What multi-step system do AI engines use to retrieve online content and compile answers for users?", 
    options: { 
      a: "SQL Hydration Tuning (SHT).", 
      b: "Client-Side CSS Injection.", 
      c: "Retrieval-Augmented Generation (RAG)." 
    } 
  },
  { 
    id: 3, 
    q: "Which specific user-agent token controls Apple's permission to use website data for training generative AI models?", 
    options: { 
      a: "User-agent: Applebot-Extended", 
      b: "User-agent: GPTBot-Apple", 
      c: "User-agent: SafariScraper" 
    } 
  },
  { 
    id: 4, 
    q: "If a valid robots.txt file exists but AI bots still hit an HTTP 403 error, what is the most likely root cause?", 
    options: { 
      a: "An edge proxy or firewall (like Cloudflare WAF) is misinterpreting bot speed as a malicious attack and blocking it.", 
      b: "The webpage lacks descriptive structural headings.", 
      c: "The image alt attributes contain keyword stuffing." 
    } 
  },
  { 
    id: 5, 
    q: "Why do automated headless AI crawlers fail completely when a firewall throws a JavaScript challenge or Captcha screen?", 
    options: { 
      a: "Their server compression algorithms only read plain text files.", 
      b: "They require manual encryption keys to pass WAF blocks.", 
      c: "They cannot compute or solve interactive browser puzzles, causing them to leave the site instantly." 
    } 
  },
  { 
    id: 6, 
    q: "How does high server latency or high Time-To-First-Byte (TTFB) affect AI crawlers?", 
    options: { 
      a: "It automatically increases the site's Entity Density score.", 
      b: "It triggers execution window timeouts, causing the bot to drop the page from its retrieval memory.", 
      c: "It forces the crawler to execute client-side hydration." 
    } 
  },
  { 
    id: 7, 
    q: "According to the playbook, how many <h1> elements should be present on a single webpage node?", 
    options: { 
      a: "None, as headings should be styled exclusively with CSS.", 
      b: "Exactly one <h1> element acting as the primary contextual root.", 
      c: "At least three, distributed across section headers." 
    } 
  },
  { 
    id: 8, 
    q: "What happens to an AI parser tree when heading ranks skip levels (e.g., jumping from H2 straight to H4)?", 
    options: { 
      a: "The parsing tree gets confused, breaking up text blocks and splitting content incorrectly.", 
      b: "The server triggers a 500 internal rendering layout error.", 
      c: "The Domain Rating drops by a fixed percentage algorithm." 
    } 
  },
  { 
    id: 9, 
    q: "What is the transformer model memory flaw known as 'Lost in the Middle'?", 
    options: { 
      a: "The scraper drops out if an article contains more than ten paragraphs.", 
      b: "The database loses server connection during high-velocity scraping.", 
      c: "Models pay attention to the beginning and end of long text chunks but forget key facts buried in the middle." 
    } 
  },
  { 
    id: 10, 
    q: "Which HTML5 semantic landmark components provide an explicit shield to protect key facts from 'Lost in the Middle' drops?", 
    options: { 
      a: "Using clean landmark tags like <main> and <article> to isolate content from interface noise.", 
      b: "Wrapping text strings inside heavy nested unsemantic <div> trees.", 
      c: "Replacing traditional prose with client-side pop-ups." 
    } 
  },
  { 
    id: 11, 
    q: "Why are accessibility features like ARIA specifications highly beneficial for technical AEO?", 
    options: { 
      a: "They provide AI scrapers with a highly predictable, cleanly labeled node map to read.", 
      b: "They automatically double the server loading speed metrics.", 
      c: "They block competing bots from downloading underlying layout styles." 
    } 
  },
  { 
    id: 12, 
    q: "What type of string descriptions should be used inside image alt attributes to satisfy multi-modal vision systems?", 
    options: { 
      a: "Keyword-stuffed tags aimed at standard search queries.", 
      b: "Encrypted public tokens matching the JSON-LD architecture.", 
      c: "Clear, direct, and factual Subject-Verb-Object (SVO) statements." 
    } 
  },
  { 
    id: 13, 
    q: "What is the correct structural method to serve metadata schemas without forcing AI engines to guess data connections?", 
    options: { 
      a: "Consolidating all organization components into a single, unified JSON-LD @graph array.", 
      b: "Splitting loose schema scripts across multiple different files.", 
      c: "Hosting an uncompressed markdown map in the footer navigation." 
    } 
  },
  { 
    id: 14, 
    q: "Why should you include your official Wikidata URI or Wikipedia ID link inside the 'sameAs' property?", 
    options: { 
      a: "To speed up the indexing velocity of peripheral blog posts.", 
      b: "To achieve complete Brand Disambiguation and mathematically establish undisputed authority.", 
      c: "To clear browser caching profiles upon server reboot loops." 
    } 
  },
  { 
    id: 15, 
    q: "Which social graph footprints are recommended to cross-reference brand trust within the centralized @graph script?", 
    options: { 
      a: "Verified corporate LinkedIn profiles and Twitter (X) handles.", 
      b: "Loose text mentions inside standalone article biographies.", 
      c: "Encrypted PGP security signatures embedded in image fields." 
    } 
  },
  { 
    id: 16, 
    q: "Why are precise physical latitude and longitude coordinates required inside corporate schema structures?", 
    options: { 
      a: "They lock your entity into a real geographic spot and prevent profile blending errors with similar competitor names.", 
      b: "They calculate the exact distance between the crawler server and local hosts.", 
      c: "They bypass Cloudflare firewall blocks dynamically." 
    } 
  },
  { 
    id: 17, 
    q: "Why is serving content inside continuous, conversational essays considered unoptimized for machine intake?", 
    options: { 
      a: "It causes the HTML5 parser to drop heading ranks completely.", 
      b: "It burns the model's token budget and increases the probability of data hallucinations.", 
      c: "It forces the domain to switch to forced-dynamic loading paths." 
    } 
  },
  { 
    id: 18, 
    q: "How do high-density containers like native HTML tables (<table>) and bulleted lists (<ul>/<ol>) help RAG systems?", 
    options: { 
      a: "They serve data on a silver platter, letting the bot extract pricing or feature lists without running complex processing loops.", 
      b: "They encrypt the text block, preventing competing platforms from scraping statistics.", 
      c: "They dynamically minimize layout shift during mobile views." 
    } 
  },
  { 
    id: 19, 
    q: "What does the proprietary Google Non-Commodity Score directly measure?", 
    options: { 
      a: "The network response delivery metrics of CDN edge servers.", 
      b: "The mathematical ratio of image alt tags relative to paragraph items.", 
      c: "The density of original company data and unique statistics versus generic, copy-paste text found across the web." 
    } 
  },
  { 
    id: 20, 
    q: "Which specific AEO Audit Pro metric measures the frequency of verified industry terms packed per kilobyte of code?", 
    options: { 
      a: "Bluff Score.", 
      b: "Entity Density Score.", 
      c: "Atomic Structure Score." 
    } 
  }
];

interface ClientProps {
  userId: string;
  attemptsUsed: number;
  hasPassed: boolean;
}

// POMOĆNA KOMPONENTA ZA TAJMER (Sa pulsirajućim efektom)
function ExamTimer({ timeLeft, isSubmitting }: { timeLeft: number; isSubmitting: boolean }) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isCritical = timeLeft < 300; // Manje od 5 minuta do kraja

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 font-mono text-xs sm:text-sm shadow-inner text-slate-700 shrink-0">
      <span className="relative flex h-2 w-2">
        {!isSubmitting && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? "bg-red-400" : "bg-amber-400"}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? "bg-red-500" : "bg-amber-500"}`}></span>
      </span>
      <span className={`${isCritical ? "text-red-600 font-bold animate-pulse" : "text-slate-700 font-medium"}`}>
        {isSubmitting ? "00:00" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
      </span>
    </div>
  );
}

export default function AcademyDashboardClient({ userId, attemptsUsed, hasPassed }: ClientProps) {
  const router = useRouter();
  const [view, setView] = useState<"study" | "exam">("study");
  const [fullName, setFullName] = useState(""); 
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<{ passed: boolean; score: number; message: string } | null>(null);
  
  // State za tajmer: 30 minuta = 1800 sekundi
  const [timeLeft, setTimeLeft] = useState(1800);

  const handleOptionChange = (questionId: number, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  // 1. GLAVNI PIPELINE ZA SLANJE ISPITA (Postavljen na vrh radi sprečavanja Temporal Dead Zone greške)
  const executeSubmitPipeline = async (currentAnswers: Record<number, string>) => {
    setIsSubmitting(true);
    try {
      const res = await submitAeoExam(currentAnswers, fullName);
      setExamResult({
        passed: res.passed || false,
        score: res.score || 0,
        message: res.message || ""
      });
      setView("study");
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An error occurred while submitting your exam.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. AUTO-SUBMIT FUNKCIJA (Kada tajmer dođe do 0)
  const autoSubmitExam = async () => {
    alert("⏱️ Time is up! Your exam is being automatically submitted for evaluation with your current answers.");
    await executeSubmitPipeline(answers);
  };

  // 3. EFFECT KOJI PRATI ODBROJAVANJE VREMENA
  useEffect(() => {
    if (view !== "exam" || isSubmitting || examResult) return;

    if (timeLeft <= 0) {
      // Izbacujemo setState iz sinhronog toka efekta pomoću setTimeout-a
      const token = setTimeout(() => {
        autoSubmitExam();
      }, 0);
      return () => clearTimeout(token);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, view, isSubmitting, examResult]);

  // 4. RUČNA PREDAJA NA KLIK DUGMETA
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Please enter your legal full name for certification verification.");
      return;
    }
    if (Object.keys(answers).length < 20) {
      alert("Please answer all 20 questions before submitting.");
      return;
    }
    await executeSubmitPipeline(answers);
  };

  const handleLinkedInShare = () => {
    const certUrl = `https://www.aeoaudit-pro.com/verify/${userId}`;
    
    const text = `🎓 Certification Update: Official Credential Secured!\n\n` +
                 `I am proud to announce that I am officially an AEO Certified Technical Specialist. ` +
                 `I have cleared the technical examination on AEO Audit Pro, validating advanced skills in RAG optimizations, edge proxies, and structured graph injection.\n\n` +
                 `Verify my live registry token here: ${certUrl}`;

    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    
    window.open(linkedinUrl, "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
  };

  return (
    <div className="space-y-12">
      {/* EXAM RESULT NOTIFICATION OVERLAY */}
      {examResult && (
        <div className={`p-8 rounded-3xl border ${examResult.passed ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"}`}>
          <h3 className="text-xl font-black mb-2">{examResult.passed ? "🏆 Certification Granted!" : "🔒 Validation Failed"}</h3>
          <p className="text-sm font-medium leading-relaxed">{examResult.message}</p>
          {examResult.passed && (
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`/verify/${userId}`} className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition">
                View My Certificate 📄
              </a>
              <button 
                type="button"
                onClick={handleLinkedInShare} 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Share on LinkedIn 🚀
              </button>
            </div>
          )}
        </div>
      )}

      {/* STATUS FLAG: ALREADY PASSED */}
      {hasPassed && !examResult && (
        <div className="p-8 rounded-3xl border bg-emerald-50 border-emerald-200 text-emerald-950 text-center space-y-4">
          <div>
            <h3 className="text-xl font-black mb-1">🎉 Congratulations on becoming an AEO Specialist!</h3>
            <p className="text-sm opacity-80">Your specialized technical credential is fully active and verified in our central registry.</p>
          </div>
          <div className="flex justify-center gap-3">
            <a href={`/verify/${userId}`} className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-sm">
              View Public Certificate 📄
            </a>
            <button 
              type="button"
              onClick={handleLinkedInShare} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              Share on LinkedIn 🚀
            </button>
          </div>
        </div>
      )}

      {/* STATUS FLAG: OUT OF ATTEMPTS BLOCKER */}
      {attemptsUsed >= 2 && !hasPassed && !examResult && (
        <div className="p-8 rounded-3xl border bg-slate-900 border-slate-800 text-slate-100 text-center space-y-4">
          <h3 className="text-xl font-black">🔒 Examination Access Revoked (2/2 Attempts Exhausted)</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            You did not achieve the required threshold score of 18/20 during your initial examination validation tokens. To regain core testing permissions and re-trigger automated execution pipelines, you must refresh your registration token.
          </p>
          <div className="pt-2">
            <a href="/api/checkout/academy" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-blue-600/20">
              Re-Unlock Portal & Exam ($10)
            </a>
          </div>
        </div>
      )}

      {/* SCREEN 1: TECHNICAL SYLLABUS HUB */}
      {view === "study" && (
        <section className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Syllabus Playbook</span>
            <h1 className="text-3xl font-black text-slate-900 mt-4 leading-tight">AEO Technical Specialist Framework</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">A straightforward, complete guide explaining exactly how AI search engines read your website code.</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-12 text-slate-600 text-sm leading-relaxed">
            <CurriculumDropdown />
          </div>

          {/* PLAYBOOK ACTION STEP CONTAINER */}
          {attemptsUsed < 2 && !hasPassed && (
            <div className="text-center pt-8 border-t border-slate-100 max-w-md mx-auto space-y-4">
              <div className="text-left">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Enter Your Full Name for Certificate:
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-bold text-slate-900 shadow-inner placeholder:text-slate-300"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!fullName.trim()) {
                    alert("Please enter your name before initiating the examination pipeline.");
                    return;
                  }
                  // Resetujemo vrijeme na punih 30 minuta pri ulasku na ispit
                  setTimeLeft(1800); 
                  setView("exam");
                }}
                disabled={!fullName.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black px-10 py-4 rounded-xl text-sm tracking-wide transition shadow-lg"
              >
                START OFFICIAL TECHNICAL EXAM ({2 - attemptsUsed} Left)
              </button>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                ⚠️ Warning: You have 30 minutes and a maximum of 2 attempts.
              </p>
            </div>
          )}
        </section>
      )}

      {/* SCREEN 2: ISOLATED RUNTIME EXAMINATION INTERFACE */}
      {view === "exam" && (
        <form onSubmit={handleExamSubmit} className="space-y-8 max-w-2xl mx-auto relative">
          
          {/* STICKY HEADER SA TAJMEROM */}
          <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-md flex justify-between items-center gap-4 transition-all">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Technical Evaluation Exam</h2>
              <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Applicant: <span className="text-blue-600 font-bold uppercase">{fullName}</span></p>
            </div>
            
            <div className="flex items-center gap-2">
              <ExamTimer timeLeft={timeLeft} isSubmitting={isSubmitting} />

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to return to the playbook? Your progress on this attempt will be lost.")) {
                    setView("study");
                  }
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 py-1.5 rounded-xl bg-white transition-colors shrink-0"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* LISTA PITANJA */}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
                <p className="font-bold text-slate-900 text-sm leading-snug"><span className="text-blue-600">{idx + 1}.</span> {q.q}</p>
                <div className="space-y-2">
                  {Object.entries(q.options).map(([key, text]) => (
                    <label key={key} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition text-xs font-medium ${answers[q.id] === key ? "border-blue-600 bg-blue-50/40 text-blue-950" : "border-slate-100 hover:bg-slate-50 text-slate-600"}`}>
                      <input 
                        type="radio" 
                        name={`question-${q.id}`} 
                        value={key} 
                        checked={answers[q.id] === key}
                        onChange={() => handleOptionChange(q.id, key)}
                        className="mt-0.5 h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                      />
                      <span><strong className="uppercase text-slate-400 mr-1">{key})</strong> {text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* DUGME ZA RUČNU PREDAJU ISPITA */}
          <button 
            type="submit" 
            disabled={isSubmitting || Object.keys(answers).length < 20}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-xl tracking-wide transition text-sm shadow-xl shadow-blue-600/10"
          >
            {isSubmitting ? "VERIFYING INTEGRITY ROUTINES FROM SERVER..." : "SUBMIT EXAM FOR MACHINE EVALUATION"}
          </button>
        </form>
      )}
    </div>
  );
}