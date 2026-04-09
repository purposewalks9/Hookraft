import { useEffect, useRef } from "react"
import { useQueue } from "./useQueue"

export declare namespace Queue {
  type Props = {
    when: useQueue.Status
    onRunning?: () => void
    onPaused?: () => void
    onDone?: () => void
    onIdle?: () => void
    fallback?: React.ReactNode
    children: React.ReactNode
  }
}

export function Queue({
  when,
  onRunning,
  onPaused,
  onDone,
  onIdle,
  fallback = null,
  children,
}: Queue.Props) {
  const prevWhen = useRef<useQueue.Status | null>(null)

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