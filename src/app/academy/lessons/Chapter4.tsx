"use client";

export default function Chapter4() {
  return (
    <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
      
      {/* SECTION 1 */}
      <div>
        <p className="mb-4">
          AEO is not only about what information exists on a webpage, but also about how
          that information is organized. AI systems must analyze large amounts of content
          and determine which parts are important, how different sections relate to each
          other, and what information best answers a user{"'"}s question.
        </p>

        <p>
          Clean HTML structure provides additional context. When a webpage uses meaningful
          elements and logical organization, automated systems can more easily identify
          titles, main content, supporting information, navigation, and individual topics
          within a page.
        </p>
      </div>

      {/* What Is Semantic HTML? */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          What Is Semantic HTML?
        </h4>
        <p>
          Semantic HTML means using HTML elements according to their intended purpose.
          Instead of using generic containers everywhere, semantic elements communicate the
          role and meaning of different sections of a webpage.
        </p>
        <p>
          For example, a <code>&lt;header&gt;</code> element tells browsers and automated
          systems that a section contains introductory information, while
          {" "}<code>&lt;article&gt;</code> indicates a self-contained piece of content.
        </p>
        <p>
          Common semantic HTML elements include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>
            <strong>&lt;header&gt;:</strong> Introductory content, branding, or navigation
            areas.
          </li>
          <li>
            <strong>&lt;nav&gt;:</strong> Navigation links.
          </li>
          <li>
            <strong>&lt;main&gt;:</strong> The primary content of the page.
          </li>
          <li>
            <strong>&lt;article&gt;:</strong> Independent content such as articles,
            guides, or posts.
          </li>
          <li>
            <strong>&lt;section&gt;:</strong> A thematic grouping of related content.
          </li>
          <li>
            <strong>&lt;aside&gt;:</strong> Supporting information related to the main
            content.
          </li>
          <li>
            <strong>&lt;footer&gt;:</strong> Closing information such as legal details or
            additional links.
          </li>
        </ul>
      </div>

      {/* Why Semantic Structure Matters for AEO */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Why Semantic Structure Matters for AEO
        </h4>
        <p>
          Humans can visually understand a webpage by looking at colors, spacing, fonts,
          and design. Automated systems do not interpret pages in exactly the same way.
          They rely heavily on underlying code, text relationships, and structured signals.
        </p>
        <p>
          A well-organized HTML structure helps communicate which content is primary and
          which content is secondary. This can improve machine understanding and reduce
          ambiguity when analyzing a page.
        </p>
      </div>

      {/* Heading Hierarchy */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Heading Hierarchy
        </h4>
        <p>
          Headings create the organizational structure of a webpage. They allow users and
          automated systems to understand how information is divided into topics and
          subtopics.
        </p>
        <p>
          A typical heading structure follows a logical order:
        </p>
        <pre className="bg-slate-100 rounded-md p-3 text-sm overflow-x-auto font-mono">
{`H1 - Main topic of the page

H2 - Major sections

H3 - Subsections inside H2

H4 - Additional details`}
        </pre>
        <p className="mt-2">
          The goal is not to use every heading level on every page, but to maintain a
          logical relationship between sections. Headings should describe the content that
          follows them and accurately represent the page structure.
        </p>
      </div>

      {/* The Importance of a Single Primary Topic */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          The Importance of a Single Primary Topic
        </h4>
        <p>
          Every important page should have a clear primary purpose. A page attempting to
          answer many unrelated questions at once can become difficult for both users and
          automated systems to interpret.
        </p>
        <p>
          Strong AEO pages usually focus on one main topic while supporting that topic with
          related information, examples, definitions, and frequently asked questions.
        </p>
      </div>

      {/* Content Segmentation and Information Blocks */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Content Segmentation and Information Blocks
        </h4>
        <p>
          AI systems often process content in smaller sections rather than treating an
          entire webpage as one large document. Because of this, organizing information
          into clear sections can improve understanding.
        </p>
        <p>
          Effective content blocks usually contain:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>A descriptive heading.</li>
          <li>A focused explanation of one concept.</li>
          <li>Supporting examples or evidence.</li>
          <li>Clear relationships with surrounding sections.</li>
        </ul>
        <p className="mt-2">
          Large walls of text without structure make it harder for readers and machines to
          identify important information.
        </p>
      </div>

      {/* The Role of Lists and Tables */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          The Role of Lists and Tables
        </h4>
        <p>
          Structured formats such as lists and tables are valuable because they organize
          information into predictable patterns.
        </p>
        <p>
          Examples:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Comparison tables for products or services.</li>
          <li>Step-by-step instructions using ordered lists.</li>
          <li>Feature lists using bullet points.</li>
          <li>Definitions using clear question-and-answer formats.</li>
        </ul>
      </div>

      {/* Accessibility and Machine Readability */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Accessibility and Machine Readability
        </h4>
        <p>
          Accessibility and AEO often overlap. Features that help users with disabilities
          can also provide additional context for automated systems.
        </p>
        <p>
          Examples include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Descriptive image alt text.</li>
          <li>Proper heading structure.</li>
          <li>Meaningful link descriptions.</li>
          <li>Keyboard-friendly navigation.</li>
          <li>ARIA attributes when appropriate.</li>
        </ul>
      </div>

      {/* Common HTML Structure Problems */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Common HTML Structure Problems
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Missing page titles or unclear headings.</li>
          <li>Using headings only for visual styling.</li>
          <li>Jumping randomly between heading levels.</li>
          <li>Creating extremely long sections without breaks.</li>
          <li>Hiding important information inside unnecessary scripts.</li>
          <li>Using generic HTML containers instead of meaningful elements.</li>
        </ul>
      </div>

      {/* Best Practices */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Best Practices
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Use one clear primary heading for each page.</li>
          <li>Organize content with logical heading levels.</li>
          <li>Use semantic HTML elements whenever possible.</li>
          <li>Create focused sections around specific topics.</li>
          <li>Use lists and tables to simplify complex information.</li>
          <li>Keep important information visible in the page structure.</li>
        </ul>
      </div>

      {/* Key Takeaways */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">
          Key Takeaways
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>HTML structure provides important context for automated systems.</li>
          <li>Semantic elements improve clarity and organization.</li>
          <li>Logical headings help users and machines understand content hierarchy.</li>
          <li>Structured content formats improve information accessibility.</li>
          <li>Clean HTML is an important foundation for successful AEO.</li>
        </ul>
      </div>

    </div>
  );
}