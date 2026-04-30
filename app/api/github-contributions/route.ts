import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

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
        "Accept":          "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        // GitHub returns contribution counts in cell text only when requested
        // as a standard browser navigation — drop X-Requested-With entirely
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
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

  if (!html.includes("data-date")) {
    return NextResponse.json(
      { error: `No contribution data found for "${username}". The user may not exist or their contributions may be private.` },
      { status: 404 }
    )
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type":  "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}