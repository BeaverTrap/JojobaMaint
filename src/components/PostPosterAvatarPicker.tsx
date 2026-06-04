"use client";

import Image from "next/image";
import {
  POST_POSTER_AVATARS,
  type PostPosterAvatarSlug,
} from "@/lib/post-avatars";

export default function PostPosterAvatarPicker({
  value,
  onChange,
}: {
  value: PostPosterAvatarSlug;
  onChange: (slug: PostPosterAvatarSlug) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center pl-1">
        <div className="flex -space-x-2" aria-hidden>
          {POST_POSTER_AVATARS.map((a) => (
            <Image
              key={a.slug}
              src={a.src}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full border-2 border-surface object-cover ring-1 ring-line"
            />
          ))}
        </div>
        <span className="ml-3 text-xs text-muted">Pick who posted this job</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {POST_POSTER_AVATARS.map((a) => {
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
    </div>
  );
}
