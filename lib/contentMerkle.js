import { canonicalizeJson, sha256 } from './contentProof.js'

const BATCH_SCHEMA = 'https://2aran.com/schemas/content-proof-batch/v1'
const MERKLE_ALGORITHM = 'SHA-256 domain-separated binary tree/v1'
const HEX_64 = /^[a-f0-9]{64}$/
const encoder = new TextEncoder()

function hexToBytes(value, label) {
  const normalized = String(value || '').replace(/^0x/, '').toLowerCase()
  if (!HEX_64.test(normalized)) throw new TypeError(`${label} must be a 32-byte hexadecimal digest`)
  return Uint8Array.from(normalized.match(/.{2}/g), (pair) => Number.parseInt(pair, 16))
}

function concatBytes(...values) {
  const result = new Uint8Array(values.reduce((total, value) => total + value.length, 0))
  let offset = 0
  for (const value of values) {
    result.set(value, offset)
    offset += value.length
  }
  return result
}

async function hashLeaf(proofId) {
  return sha256(concatBytes(Uint8Array.of(0), hexToBytes(proofId, 'proofId')))
}

async function hashPair(left, right) {
  return sha256(concatBytes(Uint8Array.of(1), hexToBytes(left, 'left node'), hexToBytes(right, 'right node')))
}

function normalizeTimestamp(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.valueOf()) || date.toISOString() !== value) {
    throw new TypeError('generatedAt must be a canonical UTC ISO timestamp')
  }
  return value
}

function normalizeProof(proof) {
  const contentKey = String(proof?.contentKey || '').trim()
  const version = Number(proof?.version)
  const proofId = String(proof?.proofId || '').toLowerCase()
  if (!contentKey) throw new TypeError('each proof needs a contentKey')
  if (!Number.isSafeInteger(version) || version < 1) throw new TypeError(`proof ${contentKey} needs a positive version`)
  if (!HEX_64.test(proofId)) throw new TypeError(`proof ${contentKey} needs a valid proofId`)
  return { contentKey, proofId, version }
}

function manifestMembers(members) {
  return members.map(({ contentKey, leaf, proofId, version }) => ({ contentKey, leaf, proofId, version }))
}

/** Build a deterministic Merkle batch. Odd nodes are duplicated at each level. */
export async function buildContentMerkleBatch(proofs, { generatedAt, previousRoot = null, manifestUri = null } = {}) {
  if (!Array.isArray(proofs) || proofs.length === 0) throw new TypeError('proofs must be a non-empty array')
  const normalized = proofs.map(normalizeProof).sort((left, right) => {
    const identity = left.contentKey.localeCompare(right.contentKey, 'en')
    return identity || left.version - right.version || left.proofId.localeCompare(right.proofId, 'en')
  })
  const identities = normalized.map(({ contentKey, version }) => `${contentKey}@${version}`)
  if (new Set(identities).size !== identities.length) throw new TypeError('a batch cannot contain duplicate contentKey + version identities')

  const members = await Promise.all(normalized.map(async (proof) => ({ ...proof, leaf: await hashLeaf(proof.proofId), merklePath: [] })))
  let level = members.map((member, index) => ({ hash: member.leaf, indexes: [index] }))

  while (level.length > 1) {
    const next = []
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index]
      const right = level[index + 1] || left
      for (const memberIndex of left.indexes) members[memberIndex].merklePath.push({ hash: right.hash, position: 'right' })
      if (right !== left) {
        for (const memberIndex of right.indexes) members[memberIndex].merklePath.push({ hash: left.hash, position: 'left' })
      }
      next.push({ hash: await hashPair(left.hash, right.hash), indexes: [...left.indexes, ...(right === left ? [] : right.indexes)] })
    }
    level = next
  }

  const normalizedPreviousRoot = previousRoot == null ? null : String(previousRoot).replace(/^0x/, '').toLowerCase()
  if (normalizedPreviousRoot != null && !HEX_64.test(normalizedPreviousRoot)) throw new TypeError('previousRoot must be a 32-byte hexadecimal digest')
  const normalizedManifestUri = manifestUri == null ? null : String(manifestUri).trim() || null
  const manifestHash = await sha256(encoder.encode(canonicalizeJson(manifestMembers(members))))

  return {
    schema: BATCH_SCHEMA,
    algorithm: MERKLE_ALGORITHM,
    generatedAt: normalizeTimestamp(generatedAt),
    count: members.length,
    merkleRoot: level[0].hash,
    manifestHash,
    manifestUri: normalizedManifestUri,
    previousRoot: normalizedPreviousRoot,
    members,
    anchor: null,
  }
}

export async function verifyMerkleMembership(member, merkleRoot) {
  try {
    let hash = await hashLeaf(member?.proofId)
    if (member?.leaf !== hash || !Array.isArray(member?.merklePath)) return false
    for (const step of member.merklePath) {
      if (step?.position === 'left') hash = await hashPair(step.hash, hash)
      else if (step?.position === 'right') hash = await hashPair(hash, step.hash)
      else return false
    }
    return hash === String(merkleRoot || '').replace(/^0x/, '').toLowerCase()
  } catch {
    return false
  }
}

export async function verifyContentMerkleBatch(batch) {
  if (batch?.schema !== BATCH_SCHEMA || batch?.algorithm !== MERKLE_ALGORITHM) return false
  if (batch?.count !== batch?.members?.length || batch.count < 1) return false
  const manifestHash = await sha256(encoder.encode(canonicalizeJson(manifestMembers(batch.members))))
  if (manifestHash !== batch.manifestHash) return false
  const results = await Promise.all(batch.members.map((member) => verifyMerkleMembership(member, batch.merkleRoot)))
  return results.every(Boolean)
}

export const CONTENT_MERKLE_CONSTANTS = Object.freeze({
  ALGORITHM: MERKLE_ALGORITHM,
  BATCH_SCHEMA,
})
