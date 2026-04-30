"use client"

import { useState, useEffect, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export declare namespace useGithubContributions {
  interface ContributionDay {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
  }

  interface ContributionWeek {
    days: ContributionDay[]
  }

  interface ContributionData {
    weeks: ContributionWeek[]
    totalContributions: number
    longestStreak: number
    currentStreak: number
  }

  type Theme = "github" | "halloween" | "winter" | "pink" | "dracula" | "custom"

  interface CustomColors {
    empty: string
    level1: string
    level2: string
    level3: string
    level4: string
  }

  interface Options {
    username: string
    theme?: Theme
    customColors?: CustomColors
    year?: number
    proxyUrl?: string
    onLoad?: (data: ContributionData) => void
    onError?: (error: Error) => void
  }

  interface Return {
    data: ContributionData | null
    loading: boolean
    error: Error | null
    refetch: () => void
  }
}

// ─── Themes ───────────────────────────────────────────────────────────────────

export const THEMES: Record<
  Exclude<useGithubContributions.Theme, "custom">,
  useGithubContributions.CustomColors
> = {
  github: {
    empty:  "#161b22",
    level1: "#0e4429",
    level2: "#006d32",
    level3: "#26a641",
    level4: "#39d353",
  },
  halloween: {
    empty:  "#161b22",
    level1: "#631c03",
    level2: "#bd561d",
    level3: "#fa7a18",
    level4: "#fddf68",
  },
  winter: {
    empty:  "#161b22",
    level1: "#0a3069",
    level2: "#0969da",
    level3: "#54aeff",
    level4: "#b6e3ff",
  },
  pink: {
    empty:  "#161b22",
    level1: "#4a0d2e",
    level2: "#8b1a52",
    level3: "#d4317a",
    level4: "#ff79c6",
  },
  dracula: {
    empty:  "#161b22",
    level1: "#1e1433",
    level2: "#44275a",
    level3: "#7b4ab8",
    level4: "#bd93f9",
  },
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function computeStreaks(weeks: useGithubContributions.ContributionWeek[]) {
  const days  = weeks.flatMap((w) => w.days).sort((a, b) => a.date.localeCompare(b.date))
  const today = new Date().toISOString().slice(0, 10)
  let current = 0
  let longest = 0
  let streak  = 0

  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i]
    if (d.date > today) continue
    if (d.count > 0) {
      streak++
      if (streak > longest) longest = streak
      if (current === 0)    current = streak
    } else {
      if (current > 0) break
      streak = 0
    }
  }

  return { currentStreak: current, longestStreak: longest }
}

// ─── GraphQL fetch & parse ────────────────────────────────────────────────────

async function fetchContributions(
  username: string,
  year?: number,
  proxyUrl?: string,
): Promise<useGithubContributions.ContributionData> {
  const base   = proxyUrl ?? "/api/github-contributions"
  const params = new URLSearchParams({ username })
  if (year) params.set("year", String(year))

  const res = await fetch(`${base}?${params}`)
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Failed to fetch contributions for "${username}": ${msg}`)
  }

  // The proxy now returns JSON directly (GraphQL response)
  const json = await res.json() as {
    weeks: Array<{
      days: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>
    }>
    totalContributions: number
    error?: string
  }

  if (json.error) {
    throw new Error(json.error)
  }

  if (!json.weeks || !json.weeks.length) {
    throw new Error(
      `No contribution data found for "${username}". ` +
      `The user may not exist or their contributions may be private.`
    )
  }

  // Align weeks to Sunday boundaries (same as before)
  const allDays = json.weeks.flatMap((w) => w.days).sort((a, b) => a.date.localeCompare(b.date))

  const weeks: useGithubContributions.ContributionWeek[] = []
  let week: useGithubContributions.ContributionDay[]     = []

  // Pad to Sunday-aligned start
  if (allDays.length) {
    const firstDow = new Date(allDays[0].date).getDay()
    for (let i = 0; i < firstDow; i++) {
      const d = new Date(allDays[0].date)
      d.setDate(d.getDate() - (firstDow - i))
      week.push({ date: d.toISOString().slice(0, 10), count: 0, level: 0 })
    }
  }

  allDays.forEach((day) => {
    week.push(day)
    if (week.length === 7) { weeks.push({ days: week }); week = [] }
  })

  if (week.length) {
    while (week.length < 7) {
      const last = new Date(week[week.length - 1].date)
      last.setDate(last.getDate() + 1)
      week.push({ date: last.toISOString().slice(0, 10), count: 0, level: 0 })
    }
    weeks.push({ days: week })
  }

  const { currentStreak, longestStreak } = computeStreaks(weeks)

  return {
    weeks,
    totalContributions: json.totalContributions,
    longestStreak,
    currentStreak,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGithubContributions(
  options: useGithubContributions.Options
): useGithubContributions.Return {
  const { username, year, proxyUrl, onLoad, onError } = options

  const [data,    setData]    = useState<useGithubContributions.ContributionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<Error | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchContributions(username, year, proxyUrl)
      setData(result)
      onLoad?.(result)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      onError?.(e)
    } finally {
      setLoading(false)
    }
  }, [username, year, proxyUrl])

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}