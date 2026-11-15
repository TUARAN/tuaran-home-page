import day20261106 from './days/2026-11-06.json' with { type: 'json' }
import day20261111 from './days/2026-11-11.json' with { type: 'json' }
import day20261112 from './days/2026-11-12.json' with { type: 'json' }

import { validateDailyTopDay } from './model.js'

const BUNDLED_DAYS = [
  ['2026-11-06.json', day20261106],
  ['2026-11-11.json', day20261111],
  ['2026-11-12.json', day20261112],
]

export function gitDailyTopDays() {
  return BUNDLED_DAYS
    .map(([fileName, day]) => validateDailyTopDay(day, fileName))
    .sort((left, right) => left.date.localeCompare(right.date))
}
