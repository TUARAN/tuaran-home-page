import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { appendPromptFeedbackToLedger } from '../../../../../lib/community/xExtensionPromptFeedback'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const LEDGER = 'docs/specs/x-extension-prompt-feedback.md'
const URL = `https://api.github.com/repos/TUARAN/tuaran-home-page/contents/${LEDGER}`

function reply(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function tokenFromEnvironment() {
  const env = getOptionalRequestContext()?.env || {}
  return String(env.GITHUB_SYNC_TOKEN || env.GITHUB_TOKEN || process.env.GITHUB_SYNC_TOKEN || process.env.GITHUB_TOKEN || '').trim()
}

function decode(content) {
  const binary = atob(String(content || '').replace(/\s+/g, ''))
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
}

function encode(content) {
  const bytes = new TextEncoder().encode(content)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function github(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'tuaran-home-page/prompt-feedback',
    },
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${result?.message || '同步失败'}`)
  return result
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const token = tokenFromEnvironment()
  if (!token) return reply({ ok: false, error: '后台尚未配置 GITHUB_SYNC_TOKEN，先下载 Markdown 交给站长助手同步。' }, 503)

  try {
    const db = getD1()
    const result = await db.prepare(
      `SELECT id, kind, prompt_key, content, assessment, expected, context, source_url, created_at
       FROM x_extension_prompt_feedback WHERE synced_at IS NULL ORDER BY created_at ASC LIMIT 100`,
    ).all()
    const rows = (result.results || []).map((row) => ({
      id: row.id, kind: row.kind, promptKey: row.prompt_key, content: row.content,
      assessment: row.assessment, expected: row.expected, context: row.context,
      sourceUrl: row.source_url, createdAt: row.created_at,
    }))
    if (!rows.length) return reply({ ok: true, synced: 0, remaining: 0 })

    const existing = await github(`${URL}?ref=main`, token)
    const updated = appendPromptFeedbackToLedger(decode(existing.content), rows)
    if (updated.appended.length) {
      await github(URL, token, {
        method: 'PUT',
        body: JSON.stringify({
          message: `[CF-Pages-Skip] docs: sync ${updated.appended.length} X prompt feedback entries`,
          branch: 'main', sha: existing.sha, content: encode(updated.content),
        }),
      })
    }
    const ids = rows.map((row) => row.id)
    const placeholders = ids.map(() => '?').join(', ')
    await db.prepare(`UPDATE x_extension_prompt_feedback SET synced_at = ? WHERE id IN (${placeholders}) AND synced_at IS NULL`)
      .bind(Date.now(), ...ids).run()
    return reply({ ok: true, synced: ids.length, committed: updated.appended.length, remaining: rows.length === 100 ? '可能还有下一批' : 0 })
  } catch (error) {
    return reply({ ok: false, error: String(error?.message || '同步失败').slice(0, 240) }, 503)
  }
}
