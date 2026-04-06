export type SupportTheme = "light" | "dark" | "system"

export interface SupportBranding {
  theme?: SupportTheme
  primaryColor?: string
  logo?: string
  title?: string
}

export interface UseClaudeSupportOptions {
  endpoint: string
  knowledge: string
  branding?: SupportBranding
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export interface UseClaudeSupportReturn {
  SupportWidget: React.FC
}