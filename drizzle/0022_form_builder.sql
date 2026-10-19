CREATE TABLE "form_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"template" text NOT NULL,
	"recipient" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_test_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"locale" text NOT NULL,
	"recipient" text NOT NULL,
	"definition_snapshot" jsonb NOT NULL,
	"values" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"delivery" text DEFAULT 'skipped' NOT NULL,
	"provider_id" text,
	"delivery_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_test_submission" ADD CONSTRAINT "form_test_submission_form_id_form_definition_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_definition"("id") ON DELETE no action ON UPDATE no action;