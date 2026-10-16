-- Slice `settings`: the About office panel's check-in phone and website move from code literals
-- to company_settings (spec docs/specs/about-admin-editor.md, S3). Both nullable: a blank value
-- hides its row on /about. Additive; the UPDATE seeds the values the page shows today.
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "checkin_phone" text;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN IF NOT EXISTS "website_url" text;--> statement-breakpoint
UPDATE "company_settings"
SET "checkin_phone" = COALESCE("checkin_phone", '+351 912 310 632'),
    "website_url" = COALESCE("website_url", 'https://www.centralhill.pt');
