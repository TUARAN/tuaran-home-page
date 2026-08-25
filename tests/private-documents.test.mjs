import assert from 'node:assert/strict'
import test from 'node:test'

import { encryptPayload } from '../lib/longCompass/crypto.js'
import { decryptPrivateDocumentContent, parsePrivateDocumentEnvelope } from '../lib/privateDocuments.js'

test('private document content round-trips through an encrypted envelope', async () => {
  const password = 'test-only-password'
  const envelope = await encryptPayload(
    { schemaVersion: 1, markdown: '# private\n\nbody' },
    password
  )

  assert.equal(
    await decryptPrivateDocumentContent(JSON.stringify(envelope), password),
    '# private\n\nbody'
  )
  assert.deepEqual(parsePrivateDocumentEnvelope(JSON.stringify(envelope)), envelope)
  await assert.rejects(
    decryptPrivateDocumentContent(JSON.stringify(envelope), 'wrong-password'),
    /PRIVATE_DOCUMENT_DECRYPT_FAILED/
  )
})

test('private document content rejects plaintext and malformed payloads', async () => {
  await assert.rejects(
    decryptPrivateDocumentContent('plaintext is forbidden', 'password'),
    /PRIVATE_DOCUMENT_ENVELOPE_INVALID/
  )

  const envelope = await encryptPayload({ schemaVersion: 1, content: 'wrong field' }, 'password')
  await assert.rejects(
    decryptPrivateDocumentContent(JSON.stringify(envelope), 'password'),
    /PRIVATE_DOCUMENT_PAYLOAD_INVALID/
  )
})
