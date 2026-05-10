import type { useRenderXray } from './useRenderXray'

export function diffValues(
  source: useRenderXray.ChangeSource,
  prev: Record<string, unknown> | null,
  next: Record<string, unknown>,
): useRenderXray.Change[] {
  const changes: useRenderXray.Change[] = []
  const allKeys = new Set([...Object.keys(prev ?? {}), ...Object.keys(next)])

  allKeys.forEach((key) => {
    const prevVal = prev?.[key]
    const nextVal = next[key]
    if (Object.is(prevVal, nextVal)) return
    const hadKey = prev !== null && key in prev
    const hasKey = key in next
    const reason = classifyChange(prevVal, nextVal, hadKey, hasKey)
    const avoidable =
      reason === 'same-value-new-reference' || reason === 'new-function-reference'
    const severity: useRenderXray.Severity = avoidable ? 'avoidable' : 'expected'
    changes.push({ source, key, prev: prevVal, next: nextVal, reason, avoidable, severity })
  })

  return changes
}

function classifyChange(
  prev: unknown,
  next: unknown,
  hadKey: boolean,
  hasKey: boolean,
): useRenderXray.ChangeReason {
  if (!hadKey) return 'added'
  if (!hasKey) return 'removed'
  if (typeof prev === 'function' && typeof next === 'function') return 'new-function-reference'
  if (
    (isPlainObject(prev) && isPlainObject(next)) ||
    (Array.isArray(prev) && Array.isArray(next))
  ) {
    return safeDeepEqual(prev, next) ? 'same-value-new-reference' : 'object-value-changed'
  }

  if (isSpecialObject(prev) && isSpecialObject(next)) {
    return safeDeepEqual(prev, next) ? 'same-value-new-reference' : 'value-changed'
  }
  return 'value-changed'
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (val === null || typeof val !== 'object') return false
  const proto = Object.getPrototypeOf(val)
  return proto === Object.prototype || proto === null
}

function isSpecialObject(val: unknown): boolean {
  return (
    val instanceof Date ||
    val instanceof Map ||
    val instanceof Set ||
    val instanceof RegExp
  )
}

function safeDeepEqual(a: unknown, b: unknown, seen = new WeakSet()): boolean {
  if (Object.is(a, b)) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false

  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (a instanceof RegExp && b instanceof RegExp) return a.toString() === b.toString()

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false
    for (const [k, v] of a) {
      if (!b.has(k) || !safeDeepEqual(v, b.get(k), seen)) return false
    }
    return true
  }

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false

    try {
      const sa = JSON.stringify([...a].map(String).sort())
      const sb = JSON.stringify([...b].map(String).sort())
      return sa === sb
    } catch {
      return false
    }
  }

  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false


  if (seen.has(a as object)) return false
  seen.add(a as object)

  const keysA = [...Object.keys(a as object), ...Object.getOwnPropertySymbols(a as object)]
  const keysB = new Set([
    ...Object.keys(b as object),
    ...Object.getOwnPropertySymbols(b as object),
  ])

  if (keysA.length !== keysB.size) { seen.delete(a as object); return false }

  for (const k of keysA) {
    if (!keysB.has(k)) { seen.delete(a as object); return false }
    if (
      !safeDeepEqual(
        (a as Record<string | symbol, unknown>)[k],
        (b as Record<string | symbol, unknown>)[k],
        seen,
      )
    ) {
      seen.delete(a as object)
      return false
    }
  }

  seen.delete(a as object)
  return true
}


export function shallowDiff(
  prev: unknown,
  next: unknown,
): Array<{ key: string; prev: unknown; next: unknown }> {
  if (!isPlainObject(prev) && !Array.isArray(prev)) return []
  if (!isPlainObject(next) && !Array.isArray(next)) return []

  const p = prev as Record<string, unknown>
  const n = next as Record<string, unknown>
  const allKeys = new Set([...Object.keys(p), ...Object.keys(n)])
  const diffs: Array<{ key: string; prev: unknown; next: unknown }> = []

  allKeys.forEach((key) => {
    if (!Object.is(p[key], n[key])) {
      diffs.push({ key, prev: p[key], next: n[key] })
    }
  })
  return diffs
}