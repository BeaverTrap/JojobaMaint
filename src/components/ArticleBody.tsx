import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prepareArticleBody } from "@/lib/article-format";

export default function ArticleBody({ body }: { body: string }) {
  const markdown = prepareArticleBody(body);

  if (!markdown) {
    return <p className="text-muted">No content.</p>;
  }

  return (
    <div className="article-prose">
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
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
