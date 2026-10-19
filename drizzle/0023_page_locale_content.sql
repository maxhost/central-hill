CREATE TABLE "page_locale_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_key" text NOT NULL,
	"locale" text NOT NULL,
	"published" jsonb,
	"draft" jsonb,
	"revision" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"draft_saved_at" timestamp with time zone,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_locale_content_page_locale_unique" UNIQUE("page_key","locale")
);
