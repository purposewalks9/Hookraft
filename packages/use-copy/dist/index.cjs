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
var src_exports = {};
__export(src_exports, {
  useCopy: () => useCopy
});
module.exports = __toCommonJS(src_exports);

// src/useCopy.ts
var import_react = require("react");
function useCopy({
  duration = 200,
  stagger = 5,
  resetDelay = 1500
} = {}) {
  const textRef = (0, import_react.useRef)(null);
  const iconRef = (0, import_react.useRef)(null);
  const [copied, setCopied] = (0, import_react.useState)(false);
  const animatingRef = (0, import_react.useRef)(false);
  const trigger = (0, import_react.useCallback)(() => {
    if (animatingRef.current) return;
    const textEl = textRef.current;
    const iconEl = iconRef.current;
    if (!textEl || !iconEl) return;
    const text = textEl.textContent ?? "";
    navigator.clipboard.writeText(text).catch(() => {
    });
    animatingRef.current = true;
    setCopied(true);
    const textRect = textEl.getBoundingClientRect();
    const iconRect = iconEl.getBoundingClientRect();
    const targetX = iconRect.left + iconRect.width / 2;
    const layer = document.createElement("div");
    layer.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(layer);
    const originalOpacity = textEl.style.opacity;
    textEl.style.opacity = "0";
    const chars = text.split("");
    const charWidth = textRect.width / (chars.length || 1);
    const style = window.getComputedStyle(textEl);
    const spans = chars.map((ch, i) => {
      const span = document.createElement("span");
      span.textContent = ch === " " ? "\xA0" : ch;
      span.style.cssText = `
        position: fixed;
        left: ${textRect.left + i * charWidth}px;
        top: ${textRect.top}px;
        font-size: ${style.fontSize};
        font-family: ${style.fontFamily};
        font-weight: ${style.fontWeight};
        color: ${style.color};
        pointer-events: none;
        will-change: transform, opacity;
        line-height: ${style.lineHeight};
      `;
      layer.appendChild(span);
      return span;
    });
    spans.forEach((span, i) => {
      const startX = textRect.left + i * charWidth;
      const delay = i * stagger;
      setTimeout(() => {
        span.animate(
          [
            { transform: "translateX(0)", opacity: 1 },
            {
              transform: `translateX(${targetX - startX}px)`,
              opacity: 0
            }
          ],
          {
            duration,
            delay: 0,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            fill: "forwards"
          }
        );
      }, delay);
    });
    const totalDuration = duration + chars.length * stagger;
    setTimeout(() => {
      document.body.removeChild(layer);
      textEl.style.opacity = originalOpacity;
      animatingRef.current = false;
    }, totalDuration);
    setTimeout(() => {
      setCopied(false);
    }, totalDuration + resetDelay);
  }, [duration, stagger, resetDelay]);
  return { textRef, iconRef, copied, trigger };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useCopy
});
//# sourceMappingURL=index.cjs.map