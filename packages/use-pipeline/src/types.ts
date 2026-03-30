export type StepStatus =
  | "idle"
  | "running"
  | "complete"
  | "failed"
  | "skipped"
  | "rollingback"
  | "rolledback"

export type PipelineStatus =
  | "idle"
  | "running"
  | "complete"
  | "failed"
  | "rollingback"
  | "rolledback"

export interface PipelineStep<TResult = unknown> {
  /** Unique identifier for this step */
  id: string
  /** The async function to run for this step */
  run: (context: PipelineContext) => Promise<TResult>
  /** Optional rollback function called if pipeline fails */
  rollback?: (context: PipelineContext) => Promise<void> | void
  /** Step IDs this step depends on — will wait for them to complete first */
  dependsOn?: string[]
  /** If true, runs in parallel with other parallel steps at the same dependency level */
  parallel?: boolean
  /** Retry this step N times before marking as failed */
  retries?: number
}

export interface PipelineContext {
  /** Results from all previously completed steps keyed by step id */
  results: Record<string, unknown>
  /** Current attempt number for this step (starts at 1) */
  attempt: number
}

export interface PipelineStepState {
  id: string
  status: StepStatus
  error?: unknown
  result?: unknown
  attempts: number
  startedAt?: Date
  completedAt?: Date
}

export interface UsePipelineOptions<TSteps extends PipelineStep[]> {
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

export interface UsePipelineReturn {
  /** Current pipeline status */
  status: PipelineStatus
  /** All steps with their current state */
  steps: PipelineStepState[]
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
  is: (status: PipelineStatus) => boolean
}