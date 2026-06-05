/** Preset crew icons for feed posts — PNGs in public/avatars/. */

export const POST_POSTER_AVATARS = [
  { slug: "crew-1", label: "Crew 1", src: "/avatars/crew-1.png" },
  { slug: "crew-2", label: "Crew 2", src: "/avatars/crew-2.png" },
  { slug: "crew-3", label: "Crew 3", src: "/avatars/crew-3.png" },
  { slug: "crew-4", label: "Crew 4", src: "/avatars/crew-4.png" },
  { slug: "crew-5", label: "Crew 5", src: "/avatars/crew-5.png" },
  { slug: "crew-6", label: "Crew 6", src: "/avatars/crew-6.png" },
  { slug: "crew-7", label: "Crew 7", src: "/avatars/crew-7.png" },
  { slug: "crew-8", label: "Crew 8", src: "/avatars/crew-8.png" },
  { slug: "crew-9", label: "Crew 9", src: "/avatars/crew-9.png" },
  { slug: "crew-10", label: "Crew 10", src: "/avatars/crew-10.png" },
] as const;

export type PostPosterAvatarSlug = (typeof POST_POSTER_AVATARS)[number]["slug"];

export const DEFAULT_POST_POSTER_AVATAR: PostPosterAvatarSlug = "crew-1";

export function isPostPosterAvatarSlug(
  value: string,
): value is PostPosterAvatarSlug {
  return POST_POSTER_AVATARS.some((a) => a.slug === value);
}

export function resolvePostPosterAvatar(slug: string | null | undefined) {
  if (slug && isPostPosterAvatarSlug(slug)) {
    return POST_POSTER_AVATARS.find((a) => a.slug === slug)!;
  }
  return POST_POSTER_AVATARS[0];
}
