"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useSound } from "@hookraft/use-sound";

type Color =
  | "default" | "blue" | "purple" | "pink" | "red" | "orange" | "yellow"
  | "green" | "teal" | "cyan" | "indigo" | "violet" | "rose" | "amber"
  | "lime" | "sky" | "slate" | "gray" | "zinc" | "neutral" | "stone"
  | "fuchsia" | "emerald";

const bgColorMap: Record<Color, string> = {
  default: "from-zinc-900/85 to-zinc-900 dark:from-zinc-100/85 dark:to-zinc-100",
  emerald: "from-emerald-600/85 to-emerald-600",
  blue: "from-blue-600/85 to-blue-600",
  purple: "from-purple-600/85 to-purple-600",
  pink: "from-pink-600/85 to-pink-600",
  red: "from-red-600/85 to-red-600",
  orange: "from-orange-600/85 to-orange-600",
  yellow: "from-yellow-600/85 to-yellow-600",
  green: "from-green-600/85 to-green-600",
  teal: "from-teal-600/85 to-teal-600",
  cyan: "from-cyan-600/85 to-cyan-600",
  indigo: "from-indigo-600/85 to-indigo-600",
  violet: "from-violet-600/85 to-violet-600",
  rose: "from-rose-600/85 to-rose-600",
  amber: "from-amber-600/85 to-amber-600",
  lime: "from-lime-600/85 to-lime-600",
  sky: "from-sky-600/85 to-sky-600",
  slate: "from-slate-600/85 to-slate-600",
  gray: "from-gray-600/85 to-gray-600",
  zinc: "from-zinc-700/85 to-zinc-700",
  neutral: "from-neutral-600/85 to-neutral-600",
  stone: "from-stone-600/85 to-stone-600",
  fuchsia: "from-fuchsia-600/85 to-fuchsia-600",
};

interface MorphDownloadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  color?: Color;
  className?: string;
}

const sizeMap = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

export function MorphDownloadButton({
  size = "md",
  color = "default",
  className,
  onClick,
  ...props
}: MorphDownloadButtonProps) {
  const [status, setStatus] = React.useState("idle");
  const timeoutRefsRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const uid = React.useId().replace(/:/g, "");
  const glowId = `glow-${uid}`;
  const clipId = `circleClip-${uid}`;

  const { play } = useSound({
    theme: "soft",
    globalVolume: 0.35,
    haptics: true,
  });

  const t = {
    arrow: 0.4,
    dot: 0.4,
    ring: 0.8,
    check: 0.4,
    fade: 0.3,
    reset: 0.4,
  };

  const total = t.arrow + t.dot + t.ring + t.check + t.fade + t.reset;

  // ✅ Safari fix: Schedule all sounds upfront with proper delays
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status !== "idle") return;
    setStatus("animating");
    onClick?.(e);

    // ✅ Play click immediately (inside gesture)
    play("click", { pitch: "mid", speed: "fast" });

    // Schedule remaining sounds with calculated delays
    const scheduleSound = (soundName: string, delayMs: number, options?: any) => {
      const timeoutId = setTimeout(() => {
        play(soundName, options);
      }, delayMs);
      timeoutRefsRef.current.push(timeoutId);
    };

    // Arrow swipe at t.arrow
    scheduleSound("swipe", t.arrow * 1000, { pitch: "low", speed: "slow" });

    // Success checkmark at t.arrow + t.dot + t.ring
    scheduleSound("success", (t.arrow + t.dot + t.ring) * 1000, { pitch: "high", reverb: true });

    // Complete sound at t.arrow + t.dot + t.ring + t.check
    scheduleSound("complete", (t.arrow + t.dot + t.ring + t.check) * 1000, { pitch: "low", volume: 0.2 });

    // Reset status after total animation
    const resetTimeoutId = setTimeout(() => {
      setStatus("idle");
    }, total * 1000);
    timeoutRefsRef.current.push(resetTimeoutId);
  };

  // ✅ Cleanup timeouts on unmount or status reset
  React.useEffect(() => {
    return () => {
      timeoutRefsRef.current.forEach(clearTimeout);
      timeoutRefsRef.current = [];
    };
  }, []);

  return (
    <>
      <svg
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
      </svg>

      <button
        onClick={handleClick}
        disabled={status !== "idle"}
        className={cn(
          "relative flex items-center justify-center rounded-full text-white overflow-hidden",
          "transition-[filter] duration-200 hover:brightness-110 active:brightness-95",
          "bg-linear-to-b",
          "border border-zinc-950/35 dark:border-0",
          "shadow-md shadow-zinc-950/20",
          "inset-shadow-2xs inset-shadow-white/25",
          bgColorMap[color],
          sizeMap[size],
          className
        )}
        {...props}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g clipPath={`url(#${clipId})`}>
            <AnimatePresence>
              {status === "idle" ? (
                <motion.g
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ filter: `url(#${glowId})` }}
                  transform="translate(50, 50)"
                >
                  <path d="M0 -22 L0 16" stroke="white" strokeWidth="5" strokeLinecap="round" />
                  <path
                    d="M-17 6 Q0 28 17 6"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </motion.g>
              ) : (
                <motion.g key="anim">
                  <motion.g
                    initial={{ x: 50, y: 50, opacity: 1 }}
                    animate={{ x: 50, y: 105, opacity: 0 }}
                    transition={{
                      y: {
                        duration: t.arrow,
                        ease: [0.4, 0, 0.2, 1],
                      },
                      opacity: {
                        delay: t.arrow * 0.85,
                        duration: 0.15,
                        ease: "easeOut",
                      },
                    }}
                  >
                    <path
                      d="M0 -22 L0 16"
                      stroke="white"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                    />

                    <path
                      d="M-17 6 Q0 28 17 6"
                      stroke="white"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </motion.g>

                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    initial={{
                      pathLength: 0,
                      rotate: 90,
                    }}
                    animate={{
                      pathLength: 1.02,
                    }}
                    transition={{
                      delay: t.arrow + t.dot,
                      duration: t.ring,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      transformOrigin: "50% 50%",
                      transformBox: "fill-box",
                    }}
                  />

                  <motion.path
                    d="M33 52 L45 64 L68 38"
                    stroke="#22c55e"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    style={{ filter: `url(#${glowId})` }}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      delay: t.arrow + t.dot + t.ring,
                      duration: t.check,
                    }}
                  />

                  <motion.g
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{
                      delay: t.arrow + t.dot + t.ring + t.check,
                      duration: t.fade,
                    }}
                  />
                </motion.g>
              )}
            </AnimatePresence>
          </g>
        </svg>
      </button>
    </>
  );
}