import Link from "next/link";

export type RecentPostSummary = {
  id: string;
  title: string;
  description: string;
};

export default function RecentPostsCard({
  posts,
}: {
  posts: RecentPostSummary[];
}) {
  if (posts.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
        Recent posts
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <ul className="divide-y divide-line">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/posts/${post.id}/edit`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-hover"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {post.title || "Untitled post"}
                  </span>
                  {post.description ? (
                    <span className="block truncate text-sm text-muted">
                      {post.description}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Edit
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
