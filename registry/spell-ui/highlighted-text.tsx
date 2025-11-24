"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type From = "left" | "right" | "top" | "bottom";

interface HighlightedTextProps {
  children: React.ReactNode;
  className?: string;
  from?: From;
  delay?: number;
  inView?: boolean;
}

const fromVariants = {
  left: {
    initial: { x: "-100%" },
    animate: { x: "0%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: "0%" },
  },
  top: {
    initial: { y: "-100%" },
    animate: { y: "0%" },
  },
  bottom: {
    initial: { y: "100%" },
    animate: { y: "0%" },
  },
};

export function HighlightedText({
  children,
  className,
  from = "bottom",
  delay = 0,
  inView = false,
}: HighlightedTextProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const shouldAnimate = inView ? isInView : true;

  const variants = fromVariants[from];

  return (
    <span
      ref={containerRef}
      className={cn(
        "relative inline-flex overflow-hidden align-baseline",
        className,
      )}
    >
      <motion.span
        className="absolute inset-0 -left-[0.15em] -right-[0.18em] bg-black dark:bg-white z-0"
        initial={variants.initial}
        animate={shouldAnimate ? variants.animate : variants.initial}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
          delay,
        }}
      />
      <span className="relative z-10 mix-blend-difference text-white pl-[0.15em] pr-[0.18em]">
        {children}
      </span>
    </span>
  );
}

export default HighlightedText;
