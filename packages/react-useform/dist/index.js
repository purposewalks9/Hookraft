// src/useForm.ts
import { useState, useCallback, useRef } from "react";

// src/validate.ts
function validateValue(value, rules = [], allValues) {
  for (const rule of rules) {
    if (rule.required) {
      const empty = value === "" || value === null || value === void 0 || typeof value === "string" && value.trim() === "";
      if (empty) return rule.message ?? "This field is required";
    }
    if (value === "" || value === null || value === void 0) continue;
    if (rule.minLength !== void 0 && typeof value === "string") {
      if (value.length < rule.minLength) {
        return rule.message ?? `Must be at least ${rule.minLength} characters`;
      }
    }
    if (rule.maxLength !== void 0 && typeof value === "string") {
      if (value.length > rule.maxLength) {
        return rule.message ?? `Must be no more than ${rule.maxLength} characters`;
      }
    }
    if (rule.min !== void 0 && typeof value === "number") {
      if (value < rule.min) {
        return rule.message ?? `Must be at least ${rule.min}`;
      }
    }
    if (rule.max !== void 0 && typeof value === "number") {
      if (value > rule.max) {
        return rule.message ?? `Must be no more than ${rule.max}`;
      }
    }
    if (rule.pattern && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        return rule.message ?? "Invalid format";
      }
    }
    if (rule.validate) {
      const result = rule.validate(value, allValues);
      if (result === false) return rule.message ?? "Invalid value";
      if (typeof result === "string") return result;
    }
  }
  return void 0;
}

// src/useForm.ts
function buildInitialFieldState(config) {
  return {
    value: config.value,
    error: void 0,
    touched: false,
    isDirty: false,
    isValid: true,
    disabled: config.disabled ?? false
  };
}
function buildInitialState(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([name, config]) => [
      name,
      buildInitialFieldState(config)
    ])
  );
}
function extractValues(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.value])
  );
}
function extractErrors(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.error])
  );
}
function useForm(options) {
  const {
    fields: fieldConfigs,
    onSubmit,
    onSuccess,
    onError,
    onChange,
    validateOn = "blur"
  } = options;
  const [fields, setFields] = useState(
    () => buildInitialState(fieldConfigs)
  );
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState(void 0);
  const fieldConfigsRef = useRef(fieldConfigs);
  const onSubmitRef = useRef(onSubmit);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onChangeRef = useRef(onChange);
  fieldConfigsRef.current = fieldConfigs;
  onSubmitRef.current = onSubmit;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onChangeRef.current = onChange;
  const getValues = useCallback(
    (currentFields) => extractValues(currentFields),
    []
  );
  const validateField = useCallback(
    (name, currentFields) => {
      const stateToUse = currentFields ?? fields;
      const config = fieldConfigsRef.current[name];
      const field = stateToUse[name];
      if (!config || !field) return true;
      const allValues = extractValues(stateToUse);
      const error = validateValue(field.value, config.rules, allValues);
      setFields((prev) => ({
        ...prev,
        [name]: { ...prev[name], error, isValid: !error }
      }));
      return !error;
    },
    [fields]
  );
  const validateAll = useCallback(() => {
    let allValid = true;
    setFields((prev) => {
      const allValues = extractValues(prev);
      const updated = { ...prev };
      for (const [name, config] of Object.entries(fieldConfigsRef.current)) {
        const error = validateValue(
          prev[name]?.value ?? config.value,
          config.rules,
          allValues
        );
        updated[name] = {
          ...prev[name],
          error,
          isValid: !error,
          touched: true
        };
        if (error) allValid = false;
      }
      return updated;
    });
    return allValid;
  }, []);
  const setValue = useCallback(
    (name, value) => {
      setFields((prev) => {
        const config = fieldConfigsRef.current[name];
        const initial = config?.value;
        const isDirty2 = value !== initial;
        const updated = {
          ...prev,
          [name]: {
            ...prev[name],
            value,
            isDirty: isDirty2
          }
        };
        if (validateOn === "change") {
          const allValues = extractValues(updated);
          const error = validateValue(value, config?.rules, allValues);
          updated[name] = {
            ...updated[name],
            error,
            isValid: !error
          };
        }
        onChangeRef.current?.(extractValues(updated), name);
        return updated;
      });
    },
    [validateOn]
  );
  const setTouched = useCallback(
    (name) => {
      setFields((prev) => {
        const config = fieldConfigsRef.current[name];
        const field = prev[name];
        const updated = { ...prev };
        if (validateOn === "blur") {
          const allValues = extractValues(prev);
          const error = validateValue(field?.value, config?.rules, allValues);
          updated[name] = {
            ...field,
            touched: true,
            error,
            isValid: !error
          };
        } else {
          updated[name] = { ...field, touched: true };
        }
        return updated;
      });
    },
    [validateOn]
  );
  const setError = useCallback((name, error) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], error, isValid: false }
    }));
  }, []);
  const clearError = useCallback((name) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name], error: void 0, isValid: true }
    }));
  }, []);
  const submit = useCallback(async () => {
    const valid = validateAll();
    if (!valid) return;
    const currentValues = extractValues(fields);
    setStatus("submitting");
    setSubmitError(void 0);
    try {
      await onSubmitRef.current?.(currentValues);
      setStatus("success");
      onSuccessRef.current?.(currentValues);
    } catch (err) {
      setStatus("error");
      setSubmitError(err);
      onErrorRef.current?.(err, currentValues);
    }
  }, [fields, validateAll]);
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      await submit();
    },
    [submit]
  );
  const reset = useCallback(() => {
    setFields(buildInitialState(fieldConfigsRef.current));
    setStatus("idle");
    setSubmitError(void 0);
  }, []);
  const resetField = useCallback((name) => {
    const config = fieldConfigsRef.current[name];
    if (!config) return;
    setFields((prev) => ({
      ...prev,
      [name]: buildInitialFieldState(config)
    }));
  }, []);
  const is = useCallback((s) => status === s, [status]);
  const values = extractValues(fields);
  const errors = extractErrors(fields);
  const isValid = Object.values(fields).every((f) => f.isValid);
  const isDirty = Object.values(fields).some((f) => f.isDirty);
  return {
    fields,
    values,
    errors,
    status,
    isValid,
    isDirty,
    isSubmitting: status === "submitting",
    isSuccess: status === "success",
    isError: status === "error",
    submitError,
    is,
    setValue,
    setTouched,
    setError,
    clearError,
    validateField,
    validateAll,
    submit,
    handleSubmit,
    reset,
    resetField
  };
}
export {
  useForm
};
//# sourceMappingURL=index.js.map