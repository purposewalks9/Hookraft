"use client"

import { useEffect, useRef, useCallback } from "react"
import type { UseKeyCursorOptions, CursorOrigin, CursorTheme } from "./types"

const CURSOR_SIZE = 36
const FLY_DURATION = 480
const CLICK_DURATION = 280

function resolveTheme(theme: CursorTheme): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme

  const html = document.documentElement
  const dataTheme = html.getAttribute("data-theme")
  const classList = html.classList

  if (dataTheme === "dark" || classList.contains("dark")) return "dark"
  if (dataTheme === "light" || classList.contains("light")) return "light"

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getOriginCoords(origin: CursorOrigin): { x: number; y: number } {
  const W = window.innerWidth
  const H = window.innerHeight
  const pad = 32

  switch (origin) {
    case "top-right":    return { x: W - pad, y: pad }
    case "top-left":     return { x: pad,     y: pad }
    case "bottom-right": return { x: W - pad, y: H - pad }
    case "bottom-left":  return { x: pad,     y: H - pad }
  }
}

function resolveTarget(
  value: UseKeyCursorOptions["keys"][string]
): HTMLElement | null {
  if (typeof value === "string") {
    return document.querySelector<HTMLElement>(value)
  }
  return value.current ?? null
}

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === "input" || tag === "textarea" || tag === "select") return true
  if (el.getAttribute("contenteditable") === "true") return true
  return false
}

function createCursorEl(): HTMLDivElement {
  const wrap = document.createElement("div")
  wrap.setAttribute("data-key-cursor", "")

  Object.assign(wrap.style, {
    position:      "fixed",
    pointerEvents: "none",
    zIndex:        "999999",
    opacity:       "0",
    width:         `${CURSOR_SIZE}px`,
    height:        `${CURSOR_SIZE}px`,
    transform:     "translate(-50%, -50%)",
    top:           "0px",
    left:          "0px",
  })

  // Outer ring
  const outer = document.createElement("div")
  outer.setAttribute("data-cursor-outer", "")
  Object.assign(outer.style, {
    position:     "absolute",
    inset:        "0",
    borderRadius: "50%",
    border:       `3px solid transparent`,
    transition:   `transform ${CLICK_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
    boxSizing:    "border-box",
  })

  // Inner fill
  const inner = document.createElement("div")
  inner.setAttribute("data-cursor-inner", "")
  Object.assign(inner.style, {
    position:     "absolute",
    borderRadius: "50%",
    top:          "5px",
    left:         "5px",
    right:        "5px",
    bottom:       "5px",
    transition:   `transform ${CLICK_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
  })

  wrap.appendChild(outer)
  wrap.appendChild(inner)
  document.body.appendChild(wrap)
  return wrap
}

function paintCursor(
  wrap: HTMLDivElement,
  color: string,
  resolvedTheme: "light" | "dark"
): void {
  const outer = wrap.querySelector<HTMLElement>("[data-cursor-outer]")!
  const inner = wrap.querySelector<HTMLElement>("[data-cursor-inner]")!

  const fill   = resolvedTheme === "dark" ? "#000000" : "#ffffff"
  const shadow = resolvedTheme === "dark"
    ? `0 0 0 2px #000000`
    : `0 0 0 2px #ffffff`

  outer.style.borderColor = color
  outer.style.boxShadow   = shadow
  inner.style.background  = fill
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useKeyCursor(options: UseKeyCursorOptions): void {
  const {
    keys,
    origin      = "top-right",
    color       = "#000000",
    theme       = "system",
    onTrigger,
    ignoreWhen,
  } = options

  // Keep latest values accessible inside stable callbacks
  const keysRef        = useRef(keys)
  const originRef      = useRef(origin)
  const colorRef       = useRef(color)
  const themeRef       = useRef(theme)
  const onTriggerRef   = useRef(onTrigger)
  const ignoreWhenRef  = useRef(ignoreWhen)
  const animatingRef   = useRef(false)

  useEffect(() => { keysRef.current       = keys       }, [keys])
  useEffect(() => { originRef.current     = origin     }, [origin])
  useEffect(() => { colorRef.current      = color      }, [color])
  useEffect(() => { themeRef.current      = theme      }, [theme])
  useEffect(() => { onTriggerRef.current  = onTrigger  }, [onTrigger])
  useEffect(() => { ignoreWhenRef.current = ignoreWhen }, [ignoreWhen])

  const fly = useCallback(
    (wrap: HTMLDivElement, targetEl: HTMLElement, key: string) => {
      const resolved = resolveTheme(themeRef.current)
      paintCursor(wrap, colorRef.current, resolved)

      const { x, y } = getOriginCoords(originRef.current)

      // Snap to origin (no transition)
      wrap.style.transition = "none"
      wrap.style.left       = `${x}px`
      wrap.style.top        = `${y}px`
      wrap.style.opacity    = "1"

      const outer = wrap.querySelector<HTMLElement>("[data-cursor-outer]")!
      const inner = wrap.querySelector<HTMLElement>("[data-cursor-inner]")!
      outer.style.transform = "scale(1)"
      inner.style.transform = "scale(1)"

      // One rAF tick so the browser paints the snap position first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = targetEl.getBoundingClientRect()
          const tx   = rect.left + rect.width  / 2
          const ty   = rect.top  + rect.height / 2

          // Fly
          wrap.style.transition = [
            `left ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
            `top  ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
          ].join(", ")
          wrap.style.left = `${tx}px`
          wrap.style.top  = `${ty}px`

          // On landing
          setTimeout(() => {
            // Click squeeze
            outer.style.transform = "scale(0.7)"
            inner.style.transform = "scale(0.7)"

            // Fire the real click
            targetEl.click()
            onTriggerRef.current?.(key, targetEl)

            // Restore + fade out
            setTimeout(() => {
              outer.style.transform = "scale(1)"
              inner.style.transform = "scale(1)"

              wrap.style.transition = [
                `left    ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
                `top     ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
                `opacity 0.25s ease`,
              ].join(", ")
              wrap.style.opacity = "0"

              animatingRef.current = false
            }, CLICK_DURATION)
          }, FLY_DURATION + 10)
        })
      })
    },
    []
  )

  useEffect(() => {
    const wrap = createCursorEl()

    const handler = (e: KeyboardEvent) => {
      if (animatingRef.current)            return
      if (isTypingTarget(document.activeElement)) return
      if (ignoreWhenRef.current?.())       return

      const binding = keysRef.current[e.key]
      if (!binding) return

      const targetEl = resolveTarget(binding)
      if (!targetEl) return

      e.preventDefault()
      animatingRef.current = true
      fly(wrap, targetEl, e.key)
    }

    document.addEventListener("keydown", handler)

    return () => {
      document.removeEventListener("keydown", handler)
      wrap.remove()
    }
  }, [fly])
}