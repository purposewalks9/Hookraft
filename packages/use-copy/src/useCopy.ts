import { useRef, useCallback, useState } from "react"

export declare namespace useCopy {
  type Options = {
    duration?: number
    stagger?: number
    resetDelay?: number
  }

  type Return = {
    textRef: React.RefObject<HTMLElement | null>
    iconRef: React.RefObject<HTMLButtonElement | null>
    copied: boolean
    trigger: () => void
  }
}

export function useCopy({
  duration = 200,
  stagger = 5,
  resetDelay = 1500,
}: useCopy.Options = {}): useCopy.Return {
  const textRef = useRef<HTMLElement | null>(null)
  const iconRef = useRef<HTMLButtonElement | null>(null)
  const [copied, setCopied] = useState(false)
  const animatingRef = useRef(false)

  const trigger = useCallback(() => {
    if (animatingRef.current) return

    const textEl = textRef.current
    const iconEl = iconRef.current
    if (!textEl || !iconEl) return

    const text = textEl.textContent ?? ""
    navigator.clipboard.writeText(text).catch(() => {})

    animatingRef.current = true
    setCopied(true)

    const textRect = textEl.getBoundingClientRect()
    const iconRect = iconEl.getBoundingClientRect()

    const targetX = iconRect.left + iconRect.width / 2

    const layer = document.createElement("div")
    layer.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(layer)

    const originalOpacity = textEl.style.opacity
    textEl.style.opacity = "0"

    const chars = text.split("")
    const charWidth = textRect.width / (chars.length || 1)
    const style = window.getComputedStyle(textEl)

    const spans: HTMLSpanElement[] = chars.map((ch, i) => {
      const span = document.createElement("span")
      span.textContent = ch === " " ? "\u00A0" : ch
      span.style.cssText = `
        position: fixed;
        left: ${textRect.left + i * charWidth}px;
        top: ${textRect.top}px;
        font-size: ${style.fontSize};
        font-family: ${style.fontFamily};
        font-weight: ${style.fontWeight};
        color: ${style.color};
        pointer-events: none;
        will-change: transform, opacity;
        line-height: ${style.lineHeight};
      `
      layer.appendChild(span)
      return span
    })

    spans.forEach((span, i) => {
      const startX = textRect.left + i * charWidth
      const delay = i * stagger

      setTimeout(() => {
        span.animate(
          [
            { transform: "translateX(0)", opacity: 1 },
            {
              transform: `translateX(${targetX - startX}px)`,
              opacity: 0,
            },
          ],
          {
            duration,
            delay: 0,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            fill: "forwards",
          }
        )
      }, delay)
    })

    const totalDuration = duration + chars.length * stagger

    setTimeout(() => {
      document.body.removeChild(layer)
      textEl.style.opacity = originalOpacity
      animatingRef.current = false
    }, totalDuration)

    setTimeout(() => {
      setCopied(false)
    }, totalDuration + resetDelay)
  }, [duration, stagger, resetDelay])

  return { textRef, iconRef, copied, trigger }
}