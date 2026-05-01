"use client"

import { useState } from "react"
import { useSound }  from "@hookraft/use-sound"

export function DemoModal() {
  const [open, setOpen]     = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { play } = useSound({ theme: "soft" })

  const openModal = () => {
    play("modal-open")
    setOpen(true)
    setResult(null)
  }

  const closeModal = () => {
    play("modal-close")
    setOpen(false)
  }

  const confirm = () => {
    play("success")
    setOpen(false)
    setResult("✓ Confirmed")
  }

  const cancel = () => {
    play("modal-close")
    setOpen(false)
    setResult("✕ Cancelled")
  }

  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <button
        onMouseEnter={() => play("hover")}
        onMouseDown={openModal}
        className="rounded-lg bg-foreground px-4 py-2 text-sm text-background"
      >
        Open Modal
      </button>

      {result && (
        <p className="text-sm font-mono text-muted-foreground">{result}</p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onMouseDown={closeModal}
        >
          <div
            className="rounded-xl bg-background border border-border p-6 shadow-xl w-80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-1">Delete this item?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onMouseDown={cancel}
                className="rounded-lg border border-border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onMouseDown={confirm}
                className="rounded-lg bg-foreground px-4 py-1.5 text-sm text-background"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}