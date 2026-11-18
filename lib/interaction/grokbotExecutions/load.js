import records from './records.json' with { type: 'json' }

import { validateGrokbotExecutions } from './model.js'

export function loadGrokbotExecutions() {
  return validateGrokbotExecutions(records, 'records.json')
}
