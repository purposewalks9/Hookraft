"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  useClaudeSupport: () => useClaudeSupport
});
module.exports = __toCommonJS(index_exports);

// src/SupportWidget.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function ChatIcon({ size = 24 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 21.16a.5.5 0 00.628.628l3.992-.892A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" }) });
}
function CloseIcon({ size = 18 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function SendIcon({ size = 18 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function TypingIndicator({ bg }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 4, padding: "10px 14px", background: bg, borderRadius: "18px 18px 18px 4px", width: "fit-content", alignItems: "center" }, children: [0, 1, 2].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "span",
    {
      style: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#9ca3af",
        display: "inline-block",
        animation: "bounce 1.2s infinite",
        animationDelay: `${i * 0.2}s`
      }
    },
    i
  )) });
}
function useResolvedTheme(theme) {
  const [resolved, setResolved] = (0, import_react.useState)("light");
  (0, import_react.useEffect)(() => {
    if (theme === "light" || theme === "dark") {
      setResolved(theme);
      return;
    }
    const checkTheme = () => {
      const html = document.documentElement;
      const dataTheme = html.getAttribute("data-theme");
      const classList = html.classList;
      if (dataTheme === "dark" || classList.contains("dark")) {
        setResolved("dark");
        return;
      }
      if (dataTheme === "light" || classList.contains("light")) {
        setResolved("light");
        return;
      }
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolved(prefersDark ? "dark" : "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"]
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", checkTheme);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", checkTheme);
    };
  }, [theme]);
  return resolved;
}
function SupportWidgetComponent({
  endpoint,
  knowledge,
  branding
}) {
  const {
    theme = "system",
    primaryColor = "#000000",
    logo,
    title = "Support"
  } = branding;
  const resolvedTheme = useResolvedTheme(theme);
  const isDark = resolvedTheme === "dark";
  const colors = {
    bg: isDark ? "#1a1a1a" : "#ffffff",
    surface: isDark ? "#242424" : "#f9fafb",
    border: isDark ? "#333333" : "#e5e7eb",
    text: isDark ? "#f1f1f1" : "#111111",
    textMuted: isDark ? "#9ca3af" : "#6b7280",
    inputBg: isDark ? "#2a2a2a" : "#ffffff",
    assistantBubble: isDark ? "#2a2a2a" : "#f3f4f6",
    assistantText: isDark ? "#f1f1f1" : "#111111"
  };
  const [open, setOpen] = (0, import_react.useState)(false);
  const [messages, setMessages] = (0, import_react.useState)([]);
  const [input, setInput] = (0, import_react.useState)("");
  const [isTyping, setIsTyping] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const messagesEndRef = (0, import_react.useRef)(null);
  const inputRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  (0, import_react.useEffect)(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);
  (0, import_react.useEffect)(() => {
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  const sendMessage = (0, import_react.useCallback)(async () => {
    if (!input.trim() || isTyping) return;
    setError(null);
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now()
    };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
          knowledge
        })
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, endpoint, knowledge]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
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
          overflow: "hidden"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderBottom: `1px solid ${colors.border}`,
                background: colors.bg
              },
              children: [
                logo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "img",
                  {
                    src: logo,
                    alt: "logo",
                    style: { width: 28, height: 28, borderRadius: 6, objectFit: "cover" }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600, fontSize: 15, color: colors.text, flex: 1 }, children: title }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: () => setOpen(false),
                    style: {
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: colors.textMuted,
                      padding: 4,
                      display: "flex",
                      alignItems: "center"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloseIcon, {})
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                flex: 1,
                overflowY: "auto",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12
              },
              children: [
                messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      background: colors.assistantBubble,
                      color: colors.assistantText,
                      padding: "10px 14px",
                      borderRadius: "18px 18px 18px 4px",
                      fontSize: 14,
                      lineHeight: 1.5,
                      maxWidth: "85%"
                    },
                    children: "\u{1F44B} Hi! How can I help you today?"
                  }
                ),
                messages.map((msg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "div",
                      {
                        style: {
                          maxWidth: "85%",
                          padding: "10px 14px",
                          borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          background: msg.role === "user" ? primaryColor : colors.assistantBubble,
                          color: msg.role === "user" ? "#ffffff" : colors.assistantText,
                          fontSize: 14,
                          lineHeight: 1.6,
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap"
                        },
                        children: msg.content
                      }
                    )
                  },
                  msg.id
                )),
                isTyping && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingIndicator, { bg: colors.assistantBubble }),
                error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: 12, color: "#ef4444", textAlign: "center", margin: 0 }, children: error }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: messagesEndRef })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                padding: "10px 12px",
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
                background: colors.bg
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "textarea",
                  {
                    ref: inputRef,
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    onKeyDown: handleKeyDown,
                    placeholder: "Ask a question...",
                    rows: 1,
                    disabled: isTyping,
                    style: {
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
                      overflowY: "auto"
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: sendMessage,
                    disabled: !input.trim() || isTyping,
                    style: {
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
                      transition: "opacity 0.15s"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendIcon, {})
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: () => setOpen((prev) => !prev),
        style: {
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
          transition: "transform 0.15s, box-shadow 0.15s"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.28)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
        },
        "aria-label": open ? "Close support chat" : "Open support chat",
        children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloseIcon, { size: 22 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatIcon, { size: 24 })
      }
    )
  ] });
}

// src/useClaudeSupport.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function useClaudeSupport(options) {
  const { endpoint, knowledge, branding = {} } = options;
  const SupportWidget = () => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    SupportWidgetComponent,
    {
      endpoint,
      knowledge,
      branding
    }
  );
  SupportWidget.displayName = "SupportWidget";
  return { SupportWidget };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useClaudeSupport
});
//# sourceMappingURL=index.cjs.map