export type AuthStatus = "idle" | "loading" | "authenticated" | "locked" | "error"

export type LockoutReason = "max_attempts" | "bot_detection"

export type StorageType = "localStorage" | "sessionStorage" | "memory"

export interface TokenPayload {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

export interface LockoutState {
  reason: LockoutReason
  lockedUntil: Date
}

export interface UseAuthOptions<C = unknown, U = unknown> {
  // Core
  onLogin: (credentials: C) => Promise<{ token: string; user?: U }>
  onLogout?: () => Promise<void> | void
  onRefresh?: () => Promise<string>
  onError?: (error: unknown) => void

  // JWT
  decodeToken?: boolean

  // Token expiry
  onTokenExpired?: () => void

  // Storage
  storage?: StorageType
  storageKey?: string

  // Brute force / rate limiting
  maxAttempts?: number
  lockoutDuration?: number     // seconds
  minAttemptInterval?: number  // ms — attempts faster than this = bot detection
}

export interface UseAuthReturn<C = unknown, U = unknown> {
  // State
  status: AuthStatus
  is: (s: AuthStatus) => boolean
  user: U | undefined
  token: string | null

  // Actions
  login: (credentials: C) => Promise<void>
  logout: () => Promise<void>

  // JWT
  tokenPayload: TokenPayload | null
  tokenExpiresAt: Date | null

  // Brute force
  attempts: number
  lockout: LockoutState | null
  remainingTime: number
  lockoutReason: LockoutReason | null
}