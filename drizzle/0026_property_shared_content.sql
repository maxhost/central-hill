CREATE TABLE "apartment_shared_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apartment_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apartment_shared_content_entity_unique" UNIQUE("apartment_id"),
	CONSTRAINT "apartment_shared_content_revision_ck" CHECK ("apartment_shared_content"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "building_shared_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "building_shared_content_entity_unique" UNIQUE("building_id"),
	CONSTRAINT "building_shared_content_revision_ck" CHECK ("building_shared_content"."revision" >= 0)
);
--> statement-breakpoint
ALTER TABLE "apartment_shared_content" ADD CONSTRAINT "apartment_shared_content_apartment_id_apartment_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_shared_content" ADD CONSTRAINT "building_shared_content_building_id_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."building"("id") ON DELETE cascade ON UPDATE no action;