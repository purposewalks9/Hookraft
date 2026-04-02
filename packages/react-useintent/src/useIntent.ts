import { useState, useEffect, useRef, useCallback } from "react"
import type {
  IntentState,
  IntentSignal,
  UseIntentOptions,
  UseIntentReturn,
} from "./types"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function buildInitialState(): IntentState {
  return {
    isLeaving: false,
    isIdle: false,
    isEngaged: false,
    isLostInterest: false,
    isAboutToClick: false,
    isReturning: false,
    isTabHidden: false,
    isReading: false,
    timeOnPage: 0,
    scrollDepth: 0,
    scrollDirection: "idle",
    scrollSpeed: 0,
    signals: [],
    exitConfidence: 0,
    engagementScore: 0,
  }
}

function computeExitConfidence(state: Partial<IntentState>): number {
  let score = 0
  if (state.isLeaving) score += 50
  if (state.isLostInterest) score += 25
  if (state.isIdle) score += 10
  if (state.isTabHidden) score += 15
  if ((state.scrollDirection === "up") && (state.scrollDepth ?? 0) < 20) score += 10
  return Math.min(100, score)
}

function computeEngagementScore(state: Partial<IntentState>): number {
  let score = 0
  if (state.isReading) score += 35
  if (state.isEngaged) score += 30
  if ((state.scrollDepth ?? 0) > 50) score += 20
  if ((state.timeOnPage ?? 0) > 30000) score += 15
  if (state.isLostInterest) score -= 30
  if (state.isLeaving) score -= 40
  if (state.isIdle) score -= 10
  return Math.max(0, Math.min(100, score))
}

function buildSignals(state: Partial<IntentState>): IntentSignal[] {
  const signals: IntentSignal[] = []
  if (state.isLeaving) signals.push("leaving")
  if (state.isIdle) signals.push("idle")
  if (state.isEngaged) signals.push("engaged")
  if (state.isLostInterest) signals.push("lost_interest")
  if (state.isAboutToClick) signals.push("about_to_click")
  if (state.isReturning) signals.push("returning")
  if (state.isTabHidden) signals.push("tab_hidden")
  if (state.isReading) signals.push("reading")
  return signals
}

/**
 * useIntent
 *
 * Predict what users are about to do by listening to raw browser signals —
 * mouse movement, scroll velocity, idle time, tab visibility, and cursor
 * deceleration — and combining them into readable intent primitives.
 *
 * @example
 * const { isLeaving, isEngaged, exitConfidence, engagementScore } = useIntent({
 *   onLeaving: () => showExitPopup(),
 *   onIdle: () => pauseVideo(),
 *   onEngaged: (score) => trackEngagement(score),
 * })
 */
export function useIntent(options: UseIntentOptions = {}): UseIntentReturn {
  const {
    idleAfter = 30,
    skimThreshold = 800,
    readingThreshold = 100,
    exitThreshold = 20,
    onLeaving,
    onIdle,
    onReturn,
    onTabHidden,
    onTabVisible,
    onLostInterest,
    onEngaged,
    onChange,
  } = options

  const [state, setState] = useState<IntentState>(buildInitialState)

  // Refs for tracking without causing re-renders
  const lastScrollY = useRef(0)
  const lastScrollTime = useRef(Date.now())
  const lastMouseMove = useRef(Date.now())
  const lastActivity = useRef(Date.now())
  const startTime = useRef(Date.now())
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeOnPageTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const wasIdle = useRef(false)
  const wasHidden = useRef(false)
  const engagedFiredRef = useRef(false)
  const engagedThreshold = options.onEngaged ? 60 : Infinity

  // Callback refs to stay fresh
  const onLeavingRef = useRef(onLeaving)
  const onIdleRef = useRef(onIdle)
  const onReturnRef = useRef(onReturn)
  const onTabHiddenRef = useRef(onTabHidden)
  const onTabVisibleRef = useRef(onTabVisible)
  const onLostInterestRef = useRef(onLostInterest)
  const onEngagedRef = useRef(onEngaged)
  const onChangeRef = useRef(onChange)

  useEffect(() => { onLeavingRef.current = onLeaving }, [onLeaving])
  useEffect(() => { onIdleRef.current = onIdle }, [onIdle])
  useEffect(() => { onReturnRef.current = onReturn }, [onReturn])
  useEffect(() => { onTabHiddenRef.current = onTabHidden }, [onTabHidden])
  useEffect(() => { onTabVisibleRef.current = onTabVisible }, [onTabVisible])
  useEffect(() => { onLostInterestRef.current = onLostInterest }, [onLostInterest])
  useEffect(() => { onEngagedRef.current = onEngaged }, [onEngaged])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const updateState = useCallback((patch: Partial<IntentState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      next.signals = buildSignals(next)
      next.exitConfidence = computeExitConfidence(next)
      next.engagementScore = computeEngagementScore(next)
      next.timeOnPage = Date.now() - startTime.current

      // Fire engagement callback once when threshold crossed
      if (
        next.engagementScore >= engagedThreshold &&
        !engagedFiredRef.current
      ) {
        engagedFiredRef.current = true
        onEngagedRef.current?.(next.engagementScore)
      }

      onChangeRef.current?.(next)
      return next
    })
  }, [engagedThreshold])

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now()

    if (idleTimer.current) clearTimeout(idleTimer.current)

    // If returning from idle or hidden tab
    if (wasIdle.current || wasHidden.current) {
      wasIdle.current = false
      wasHidden.current = false
      updateState({ isIdle: false, isReturning: true, isLeaving: false })
      onReturnRef.current?.()

      setTimeout(() => updateState({ isReturning: false }), 2000)
    }

    idleTimer.current = setTimeout(() => {
      wasIdle.current = true
      updateState({ isIdle: true, isEngaged: false, isReading: false })
      onIdleRef.current?.()
    }, idleAfter * 1000)
  }, [idleAfter, updateState])

  useEffect(() => {
    if (!isBrowser()) return

    // ─── Mouse leave (exit intent) ───────────────────────────────────
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= exitThreshold) {
        updateState({ isLeaving: true })
        onLeavingRef.current?.()
      }
    }

    const handleMouseEnter = () => {
      updateState({ isLeaving: false })
    }

    // ─── Mouse move (activity + about to click detection) ────────────
    const mousePositions: { x: number; y: number; t: number }[] = []

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      lastMouseMove.current = now

      // Track last 5 positions to compute deceleration
      mousePositions.push({ x: e.clientX, y: e.clientY, t: now })
      if (mousePositions.length > 5) mousePositions.shift()

      // Compute cursor speed from last 2 positions
      if (mousePositions.length >= 2) {
        const prev = mousePositions[mousePositions.length - 2]
        const curr = mousePositions[mousePositions.length - 1]
        const dt = (curr.t - prev.t) / 1000
        if (dt > 0) {
          const dx = curr.x - prev.x
          const dy = curr.y - prev.y
          const speed = Math.sqrt(dx * dx + dy * dy) / dt

          // Cursor decelerating = about to click
          const isDecelerating =
            mousePositions.length === 5 &&
            speed < 100 &&
            mousePositions[0] !== mousePositions[4]

          updateState({ isAboutToClick: isDecelerating })
        }
      }

      resetIdleTimer()
    }

    // ─── Scroll (velocity + direction + depth) ───────────────────────
    const handleScroll = () => {
      const now = Date.now()
      const currentY = window.scrollY
      const dt = (now - lastScrollTime.current) / 1000
      const dy = currentY - lastScrollY.current

      const speed = dt > 0 ? Math.abs(dy) / dt : 0
      const direction = dy > 0 ? "down" : dy < 0 ? "up" : "idle"

      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const scrollDepth =
        docHeight > 0 ? Math.round((currentY / docHeight) * 100) : 0

      const isReading = speed < readingThreshold && speed > 0
      const isEngaged = speed > 0 && speed < skimThreshold
      const isLostInterest = speed > skimThreshold

      if (isLostInterest) {
        onLostInterestRef.current?.()
      }

      updateState({
        scrollSpeed: Math.round(speed),
        scrollDirection: direction,
        scrollDepth,
        isReading,
        isEngaged,
        isLostInterest,
      })

      lastScrollY.current = currentY
      lastScrollTime.current = now
      resetIdleTimer()
    }

    // ─── Tab visibility ───────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden.current = true
        updateState({ isTabHidden: true, isEngaged: false })
        onTabHiddenRef.current?.()
      } else {
        updateState({ isTabHidden: false, isReturning: true })
        onTabVisibleRef.current?.()
        onReturnRef.current?.()
        setTimeout(() => updateState({ isReturning: false }), 2000)
      }
    }

    // ─── Keypress (activity signal) ───────────────────────────────────
    const handleKeyPress = () => {
      resetIdleTimer()
      updateState({ isEngaged: true })
    }

    // ─── Time on page ticker ──────────────────────────────────────────
    timeOnPageTimer.current = setInterval(() => {
      updateState({ timeOnPage: Date.now() - startTime.current })
    }, 1000)

    // Attach all listeners
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)
    document.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("scroll", handleScroll, { passive: true })
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("keydown", handleKeyPress)

    // Start idle timer
    resetIdleTimer()

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
      document.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("keydown", handleKeyPress)
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (timeOnPageTimer.current) clearInterval(timeOnPageTimer.current)
    }
  }, [exitThreshold, readingThreshold, skimThreshold, resetIdleTimer, updateState])

  const reset = useCallback(() => {
    startTime.current = Date.now()
    lastScrollY.current = 0
    lastScrollTime.current = Date.now()
    lastActivity.current = Date.now()
    wasIdle.current = false
    wasHidden.current = false
    engagedFiredRef.current = false
    setState(buildInitialState())
    resetIdleTimer()
  }, [resetIdleTimer])

  return { ...state, reset }
}