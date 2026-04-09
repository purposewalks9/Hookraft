import { useEffect, useRef } from "react"
import { useDoorway } from "./useDoorway"

export declare namespace Doorway {
  type Props = {
    when: boolean | useDoorway.Status
    onEnter?: () => void | Promise<void>
    onExit?: () => void | Promise<void>
    onLoading?: () => void | Promise<void>
    onSuccess?: () => void | Promise<void>
    onError?: () => void | Promise<void>
    fallback?: React.ReactNode
    children: React.ReactNode
  }
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
}: Doorway.Props) {
  const prevWhen = useRef<boolean | useDoorway.Status | null>(null)

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