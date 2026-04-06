"use client"

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
} from "react"
import type { Message, SupportBranding } from "./types"

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChatIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 21.16a.5.5 0 00.628.628l3.992-.892A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  )
}

function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SendIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ bg }: { bg: string }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: bg, borderRadius: "18px 18px 18px 4px", width: "fit-content", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#9ca3af",
            display: "inline-block",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Theme resolver ───────────────────────────────────────────────────────────

function useResolvedTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  const [resolved, setResolved] = useState<"light" | "dark">("light")

  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      setResolved(theme)
      return
    }

    // "system" — check next-themes first, then OS
    const checkTheme = () => {
      // next-themes writes "dark" or "light" to <html class> or data-theme
      const html = document.documentElement
      const dataTheme = html.getAttribute("data-theme")
      const classList = html.classList

      if (dataTheme === "dark" || classList.contains("dark")) {
        setResolved("dark")
        return
      }
      if (dataTheme === "light" || classList.contains("light")) {
        setResolved("light")
        return
      }

      // Fall back to OS preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setResolved(prefersDark ? "dark" : "light")
    }

    checkTheme()

    // Watch for next-themes changes on <html>
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    })

    // Watch OS preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", checkTheme)

    return () => {
      observer.disconnect()
      mq.removeEventListener("change", checkTheme)
    }
  }, [theme])

  return resolved
}

// ─── Widget component ─────────────────────────────────────────────────────────

interface SupportWidgetProps {
  endpoint: string
  knowledge: string
  branding: SupportBranding
}

export function SupportWidgetComponent({
  endpoint,
  knowledge,
  branding,
}: SupportWidgetProps) {
  const {
    theme = "system",
    primaryColor = "#000000",
    logo,
    title = "Support",
  } = branding

  const resolvedTheme = useResolvedTheme(theme)
  const isDark = resolvedTheme === "dark"

  // Theme tokens
  const colors = {
    bg: isDark ? "#1a1a1a" : "#ffffff",
    surface: isDark ? "#242424" : "#f9fafb",
    border: isDark ? "#333333" : "#e5e7eb",
    text: isDark ? "#f1f1f1" : "#111111",
    textMuted: isDark ? "#9ca3af" : "#6b7280",
    inputBg: isDark ? "#2a2a2a" : "#ffffff",
    assistantBubble: isDark ? "#2a2a2a" : "#f3f4f6",
    assistantText: isDark ? "#f1f1f1" : "#111111",
  }

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Escape key closes widget
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return
    setError(null)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    }

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
          knowledge,
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping, messages, endpoint, knowledge])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Chat popup */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            height: 520,
            maxHeight: "calc(100vh - 120px)",
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9998,
            animation: "fadeIn 0.2s ease",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px",
              borderBottom: `1px solid ${colors.border}`,
              background: colors.bg,
            }}
          >
            {logo && (
              <img
                src={logo}
                alt="logo"
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }}
              />
            )}
            <span style={{ fontWeight: 600, fontSize: 15, color: colors.text, flex: 1 }}>
              {title}
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textMuted,
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Welcome message */}
            {messages.length === 0 && (
              <div
                style={{
                  background: colors.assistantBubble,
                  color: colors.assistantText,
                  padding: "10px 14px",
                  borderRadius: "18px 18px 18px 4px",
                  fontSize: 14,
                  lineHeight: 1.5,
                  maxWidth: "85%",
                }}
              >
                👋 Hi! How can I help you today?
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    background:
                      msg.role === "user" ? primaryColor : colors.assistantBubble,
                    color: msg.role === "user" ? "#ffffff" : colors.assistantText,
                    fontSize: 14,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && <TypingIndicator bg={colors.assistantBubble} />}

            {error && (
              <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", margin: 0 }}>
                {error}
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: `1px solid ${colors.border}`,
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              background: colors.bg,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              disabled={isTyping}
              style={{
                flex: 1,
                resize: "none",
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 14,
                lineHeight: 1.5,
                background: colors.inputBg,
                color: colors.text,
                outline: "none",
                fontFamily: "inherit",
                maxHeight: 100,
                overflowY: "auto",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: primaryColor,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                opacity: !input.trim() || isTyping ? 0.4 : 1,
                flexShrink: 0,
                transition: "opacity 0.15s",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: primaryColor,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          zIndex: 9999,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)"
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.28)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"
        }}
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        {open ? <CloseIcon size={22} /> : <ChatIcon size={24} />}
      </button>
    </>
  )
}