"use client"

import { useState } from "react"
import { useSound }  from "@hookraft/use-sound"

const ALL_SOUNDS = [
  "click", "hover", "scroll", "modal-open", "modal-close",
  "success", "error", "warning", "toggle-on", "toggle-off",
  "notification", "delete", "expand", "collapse", "swipe",
  "pop", "minimize", "maximize", "typing", "complete", "coin",
] as const

export function Demo() {
  const [theme, setTheme]   = useState<useSound.Theme>("soft")
  const [active, setActive] = useState<string | null>(null)
  const { play } = useSound({ theme })

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl">
      {/* Theme picker */}
      <div className="flex flex-wrap gap-2">
        {(["soft", "mechanical", "digital", "wooden", "glass"] as useSound.Theme[]).map((t) => (
          <button
            key={t}
            onMouseDown={() => { setTheme(t); play("click") }}
            className={`rounded-full px-3 py-1 text-xs font-mono transition-colors ${
              theme === t
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Sound grid */}
      <div className="grid grid-cols-3 gap-2">
        {ALL_SOUNDS.map((name) => (
          <button
            key={name}
            onMouseEnter={() => setActive(name)}
            onMouseLeave={() => setActive(null)}
            onMouseDown={() => play(name)}
            className={`rounded-lg border px-3 py-2 text-left text-xs font-mono transition-all ${
              active === name
                ? "border-foreground bg-foreground/5 text-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}