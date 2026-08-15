"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * AvatarDecoration
 * -----------------
 * A Discord-style animated avatar decoration: the avatar photo itself never
 * changes — it stays static, full brightness, full size. Only the decorative
 * frame (triangle → circle) animates around it.
 *
 * Sequence: idle → triangle emerges → bounce → triangle tumbles/grows over
 * the avatar → contracts back → moves behind the avatar → dissolves into a
 * circular frame → idle → repeat.
 */

const CONFIG = {
  // Geometry
  triangleStrokeWidth: 2,
  circleStrokeWidth: 1.5,
  triangleInset: 0.62,
  circleInset: 0.9,

  // Crisp, flat color — no blur/glow. Clean lines only, like a Discord frame.
  baseColor: "rgba(255,255,255,0.95)",
  baseOpacityIdle: 0.85,
  baseOpacityActive: 1,

  // Visibly tinted edges (green / cyan-blue / white)
  edgeColors: ["#8CFFC0", "#8FD6FF", "#F2F2F2"] as [string, string, string],
  edgeOpacity: 0.9,

  // Cumulative rotation target (deg) per phase — always increasing so the
  // transition reads as one continuous tumble, not a snap-back.
  rotation: {
    idle: 0,
    emerge: 0,
    bounce: 24,
    swallow: 372,
    returnAvatar: 372,
    behind: 392,
    morph: 392,
  },

  // Timing (ms)
  timing: {
    emerge: 550,
    bounce: 480,
    swallow: 1000,
    returnAvatar: 650,
    moveBehind: 500,
    morph: 900,
    settle: 350,
  },

  // Easing
  easeBounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  easeSmooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeTumble: "cubic-bezier(0.65, 0, 0.35, 1)",

  idleRotationSeconds: 40,
  defaultCycleDuration: 150_000,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Accepts a plain path/URL string, OR a Next.js static image import
 * (`import avatar from "./avatar.png"`), which is an object with a `src`
 * field rather than a string.
 */
export type ImageSource = string | { src: string };

export interface AvatarDecorationProps {
  src: ImageSource;
  alt?: string;
  size?: number;
  /** Total time between the start of one animation cycle and the next. */
  cycleDuration?: number;
  className?: string;
}

type Phase =
  | "idle"
  | "emerge"
  | "bounce"
  | "swallow"
  | "return"
  | "behind"
  | "morph";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resolveSrc(src: ImageSource): string {
  return typeof src === "string" ? src : src?.src ?? "";
}

function trianglePoints(cx: number, cy: number, r: number, rotationDeg = -90) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const angle = ((rotationDeg + i * 120) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AvatarDecoration({
  src,
  alt = "",
  size = 96,
  cycleDuration = CONFIG.defaultCycleDuration,
  className,
}: AvatarDecorationProps) {
  const resolvedSrc = resolveSrc(src);
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const activeDuration = useMemo(
    () => Object.values(CONFIG.timing).reduce((a, b) => a + b, 0),
    []
  );

  useEffect(() => {
    if (reducedMotion) return;

    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const t = CONFIG.timing;
    const schedule = (delay: number, fn: () => void) =>
      timers.current.push(setTimeout(fn, delay));

    const runCycle = () => {
      let elapsed = 0;
      schedule((elapsed += 0), () => setPhase("emerge"));
      schedule((elapsed = t.emerge), () => setPhase("bounce"));
      schedule((elapsed += t.bounce), () => setPhase("swallow"));
      schedule((elapsed += t.swallow), () => setPhase("return"));
      schedule((elapsed += t.returnAvatar), () => setPhase("behind"));
      schedule((elapsed += t.moveBehind), () => setPhase("morph"));
      schedule((elapsed += t.morph + t.settle), () => setPhase("idle"));

      const idleGap = Math.max(cycleDuration - activeDuration, 1000);
      schedule(activeDuration + idleGap, runCycle);
    };

    runCycle();
    return clearAll;
  }, [cycleDuration, activeDuration, reducedMotion]);

  // ---- geometry ----
  const box = size * 1.9;
  const cx = box / 2;
  const cy = box / 2;
  const avatarR = size / 2;
  const triR = avatarR / CONFIG.triangleInset;
  const circleR = avatarR / CONFIG.circleInset;

  const pts = trianglePoints(cx, cy, triR);
  const trianglePath = `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]} L ${pts[2][0]} ${pts[2][1]} Z`;

  // ---- phase-derived visual state (decoration only — avatar never changes) ----
  const showTriangle = phase !== "idle";
  const triangleBehind = phase === "behind" || phase === "morph";
  const triangleScale =
    phase === "emerge"
      ? 0.82
      : phase === "bounce"
      ? 1.05
      : phase === "swallow"
      ? 1.6
      : phase === "return"
      ? 1
      : phase === "behind"
      ? 0.9
      : phase === "morph"
      ? 0.9
      : 1;
  const rotationDeg =
    CONFIG.rotation[phase === "return" ? "returnAvatar" : phase] ?? 0;
  const transformDuration =
    phase === "bounce"
      ? CONFIG.timing.bounce
      : phase === "swallow"
      ? CONFIG.timing.swallow
      : phase === "emerge"
      ? CONFIG.timing.emerge
      : 450;
  const triangleOpacity = phase === "morph" ? 0 : showTriangle ? 1 : 0;
  const baseOpacity =
    phase === "swallow" ? CONFIG.baseOpacityActive : CONFIG.baseOpacityIdle;

  const circleVisible = phase === "morph" || phase === "idle";
  const circleScale = circleVisible ? 1 : 0.92;

  const staticDecoration = reducedMotion;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: box,
        height: box,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          animation: staticDecoration
            ? undefined
            : `avatar-deco-idle-spin ${CONFIG.idleRotationSeconds}s linear infinite`,
        }}
      >
        {/* Triangle (drawn behind or in front of the avatar depending on phase) */}
        {!staticDecoration && (
          <g
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `rotate(${rotationDeg}deg) scale(${triangleScale})`,
              transition: `transform ${transformDuration}ms ${
                phase === "swallow" ? CONFIG.easeTumble : CONFIG.easeBounce
              }`,
              opacity: triangleOpacity,
            }}
          >
            <path
              d={trianglePath}
              fill="none"
              stroke={CONFIG.baseColor}
              strokeWidth={CONFIG.triangleStrokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={baseOpacity}
            />
            {/* visibly tinted edges (green / cyan-blue / white) */}
            {[0, 1, 2].map((i) => {
              const [x1, y1] = pts[i];
              const [x2, y2] = pts[(i + 1) % 3];
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={CONFIG.edgeColors[i]}
                  strokeWidth={CONFIG.triangleStrokeWidth * 0.55}
                  strokeLinecap="round"
                  opacity={CONFIG.edgeOpacity}
                />
              );
            })}
          </g>
        )}

        {/* Resting / morphed circle */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `scale(${staticDecoration ? 1 : circleScale})`,
            opacity: staticDecoration || circleVisible ? 1 : 0,
            transition: `opacity ${CONFIG.timing.morph}ms ${CONFIG.easeSmooth}, transform ${CONFIG.timing.morph}ms ${CONFIG.easeSmooth}`,
          }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={circleR}
            fill="none"
            stroke={CONFIG.baseColor}
            strokeWidth={CONFIG.circleStrokeWidth}
            opacity={CONFIG.baseOpacityIdle}
          />
        </g>
      </svg>

      {/* Avatar — always static: no scale, no darken, no movement */}
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          zIndex: triangleBehind ? 2 : 1,
        }}
      >
        <img
          src={resolvedSrc}
          alt={alt}
          width={size}
          height={size}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <style>{`
        @keyframes avatar-deco-idle-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .avatar-decoration * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}

export default AvatarDecoration;