import { useState, useRef, useCallback } from "react"

export type QueueStatus = "idle" | "running" | "paused" | "done"

export interface QueueItem<T> {
  id: string
  data: T
  status: "pending" | "processing" | "completed" | "failed"
  error?: unknown
}

export interface UseQueueOptions<T> {
  onProcess: (item: T) => Promise<void>
  onSuccess?: (item: T) => void
  onError?: (item: T, error: unknown) => void
  onDone?: () => void
  concurrency?: number
}

export function useQueue<T>(options: UseQueueOptions<T>) {
  const { onProcess, onSuccess, onError, onDone, concurrency = 1 } = options

  const [items, setItems] = useState<QueueItem<T>[]>([])
  const [status, setStatus] = useState<QueueStatus>("idle")
  const pausedRef = useRef(false)
  const runningRef = useRef(0)

  const updateItem = useCallback((id: string, patch: Partial<QueueItem<T>>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const add = useCallback((data: T) => {
    const item: QueueItem<T> = {
      id: crypto.randomUUID(),
      data,
      status: "pending",
    }
    setItems((prev) => [...prev, item])
    return item.id
  }, [])

  const process = useCallback(async (snapshot: QueueItem<T>[]) => {
    const pending = snapshot.filter((i) => i.status === "pending")

    if (pending.length === 0) {
      setStatus("done")
      onDone?.()
      return
    }

    const toRun = pending.slice(0, concurrency - runningRef.current)

    for (const item of toRun) {
      if (pausedRef.current) break

      runningRef.current++
      updateItem(item.id, { status: "processing" })

      onProcess(item.data)
        .then(() => {
          updateItem(item.id, { status: "completed" })
          onSuccess?.(item.data)
        })
        .catch((error) => {
          updateItem(item.id, { status: "failed", error })
          onError?.(item.data, error)
        })
        .finally(() => {
          runningRef.current--
          setItems((prev) => {
            if (!pausedRef.current) process(prev)
            return prev
          })
        })
    }
  }, [concurrency, onProcess, onSuccess, onError, onDone, updateItem])

  const start = useCallback(() => {
    pausedRef.current = false
    setStatus("running")
    setItems((prev) => {
      process(prev)
      return prev
    })
  }, [process])

  const pause = useCallback(() => {
    pausedRef.current = true
    setStatus("paused")
  }, [])

  const clear = useCallback(() => {
    pausedRef.current = true
    runningRef.current = 0
    setItems([])
    setStatus("idle")
  }, [])

  const reset = useCallback(() => {
    pausedRef.current = false
    runningRef.current = 0
    setItems((prev) => prev.map((i) => ({ ...i, status: "pending", error: undefined })))
    setStatus("idle")
  }, [])

  const is = useCallback((s: QueueStatus) => status === s, [status])

  return {
    status,
    is,
    add,
    start,
    pause,
    clear,
    reset,
    items,
    pending: items.filter((i) => i.status === "pending"),
    processing: items.filter((i) => i.status === "processing"),
    completed: items.filter((i) => i.status === "completed"),
    failed: items.filter((i) => i.status === "failed"),
  }
}
