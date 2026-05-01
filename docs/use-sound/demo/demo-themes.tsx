"use client"

import { useState } from "react"
import { useSound }  from "@hookraft/use-sound"

const THEMES: useSound.Theme[] = ["soft", "mechanical", "digital", "wooden", "glass"]

const THEME_DESCRIPTIONS: Record<useSound.Theme, string> = {
  soft:       "Muted, gentle — iOS-like",
  mechanical: "Keyboard / typewriter clicks",
  digital:    "Crisp, synthetic, sci-fi",
  wooden:     "Warm, organic taps",
  glass:      "Bright, crystalline pings",
}

export function DemoThemes() {
  const [theme, setTheme] = useState<useSound.Theme>("soft")
  const { play } = useSound({ theme })

  const handleSelect = (t: useSound.Theme) => {
    setTheme(t)
    play("click")
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-sm">
      <p className="text-xs text-muted-foreground font-mono">
        Select a theme then click any button
      </p>

      <div className="flex flex-col gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            onMouseDown={() => handleSelect(t)}
            className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all ${
              theme === t
                ? "border-foreground bg-foreground/5"
                : "border-border text-muted-foreground hover:border-foreground/50"
            }`}
          >
            <span className="font-mono">{t}</span>
            <span className="text-xs text-muted-foreground">
              {THEME_DESCRIPTIONS[t]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        {(["click", "success", "error", "modal-open"] as useSound.SoundName[]).map((s) => (
          <button
            key={s}
            onMouseDown={() => play(s)}
            className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs font-mono text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}