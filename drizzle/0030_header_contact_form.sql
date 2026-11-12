CREATE TABLE "form_public_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "form_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "submission_key" uuid;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "header_contact_form_id" uuid;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_header_contact_form_id_form_definition_id_fk" FOREIGN KEY ("header_contact_form_id") REFERENCES "public"."form_definition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_submission_key_unique" UNIQUE("submission_key");