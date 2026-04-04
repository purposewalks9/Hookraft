import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sponsorships } from "@/db/schemas/sponsorships";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Add this to your .env.local:  FLUTTERWAVE_SECRET_HASH=your_secret_hash_from_flutterwave_dashboard
const SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH!;

export async function POST(req: NextRequest) {
  // 1. Verify the request is genuinely from Flutterwave
  const signature = req.headers.get("verif-hash");
  if (!signature || signature !== SECRET_HASH) {
    console.error("[Flutterwave Webhook] Invalid signature");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();

  // 2. Only process successful charge events
  if (payload.event !== "charge.completed" || payload.data?.status !== "successful") {
    return NextResponse.json({ received: true });
  }

  const txRef: string = payload.data?.tx_ref;
  const transactionId: string = String(payload.data?.id);

  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  // 3. Find the sponsorship row that matches this tx_ref
  const sponsorship = await db.query.sponsorships.findFirst({
    where: eq(sponsorships.flutterwaveTxRef, txRef),
  });

  if (!sponsorship) {
    // Could be a different payment on your account — just ignore
    console.warn("[Flutterwave Webhook] No sponsorship found for tx_ref:", txRef);
    return NextResponse.json({ received: true });
  }

  // 4. Mark as verified ✅
  await db
    .update(sponsorships)
    .set({
      verified: true,
      flutterwaveTransactionId: transactionId,
      verifiedAt: new Date(),
    })
    .where(eq(sponsorships.flutterwaveTxRef, txRef));

  console.log("[Flutterwave Webhook] Payment verified for sponsorId:", sponsorship.sponsorId);
  return NextResponse.json({ received: true });
}