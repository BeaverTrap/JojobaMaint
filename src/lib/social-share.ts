import { absoluteUrl } from "@/lib/site-url";

export function getFacebookGroupUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_FACEBOOK_GROUP_URL?.trim();
  return url || null;
}

/** Opens Facebook's share dialog with a link preview (user picks timeline or a group). */
export function facebookShareUrl(pageUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

/** Text staff can paste when creating a post inside the group. */
export function groupPostClipboardText(title: string, pageUrl: string): string {
  return `${title.trim()}\n\n${pageUrl}`;
}

export type ShareableContent = {
  path: string;
  title: string;
  description?: string | null;
};

export function shareUrlsFor(content: ShareableContent) {
  const pageUrl = absoluteUrl(content.path);
  return {
    pageUrl,
    facebook: facebookShareUrl(pageUrl),
    group: getFacebookGroupUrl(),
    clipboardText: groupPostClipboardText(
      content.title,
      pageUrl,
    ),
  };
}
