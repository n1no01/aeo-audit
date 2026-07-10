import React from 'react';

export default function Chapter6() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* NASLOV MODULA */}
      <div className="border-l-4 border-blue-600 pl-4 mb-8">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
          Module 6
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide">
          Structured Data, JSON-LD & Entity Optimization
        </h3>
      </div>

      {/* UVOD */}
      <div className="space-y-4 text-slate-600 leading-relaxed">
        <p>
          Search engines and AI systems do more than simply read the visible text on a
          webpage. They also analyze structured data that explicitly describes what the
          content represents. Structured data removes ambiguity by providing machine-readable
          information about organizations, people, products, articles, events, and many
          other types of entities.
        </p>
        <p>
          While high-quality written content remains essential, structured data helps
          machines interpret that content more accurately. Instead of guessing whether a
          page describes a business, a product, or an article, structured data explicitly
          communicates those relationships.
        </p>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* SEKCIJA: WHAT IS STRUCTURED DATA */}
      <div className="space-y-3">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          What Is Structured Data?
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Structured data is a standardized format used to describe information in a way
          that computers can easily understand. Rather than relying entirely on natural
          language, websites provide additional metadata that explains what different
          pieces of content represent.
        </p>
        <p className="text-slate-600 leading-relaxed">
          The most widely adopted vocabulary is{" "}
          <strong className="font-semibold text-slate-900">Schema.org</strong>, which
          defines hundreds of entity types including organizations, articles, products,
          reviews, people, events, FAQs, courses, recipes, and many others.
        </p>
      </div>

      {/* SEKCIJA: WHAT IS JSON-LD */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          What Is JSON-LD?
        </h4>
        <p className="text-slate-600 leading-relaxed">
          JSON-LD (JavaScript Object Notation for Linked Data) is the recommended format
          for implementing structured data on modern websites. Instead of embedding
          metadata directly into HTML elements, JSON-LD stores structured information
          inside a dedicated script block.
        </p>
        <p className="text-slate-600 leading-relaxed">
          This approach keeps structured information separate from the visual design while
          making it easier to maintain and update.
        </p>

        <div className="mt-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Example:
          </p>
          <pre className="bg-slate-950 text-slate-200 rounded-xl p-4 text-sm font-mono overflow-x-auto shadow-inner border border-slate-900">
{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Company",
  "url": "https://example.com"
}`}
          </pre>
        </div>
      </div>

      {/* SEKCIJA: UNDERSTANDING ENTITIES */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Understanding Entities
        </h4>
        <p className="text-slate-600 leading-relaxed">
          An entity is a uniquely identifiable thing. It may represent a company, person,
          product, location, software application, event, or almost anything that exists
          independently.
        </p>
        <p className="text-slate-600 leading-relaxed">
          AI systems increasingly organize information around entities instead of isolated
          keywords. The goal is to understand concepts and relationships rather than simply
          matching words.
        </p>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider pt-2">
          For example, a company entity may contain:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Company name.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Official website.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Logo.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Founding date.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Physical location.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Social profiles.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Products or services.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            Associated people.
          </li>
        </ul>
      </div>

      {/* SEKCIJA: KNOWLEDGE GRAPHS */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Knowledge Graphs
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Search engines organize entities inside large knowledge graphs. Rather than
          storing isolated facts, these systems connect entities through relationships.
        </p>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider pt-2">
          For example:
        </p>
        <ul className="list-none space-y-2 pl-2 text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mr-1">→</span>
            A company employs a person.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mr-1">→</span>
            A product belongs to a brand.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mr-1">→</span>
            An article was written by an author.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mr-1">→</span>
            An organization operates from a specific location.
          </li>
        </ul>
        <p className="text-slate-600 leading-relaxed pt-1">
          Structured data helps communicate these relationships more clearly, reducing the
          chance of ambiguity.
        </p>
      </div>

      {/* SEKCIJA: BRAND DISAMBIGUATION */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Brand Disambiguation
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Some businesses share identical or very similar names. Brand disambiguation is
          the process of providing enough information for machines to distinguish one entity
          from another.
        </p>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider pt-2">
          Helpful identifying information includes:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-600">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Official domain name.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Business address.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Organization logo.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Social media profiles.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Consistent business name.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            Contact information.
          </li>
        </ul>
        <p className="text-slate-600 leading-relaxed pt-1">
          Consistency across websites, business profiles, and structured data helps reduce
          ambiguity and improves confidence in entity identification.
        </p>
      </div>

      {/* SEKCIJA: COMMON SCHEMA TYPES */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          Common Schema Types
        </h4>
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            "Organization", "Person", "Article", "Product", "Service", 
            "LocalBusiness", "FAQPage", "BreadcrumbList", "Review", 
            "AggregateRating", "Course", "Event"
          ].map((type) => (
            <span 
              key={type} 
              className="bg-slate-100 text-slate-700 text-xs font-mono font-medium px-2.5 py-1 rounded-md border border-slate-200"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* SEKCIJA: THE IMPORTANCE OF CONSISTENCY */}
      <div className="space-y-3 pt-2">
        <h4 className="text-lg font-bold text-slate-900 tracking-tight">
          The Importance of Consistency
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Structured data should accurately reflect the visible content of the page.
          Inconsistent information, outdated contact details, conflicting organization
          names, or inaccurate URLs may reduce trust and create confusion.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Every important business detail should remain consistent across your website,
          structured data, business profiles, and other public sources.
        </p>
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
              Using invalid Schema.org properties.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Publishing outdated business information.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Providing structured data that contradicts visible content.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Leaving important entity fields incomplete.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Using incorrect schema types.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              Duplicating conflicting structured data across multiple pages.
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
              Use JSON-LD whenever possible.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Select the most appropriate Schema.org type.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Keep structured data synchronized with visible content.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Maintain consistent business information across all platforms.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Include important entity relationships where appropriate.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              Validate structured data regularly.
            </li>
          </ul>
        </div>
      </div>

      {/* SEKCIJA: KEY TAKEAWAYS */}
      <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-6 mt-8 space-y-3">
        <h4 className="text-base font-bold text-slate-900 uppercase tracking-wider text-sm text-blue-700">
          Key Takeaways
        </h4>
        <ul className="space-y-2.5 text-slate-700">
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              1
            </span>
            Structured data provides machine-readable information about webpage content.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              2
            </span>
            JSON-LD is the recommended format for implementing structured data.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              3
            </span>
            Entities help AI systems understand real-world concepts and relationships.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              4
            </span>
            Knowledge Graphs organize entities through connected information.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
              5
            </span>
            Consistent structured data improves clarity and reduces ambiguity.
          </li>
        </ul>
      </div>
    </div>
  );
}