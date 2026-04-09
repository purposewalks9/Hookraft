import { useState, useCallback, useRef } from "react"
import { validateValue } from "./validate"

export declare namespace useForm {
  type Status = "idle" | "submitting" | "success" | "error"

  type FieldValue = string | number | boolean

  type FieldRule = {
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    validate?: (value: FieldValue, allValues: Record<string, FieldValue>) => boolean | string
    message?: string
  }

  type FieldConfig<T extends FieldValue = string> = {
    value: T
    rules?: FieldRule[]
    disabled?: boolean
  }

  type FieldState<T extends FieldValue = string> = {
    value: T
    error: string | undefined
    touched: boolean
    isDirty: boolean
    isValid: boolean
    disabled: boolean
  }

  type FieldsConfig = Record<string, FieldConfig<FieldValue>>
  type FieldsState = Record<string, FieldState<FieldValue>>
  type FormValues = Record<string, FieldValue>
  type FormErrors = Record<string, string | undefined>

  type Options<T extends FieldsConfig> = {
    fields: T
    onSubmit?: (values: FormValues) => Promise<void> | void
    onSuccess?: (values: FormValues) => void
    onError?: (error: unknown, values: FormValues) => void
    onChange?: (values: FormValues, fieldName: string) => void
    validateOn?: "change" | "blur" | "submit"
  }

  type Return<T extends FieldsConfig> = {
    fields: { [K in keyof T]: FieldState }
    values: FormValues
    errors: FormErrors
    status: Status
    isValid: boolean
    isDirty: boolean
    isSubmitting: boolean
    isSuccess: boolean
    isError: boolean
    submitError: unknown
    is: (status: Status) => boolean
    setValue: (name: keyof T, value: FieldValue) => void
    setTouched: (name: keyof T) => void
    setError: (name: keyof T, error: string) => void
    clearError: (name: keyof T) => void
    validateField: (name: keyof T) => boolean
    validateAll: () => boolean
    submit: () => Promise<void>
    handleSubmit: (e?: React.FormEvent) => Promise<void>
    reset: () => void
    resetField: (name: keyof T) => void
  }
}

function buildInitialFieldState(config: useForm.FieldConfig<useForm.FieldValue>): useForm.FieldState<useForm.FieldValue> {
  return {
    value: config.value,
    error: undefined,
    touched: false,
    isDirty: false,
    isValid: true,
    disabled: config.disabled ?? false,
  }
}

function buildInitialState(fields: useForm.FieldsConfig): useForm.FieldsState {
  return Object.fromEntries(
    Object.entries(fields).map(([name, config]) => [
      name,
      buildInitialFieldState(config),
    ])
  )
}

function extractValues(fields: useForm.FieldsState): useForm.FormValues {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.value])
  )
}

function extractErrors(fields: useForm.FieldsState): useForm.FormErrors {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.error])
  )
}

export function useForm<T extends useForm.FieldsConfig>(
  options: useForm.Options<T>
): useForm.Return<T> {
  const {
    fields: fieldConfigs,
    onSubmit,
    onSuccess,
    onError,
    onChange,
    validateOn = "blur",
  } = options

  const [fields, setFields] = useState<useForm.FieldsState>(() =>
    buildInitialState(fieldConfigs)
  )
  const [status, setStatus] = useState<useForm.Status>("idle")
  const [submitError, setSubmitError] = useState<unknown>(undefined)

  const fieldConfigsRef = useRef(fieldConfigs)
  const onSubmitRef = useRef(onSubmit)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onChangeRef = useRef(onChange)

  fieldConfigsRef.current = fieldConfigs
  onSubmitRef.current = onSubmit
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  onChangeRef.current = onChange

  const getValues = useCallback(
    (currentFields: useForm.FieldsState): useForm.FormValues => extractValues(currentFields),
    []
  )

  const validateField = useCallback(
    (name: keyof T, currentFields?: useForm.FieldsState): boolean => {
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
    (name: keyof T, value: useForm.FieldValue) => {
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

  const is = useCallback((s: useForm.Status) => status === s, [status])

  const values = extractValues(fields)
  const errors = extractErrors(fields)
  const isValid = Object.values(fields).every((f) => f.isValid)
  const isDirty = Object.values(fields).some((f) => f.isDirty)

  return {
    fields: fields as useForm.Return<T>["fields"],
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
    validateField: validateField as useForm.Return<T>["validateField"],
    validateAll,
    submit,
    handleSubmit,
    reset,
    resetField: resetField as useForm.Return<T>["resetField"],
  }
}