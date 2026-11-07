CREATE TABLE "service_locale_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"published" jsonb,
	"draft" jsonb,
	"revision" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"draft_saved_at" timestamp with time zone,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_locale_content_entity_locale_unique" UNIQUE("service_id","locale"),
	CONSTRAINT "service_locale_content_locale_ck" CHECK ("service_locale_content"."locale" in ('en','es','pt','fr')),
	CONSTRAINT "service_locale_content_revision_ck" CHECK ("service_locale_content"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "service_shared_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_shared_content_entity_unique" UNIQUE("service_id"),
	CONSTRAINT "service_shared_content_revision_ck" CHECK ("service_shared_content"."revision" >= 0)
);
--> statement-breakpoint
ALTER TABLE "service_locale_content" ADD CONSTRAINT "service_locale_content_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_shared_content" ADD CONSTRAINT "service_shared_content_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;