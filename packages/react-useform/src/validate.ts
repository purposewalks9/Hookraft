import type { FieldRule, FieldValue, FormValues } from "./types"

export function validateValue(
  value: FieldValue,
  rules: FieldRule[] = [],
  allValues: FormValues
): string | undefined {
  for (const rule of rules) {
    // Required
    if (rule.required) {
      const empty =
        value === "" ||
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      if (empty) return rule.message ?? "This field is required"
    }

    // Skip remaining rules if value is empty and not required
    if (value === "" || value === null || value === undefined) continue

    // Min length
    if (rule.minLength !== undefined && typeof value === "string") {
      if (value.length < rule.minLength) {
        return rule.message ?? `Must be at least ${rule.minLength} characters`
      }
    }

    // Max length
    if (rule.maxLength !== undefined && typeof value === "string") {
      if (value.length > rule.maxLength) {
        return rule.message ?? `Must be no more than ${rule.maxLength} characters`
      }
    }

    // Min number
    if (rule.min !== undefined && typeof value === "number") {
      if (value < rule.min) {
        return rule.message ?? `Must be at least ${rule.min}`
      }
    }

    // Max number
    if (rule.max !== undefined && typeof value === "number") {
      if (value > rule.max) {
        return rule.message ?? `Must be no more than ${rule.max}`
      }
    }

    // Pattern
    if (rule.pattern && typeof value === "string") {
      if (!rule.pattern.test(value)) {
        return rule.message ?? "Invalid format"
      }
    }

    // Custom validator
    if (rule.validate) {
      const result = rule.validate(value, allValues)
      if (result === false) return rule.message ?? "Invalid value"
      if (typeof result === "string") return result
    }
  }

  return undefined
}
