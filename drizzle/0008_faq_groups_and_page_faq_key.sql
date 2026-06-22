-- FAQ groups become editable + page-selectable (slice `pages` ↔ slice `faq`).
-- 1) Seed the two FAQ groups that the static pages used to hard-code (Owners + Real Estate),
--    each with its original 7 Q&A authored in the source locale `en`. HTML entities are decoded
--    (the FaqSection renders text, not markup). Dollar-quoted (`$q$…$q$`) so apostrophes need no
--    escaping. Guarded by NOT EXISTS on the group key → idempotent / re-runnable.
-- 2) Bind each page to its group via the new `page_content.data.faq_group_key`; the other pages
--    get an explicit empty value (= no FAQ) so the editor opens with the field populated.
DO $$
DECLARE gid uuid; iid uuid;
BEGIN
  -- ── OWNERS ───────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM faq_group WHERE key = 'owners') THEN
    INSERT INTO faq_group (key, position) VALUES ('owners', 0) RETURNING id INTO gid;

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 0, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$What types of properties does Central Hill Apartments manage?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$We manage all property types across Portugal, from compact studios to large 8-bedroom apartments accommodating up to 27 guests. Whether you own a single apartment or a growing portfolio, we have the right plan for you.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 1, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$How does your pricing and commission work?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$We operate on a commission model — we earn when you earn. Your personalized proposal includes a full, transparent breakdown of all fees and platform commissions with no hidden costs.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 2, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$Do I need to be in Portugal to work with Central Hill Apartments?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Not at all. Many of our owners are based overseas. Our fully remote management model means you can monitor your property and receive your earnings from anywhere in the world.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 3, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$How quickly can my property be listed?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Most properties are live within 5 business days of completing onboarding. This includes professional photography, listing creation, and platform setup.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 4, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$What happens if there is damage to my property?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$We conduct check-out inspections after every stay. All bookings are covered by platform guarantee schemes, and our team handles any damage claims directly on your behalf.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 5, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$Can I block dates for personal use?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Absolutely. Your property remains yours. You can block any dates through your owner dashboard at any time, with no restrictions or extra charges.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 6, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$Do you handle legal and tax compliance?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Yes. We provide guidance on Alojamento Local licensing, AIMA registration requirements, and local tax obligations specific to Portugal.$q$, 'approved');
  END IF;

  -- ── REAL ESTATE ──────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM faq_group WHERE key = 'real_estate') THEN
    INSERT INTO faq_group (key, position) VALUES ('real_estate', 1) RETURNING id INTO gid;

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 0, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$What minimum scale of asset do you work with?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$We work with individual buildings through to multi-property portfolios. There is no minimum unit count for institutional partnerships, though our management fee structures are most efficient for assets with 5 or more units. We are also able to discuss portfolio-level agreements covering multiple buildings or locations.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 1, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$What contract terms do you offer?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Contract terms vary by partnership model. Fixed rent agreements typically run for 10–25 years. Management commission agreements are available from 3 years, with renewal options. Hybrid structures typically mirror fixed rent terms. All contracts include clearly defined performance review milestones and exit provisions.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 2, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$How is financial reporting structured for institutional partners?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$We provide monthly financial reports in a format agreed at contract stage — including gross revenue, management fees, net owner proceeds, occupancy rates, average daily rate (ADR), and RevPAR. Partners also have real-time access to their asset's performance dashboard. Bespoke reporting formats for fund administrators and asset managers can be accommodated.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 3, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$How do you handle regulatory compliance?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Central Hill manages all Alojamento Local licensing, AIMA registration, tourist tax calculation and payment, and local regulatory requirements on behalf of our partners. We monitor regulatory developments proactively and notify partners of any material changes affecting their asset.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 4, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$Can you manage assets we are currently developing or acquiring?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Yes. We offer pre-opening consultancy services to developers and acquiring funds, including unit mix advice, interior design direction, FF&E specification, licensing pre-registration, platform setup, and full operational launch. Engaging us at the planning stage typically results in faster time-to-revenue and higher initial occupancy rates.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 5, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$What performance guarantees do you offer?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Under our fixed rent model, income is fully guaranteed regardless of occupancy. Under our management commission and hybrid models, we agree performance KPIs at contract stage and report transparently against them monthly. While market performance is inherently variable, our track record demonstrates consistent above-market outcomes across our managed portfolio.$q$, 'approved');

    INSERT INTO faq_item (group_id, position, status) VALUES (gid, 6, 'published') RETURNING id INTO iid;
    INSERT INTO translation (entity_type, entity_id, field, locale, value, state) VALUES
      ('faq_item', iid, 'question', 'en', $q$Do you work with international partners and funds?$q$, 'approved'),
      ('faq_item', iid, 'answer',   'en', $q$Yes. A significant proportion of our institutional partners are based outside Portugal. We provide all reporting in English, accommodate different time zones for review meetings, and our legal and commercial documentation is available in English. We work with advisors and legal counsel in multiple jurisdictions.$q$, 'approved');
  END IF;
END $$;

-- Bind the pages to their FAQ groups; the rest get an explicit empty value (= no FAQ shown).
UPDATE "page_content" SET "data" = jsonb_set("data", '{faq_group_key}', '"owners"'::jsonb, true)      WHERE "key" = 'owners';
UPDATE "page_content" SET "data" = jsonb_set("data", '{faq_group_key}', '"real_estate"'::jsonb, true) WHERE "key" = 'real_estate';
UPDATE "page_content" SET "data" = jsonb_set("data", '{faq_group_key}', '""'::jsonb, true)
  WHERE "key" IN ('home', 'guest', 'about') AND NOT ("data" ? 'faq_group_key');
