import React from 'react';

export default function Chapter7() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* NASLOV MODULA */}
      <div className="border-l-4 border-blue-600 pl-4 mb-8">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
          Module 7
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
          AI-Friendly Content Architecture & Information Formatting
        </h3>
      </div>

      {/* UVOD */}
      <div className="space-y-4 text-slate-600 leading-relaxed">
        <p>
          Creating excellent content is not only about choosing the right words. The way
          information is organized plays a significant role in how both people and AI
          systems understand a webpage. Well-structured content improves readability,
          reduces ambiguity, and makes important information easier to locate.
        </p>
        <p>
          Modern AI systems often process information in smaller sections rather than
          treating an entire page as a single block of text. Clear organization helps
          machines identify definitions, explanations, comparisons, and supporting
          information more efficiently.
        </p>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* SEKCIJA: ORGANIZING INFORMATION */}
      <div className="space-y-3">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Organizing Information
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Every page should have a logical flow. Readers should naturally move from the
          introduction through explanations, examples, and conclusions without unnecessary
          confusion.
        </p>
        <p className="text-slate-600 leading-relaxed">
          A simple structure often looks like this:
        </p>

        <div className="mt-3 max-w-xs">
  <pre className="bg-slate-950 text-slate-200 rounded-xl p-4 text-sm font-mono shadow-inner border border-slate-900 leading-loose text-center">
{`Introduction
↓
Definition
↓
Explanation
↓
Examples
↓
FAQs
↓
Summary`}
  </pre>
</div>
        <p className="text-slate-600 leading-relaxed pt-1">
          Predictable organization helps users quickly locate the information they need
          while also making the content easier for automated systems to interpret.
        </p>
      </div>

      {/* SEKCIJA: CONTENT CHUNKING */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Content Chunking
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Rather than writing extremely long paragraphs, information should be divided
          into smaller logical sections. Each section should focus on a single idea or
          concept before moving to the next topic.
        </p>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider pt-2">
          Effective content chunks typically contain:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            A descriptive heading.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            One primary concept.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            A clear explanation.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Optional examples / evidence.
          </li>
        </ul>
      </div>

      {/* SEKCIJA: WRITING CLEAR DEFINITIONS */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Writing Clear Definitions
        </h4>
        <p className="text-slate-600 leading-relaxed">
          AI systems frequently encounter questions asking for definitions. Pages that
          provide concise, accurate explanations can be easier to understand and reference.
        </p>
        <p className="text-slate-600 leading-relaxed">
          A strong definition should answer the question directly before expanding into
          additional detail.
        </p>
        <div className="bg-slate-50 border-l-4 border-blue-500 rounded-r-xl p-4 my-2">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Definition Example:</p>
          <p className="italic text-slate-700 leading-relaxed">
            &quot;Answer Engine Optimization (AEO) is the practice of improving website content
            and technical structure so AI-powered search systems can better discover,
            understand, and reference information.&quot;
          </p>
        </div>
      </div>

      {/* DVA STUPCA: LISTS & TABLES USAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
            Using Lists
          </h4>
          <p className="text-slate-600 text-sm leading-relaxed">
            Lists organize information into predictable patterns. They improve readability and make comparisons easier for users. Bullet lists work well for:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Features", "Benefits", "Requirements", "Best practices", "Common mistakes", "Recommendations"].map((item) => (
              <span key={item} className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
            Using Tables
          </h4>
          <p className="text-slate-600 text-sm leading-relaxed">
            Tables provide structured comparisons that make complex data easy to scan. Common implementations include:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["SEO vs AEO", "Feature matrix", "Pricing plans", "Pros & Cons", "Tech specs"].map((item) => (
              <span key={item} className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SEKCIJA: QUESTION & ANSWER */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Question & Answer Sections
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Many users search by asking complete questions rather than entering isolated
          keywords. Organizing content using question-and-answer sections mirrors natural
          search behavior and helps explain individual concepts clearly.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Good Q&A sections typically answer one question at a time before moving to the
          next topic.
        </p>
      </div>

      {/* SEKCIJA: ORIGINAL CONTENT */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Original Content
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Originality remains one of the most valuable qualities of high-quality content.
          Rather than repeating information that already exists across hundreds of
          websites, valuable pages contribute new insights, examples, research,
          experiences, or practical guidance.
        </p>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider pt-2">
          Examples of original content include:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Original research.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Case studies.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Industry statistics.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Real-world examples.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Unique frameworks.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Proprietary methodologies.
          </li>
        </ul>
      </div>

      {/* SEKCIJA: REDUCING CONTENT NOISE */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Reducing Content Noise
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Content should communicate useful information efficiently. Repeating the same
          ideas, using excessive marketing language, or adding unnecessary filler can
          reduce clarity and make pages more difficult to read.
        </p>
        <p className="text-slate-700 font-medium">
          Focus on helping readers solve problems rather than maximizing word count.
        </p>
      </div>

      {/* SEKCIJA: ENTITY-RICH WRITING */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Entity-Rich Writing
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Strong content often references specific entities instead of relying on vague
          descriptions. Mentioning clearly identifiable companies, products, technologies,
          locations, standards, or organizations provides additional context that improves
          clarity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-red-50/60 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">❌ Avoid Vague Layouts:</p>
            <p className="italic text-slate-600 text-sm">&quot;Many AI tools use structured information.&quot;</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">✅ Better Entity-Rich Approach:</p>
            <p className="italic text-slate-700 text-sm">
              &quot;AI systems such as ChatGPT, Google Gemini, and Perplexity can benefit from
              well-structured website content and standardized Schema.org markup.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* DVA STUPCA: MISTAKES & BEST PRACTICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* MISTAKES */}
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 space-y-3">
          <h4 className="text-base font-bold text-red-900 flex items-center gap-2">
            <span className="text-lg">⚠️</span> Common Mistakes
          </h4>
          <ul className="space-y-2 text-sm text-slate-600 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Writing extremely long paragraphs.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Publishing generic content without unique insights.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Using excessive marketing language.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Mixing multiple unrelated topics on one page.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Ignoring logical information hierarchy.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Repeating the same ideas multiple times.
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
              Organize content using logical sections.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Write concise definitions before detailed explanations.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Use lists whenever appropriate.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Create comparison tables for complex topics.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Include FAQ sections where relevant.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Support statements with examples.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Publish original information whenever possible.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Avoid unnecessary filler content.
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
            Good content architecture improves readability and machine understanding.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              2
            </span>
            Small, focused content sections are easier to process than large text blocks.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              3
            </span>
            Lists, tables, and FAQs organize information efficiently.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              4
            </span>
            Original research and practical examples create more valuable content.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              5
            </span>
            Clear structure helps both users and AI systems understand webpage content.
          </li>
        </ul>
      </div>
    </div>
  );
}