/** Preset crew icons for feed posts — add matching files under public/avatars/. */

export const POST_POSTER_AVATARS = [
  { slug: "crew-1", label: "Crew 1", src: "/avatars/crew-1.svg" },
  { slug: "crew-2", label: "Crew 2", src: "/avatars/crew-2.svg" },
  { slug: "crew-3", label: "Crew 3", src: "/avatars/crew-3.svg" },
  { slug: "crew-4", label: "Crew 4", src: "/avatars/crew-4.svg" },
  { slug: "crew-5", label: "Crew 5", src: "/avatars/crew-5.svg" },
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
