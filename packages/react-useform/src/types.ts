export type FormStatus = "idle" | "submitting" | "success" | "error"

export type FieldValue = string | number | boolean

export interface FieldRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number        // ← add this line
  pattern?: RegExp
  validate?: (value: FieldValue, allValues: Record<string, FieldValue>) => boolean | string
  message?: string
}

export interface FieldConfig<T extends FieldValue = string> {

  value: T

  rules?: FieldRule[]

  disabled?: boolean
}

export interface FieldState<T extends FieldValue = string> {

  value: T

  error: string | undefined
  touched: boolean

  isDirty: boolean

  isValid: boolean

  disabled: boolean
}

export type FieldsConfig = Record<string, FieldConfig<FieldValue>>
export type FieldsState = Record<string, FieldState<FieldValue>>
export type FormValues = Record<string, FieldValue>
export type FormErrors = Record<string, string | undefined>

export interface UseFormOptions<T extends FieldsConfig> {

  fields: T

  onSubmit?: (values: FormValues) => Promise<void> | void

  onSuccess?: (values: FormValues) => void

  onError?: (error: unknown, values: FormValues) => void

  onChange?: (values: FormValues, fieldName: string) => void

  validateOn?: "change" | "blur" | "submit"
}

export interface UseFormReturn<T extends FieldsConfig> {

  fields: { [K in keyof T]: FieldState }

  values: FormValues

  errors: FormErrors

  status: FormStatus

  isValid: boolean

  isDirty: boolean

  isSubmitting: boolean

  isSuccess: boolean

  isError: boolean

  submitError: unknown

  is: (status: FormStatus) => boolean

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
