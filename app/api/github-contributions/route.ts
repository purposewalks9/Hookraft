import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge" // optional — works on Node runtime too

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const username = searchParams.get("username")?.trim()
  const year     = searchParams.get("year")

  if (!username) {
    return NextResponse.json(
      { error: "Missing required query param: username" },
      { status: 400 }
    )
  }

  // Validate username — GitHub usernames are alphanumeric + hyphens, 1–39 chars
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    return NextResponse.json(
      { error: "Invalid GitHub username" },
      { status: 400 }
    )
  }

  const yearParam = year
    ? `?from=${year}-01-01&to=${year}-12-31`
    : ""

  const url = `https://github.com/users/${username}/contributions${yearParam}`

  let ghRes: Response
  try {
    ghRes = await fetch(url, {
      headers: {
        // Mimic a browser request — GitHub returns the SVG fragment only when
        // X-Requested-With is absent and Accept includes text/html
        "Accept":          "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (compatible; hookraft-contributions-bot/1.0; +https://hookraft.site)",
      },
      // Cache for 1 hour — contributions don't change by the second
      next: { revalidate: 3600 },
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Upstream fetch failed: ${String(err)}` },
      { status: 502 }
    )
  }

  if (!ghRes.ok) {
    return NextResponse.json(
      { error: `GitHub returned ${ghRes.status} for user "${username}"` },
      { status: ghRes.status === 404 ? 404 : 502 }
    )
  }

  const html = await ghRes.text()

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type":  "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}