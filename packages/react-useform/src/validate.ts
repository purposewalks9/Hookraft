import type { FieldRule, FieldValue, FormValues } from "./types"

export function validateValue(
  value: FieldValue,
  rules: FieldRule[] = [],
  allValues: FormValues
): string | undefined {
  for (const rule of rules) {

    if (rule.required) {
      const empty =
        value === "" ||
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      if (empty) return rule.message ?? "This field is required"
    }

    if (value === "" || value === null || value === undefined) continue

 
    if (rule.minLength !== undefined && typeof value === "string") {
      if (value.length < rule.minLength) {
        return rule.message ?? `Must be at least ${rule.minLength} characters`
      }
    }

    if (rule.maxLength !== undefined && typeof value === "string") {
      if (value.length > rule.maxLength) {
        return rule.message ?? `Must be no more than ${rule.maxLength} characters`
      }
    }

    if (rule.min !== undefined && typeof value === "number") {
      if (value < rule.min) {
        return rule.message ?? `Must be at least ${rule.min}`
      }
    }

  
    if (rule.max !== undefined && typeof value === "number") {
      if (value > rule.max) {
        return rule.message ?? `Must be no more than ${rule.max}`
      }
    }

  
    if (rule.pattern && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        return rule.message ?? "Invalid format"
      }
    }

  
    if (rule.validate) {
      const result = rule.validate(value, allValues)
      if (result === false) return rule.message ?? "Invalid value"
      if (typeof result === "string") return result
    }
  }

  return undefined
}
