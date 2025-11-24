"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import opentype from "opentype.js";

export function Signature({
  text = "Signature",
  color = "#000",
  fontSize = 14,
  duration = 1.5,
  className,
  inView = false,
}: {
  text?: string;
  color?: string;
  fontSize?: number;
  duration?: number;
  className?: string;
  inView?: boolean;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [width, setWidth] = useState<number>(300);
  const height = 100;
  const horizontalPadding = fontSize * 0.1;
  const topMargin = Math.max(5, (height - fontSize) / 2);
  const baseline = Math.min(height - 5, topMargin + fontSize);
  const maskId = `signature-reveal-${useId().replace(/:/g, "")}`;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldAnimate = inView ? isInView : true;

  useEffect(() => {
    async function load() {
      try {
        // Try multiple paths to ensure font loads correctly
        let font;
        const fontPaths = [
          "/LastoriaBoldRegular.otf",
          "./LastoriaBoldRegular.otf",
          `${window.location.origin}/LastoriaBoldRegular.otf`,
        ];

        for (const path of fontPaths) {
          try {
            font = await opentype.load(path);
            break;
          } catch (e) {
            console.log(`Failed to load font from ${path}, trying next...`);
          }
        }

        if (!font) {
          throw new Error("Font could not be loaded from any path");
        }

        let x = horizontalPadding;
        const newPaths: string[] = [];

        for (const char of text) {
          const glyph = font.charToGlyph(char);
          const path = glyph.getPath(x, baseline, fontSize);
          newPaths.push(path.toPathData(3));

          const advanceWidth = glyph.advanceWidth ?? font.unitsPerEm;
          x += advanceWidth * (fontSize / font.unitsPerEm);
        }

        setPaths(newPaths);
        setWidth(x + horizontalPadding);
      } catch (error) {
        console.error("Failed to load font:", error);
        // Set fallback text path if font fails to load
        setPaths([]);
        setWidth(text.length * fontSize * 0.6);
      }
    }

    load();
  }, [text, fontSize, baseline, horizontalPadding]);

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {paths.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="white"
              strokeWidth={fontSize * 0.22}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={shouldAnimate
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: 0, opacity: 0 }}
              transition={{
                pathLength: {
                  delay: i * 0.2,
                  duration,
                  ease: "easeInOut",
                },
                opacity: {
                  delay: i * 0.2 + 0.01,
                  duration: 0.01,
                },
              }}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </mask>
      </defs>

      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={2}
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: {
              delay: i * 0.2,
              duration,
              ease: "easeInOut",
            },
            opacity: {
              delay: i * 0.2 + 0.01,
              duration: 0.01,
            },
          }}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      ))}

      <g mask={`url(#${maskId})`}>
        {paths.map((d, i) => <path key={i} d={d} fill={color} />)}
      </g>
    </svg>
  );
}
