import day20261105 from './days/2026-11-05.json' with { type: 'json' }
import day20261110 from './days/2026-11-10.json' with { type: 'json' }
import day20261111 from './days/2026-11-11.json' with { type: 'json' }

import { validateDailyTopDay } from './model.js'

const BUNDLED_DAYS = [
  ['2026-11-05.json', day20261105],
  ['2026-11-10.json', day20261110],
  ['2026-11-11.json', day20261111],
]

export function gitDailyTopDays() {
  return BUNDLED_DAYS
    .map(([fileName, day]) => validateDailyTopDay(day, fileName))
    .sort((left, right) => left.date.localeCompare(right.date))
}
