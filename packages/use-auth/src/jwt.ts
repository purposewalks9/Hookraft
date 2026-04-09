import { useAuth } from "./useAuth"

export function decodeJWT(token: string): useAuth.TokenPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = parts[1]
    // Pad base64 string if needed
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4)
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(decoded) as useAuth.TokenPayload
  } catch {
    return null
  }
}

export function getTokenExpiry(payload: useAuth.TokenPayload): Date | null {
  if (!payload.exp) return null
  return new Date(payload.exp * 1000)
}

export function isExpired(payload: useAuth.TokenPayload): boolean {
  const expiry = getTokenExpiry(payload)
  if (!expiry) return false
  return expiry.getTime() < Date.now()
}