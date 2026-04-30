"use client"

import { useMemo, useState, useRef, useEffect, type CSSProperties } from "react"
import { useGithubContributions, THEMES } from "./useGithubContributions"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TooltipState {
  visible: boolean
  x: number
  y: number
  date: string
  count: number
}

interface ContributionCalendarProps {
  username: string
  year?: number
  theme?: useGithubContributions.Theme
  customColors?: useGithubContributions.CustomColors
  blockSize?: number
  blockGap?: number
  showMonthLabels?: boolean
  showDayLabels?: boolean
  showThemeSwitcher?: boolean
  className?: string
  style?: CSSProperties
  onContributionClick?: (day: useGithubContributions.ContributionDay) => void
  proxyUrl?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const DARK_THEMES: Record<string, useGithubContributions.CustomColors & { bg: string; surface: string; text: string; textMuted: string; border: string }> = {
  github: {
    bg: "#0d1117", surface: "#161b22", text: "#e6edf3", textMuted: "#7d8590", border: "#30363d",
    empty: "#161b22", level1: "#0e4429", level2: "#006d32", level3: "#26a641", level4: "#39d353",
  },
  halloween: {
    bg: "#0d1117", surface: "#161b22", text: "#e6edf3", textMuted: "#7d8590", border: "#30363d",
    empty: "#161b22", level1: "#631c03", level2: "#bd561d", level3: "#fa7a18", level4: "#fddf68",
  },
  winter: {
    bg: "#0d1117", surface: "#161b22", text: "#e6edf3", textMuted: "#7d8590", border: "#30363d",
    empty: "#161b22", level1: "#0a3069", level2: "#0969da", level3: "#54aeff", level4: "#b6e3ff",
  },
  pink: {
    bg: "#0d1117", surface: "#161b22", text: "#e6edf3", textMuted: "#7d8590", border: "#30363d",
    empty: "#161b22", level1: "#4a0d2e", level2: "#8b1a52", level3: "#d4317a", level4: "#ff79c6",
  },
  dracula: {
    bg: "#0d1117", surface: "#161b22", text: "#e6edf3", textMuted: "#7d8590", border: "#30363d",
    empty: "#161b22", level1: "#1e1433", level2: "#44275a", level3: "#7b4ab8", level4: "#bd93f9",
  },
}

const THEME_LABELS: Record<string, string> = {
  github: "GitHub",
  halloween: "Halloween",
  winter: "Winter",
  pink: "Pink",
  dracula: "Dracula",
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContributionCalendar({
  username,
  year,
  theme: themeProp = "github",
  customColors,
  blockSize = 11,
  blockGap  = 3,
  showMonthLabels  = true,
  showDayLabels    = true,
  showThemeSwitcher = true,
  className,
  style,
  onContributionClick,
  proxyUrl,
}: ContributionCalendarProps) {
  const [activeTheme, setActiveTheme] = useState<string>(
    themeProp === "custom" ? "github" : themeProp
  )

  const colors = DARK_THEMES[activeTheme] ?? DARK_THEMES.github

  const { data, loading, error } = useGithubContributions({
    username,
    year,
    theme: "custom",
    customColors: {
      empty:  colors.empty,
      level1: colors.level1,
      level2: colors.level2,
      level3: colors.level3,
      level4: colors.level4,
    },
    proxyUrl,
  })

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, date: "", count: 0,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef   = useRef<HTMLDivElement>(null)

  const colorMap: Record<0|1|2|3|4, string> = {
    0: colors.empty,
    1: colors.level1,
    2: colors.level2,
    3: colors.level3,
    4: colors.level4,
  }

  const blockStep = blockSize + blockGap

  // ── Filter weeks: drop leading weeks that are entirely padding (fake dates before real data)
  const filteredWeeks = useMemo(() => {
    if (!data?.weeks) return []
    const weeks = data.weeks

    // Find the first real date — the first day with a non-padding date
    // We detect the "real start" by finding the first day whose date appears in the parsed range
    // Simple heuristic: skip weeks whose first real day is in a different year-month than expected
    // Better: find where actual year data begins
    const yearStr = year ? String(year) : String(new Date().getFullYear())

    // Find first week index where at least one day belongs to the target year
    let firstRealWeek = 0
    for (let i = 0; i < weeks.length; i++) {
      if (weeks[i].days.some((d) => d.date.startsWith(yearStr))) {
        firstRealWeek = i
        break
      }
    }

    // Find last week index where at least one day belongs to the target year
    let lastRealWeek = weeks.length - 1
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].days.some((d) => d.date.startsWith(yearStr))) {
        lastRealWeek = i
        break
      }
    }

    return weeks.slice(firstRealWeek, lastRealWeek + 1)
  }, [data, year])

  // ── Month labels: only render if this week starts a new month AND is not just 1-2 cols from edge
  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; month: number }[] = []
    filteredWeeks.forEach((week, wi) => {
      const firstDay = week.days.find((d) => d.date !== "")
      if (!firstDay) return
      const monthIndex = new Date(firstDay.date + "T00:00:00").getMonth()
      if (wi === 0) {
        // Only show first month label if the week starts on or near the 1st
        const dayOfMonth = new Date(firstDay.date + "T00:00:00").getDate()
        if (dayOfMonth <= 7) labels.push({ weekIndex: wi, month: monthIndex })
        return
      }
      const prevFirstDay = filteredWeeks[wi - 1].days.find((d) => d.date !== "")
      if (!prevFirstDay) return
      const prevMonth = new Date(prevFirstDay.date + "T00:00:00").getMonth()
      if (monthIndex !== prevMonth) {
        // Don't render if there are fewer than 2 remaining weeks in this month (avoid orphan at end)
        const weeksLeft = filteredWeeks.length - wi
        if (weeksLeft >= 2) labels.push({ weekIndex: wi, month: monthIndex })
      }
    })
    return labels
  }, [filteredWeeks])

  const gridW = filteredWeeks.length * blockStep
  const gridH = 7 * blockStep

  // ── Tooltip positioning
  function handleMouseEnter(
    e: React.MouseEvent<HTMLDivElement>,
    day: useGithubContributions.ContributionDay
  ) {
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + blockSize / 2,
      y: rect.top  - containerRect.top,
      date: day.date,
      count: day.count,
    })
  }

  function handleMouseLeave() {
    setTooltip((t) => ({ ...t, visible: false }))
  }

  // ── Skeleton
  if (loading) {
    return (
      <div
        className={className}
        style={{
          background: colors.bg,
          borderRadius: 12,
          padding: "20px 24px",
          border: `1px solid ${colors.border}`,
          ...style,
        }}
      >
        <div style={{
          width: "100%",
          height: gridH + 40,
          background: `repeating-linear-gradient(90deg, ${colors.empty} 0px, ${colors.empty} ${blockSize}px, transparent ${blockSize}px, transparent ${blockStep}px)`,
          borderRadius: 4,
          opacity: 0.4,
          animation: "cc-pulse 1.5s ease-in-out infinite",
        }} />
        <style>{`@keyframes cc-pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className} style={{
        background: colors.bg, borderRadius: 12, padding: "20px 24px",
        border: `1px solid ${colors.border}`, color: "#f85149", fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace", ...style,
      }}>
        Failed to load contributions for <strong>{username}</strong>: {error.message}
      </div>
    )
  }

  if (!data || !filteredWeeks.length) return null

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        background: colors.bg,
        borderRadius: 12,
        padding: "20px 20px 16px",
        border: `1px solid ${colors.border}`,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        display: "inline-block",
        ...style,
      }}
    >
      {/* ── Theme switcher */}
      {showThemeSwitcher && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {Object.keys(DARK_THEMES).map((t) => {
            const tc = DARK_THEMES[t]
            const isActive = t === activeTheme
            return (
              <button
                key={t}
                onClick={() => setActiveTheme(t)}
                style={{
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
                  outline: "none",
                }}
              >
                <span style={{
                  display: "inline-flex", gap: 2,
                }}>
                  {[tc.level1, tc.level2, tc.level3, tc.level4].map((c, i) => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: 1,
                      background: c, display: "inline-block",
                    }} />
                  ))}
                </span>
                {THEME_LABELS[t]}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Scroll container */}
      <div style={{ overflowX: "auto", overflowY: "visible", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "inline-flex", gap: showDayLabels ? 6 : 0, paddingBottom: 2 }}>

          {/* Day labels */}
          {showDayLabels && (
            <div style={{
              display: "flex", flexDirection: "column", gap: blockGap,
              paddingTop: showMonthLabels ? 24 : 0,
              justifyContent: "space-between",
              minWidth: 26, flexShrink: 0,
            }}>
              {DAY_LABELS.map((d, i) => (
                <div key={d} style={{
                  height: blockSize,
                  fontSize: 9,
                  lineHeight: `${blockSize}px`,
                  color: colors.textMuted,
                  userSelect: "none",
                  textAlign: "right",
                  display: i % 2 === 0 ? "none" : "block",
                }}>
                  {d}
                </div>
              ))}
            </div>
          )}

          {/* Grid area */}
          <div style={{ position: "relative", marginLeft: showDayLabels ? 8 : 0 }}>

            {/* Month labels */}
            {showMonthLabels && (
              <div style={{ height: 20, marginBottom: 4, position: "relative", width: gridW }}>
                {monthLabels.map(({ weekIndex, month }) => (
                  <div
                    key={`${weekIndex}-${month}`}
                    style={{
                      position: "absolute",
                      left: weekIndex * blockStep,
                      fontSize: 10,
                      color: colors.textMuted,
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      lineHeight: "20px",
                    }}
                  >
                    {MONTH_NAMES[month]}
                  </div>
                ))}
              </div>
            )}

            {/* Block grid */}
            <div style={{ display: "flex", gap: blockGap, width: gridW }}>
              {filteredWeeks.map((week, wi) => (
                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: blockGap }}>
                  {week.days.map((day) => {
                    const isReal = !!day.date
                    return (
                      <div
                        key={day.date || wi + "-" + Math.random()}
                        onMouseEnter={isReal ? (e) => handleMouseEnter(e, day) : undefined}
                        onMouseLeave={isReal ? handleMouseLeave : undefined}
                        onClick={() => isReal && onContributionClick?.(day)}
                        style={{
                          width: blockSize,
                          height: blockSize,
                          borderRadius: Math.max(2, blockSize * 0.2),
                          background: isReal ? colorMap[day.level] : "transparent",
                          cursor: isReal && onContributionClick ? "pointer" : "default",
                          flexShrink: 0,
                          transition: "filter 0.1s",
                        }}
                        onMouseDown={(e) => {
                          if (isReal) (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.3)"
                        }}
                        onMouseUp={(e) => {
                          (e.currentTarget as HTMLDivElement).style.filter = ""
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: legend + total */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
        flexWrap: "wrap",
        gap: 8,
      }}>
        {/* Less → More legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: colors.textMuted }}>Less</span>
          {[colors.empty, colors.level1, colors.level2, colors.level3, colors.level4].map((c, i) => (
            <div key={i} style={{
              width: blockSize,
              height: blockSize,
              borderRadius: Math.max(2, blockSize * 0.2),
              background: c,
              flexShrink: 0,
            }} />
          ))}
          <span style={{ fontSize: 10, color: colors.textMuted }}>More</span>
        </div>

        {/* Total contributions */}
        <span style={{ fontSize: 11, color: colors.text, fontWeight: 600, whiteSpace: "nowrap" }}>
          {data.totalContributions.toLocaleString()} contributions this year
        </span>
      </div>

      {/* ── Tooltip */}
      {tooltip.visible && (
        <div
          ref={tooltipRef}
          style={{
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
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: tooltip.count === 0 ? colors.textMuted : colors.level4 }}>
            {tooltip.count === 0 ? "No contributions" : `${tooltip.count} contribution${tooltip.count !== 1 ? "s" : ""}`}
          </span>
          <span style={{ color: colors.textMuted }}> on </span>
          <span style={{ color: colors.text }}>{formatDate(tooltip.date)}</span>
          {/* Arrow */}
          <div style={{
            position: "absolute",
            bottom: -5,
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 8,
            height: 8,
            background: "#21262d",
            borderRight: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`,
          }} />
        </div>
      )}
    </div>
  )
}