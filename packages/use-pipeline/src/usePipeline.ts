import { useState, useCallback, useRef } from "react"

// ─── Namespace ────────────────────────────────────────────────────────────────

export declare namespace usePipeline {
  type StepStatus =
    | "idle"
    | "running"
    | "complete"
    | "failed"
    | "skipped"
    | "rollingback"
    | "rolledback"

  type Status =
    | "idle"
    | "running"
    | "complete"
    | "failed"
    | "rollingback"
    | "rolledback"

  interface Context {
    /** Results from all previously completed steps keyed by step id */
    results: Record<string, unknown>
    /** Current attempt number for this step (starts at 1) */
    attempt: number
  }

  interface Step<TResult = unknown> {
    /** Unique identifier for this step */
    id: string
    /** The async function to run for this step */
    run: (context: Context) => Promise<TResult>
    /** Optional rollback function called if pipeline fails */
    rollback?: (context: Context) => Promise<void> | void
    /** Step IDs this step depends on — will wait for them to complete first */
    dependsOn?: string[]
    /** If true, runs in parallel with other parallel steps at the same dependency level */
    parallel?: boolean
    /** Retry this step N times before marking as failed */
    retries?: number
  }

  interface StepState {
    id: string
    status: StepStatus
    error?: unknown
    result?: unknown
    attempts: number
    startedAt?: Date
    completedAt?: Date
  }

  interface Options<TSteps extends Step[]> {
    /** The steps to run in the pipeline */
    steps: TSteps
    /** Fires when a step completes successfully */
    onStepComplete?: (id: string, result: unknown) => void
    /** Fires when a step fails */
    onStepFailed?: (id: string, error: unknown) => void
    /** Fires when a step starts rolling back */
    onStepRollback?: (id: string) => void
    /** Fires when all steps complete successfully */
    onComplete?: (results: Record<string, unknown>) => void
    /** Fires when pipeline fails */
    onFailed?: (failedStepId: string, error: unknown) => void
    /** Fires when rollback completes */
    onRollback?: () => void
  }

  interface Return {
    /** Current pipeline status */
    status: Status
    /** All steps with their current state */
    steps: StepState[]
    /** Progress percentage 0-100 based on completed steps */
    progress: number
    /** The step currently running */
    current: string | null
    /** Results from all completed steps */
    results: Record<string, unknown>
    /** Start the pipeline */
    start: () => Promise<void>
    /** Retry a specific failed step and continue from there */
    retry: (stepId: string) => Promise<void>
    /** Manually trigger rollback of all completed steps */
    rollback: () => Promise<void>
    /** Reset pipeline back to idle */
    reset: () => void
    /** Check current pipeline status */
    is: (status: Status) => boolean
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialSteps(steps: usePipeline.Step[]): usePipeline.StepState[] {
  return steps.map((s) => ({
    id: s.id,
    status: "idle",
    attempts: 0,
  }))
}

function getExecutionOrder(steps: usePipeline.Step[]): string[][] {
  // Topological sort — group steps into waves based on dependencies
  const resolved = new Set<string>()
  const waves: string[][] = []
  const remaining = [...steps]

  while (remaining.length > 0) {
    const wave: string[] = []

    for (const step of remaining) {
      const deps = step.dependsOn ?? []
      const allResolved = deps.every((d) => resolved.has(d))
      if (allResolved) wave.push(step.id)
    }

    if (wave.length === 0) {
      throw new Error(
        "Circular dependency detected in pipeline steps. Check your dependsOn configuration."
      )
    }

    wave.forEach((id) => resolved.add(id))
    waves.push(wave)
    remaining.splice(
      0,
      remaining.length,
      ...remaining.filter((s) => !wave.includes(s.id))
    )
  }

  return waves
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePipeline<TSteps extends usePipeline.Step[]>(
  options: usePipeline.Options<TSteps>
): usePipeline.Return {
  const {
    steps: stepDefs,
    onStepComplete,
    onStepFailed,
    onStepRollback,
    onComplete,
    onFailed,
    onRollback,
  } = options

  const [status, setStatus] = useState<usePipeline.Status>("idle")
  const [steps, setSteps] = useState<usePipeline.StepState[]>(
    buildInitialSteps(stepDefs)
  )
  const [current, setCurrent] = useState<string | null>(null)
  const resultsRef = useRef<Record<string, unknown>>({})

  const updateStep = useCallback(
    (id: string, patch: Partial<usePipeline.StepState>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      )
    },
    []
  )

  const runStep = useCallback(
    async (stepId: string): Promise<boolean> => {
      const stepDef = stepDefs.find((s) => s.id === stepId)
      if (!stepDef) return false

      const maxAttempts = (stepDef.retries ?? 0) + 1
      let attempt = 0

      while (attempt < maxAttempts) {
        attempt++
        updateStep(stepId, {
          status: "running",
          attempts: attempt,
          startedAt: new Date(),
          error: undefined,
        })
        setCurrent(stepId)

        try {
          const context: usePipeline.Context = {
            results: { ...resultsRef.current },
            attempt,
          }

          const result = await stepDef.run(context)
          resultsRef.current[stepId] = result

          updateStep(stepId, {
            status: "complete",
            result,
            completedAt: new Date(),
          })

          onStepComplete?.(stepId, result)
          return true
        } catch (error) {
          if (attempt >= maxAttempts) {
            updateStep(stepId, { status: "failed", error, completedAt: new Date() })
            onStepFailed?.(stepId, error)
            return false
          }
          // will retry
        }
      }

      return false
    },
    [stepDefs, updateStep, onStepComplete, onStepFailed]
  )

  const rollback = useCallback(async () => {
    setStatus("rollingback")

    const completedSteps = [...stepDefs]
      .reverse()
      .filter((s) => {
        const state = steps.find((st) => st.id === s.id)
        return state?.status === "complete" && s.rollback
      })

    for (const step of completedSteps) {
      updateStep(step.id, { status: "rollingback" })
      onStepRollback?.(step.id)

      try {
        await step.rollback?.({ results: { ...resultsRef.current }, attempt: 1 })
        updateStep(step.id, { status: "rolledback" })
      } catch {
        // best effort rollback — continue even if rollback fails
        updateStep(step.id, { status: "rolledback" })
      }
    }

    setCurrent(null)
    setStatus("rolledback")
    onRollback?.()
  }, [stepDefs, steps, updateStep, onStepRollback, onRollback])

  const runPipelineFrom = useCallback(
    async (fromStepId?: string) => {
      setStatus("running")

      let waves: string[][]
      try {
        waves = getExecutionOrder(stepDefs)
      } catch (err) {
        console.error(err)
        setStatus("failed")
        return
      }

      let startProcessing = !fromStepId

      for (const wave of waves) {
        if (!startProcessing && fromStepId && wave.includes(fromStepId)) {
          startProcessing = true
        }
        if (!startProcessing) continue

        const parallelSteps = wave.filter((id) => {
          const def = stepDefs.find((s) => s.id === id)
          return def?.parallel
        })
        const sequentialSteps = wave.filter((id) => !parallelSteps.includes(id))

        for (const stepId of sequentialSteps) {
          if (fromStepId && stepId !== fromStepId && !startProcessing) continue
          const success = await runStep(stepId)
          if (!success) {
            const err = steps.find((s) => s.id === stepId)?.error
            setStatus("failed")
            setCurrent(null)
            onFailed?.(stepId, err)
            await rollback()
            return
          }
        }

        if (parallelSteps.length > 0) {
          const results = await Promise.allSettled(
            parallelSteps.map((id) => runStep(id))
          )

          const failedIndex = results.findIndex(
            (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value)
          )

          if (failedIndex !== -1) {
            const failedId = parallelSteps[failedIndex]
            const err = steps.find((s) => s.id === failedId)?.error
            setStatus("failed")
            setCurrent(null)
            onFailed?.(failedId, err)
            await rollback()
            return
          }
        }
      }

      setCurrent(null)
      setStatus("complete")
      onComplete?.({ ...resultsRef.current })
    },
    [stepDefs, steps, runStep, rollback, onFailed, onComplete]
  )

  const start = useCallback(async () => {
    if (status === "running") return
    resultsRef.current = {}
    setSteps(buildInitialSteps(stepDefs))
    await runPipelineFrom()
  }, [status, stepDefs, runPipelineFrom])

  const retry = useCallback(
    async (stepId: string) => {
      if (status === "running") return
      const stepExists = stepDefs.find((s) => s.id === stepId)
      if (!stepExists) {
        console.warn(`usePipeline: step "${stepId}" not found`)
        return
      }

      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === stepId) return { ...s, status: "idle", error: undefined }
          return s
        })
      )

      await runPipelineFrom(stepId)
    },
    [status, stepDefs, runPipelineFrom]
  )

  const reset = useCallback(() => {
    resultsRef.current = {}
    setSteps(buildInitialSteps(stepDefs))
    setStatus("idle")
    setCurrent(null)
  }, [stepDefs])

  const is = useCallback(
    (s: usePipeline.Status) => status === s,
    [status]
  )

  const completedCount = steps.filter((s) => s.status === "complete").length
  const progress = Math.round((completedCount / stepDefs.length) * 100)

  return {
    status,
    steps,
    progress,
    current,
    results: resultsRef.current,
    start,
    retry,
    rollback,
    reset,
    is,
  }
}