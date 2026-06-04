"use client";

import { useState } from "react";
import { shareUrlsFor, type ShareableContent } from "@/lib/social-share";

/**
 * Large, plain-language share controls for residents (not staff workflows).
 */
export default function ShareButtons({
  content,
  className = "",
  variant = "page",
}: {
  content: ShareableContent;
  className?: string;
  /** "page" = full panel on a detail page; "inline" = compact row on feed cards */
  variant?: "page" | "inline";
}) {
  const { pageUrl, facebook, group, clipboardText } = shareUrlsFor(content);
  const [status, setStatus] = useState<string | null>(null);

  function flash(message: string) {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 4000);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      flash("Copied! Open Facebook, start a post, and tap Paste.");
    } catch {
      flash("Tap and hold the address bar, then choose Copy.");
    }
  }

  function shareOnFacebook() {
    window.open(facebook, "_blank", "noopener,noreferrer");
  }

  async function shareInGroup() {
    try {
      await navigator.clipboard.writeText(clipboardText);
      flash("Copied! In the group, tap Write something… then Paste.");
    } catch {
      flash("Copy the link first, then paste in the group.");
    }
    if (group) {
      window.setTimeout(() => {
        window.open(group, "_blank", "noopener,noreferrer");
      }, 400);
    }
  }

  if (variant === "inline") {
    return (
      <div
        className={`px-4 py-4 ${className}`}
        aria-label="Share with neighbors"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p className="text-base font-bold text-ink">Share with neighbors</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ActionButton
            onClick={shareOnFacebook}
            className="bg-[#1877F2] text-white hover:bg-[#166FE5]"
            icon={<FacebookIcon size={20} />}
            label="Facebook"
          />
          <ActionButton
            onClick={copyLink}
            className="border-2 border-line bg-surface text-ink hover:bg-hover"
            icon={<CopyIcon />}
            label="Copy link"
          />
        </div>
        {group && (
          <ActionButton
            onClick={shareInGroup}
            className="mt-2 border-2 border-brand-600 bg-surface text-brand-300 hover:bg-hover dark:border-brand-500 dark:bg-hover"
            icon={<FacebookIcon size={20} />}
            label="Our Facebook group"
            fullWidth
          />
        )}
        {status && <StatusBanner message={status} compact />}
      </div>
    );
  }

  return (
    <section
      className={`rounded-2xl border-2 border-brand-200 bg-brand-50/80 px-5 py-5 dark:border-brand-700 dark:bg-accent ${className}`}
      aria-label="Share with neighbors"
    >
      <h2 className="text-xl font-bold text-ink">Share with neighbors</h2>
      <p className="mt-2 text-base leading-relaxed text-ink/85">
        Post this on Facebook or copy the link to paste in a message or the
        community group.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <ActionButton
          onClick={shareOnFacebook}
          className="bg-[#1877F2] text-white shadow-md hover:bg-[#166FE5]"
          icon={<FacebookIcon size={22} />}
          label="Share on Facebook"
          fullWidth
        />
        {group && (
          <ActionButton
            onClick={shareInGroup}
            className="border-2 border-brand-600 bg-surface text-brand-300 hover:bg-hover dark:border-brand-500 dark:bg-hover"
            icon={<FacebookIcon size={22} />}
            label="Post in our Facebook group"
            fullWidth
          />
        )}
        <ActionButton
          onClick={copyLink}
          className="border-2 border-line bg-surface text-ink hover:bg-hover"
          icon={<CopyIcon />}
          label="Copy link to paste"
          fullWidth
        />
      </div>

      {status && <StatusBanner message={status} />}

      {group ? (
        <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-4 text-base leading-relaxed text-ink">
          <p className="font-bold">Posting in the group — 3 steps</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Tap <strong>Post in our Facebook group</strong> (we copy the link
              for you).
            </li>
            <li>
              In Facebook, tap <strong>Write something…</strong>
            </li>
            <li>
              Press and hold in the box, then tap <strong>Paste</strong>
            </li>
          </ol>
        </div>
      ) : (
        <p className="mt-4 text-base text-muted">
          After you copy the link, open Facebook and paste it into any post or
          text message.
        </p>
      )}
    </section>
  );
}

function ActionButton({
  onClick,
  className,
  icon,
  label,
  fullWidth,
}: {
  onClick: () => void;
  className: string;
  icon: React.ReactNode;
  label: string;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl px-4 text-base font-bold transition active:scale-[0.98] ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBanner({
  message,
  compact,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <p
      className={`rounded-xl bg-brand-600 text-center font-semibold text-white ${
        compact ? "mt-2 px-3 py-2 text-sm" : "mt-4 px-4 py-3 text-base"
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
