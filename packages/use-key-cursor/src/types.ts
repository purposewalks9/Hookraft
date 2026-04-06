import type { RefObject } from "react"

export type CursorOrigin =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"

export type CursorTheme = "light" | "dark" | "system"

export type KeyTarget = RefObject<HTMLElement> | string

export interface UseKeyCursorOptions {
  keys: Record<string, KeyTarget>
  origin?: CursorOrigin
  color?: string
  theme?: CursorTheme

  onTrigger?: (key: string, element: HTMLElement) => void

  ignoreWhen?: () => boolean
}