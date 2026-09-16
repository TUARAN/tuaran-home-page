-- Keep compact list previews beside the original R2 objects.
-- Existing rows intentionally fall back to placeholders until re-uploaded.
ALTER TABLE x_image_pool ADD COLUMN thumbnail_object_key TEXT NOT NULL DEFAULT '';
