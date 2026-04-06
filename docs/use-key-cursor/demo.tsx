"use client"

import { useState, useRef } from "react"
import { useKeyCursor } from "@hookraft/use-key-cursor"
import { useTheme } from "next-themes"

export function Demo() {
  const [open, setOpen] = useState(false)
  const { resolvedTheme } = useTheme()

  const closeRef   = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

 useKeyCursor({
  keys: {
    Escape: closeRef as React.RefObject<HTMLElement>,
    Delete: confirmRef as React.RefObject<HTMLElement>,
  },
  origin: "top-right",
  color: resolvedTheme === "dark" ? "#ffffff" : "#000000",
  theme: resolvedTheme === "dark" ? "dark" : "light",
})

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <p className="text-sm text-muted-foreground">
        Open the modal then press{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
          Escape
        </kbd>{" "}
        or{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
          Delete
        </kbd>
      </p>

      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-foreground px-5 py-2 text-sm text-background transition-colors hover:opacity-90"
      >
        Open Modal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[360px] rounded-xl bg-background p-7 shadow-2xl border border-border">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Delete file?
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              This action cannot be undone. The file will be permanently removed.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                onClick={() => setOpen(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}