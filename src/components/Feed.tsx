"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import PostCard from "@/components/PostCard";
import type { PostWithAuthor } from "@/lib/database.types";

export default function Feed({
  initialPosts,
}: {
  initialPosts: PostWithAuthor[];
}) {
  const [query, setQuery] = useState("");

  // Real-time client-side filter over post descriptions (knowledge base search).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialPosts;
    return initialPosts.filter((p) =>
      p.description.toLowerCase().includes(q),
    );
  }, [query, initialPosts]);

  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={setQuery} />

      {filtered.length === 0 ? (
        <EmptyState hasQuery={query.trim().length > 0} />
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="text-3xl">{hasQuery ? "🔍" : "🛠️"}</p>
      <p className="mt-3 text-sm font-medium text-ink">
        {hasQuery ? "No matching posts" : "No posts yet"}
      </p>
      <p className="mt-1 text-sm text-muted">
        {hasQuery
          ? "Try a different keyword."
          : "Use the form above to log your first job."}
      </p>
    </div>
  );
}
