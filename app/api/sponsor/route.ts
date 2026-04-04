import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sponsorships } from "@/db/schemas/sponsorships";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

function generateSponsorId() {
  return "HK-" + nanoid(6).toUpperCase();
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, txRef } = await req.json();

  if (!["silver", "gold", "diamond"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (!txRef) {
    return NextResponse.json({ error: "Missing txRef" }, { status: 400 });
  }

  const existing = await db.query.sponsorships.findFirst({
    where: eq(sponsorships.userId, session.user.id),
  });

  if (existing) {
    // Update plan + new txRef, reset verified until webhook confirms again
    await db
      .update(sponsorships)
      .set({ plan, flutterwaveTxRef: txRef, verified: false, verifiedAt: null })
      .where(eq(sponsorships.userId, session.user.id));
    return NextResponse.json({ success: true, sponsorId: existing.sponsorId });
  }

  // New sponsorship row — unverified until Flutterwave webhook fires
  const sponsorId = generateSponsorId();
  await db.insert(sponsorships).values({
    id: nanoid(10),
    userId: session.user.id,
    plan,
    sponsorId,
    verified: false,
    flutterwaveTxRef: txRef,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, sponsorId });
}