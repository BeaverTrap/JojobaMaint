import type { ReactNode } from "react";
import { MascotScene } from "@/components/Brand";
import type { MascotSceneId } from "@/lib/mascot-scenes";

type PageMascotHeadingProps = {
  scene: MascotSceneId;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Larger, dominant mascot + heading — used on the home dashboard. */
  prominent?: boolean;
};

/** Page title row with the quail scene illustration — always visible, not only on empty states. */
export default function PageMascotHeading({
  scene,
  title,
  description,
  children,
  prominent = false,
}: PageMascotHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div
        className={`flex min-w-0 items-center ${
          prominent ? "gap-4 sm:gap-6" : "items-start gap-3 sm:gap-4"
        }`}
      >
        {prominent ? (
          <>
            <MascotScene
              scene={scene}
              size={132}
              className="shrink-0 drop-shadow-md sm:hidden"
            />
            <MascotScene
              scene={scene}
              size={176}
              className="hidden shrink-0 drop-shadow-md sm:block"
            />
          </>
        ) : (
          <>
            <MascotScene
              scene={scene}
              size={80}
              className="shrink-0 drop-shadow-sm sm:hidden"
            />
            <MascotScene
              scene={scene}
              size={96}
              className="hidden shrink-0 drop-shadow-sm sm:block"
            />
          </>
        )}
        <div className={`min-w-0 ${prominent ? "" : "pt-1"}`}>
          <h1
            className={`font-bold tracking-tight text-ink ${
              prominent ? "text-2xl sm:text-4xl" : "text-xl"
            }`}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={`text-muted ${prominent ? "mt-1.5 text-sm sm:text-base" : "mt-1 text-sm"}`}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
