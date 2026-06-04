/**
 * Renders article body text pasted from Google Docs or typed in plain text.
 * Supports simple structure: blank lines = paragraphs, ## headings, - bullets.
 */
export default function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).filter((b) => b.trim());

  if (blocks.length === 0) {
    return <p className="text-muted">No content.</p>;
  }

  return (
    <div className="prose-article space-y-4 text-[15px] leading-relaxed text-ink">
      {blocks.map((block, i) => (
        <Block key={i} text={block.trim()} />
      ))}
    </div>
  );
}

function Block({ text }: { text: string }) {
  const lines = text.split("\n");

  if (lines[0]?.startsWith("## ")) {
    return (
      <h2 className="text-lg font-bold tracking-tight text-ink">
        {lines[0].slice(3)}
      </h2>
    );
  }
  if (lines[0]?.startsWith("### ")) {
    return (
      <h3 className="text-base font-semibold text-ink">
        {lines[0].slice(4)}
      </h3>
    );
  }

  if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {lines.map((l, i) => (
          <li key={i}>{l.replace(/^[-*]\s+/, "")}</li>
        ))}
      </ul>
    );
  }

  return <p className="whitespace-pre-wrap">{text}</p>;
}
