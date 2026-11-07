CREATE TABLE "building_locale_content" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "building_id" uuid NOT NULL, "locale" text NOT NULL,
 "published" jsonb, "draft" jsonb, "revision" integer DEFAULT 0 NOT NULL,
 "published_at" timestamp with time zone, "draft_saved_at" timestamp with time zone,
 "updated_by" text, "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "building_locale_content_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "building"("id") ON DELETE CASCADE,
 CONSTRAINT "building_locale_content_entity_locale_unique" UNIQUE ("building_id","locale"),
 CONSTRAINT "building_locale_content_locale_ck" CHECK ("locale" IN ('en','es','pt','fr')),
 CONSTRAINT "building_locale_content_revision_ck" CHECK ("revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "apartment_locale_content" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "apartment_id" uuid NOT NULL, "locale" text NOT NULL,
 "published" jsonb, "draft" jsonb, "revision" integer DEFAULT 0 NOT NULL,
 "published_at" timestamp with time zone, "draft_saved_at" timestamp with time zone,
 "updated_by" text, "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "apartment_locale_content_apartment_id_apartment_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "apartment"("id") ON DELETE CASCADE,
 CONSTRAINT "apartment_locale_content_entity_locale_unique" UNIQUE ("apartment_id","locale"),
 CONSTRAINT "apartment_locale_content_locale_ck" CHECK ("locale" IN ('en','es','pt','fr')),
 CONSTRAINT "apartment_locale_content_revision_ck" CHECK ("revision" >= 0)
);
