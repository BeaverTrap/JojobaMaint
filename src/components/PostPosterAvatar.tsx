import Image from "next/image";
import { resolvePostPosterAvatar } from "@/lib/post-avatars";

export default function PostPosterAvatar({
  slug,
  size = 36,
  className = "",
}: {
  slug: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const avatar = resolvePostPosterAvatar(slug);
  return (
    <Image
      src={avatar.src}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      aria-hidden
    />
  );
}
