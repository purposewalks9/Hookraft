CREATE TABLE "sponsorships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" text NOT NULL,
	"sponsor_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sponsorships_sponsor_id_unique" UNIQUE("sponsor_id")
);
--> statement-breakpoint
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;