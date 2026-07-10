"use client";

export default function Chapter3() {
  return (
    <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
      
      {/* SECTION 1 */}
      <div>
        <p className="mb-4">
          For a website to appear in AI-powered search experiences, AI systems must first
          be able to discover and access its content. This process begins with automated
          software known as crawlers or bots. These systems visit websites, request pages,
          analyze available information, and determine whether that content can be used in
          search or AI-generated responses.
        </p>

        <p>
          Traditional search engines have used crawlers for decades, but the growth of AI
          search has introduced new types of automated agents designed to collect,
          understand, and process web information for artificial intelligence systems.
        </p>
      </div>

      {/* What Are AI Crawlers? */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          What Are AI Crawlers?
        </h4>
        <p>
          AI crawlers are automated programs that access publicly available web content.
          Their purpose can vary depending on the company operating them. Some crawlers
          collect information that may be used for training large language models, while
          others are designed for real-time search, retrieval, or improving AI-powered
          answers.
        </p>
        <p>
          Examples of AI-related crawlers include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>
            <strong>GPTBot:</strong> A crawler associated with OpenAI that can be used to
            collect publicly accessible web content according to OpenAI{"'"}s policies.
          </li>
          <li>
            <strong>PerplexityBot:</strong> A crawler associated with Perplexity{"'"}s search
            and answer engine ecosystem.
          </li>
          <li>
            <strong>Google-Extended:</strong> A control mechanism related to Google{"'"}s AI
            systems.
          </li>
          <li>
            <strong>Applebot-Extended:</strong> A crawler used in Apple{"'"}s AI-related
            ecosystem.
          </li>
        </ul>
      </div>

      {/* The Role of robots.txt */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          The Role of robots.txt
        </h4>
        <p>
          The <code>robots.txt</code> file is a text file placed in the root directory of a
          website. It provides instructions to automated crawlers about which areas of a
          website they are allowed or not allowed to access.
        </p>
        <p>
          A typical robots.txt file contains rules based on user agents. A user agent
          identifies the crawler making the request, allowing website owners to create
          different rules for different bots.
        </p>
        <p>
          Example:
        </p>
        <pre className="bg-slate-100 rounded-md p-3 text-sm overflow-x-auto font-mono">
{`User-agent: GPTBot
Allow: /

User-agent: *
Disallow: /private/`}
        </pre>
        <p className="mt-2">
          In this example, GPTBot is allowed to access the website, while all crawlers are
          prevented from accessing the private directory.
        </p>
      </div>

      {/* Why robots.txt Matters for AEO */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Why robots.txt Matters for AEO
        </h4>
        <p>
          A website can contain excellent content, strong expertise, and valuable
          information, but if important sections are unintentionally blocked, automated
          systems may have difficulty discovering that content.
        </p>
        <p>
          During an AEO audit, robots.txt should be reviewed to ensure that important pages
          are accessible and that no accidental restrictions prevent AI-related crawlers
          from reaching valuable information.
        </p>
      </div>

      {/* Common robots.txt Mistakes */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Common robots.txt Mistakes
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>
            Blocking all crawlers using <code>Disallow: /</code> unintentionally.
          </li>
          <li>
            Blocking important content directories.
          </li>
          <li>
            Forgetting that robots.txt instructions are public.
          </li>
          <li>
            Assuming robots.txt guarantees complete privacy or security.
          </li>
          <li>
            Accidentally preventing useful automated systems from accessing content.
          </li>
        </ul>
      </div>

      {/* Firewalls and AI Bot Detection */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Firewalls and AI Bot Detection
        </h4>
        <p>
          Modern websites often use security systems such as Web Application Firewalls
          (WAFs) to protect against malicious traffic. Services like CDN providers,
          security plugins, and hosting-level protection can automatically analyze incoming
          requests and decide whether they appear legitimate.
        </p>
        <p>
          While these protections are valuable, overly aggressive security settings can
          sometimes affect legitimate automated crawlers. A website may accidentally block
          AI-related bots through rate limits, challenge pages, CAPTCHAs, or incorrect
          security rules.
        </p>
      </div>

      {/* HTTP Status Codes and AI Accessibility */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          HTTP Status Codes and AI Accessibility
        </h4>
        <p>
          Every request made by a crawler receives an HTTP response code. These codes help
          automated systems understand whether a page was successfully accessed or whether
          a problem occurred.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>
            <strong>200 OK:</strong> The page was successfully accessed.
          </li>
          <li>
            <strong>301/308 Redirect:</strong> The resource has moved permanently.
          </li>
          <li>
            <strong>404 Not Found:</strong> The requested page does not exist.
          </li>
          <li>
            <strong>403 Forbidden:</strong> Access was denied.
          </li>
          <li>
            <strong>429 Too Many Requests:</strong> The crawler may have triggered rate limits.
          </li>
          <li>
            <strong>500 Server Error:</strong> The server experienced a problem.
          </li>
        </ul>
        <p className="mt-2">
          A healthy website should minimize unnecessary errors and ensure that important
          pages consistently return successful responses.
        </p>
      </div>

      {/* Server Speed and Crawl Efficiency */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Server Speed and Crawl Efficiency
        </h4>
        <p>
          Website performance affects both users and automated systems. Slow server
          responses increase the time required to retrieve content and may reduce how
          efficiently large websites can be crawled.
        </p>
        <p>
          Important performance factors include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Time To First Byte (TTFB).</li>
          <li>Server reliability and uptime.</li>
          <li>Efficient page delivery.</li>
          <li>Proper caching strategies.</li>
          <li>Optimized resources.</li>
        </ul>
      </div>

      {/* Best Practices */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Best Practices
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Regularly review your robots.txt configuration.</li>
          <li>Make sure important pages are accessible to appropriate crawlers.</li>
          <li>Monitor server logs for unexpected crawling problems.</li>
          <li>Configure security systems carefully to avoid blocking legitimate traffic.</li>
          <li>Maintain fast and reliable server performance.</li>
          <li>Use XML sitemaps to help automated systems discover important URLs.</li>
        </ul>
      </div>

      {/* Common Mistakes */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Common Mistakes
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Blocking AI crawlers without understanding the consequences.</li>
          <li>Using robots.txt as a security mechanism.</li>
          <li>Ignoring firewall rules that block automated access.</li>
          <li>Allowing broken URLs and server errors to accumulate.</li>
          <li>Failing to monitor website accessibility.</li>
        </ul>
      </div>

      {/* Key Takeaways */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">
          Key Takeaways
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>AI systems need access to website content before they can understand it.</li>
          <li>robots.txt controls crawler instructions but does not provide security.</li>
          <li>Firewalls and security systems must balance protection with accessibility.</li>
          <li>HTTP responses influence how automated systems interact with your website.</li>
          <li>Technical accessibility is a fundamental requirement for successful AEO.</li>
        </ul>
      </div>

    </div>
  );
}