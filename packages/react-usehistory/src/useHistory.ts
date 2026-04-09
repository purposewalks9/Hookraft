import { useState, useCallback, useRef } from "react"

export declare namespace useHistory {
  type Options<T> = {
    limit?: number
    onUndo?: (state: T) => void
    onRedo?: (state: T) => void
    onChange?: (state: T) => void
  }

  type Return<T> = {
    state: T
    set: (value: T | ((prev: T) => T)) => void
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
    history: T[]
    future: T[]
    clear: () => void
    jump: (index: number) => void
  }
}

export function useHistory<T>(
  initialValue: T,
  options: useHistory.Options<T> = {}
): useHistory.Return<T> {
  const { limit = 100, onUndo, onRedo, onChange } = options

  const [state, setState] = useState<T>(initialValue)
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])

  const [, forceRender] = useState(0)
  const rerender = useCallback(() => forceRender((n) => n + 1), [])

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value

        if (Object.is(prev, next)) return prev

        pastRef.current = [...pastRef.current, prev].slice(-limit)
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