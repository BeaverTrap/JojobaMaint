import Image from "next/image";

/**
 * Cover photos — no stretching. Card = list teaser; hero = detail top; thumb = form preview.
 */
export default function ContentCoverImage({
  src,
  alt = "",
  variant = "hero",
  priority = false,
}: {
  src: string;
  alt?: string;
  variant?: "hero" | "card" | "thumb";
  priority?: boolean;
}) {
  if (variant === "card") {
    return (
      <div className="relative aspect-[16/9] w-full shrink-0 bg-canvas">
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 640px"
        />
      </div>
    );
  }

  if (variant === "thumb") {
    return (
      <div className="relative mt-2 h-36 w-full max-w-xs overflow-hidden rounded-xl border border-line bg-canvas sm:w-64">
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className="object-contain object-center p-1"
          sizes="256px"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line bg-canvas">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        className="object-contain object-center p-0.5"
        sizes="(max-width: 768px) 100vw, 720px"
      />
    </div>
  );
}
