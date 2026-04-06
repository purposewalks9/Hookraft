"use client"

import { useState, useRef } from "react"
import { useKeyCursor } from "@hookraft/use-key-cursor"
import type { CursorOrigin } from "@hookraft/use-key-cursor"
import { useTheme } from "next-themes"

export function DemoOrigin() {
  const [origin, setOrigin] = useState<CursorOrigin>("top-right")
  const [lastKey, setLastKey] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  const submitRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useKeyCursor({
    keys: {
      Enter: submitRef,
      Escape: cancelRef,
    },
    origin,
    color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
    theme: resolvedTheme === "dark" ? "dark" : "light",
    onTrigger: (key) => setLastKey(key),
  })

  const origins: CursorOrigin[] = [
    "top-right",
    "top-left",
    "bottom-right",
    "bottom-left",
  ]

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Origin selector */}
      <div className="flex flex-wrap justify-center gap-2">
        {origins.map((o) => (
          <button
            key={o}
            onClick={() => setOrigin(o)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors
              ${
                origin === o
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
          >
            {o}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground">
        Press{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">
          Enter
        </kbd>{" "}
        or{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">
          Escape
        </kbd>
      </p>

      {/* Action buttons */}
      <div className="flex gap-2.5">
        <button
          ref={cancelRef}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          ref={submitRef}
          className="rounded-lg bg-foreground px-4 py-2 text-sm text-background transition-colors hover:opacity-90"
        >
          Submit
        </button>
      </div>
    </div>
  )
}