CREATE TABLE "service_locale_content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_id" uuid NOT NULL REFERENCES "service"("id") ON DELETE CASCADE,
  "locale" text NOT NULL CONSTRAINT "service_locale_content_locale_ck" CHECK ("locale" IN ('en','es','pt','fr')),
  "published" jsonb,
  "draft" jsonb,
  "revision" integer DEFAULT 0 NOT NULL CONSTRAINT "service_locale_content_revision_ck" CHECK ("revision" >= 0),
  "published_at" timestamp with time zone,
  "draft_saved_at" timestamp with time zone,
  "updated_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "service_locale_content_entity_locale_unique" UNIQUE("service_id", "locale")
);
--> statement-breakpoint
CREATE TABLE "service_shared_content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_id" uuid NOT NULL REFERENCES "service"("id") ON DELETE CASCADE,
  "data" jsonb NOT NULL,
  "revision" integer DEFAULT 0 NOT NULL CONSTRAINT "service_shared_content_revision_ck" CHECK ("revision" >= 0),
  "updated_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "service_shared_content_entity_unique" UNIQUE("service_id")
);
