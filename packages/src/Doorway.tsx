import { useEffect, useRef } from "react"
import type { DoorwayStatus } from "./useDoorway"

export interface DoorwayProps {
  /** Controls visibility and triggers lifecycle events */
  when: boolean | DoorwayStatus
  /** Fires when component becomes visible */
  onEnter?: () => void | Promise<void>
  /** Fires when component becomes hidden */
  onExit?: () => void | Promise<void>
  /** Fires when when === 'loading' */
  onLoading?: () => void | Promise<void>
  /** Fires when when === 'success' */
  onSuccess?: () => void | Promise<void>
  /** Fires when when === 'error' */
  onError?: () => void | Promise<void>
  /** What to render when not visible */
  fallback?: React.ReactNode
  /** Your component */
  children: React.ReactNode
}

export function Doorway({
  when,
  onEnter,
  onExit,
  onLoading,
  onSuccess,
  onError,
  fallback = null,
  children,
}: DoorwayProps) {
  const prevWhen = useRef<boolean | DoorwayStatus | null>(null)

  useEffect(() => {
    if (prevWhen.current === when) return
    prevWhen.current = when

    if (when === false || when === "idle") {
      onExit?.()
    } else if (when === true || when === "enter") {
      onEnter?.()
    } else if (when === "loading") {
      onLoading?.()
    } else if (when === "success") {
      onSuccess?.()
    } else if (when === "error") {
      onError?.()
    }
  }, [when, onEnter, onExit, onLoading, onSuccess, onError])

  const isVisible =
    when === true ||
    when === "enter" ||
    when === "loading" ||
    when === "success" ||
    when === "error"

  return isVisible ? <>{children}</> : <>{fallback}</>
}