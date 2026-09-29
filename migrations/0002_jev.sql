-- Jev (TypeSafe AI) advisory answers as JSON: validated answers + model/rubric metadata, never the
-- submitted state. NULL means "no assessment" (key unset, kill switch, timeout or failure), not a low
-- score. Additive and nullable, so code from before this migration keeps working. Apply before
-- deploying code that references these columns; do not drop them on a code rollback.
ALTER TABLE trade_applications ADD COLUMN jev TEXT;
ALTER TABLE contact_messages ADD COLUMN jev TEXT;
ALTER TABLE reviews ADD COLUMN jev TEXT;
