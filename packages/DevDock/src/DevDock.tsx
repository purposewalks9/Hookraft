"use client";

import { useState, useCallback, useRef, type CSSProperties } from "react";
import { AnimatedGradient } from "./AnimatedGradient";

// ── TYPES ─────────────────────────────────────────────

export declare namespace DevDock {
  export interface App {
    name: string;
    href: string;
    /** URL string (image) or a React node (SVG, component). No emojis. */
    icon: string | React.ReactNode;
    /** Optional short descriptor shown in the tooltip below the name */
    description?: string;
  }

  export type Size = "sm" | "md" | "lg";

  export interface Props {
    apps?: App[];
    size?: Size;
    addable?: boolean;
    onAdd?: (app: App) => void;
    onRemove?: (index: number) => void;
    className?: string;
    style?: CSSProperties;
  }
}

// ── SIZE CONFIG ───────────────────────────────────────

const SIZE = {
  sm: { pill: 36, icon: 18, radius: 10, padding: "8px 12px", gap: 8, dockRadius: "20px" },
  md: { pill: 44, icon: 22, radius: 12, padding: "10px 16px", gap: 10, dockRadius: "28px" },
  lg: { pill: 54, icon: 26, radius: 14, padding: "12px 20px", gap: 12, dockRadius: "34px" },
};

// ── AUDIO ─────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function beep(freq: number, duration: number, vol = 0.12) {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {}
}

function questBeep() {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const now = audioCtx.currentTime;
    
    // First tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.setValueAtTime(800, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc1.start(now);
    osc1.stop(now + 0.06);
    
    // Second tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.setValueAtTime(1200, now + 0.05);
    gain2.gain.setValueAtTime(0.15, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.11);
  } catch {}
}

// ── ICON RENDERER ─────────────────────────────────────
// Accepts a URL string (renders as <img>) or any React node.
// Emojis are not a supported format.

function AppIcon({ icon, size }: { icon: string | React.ReactNode; size: number }) {
  if (typeof icon === "string") {
    return (
      <img
        src={icon}
        alt=""
        width={size}
        height={size}
        style={{
          borderRadius: 4,
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────

export function DevDock({
  apps: initialApps = [],
  size = "md",
  addable = true,
  onAdd,
  onRemove,
  className,
  style,
}: DevDock.Props) {
  const [apps, setApps] = useState<DevDock.App[]>(initialApps);
  const [hovered, setHovered] = useState<number | null>(null);

  const cfg = SIZE[size];

  const handleHover = useCallback((i: number) => {
    setHovered(i);
    beep(1100 + i * 40, 0.07);
  }, []);

  const handleClick = useCallback(() => {
    questBeep();
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, i: number) => {
      e.preventDefault();
      setApps((prev) => prev.filter((_, idx) => idx !== i));
      onRemove?.(i);
    },
    [onRemove]
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: `${cfg.gap}px`,
        padding: cfg.padding,
        borderRadius: cfg.dockRadius,
        overflow: "visible",
        ...style,
      }}
    >
      {/* Animated background */}
      <AnimatedGradient borderRadius={cfg.dockRadius} />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 6, 0, 0.42)",
          borderRadius: cfg.dockRadius,
          border: "1px solid rgba(255, 160, 60, 0.2)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Apps */}
      {apps.map((app, i) => {
        const isHov = hovered === i;

        return (
          <a
            key={i}
            href={app.href}
            target={app.href.startsWith("mailto") ? "_self" : "_blank"}
            rel="noopener noreferrer"
            onMouseEnter={() => handleHover(i)}
            onMouseLeave={() => setHovered(null)}
            onMouseDown={handleClick}
            onContextMenu={(e) => handleContextMenu(e, i)}
            aria-label={app.name}
            style={{
              position: "relative",
              zIndex: 2,
              width: cfg.pill,
              height: cfg.pill,
              borderRadius: cfg.radius,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: isHov
                ? "rgba(255, 180, 80, 0.18)"
                : "rgba(255, 255, 255, 0.10)",
              border: isHov
                ? "1px solid rgba(255,160,60,0.30)"
                : "1px solid rgba(255,255,255,0.06)",
              transition:
                "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.15s, border-color 0.15s",
              transform: isHov ? "scale(1.32)" : "scale(1)",
              flexShrink: 0,
              textDecoration: "none",
              color: "#fff",
            }}
          >
            <AppIcon icon={app.icon} size={cfg.icon} />
          </a>
        );
      })}
    </div>
  );
}