"use client"

import { useState } from "react"
import { ContributionCalendar } from "@hookraft/use-github-contributions"

const PRESETS = [
  {
    label: "Ocean",
    colors: {
      empty:  "#0a0e1a",
      level1: "#0d3b6e",
      level2: "#1565c0",
      level3: "#1e88e5",
      level4: "#64b5f6",
    },
  },
  {
    label: "Sakura",
    colors: {
      empty:  "#1a0a10",
      level1: "#6d1b3a",
      level2: "#c2185b",
      level3: "#e91e8c",
      level4: "#f8bbd0",
    },
  },
  {
    label: "Sunset",
    colors: {
      empty:  "#1a0a00",
      level1: "#bf360c",
      level2: "#e64a19",
      level3: "#ff7043",
      level4: "#ffccbc",
    },
  },
]

export function DemoCustom() {
  const [preset, setPreset] = useState(0)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setPreset(i)}
            className={[
              "rounded-full border px-4 py-1.5 text-xs font-mono transition-colors",
              preset === i
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:border-foreground/50",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      <ContributionCalendar
        username="torvalds"
        theme="custom"
        customColors={PRESETS[preset].colors}
        year={2025} 
        proxyUrl="/api/github-contributions"
      />
    </div>
  )
}