import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sponsorships } from "@/db/schemas/sponsorships";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH!;

export async function POST(req: NextRequest) {

  const signature = req.headers.get("verif-hash");
  if (!signature || signature !== SECRET_HASH) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();

  if (payload.event !== "charge.completed" || payload.data?.status !== "successful") {
    return NextResponse.json({ received: true });
  }

  const txRef: string = payload.data?.tx_ref;
  const transactionId: string = String(payload.data?.id);

  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  const sponsorship = await db.query.sponsorships.findFirst({
    where: eq(sponsorships.flutterwaveTxRef, txRef),
  });

  if (!sponsorship) {
  
    return NextResponse.json({ received: true });
  }


  await db
    .update(sponsorships)
    .set({
      verified: true,
      flutterwaveTransactionId: transactionId,
      verifiedAt: new Date(),
    })
    .where(eq(sponsorships.flutterwaveTxRef, txRef));

  return NextResponse.json({ received: true });
}