// app/api/github-contributions/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const username = searchParams.get("username")?.trim()
  const year     = parseInt(searchParams.get("year") || "", 10)

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 })
  }

  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    return NextResponse.json({ error: "Invalid GitHub username" }, { status: 400 })
  }

  const now         = new Date()
  const targetYear  = year || now.getFullYear()
  const from        = new Date(`${targetYear}-01-01T00:00:00Z`).toISOString()
  const to          = new Date(`${targetYear}-12-31T23:59:59Z`).toISOString()

  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `

  try {
    const ghRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { username, from, to } }),
      // @ts-ignore — Next.js fetch extension
      next: { revalidate: 3600 },
    })

    const json = await ghRes.json()

    if (!ghRes.ok || json.errors) {
      return NextResponse.json(
        { error: json.errors?.[0]?.message ?? "GitHub API error" },
        { status: 500 }
      )
    }

    if (!json.data?.user) {
      return NextResponse.json(
        { error: `User "${username}" not found or contributions are private.` },
        { status: 404 }
      )
    }

    const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks as Array<{
      contributionDays: Array<{ date: string; contributionCount: number }>
    }>

    // Flatten for max-count calculation (level scaling)
    const allDays = weeks.flatMap((w) => w.contributionDays)
    const max     = Math.max(...allDays.map((d) => d.contributionCount), 0)

    const mappedWeeks = weeks.map((w) => ({
      days: w.contributionDays.map((d) => {
        const count = d.contributionCount

        let level: 0 | 1 | 2 | 3 | 4 = 0
        if (count > 0) {
          const ratio = count / (max || 1)
          if      (ratio > 0.75) level = 4
          else if (ratio > 0.5)  level = 3
          else if (ratio > 0.25) level = 2
          else                   level = 1
        }

        return { date: d.date, count, level }
      }),
    }))

    const totalContributions = allDays.reduce((sum, d) => sum + d.contributionCount, 0)

    return NextResponse.json(
      { weeks: mappedWeeks, totalContributions },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}