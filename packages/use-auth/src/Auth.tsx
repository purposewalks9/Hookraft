import { useEffect, type ReactNode } from "react"
import { AuthStatus } from "./types"

interface AuthProps {
  when: AuthStatus
  children?: ReactNode
  fallback?: ReactNode
  onAuthenticated?: () => void
  onLoading?: () => void
  onLocked?: () => void
  onError?: () => void
  onIdle?: () => void
}

function AuthRoot({
  when,
  children,
  fallback = null,
  onAuthenticated,
  onLoading,
  onLocked,
  onError,
  onIdle,
}: AuthProps) {
  useEffect(() => {
    if (when === "authenticated") onAuthenticated?.()
    if (when === "loading") onLoading?.()
    if (when === "locked") onLocked?.()
    if (when === "error") onError?.()
    if (when === "idle") onIdle?.()
  }, [when, onAuthenticated, onLoading, onLocked, onError, onIdle])

  if (when === "idle") return <>{fallback}</>
  return <>{children}</>
}

// ─── Slot components ─────────────────────────────────────────────────────────

function Authenticated({ when, children }: { when: AuthStatus; children: ReactNode }) {
  if (when !== "authenticated") return null
  return <>{children}</>
}

function Loading({ when, children }: { when: AuthStatus; children: ReactNode }) {
  if (when !== "loading") return null
  return <>{children}</>
}

function Locked({ when, children }: { when: AuthStatus; children: ReactNode }) {
  if (when !== "locked") return null
  return <>{children}</>
}

function Error({ when, children }: { when: AuthStatus; children: ReactNode }) {
  if (when !== "error") return null
  return <>{children}</>
}

// ─── Compose ──────────────────────────────────────────────────────────────────

export const Auth = Object.assign(AuthRoot, {
  Authenticated,
  Loading,
  Locked,
  Error,
})