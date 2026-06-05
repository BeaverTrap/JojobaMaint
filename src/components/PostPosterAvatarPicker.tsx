"use client";

import Image from "next/image";
import {
  posterAvatarsForTeam,
  type PosterTeam,
  type PostPosterAvatarSlug,
} from "@/lib/post-avatars";

export default function PostPosterAvatarPicker({
  value,
  onChange,
  team = "all",
}: {
  value: PostPosterAvatarSlug;
  onChange: (slug: PostPosterAvatarSlug) => void;
  /** Maintenance = hard hat (odd). Landscaping = sun hat (even). All = articles. */
  team?: PosterTeam | "all";
}) {
  const options =
    team === "all"
      ? [...posterAvatarsForTeam("maintenance"), ...posterAvatarsForTeam("landscaping")]
      : posterAvatarsForTeam(team);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((a) => {
        const selected = value === a.slug;
        return (
          <button
            key={a.slug}
            type="button"
            title={a.label}
            onClick={() => onChange(a.slug)}
            className={
              selected
                ? "rounded-full ring-2 ring-brand-600 ring-offset-2 ring-offset-surface"
                : "rounded-full opacity-70 transition hover:opacity-100"
            }
          >
            <Image
              src={a.src}
              alt={a.label}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}
