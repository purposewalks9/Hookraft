import { useState, useCallback, useEffect, useMemo } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

// src/useGithubContributions.ts
var THEMES = {
  github: {
    empty: "#ebedf0",
    level1: "#9be9a8",
    level2: "#40c463",
    level3: "#30a14e",
    level4: "#216e39"
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
    level1: "#b6e3ff",
    level2: "#54aeff",
    level3: "#0969da",
    level4: "#0a3069"
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
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const cells = doc.querySelectorAll("td[data-date]");
  if (!cells.length) {
    throw new Error(
      `No contribution data found for "${username}". Make sure the proxy is returning GitHub's contribution HTML.`
    );
  }
  const dayMap = /* @__PURE__ */ new Map();
  cells.forEach((cell) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const date = (_a = cell.getAttribute("data-date")) != null ? _a : "";
    const level = parseInt((_b = cell.getAttribute("data-level")) != null ? _b : "0", 10);
    const text = (_e = (_d = (_c = cell.querySelector("span")) == null ? void 0 : _c.textContent) != null ? _d : cell.textContent) != null ? _e : "";
    const count = parseInt((_g = (_f = text.match(/\d+/)) == null ? void 0 : _f[0]) != null ? _g : "0", 10);
    dayMap.set(date, { date, count, level });
  });
  const sorted = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = [];
  let week = [];
  if (sorted.length) {
    const firstDow = new Date(sorted[0].date).getDay();
    for (let i = 0; i < firstDow; i++) {
      const d = new Date(sorted[0].date);
      d.setDate(d.getDate() - (firstDow - i));
      week.push({ date: d.toISOString().slice(0, 10), count: 0, level: 0 });
    }
  }
  sorted.forEach((day) => {
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
  const totalContributions = sorted.reduce((s, d) => s + d.count, 0);
  const { currentStreak, longestStreak } = computeStreaks(weeks);
  return { weeks, totalContributions, longestStreak, currentStreak };
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
var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function resolveColors(theme = "github", custom) {
  var _a;
  if (theme === "custom" && custom) return custom;
  return (_a = THEMES[theme]) != null ? _a : THEMES.github;
}
function ContributionCalendar({
  username,
  year,
  theme = "github",
  customColors,
  blockSize = 11,
  blockGap = 3,
  showMonthLabels = true,
  showDayLabels = true,
  className,
  style,
  onContributionClick,
  proxyUrl
}) {
  var _a;
  const { data, loading, error } = useGithubContributions({
    username,
    year,
    proxyUrl
  });
  const colors = useMemo(
    () => resolveColors(theme, customColors),
    [theme, customColors]
  );
  const colorMap = {
    0: colors.empty,
    1: colors.level1,
    2: colors.level2,
    3: colors.level3,
    4: colors.level4
  };
  const blockStep = blockSize + blockGap;
  const monthLabels = useMemo(() => {
    if (!data) return [];
    const labels = [];
    let lastMonth = -1;
    data.weeks.forEach((week, wi) => {
      const firstActive = week.days.find((d) => d.date);
      if (!firstActive) return;
      const month = new Date(firstActive.date).getMonth();
      if (month !== lastMonth && month >= 0 && month <= 11) {
        labels.push({ label: MONTHS[month], weekIndex: wi });
        lastMonth = month;
      }
    });
    return labels;
  }, [data]);
  const gridW = ((_a = data == null ? void 0 : data.weeks.length) != null ? _a : 53) * blockStep;
  const gridH = 7 * blockStep;
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className, style: { ...style, opacity: 0.5 }, children: /* @__PURE__ */ jsx("div", { style: {
      width: "100%",
      height: gridH + (showMonthLabels ? 20 : 0),
      background: "repeating-linear-gradient(90deg, #ebedf0 0px, #ebedf0 11px, transparent 11px, transparent 14px)",
      borderRadius: 4,
      animation: "pulse 1.5s ease-in-out infinite"
    } }) });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className, style: { ...style, color: "#cf222e", fontSize: 13 }, children: [
      "Failed to load contributions for ",
      /* @__PURE__ */ jsx("strong", { children: username }),
      ": ",
      error.message
    ] });
  }
  if (!data) return null;
  return (
    // ↓ Outer wrapper clips overflow and is the scroll container
    /* @__PURE__ */ jsx(
      "div",
      {
        className,
        style: {
          overflowX: "auto",
          overflowY: "visible",
          WebkitOverflowScrolling: "touch",
          ...style
        },
        children: /* @__PURE__ */ jsxs("div", { style: {
          display: "inline-flex",
          // shrink-wraps to content width, enables scroll
          gap: showDayLabels ? 6 : 0,
          padding: "0 12px"
        }, children: [
          showDayLabels && /* @__PURE__ */ jsx("div", { style: {
            display: "flex",
            flexDirection: "column",
            gap: blockGap,
            paddingTop: showMonthLabels ? 24 : 0,
            justifyContent: "space-between",
            minWidth: 25,
            flexShrink: 0
          }, children: DAYS.map((d, i) => /* @__PURE__ */ jsx("div", { style: {
            height: blockSize,
            fontSize: 9,
            lineHeight: `${blockSize}px`,
            color: "var(--color-text-tertiary, #6e7781)",
            userSelect: "none",
            display: i % 2 === 0 ? "none" : "block"
          }, children: d }, d)) }),
          /* @__PURE__ */ jsxs("div", { style: { position: "relative", marginLeft: showDayLabels ? 8 : 0 }, children: [
            showMonthLabels && /* @__PURE__ */ jsx("div", { style: { position: "relative", height: 20, marginBottom: 4, width: gridW }, children: monthLabels.map(({ label, weekIndex }) => /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  position: "absolute",
                  left: weekIndex * blockStep,
                  fontSize: 10,
                  color: "var(--color-text-secondary, #6e7781)",
                  userSelect: "none",
                  whiteSpace: "nowrap"
                },
                children: label
              },
              `${label}-${weekIndex}`
            )) }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: blockGap, width: gridW }, children: data.weeks.map((week, wi) => /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: blockGap }, children: week.days.map((day) => /* @__PURE__ */ jsx(
              "div",
              {
                onClick: () => onContributionClick == null ? void 0 : onContributionClick(day),
                style: {
                  width: blockSize,
                  height: blockSize,
                  borderRadius: Math.max(2, blockSize * 0.18),
                  background: colorMap[day.level],
                  cursor: onContributionClick ? "pointer" : "default",
                  transition: "opacity 0.1s",
                  flexShrink: 0
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.opacity = "0.75";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.opacity = "1";
                }
              },
              day.date
            )) }, wi)) })
          ] })
        ] })
      }
    )
  );
}

export { ContributionCalendar, THEMES, useGithubContributions };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map