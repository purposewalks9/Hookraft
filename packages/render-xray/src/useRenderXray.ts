
const IS_DEV: boolean = (() => {
  try {

    const env = (import.meta as unknown as Record<string, unknown>).env as { MODE?: string } | undefined
    if (env) return env.MODE !== 'production'
  } catch { /* not available */ }
  try {

    return (globalThis as any).__DEV__ ??
      (typeof process !== 'undefined' && (process as { env?: { NODE_ENV?: string } }).env?.NODE_ENV !== 'production')
  } catch { /* not available */ }
  return true
})()


export declare namespace useRenderXray {
  type Trigger = 'state' | 'props' | 'parent' | 'mixed'
  type ChangeReason =
    | 'value-changed'
    | 'object-value-changed'
    | 'same-value-new-reference'
    | 'new-function-reference'
    | 'added'
    | 'removed'
  type ChangeSource = 'prop' | 'state'

  type Severity = 'expected' | 'avoidable' | 'expensive'

  type Change = {
    source: ChangeSource
    key: string
    prev: unknown
    next: unknown
    reason: ChangeReason
    avoidable: boolean
    severity: Severity
  }

  type Record = {
    component: string
    renderCount: number

    stableRenderCount: number
    trigger: Trigger
    changes: Change[]
    hasAvoidableChanges: boolean

    duration?: number
    timestamp: number

    _isStrictModeReplay?: boolean
  }

  type FilterOptions = {
    includeProps?: boolean
    includeState?: boolean
    includeFunctions?: boolean
    includeParentTriggers?: boolean
  }

  type Options = {

    log?: boolean

    track?: boolean

    maxHistory?: number

    onlyAvoidable?: boolean

    onRender?: (record: useRenderXray.Record) => void

    filter?: FilterOptions
  }

  type Return = {

    renderCount: number

    stableRenderCount: number
    history: useRenderXray.Record[]
    clearHistory: () => void
  }
}

const DEFAULTS: Required<Omit<useRenderXray.Options, 'onRender' | 'filter'>> = {
  log: true,
  track: false,
  maxHistory: 50,
  onlyAvoidable: false,
}

import { useRef, useEffect } from 'react'
import { diffValues } from './diff'
import { logRecord } from './logger'
import process from 'next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss';

export function useRenderXray(
  componentName: string,
  props: Record<string, unknown>,
  state: Record<string, unknown> = {},
  options: useRenderXray.Options = {},
): useRenderXray.Return {

  if (!IS_DEV) return NOOP_RETURN

  const opts = { ...DEFAULTS, ...options }

  const prevProps = useRef<Record<string, unknown> | null>(null)
  const prevState = useRef<Record<string, unknown> | null>(null)
  const renderCount = useRef(0)
  const renderStartRef = useRef<number>(0)
  const history = useRef<useRenderXray.Record[]>([])
  const strictModeGuard = useRef<{ ts: number; count: number }>({ ts: 0, count: 0 })


  renderStartRef.current = performance.now()

  useEffect(() => {
    renderCount.current += 1
    const renderEnd = performance.now()
    const duration = renderEnd - renderStartRef.current

    const propChanges = diffValues('prop', prevProps.current, props)
    const stateChanges = diffValues('state', prevState.current, state)
    const allChanges = [...propChanges, ...stateChanges]
    const hasAvoidable = allChanges.some(c => c.avoidable)

    const trigger: useRenderXray.Trigger =
      allChanges.length === 0 ? 'parent' :
        propChanges.length > 0 && stateChanges.length > 0 ? 'mixed' :
          propChanges.length > 0 ? 'props' :
            'state'


    const now = Date.now()
    const sg = strictModeGuard.current
    const isSMReplay = now - sg.ts < 50 && sg.count > 0
    strictModeGuard.current = { ts: now, count: sg.count + 1 }


    const stableRenderCount = isSMReplay
      ? Math.ceil(renderCount.current / 2)
      : renderCount.current


    if (hasAvoidable || duration > 16) {
      allChanges.forEach(c => {
        if (duration > 16 && c.avoidable) c.severity = 'expensive'
      })
    }

    const record: useRenderXray.Record = {
      component: componentName,
      renderCount: renderCount.current,
      stableRenderCount,
      trigger,
      changes: allChanges,
      hasAvoidableChanges: hasAvoidable,
      duration,
      timestamp: now,
      _isStrictModeReplay: isSMReplay,
    }

    if (renderCount.current > 1) {
      const shouldLog =
        opts.log &&
        (opts.filter?.includeParentTriggers !== false || trigger !== 'parent' || isSMReplay
          ? true
          : trigger !== 'parent') &&
        (!opts.onlyAvoidable || hasAvoidable || trigger === 'parent')

      if (shouldLog) logRecord(record, opts.filter)

      if (opts.track) {
        history.current = [
          ...history.current.slice(-(opts.maxHistory - 1)),
          record,
        ]
      }

      opts.onRender?.(record)
    }

    prevProps.current = props
    prevState.current = state
  })

  return {
    renderCount: renderCount.current,
    stableRenderCount: Math.ceil(renderCount.current / 2),
    history: history.current,
    clearHistory: () => { history.current = [] },
  }
}


const NOOP_RETURN: useRenderXray.Return = {
  renderCount: 0,
  stableRenderCount: 0,
  history: [],
  clearHistory: () => { },
}