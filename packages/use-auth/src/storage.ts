import { useAuth } from "./useAuth"

const memoryStore: Record<string, string> = {}

export function createStorage(type: useAuth.StorageType) {
  function get(key: string): string | null {
    if (type === "memory") return memoryStore[key] ?? null
    try {
      return window[type].getItem(key)
    } catch {
      return null
    }
  }

  function set(key: string, value: string): void {
    if (type === "memory") {
      memoryStore[key] = value
      return
    }
    try {
      window[type].setItem(key, value)
    } catch {
      // storage might be unavailable (SSR, private mode, etc.)
    }
  }

  function remove(key: string): void {
    if (type === "memory") {
      delete memoryStore[key]
      return
    }
    try {
      window[type].removeItem(key)
    } catch {}
  }

  return { get, set, remove }
}