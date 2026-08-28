-- Apply only after the WorkBuddy article deployment is available.
-- Replace the OpenClaw PR pin; preserve other pins and recommendation settings.
UPDATE site_settings AS settings
SET value = json_set(settings.value, '$.pinnedIds', json((
  SELECT json_group_array(id)
  FROM (
    SELECT 'research:topics:workbuddy-tutorial-resources' AS id, -1 AS position
    UNION ALL
    SELECT pins.value AS id, CAST(pins.key AS INTEGER) AS position
    FROM json_each(settings.value, '$.pinnedIds') AS pins
    WHERE pins.value NOT IN (
      'column:openclaw-pr-anthropic-image-normalization',
      'research:topics:workbuddy-tutorial-resources'
    )
    ORDER BY position
    LIMIT 18
  )
))),
updated_at = strftime('%s', 'now') * 1000,
updated_by = 'migration:0083_workbuddy_home_pin'
WHERE key = 'recommendations.home' AND json_valid(settings.value);
