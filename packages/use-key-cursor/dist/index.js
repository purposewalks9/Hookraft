// src/useKeyCursor.ts
import { useEffect, useRef, useCallback } from "react";
var CURSOR_SIZE = 36;
var FLY_DURATION = 480;
var CLICK_DURATION = 280;
function resolveTheme(theme) {
  if (theme === "light" || theme === "dark") return theme;
  const html = document.documentElement;
  const dataTheme = html.getAttribute("data-theme");
  const classList = html.classList;
  if (dataTheme === "dark" || classList.contains("dark")) return "dark";
  if (dataTheme === "light" || classList.contains("light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getOriginCoords(origin) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const pad = 32;
  switch (origin) {
    case "top-right":
      return { x: W - pad, y: pad };
    case "top-left":
      return { x: pad, y: pad };
    case "bottom-right":
      return { x: W - pad, y: H - pad };
    case "bottom-left":
      return { x: pad, y: H - pad };
  }
}
function resolveTarget(value) {
  var _a;
  if (typeof value === "string") {
    return document.querySelector(value);
  }
  return (_a = value.current) != null ? _a : null;
}
function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.getAttribute("contenteditable") === "true") return true;
  return false;
}
function createCursorEl() {
  const wrap = document.createElement("div");
  wrap.setAttribute("data-key-cursor", "");
  Object.assign(wrap.style, {
    position: "fixed",
    pointerEvents: "none",
    zIndex: "999999",
    opacity: "0",
    width: `${CURSOR_SIZE}px`,
    height: `${CURSOR_SIZE}px`,
    transform: "translate(-50%, -50%)",
    top: "0px",
    left: "0px"
  });
  const outer = document.createElement("div");
  outer.setAttribute("data-cursor-outer", "");
  Object.assign(outer.style, {
    position: "absolute",
    inset: "0",
    borderRadius: "50%",
    border: `3px solid transparent`,
    transition: `transform ${CLICK_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
    boxSizing: "border-box"
  });
  const inner = document.createElement("div");
  inner.setAttribute("data-cursor-inner", "");
  Object.assign(inner.style, {
    position: "absolute",
    borderRadius: "50%",
    top: "5px",
    left: "5px",
    right: "5px",
    bottom: "5px",
    transition: `transform ${CLICK_DURATION}ms cubic-bezier(0.33,0,0.2,1)`
  });
  wrap.appendChild(outer);
  wrap.appendChild(inner);
  document.body.appendChild(wrap);
  return wrap;
}
function paintCursor(wrap, color, resolvedTheme) {
  const outer = wrap.querySelector("[data-cursor-outer]");
  const inner = wrap.querySelector("[data-cursor-inner]");
  const fill = resolvedTheme === "dark" ? "#000000" : "#ffffff";
  const shadow = resolvedTheme === "dark" ? `0 0 0 2px #000000` : `0 0 0 2px #ffffff`;
  outer.style.borderColor = color;
  outer.style.boxShadow = shadow;
  inner.style.background = fill;
}
function useKeyCursor(options) {
  const {
    keys,
    origin = "top-right",
    color = "#000000",
    theme = "system",
    onTrigger,
    ignoreWhen
  } = options;
  const keysRef = useRef(keys);
  const originRef = useRef(origin);
  const colorRef = useRef(color);
  const themeRef = useRef(theme);
  const onTriggerRef = useRef(onTrigger);
  const ignoreWhenRef = useRef(ignoreWhen);
  const animatingRef = useRef(false);
  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);
  useEffect(() => {
    originRef.current = origin;
  }, [origin]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);
  useEffect(() => {
    ignoreWhenRef.current = ignoreWhen;
  }, [ignoreWhen]);
  const fly = useCallback(
    (wrap, targetEl, key) => {
      const resolved = resolveTheme(themeRef.current);
      paintCursor(wrap, colorRef.current, resolved);
      const { x, y } = getOriginCoords(originRef.current);
      wrap.style.transition = "none";
      wrap.style.left = `${x}px`;
      wrap.style.top = `${y}px`;
      wrap.style.opacity = "1";
      const outer = wrap.querySelector("[data-cursor-outer]");
      const inner = wrap.querySelector("[data-cursor-inner]");
      outer.style.transform = "scale(1)";
      inner.style.transform = "scale(1)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = targetEl.getBoundingClientRect();
          const tx = rect.left + rect.width / 2;
          const ty = rect.top + rect.height / 2;
          wrap.style.transition = [
            `left ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
            `top  ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`
          ].join(", ");
          wrap.style.left = `${tx}px`;
          wrap.style.top = `${ty}px`;
          setTimeout(() => {
            var _a;
            outer.style.transform = "scale(0.7)";
            inner.style.transform = "scale(0.7)";
            targetEl.click();
            (_a = onTriggerRef.current) == null ? void 0 : _a.call(onTriggerRef, key, targetEl);
            setTimeout(() => {
              outer.style.transform = "scale(1)";
              inner.style.transform = "scale(1)";
              wrap.style.transition = [
                `left    ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
                `top     ${FLY_DURATION}ms cubic-bezier(0.33,0,0.2,1)`,
                `opacity 0.25s ease`
              ].join(", ");
              wrap.style.opacity = "0";
              animatingRef.current = false;
            }, CLICK_DURATION);
          }, FLY_DURATION + 10);
        });
      });
    },
    []
  );
  useEffect(() => {
    const wrap = createCursorEl();
    const handler = (e) => {
      var _a;
      if (animatingRef.current) return;
      if (isTypingTarget(document.activeElement)) return;
      if ((_a = ignoreWhenRef.current) == null ? void 0 : _a.call(ignoreWhenRef)) return;
      const binding = keysRef.current[e.key];
      if (!binding) return;
      const targetEl = resolveTarget(binding);
      if (!targetEl) return;
      e.preventDefault();
      animatingRef.current = true;
      fly(wrap, targetEl, e.key);
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      wrap.remove();
    };
  }, [fly]);
}
export {
  useKeyCursor
};
