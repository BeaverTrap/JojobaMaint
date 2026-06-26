import type { NasaApod } from "@/lib/sky/types";

type ApodResponse = {
  title?: string;
  date?: string;
  explanation?: string;
  url?: string;
  hdurl?: string;
  media_type?: string;
  thumbnail_url?: string;
  copyright?: string;
};

/**
 * NASA Astronomy Picture of the Day.
 * Uses NASA_API_KEY when set, otherwise the shared DEMO_KEY (rate-limited).
 */
export async function fetchNasaApod(): Promise<NasaApod | null> {
  const key = process.env.NASA_API_KEY?.trim() || "DEMO_KEY";
  const url = new URL("https://api.nasa.gov/planetary/apod");
  url.searchParams.set("api_key", key);
  url.searchParams.set("thumbs", "true");

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`NASA image of the day unavailable (${res.status})`);
  }

  const json = (await res.json()) as ApodResponse;

  const isVideo = json.media_type === "video";
  const imageUrl = isVideo
    ? json.thumbnail_url ?? json.url ?? null
    : json.url ?? null;

  if (!imageUrl) {
    return null;
  }

  return {
    title: json.title ?? "NASA Astronomy Picture of the Day",
    date: json.date ?? null,
    explanation: json.explanation ?? "",
    imageUrl,
    hdUrl: json.hdurl ?? null,
    mediaType: isVideo ? "video" : "image",
    sourceUrl: isVideo ? json.url ?? null : json.hdurl ?? json.url ?? null,
    copyright: json.copyright?.trim() || null,
  };
}
