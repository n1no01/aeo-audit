import React from 'react';

export default function Chapter8() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* NASLOV MODULA */}
      <div className="border-l-4 border-blue-600 pl-4 mb-8">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
          Module 8
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
          AEO Auditing, Performance Monitoring & Continuous Optimization
        </h3>
      </div>

      {/* UVOD */}
      <div className="space-y-4 text-slate-600 leading-relaxed">
        <p>
          Answer Engine Optimization is not a one-time project. Websites constantly change,
          new pages are published, content is updated, and technical configurations evolve.
          Regular auditing helps ensure that these changes do not reduce accessibility,
          content quality, or machine readability.
        </p>
        <p>
          An effective AEO strategy combines technical optimization, high-quality content,
          structured data, and continuous monitoring. Rather than waiting for problems to
          accumulate, businesses should review their websites on a regular basis and fix
          issues before they affect visibility.
        </p>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* SEKCIJA: WHAT IS AN AEO AUDIT */}
      <div className="space-y-3">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          What Is an AEO Audit?
        </h4>
        <p className="text-slate-600 leading-relaxed">
          An AEO audit is a structured evaluation of how well a website supports discovery,
          understanding, and interpretation by AI-powered search systems. The goal is to
          identify technical issues, content weaknesses, and optimization opportunities
          that may improve overall machine readability.
        </p>
        <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-4 text-sm text-slate-700">
          <span className="font-bold text-blue-700 block mb-1">AEO vs Traditional SEO Audit:</span>
          Unlike a traditional SEO audit, an AEO audit shifts heavy focus onto semantic structure, 
          entity optimization, structured data validity, accessibility, and modular content organization.
        </div>
      </div>

      {/* SEKCIJA: CORE AREAS OF AN AEO AUDIT */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Core Areas of an AEO Audit
        </h4>
        <p className="text-slate-600 text-sm">
          A comprehensive audit evaluates multiple categories rather than a single ranking factor:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            "Website accessibility", "robots.txt configuration", "Semantic HTML structure",
            "Heading hierarchy", "Structured data layout", "Image optimization",
            "Content chunking", "Entity consistency", "Internal linking", "Page performance"
          ].map((area) => (
            <span key={area} className="bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200">
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* SEKCIJA: PRIORITIZING IMPROVEMENTS */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Prioritizing Improvements
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Not every issue has the same impact. Critical technical problems that prevent
          crawlers from accessing important content should generally be addressed before
          smaller improvements such as formatting refinements.
        </p>
        
        <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 shadow-xl font-mono text-xs sm:text-sm space-y-2 border border-slate-900">
          <p className="text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 pb-2 mb-3">Recommended Implementation Order:</p>
          <div className="flex items-center gap-3"><span className="text-blue-400 font-bold">01.</span> Fix accessibility and crawling issues</div>
          <div className="flex items-center gap-3"><span className="text-blue-400 font-bold">02.</span> Resolve broken HTML structure</div>
          <div className="flex items-center gap-3"><span className="text-blue-400 font-bold">03.</span> Implement or improve structured data</div>
          <div className="flex items-center gap-3"><span className="text-blue-400 font-bold">04.</span> Improve page speed and performance</div>
          <div className="flex items-center gap-3"><span className="text-indigo-400 font-bold">05.</span> Enhance content quality</div>
          <div className="flex items-center gap-3"><span className="text-indigo-400 font-bold">06.</span> Expand original information</div>
          <div className="flex items-center gap-3"><span className="text-indigo-400 font-bold">07.</span> Review entity consistency</div>
        </div>
      </div>

      {/* DVA STUPCA: MONITORING & MAINTENANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
            Continuous Monitoring
          </h4>
          <p className="text-slate-600 text-sm leading-relaxed">
            Optimization should continue after the initial audit to catch new technical bugs before they scale. Regular monitoring includes:
          </p>
          <ul className="space-y-2 text-sm text-slate-600 pl-1">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              Checking crawl accessibility.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              Reviewing schema validation.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              Monitoring page performance.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              Updating outdated data points.
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
            Content Maintenance
          </h4>
          <p className="text-slate-600 text-sm leading-relaxed">
            Information becomes outdated over time. Statistics change, products evolve, and concepts require fresh insights.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Updating important pages helps maintain accuracy while providing users with current information. Fresh, well-maintained content supports long-term visibility.
          </p>
        </div>
      </div>

      {/* SEKCIJA: MEASURING SUCCESS */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Measuring Success
        </h4>
        <p className="text-slate-600 leading-relaxed">
          AEO success should be evaluated using multiple indicators rather than relying on a single metric. Useful indicators include:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Technical audit score improvements.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Reduced crawler and bot errors.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Improved structured data coverage.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Better Core Web Vitals performance.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Higher raw content quality metrics.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            More consistent multi-platform entity info.
          </li>
        </ul>
      </div>

      {/* SEKCIJA: BUILDING AN AEO WORKFLOW */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Building an AEO Workflow
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Successful optimization is usually the result of a repeatable workflow rather
          than isolated improvements. Every new page should follow the same quality
          standards before publication.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs font-medium">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-blue-600 font-bold block text-sm mb-1">1. Research</span>
            Create original content
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-blue-600 font-bold block text-sm mb-1">2. Format</span>
            Organize information clearly
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-blue-600 font-bold block text-sm mb-1">3. Markup</span>
            Add valid schema data
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-blue-600 font-bold block text-sm mb-1">4. Optimize</span>
            Tune images & performance
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-indigo-600 font-bold block text-sm mb-1">5. Structure</span>
            Review semantic HTML
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-indigo-600 font-bold block text-sm mb-1">6. Audit</span>
            Run the pre-live AEO check
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-indigo-600 font-bold block text-sm mb-1">7. Resolve</span>
            Fix identified issues
          </div>
          <div className="p-3 bg-slate-950 text-slate-100 rounded-xl shadow-md border border-slate-900">
            <span className="text-emerald-400 font-bold block text-sm mb-1">8. Launch</span>
            Publish & monitor logs
          </div>
        </div>
      </div>

      {/* SEKCIJA: FINAL AEO CHECKLIST */}
      <div className="space-y-4 pt-4">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Final AEO Checklist
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 rounded-2xl p-5 border border-slate-100">
          {[
            "Website is accessible to appropriate crawlers.",
            "robots.txt is correctly configured.",
            "Semantic HTML structure is implemented.",
            "Heading hierarchy is perfectly logical.",
            "Structured data validates without errors.",
            "Images include descriptive alt text.",
            "Content is completely original & chunked.",
            "Entity information is cross-platform consistent.",
            "Internal links are clean and functional.",
            "Website performance is regularly monitored."
          ].map((check, index) => (
            <div key={index} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span>{check}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DVA STUPCA: MISTAKES & BEST PRACTICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* MISTAKES */}
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 space-y-3">
          <h4 className="text-base font-bold text-red-900 flex items-center gap-2">
            <span className="text-lg">⚠️</span> Common Mistakes
          </h4>
          <ul className="space-y-2 text-sm text-slate-600 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Treating AEO as a one-time project.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Ignoring technical issues while focusing only on content.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Publishing pages without validating structured data.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Allowing outdated information to remain live online.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Failing to monitor website health after deployment.
            </li>
          </ul>
        </div>

        {/* BEST PRACTICES */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3">
          <h4 className="text-base font-bold text-emerald-900 flex items-center gap-2">
            <span className="text-lg">✅</span> Best Practices
          </h4>
          <ul className="space-y-2 text-sm text-slate-600 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Audit websites regularly rather than after drop in metrics.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Prioritize technical accessibility before advanced optimizations.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Maintain strictly consistent structured data across properties.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Keep core pillar pages continuously fresh and up to date.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Monitor raw platform search metrics and performance analytics.
            </li>
          </ul>
        </div>
      </div>

      {/* SEKCIJA: KEY TAKEAWAYS */}
      <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-6 mt-8 space-y-3">
        <h4 className="text-base font-bold uppercase tracking-wider text-sm text-blue-700">
          Key Takeaways
        </h4>
        <ul className="space-y-2.5 text-slate-700">
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              1
            </span>
            AEO requires ongoing maintenance rather than one-time optimization.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              2
            </span>
            Regular audits help identify technical and content issues early.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              3
            </span>
            Prioritize fixes that improve accessibility and machine readability.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              4
            </span>
            Monitor website health and update content regularly.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              5
            </span>
            A repeatable optimization workflow supports long-term AI visibility.
          </li>
        </ul>
      </div>
    </div>
  );
}