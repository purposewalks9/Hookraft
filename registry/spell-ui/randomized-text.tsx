"use client";

import { motion, useInView } from "motion/react";
import { useMemo, useRef } from "react";

type SplitType = "words" | "chars";

interface RandomizedTextProps {
  children: string;
  className?: string;
  split?: SplitType;
  delay?: number;
  inView?: boolean;
}

export function RandomizedText({
  children,
  className = "",
  split = "words",
  delay = 0.2,
  inView = false,
}: RandomizedTextProps) {
  const ref = useRef(null);
  const viewportInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldAnimate = inView ? viewportInView : true;

  const expoOut = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  const elements = useMemo(() => {
    if (split === "chars") {
      return children.split("").map((char, i) => ({
        content: char === " " ? "\u00A0" : char,
        key: `char-${i}`,
      }));
    }
    return children.split(" ").map((word, i) => ({
      content: word,
      key: `word-${i}`,
    }));
  }, [children, split]);

  const randomizedDelays = useMemo(() => {
    return elements.map(() =>
      delay + Math.random() * 0.2 + Math.random() * 0.03
    );
  }, [elements.length, delay]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={children}
      style={{ display: "inline-block", wordBreak: "break-word" }}
    >
      {elements.map((element, i) => (
        <motion.span
          key={element.key}
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: 1.2,
            delay: randomizedDelays[i],
            ease: expoOut,
          }}
          style={{ display: split === "words" ? "inline-block" : "inline" }}
          className={split === "words" ? "mr-[0.25em]" : ""}
        >
          {element.content}
        </motion.span>
      ))}
    </span>
  );
}
