"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type DownloadButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;        // Trigger loading from parent
  isSuccess?: boolean;        // Trigger success from parent
  size?: "sm" | "md" | "lg";
  className?: string;
  onReset?: () => void;       // Optional callback after reset
};

const sizeMap = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

export function MorphDownloadButton({
  isLoading = false,
  isSuccess = false,
  size = "md",
  className,
  onReset,
  ...props
}: DownloadButtonProps) {
  const [internalState, setInternalState] = React.useState<"idle" | "loading" | "success">("idle");

  // Sync external props with internal state (priority to external control)
  React.useEffect(() => {
    if (isSuccess) {
      setInternalState("success");
    } else if (isLoading) {
      setInternalState("loading");
    } else if (!isLoading && !isSuccess) {
      // Auto reset after success
      const timer = setTimeout(() => {
        setInternalState("idle");
        onReset?.();
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isSuccess, onReset]);

  const currentState = isSuccess ? "success" : isLoading ? "loading" : internalState;

  return (
    <button
      type="button"
      disabled={currentState !== "idle"}
      className={cn(
        "group relative flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-white transition-all duration-200 hover:scale-105 hover:border-zinc-600 active:scale-95 disabled:cursor-not-allowed",
        sizeMap[size],
        className
      )}
      {...props}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        {/* Subtle background ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#27272a"
          strokeWidth="6"
        />

        <AnimatePresence mode="wait">
          {/* ==================== IDLE STATE ==================== */}
          {currentState === "idle" && (
            <motion.g
              key="idle"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18, transition: { duration: 0.35 } }}
            >
              <motion.path
                d="M50 26 L50 68 M36 54 L50 68 L64 54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>
          )}

          {/* ==================== LOADING STATE ==================== */}
          {currentState === "loading" && (
            <motion.g key="loading">
              {/* Progress Ring */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="7"
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              />

              {/* Leading bright dot */}
              <motion.circle
                cx="50"
                cy="50"
                r="6.5"
                fill="#60a5fa"
                animate={{
                  cx: [50, 85, 50, 15, 50],
                  cy: [15, 50, 85, 50, 15],
                }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.g>
          )}

          {/* ==================== SUCCESS STATE ==================== */}
          {currentState === "success" && (
            <motion.g
              key="success"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
            >
              {/* Completed green ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#22c55e"
                strokeWidth="7"
              />

              {/* Checkmark with nice draw */}
              <motion.path
                d="M33 50 L46 63 L70 36"
                fill="none"
                stroke="#22c55e"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </button>
  );
}