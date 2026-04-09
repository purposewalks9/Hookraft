import { useCallback, useEffect, useRef, useState } from "react"

export declare namespace useDoorway {
  type Status = "idle" | "enter" | "loading" | "success" | "error"

  type Options = {
    onEnter?: () => void | Promise<void>
    onExit?: () => void | Promise<void>
    onLoading?: () => void | Promise<void>
    onSuccess?: () => void | Promise<void>
    onError?: () => void | Promise<void>
  }

  type Return = {
    status: Status
    is: (status: Status) => boolean
    enter: () => void
    exit: () => void
    load: () => void
    succeed: () => void
    fail: () => void
    reset: () => void
  }
}

export function useDoorway(options: useDoorway.Options = {}): useDoorway.Return {
  const { onEnter, onExit, onLoading, onSuccess, onError } = options
  const [status, setStatus] = useState<useDoorway.Status>("idle")
  const prevStatus = useRef<useDoorway.Status>("idle")
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
  const is = useCallback((s: useDoorway.Status) => status === s, [status])

  return { status, is, enter, exit, load, succeed, fail, reset }
}