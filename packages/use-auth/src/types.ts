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


  decodeToken?: boolean

  onTokenExpired?: () => void


  storage?: StorageType
  storageKey?: string


  maxAttempts?: number
  lockoutDuration?: number
  minAttemptInterval?: number
}

export interface UseAuthReturn<C = unknown, U = unknown> {

  status: AuthStatus
  is: (s: AuthStatus) => boolean
  user: U | undefined
  token: string | null


  login: (credentials: C) => Promise<void>
  logout: () => Promise<void>


  tokenPayload: TokenPayload | null
  tokenExpiresAt: Date | null

  attempts: number
  lockout: LockoutState | null
  remainingTime: number
  lockoutReason: LockoutReason | null
}