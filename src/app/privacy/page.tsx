import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200/60 p-8 sm:p-12 rounded-2xl shadow-sm">
        
        {/* Dugme za povratak */}
        <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition mb-8 inline-block">
          ← Back to Home
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
            <li><strong>Payment Data:</strong> All financial transactions, subscription management, and billing details are processed exclusively by our Merchant of Record, <strong>Lemon Squeezy</strong>. We do not store or process your credit card numbers on our servers.</li>
            <li><strong>Crawl Data:</strong> When you submit a URL for an AEO audit, we fetch the public HTML code of that website using third-party APIs (including <strong>Webscraping.ai</strong>). We do not collect private or restricted data from those websites.</li>
          </ul>

          <h2 className="text-xl font-black text-slate-900 pt-4">2. How We Use Your Information</h2>
          <p>
            We use the collected data to provide, maintain, and optimize the AEO Audit Pro platform, track your telematic credit balances, prevent fraudulent activity, and send you important transactional or account-related updates.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">3. Data Storage and Security</h2>
          <p>
            Your account metadata and audit history are securely stored using <strong>Supabase</strong> infrastructure with strict Row-Level Security (RLS) protocols. While we implement industry-standard security measures, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">4. Third-Party Services</h2>
          <p>
            We share necessary data with third-party sub-processors only to ensure system functionality. These include Clerk (Authentication), Supabase (Database), Lemon Squeezy (Billing), and Webscraping.ai (Data Extraction).
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">5. Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Privacy Policy at any time. Any changes will be posted directly on this page with an updated effective date.
          </p>

          <h2 className="text-xl font-black text-slate-900 pt-4">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us via our official support channels or your account dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}