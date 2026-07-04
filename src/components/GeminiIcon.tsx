import Image from "next/image";

const GEMINI_LOGO_SRC = "/assets/google-gemini.svg";

/** Official Google Gemini mark from /public/assets/google-gemini.svg */
export default function GeminiIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Image
      src={GEMINI_LOGO_SRC}
      alt=""
      width={16}
      height={16}
      unoptimized
      aria-hidden
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
