import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Privacy Policy | AEO Audit Pro',
  description: 'How AEO Audit Pro collects, uses and protects your data.',
  alternates: { canonical: '/privacy' },
  openGraph: { title: 'Privacy Policy | AEO Audit Pro', description: 'How AEO Audit Pro collects, uses and protects your data.', url: '/privacy', type: 'website' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ✅ PODIGNUTO NA Z-10: Dokument sa tekstom privatnosti sigurno pluta iznad mreže */}
      <div className="max-w-3xl mx-auto bg-white border border-slate-200/60 p-8 sm:p-12 rounded-2xl shadow-xl shadow-blue-900/5 relative z-10">
        
        {/* Dugme za povratak */}
        <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition mb-8 inline-block">
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-xs font-medium mb-8">Effective Date: May 21, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed font-medium">
          <p>
            Welcome to AEO Audit Pro (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit and use our website and SaaS platform.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">1. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account Data:</strong> When you sign up, we collect your email address and basic profile information handled securely via our authentication provider, <strong>Clerk</strong>.</li>
            <li><strong>Payment Data:</strong> All financial transactions, subscription management, and billing details are processed exclusively by our Merchant of Record, <strong>Dodo Payments</strong>. We do not store or process your credit card numbers on our servers.</li>
            <li><strong>Crawl Data:</strong> When you submit a URL for an AEO audit, we fetch the public HTML code of that website using third-party APIs (including <strong>Webscraping.ai</strong>). We do not collect private or restricted data from those websites.</li>
          </ul>

          <h2 className="text-xl font-black text-slate-900 pt-4">2. Legal Basis for Processing (GDPR)</h2>
          <p>
            If you are a resident of the European Economic Area (EEA), our legal basis for collecting and using your personal data depends on the information concerned. We process your data because:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>We need to perform a contract with you (e.g., providing access to the AEO Audit Pro SaaS).</li>
            <li>You have given us permission to do so.</li>
            <li>The processing is in our legitimate interests and does not override your rights.</li>
          </ul>

          <h2 className="text-xl font-black text-slate-900 pt-4">3. How We Use Your Information</h2>
          <p>
            We use the collected data to provide, maintain, and optimize the AEO Audit Pro platform, track your telematic credit balances, prevent fraudulent activity, and send you important transactional or account-related updates.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">4. Data Storage and Security</h2>
          <p>
            Your account metadata and audit history are securely stored using <strong>Supabase</strong> infrastructure with strict Row-Level Security (RLS) protocols. While we implement industry-standard security measures, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">5. Third-Party Services (Sub-processors)</h2>
          <p>
            We share necessary data with third-party sub-processors only to ensure system functionality. These include Clerk (Authentication), Supabase (Database), Dodo Payments (Billing), and Webscraping.ai (Data Extraction).
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">6. Your GDPR Privacy Rights</h2>
          <p>
            If you are located in the EU/EEA, you have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Right of access, correction, or deletion:</strong> You can request access to, correction of, or deletion of your personal data directly inside your dashboard or by emailing us.</li>
            <li><strong>Right to restriction or objection:</strong> You have the right to object to our processing of your personal data.</li>
            <li><strong>Right to data portability:</strong> You can request a copy of your personal data in a structured, machine-readable format.</li>
          </ul>

          <h2 className="text-xl font-black text-slate-900 pt-4">7. Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Privacy Policy at any time. Any changes will be posted directly on this page with an updated effective date.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">8. Contact Us & Data Controller</h2>
          <p>
            For any questions about this Privacy Policy or to exercise your data rights, please contact the Data Controller:
          </p>
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/60 mt-2 text-xs space-y-1">
            <p><strong>Application:</strong> AEO Audit Pro</p>
            <p><strong>Operator:</strong> Nino Herenda</p>
            <p><strong>Address:</strong> Šukrije Kukavice 13, 73000 Goražde, Bosnia and Herzegovina</p>
            <p><strong>Email:</strong> hello@aeoaudit-pro.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}