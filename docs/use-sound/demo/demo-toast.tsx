"use client"

import { useState } from "react"
import { useSound }  from "@hookraft/use-sound"

type ToastType = "success" | "error" | "info"
type Toast     = { id: number; message: string; type: ToastType }

const SOUND_MAP: Record<ToastType, useSound.SoundName> = {
  success: "success",
  error:   "error",
  info:    "notification",
}

const MESSAGES: Record<ToastType, string> = {
  success: "Changes saved successfully.",
  error:   "Something went wrong. Try again.",
  info:    "You have a new message.",
}

export function DemoToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const { play } = useSound({ theme: "soft" })

  const push = (type: ToastType) => {
    play(SOUND_MAP[type])
    const id = Date.now()
    setToasts((t) => [...t, { id, type, message: MESSAGES[type] }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }

  const COLOR: Record<ToastType, string> = {
    success: "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400",
    error:   "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400",
    info:    "border-border bg-background text-foreground",
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-sm">
      <div className="flex gap-2">
        <button
          onMouseDown={() => push("success")}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white"
        >
          Success
        </button>
        <button
          onMouseDown={() => push("error")}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white"
        >
          Error
        </button>
        <button
          onMouseDown={() => push("info")}
          className="rounded-lg bg-foreground px-3 py-1.5 text-sm text-background"
        >
          Info
        </button>
      </div>

      <div className="flex flex-col gap-2 min-h-[60px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all ${COLOR[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}