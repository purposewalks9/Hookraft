"use client"

import { useState, useRef } from "react"
import { useKeyCursor } from "@hookraft/use-key-cursor"
import { useTheme } from "next-themes"
import { RichButton } from "@/components/spell-ui/rich-button"

const COLORS = [
  { label: "Black",  value: "#000000" },
  { label: "Blue",   value: "#378ADD" },
  { label: "Teal",   value: "#1D9E75" },
  { label: "Coral",  value: "#D85A30" },
  { label: "Pink",   value: "#D4537E" },
  { label: "Purple", value: "#7F77DD" },
]

export function DemoColor() {
  const [color, setColor] = useState("#378ADD")
  const { resolvedTheme } = useTheme()
  const actionRef = useRef<HTMLElement>(null)

  useKeyCursor({
    keys: { Tab: actionRef as React.RefObject<HTMLElement> },
    origin: "top-right",
    color,
    theme: resolvedTheme === "dark" ? "dark" : "light",
  })

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="flex gap-2.5">
        {COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            title={c.label}
            className="size-7 rounded-full cursor-pointer transition-transform hover:scale-110"
            style={{
              background: c.value,
              border: color === c.value ? "3px solid hsl(var(--foreground))" : "2.5px solid transparent",
              outline: color === c.value ? "2px solid hsl(var(--background))" : "none",
              outlineOffset: "-3px",
            }}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Press{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
          Tab
        </kbd>{" "}
        to fly
      </p>

      <RichButton
        ref={actionRef}
        className="rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors duration-200 cursor-pointer border-none"
        style={{ background: color }}
      >
        Confirm
      </RichButton>
    </div>
  )
}