import { decryptPayload, isValidEnvelope } from './longCompass/crypto.js'

export const PRIVATE_DOCUMENT_SCHEMA_VERSION = 1

export async function decryptPrivateDocumentContent(value, password) {
  let envelope
  try {
    envelope = JSON.parse(String(value || ''))
  } catch {
    throw new Error('PRIVATE_DOCUMENT_ENVELOPE_INVALID')
  }

  if (!isValidEnvelope(envelope)) throw new Error('PRIVATE_DOCUMENT_ENVELOPE_INVALID')

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
