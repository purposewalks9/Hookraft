import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const sponsorships = pgTable("sponsorships", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // "silver" | "gold" | "diamond"
  sponsorId: text("sponsor_id").notNull().unique(), // e.g. HK-A1B2C3
  verified: boolean("verified").notNull().default(false), // ✅ true only after Flutterwave webhook confirms
  flutterwaveTxRef: text("flutterwave_tx_ref"), // tx_ref from Flutterwave, used to match webhook
  flutterwaveTransactionId: text("flutterwave_transaction_id"), // transaction_id from webhook
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"), // when webhook confirmed it
});