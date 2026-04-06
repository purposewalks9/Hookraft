type SupportTheme = "light" | "dark" | "system";
interface SupportBranding {
    theme?: SupportTheme;
    primaryColor?: string;
    logo?: string;
    title?: string;
}
interface UseClaudeSupportOptions {
    endpoint: string;
    knowledge: string;
    branding?: SupportBranding;
}
interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}
interface UseClaudeSupportReturn {
    SupportWidget: React.FC;
}

declare function useClaudeSupport(options: UseClaudeSupportOptions): UseClaudeSupportReturn;

export { type Message, type SupportBranding, type SupportTheme, type UseClaudeSupportOptions, type UseClaudeSupportReturn, useClaudeSupport };
