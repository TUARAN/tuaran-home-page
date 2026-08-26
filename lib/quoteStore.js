export const QUOTE_SELECT_COLUMNS = `
  id, text, author, source, source_url, enabled, sort_order,
  generation_prompt, generation_trigger, generation_model,
  created_at, updated_at
`

export function quoteRowToJson(row) {
  if (!row) return null
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    source: row.source || '',
    sourceUrl: row.source_url || '',
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order) || 0,
    generationPrompt: row.generation_prompt || '',
    generationTrigger: row.generation_trigger || 'manual',
    generationModel: row.generation_model || '',
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

export async function insertGeneratedQuote(db, generated, {
  prompt = '',
  trigger = 'manual',
  model = '',
} = {}) {
  const id = crypto.randomUUID()
  const now = Date.now()
  await db.prepare(
    `INSERT INTO famous_quotes
     (id, text, author, source, source_url, enabled, sort_order,
      generation_prompt, generation_trigger, generation_model, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    generated.text,
    'TUARAN',
    '大模型生成',
    '',
    String(prompt || '').trim().slice(0, 500),
    trigger,
    model,
    now,
    now,
  ).run()

  return quoteRowToJson({
    id,
    text: generated.text,
    author: 'TUARAN',
    source: '大模型生成',
    source_url: '',
    enabled: 1,
    sort_order: 0,
    generation_prompt: prompt,
    generation_trigger: trigger,
    generation_model: model,
    created_at: now,
    updated_at: now,
  })
}
