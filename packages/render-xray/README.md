# @hookraft/render-xray

X-ray vision for React re-renders. Drop one line into any component and see exactly **which prop, state value, or function reference caused the re-render** — and whether it was even necessary.

Zero config. No Babel setup. No monkey-patching React. **React Compiler compatible.**

---

## Why this exists

[`@welldone-software/why-did-you-render`](https://github.com/welldone-software/why-did-you-render) is the existing solution, but it has real problems:

- Requires Babel config changes and monkey-patching React globally
- **Completely incompatible with React Compiler** (the maintainer's own words)
- Needs a static flag on every component (`MyComponent.whyDidYouRender = true`)
- Effectively unmaintained — the author joined the React team

`render-xray` is a hook. You add one line. It works everywhere React works.

---

## Install

```bash
npm install @hookraft/render-xray
# or
yarn add @hookraft/render-xray
# or
pnpm add @hookraft/render-xray
```

> **Dev-only** — remove before shipping to production (or use the no-op pattern below).

---

## Usage

### Basic — track props

```tsx
import { useRenderXray } from '@hookraft/render-xray'

function MyComponent(props) {
  useRenderXray('MyComponent', props)
  return <div>{props.name}</div>
}
```

### Track props + state together

```tsx
function MyComponent(props) {
  const [count, setCount] = useState(0)
  const [open, setOpen]   = useState(false)

  useRenderXray('MyComponent', props, { count, open })

  return <div>...</div>
}
```

### With options

```tsx
useRenderXray('MyComponent', props, { count }, {
  onlyAvoidable: true,   // only log avoidable recreations
  track: true,           // collect history for custom overlays / tests
  onRender: (record) => sendToAnalytics(record),
})
```

### With log filtering

```tsx
useRenderXray('MyComponent', props, { count }, {
  filter: {
    includeProps:      true,
    includeState:      true,
    includeFunctions:  false,  // silence function-reference noise
    includeParentTriggers: false,
  },
})
```

### TypeScript

```tsx
function MyComponent(props: MyProps) {
  const [count, setCount] = useState(0)

  useRenderXray(
    'MyComponent',
    props as Record<string, unknown>,
    { count },
  )
  ...
}
```

---

## What you see in the console

All groups are **collapsed by default** to keep the console clean in large apps. Click to expand.

### Avoidable — new object reference, same value
```
▶ [render-xray] MyComponent re-rendered (props changed)
    render #4
    🟢 render duration: 2.1ms
    🟡 [prop] user ← same value, new reference
        fix: wrap in useMemo()
        changed keys:
          (none — content is identical)
    ⚠ 1 avoidable prop/value recreation detected during this render.
      See flagged changes above for useMemo / useCallback opportunities.
```

### Avoidable — new function every render
```
▶ [render-xray] MyComponent re-rendered (props changed)
    render #5
    🟢 render duration: 1.8ms
    🟡 [prop] onClick ← new function on every render
        fix: wrap in useCallback()
```

### Expected — value actually changed
```
▶ [render-xray] MyComponent re-rendered (state changed)
    render #6
    🟢 render duration: 3.4ms
    🟢 [state] count ← changed
        prev: 2
        next: 3
```

### Parent triggered it (inferred)
```
▶ [render-xray] MyComponent re-rendered (render source inferred: parent)
    render #7
    🟢 render duration: 1.2ms
    → No local changes detected — render source inferred as parent.
      Tip: this component may benefit from memoization (React.memo / equivalent).
```

### Expensive render
```
▶ [render-xray] MyComponent re-rendered (props changed)
    render #8
    🔴 render duration: 24.6ms
    🔴 [prop] data ← same value, new reference
        fix: wrap in useMemo()
    ⚠ 1 avoidable prop/value recreation detected during this render.
```

### React Strict Mode replay (dev only)
```
▶ [render-xray] MyComponent React StrictMode replay (dev only)
    This is a development-only double-invoke. Ignore for production analysis.
```

---

## Severity levels

Every change is tagged with a severity so you know what to prioritise:

| Icon | Severity | Meaning |
|------|----------|---------|
| 🟢 | `expected` | Value genuinely changed — no action needed |
| 🟡 | `avoidable` | Same value, new reference — `useMemo` / `useCallback` opportunity |
| 🔴 | `expensive` | Avoidable change AND render took >16 ms — fix this first |

---

## Change types

| Reason | Severity | Meaning | Fix |
|--------|----------|---------|-----|
| `value-changed` | 🟢 expected | Primitive changed | None needed |
| `object-value-changed` | 🟢 expected | Object content changed | None needed |
| `same-value-new-reference` | 🟡 avoidable | Same content, new object | `useMemo` |
| `new-function-reference` | 🟡 avoidable | New function every render | `useCallback` |
| `added` | 🟢 expected | New key appeared | — |
| `removed` | 🟢 expected | Key was removed | — |
| parent trigger (inferred) | 🟣 purple | Nothing local changed | Consider memoization |

---

## Options

```ts
interface Options {
  /** Log to console on every re-render. Default: true */
  log?: boolean

  /** Collect render records in history[]. Default: false */
  track?: boolean

  /** Max records to keep in history. Default: 50 */
  maxHistory?: number

  /** Only log when re-render included avoidable changes or a parent trigger. Default: false */
  onlyAvoidable?: boolean

  /** Called after every re-render with the full record */
  onRender?: (record: useRenderXray.Record) => void

  /** Fine-grained control over which changes appear in logs */
  filter?: {
    includeProps?:          boolean  // default: true
    includeState?:          boolean  // default: true
    includeFunctions?:      boolean  // default: true
    includeParentTriggers?: boolean  // default: true
  }
}
```

## Return value

```ts
const { renderCount, stableRenderCount, history, clearHistory } = useRenderXray(...)

renderCount        // number — raw render count (may be doubled in Strict Mode dev)
stableRenderCount  // number — estimated production render count (halved in Strict Mode)
history            // RenderRecord[] — collected records (when track: true)
clearHistory       // () => void — clears the history array
```

---

## Strict Mode handling

React Strict Mode intentionally double-invokes effects in development. `render-xray` detects these replays within a 50 ms window and annotates them clearly instead of logging them as real renders:

```
▶ [render-xray] MyComponent React StrictMode replay (dev only)
    This is a development-only double-invoke. Ignore for production analysis.
```

`stableRenderCount` gives you an estimated production-equivalent count (approximately half the raw count in Strict Mode dev).

---

## Strip in production

**Option 1 — conditional call (simplest)**
```ts
if (process.env.NODE_ENV === 'development') {
  useRenderXray('MyComponent', props)
}
```

**Option 2 — no-op wrapper (leave calls in, tree-shaken in prod)**

```ts
// lib/renderXray.ts
import type { useRenderXray } from '@hookraft/render-xray'

type Hook = typeof import('@hookraft/render-xray').useRenderXray

const noop: ReturnType<Hook> = {
  renderCount: 0,
  stableRenderCount: 0,
  history: [],
  clearHistory: () => {},
}

export const useRenderXray: Hook =
  process.env.NODE_ENV === 'development'
    ? require('@hookraft/render-xray').useRenderXray
    : () => noop
```

---

## Works with

| Framework | Works? |
|-----------|--------|
| Next.js (app + pages router) | ✅ |
| Vite + React | ✅ |
| Remix | ✅ |
| Create React App | ✅ |
| React Native | ✅ |
| React Compiler | ✅ |
| React 17 / 18 / 19 | ✅ |

---

## Part of the Hookraft family

Built and maintained by [Hookraft](https://hookraft.site) — a collection of serious React developer tools.

MIT License