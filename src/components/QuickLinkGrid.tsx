import Link from "next/link";
import { MascotScene } from "@/components/Brand";
import { REQUEST_NAV, isExternalHref } from "@/lib/nav-links";
import type { MascotSceneId } from "@/lib/mascot-scenes";

const QUICK_LINKS: {
  href: string;
  label: string;
  description: string;
  scene: MascotSceneId;
  mascotSize?: number;
  mascotSide?: "left" | "right";
  /** Override the absolute position classes for a custom crop. */
  mascotClassName?: string;
  /** Stronger green tint to set this card apart (e.g. the request CTA). */
  featured?: boolean;
  /** Accent the card with a distinct green border (no background tint change). */
  greenBorder?: boolean;
  external?: boolean;
}[] = [
  {
    href: "/feed",
    label: "Feed",
    description: "Posts, guides, and assessments",
    scene: "reading",
    mascotSide: "right",
    mascotSize: 184,
    mascotClassName: "-right-5 -bottom-14 origin-bottom-right group-hover:-rotate-2",
  },
  {
    href: "/schedule",
    label: "Schedule",
    description: "Maintenance calendar",
    scene: "calendar",
    mascotSize: 184,
    mascotClassName: "-left-5 -bottom-9 origin-bottom-left group-hover:rotate-2",
  },
  {
    href: "/water",
    label: "Water",
    description: "Monthly usage reports",
    scene: "water",
    mascotSide: "right",
    mascotSize: 196,
    mascotClassName: "-right-4 -bottom-16 origin-bottom-right group-hover:-rotate-2",
  },
  {
    href: "/weather",
    label: "Weather & Sky",
    description: "Forecast and desert sky astronomy",
    scene: "telescope",
    mascotSize: 176,
    mascotClassName: "-left-4 -bottom-6 origin-bottom-left group-hover:rotate-2",
  },
  {
    href: "/map",
    label: "Maintenance map",
    description: "Valves, transformers, and lots",
    scene: "map",
    mascotSize: 188,
    mascotClassName: "-left-5 -bottom-14 origin-bottom-left group-hover:rotate-2",
  },
  {
    href: "/sites",
    label: "Site directory",
    description: "Lots, profiles, and details",
    scene: "search",
    mascotSide: "right",
    mascotSize: 188,
    mascotClassName: "-right-4 -bottom-14 origin-bottom-right group-hover:-rotate-2",
  },
  {
    href: "/pickup-guidelines",
    label: "Pickup guidelines",
    description: "Green waste rules and schedule",
    scene: "pickup",
    mascotSize: 190,
    mascotClassName: "-left-5 -bottom-9 origin-bottom-left group-hover:rotate-2",
    greenBorder: true,
  },
  {
    href: REQUEST_NAV.href,
    label: "Submit request",
    description: "Maintenance & landscaping requests",
    scene: "hardhat",
    mascotSide: "right",
    mascotSize: 230,
    mascotClassName: "-right-12 -bottom-20 origin-bottom-right group-hover:-rotate-2",
    featured: true,
    external: REQUEST_NAV.external,
  },
];

export default function QuickLinkGrid() {
  return (
    <section aria-labelledby="home-quick-links-heading" className="space-y-3">
      <h2
        id="home-quick-links-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted"
      >
        Where to go
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => {
          const onRight = link.mascotSide === "right";
          const size = link.mascotSize ?? 128;
          const baseCard =
            "motion-card group relative flex h-[132px] overflow-hidden rounded-2xl border shadow-[0_2px_8px_rgba(20,50,35,0.10)] transition dark:shadow-sm dark:hover:bg-hover";
          const toneCard = link.featured
            ? "border-brand-400 bg-gradient-to-br from-brand-100 to-brand-50 hover:border-brand-500 hover:shadow-[0_6px_20px_rgba(20,80,45,0.22)] dark:border-brand-700 dark:from-brand-950 dark:to-surface dark:hover:border-brand-500"
            : link.greenBorder
              ? "border-2 border-brand-500 bg-gradient-to-br from-white to-brand-50 hover:border-brand-600 hover:shadow-[0_6px_18px_rgba(20,50,35,0.18)] dark:border-brand-600 dark:from-surface dark:to-surface dark:hover:border-brand-400"
              : "border-brand-200/70 bg-gradient-to-br from-white to-brand-50 hover:border-brand-400 hover:shadow-[0_6px_18px_rgba(20,50,35,0.16)] dark:border-line dark:from-surface dark:to-surface dark:hover:border-brand-300";
          const className = `${baseCard} ${toneCard}`;

          const overlayFrom = link.featured
            ? "from-brand-100 dark:from-brand-950"
            : "from-white dark:from-surface";
          const overlayVia = link.featured
            ? "via-brand-100/55 dark:via-surface/80"
            : "via-white/55 dark:via-surface/80";

          const content = (
            <>
              <MascotScene
                scene={link.scene}
                size={size}
                className={`pointer-events-none absolute z-0 transition-transform duration-300 ease-out group-hover:scale-105 ${
                  link.mascotClassName ??
                  (onRight
                    ? "-right-3 -bottom-3 origin-bottom-right group-hover:-rotate-2"
                    : "-left-3 -bottom-3 origin-bottom-left group-hover:rotate-2")
                }`}
              />
              <span
                aria-hidden
                className={`absolute inset-0 z-[1] ${
                  onRight ? "bg-gradient-to-r" : "bg-gradient-to-l"
                } ${overlayFrom} from-40% ${overlayVia} to-transparent to-80%`}
              />
              <span
                className={`relative z-10 flex w-full min-w-0 flex-col justify-center p-4 ${
                  onRight ? "items-start pr-24 text-left" : "items-end pl-28 text-right"
                }`}
              >
                <span className="block font-semibold text-ink">
                  {link.label}
                </span>
                <span className="mt-0.5 block text-sm text-muted">
                  {link.description}
                </span>
              </span>
            </>
          );

          if (link.external && isExternalHref(link.href)) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={link.href} href={link.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
