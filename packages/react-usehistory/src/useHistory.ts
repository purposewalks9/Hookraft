import { useState, useCallback, useRef } from "react"

export type UseHistoryOptions<T> = {
  /** Maximum number of history entries to keep. Defaults to 100 */
  limit?: number
  /** Fires when undo is called with the state being restored */
  onUndo?: (state: T) => void
  /** Fires when redo is called with the state being restored */
  onRedo?: (state: T) => void
  /** Fires whenever state changes (set, undo, or redo) */
  onChange?: (state: T) => void
}

export type UseHistoryReturn<T> = {
  /** Current state value */
  state: T
  /** Set a new state value — pushes to history */
  set: (value: T | ((prev: T) => T)) => void
  /** Step back one entry in history */
  undo: () => void
  /** Step forward one entry in history */
  redo: () => void
  /** True if there are entries to undo */
  canUndo: boolean
  /** True if there are entries to redo */
  canRedo: boolean
  /** Full past history (oldest → most recent before current) */
  history: T[]
  /** Future states available for redo */
  future: T[]
  /** Reset to initial value and clear all history */
  clear: () => void
  /** Jump to a specific index in history */
  jump: (index: number) => void
}

/**
 * useHistory
 *
 * Adds undo/redo superpowers to any state value.
 * Tracks past and future states with a configurable history limit.
 *
 * @example
 * const { state, set, undo, redo, canUndo, canRedo } = useHistory("")
 *
 * set("hello")   // state = "hello"
 * set("world")   // state = "world"
 * undo()         // state = "hello"
 * redo()         // state = "world"
 */
export function useHistory<T>(
  initialValue: T,
  options: UseHistoryOptions<T> = {}
): UseHistoryReturn<T> {
  const { limit = 100, onUndo, onRedo, onChange } = options

  const [state, setState] = useState<T>(initialValue)
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])

  // Re-render trigger — past/future live in refs for perf,
  // but we need renders when they change for canUndo/canRedo
  const [, forceRender] = useState(0)
  const rerender = useCallback(() => forceRender((n) => n + 1), [])

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value

        if (Object.is(prev, next)) return prev

        // Push current to past, respect limit
        pastRef.current = [...pastRef.current, prev].slice(-limit)
        // Clear future on new action
        futureRef.current = []

        onChange?.(next)
        return next
      })
      rerender()
    },
    [limit, onChange, rerender]
  )

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return

    setState((current) => {
      const past = pastRef.current
      const previous = past[past.length - 1]

      pastRef.current = past.slice(0, -1)
      futureRef.current = [current, ...futureRef.current]

      onUndo?.(previous)
      onChange?.(previous)
      return previous
    })
    rerender()
  }, [onUndo, onChange, rerender])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return

    setState((current) => {
      const [next, ...remainingFuture] = futureRef.current

      pastRef.current = [...pastRef.current, current]
      futureRef.current = remainingFuture

      onRedo?.(next)
      onChange?.(next)
      return next
    })
    rerender()
  }, [onRedo, onChange, rerender])

  const clear = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    setState(initialValue)
    rerender()
  }, [initialValue, rerender])

  const jump = useCallback(
    (index: number) => {
      const allStates = [...pastRef.current, state, ...futureRef.current]
      const targetIndex = index < 0 ? 0 : index >= allStates.length ? allStates.length - 1 : index

      const target = allStates[targetIndex]
      pastRef.current = allStates.slice(0, targetIndex)
      futureRef.current = allStates.slice(targetIndex + 1)

      setState(target)
      onChange?.(target)
      rerender()
    },
    [state, onChange, rerender]
  )

  return {
    state,
    set,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    history: pastRef.current,
    future: futureRef.current,
    clear,
    jump,
  }
}