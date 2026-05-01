"use client"

import { useState, useRef } from "react"
import { useSound } from "@hookraft/use-sound"

export function DemoInput() {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isFocused, setIsFocused] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [submitCount, setSubmitCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { play } = useSound({ theme: "mechanical", haptics: true })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue(val)
    setCharCount(val.length)
    if (status !== "idle") setStatus("idle")

    if (val.length > value.length) {
      play("typing", { volume: 0.08, pitch: val.length % 2 === 0 ? "mid" : "high" })
    }
  }

  const handleSubmit = () => {
    if (!value.trim()) {
      play("error", { haptic: true, hapticPattern: "error" })
      setStatus("error")
      inputRef.current?.focus()
      return
    }
    play("success", { haptic: true, hapticPattern: "success" })
    setStatus("success")
    setSubmitCount((c) => c + 1)
    setTimeout(() => {
      setValue("")
      setCharCount(0)
      setStatus("idle")
    }, 2000)
  }

  const handleClear = () => {
    play("delete", { pitch: "low", volume: 0.1 })
    setValue("")
    setCharCount(0)
    setStatus("idle")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
    if (e.key === "Backspace") play("typing", { pitch: "low", volume: 0.05 })
    if (e.key === "Escape") handleClear()
  }

  const borderColor =
    status === "success"
      ? "border-emerald-500 ring-2 ring-emerald-500/20"
      : status === "error"
      ? "border-red-500 ring-2 ring-red-500/20"
      : isFocused
      ? "border-foreground ring-2 ring-foreground/10"
      : "border-border"

  return (
    <div className="flex flex-col gap-4 p-6 w-full max-w-sm">

      {/* Input row */}
      <div className={`relative flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 transition-all duration-150 ${borderColor}`}>
        {/* Animated prefix icon */}
        <span
          className="text-muted-foreground transition-all duration-200 select-none"
          style={{ fontSize: 15, opacity: isFocused ? 1 : 0.4 }}
        >
          ⌨
        </span>

        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { setIsFocused(true); play("pop", { volume: 0.1 }) }}
          onBlur={() => setIsFocused(false)}
          placeholder="Type something..."
          maxLength={80}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
        />

        {/* Char counter */}
        {charCount > 0 && (
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground select-none shrink-0">
            {charCount}/80
          </span>
        )}

        {/* Clear button */}
        {value && (
          <button
            onMouseDown={handleClear}
            onMouseEnter={() => play("hover", { volume: 0.06 })}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground hover:bg-foreground hover:text-background transition-all duration-150 text-[10px] font-bold shrink-0"
            title="Clear (Esc)"
          >
            ✕
          </button>
        )}
      </div>

      {/* Buttons row */}
      <div className="flex gap-2">

        {/* Submit — chunky pill */}
        <button
          onMouseEnter={() => play("hover", { volume: 0.07 })}
          onMouseDown={handleSubmit}
          className="relative flex-1 overflow-hidden rounded-xl bg-foreground text-background text-sm font-medium py-2.5 px-4 active:scale-[0.97] transition-transform duration-75 group"
        >
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            <span>Submit</span>
            <span className="text-[11px] opacity-50 font-mono">↵</span>
          </span>
          {/* Subtle shimmer strip on hover */}
          <span className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 bg-white/10 skew-x-12 pointer-events-none" />
        </button>

        {/* Mute toggle — icon-only pill */}
        <MuteButton play={play} />
      </div>

      {/* Status feedback */}
      <div className="min-h-[20px]">
        {status === "success" && (
          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <span className="text-base leading-none">✓</span>
            Submitted{submitCount > 1 ? ` (×${submitCount})` : ""}
          </p>
        )}
        {status === "error" && (
          <p className="text-xs font-mono text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <span className="text-base leading-none">✕</span>
            Field cannot be empty
          </p>
        )}
        {status === "idle" && value.length > 60 && (
          <p className="text-xs font-mono text-amber-500">
            {80 - value.length} characters remaining
          </p>
        )}
      </div>

      {/* Hint row */}
      <p className="text-[10px] text-muted-foreground font-mono">
        enter to submit · esc to clear
      </p>
    </div>
  )
}

function MuteButton({ play }: { play: ReturnType<typeof useSound>["play"] }) {
  const { mute, unmute, isMuted } = useSound({ theme: "mechanical" })

  const toggle = () => {
    if (isMuted) {
      unmute()
      play("toggle-on", { volume: 0.15 })
    } else {
      play("toggle-off", { volume: 0.1 })
      mute()
    }
  }

  return (
    <button
      onMouseDown={toggle}
      onMouseEnter={() => !isMuted && play("hover", { volume: 0.06 })}
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
      className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground active:scale-[0.95] transition-all duration-150"
    >
      <span className="text-sm">{isMuted ? "🔇" : "🔊"}</span>
    </button>
  )
}