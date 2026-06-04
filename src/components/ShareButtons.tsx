"use client";

import { useState } from "react";
import {
  getFacebookGroupUrl,
  type ShareableContent,
} from "@/lib/social-share";

/**
 * Share controls for residents — readable labels, compact layout, dark-theme friendly.
 */
export default function ShareButtons({
  content,
  className = "",
  variant = "page",
}: {
  content: ShareableContent;
  className?: string;
  /** "page" = detail footer panel; "inline" = compact row on feed/index cards */
  variant?: "page" | "inline";
}) {
  const [status, setStatus] = useState<string | null>(null);
  const group = getFacebookGroupUrl();

  function flash(message: string) {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 4000);
  }

  function livePageUrl() {
    const p = content.path.startsWith("/") ? content.path : `/${content.path}`;
    return `${window.location.origin}${p}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(livePageUrl());
      flash("Copied! Open Facebook, start a post, and tap Paste.");
    } catch {
      flash("Tap and hold the address bar, then choose Copy.");
    }
  }

  function shareOnFacebook() {
    const url = livePageUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function shareInGroup() {
    const url = livePageUrl();
    const text = `${content.title.trim()}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
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
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 ${className}`}
        aria-label="Share with neighbors"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-medium tracking-wide text-muted">
          Share
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <ActionButton
            onClick={shareOnFacebook}
            size="inline"
            className="bg-[#1877F2] text-white hover:bg-[#166FE5]"
            icon={<FacebookIcon size={14} />}
            label="Facebook"
          />
          <ActionButton
            onClick={copyLink}
            size="inline"
            className="border border-line bg-surface text-ink hover:bg-hover"
            icon={<CopyIcon size={14} />}
            label="Copy link"
          />
          {group && (
            <ActionButton
              onClick={shareInGroup}
              size="inline"
              className="border border-brand-700/40 bg-surface text-brand-300 hover:bg-hover dark:border-brand-600/50"
              icon={<FacebookIcon size={14} />}
              label="Group"
            />
          )}
        </div>
        {status && <StatusBanner message={status} compact />}
      </div>
    );
  }

  return (
    <section
      className={`rounded-xl border border-line bg-surface px-4 py-4 ${className}`}
      aria-label="Share with neighbors"
    >
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h2 className="text-sm font-semibold text-ink">Share with neighbors</h2>
        <p className="text-xs leading-relaxed text-muted sm:max-w-[55%] sm:text-right">
          Post on Facebook or copy the link for messages or the community group.
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ActionButton
          onClick={shareOnFacebook}
          size="page"
          className="bg-[#1877F2] text-white hover:bg-[#166FE5] sm:flex-1 sm:min-w-[10rem]"
          icon={<FacebookIcon size={16} />}
          label="Share on Facebook"
        />
        <ActionButton
          onClick={copyLink}
          size="page"
          className="border border-line bg-hover/50 text-ink hover:bg-hover sm:flex-1 sm:min-w-[10rem]"
          icon={<CopyIcon size={16} />}
          label="Copy link"
        />
        {group && (
          <ActionButton
            onClick={shareInGroup}
            size="page"
            className="border border-brand-700/35 bg-hover/30 text-brand-300 hover:bg-hover dark:border-brand-600/45 sm:w-full"
            icon={<FacebookIcon size={16} />}
            label="Post in our Facebook group"
          />
        )}
      </div>

      {status && <StatusBanner message={status} />}

      {group ? (
        <details className="group mt-3 rounded-lg border border-line/80 bg-hover/30 px-3 py-2">
          <summary className="cursor-pointer list-none text-xs font-medium text-muted marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="text-ink/90 group-open:hidden">
              How to post in the group
            </span>
            <span className="hidden text-ink/90 group-open:inline">
              Hide steps
            </span>
          </summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted">
            <li>
              Tap <strong className="font-medium text-ink/90">Post in our Facebook group</strong>{" "}
              (we copy the link for you).
            </li>
            <li>
              In Facebook, tap <strong className="font-medium text-ink/90">Write something…</strong>
            </li>
            <li>
              Press and hold in the box, then tap{" "}
              <strong className="font-medium text-ink/90">Paste</strong>
            </li>
          </ol>
        </details>
      ) : (
        <p className="mt-3 text-xs text-muted">
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
  size,
}: {
  onClick: () => void;
  className: string;
  icon: React.ReactNode;
  label: string;
  size: "page" | "inline";
}) {
  const sizeClasses =
    size === "inline"
      ? "min-h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
      : "min-h-9 w-full gap-2 rounded-lg px-3 text-sm font-medium sm:w-auto";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center transition active:scale-[0.99] ${sizeClasses} ${className}`}
    >
      {icon}
      <span>{label}</span>
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
      className={`rounded-lg border border-brand-600/30 bg-brand-900/40 text-brand-200 ${
        compact
          ? "mt-1.5 w-full basis-full px-2.5 py-1.5 text-xs"
          : "mt-3 px-3 py-2 text-sm"
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className="shrink-0"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
