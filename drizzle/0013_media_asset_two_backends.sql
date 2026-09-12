ALTER TABLE "media_asset" ALTER COLUMN "r2_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "storage" text DEFAULT 'r2' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "stream_uid" text;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "bytes" integer;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "poster_media_id" uuid;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_storage_ck" CHECK (("media_asset"."storage" = 'r2' AND "media_asset"."r2_key" IS NOT NULL) OR ("media_asset"."storage" = 'stream' AND "media_asset"."stream_uid" IS NOT NULL));