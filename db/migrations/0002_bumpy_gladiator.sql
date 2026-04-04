ALTER TABLE "sponsorships" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD COLUMN "flutterwave_tx_ref" text;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD COLUMN "flutterwave_transaction_id" text;--> statement-breakpoint
ALTER TABLE "sponsorships" ADD COLUMN "verified_at" timestamp;