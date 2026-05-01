"use client"

import { useState } from "react"
import { useSound }  from "@hookraft/use-sound"

const PATTERNS: useSound.HapticPattern[] = [
  "click", "double", "success", "error", "warning",
  "notification", "impact-light", "impact-medium",
  "impact-heavy", "selection", "long",
]

const DESCRIPTIONS: Record<useSound.HapticPattern, string> = {
  "click":          "10ms",
  "double":         "10 · 50 · 10ms",
  "success":        "15 · 40 · 40ms",
  "error":          "30 · 20 · 30 · 20 · 30ms",
  "warning":        "20 · 60 · 20ms",
  "notification":   "25ms",
  "impact-light":   "5ms",
  "impact-medium":  "15ms",
  "impact-heavy":   "30ms",
  "selection":      "8ms",
  "long":           "10 · 30 · 10 · 30 · 40ms",
}

export function DemoHaptics() {
  const [last, setLast] = useState<useSound.HapticPattern | null>(null)
  const { play, triggerHaptic } = useSound({ theme: "digital" })

  const fire = (p: useSound.HapticPattern) => {
    setLast(p)
    triggerHaptic(p)
    play("click", { pitch: "high", volume: 0.15 })
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-sm">
      <p className="text-xs text-muted-foreground font-mono">
        Best experienced on a mobile device with vibration enabled.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {PATTERNS.map((p) => (
          <button
            key={p}
            onMouseDown={() => fire(p)}
            className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all ${
              last === p
                ? "border-foreground bg-foreground/5"
                : "border-border text-muted-foreground hover:border-foreground/50"
            }`}
          >
            <span className="text-xs font-mono text-foreground">{p}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {DESCRIPTIONS[p]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}