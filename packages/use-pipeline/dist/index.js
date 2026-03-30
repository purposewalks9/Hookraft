// src/usePipeline.ts
import { useState, useCallback, useRef } from "react";
function buildInitialSteps(steps) {
  return steps.map((s) => ({
    id: s.id,
    status: "idle",
    attempts: 0
  }));
}
function getExecutionOrder(steps) {
  const resolved = /* @__PURE__ */ new Set();
  const waves = [];
  const remaining = [...steps];
  while (remaining.length > 0) {
    const wave = [];
    for (const step of remaining) {
      const deps = step.dependsOn ?? [];
      const allResolved = deps.every((d) => resolved.has(d));
      if (allResolved) wave.push(step.id);
    }
    if (wave.length === 0) {
      throw new Error(
        "Circular dependency detected in pipeline steps. Check your dependsOn configuration."
      );
    }
    wave.forEach((id) => resolved.add(id));
    waves.push(wave);
    remaining.splice(
      0,
      remaining.length,
      ...remaining.filter((s) => !wave.includes(s.id))
    );
  }
  return waves;
}
function usePipeline(options) {
  const {
    steps: stepDefs,
    onStepComplete,
    onStepFailed,
    onStepRollback,
    onComplete,
    onFailed,
    onRollback
  } = options;
  const [status, setStatus] = useState("idle");
  const [steps, setSteps] = useState(
    buildInitialSteps(stepDefs)
  );
  const [current, setCurrent] = useState(null);
  const resultsRef = useRef({});
  const updateStep = useCallback(
    (id, patch) => {
      setSteps(
        (prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s)
      );
    },
    []
  );
  const runStep = useCallback(
    async (stepId) => {
      const stepDef = stepDefs.find((s) => s.id === stepId);
      if (!stepDef) return false;
      const maxAttempts = (stepDef.retries ?? 0) + 1;
      let attempt = 0;
      while (attempt < maxAttempts) {
        attempt++;
        updateStep(stepId, {
          status: "running",
          attempts: attempt,
          startedAt: /* @__PURE__ */ new Date(),
          error: void 0
        });
        setCurrent(stepId);
        try {
          const context = {
            results: { ...resultsRef.current },
            attempt
          };
          const result = await stepDef.run(context);
          resultsRef.current[stepId] = result;
          updateStep(stepId, {
            status: "complete",
            result,
            completedAt: /* @__PURE__ */ new Date()
          });
          onStepComplete?.(stepId, result);
          return true;
        } catch (error) {
          if (attempt >= maxAttempts) {
            updateStep(stepId, { status: "failed", error, completedAt: /* @__PURE__ */ new Date() });
            onStepFailed?.(stepId, error);
            return false;
          }
        }
      }
      return false;
    },
    [stepDefs, updateStep, onStepComplete, onStepFailed]
  );
  const rollback = useCallback(async () => {
    setStatus("rollingback");
    const completedSteps = [...stepDefs].reverse().filter((s) => {
      const state = steps.find((st) => st.id === s.id);
      return state?.status === "complete" && s.rollback;
    });
    for (const step of completedSteps) {
      updateStep(step.id, { status: "rollingback" });
      onStepRollback?.(step.id);
      try {
        await step.rollback?.({ results: { ...resultsRef.current }, attempt: 1 });
        updateStep(step.id, { status: "rolledback" });
      } catch {
        updateStep(step.id, { status: "rolledback" });
      }
    }
    setCurrent(null);
    setStatus("rolledback");
    onRollback?.();
  }, [stepDefs, steps, updateStep, onStepRollback, onRollback]);
  const runPipelineFrom = useCallback(
    async (fromStepId) => {
      setStatus("running");
      let waves;
      try {
        waves = getExecutionOrder(stepDefs);
      } catch (err) {
        console.error(err);
        setStatus("failed");
        return;
      }
      let startProcessing = !fromStepId;
      for (const wave of waves) {
        if (!startProcessing && fromStepId && wave.includes(fromStepId)) {
          startProcessing = true;
        }
        if (!startProcessing) continue;
        const parallelSteps = wave.filter((id) => {
          const def = stepDefs.find((s) => s.id === id);
          return def?.parallel;
        });
        const sequentialSteps = wave.filter((id) => !parallelSteps.includes(id));
        for (const stepId of sequentialSteps) {
          if (fromStepId && stepId !== fromStepId && !startProcessing) continue;
          const success = await runStep(stepId);
          if (!success) {
            const err = steps.find((s) => s.id === stepId)?.error;
            setStatus("failed");
            setCurrent(null);
            onFailed?.(stepId, err);
            await rollback();
            return;
          }
        }
        if (parallelSteps.length > 0) {
          const results = await Promise.allSettled(
            parallelSteps.map((id) => runStep(id))
          );
          const failedIndex = results.findIndex(
            (r) => r.status === "rejected" || r.status === "fulfilled" && !r.value
          );
          if (failedIndex !== -1) {
            const failedId = parallelSteps[failedIndex];
            const err = steps.find((s) => s.id === failedId)?.error;
            setStatus("failed");
            setCurrent(null);
            onFailed?.(failedId, err);
            await rollback();
            return;
          }
        }
      }
      setCurrent(null);
      setStatus("complete");
      onComplete?.({ ...resultsRef.current });
    },
    [stepDefs, steps, runStep, rollback, onFailed, onComplete]
  );
  const start = useCallback(async () => {
    if (status === "running") return;
    resultsRef.current = {};
    setSteps(buildInitialSteps(stepDefs));
    await runPipelineFrom();
  }, [status, stepDefs, runPipelineFrom]);
  const retry = useCallback(
    async (stepId) => {
      if (status === "running") return;
      const stepExists = stepDefs.find((s) => s.id === stepId);
      if (!stepExists) {
        console.warn(`usePipeline: step "${stepId}" not found`);
        return;
      }
      setSteps(
        (prev) => prev.map((s) => {
          if (s.id === stepId) return { ...s, status: "idle", error: void 0 };
          return s;
        })
      );
      await runPipelineFrom(stepId);
    },
    [status, stepDefs, runPipelineFrom]
  );
  const reset = useCallback(() => {
    resultsRef.current = {};
    setSteps(buildInitialSteps(stepDefs));
    setStatus("idle");
    setCurrent(null);
  }, [stepDefs]);
  const is = useCallback(
    (s) => status === s,
    [status]
  );
  const completedCount = steps.filter((s) => s.status === "complete").length;
  const progress = Math.round(completedCount / stepDefs.length * 100);
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
    is
  };
}
export {
  usePipeline
};
//# sourceMappingURL=index.js.map