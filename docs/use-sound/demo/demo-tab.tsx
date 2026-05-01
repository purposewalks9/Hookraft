"use client"

import { useState, useRef } from "react"
import { useSound } from "@hookraft/use-sound"

type Tab = { id: string; label: string; icon: string; content: string }

const TABS: Tab[] = [
  {
    id:      "overview",
    label:   "Overview",
    icon:    "◈",
    content: "A high-level summary of your project metrics, activity, and recent changes.",
  },
  {
    id:      "analytics",
    label:   "Analytics",
    icon:    "⟁",
    content: "Detailed breakdown of traffic sources, conversion rates, and user behaviour over time.",
  },
  {
    id:      "settings",
    label:   "Settings",
    icon:    "⊙",
    content: "Configure your workspace preferences, integrations, and notification rules.",
  },
]

export function DemoTabs() {
  const [active, setActive] = useState("overview")
  const [direction, setDirection] = useState<"left" | "right">("right")
  const prevIndex = useRef(0)
  const { play } = useSound({ theme: "soft" })

  const handleTab = (id: string) => {
    if (id === active) return
    const nextIndex = TABS.findIndex((t) => t.id === id)
    setDirection(nextIndex > prevIndex.current ? "right" : "left")
    prevIndex.current = nextIndex

    const isLast = nextIndex === TABS.length - 1
    play("click", {
      pitch: nextIndex === 0 ? "low" : nextIndex === 1 ? "mid" : "high",
      volume: 0.12,
      speed: isLast ? "fast" : "normal",
    })

    setActive(id)
  }

  const activeTab = TABS.find((t) => t.id === active)!

  return (
    <div className="flex flex-col p-6 max-w-sm w-full gap-0">

      {/* Tab bar */}
      <div className="relative flex rounded-t-xl border border-b-0 border-border overflow-hidden bg-muted/30">

        {/* Sliding active pill background */}
        <div
          className="absolute top-1.5 bottom-1.5 transition-all duration-200 ease-out rounded-lg bg-background border border-border shadow-sm"
          style={{
            width: `calc(${100 / TABS.length}% - 6px)`,
            left: `calc(${(TABS.findIndex((t) => t.id === active) / TABS.length) * 100}% + 3px)`,
          }}
        />

        {TABS.map((tab, i) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              onMouseEnter={() => !isActive && play("hover", { pitch: i === 0 ? "low" : i === 1 ? "mid" : "high", volume: 0.07 })}
              onMouseDown={() => handleTab(tab.id)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`text-[13px] transition-transform duration-150 ${isActive ? "scale-110" : "scale-100"}`}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div className="relative overflow-hidden rounded-b-xl border border-border bg-background px-5 py-5 min-h-[96px]">

        {/* Direction hint bar */}
        <div
          className={`absolute top-0 h-0.5 w-12 transition-all duration-300 bg-foreground/20 rounded-full`}
          style={{
            left: `calc(${(TABS.findIndex((t) => t.id === active) / TABS.length) * 100}% + 1.5rem)`,
          }}
        />

        {TABS.map((tab) =>
          tab.id === active ? (
            <div key={tab.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">{tab.icon}</span>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  {tab.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tab.content}
              </p>
            </div>
          ) : null
        )}
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onMouseDown={() => handleTab(tab.id)}
            onMouseEnter={() => tab.id !== active && play("hover", { volume: 0.05, pitch: "high" })}
            className={`transition-all duration-200 rounded-full ${
              tab.id === active
                ? "w-4 h-1.5 bg-foreground"
                : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  )
}