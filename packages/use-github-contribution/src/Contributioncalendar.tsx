"use client"

import { useMemo } from "react"
import { useGithubContributions, THEMES } from "./useGithubContributions"
import type { CSSProperties } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContributionCalendarProps {
  username: string
  year?: number
  theme?: useGithubContributions.Theme
  customColors?: useGithubContributions.CustomColors
  blockSize?: number
  blockGap?: number
  showMonthLabels?: boolean
  showDayLabels?: boolean
  className?: string
  style?: CSSProperties
  onContributionClick?: (day: useGithubContributions.ContributionDay) => void
  proxyUrl?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function resolveColors(
  theme: useGithubContributions.Theme = "github",
  custom?: useGithubContributions.CustomColors
): useGithubContributions.CustomColors {
  if (theme === "custom" && custom) return custom
  return THEMES[theme as keyof typeof THEMES] ?? THEMES.github
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContributionCalendar({
  username,
  year,
  theme = "github",
  customColors,
  blockSize = 11,
  blockGap  = 3,
  showMonthLabels = true,
  showDayLabels   = true,
  className,
  style,
  onContributionClick,
  proxyUrl,
}: ContributionCalendarProps) {
  const { data, loading, error } = useGithubContributions({
    username, year, theme, customColors, proxyUrl
  })

  const colors = useMemo(
    () => resolveColors(theme, customColors),
    [theme, customColors]
  )

  const colorMap: Record<0|1|2|3|4, string> = {
    0: colors.empty,
    1: colors.level1,
    2: colors.level2,
    3: colors.level3,
    4: colors.level4,
  }

  const blockStep = blockSize + blockGap
  const gridW = (data?.weeks.length ?? 53) * blockStep
  const gridH = 7 * blockStep

  if (loading) {
    return (
      <div className={className} style={{ ...style, opacity: 0.5 }}>
        <div style={{
          width: "100%",
          height: gridH + (showMonthLabels ? 20 : 0),
          background: "repeating-linear-gradient(90deg, #ebedf0 0px, #ebedf0 11px, transparent 11px, transparent 14px)",
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={className} style={{ ...style, color: "#cf222e", fontSize: 13 }}>
        Failed to load contributions for <strong>{username}</strong>: {error.message}
      </div>
    )
  }

  if (!data) return null

  return (
    // ↓ Outer wrapper clips overflow and is the scroll container
    <div
      className={className}
      style={{
        overflowX: "auto",
        overflowY: "visible",
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      
      <div style={{
        display:  "inline-flex",
        gap:      showDayLabels ? 6 : 0,
        padding:  "0 12px",
      }}>

        {/* Day labels column */}
        {showDayLabels && (
          <div style={{
            display:        "flex",
            flexDirection:  "column",
            gap:            blockGap,
            paddingTop:     showMonthLabels ? 24 : 0,
            justifyContent: "space-between",
            minWidth:       25,
            flexShrink:     0,
          }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{
                height:     blockSize,
                fontSize:   9,
                lineHeight: `${blockSize}px`,
                color:      "var(--color-text-tertiary, #6e7781)",
                userSelect: "none",
                display:    i % 2 === 0 ? "none" : "block",
              }}>
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Grid: month labels + blocks stacked vertically */}
        <div style={{ position: "relative", marginLeft: showDayLabels ? 8 : 0 }}>

          {/* Month labels — aligned with weeks */}
          {showMonthLabels && (
            <div style={{ height: 20, marginBottom: 4, display: "flex", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: blockGap, width: gridW }}>
                {data.weeks.map((week, wi) => {
                  const monthIndex = new Date(week.days[0].date).getMonth()
                  const isNewMonth = wi === 0 || monthIndex !== new Date(data.weeks[wi - 1].days[0].date).getMonth()
                  return (
                    <div 
                      key={wi} 
                      style={{ 
                        width: blockStep, 
                        fontSize: 10, 
                        color: "var(--color-text-secondary, #6e7781)",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isNewMonth ? MONTHS[monthIndex] : ""}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Block grid */}
          <div style={{ display: "flex", gap: blockGap, width: gridW }}>
            {data.weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: blockGap }}>
                {week.days.map((day) => (
                  <div
                    key={day.date}
                    onClick={() => onContributionClick?.(day)}
                    style={{
                      width:        blockSize,
                      height:       blockSize,
                      borderRadius: Math.max(2, blockSize * 0.18),
                      background:   colorMap[day.level],
                      cursor:       onContributionClick ? "pointer" : "default",
                      transition:   "opacity 0.1s",
                      flexShrink:   0,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.75" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1" }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
