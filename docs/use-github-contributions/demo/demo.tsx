"use client"

import { useState } from "react"
import { ContributionCalendar } from "@hookraft/use-github-contributions"

export function Demo() {
  const [username, setUsername] = useState("torvalds")
  const [input, setInput] = useState("torvalds")

  return (
    <div className="flex flex-col max-w-[1200px] gap-5 p-6">
      <div className="flex md:flex-row flex-col items-center gap-2">
        <span className="text-sm text-muted-foreground font-mono">github.com/</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setUsername(input.trim())}
          placeholder="username"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={() => setUsername(input.trim())}
          className="rounded-lg bg-foreground px-4 py-1.5 text-sm text-background transition-colors hover:opacity-90"
        >
          Load
        </button>
      </div>

      <ContributionCalendar
        username={username}
        theme="github"
        year={2025}
        showMonthLabels={false}
        showDayLabels={false}
        showThemeSwitcher={false}
        blockSize={8}
        blockGap={2}
        proxyUrl="/api/github-contributions"
      />
    </div>
  )
}