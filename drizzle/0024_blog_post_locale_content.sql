CREATE TABLE "blog_post_locale_content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL REFERENCES "blog_post"("id") ON DELETE CASCADE,
  "locale" text NOT NULL CHECK ("locale" IN ('en','es','pt','fr')),
  "published" jsonb,
  "draft" jsonb,
  "revision" integer DEFAULT 0 NOT NULL CHECK ("revision" >= 0),
  "published_at" timestamp with time zone,
  "draft_saved_at" timestamp with time zone,
  "updated_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "blog_post_locale_content_post_locale_unique" UNIQUE("post_id", "locale")
);
