import { useState, useCallback, useRef } from "react"
import { validateValue } from "./validate"
import type {
  FieldConfig,
  FieldState,
  FieldValue,
  FieldsConfig,
  FieldsState,
  FormErrors,
  FormStatus,
  FormValues,
  UseFormOptions,
  UseFormReturn,
} from "./types"

function buildInitialFieldState(config: FieldConfig<FieldValue>): FieldState<FieldValue> {
  return {
    value: config.value,
    error: undefined,
    touched: false,
    isDirty: false,
    isValid: true,
    disabled: config.disabled ?? false,
  }
}

function buildInitialState(fields: FieldsConfig): FieldsState {
  return Object.fromEntries(
    Object.entries(fields).map(([name, config]) => [
      name,
      buildInitialFieldState(config),
    ])
  )
}

function extractValues(fields: FieldsState): FormValues {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.value])
  )
}

function extractErrors(fields: FieldsState): FormErrors {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.error])
  )
}

export function useForm<T extends FieldsConfig>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const {
    fields: fieldConfigs,
    onSubmit,
    onSuccess,
    onError,
    onChange,
    validateOn = "blur",
  } = options

  const [fields, setFields] = useState<FieldsState>(() =>
    buildInitialState(fieldConfigs)
  )
  const [status, setStatus] = useState<FormStatus>("idle")
  const [submitError, setSubmitError] = useState<unknown>(undefined)

  const fieldConfigsRef = useRef(fieldConfigs)
  const onSubmitRef = useRef(onSubmit)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onChangeRef = useRef(onChange)

  // Keep refs fresh
  fieldConfigsRef.current = fieldConfigs
  onSubmitRef.current = onSubmit
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  onChangeRef.current = onChange

  const getValues = useCallback(
    (currentFields: FieldsState): FormValues => extractValues(currentFields),
    []
  )

  const validateField = useCallback(
    (name: keyof T, currentFields?: FieldsState): boolean => {
      const stateToUse = currentFields ?? fields
      const config = fieldConfigsRef.current[name as string]
      const field = stateToUse[name as string]
      if (!config || !field) return true

      const allValues = extractValues(stateToUse)
      const error = validateValue(field.value, config.rules, allValues)

      setFields((prev) => ({
        ...prev,
        [name]: { ...prev[name as string], error, isValid: !error },
      }))

      return !error
    },
    [fields]
  )

  const validateAll = useCallback((): boolean => {
    let allValid = true

    setFields((prev) => {
      const allValues = extractValues(prev)
      const updated = { ...prev }

      for (const [name, config] of Object.entries(fieldConfigsRef.current)) {
        const error = validateValue(
          prev[name]?.value ?? config.value,
          config.rules,
          allValues
        )
        updated[name] = {
          ...prev[name],
          error,
          isValid: !error,
          touched: true,
        }
        if (error) allValid = false
      }

      return updated
    })

    return allValid
  }, [])

  const setValue = useCallback(
    (name: keyof T, value: FieldValue) => {
      setFields((prev) => {
        const config = fieldConfigsRef.current[name as string]
        const initial = config?.value
        const isDirty = value !== initial

        const updated = {
          ...prev,
          [name]: {
            ...prev[name as string],
            value,
            isDirty,
          },
        }

        if (validateOn === "change") {
          const allValues = extractValues(updated)
          const error = validateValue(value, config?.rules, allValues)
          updated[name as string] = {
            ...updated[name as string],
            error,
            isValid: !error,
          }
        }

        onChangeRef.current?.(extractValues(updated), name as string)
        return updated
      })
    },
    [validateOn]
  )

  const setTouched = useCallback(
    (name: keyof T) => {
      setFields((prev) => {
        const config = fieldConfigsRef.current[name as string]
        const field = prev[name as string]

        const updated = { ...prev }

        if (validateOn === "blur") {
          const allValues = extractValues(prev)
          const error = validateValue(field?.value, config?.rules, allValues)
          updated[name as string] = {
            ...field,
            touched: true,
            error,
            isValid: !error,
          }
        } else {
          updated[name as string] = { ...field, touched: true }
        }

        return updated
      })
    },
    [validateOn]
  )

  const setError = useCallback((name: keyof T, error: string) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name as string], error, isValid: false },
    }))
  }, [])

  const clearError = useCallback((name: keyof T) => {
    setFields((prev) => ({
      ...prev,
      [name]: { ...prev[name as string], error: undefined, isValid: true },
    }))
  }, [])

  const submit = useCallback(async () => {
    const valid = validateAll()
    if (!valid) return

    const currentValues = extractValues(fields)

    setStatus("submitting")
    setSubmitError(undefined)

    try {
      await onSubmitRef.current?.(currentValues)
      setStatus("success")
      onSuccessRef.current?.(currentValues)
    } catch (err) {
      setStatus("error")
      setSubmitError(err)
      onErrorRef.current?.(err, currentValues)
    }
  }, [fields, validateAll])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      await submit()
    },
    [submit]
  )

  const reset = useCallback(() => {
    setFields(buildInitialState(fieldConfigsRef.current))
    setStatus("idle")
    setSubmitError(undefined)
  }, [])

  const resetField = useCallback((name: keyof T) => {
    const config = fieldConfigsRef.current[name as string]
    if (!config) return
    setFields((prev) => ({
      ...prev,
      [name]: buildInitialFieldState(config),
    }))
  }, [])

  const is = useCallback((s: FormStatus) => status === s, [status])

  const values = extractValues(fields)
  const errors = extractErrors(fields)
  const isValid = Object.values(fields).every((f) => f.isValid)
  const isDirty = Object.values(fields).some((f) => f.isDirty)

  return {
    fields: fields as UseFormReturn<T>["fields"],
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
    validateField: validateField as UseFormReturn<T>["validateField"],
    validateAll,
    submit,
    handleSubmit,
    reset,
    resetField: resetField as UseFormReturn<T>["resetField"],
  }
}