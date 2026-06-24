import type { ReactNode } from "react";
import AnimateIn from "@/components/AnimateIn";
import { MascotScene } from "@/components/Brand";
import type { MascotSceneId } from "@/lib/mascot-scenes";

type MascotEmptyStateProps = {
  scene: MascotSceneId;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function MascotEmptyState({
  scene,
  title,
  description,
  children,
}: MascotEmptyStateProps) {
  return (
    <AnimateIn variant="scale">
      <div className="rounded-2xl border border-dashed border-line bg-gradient-to-b from-brand-50/60 to-surface px-6 py-10 text-center dark:from-brand-950/30 dark:to-surface">
        <MascotScene scene={scene} size={128} animate className="mx-auto" />
        <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </AnimateIn>
  );
}
