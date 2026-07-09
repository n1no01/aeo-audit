"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitAeoExam } from "../../actions";

// 20 High-Level Technical Questions - Mixed up options for dynamic difficulty
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

export default function AcademyDashboardClient({ userId, attemptsUsed, hasPassed }: ClientProps) {
  const router = useRouter();
  const [view, setView] = useState<"study" | "exam">("study");
  const [fullName, setFullName] = useState(""); 
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<{ passed: boolean; score: number; message: string } | null>(null);

  const handleOptionChange = (questionId: number, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

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

    setIsSubmitting(true);
    try {
      const res = await submitAeoExam(answers, fullName);
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

  const getLinkedInShareUrl = () => {
    const certUrl = `https://www.aeoaudit-pro.com/verify/${userId}`;
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}`;
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
              <a href={getLinkedInShareUrl()} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#0077b5] hover:bg-[#006294] text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition">
                Share on LinkedIn 🚀
              </a>
            </div>
          )}
        </div>
      )}

      {/* STATUS FLAG: ALREADY PASSED */}
      {hasPassed && !examResult && (
        <div className="p-8 rounded-3xl border bg-emerald-50 border-emerald-200 text-emerald-950 text-center space-y-4">
          <div>
            <h3 className="text-xl font-black mb-1">🎉 Active Technical Specialist Portal</h3>
            <p className="text-sm opacity-80">Your specialized technical credential is fully active and verified in our central registry.</p>
          </div>
          <div className="flex justify-center gap-3">
            <a href={`/verify/${userId}`} className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-sm">
              View Public Certificate 📄
            </a>
            <a href={getLinkedInShareUrl()} target="_blank" rel="noopener noreferrer" className="bg-[#0077b5] hover:bg-[#006294] text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-sm">
              Share on LinkedIn 🚀
            </a>
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
            
            {/* MODULE 1 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">1. What is Answer Engine Optimization (AEO)?</h3>
              <p>Traditional SEO was built for old search engines where people type keywords and click on a list of blue links. <strong>AEO (Answer Engine Optimization)</strong> is built for the new era of AI search tools like <strong>ChatGPT, Gemini, and Perplexity</strong>.</p>
              <p>Instead of showing links, these new AI tools read web pages, turn the text into numbers (vectors), and write a combined answer directly on the screen for the user. If your website code is messy or hard for AI bots to read, your business simply won&apos;t be picked or cited by these AI tools.</p>
            </div>

            {/* MODULE 2 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">2. Why the Technical Code Part is Everything</h3>
              <p>Many people think optimization is just about writing nice articles. In AEO, great writing means nothing if the website&apos;s technical code is broken. AI tools use a multi-step system called <strong>RAG (Retrieval-Augmented Generation)</strong> to find answers.</p>
              <p>Before an AI writes an answer, an automated program (a crawler or bot) must visit your server, open your code, and read through it. If your server is slow, has security blocks, or has unorganized code, the AI bot gives up in a fraction of a second.</p>
            </div>

            {/* MODULE 3 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">3. Crawling Permits, Server Speed & The Firewall Trap</h3>
              <p>AI crawlers have special names, like <code>GPTBot</code>, <code>PerplexityBot</code>, or <code>Applebot-Extended</code>. AEO Audit Pro checks your root <strong>Robots.txt</strong> file to ensure you haven&apos;t accidentally blocked these AI bots from entering your site.</p>
              <p>Websites often use protective layers like <strong>Cloudflare WAF (Firewall)</strong>. When an AI bot scans your website very fast to collect information, Cloudflare thinks it is a malicious hacker attack. It immediately blocks the AI bot with a silent <strong>HTTP 403 Forbidden</strong> error, or shows a puzzle/Captcha screen. Since AI bots are automated, they cannot solve Captchas and leave your site instantly.</p>
              <p><strong>Page Loading Speed:</strong> AI bots operate on a very tight time limit. If your server takes too long to load or send data (high TTFB), the AI bot triggers a timeout and drops your page from its memory.</p>
            </div>

            {/* MODULE 4 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">4. Clean Layout Rules & Heading Continuity</h3>
              <p>AI scrapers do not look at your website&apos;s colors; they read the raw text line by line from the DOM.</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-500">
                <li><strong>The Single H1 Tag Rule:</strong> Your page code must contain exactly one <code>&lt;h1&gt;</code> tag. Having no H1 or having multiple H1 tags completely breaks the AI&apos;s ability to categorize your page topic.</li>
                <li><strong>No Skipping Headings:</strong> Your titles must follow a logical numerical order (like <code>H2</code> followed by <code>H3</code>, then <code>H4</code>). If you jump from an <code>H2</code> straight to an <code>H4</code>, the AI parser tree gets confused and splits your text incorrectly.</li>
                <li><strong>Lost in the Middle Shield:</strong> AI models suffer from a memory flaw called &quot;Lost in the Middle&quot;. When reading long text, they pay attention to the absolute beginning and the absolute end, but completely forget facts buried in the middle. Using clean tags like <code>&lt;main&gt;</code> and <code>&lt;article&gt;</code> isolates your content and protects your key facts.</li>
              </ul>
            </div>

            {/* MODULE 5 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">5. Multi-Modal Vision & Image Alt Attributes</h3>
              <p>Modern AI models are &quot;multi-modal&quot;, meaning they can &quot;see&quot; images and read text at the same time. When Perplexity or ChatGPT scans a page, they look at your charts, product photos, and diagrams to verify facts.</p>
              <p>If your images don&apos;t have an <strong><code>alt</code> tag attribute</strong> in the code, or if the description is just generic text, the AI model cannot interpret the visual data. You must use clear, direct, and factual descriptions for your images. These descriptions act as anchors for AI databases, allowing them to index your charts and tables easily. Additionally, making your site code compliant with <strong>ARIA accessibility standards</strong> gives the AI bot a highly predictable map to read.</p>
            </div>

            {/* MODULE 6 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">6. JSON-LD Graph Schemas & Corporate Disambiguation</h3>
              <p>Putting separate, loose schema blocks across different files forces the AI to guess how your data connects. The correct technical method is to put all your company details into a single, unified <strong>JSON-LD <code>@graph</code> array</strong>. This links your entire company history into an unbroken data web inside the code.</p>
              <p>To achieve perfect <strong>Brand Disambiguation</strong> (proving to the AI exactly who you are so it never confuses you with a competitor with a similar name), you must include specific fields:</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-500">
                <li><strong>sameAs Wikidata Matrix:</strong> Directly link your company schema to your official, verified <strong>Wikidata URI</strong> or Wikipedia ID page to establish undisputed authority.</li>
                <li><strong>Social Footprints:</strong> Embed clear links to your official <strong>LinkedIn profile</strong> and <strong>Twitter (X) handle</strong> inside the graph code to cross-reference your brand trust.</li>
                <li><strong>Geospatial Coordinates:</strong> Always include your precise physical business address coordinates (<strong>latitude and longitude</strong>). This locks your business entity into a real geographic spot and prevents profile blending errors.</li>
              </ul>
            </div>

            {/* MODULE 7 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">7. Ingestion Formatting: Tables, Lists, and Q&A Modules</h3>
              <p>AI engines process structured formatting way better than long storytelling paragraphs. Writing information in heavy text walls forces the AI to burn its token budget and increases the chance of it &quot;hallucinating&quot; (making up fake data).</p>
              <p>AEO Audit Pro scans for high-density data containers. Using clean <strong>HTML tables (<code>&lt;table&gt;</code>)</strong> and bulleted lists (<code>&lt;ul&gt;</code>/<code>&lt;ol&gt;</code>) serves your data to the AI scraper on a silver platter. Similarly, adding a dedicated <strong>Question & Answer (Q&A)</strong> module directly mirrors how users ask questions on AI search engines, making your content the perfect drop-in reply.</p>
            </div>

            {/* MODULE 8 */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-3">8. The Metric Triad & Google Non-Commodity Scores</h3>
              <p>Modern AI search engines have advanced filters built to detect and block boring corporate texts. To pass these filters, your webpage must hit high scores in the three core metrics measured by AEO Audit Pro:</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-500">
                <li><strong>Bluff Score:</strong> Measures if your content is filled with useless marketing fluff and empty words. If your bluff score is too high, the AI skips your site.</li>
                <li><strong>Atomic Structure Score:</strong> Measures the technical health of your HTML layout, ensuring your text is ready for clean splitting (*chunking*).</li>
                <li><strong>Entity Density Score:</strong> Calculates exactly how many concrete industry terms and factual definitions are packed per kilobyte of code.</li>
                <li><strong>Google Non-Commodity Score:</strong> This calculates how much original data, real case studies, and proprietary company statistics you have versus generic copy-paste text found everywhere else on the internet (commodity text). Stating obvious, generic facts triggers AI filters; passing requires showing unique data structures that cannot be found anywhere else on the web.</li>
              </ul>
            </div>

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
                  placeholder="e.g. NINO HERENDA"
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
                  setView("exam");
                }}
                disabled={!fullName.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black px-10 py-4 rounded-xl text-sm tracking-wide transition shadow-lg"
              >
                START OFFICIAL TECHNICAL EXAM ({2 - attemptsUsed} Left)
              </button>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                ⚠️ Warning: You have 2 attempts maximum. Failing both resets your status.
              </p>
            </div>
          )}
        </section>
      )}

      {/* SCREEN 2: ISOLATED RUNTIME EXAMINATION INTERFACE */}
      {view === "exam" && (
        <form onSubmit={handleExamSubmit} className="space-y-8 max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Official Certification Exam</h2>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Applicant: <span className="text-blue-600 font-bold uppercase">{fullName}</span></p>
            </div>
            <button
              type="button"
              onClick={() => setView("study")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg bg-white transition-colors"
            >
              &larr; Return to Playbook
            </button>
          </div>

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