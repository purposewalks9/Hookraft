import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sponsorships } from "@/db/schemas/sponsorships";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ plan: null, sponsorId: null, verified: false });
  }

  const sponsor = await db.query.sponsorships.findFirst({
    where: eq(sponsorships.userId, session.user.id),
  });

  return NextResponse.json({
    plan: sponsor?.plan ?? null,
    sponsorId: sponsor?.sponsorId ?? null,
    verified: sponsor?.verified ?? false,
  });
}