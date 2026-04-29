"use client"

import { useState } from "react"
import { ContributionCalendar } from "@hookraft/use-github-contributions"
import type { useGithubContributions } from "@hookraft/use-github-contributions"

const THEMES: { value: useGithubContributions.Theme; label: string }[] = [
  { value: "github",    label: "github"    },
  { value: "halloween", label: "halloween" },
  { value: "winter",    label: "winter"    },
]

export function DemoTheme() {
  const [theme, setTheme] = useState<useGithubContributions.Theme>("github")

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex gap-2 flex-wrap">
        {THEMES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={[
              "rounded-full border px-4 py-1.5 text-xs font-mono transition-colors",
              theme === t.value
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:border-foreground/50",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ContributionCalendar
        username="purposewalks9"
        theme={theme}
        year={2026} 
        proxyUrl="/api/github-contributions"
        
      />
    </div>
  )
}