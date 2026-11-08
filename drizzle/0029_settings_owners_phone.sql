-- User-supplied Owners phone, independent of bookings/check-in/WhatsApp.
-- Nullable so an explicit clear can hide its footer row. The default initializes
-- only this new field; no existing contact column is changed.
ALTER TABLE "company_settings" ADD COLUMN "owners_phone" text DEFAULT '+351 910 438 062';
