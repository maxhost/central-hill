CREATE TABLE "guide_locale_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guide_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"published" jsonb,
	"draft" jsonb,
	"revision" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"draft_saved_at" timestamp with time zone,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guide_locale_content_entity_locale_unique" UNIQUE("guide_id","locale"),
	CONSTRAINT "guide_locale_content_locale_ck" CHECK ("guide_locale_content"."locale" in ('en','es','pt','fr')),
	CONSTRAINT "guide_locale_content_revision_ck" CHECK ("guide_locale_content"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "guide_shared_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guide_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guide_shared_content_entity_unique" UNIQUE("guide_id"),
	CONSTRAINT "guide_shared_content_revision_ck" CHECK ("guide_shared_content"."revision" >= 0)
);
--> statement-breakpoint
ALTER TABLE "guide_locale_content" ADD CONSTRAINT "guide_locale_content_guide_id_guide_page_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guide_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide_shared_content" ADD CONSTRAINT "guide_shared_content_guide_id_guide_page_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guide_page"("id") ON DELETE cascade ON UPDATE no action;