"use client";

export default function Chapter5() {
  return (
    <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
      
      {/* SECTION 1 */}
      <div>
        <p className="mb-4">
          The modern web is no longer based only on written information. Images, videos,
          charts, diagrams, screenshots, and other visual elements have become an important
          part of how people consume information. As artificial intelligence systems become
          increasingly multimodal, they are becoming capable of analyzing and understanding
          multiple types of data, including text and visual information.
        </p>

        <p>
          For AEO, this means that optimizing images is no longer only about improving
          traditional image search rankings. Visual optimization helps provide additional
          context that can improve how automated systems interpret the overall meaning of a
          webpage.
        </p>
      </div>

      {/* What Is Multimodal AI? */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          What Is Multimodal AI?
        </h4>
        <p>
          Traditional language models were primarily focused on processing text. Multimodal
          AI systems extend these capabilities by combining different forms of information,
          such as text, images, audio, and video.
        </p>
        <p>
          This allows AI systems to analyze relationships between written explanations and
          visual content. For example, an AI system may use information from a product
          image, a technical diagram, or a chart together with surrounding text to better
          understand the subject of a webpage.
        </p>
        <p>
          The goal of multimodal systems is not simply to recognize objects in images, but
          to understand context, relationships, and meaning.
        </p>
      </div>

      {/* Why Images Matter in AEO */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Why Images Matter in AEO
        </h4>
        <p>
          Images can provide valuable information that text alone cannot communicate.
          Product photos, comparison charts, screenshots, graphs, and diagrams often contain
          important details that improve user understanding.
        </p>
        <p>
          However, without proper optimization, visual information may be difficult for
          automated systems to interpret. Search engines and AI systems need additional
          signals that explain what an image represents.
        </p>
      </div>

      {/* The Importance of Alt Text */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          The Importance of Alt Text
        </h4>
        <p>
          The <code>alt</code> attribute provides a textual description of an image. It was
          originally created as an accessibility feature for users who cannot see images,
          but it also provides additional context for automated systems.
        </p>
        <p>
          Good alt text should describe the actual content and purpose of the image rather
          than simply repeating keywords.
        </p>
        <p>
          Example:
        </p>
        <pre className="bg-slate-100 rounded-md p-3 text-sm overflow-x-auto font-mono">
{`Bad:
<img alt="SEO image">

Better:
<img alt="Dashboard showing AEO audit results with crawlability and schema analysis scores">`}
        </pre>
        <p className="mt-2">
          The second example provides specific information that helps humans and machines
          understand what the image represents.
        </p>
      </div>

      {/* Characteristics of Effective Alt Text */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Characteristics of Effective Alt Text
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Describe the actual image content.</li>
          <li>Include important context when necessary.</li>
          <li>Avoid unnecessary keyword stuffing.</li>
          <li>Keep descriptions natural and useful.</li>
          <li>Focus on the purpose of the image.</li>
        </ul>
      </div>

      {/* Images as Data Sources */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Images as Data Sources
        </h4>
        <p>
          Many websites use visual elements to communicate data. Examples include charts,
          screenshots, diagrams, infographics, and product comparison images.
        </p>
        <p>
          When visual information represents important facts, websites should support those
          visuals with additional context:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Descriptive captions.</li>
          <li>Supporting explanations in surrounding text.</li>
          <li>Clear image filenames.</li>
          <li>Structured data when relevant.</li>
        </ul>
        <p className="mt-2">
          A chart showing business growth, for example, becomes much more meaningful when
          the page explains what the chart represents and why the data matters.
        </p>
      </div>

      {/* Image File Names and Context */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Image File Names and Context
        </h4>
        <p>
          File names can provide additional context about an image. Although they are only
          one small signal, descriptive filenames are generally better than meaningless
          names generated by cameras or design tools.
        </p>
        <p>
          Example:
        </p>
        <pre className="bg-slate-100 rounded-md p-3 text-sm overflow-x-auto font-mono">
{`Bad:
IMG_48291.jpg

Better:
aeo-audit-report-dashboard.jpg`}
        </pre>
      </div>

      {/* Accessibility and AEO */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Accessibility and AEO
        </h4>
        <p>
          Accessibility improvements often create benefits beyond helping users with
          disabilities. A website built with accessibility in mind usually contains clearer
          structure and more understandable information.
        </p>
        <p>
          Important accessibility elements include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Alternative text for meaningful images.</li>
          <li>Proper heading hierarchy.</li>
          <li>Readable color contrast.</li>
          <li>Keyboard-friendly navigation.</li>
          <li>Descriptive links.</li>
          <li>Appropriate ARIA attributes when needed.</li>
        </ul>
      </div>

      {/* Common Image Optimization Mistakes */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Common Image Optimization Mistakes
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Using generic alt text such as &quot;image&quot; or &quot;photo&quot;.</li>
          <li>Leaving important images without descriptions.</li>
          <li>Adding keywords unnaturally into alt attributes.</li>
          <li>Using extremely large image files that slow down the website.</li>
          <li>Adding images without explaining their purpose.</li>
          <li>Ignoring accessibility requirements.</li>
        </ul>
      </div>

      {/* Best Practices */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-base pt-2">
          Best Practices
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>Use descriptive alt attributes for meaningful images.</li>
          <li>Support important visuals with surrounding text.</li>
          <li>Optimize image size and performance.</li>
          <li>Use semantic HTML elements such as figure and figcaption.</li>
          <li>Create visuals that provide original value instead of decoration only.</li>
          <li>Consider accessibility during every stage of content creation.</li>
        </ul>
      </div>

      {/* Key Takeaways */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">
          Key Takeaways
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-500">
          <li>AI systems are increasingly capable of understanding multiple data types.</li>
          <li>Images can provide important context for both users and AI systems.</li>
          <li>Alt text improves accessibility and provides additional image information.</li>
          <li>Visual content should be supported with meaningful descriptions.</li>
          <li>Accessible websites are generally easier for both humans and machines to understand.</li>
        </ul>
      </div>

    </div>
  );
}