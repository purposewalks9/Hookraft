import { useSound } from "./useSound"

const PATTERNS: Record<useSound.HapticPattern, number | number[]> = {
  "click":         10,
  "double":        [10, 50, 10],
  "success":       [15, 40, 40],
  "error":         [30, 20, 30, 20, 30],
  "warning":       [20, 60, 20],
  "notification":  25,
  "impact-light":  5,
  "impact-medium": 15,
  "impact-heavy":  30,
  "selection":     8,
  "long":          [10, 30, 10, 30, 40],
}

export const SOUND_HAPTIC_MAP: Record<useSound.SoundName, useSound.HapticPattern> = {
  "click":        "click",
  "hover":        "impact-light",
  "scroll":       "selection",
  "modal-open":   "impact-medium",
  "modal-close":  "impact-light",
  "success":      "success",
  "error":        "error",
  "warning":      "warning",
  "toggle-on":    "double",
  "toggle-off":   "double",
  "notification": "notification",
  "delete":       "impact-heavy",
  "expand":       "impact-light",
  "collapse":     "impact-light",
  "swipe":        "impact-medium",
  "pop":          "click",
  "minimize":     "impact-light",
  "maximize":     "impact-medium",
  "typing":       "selection",
  "loading":      "selection",
  "complete":     "success",
  "coin":         "double",
}

export function triggerHaptic(pattern: useSound.HapticPattern): void {
  if (typeof navigator === "undefined") return
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  navigator.vibrate(PATTERNS[pattern])
}