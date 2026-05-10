import type { useRenderXray } from './useRenderXray'
import { shallowDiff } from './diff'


const S = {
  prefix: 'color:#888;font-weight:normal',
  amber: 'color:#f59e0b;font-weight:bold',
  red: 'color:#ef4444;font-weight:bold',
  blue: 'color:#3b82f6;font-weight:bold',
  purple: 'color:#a78bfa;font-weight:bold',
  green: 'color:#22c55e;font-weight:bold',
  muted: 'color:#888',
  count: 'color:#64748b',
  hint: 'color:#ef4444',
  replay: 'color:#f59e0b;font-style:italic',
  perf: 'color:#06b6d4;font-weight:bold',
} as const


const _lastLogKey = new Map<string, { hash: string; time: number }>()
const REPLAY_WINDOW_MS = 50

function recordHash(record: useRenderXray.Record): string {
  return `${record.component}|${record.renderCount}|${record.trigger}|${record.changes.map(c => c.key + c.reason).join(',')}`
}


export function classifyLogAttempt(
  record: useRenderXray.Record,
): 'first' | 'replay' | 'suppress' {
  const key = record.component
  const hash = recordHash(record)
  const prev = _lastLogKey.get(key)
  const now = record.timestamp

  if (prev && prev.hash === hash && now - prev.time < REPLAY_WINDOW_MS) {
    _lastLogKey.set(key, { hash, time: now })
    return 'replay'
  }

  _lastLogKey.set(key, { hash, time: now })
  return 'first'
}


export function logRecord(
  record: useRenderXray.Record,
  filterOpts?: useRenderXray.FilterOptions,
): void {
  const logAttempt = classifyLogAttempt(record)


  if (logAttempt === 'replay') {
    console.groupCollapsed(
      `%c[render-xray] %c${record.component} %cReact StrictMode replay (dev only)`,
      S.prefix, S.muted, S.replay,
    )
    console.log('%cThis is a development-only double-invoke. Ignore for production analysis.', S.replay)
    console.groupEnd()
    return
  }

  const { component, renderCount, trigger, changes, hasAvoidableChanges, duration } = record


  const visibleChanges = applyFilters(changes, filterOpts)


  const headerColor =
    trigger === 'parent' ? S.purple :
      hasAvoidableChanges ? S.red :
        S.blue


  const groupFn = record.renderCount === 1 ? console.groupCollapsed : console.groupCollapsed
  groupFn(
    `%c[render-xray] %c${component} %c${triggerLabel(trigger)}`,
    S.prefix, headerColor, S.muted,
  )


  const devAnnotation = record._isStrictModeReplay ? ' (StrictMode double-invoke)' : ''
  console.log(`%crender #${renderCount}${devAnnotation}`, S.count)


  if (duration !== undefined) {
    const durationColor = duration > 16 ? S.red : duration > 8 ? S.amber : S.perf
    const durationIcon = duration > 16 ? '🔴' : duration > 8 ? '🟡' : '🟢'
    console.log(`%c${durationIcon} render duration: ${duration.toFixed(2)}ms`, durationColor)
  }


  if (trigger === 'parent') {
    console.log('%c→ No local changes detected — render source inferred as parent.', S.muted)
    console.log(
      '%c  Tip: this component may benefit from memoization (React.memo / equivalent).',
      S.hint,
    )
  }


  visibleChanges.forEach(logChange)


  if (hasAvoidableChanges) {
    const avoidableCount = changes.filter(c => c.avoidable).length
    console.warn(
      `⚠  ${avoidableCount} avoidable prop/value recreation${avoidableCount !== 1 ? 's' : ''} detected during this render.` +
      ' See flagged changes above for useMemo / useCallback opportunities.',
    )
  }

  console.groupEnd()
}


function logChange(c: useRenderXray.Change): void {
  const severityIcon =
    c.severity === 'avoidable' ? '🟡' :
      c.severity === 'expensive' ? '🔴' : '🟢'

  const label = `  ${severityIcon} [${c.source}] ${c.key}`

  switch (c.reason) {
    case 'same-value-new-reference': {
      console.groupCollapsed(`%c${label} %c← same value, new reference`, S.amber, S.red)
      console.log('%c  fix: wrap in useMemo()', S.hint)
      const diff = shallowDiff(c.prev, c.next)
      if (diff.length) {
        console.groupCollapsed('  changed keys:')
        diff.forEach(d => console.log(`    .${d.key}`, '→', d.next))
        console.groupEnd()
      } else {
        console.log('  prev:', c.prev)
        console.log('  next:', c.next)
      }
      console.groupEnd()
      break
    }

    case 'new-function-reference': {
      console.groupCollapsed(`%c${label} %c← new function on every render`, S.amber, S.red)
      console.log('%c  fix: wrap in useCallback()', S.hint)
      console.log('  prev:', (c.prev as Function).toString().slice(0, 120))
      console.log('  next:', (c.next as Function).toString().slice(0, 120))
      console.groupEnd()
      break
    }

    case 'object-value-changed': {
      console.groupCollapsed(`%c${label} %c← object value changed`, S.amber, S.muted)
      const diff = shallowDiff(c.prev, c.next)
      if (diff.length) {
        console.groupCollapsed('  changed keys:')
        diff.forEach(d => console.log(`    .${d.key}`, 'prev:', d.prev, '→ next:', d.next))
        console.groupEnd()
      } else {
        console.log('  prev:', c.prev)
        console.log('  next:', c.next)
      }
      console.groupEnd()
      break
    }

    case 'added': {
      console.groupCollapsed(`%c${label} %c← added`, S.amber, S.muted)
      console.log('  value:', c.next)
      console.groupEnd()
      break
    }

    case 'removed': {
      console.groupCollapsed(`%c${label} %c← removed`, S.amber, S.muted)
      console.log('  was:', c.prev)
      console.groupEnd()
      break
    }

    default: {
      console.groupCollapsed(`%c${label} %c← changed`, S.amber, S.muted)
      console.log('  prev:', c.prev)
      console.log('  next:', c.next)
      console.groupEnd()
    }
  }
}


function triggerLabel(trigger: useRenderXray.Trigger): string {
  switch (trigger) {
    case 'parent': return 're-rendered (render source inferred: parent)'
    case 'state': return 're-rendered (state changed)'
    case 'props': return 're-rendered (props changed)'
    case 'mixed': return 're-rendered (props + state changed)'
  }
}

function applyFilters(
  changes: useRenderXray.Change[],
  opts?: useRenderXray.FilterOptions,
): useRenderXray.Change[] {
  if (!opts) return changes
  return changes.filter(c => {
    if (opts.includeProps === false && c.source === 'prop') return false
    if (opts.includeState === false && c.source === 'state') return false
    if (opts.includeFunctions === false && c.reason === 'new-function-reference') return false
    return true
  })
}