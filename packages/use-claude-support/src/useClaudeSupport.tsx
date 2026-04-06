"use client"

import React from "react"
import { SupportWidgetComponent } from "./SupportWidget"
import type { UseClaudeSupportOptions, UseClaudeSupportReturn } from "./types"
export function useClaudeSupport(
  options: UseClaudeSupportOptions
): UseClaudeSupportReturn {
  const { endpoint, knowledge, branding = {} } = options

  const SupportWidget: React.FC = () => (
    <SupportWidgetComponent
      endpoint={endpoint}
      knowledge={knowledge}
      branding={branding}
    />
  )

  SupportWidget.displayName = "SupportWidget"

  return { SupportWidget }
}