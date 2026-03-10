import { useEffect, useRef } from "react"
import type { QueueStatus } from "./useQueue"

export interface QueueProps {
  /** Current queue status */
  when: QueueStatus
  /** Fires when queue starts running */
  onRunning?: () => void
  /** Fires when queue is paused */
  onPaused?: () => void
  /** Fires when queue is done */
  onDone?: () => void
  /** Fires when queue goes idle */
  onIdle?: () => void
  /** What to render when queue is idle */
  fallback?: React.ReactNode
  /** Your component */
  children: React.ReactNode
}

export function Queue({
  when,
  onRunning,
  onPaused,
  onDone,
  onIdle,
  fallback = null,
  children,
}: QueueProps) {
  const prevWhen = useRef<QueueStatus | null>(null)

  useEffect(() => {
    if (prevWhen.current === when) return
    prevWhen.current = when

    if (when === "running") onRunning?.()
    else if (when === "paused") onPaused?.()
    else if (when === "done") onDone?.()
    else if (when === "idle") onIdle?.()
  }, [when, onRunning, onPaused, onDone, onIdle])

  const isVisible = when === "running" || when === "paused" || when === "done"

  return isVisible ? <>{children}</> : <>{fallback}</>
}
