import { decryptPayload, isValidEnvelope } from './longCompass/crypto.js'

export const PRIVATE_DOCUMENT_SCHEMA_VERSION = 1

export function parsePrivateDocumentEnvelope(value) {
  let envelope
  try {
    envelope = JSON.parse(String(value || ''))
  } catch {
    throw new Error('PRIVATE_DOCUMENT_ENVELOPE_INVALID')
  }

  if (!isValidEnvelope(envelope)) throw new Error('PRIVATE_DOCUMENT_ENVELOPE_INVALID')
  return envelope
}

export async function decryptPrivateDocumentContent(value, password) {
  const envelope = parsePrivateDocumentEnvelope(value)

  let payload
  try {
    payload = await decryptPayload(envelope, password)
  } catch {
    throw new Error('PRIVATE_DOCUMENT_DECRYPT_FAILED')
  }

  if (
    payload?.schemaVersion !== PRIVATE_DOCUMENT_SCHEMA_VERSION ||
    typeof payload.markdown !== 'string'
  ) {
    throw new Error('PRIVATE_DOCUMENT_PAYLOAD_INVALID')
  }

  return payload.markdown
}

export function normalizePrivateMarkdown(markdown) {
  return String(markdown || '').replace(/<aside>\s*([\s\S]*?)\s*<\/aside>/gi, (_match, body) => {
    const quote = String(body || '').trim().split(/\r?\n/).map((line) => `> ${line}`).join('\n')
    return `\n\n${quote}\n\n`
  })
}
