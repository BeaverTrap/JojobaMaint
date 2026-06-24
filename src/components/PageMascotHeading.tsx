import type { ReactNode } from "react";
import { MascotScene } from "@/components/Brand";
import type { MascotSceneId } from "@/lib/mascot-scenes";

type PageMascotHeadingProps = {
  scene: MascotSceneId;
  title: string;
  description?: string;
  children?: ReactNode;
};

/** Page title row with the quail scene illustration — always visible, not only on empty states. */
export default function PageMascotHeading({
  scene,
  title,
  description,
  children,
}: PageMascotHeadingProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <MascotScene
          scene={scene}
          size={80}
          animate
          className="shrink-0 drop-shadow-sm sm:hidden"
        />
        <MascotScene
          scene={scene}
          size={96}
          animate
          className="hidden shrink-0 drop-shadow-sm sm:block"
        />
        <div className="min-w-0 pt-1">
          <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
