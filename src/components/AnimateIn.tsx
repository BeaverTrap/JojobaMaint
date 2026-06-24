"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

export type MotionVariant = "fade-up" | "fade" | "scale" | "slide-down";

type AnimateInProps = {
  children: ReactNode;
  className?: string;
  variant?: MotionVariant;
  /** Stagger delay in ms */
  delay?: number;
  /** Run animation only the first time the element enters the viewport */
  once?: boolean;
};

function motionClass(variant: MotionVariant, visible: boolean): string {
  if (!visible) return "motion-pending";
  switch (variant) {
    case "fade":
      return "motion-fade-in";
    case "scale":
      return "motion-scale-in";
    case "slide-down":
      return "motion-slide-down";
    case "fade-up":
    default:
      return "motion-fade-up";
  }
}

export default function AnimateIn({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
  once = true,
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        if (once) observer.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const style: CSSProperties | undefined =
    delay > 0 ? { animationDelay: `${delay}ms` } : undefined;

  return (
    <div
      ref={ref}
      className={`${motionClass(variant, visible)} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
