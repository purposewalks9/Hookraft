import { useState, useEffect, useRef, useCallback } from "react"

const STORAGE_KEY_DEFAULT = "hookraft_engagement_queue"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export declare namespace useEngagement {
  interface EngagementData {

    pageUrl: string

    totalClicks: number

    clickTargets: string[]

    activeTime: number

    idleTime: number

    scrollDepth: number

    enteredAt: number
    exitAt: number | null
  }

  interface Options {
    onSync: (data: EngagementData) => void | Promise<void>
    idleTimeout?: number
    trackClicks?: boolean
    trackScroll?: boolean
    storageKey?: string
    maxQueue?: number
  }

  interface Return {
    data: EngagementData
    isActive: boolean
    flush: () => void
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialData(): useEngagement.EngagementData {
  return {
    pageUrl: isBrowser() ? window.location.href : "",
    totalClicks: 0,
    clickTargets: [],
    activeTime: 0,
    idleTime: 0,
    scrollDepth: 0,
    enteredAt: Date.now(),
    exitAt: null,
  }
}

function getScrollDepth(): number {
  const docHeight =
    document.documentElement.scrollHeight - window.innerHeight
  if (docHeight <= 0) return 100
  return Math.round((window.scrollY / docHeight) * 100)
}

function saveToQueue(
  data: useEngagement.EngagementData,
  storageKey: string,
  maxQueue: number
) {
  try {
    const raw = localStorage.getItem(storageKey)
    const queue: useEngagement.EngagementData[] = raw ? JSON.parse(raw) : []
    queue.push(data)
    const trimmed = queue.slice(-maxQueue)
    localStorage.setItem(storageKey, JSON.stringify(trimmed))
  } catch {
    // localStorage may be unavailable
  }
}

function getQueue(storageKey: string): useEngagement.EngagementData[] {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function clearQueue(storageKey: string) {
  try {
    localStorage.removeItem(storageKey)
  } catch {
    // ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEngagement(
  options: useEngagement.Options
): useEngagement.Return {
  const {
    onSync,
    idleTimeout = 3000,
    trackClicks = true,
    trackScroll = true,
    storageKey = STORAGE_KEY_DEFAULT,
    maxQueue = 20,
  } = options

  const [data, setData] = useState<useEngagement.EngagementData>(buildInitialData)
  const [isActive, setIsActive] = useState(true)

  const dataRef = useRef<useEngagement.EngagementData>(buildInitialData())
  const isActiveRef = useRef(true)
  const isIdleRef = useRef(false)
  const isHiddenRef = useRef(false)
  const activeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSyncRef = useRef(onSync)
  const mountedRef = useRef(true)

  useEffect(() => { onSyncRef.current = onSync }, [onSync])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ─── Sync logic ──────────────────────────────────────────────────────────

  const syncData = useCallback(
    async (finalData: useEngagement.EngagementData) => {
      if (navigator.onLine) {
        try {
          await onSyncRef.current(finalData)

          const queue = getQueue(storageKey)
          if (queue.length > 0) {
            for (const item of queue) {
              await onSyncRef.current(item)
            }
            clearQueue(storageKey)
          }
        } catch {
          saveToQueue(finalData, storageKey, maxQueue)
        }
      } else {
        saveToQueue(finalData, storageKey, maxQueue)
      }
    },
    [storageKey, maxQueue]
  )

  // ─── Flush ────────────────────────────────────────────────────────────────

  const flush = useCallback(() => {
    const snapshot: useEngagement.EngagementData = {
      ...dataRef.current,
      exitAt: Date.now(),
    }
    syncData(snapshot)
  }, [syncData])

  // ─── Active time ticker ───────────────────────────────────────────────────

  const startActiveTicker = useCallback(() => {
    if (activeTimerRef.current) return
    activeTimerRef.current = setInterval(() => {
      if (isActiveRef.current && !isIdleRef.current && !isHiddenRef.current) {
        dataRef.current = {
          ...dataRef.current,
          activeTime: dataRef.current.activeTime + 1,
        }
      } else {
        dataRef.current = {
          ...dataRef.current,
          idleTime: dataRef.current.idleTime + 1,
        }
      }

      if (mountedRef.current) {
        setData({ ...dataRef.current })
      }
    }, 1000)
  }, [])

  const stopActiveTicker = useCallback(() => {
    if (activeTimerRef.current) {
      clearInterval(activeTimerRef.current)
      activeTimerRef.current = null
    }
  }, [])

  // ─── Idle detection ───────────────────────────────────────────────────────

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

    if (isIdleRef.current) {
      isIdleRef.current = false
      isActiveRef.current = true
      setIsActive(true)
    }

    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true
      isActiveRef.current = false
      setIsActive(false)
    }, idleTimeout)
  }, [idleTimeout])

  
  useEffect(() => {
    if (!isBrowser()) return

    startActiveTicker()
    resetIdleTimer()

    const handleClick = (e: MouseEvent) => {
      if (!trackClicks) return
      resetIdleTimer()

      const target = e.target as HTMLElement
      const id = target?.id || target?.closest("[id]")?.id || ""

      dataRef.current = {
        ...dataRef.current,
        totalClicks: dataRef.current.totalClicks + 1,
        clickTargets: id
          ? [...new Set([...dataRef.current.clickTargets, id])]
          : dataRef.current.clickTargets,
      }

      if (mountedRef.current) setData({ ...dataRef.current })
    }

    const handleScroll = () => {
      if (!trackScroll) return
      resetIdleTimer()

      const depth = getScrollDepth()
      if (depth > dataRef.current.scrollDepth) {
        dataRef.current = { ...dataRef.current, scrollDepth: depth }
        if (mountedRef.current) setData({ ...dataRef.current })
      }
    }

    const handleActivity = () => resetIdleTimer()

    const handleVisibility = () => {
      if (document.hidden) {
        isHiddenRef.current = true
        isActiveRef.current = false
        setIsActive(false)
        flush()
      } else {
        isHiddenRef.current = false
        isActiveRef.current = true
        setIsActive(true)
        resetIdleTimer()
      }
    }

    const handleBeforeUnload = () => {
      flush()
    }

    const handleOnline = async () => {
      const queue = getQueue(storageKey)
      if (queue.length === 0) return
      for (const item of queue) {
        try {
          await onSyncRef.current(item)
        } catch {
          break
        }
      }
      clearQueue(storageKey)
    }

    document.addEventListener("click", handleClick)
    document.addEventListener("visibilitychange", handleVisibility)
    document.addEventListener("mousemove", handleActivity, { passive: true })
    document.addEventListener("keydown", handleActivity)
    document.addEventListener("touchstart", handleActivity, { passive: true })
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("online", handleOnline)

    if (trackScroll) {
      window.addEventListener("scroll", handleScroll, { passive: true })
    }

    return () => {
      stopActiveTicker()
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

      document.removeEventListener("click", handleClick)
      document.removeEventListener("visibilitychange", handleVisibility)
      document.removeEventListener("mousemove", handleActivity)
      document.removeEventListener("keydown", handleActivity)
      document.removeEventListener("touchstart", handleActivity)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("scroll", handleScroll)

      flush()
    }
  }, [
    trackClicks,
    trackScroll,
    storageKey,
    startActiveTicker,
    stopActiveTicker,
    resetIdleTimer,
    flush,
  ])

  return { data, isActive, flush }
}