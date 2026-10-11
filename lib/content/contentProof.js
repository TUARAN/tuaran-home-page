const CONTENT_PROOF_SCHEMA = 'https://2aran.com/schemas/content-proof/v1'
const CANONICALIZATION = '2aran-content-json/v1'
const HASH_ALGORITHM = 'SHA-256'
const SIGNATURE_ALGORITHM = 'ECDSA-P256-SHA256'

const encoder = new TextEncoder()

function normalizeUnicode(value) {
  return String(value).normalize('NFC')
}

function normalizeMetadata(value) {
  return normalizeUnicode(value).replace(/\r\n?/g, '\n').trim()
}

function normalizeBody(value) {
  const lines = normalizeUnicode(value)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[\t ]+$/g, ''))

  while (lines[0] === '') lines.shift()
  while (lines.at(-1) === '') lines.pop()
  return lines.length ? `${lines.join('\n')}\n` : ''
}

function normalizeOptionalMetadata(value) {
  if (value == null || value === '') return null
  return normalizeMetadata(value)
}

function normalizePositiveVersion(value) {
  const version = Number(value ?? 1)
  if (!Number.isSafeInteger(version) || version < 1) throw new TypeError('version must be a positive integer')
  return version
}

function normalizeSha256(value, label = 'sha256') {
  const hash = String(value || '').toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new TypeError(`${label} must be a 64-character hexadecimal SHA-256 digest`)
  return hash
}

function stableValue(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('canonical JSON does not support non-finite numbers')
    return Object.is(value, -0) ? 0 : value
  }
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, stableValue(value[key])]),
    )
  }
  throw new TypeError('canonical JSON only supports JSON objects, arrays, and primitive values')
}

/** Stable, UTF-8-ready JSON used by both Node and browsers. */
export function canonicalizeJson(value) {
  return JSON.stringify(stableValue(value))
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function digestBytes(value) {
  return new Uint8Array(await globalThis.crypto.subtle.digest(HASH_ALGORITHM, value))
}

/** SHA-256 for a string or byte array, returned as lowercase hex. */
export async function sha256(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value)
  return bytesToHex(await digestBytes(bytes))
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  return [...new Set(tags.map(normalizeMetadata).filter(Boolean))].sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
}

function normalizeAssets(assets) {
  if (!Array.isArray(assets)) return []
  const normalized = assets.map((asset) => {
    if (!asset || typeof asset !== 'object') throw new TypeError('each asset must be an object')
    const url = normalizeMetadata(asset.url || asset.path || '')
    if (!url) throw new TypeError('each asset needs a url or path')
    const bytes = Number(asset.bytes)
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw new TypeError(`asset ${url} needs a non-negative byte length`)
    return {
      bytes,
      mediaType: normalizeOptionalMetadata(asset.mediaType || asset.contentType),
      sha256: normalizeSha256(asset.sha256, `asset ${url} sha256`),
      url,
    }
  })
  normalized.sort((left, right) => left.url < right.url ? -1 : left.url > right.url ? 1 : 0)
  if (new Set(normalized.map((asset) => asset.url)).size !== normalized.length) throw new TypeError('asset urls must be unique')
  return normalized
}

/**
 * Project a publishable entry onto the v1 content contract. Unknown/internal
 * fields are deliberately excluded so runtime-only data cannot change a hash.
 */
export function canonicalizeContent(entry) {
  if (!entry || typeof entry !== 'object') throw new TypeError('entry must be an object')
  const contentKey = normalizeMetadata(entry.contentKey || '')
  const title = normalizeMetadata(entry.title || '')
  if (!contentKey) throw new TypeError('contentKey is required')
  if (!title) throw new TypeError('title is required')

  return canonicalizeJson({
    assets: normalizeAssets(entry.assets),
    author: normalizeMetadata(entry.author || 'TUARAN'),
    body: normalizeBody(entry.body ?? entry.content ?? ''),
    contentKey,
    date: normalizeOptionalMetadata(entry.date),
    language: normalizeMetadata(entry.language || 'zh-CN'),
    summary: normalizeMetadata(entry.summary || ''),
    tags: normalizeTags(entry.tags),
    title,
    updated: normalizeOptionalMetadata(entry.updated),
    version: normalizePositiveVersion(entry.version),
  })
}

export async function hashContent(entry) {
  return sha256(canonicalizeContent(entry))
}

/** Build a sorted asset manifest from supplied bytes or existing digests. */
export async function buildAssetManifest(assets = []) {
  const manifest = await Promise.all(assets.map(async (asset) => {
    if (asset?.data == null) return asset
    const data = typeof asset.data === 'string' ? encoder.encode(asset.data) : new Uint8Array(asset.data)
    return { ...asset, bytes: data.byteLength, sha256: await sha256(data), data: undefined }
  }))
  return normalizeAssets(manifest)
}

function unsignedProof(proof) {
  return {
    assets: normalizeAssets(proof.assets),
    canonicalization: proof.canonicalization,
    contentHash: proof.contentHash,
    contentKey: proof.contentKey,
    previousProofId: proof.previousProofId ?? null,
    publishedAt: proof.publishedAt,
    schema: proof.schema,
    version: proof.version,
  }
}

function assertP256Jwk(jwk, usage) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new TypeError(`${usage} key must be a P-256 EC JWK`)
  }
  if (usage === 'private' && !jwk.d) throw new TypeError('private key JWK must include d')
}

export async function getSiteKeyId(publicKeyJwk) {
  assertP256Jwk(publicKeyJwk, 'public')
  const thumbprint = canonicalizeJson({ crv: publicKeyJwk.crv, kty: publicKeyJwk.kty, x: publicKeyJwk.x, y: publicKeyJwk.y })
  return bytesToBase64Url(await digestBytes(encoder.encode(thumbprint)))
}

export async function generateSiteKeyPair() {
  const pair = await globalThis.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  return {
    privateKeyJwk: await globalThis.crypto.subtle.exportKey('jwk', pair.privateKey),
    publicKeyJwk: await globalThis.crypto.subtle.exportKey('jwk', pair.publicKey),
  }
}

export async function buildContentProof(entry, { privateKeyJwk, publishedAt, previousProofId = null } = {}) {
  assertP256Jwk(privateKeyJwk, 'private')
  const timestamp = new Date(publishedAt)
  if (!publishedAt || Number.isNaN(timestamp.valueOf()) || timestamp.toISOString() !== publishedAt) {
    throw new TypeError('publishedAt must be a canonical UTC ISO timestamp')
  }
  const publicKeyJwk = { crv: privateKeyJwk.crv, ext: true, key_ops: ['verify'], kty: privateKeyJwk.kty, x: privateKeyJwk.x, y: privateKeyJwk.y }
  const base = {
    assets: normalizeAssets(entry.assets),
    canonicalization: CANONICALIZATION,
    contentHash: { algorithm: HASH_ALGORITHM, value: await hashContent(entry) },
    contentKey: normalizeMetadata(entry.contentKey),
    previousProofId: previousProofId ? normalizeSha256(previousProofId, 'previousProofId') : null,
    publishedAt,
    schema: CONTENT_PROOF_SCHEMA,
    version: normalizePositiveVersion(entry.version),
  }
  const payload = canonicalizeJson(base)
  const proofId = await sha256(payload)
  const privateKey = await globalThis.crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const signature = new Uint8Array(await globalThis.crypto.subtle.sign({ name: 'ECDSA', hash: HASH_ALGORITHM }, privateKey, encoder.encode(payload)))
  return {
    ...base,
    proofId,
    siteSignature: {
      algorithm: SIGNATURE_ALGORITHM,
      keyId: await getSiteKeyId(publicKeyJwk),
      value: bytesToBase64Url(signature),
    },
  }
}

/** Verify content, proof identity, and the site's signature without network access. */
export async function verifyContentProof(entry, proof, publicKeyJwk) {
  const errors = []
  let contentHashMatches = false
  let proofIdMatches = false
  let signatureValid = false
  try {
    if (proof?.schema !== CONTENT_PROOF_SCHEMA) errors.push('unsupported_schema')
    if (proof?.canonicalization !== CANONICALIZATION) errors.push('unsupported_canonicalization')
    if (proof?.contentKey !== normalizeMetadata(entry?.contentKey || '')) errors.push('content_key_mismatch')
    if (proof?.version !== normalizePositiveVersion(entry?.version)) errors.push('version_mismatch')
    contentHashMatches = proof?.contentHash?.algorithm === HASH_ALGORITHM
      && proof.contentHash.value === await hashContent(entry)
    if (!contentHashMatches) errors.push('content_hash_mismatch')

    const payload = canonicalizeJson(unsignedProof(proof))
    proofIdMatches = proof.proofId === await sha256(payload)
    if (!proofIdMatches) errors.push('proof_id_mismatch')

    assertP256Jwk(publicKeyJwk, 'public')
    const keyIdMatches = proof?.siteSignature?.keyId === await getSiteKeyId(publicKeyJwk)
    if (!keyIdMatches) errors.push('site_key_mismatch')
    if (proof?.siteSignature?.algorithm !== SIGNATURE_ALGORITHM) errors.push('signature_algorithm_mismatch')
    if (keyIdMatches && proof?.siteSignature?.algorithm === SIGNATURE_ALGORITHM) {
      const publicKey = await globalThis.crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
      signatureValid = await globalThis.crypto.subtle.verify(
        { name: 'ECDSA', hash: HASH_ALGORITHM },
        publicKey,
        base64UrlToBytes(proof.siteSignature.value),
        encoder.encode(payload),
      )
    }
    if (!signatureValid) errors.push('signature_invalid')
  } catch {
    errors.push('malformed_proof')
  }
  return { valid: errors.length === 0, contentHashMatches, proofIdMatches, signatureValid, errors: [...new Set(errors)] }
}

export const CONTENT_PROOF_CONSTANTS = Object.freeze({
  CANONICALIZATION,
  HASH_ALGORITHM,
  SCHEMA: CONTENT_PROOF_SCHEMA,
  SIGNATURE_ALGORITHM,
})
