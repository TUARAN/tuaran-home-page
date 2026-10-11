const CREDENTIAL_PREFIX = 'cred'
export const CREDENTIAL_HASH_ITERATIONS = 210000

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function safeEqualBytes(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

export function createCredentialToken() {
  const publicId = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(9)))
  const secret = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  return `${CREDENTIAL_PREFIX}_${publicId}_${secret}`
}

export function parseCredentialToken(value) {
  const normalized = String(value || '').trim()
  const match = /^cred_([A-Za-z0-9_-]{12})_([A-Za-z0-9_-]{43})$/.exec(normalized)
  if (!match) return null
  return { id: `${CREDENTIAL_PREFIX}_${match[1]}`, secret: match[2], token: normalized }
}

export function createCredentialSalt() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)))
}

export async function hashCredentialSecret(secret, salt, iterations = CREDENTIAL_HASH_ITERATIONS) {
  const count = Number(iterations)
  if (!Number.isInteger(count) || count < 100000 || count > 1000000) {
    throw new Error('INVALID_CREDENTIAL_HASH_ITERATIONS')
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(secret || '')),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64UrlToBytes(salt), iterations: count },
    key,
    256
  )
  return bytesToBase64Url(new Uint8Array(bits))
}

export async function verifyCredentialSecret(secret, salt, expectedHash, iterations) {
  try {
    const actual = base64UrlToBytes(await hashCredentialSecret(secret, salt, iterations))
    const expected = base64UrlToBytes(expectedHash)
    return safeEqualBytes(actual, expected)
  } catch {
    return false
  }
}
