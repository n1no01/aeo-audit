import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Terms of Service | AEO Audit Pro',
  description: 'The terms that apply when you use AEO Audit Pro.',
  alternates: { canonical: '/terms' },
  openGraph: { title: 'Terms of Service | AEO Audit Pro', description: 'The terms that apply when you use AEO Audit Pro.', url: '/terms', type: 'website' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6 relative overflow-x-hidden">
      
      {/* ✅ ZAKLJUČANO NA Z-0: Globalna pozadinska mreža i suptilni sjaj idu skroz na dno ekrana */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ✅ PODIGNUTO NA Z-10: Dokument sa uslovima korišćenja sigurno pluta iznad mreže */}
      <div className="max-w-3xl mx-auto bg-white border border-slate-200/60 p-8 sm:p-12 rounded-2xl shadow-xl shadow-blue-900/5 relative z-10">
        
        {/* Dugme za povratak */}
        <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-xs font-medium mb-8">Effective Date: May 21, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed font-medium">
          <p>
            By accessing or using AEO Audit Pro (&ldquo;the Service&rdquo;), operated by <strong>Nino Herenda </strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">1. Account Registration & Security</h2>
          <p>
            To use certain features, you must register for an account via Clerk. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">2. Subscription Plans and Credit Resets</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your subscription tier (Starter, Agency Pro) dictates the maximum number of AEO audits you can perform within a 30-day billing cycle.</li>
            <li><strong>Credit Rollover:</strong> Unused audit credits do not roll over to the next month. Credits reset completely at the start of each dynamic 30-day billing period.</li>
            <li>All subscription payments, cancellations, and renewals are handled securely by our Merchant of Record, <strong>Dodo Payments</strong>. By purchasing, you also agree to Dodo Payments&apos; terms and conditions.</li>
          </ul>

          {/* ✅ NOVA SEKCIJA: Politika povrata novca, jako važna za SaaS */}
          <h2 className="text-xl font-black text-slate-900 pt-4">3. Refunds and Cancellations</h2>
          <p>
            You can cancel your subscription at any time through your billing dashboard managed by Dodo Payments. Due to the high operational costs associated with live web scraping and API consumption (via Webscraping.ai), we generally do not offer refunds once credits have been actively used within a billing cycle. Refund exceptions may be evaluated on a case-by-case basis.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">4. Acceptable Use and Rate Limits</h2>
          <p>
            You agree not to abuse the Service by launching automated DDoS attacks, intentionally attempting to overload our multi-tier scraping pipelines, or reverse-engineering our proprietary algorithmic Q&A and semantic mapping detectors.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">5. Disclaimer of Warranties</h2>
          <p>
            AEO Audit Pro simulates AI search engine crawlers and evaluates semantic structures based on current LLM behaviors. However, because companies like OpenAI, Anthropic, Google, and Perplexity update their models continuously, we do not guarantee specific indexing results, AI search placements, or citation increments.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">6. Limitation of Liability</h2>
          <p>
            In no event shall AEO Audit Pro, its founder, or affiliates be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform, including website scraping blocks or revenue loss.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">7. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Bosnia and Herzegovina, without regard to its conflict of law provisions.
          </p>

          {/* ✅ NOVA SEKCIJA SA PODACIMA KOJA JE FALILA */}
          <h2 className="text-xl font-black text-slate-900 pt-4">8. Contact Information</h2>
          <p>
            If you have any questions or require formal notices regarding these Terms, please contact us at:
          </p>
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/60 mt-2 text-xs space-y-1">
            <p><strong>Legal Entity / Operator:</strong> Nino Herenda</p>
            <p><strong>Address:</strong> Šukrije Kukavice 13, 73000 Goražde, Bosnia and Herzegovina</p>
            <p><strong>Email:</strong> hello@aeoaudit-pro.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}