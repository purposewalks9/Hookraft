export type FormStatus = "idle" | "submitting" | "success" | "error"

export type FieldValue = string | number | boolean

export interface FieldRule {
  /** Field must have a value */
  required?: boolean
  /** Minimum string length */
  minLength?: number
  /** Maximum string length */
  maxLength?: number
  /** Minimum number value */
  min?: number
  /** Maximum number value */
  max?: number
  /** Regex pattern the value must match */
  pattern?: RegExp
  /** Custom validator — return true if valid, string error message if invalid */
  validate?: (value: FieldValue, allValues: Record<string, FieldValue>) => boolean | string
  /** Error message for required, minLength, maxLength, min, max, pattern rules */
  message?: string
}

export interface FieldConfig<T extends FieldValue = string> {
  /** Initial value for this field */
  value: T
  /** Validation rules */
  rules?: FieldRule[]
  /** If true this field is disabled */
  disabled?: boolean
}

export interface FieldState<T extends FieldValue = string> {
  /** Current value */
  value: T
  /** Current error message — undefined if valid */
  error: string | undefined
  /** True if the user has interacted with this field */
  touched: boolean
  /** True if the value differs from the initial value */
  isDirty: boolean
  /** True if the field passes all validation rules */
  isValid: boolean
  /** True if the field is disabled */
  disabled: boolean
}

export type FieldsConfig = Record<string, FieldConfig<FieldValue>>
export type FieldsState = Record<string, FieldState<FieldValue>>
export type FormValues = Record<string, FieldValue>
export type FormErrors = Record<string, string | undefined>

export interface UseFormOptions<T extends FieldsConfig> {
  /** Field definitions with initial values and validation rules */
  fields: T
  /**
   * Called when form is submitted and all fields are valid.
   * Receives the current field values.
   */
  onSubmit?: (values: FormValues) => Promise<void> | void
  /** Fires when onSubmit resolves successfully */
  onSuccess?: (values: FormValues) => void
  /** Fires when onSubmit throws an error */
  onError?: (error: unknown, values: FormValues) => void
  /** Fires when any field value changes */
  onChange?: (values: FormValues, fieldName: string) => void
  /**
   * When to validate fields.
   * "change" — validate on every keystroke
   * "blur" — validate when field loses focus
   * "submit" — validate only on submit
   * Defaults to "blur"
   */
  validateOn?: "change" | "blur" | "submit"
}

export interface UseFormReturn<T extends FieldsConfig> {
  /** All field states keyed by field name */
  fields: { [K in keyof T]: FieldState }
  /** Current values of all fields */
  values: FormValues
  /** Current errors of all fields */
  errors: FormErrors
  /** Current form status */
  status: FormStatus
  /** True if all fields pass validation */
  isValid: boolean
  /** True if any field value differs from its initial value */
  isDirty: boolean
  /** True while the form is submitting */
  isSubmitting: boolean
  /** True if the form has been successfully submitted */
  isSuccess: boolean
  /** True if the last submission resulted in an error */
  isError: boolean
  /** The error thrown by onSubmit if it failed */
  submitError: unknown
  /** Check current form status */
  is: (status: FormStatus) => boolean
  /** Update a field value */
  setValue: (name: keyof T, value: FieldValue) => void
  /** Mark a field as touched and trigger blur validation */
  setTouched: (name: keyof T) => void
  /** Set a field error manually */
  setError: (name: keyof T, error: string) => void
  /** Clear a specific field error */
  clearError: (name: keyof T) => void
  /** Validate a single field and return if it is valid */
  validateField: (name: keyof T) => boolean
  /** Validate all fields and return if the whole form is valid */
  validateAll: () => boolean
  /** Submit the form programmatically */
  submit: () => Promise<void>
  /** Handle form submit event — pass directly to onSubmit on a form element */
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  /** Reset all fields to their initial values */
  reset: () => void
  /** Reset a single field to its initial value */
  resetField: (name: keyof T) => void
}
