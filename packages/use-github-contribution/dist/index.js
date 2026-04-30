import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';

// src/useGithubContributions.ts
var THEMES = {
  github: {
    empty: "#161b22",
    level1: "#0e4429",
    level2: "#006d32",
    level3: "#26a641",
    level4: "#39d353"
  },
  halloween: {
    empty: "#161b22",
    level1: "#631c03",
    level2: "#bd561d",
    level3: "#fa7a18",
    level4: "#fddf68"
  },
  winter: {
    empty: "#161b22",
    level1: "#0a3069",
    level2: "#0969da",
    level3: "#54aeff",
    level4: "#b6e3ff"
  },
  pink: {
    empty: "#161b22",
    level1: "#4a0d2e",
    level2: "#8b1a52",
    level3: "#d4317a",
    level4: "#ff79c6"
  },
  dracula: {
    empty: "#161b22",
    level1: "#1e1433",
    level2: "#44275a",
    level3: "#7b4ab8",
    level4: "#bd93f9"
  }
};
function computeStreaks(weeks) {
  const days = weeks.flatMap((w) => w.days).sort((a, b) => a.date.localeCompare(b.date));
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let current = 0;
  let longest = 0;
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.date > today) continue;
    if (d.count > 0) {
      streak++;
      if (streak > longest) longest = streak;
      if (current === 0) current = streak;
    } else {
      if (current > 0) break;
      streak = 0;
    }
  }
  return { currentStreak: current, longestStreak: longest };
}
async function fetchContributions(username, year, proxyUrl) {
  const base = proxyUrl != null ? proxyUrl : "/api/github-contributions";
  const params = new URLSearchParams({ username });
  if (year) params.set("year", String(year));
  const res = await fetch(`${base}?${params}`);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to fetch contributions for "${username}": ${msg}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  if (!json.weeks || !json.weeks.length) {
    throw new Error(
      `No contribution data found for "${username}". The user may not exist or their contributions may be private.`
    );
  }
  const allDays = json.weeks.flatMap((w) => w.days).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = [];
  let week = [];
  if (allDays.length) {
    const firstDow = new Date(allDays[0].date).getDay();
    for (let i = 0; i < firstDow; i++) {
      const d = new Date(allDays[0].date);
      d.setDate(d.getDate() - (firstDow - i));
      week.push({ date: d.toISOString().slice(0, 10), count: 0, level: 0 });
    }
  }
  allDays.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push({ days: week });
      week = [];
    }
  });
  if (week.length) {
    while (week.length < 7) {
      const last = new Date(week[week.length - 1].date);
      last.setDate(last.getDate() + 1);
      week.push({ date: last.toISOString().slice(0, 10), count: 0, level: 0 });
    }
    weeks.push({ days: week });
  }
  const { currentStreak, longestStreak } = computeStreaks(weeks);
  return {
    weeks,
    totalContributions: json.totalContributions,
    longestStreak,
    currentStreak
  };
}
function useGithubContributions(options) {
  const { username, year, proxyUrl, onLoad, onError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchContributions(username, year, proxyUrl);
      setData(result);
      onLoad == null ? void 0 : onLoad(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      onError == null ? void 0 : onError(e);
    } finally {
      setLoading(false);
    }
  }, [username, year, proxyUrl]);
  useEffect(() => {
    run();
  }, [run]);
  return { data, loading, error, refetch: run };
}
var DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var DARK_THEMES = {
  github: {
    bg: "#0d1117",
    surface: "#161b22",
    text: "#e6edf3",
    textMuted: "#7d8590",
    border: "#30363d",
    empty: "#161b22",
    level1: "#0e4429",
    level2: "#006d32",
    level3: "#26a641",
    level4: "#39d353"
  },
  halloween: {
    bg: "#0d1117",
    surface: "#161b22",
    text: "#e6edf3",
    textMuted: "#7d8590",
    border: "#30363d",
    empty: "#161b22",
    level1: "#631c03",
    level2: "#bd561d",
    level3: "#fa7a18",
    level4: "#fddf68"
  },
  winter: {
    bg: "#0d1117",
    surface: "#161b22",
    text: "#e6edf3",
    textMuted: "#7d8590",
    border: "#30363d",
    empty: "#161b22",
    level1: "#0a3069",
    level2: "#0969da",
    level3: "#54aeff",
    level4: "#b6e3ff"
  },
  pink: {
    bg: "#0d1117",
    surface: "#161b22",
    text: "#e6edf3",
    textMuted: "#7d8590",
    border: "#30363d",
    empty: "#161b22",
    level1: "#4a0d2e",
    level2: "#8b1a52",
    level3: "#d4317a",
    level4: "#ff79c6"
  },
  dracula: {
    bg: "#0d1117",
    surface: "#161b22",
    text: "#e6edf3",
    textMuted: "#7d8590",
    border: "#30363d",
    empty: "#161b22",
    level1: "#1e1433",
    level2: "#44275a",
    level3: "#7b4ab8",
    level4: "#bd93f9"
  }
};
var THEME_LABELS = {
  github: "GitHub",
  halloween: "Halloween",
  winter: "Winter",
  pink: "Pink",
  dracula: "Dracula"
};
function formatDate(dateStr) {
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function ContributionCalendar({
  username,
  year,
  theme: themeProp = "github",
  customColors,
  blockSize = 11,
  blockGap = 3,
  showMonthLabels = true,
  showDayLabels = true,
  showThemeSwitcher = true,
  className,
  style,
  onContributionClick,
  proxyUrl
}) {
  var _a;
  const [activeTheme, setActiveTheme] = useState(
    themeProp === "custom" ? "github" : themeProp
  );
  const colors = (_a = DARK_THEMES[activeTheme]) != null ? _a : DARK_THEMES.github;
  const { data, loading, error } = useGithubContributions({
    username,
    year,
    customColors: {
      empty: colors.empty,
      level1: colors.level1,
      level2: colors.level2,
      level3: colors.level3,
      level4: colors.level4
    },
    proxyUrl
  });
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    date: "",
    count: 0
  });
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const colorMap = {
    0: colors.empty,
    1: colors.level1,
    2: colors.level2,
    3: colors.level3,
    4: colors.level4
  };
  const blockStep = blockSize + blockGap;
  const filteredWeeks = useMemo(() => {
    if (!(data == null ? void 0 : data.weeks)) return [];
    const weeks = data.weeks;
    const yearStr = year ? String(year) : String((/* @__PURE__ */ new Date()).getFullYear());
    let firstRealWeek = 0;
    for (let i = 0; i < weeks.length; i++) {
      if (weeks[i].days.some((d) => d.date.startsWith(yearStr))) {
        firstRealWeek = i;
        break;
      }
    }
    let lastRealWeek = weeks.length - 1;
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].days.some((d) => d.date.startsWith(yearStr))) {
        lastRealWeek = i;
        break;
      }
    }
    return weeks.slice(firstRealWeek, lastRealWeek + 1);
  }, [data, year]);
  const monthLabels = useMemo(() => {
    const labels = [];
    filteredWeeks.forEach((week, wi) => {
      const firstDay = week.days.find((d) => d.date !== "");
      if (!firstDay) return;
      const monthIndex = (/* @__PURE__ */ new Date(firstDay.date + "T00:00:00")).getMonth();
      if (wi === 0) {
        const dayOfMonth = (/* @__PURE__ */ new Date(firstDay.date + "T00:00:00")).getDate();
        if (dayOfMonth <= 7) labels.push({ weekIndex: wi, month: monthIndex });
        return;
      }
      const prevFirstDay = filteredWeeks[wi - 1].days.find((d) => d.date !== "");
      if (!prevFirstDay) return;
      const prevMonth = (/* @__PURE__ */ new Date(prevFirstDay.date + "T00:00:00")).getMonth();
      if (monthIndex !== prevMonth) {
        const weeksLeft = filteredWeeks.length - wi;
        if (weeksLeft >= 2) labels.push({ weekIndex: wi, month: monthIndex });
      }
    });
    return labels;
  }, [filteredWeeks]);
  const gridW = filteredWeeks.length * blockStep;
  const gridH = 7 * blockStep;
  function handleMouseEnter(e, day) {
    var _a2;
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = (_a2 = containerRef.current) == null ? void 0 : _a2.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + blockSize / 2,
      y: rect.top - containerRect.top,
      date: day.date,
      count: day.count
    });
  }
  function handleMouseLeave() {
    setTooltip((t) => ({ ...t, visible: false }));
  }
  if (loading) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className,
        style: {
          background: colors.bg,
          borderRadius: 12,
          padding: "20px 24px",
          border: `1px solid ${colors.border}`,
          ...style
        },
        children: [
          /* @__PURE__ */ jsx("div", { style: {
            width: "100%",
            height: gridH + 40,
            background: `repeating-linear-gradient(90deg, ${colors.empty} 0px, ${colors.empty} ${blockSize}px, transparent ${blockSize}px, transparent ${blockStep}px)`,
            borderRadius: 4,
            opacity: 0.4,
            animation: "cc-pulse 1.5s ease-in-out infinite"
          } }),
          /* @__PURE__ */ jsx("style", { children: `@keyframes cc-pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }` })
        ]
      }
    );
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className, style: {
      background: colors.bg,
      borderRadius: 12,
      padding: "20px 24px",
      border: `1px solid ${colors.border}`,
      color: "#f85149",
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      ...style
    }, children: [
      "Failed to load contributions for ",
      /* @__PURE__ */ jsx("strong", { children: username }),
      ": ",
      error.message
    ] });
  }
  if (!data || !filteredWeeks.length) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      className,
      style: {
        position: "relative",
        background: colors.bg,
        borderRadius: 12,
        padding: "20px 20px 16px",
        border: `1px solid ${colors.border}`,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        display: "inline-block",
        ...style
      },
      children: [
        showThemeSwitcher && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }, children: Object.keys(DARK_THEMES).map((t) => {
          const tc = DARK_THEMES[t];
          const isActive = t === activeTheme;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setActiveTheme(t),
              style: {
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px 3px 6px",
                borderRadius: 20,
                border: `1px solid ${isActive ? tc.level3 : colors.border}`,
                background: isActive ? colors.surface : "transparent",
                color: isActive ? colors.text : colors.textMuted,
                fontSize: 10,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                outline: "none"
              },
              children: [
                /* @__PURE__ */ jsx("span", { style: {
                  display: "inline-flex",
                  gap: 2
                }, children: [tc.level1, tc.level2, tc.level3, tc.level4].map((c, i) => /* @__PURE__ */ jsx("span", { style: {
                  width: 6,
                  height: 6,
                  borderRadius: 1,
                  background: c,
                  display: "inline-block"
                } }, i)) }),
                THEME_LABELS[t]
              ]
            },
            t
          );
        }) }),
        /* @__PURE__ */ jsx("div", { style: { overflowX: "auto", overflowY: "visible", WebkitOverflowScrolling: "touch" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "inline-flex", gap: showDayLabels ? 6 : 0, paddingBottom: 2 }, children: [
          showDayLabels && /* @__PURE__ */ jsx("div", { style: {
            display: "flex",
            flexDirection: "column",
            gap: blockGap,
            paddingTop: showMonthLabels ? 24 : 0,
            justifyContent: "space-between",
            minWidth: 26,
            flexShrink: 0
          }, children: DAY_LABELS.map((d, i) => /* @__PURE__ */ jsx("div", { style: {
            height: blockSize,
            fontSize: 9,
            lineHeight: `${blockSize}px`,
            color: colors.textMuted,
            userSelect: "none",
            textAlign: "right",
            display: i % 2 === 0 ? "none" : "block"
          }, children: d }, d)) }),
          /* @__PURE__ */ jsxs("div", { style: { position: "relative", marginLeft: showDayLabels ? 8 : 0 }, children: [
            showMonthLabels && /* @__PURE__ */ jsx("div", { style: { height: 20, marginBottom: 4, position: "relative", width: gridW }, children: monthLabels.map(({ weekIndex, month }) => /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  position: "absolute",
                  left: weekIndex * blockStep,
                  fontSize: 10,
                  color: colors.textMuted,
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  lineHeight: "20px"
                },
                children: MONTH_NAMES[month]
              },
              `${weekIndex}-${month}`
            )) }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: blockGap, width: gridW }, children: filteredWeeks.map((week, wi) => /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: blockGap }, children: week.days.map((day) => {
              const isReal = !!day.date;
              return /* @__PURE__ */ jsx(
                "div",
                {
                  onMouseEnter: isReal ? (e) => handleMouseEnter(e, day) : void 0,
                  onMouseLeave: isReal ? handleMouseLeave : void 0,
                  onClick: () => isReal && (onContributionClick == null ? void 0 : onContributionClick(day)),
                  style: {
                    width: blockSize,
                    height: blockSize,
                    borderRadius: Math.max(2, blockSize * 0.2),
                    background: isReal ? colorMap[day.level] : "transparent",
                    cursor: isReal && onContributionClick ? "pointer" : "default",
                    flexShrink: 0,
                    transition: "filter 0.1s"
                  },
                  onMouseDown: (e) => {
                    if (isReal) e.currentTarget.style.filter = "brightness(1.3)";
                  },
                  onMouseUp: (e) => {
                    e.currentTarget.style.filter = "";
                  }
                },
                day.date || wi + "-" + Math.random()
              );
            }) }, wi)) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          flexWrap: "wrap",
          gap: 8
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: colors.textMuted }, children: "Less" }),
            [colors.empty, colors.level1, colors.level2, colors.level3, colors.level4].map((c, i) => /* @__PURE__ */ jsx("div", { style: {
              width: blockSize,
              height: blockSize,
              borderRadius: Math.max(2, blockSize * 0.2),
              background: c,
              flexShrink: 0
            } }, i)),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: colors.textMuted }, children: "More" })
          ] }),
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: colors.text, fontWeight: 600, whiteSpace: "nowrap" }, children: [
            data.totalContributions.toLocaleString(),
            " contributions this year"
          ] })
        ] }),
        tooltip.visible && /* @__PURE__ */ jsxs(
          "div",
          {
            ref: tooltipRef,
            style: {
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y - 44,
              transform: "translateX(-50%)",
              background: "#21262d",
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              color: colors.text,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 50,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              fontFamily: "inherit",
              lineHeight: 1.5
            },
            children: [
              /* @__PURE__ */ jsx("span", { style: { fontWeight: 600, color: tooltip.count === 0 ? colors.textMuted : colors.level4 }, children: tooltip.count === 0 ? "No contributions" : `${tooltip.count} contribution${tooltip.count !== 1 ? "s" : ""}` }),
              /* @__PURE__ */ jsx("span", { style: { color: colors.textMuted }, children: " on " }),
              /* @__PURE__ */ jsx("span", { style: { color: colors.text }, children: formatDate(tooltip.date) }),
              /* @__PURE__ */ jsx("div", { style: {
                position: "absolute",
                bottom: -5,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 8,
                height: 8,
                background: "#21262d",
                borderRight: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`
              } })
            ]
          }
        )
      ]
    }
  );
}

export { ContributionCalendar, THEMES, useGithubContributions };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map