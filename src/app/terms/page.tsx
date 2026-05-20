import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200/60 p-8 sm:p-12 rounded-2xl shadow-sm">
        
        {/* Dugme za povratak */}
        <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-xs font-medium mb-8">Effective Date: May 21, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed font-medium">
          <p>
            By accessing or using AEO Audit Pro (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">1. Account Registration & Security</h2>
          <p>
            To use certain features, you must register for an account via Clerk. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">2. Subscription Plans and Credit Resets</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your subscription tier (Starter, Agency Pro) dictates the maximum number of AEO audits you can perform within a 30-day billing cycle.</li>
            <li><strong>Credit Rollover:</strong> Unused audit credits do not roll over to the next month. Credits reset completely at the start of each dynamic 30-day billing period.</li>
            <li>All subscription payments, cancellations, and renewals are governed by <strong>Lemon Squeezy</strong> terms.</li>
          </ul>

          <h2 className="text-xl font-black text-slate-900 pt-4">3. Acceptable Use and Rate Limits</h2>
          <p>
            You agree not to abuse the Service by launching automated DDoS attacks, intentionally attempting to overload our multi-tier scraping pipelines, or reverse-engineering our proprietary algorithmic Q&A and semantic mapping detectors.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">4. Disclaimer of Warranties</h2>
          <p>
            AEO Audit Pro simulates AI search engine crawlers and evaluates semantic structures based on current LLM behaviors. However, because companies like OpenAI, Anthropic, Google, and Perplexity update their models continuously, we do not guarantee specific indexing results, AI search placements, or citation increments.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">5. Limitation of Liability</h2>
          <p>
            In no event shall AEO Audit Pro, its founder, or affiliates be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform, including website scraping blocks or revenue loss.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">6. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Bosnia and Herzegovina, without regard to its conflict of law provisions.
          </p>
        </div>
      </div>
    </div>
  );
}