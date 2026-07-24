function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hmac(secret, value) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(value || '')))
  return bytesToBase64Url(new Uint8Array(signature))
}

function constantTimeEqual(left, right) {
  const a = String(left || '')
  const b = String(right || '')
  const length = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let index = 0; index < length; index += 1) {
    diff |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0)
  }
  return diff === 0
}

function signaturePayload(purpose, jobId, kind, expires) {
  return [purpose, String(jobId || ''), String(kind || ''), String(expires || '')].join(':')
}

export async function createDigitalHumanSignature(secret, {
  purpose,
  jobId,
  kind = '',
  expires,
}) {
  return hmac(secret, signaturePayload(purpose, jobId, kind, expires))
}

export async function verifyDigitalHumanSignature(secret, {
  purpose,
  jobId,
  kind = '',
  expires,
  signature,
  now = Date.now(),
}) {
  const expiry = Number(expires)
  if (!Number.isFinite(expiry) || expiry < now || expiry > now + 2 * 24 * 60 * 60 * 1000) {
    return false
  }
  const expected = await createDigitalHumanSignature(secret, {
    purpose,
    jobId,
    kind,
    expires: expiry,
  })
  return constantTimeEqual(expected, signature)
}

export async function createSignedDigitalHumanUrl(baseUrl, path, secret, options) {
  const signature = await createDigitalHumanSignature(secret, options)
  const url = new URL(path, baseUrl)
  url.searchParams.set('expires', String(options.expires))
  url.searchParams.set('signature', signature)
  return url.toString()
}
