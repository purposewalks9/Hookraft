import { useCallback, useEffect, useRef, useState } from "react"

export type DoorwayStatus = "idle" | "enter" | "loading" | "success" | "error"

export interface UseDoorwayOptions {
  /** Fires when the component enters / becomes visible */
  onEnter?: () => void | Promise<void>
  /** Fires when the component exits / becomes hidden */
  onExit?: () => void | Promise<void>
  /** Fires when you call door.load() */
  onLoading?: () => void | Promise<void>
  /** Fires when you call door.succeed() */
  onSuccess?: () => void | Promise<void>
  /** Fires when you call door.fail() */
  onError?: () => void | Promise<void>
}

export interface UseDoorwayReturn {
  /** Current status of the doorway */
  status: DoorwayStatus
  /** Check if status matches a given state */
  is: (status: DoorwayStatus) => boolean
  /** Transition to enter state */
  enter: () => void
  /** Transition to idle/exit state */
  exit: () => void
  /** Transition to loading state */
  load: () => void
  /** Transition to success state */
  succeed: () => void
  /** Transition to error state */
  fail: () => void
  /** Reset back to idle without firing onExit */
  reset: () => void
}

export function useDoorway(options: UseDoorwayOptions = {}): UseDoorwayReturn {
  const { onEnter, onExit, onLoading, onSuccess, onError } = options
  const [status, setStatus] = useState<DoorwayStatus>("idle")
  const prevStatus = useRef<DoorwayStatus>("idle")
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (prevStatus.current === status) return
    prevStatus.current = status

    switch (status) {
      case "enter":
        onEnter?.()
        break
      case "idle":
        onExit?.()
        break
      case "loading":
        onLoading?.()
        break
      case "success":
        onSuccess?.()
        break
      case "error":
        onError?.()
        break
    }
  }, [status, onEnter, onExit, onLoading, onSuccess, onError])

  const enter = useCallback(() => setStatus("enter"), [])
  const exit = useCallback(() => setStatus("idle"), [])
  const load = useCallback(() => setStatus("loading"), [])
  const succeed = useCallback(() => setStatus("success"), [])
  const fail = useCallback(() => setStatus("error"), [])
  const reset = useCallback(() => {
    prevStatus.current = "idle"
    setStatus("idle")
  }, [])
  const is = useCallback((s: DoorwayStatus) => status === s, [status])

  return { status, is, enter, exit, load, succeed, fail, reset }
}