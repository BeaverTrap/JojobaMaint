import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prepareArticleBody } from "@/lib/article-format";
import { splitArticleBody } from "@/lib/article-body-segments";
import ArticleGallery from "@/components/ArticleGallery";

export default function ArticleBody({ body }: { body: string }) {
  const trimmed = body.trim();
  if (!trimmed) {
    return <p className="text-muted">No content.</p>;
  }

  const segments = splitArticleBody(prepareArticleBody(trimmed));

  return (
    <div className="article-prose">
      {segments.map((segment, i) =>
        segment.kind === "gallery" ? (
          <ArticleGallery key={`gallery-${i}`} images={segment.images} />
        ) : (
          <MarkdownChunk key={`md-${i}`} text={segment.text} />
        ),
      )}
    </div>
  );
}

function MarkdownChunk({ text }: { text: string }) {
  if (!text.trim()) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="article-h2 mt-8 first:mt-0">{children}</h2>
        ),
        h2: ({ children }) => (
          <h2 className="article-h2 mt-8 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="article-h3 mt-6">{children}</h3>
        ),
        p: ({ children }) => <p className="article-p">{children}</p>,
        ul: ({ children }) => <ul className="article-ul">{children}</ul>,
        ol: ({ children }) => <ol className="article-ol">{children}</ol>,
        li: ({ children }) => <li className="article-li">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-ink">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="article-quote">{children}</blockquote>
        ),
        img: ({ src, alt }) => {
          if (!src || typeof src !== "string") return null;
          return (
            <figure className="article-figure">
              <Image
                src={src}
                alt={alt ?? "Photo"}
                width={800}
                height={500}
                unoptimized
                className="article-img"
              />
              {alt && alt !== "Photo" && (
                <figcaption className="article-caption">{alt}</figcaption>
              )}
            </figure>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
