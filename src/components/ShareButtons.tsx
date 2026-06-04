"use client";

import { useState } from "react";
import { shareUrlsFor, type ShareableContent } from "@/lib/social-share";

export default function ShareButtons({
  content,
  className = "",
}: {
  content: ShareableContent;
  className?: string;
}) {
  const { pageUrl, facebook, group, clipboardText } = shareUrlsFor(content);
  const [status, setStatus] = useState<string | null>(null);

  function flash(message: string) {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 2500);
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(message);
    } catch {
      flash("Could not copy — select and copy the link manually.");
    }
  }

  function shareOnFacebook() {
    window.open(facebook, "_blank", "noopener,noreferrer,width=600,height=520");
  }

  async function shareToGroup() {
    await copyText(clipboardText, "Copied — paste into a new group post");
    if (group) {
      window.open(group, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className={`rounded-xl border border-line bg-surface px-4 py-3 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Share
      </p>
      <p className="mt-1 text-xs text-muted">
        {group
          ? "Share the link on Facebook, or copy text and open your group to post there."
          : "Share this page on Facebook or copy the link."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={shareOnFacebook}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#166FE5]"
        >
          <FacebookIcon />
          Share on Facebook
        </button>

        {group && (
          <button
            type="button"
            onClick={shareToGroup}
            className="inline-flex items-center gap-2 rounded-lg border border-[#1877F2] bg-brand-50 px-3 py-2 text-sm font-semibold text-[#1877F2] transition hover:bg-brand-100 dark:bg-brand-950/40"
          >
            <FacebookIcon />
            Post in Facebook group
          </button>
        )}

        <button
          type="button"
          onClick={() => copyText(pageUrl, "Link copied")}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-hover"
        >
          Copy link
        </button>

        {group && (
          <button
            type="button"
            onClick={() =>
              copyText(clipboardText, "Title + link copied for group post")
            }
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-hover"
          >
            Copy for group post
          </button>
        )}
      </div>

      {status && (
        <p className="mt-2 text-xs font-medium text-brand-700" role="status">
          {status}
        </p>
      )}

      {group && (
        <p className="mt-2 text-xs text-muted">
          <strong className="font-medium text-ink">Post in Facebook group</strong>{" "}
          copies the title and link, then opens your group. Create a new post and
          paste — Facebook does not allow apps to publish directly into groups
          without Meta business approval.
        </p>
      )}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
