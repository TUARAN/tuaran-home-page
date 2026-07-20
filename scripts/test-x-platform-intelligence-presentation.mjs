import assert from 'node:assert/strict'

import {
  confidenceLabel,
  formatMetricValue,
  formatPeriod,
  geographyLabel,
  segmentLabel,
} from '../app/(site)/x-platform-intelligence/presentation.mjs'

assert.equal(formatMetricValue({ valueType: 'exact', value: 600000000, unit: 'people' }), '600,000,000 人')
assert.equal(formatMetricValue({ valueType: 'range', valueMin: 313000000, valueMax: 600000000, unit: 'people' }), '313,000,000–600,000,000 人')
assert.equal(formatMetricValue({ valueType: 'percentage', value: 36.3, unit: 'percent' }), '36.3%')
assert.equal(formatMetricValue({ valueType: 'exact', value: 6, unit: 'minutes' }), '6 分钟')
assert.equal(formatMetricValue({ valueType: 'exact', value: 1000, unit: 'posts' }), '1,000 条')
assert.equal(formatPeriod('2025-01-01', '2025-01-01'), '2025-01-01')
assert.equal(formatPeriod('2025-01-01', '2025-01-31'), '2025-01-01 — 2025-01-31')
assert.equal(confidenceLabel('high'), '高置信')
assert.equal(geographyLabel('us'), '美国')
assert.equal(segmentLabel('age-18-29'), '18–29 岁')

console.log('[x-intelligence:presentation] all assertions passed')
