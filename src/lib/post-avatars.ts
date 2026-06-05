/** Preset crew quail icons — register each PNG in public/avatars/ here. */

export type PosterTeam = "maintenance" | "landscaping";

export const POST_POSTER_AVATARS = [
  {
    slug: "maintenance-sky",
    team: "maintenance",
    label: "Hard hat · light blue",
    src: "/avatars/maintenance-sky.png",
  },
  {
    slug: "landscaping-sky",
    team: "landscaping",
    label: "Sun hat · light blue",
    src: "/avatars/landscaping-sky.png",
  },
  {
    slug: "maintenance-red",
    team: "maintenance",
    label: "Hard hat · red",
    src: "/avatars/maintenance-red.png",
  },
  {
    slug: "landscaping-red",
    team: "landscaping",
    label: "Sun hat · red",
    src: "/avatars/landscaping-red.png",
  },
  {
    slug: "maintenance-navy",
    team: "maintenance",
    label: "Hard hat · navy",
    src: "/avatars/maintenance-navy.png",
  },
  {
    slug: "landscaping-navy",
    team: "landscaping",
    label: "Sun hat · navy",
    src: "/avatars/landscaping-navy.png",
  },
  {
    slug: "maintenance-green",
    team: "maintenance",
    label: "Hard hat · green",
    src: "/avatars/maintenance-green.png",
  },
  {
    slug: "landscaping-green",
    team: "landscaping",
    label: "Sun hat · green",
    src: "/avatars/landscaping-green.png",
  },
  {
    slug: "maintenance-olive",
    team: "maintenance",
    label: "Hard hat · olive",
    src: "/avatars/maintenance-olive.png",
  },
  {
    slug: "landscaping-olive",
    team: "landscaping",
    label: "Sun hat · olive",
    src: "/avatars/landscaping-olive.png",
  },
] as const;

export type PostPosterAvatarSlug = (typeof POST_POSTER_AVATARS)[number]["slug"];

/** Old crew-N slugs from before rename — still resolve for existing DB rows. */
const LEGACY_SLUG_MAP: Record<string, PostPosterAvatarSlug> = {
  "crew-1": "maintenance-sky",
  "crew-2": "landscaping-sky",
  "crew-3": "maintenance-red",
  "crew-4": "landscaping-red",
  "crew-5": "maintenance-navy",
  "crew-6": "landscaping-navy",
  "crew-7": "maintenance-green",
  "crew-8": "landscaping-green",
  "crew-9": "maintenance-olive",
  "crew-10": "landscaping-olive",
};

export function posterAvatarsForTeam(team: PosterTeam) {
  return POST_POSTER_AVATARS.filter((a) => a.team === team);
}

export function defaultPosterAvatarForTeam(
  team: PosterTeam,
): PostPosterAvatarSlug {
  return posterAvatarsForTeam(team)[0].slug;
}

export function isPostPosterAvatarSlug(
  value: string,
): value is PostPosterAvatarSlug {
  return POST_POSTER_AVATARS.some((a) => a.slug === value);
}

export function normalizePosterAvatarSlug(
  slug: string | null | undefined,
): PostPosterAvatarSlug | null {
  if (!slug) return null;
  if (isPostPosterAvatarSlug(slug)) return slug;
  return LEGACY_SLUG_MAP[slug] ?? null;
}

export function resolvePostPosterAvatar(slug: string | null | undefined) {
  const normalized = normalizePosterAvatarSlug(slug);
  if (normalized) {
    return POST_POSTER_AVATARS.find((a) => a.slug === normalized)!;
  }
  return POST_POSTER_AVATARS[0];
}

/** @deprecated Use defaultPosterAvatarForTeam */
export const DEFAULT_POST_POSTER_AVATAR: PostPosterAvatarSlug =
  "maintenance-sky";
