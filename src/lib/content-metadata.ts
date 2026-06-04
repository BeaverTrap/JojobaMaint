import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export function buildContentMetadata({
  title,
  description,
  path,
  imageUrl,
}: {
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
}): Metadata {
  const desc =
    description?.trim().slice(0, 200) ||
    "Jojoba Hills Maintenance — public logbook and park information.";
  const url = absoluteUrl(path);

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      type: "article",
      siteName: "Jojoba Hills Maintenance",
      ...(imageUrl ? { images: [{ url: imageUrl, alt: title }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description: desc,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
