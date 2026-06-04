import Link from "next/link";
import ContentCoverImage from "@/components/ContentCoverImage";

/** List row: cover banner on top (always visible), then text. */
export function ContentIndexCardLink({
  href,
  coverUrl,
  coverAlt,
  children,
  footer,
}: {
  href: string;
  coverUrl: string | null;
  coverAlt?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <Link href={href} className="block transition hover:bg-hover/50">
        {coverUrl && (
          <ContentCoverImage
            src={coverUrl}
            alt={coverAlt ?? ""}
            variant="card"
          />
        )}
        <div className="p-4">{children}</div>
      </Link>
      {footer}
    </article>
  );
}
