import { canonicalizeContent, canonicalizeJson, sha256 } from './contentProof.js'

export const CONTENT_REPLICA_SCHEMA = 'https://2aran.com/schemas/content-replica/v1'
export const DEFAULT_IPFS_GATEWAYS = Object.freeze([
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
])
const CID_RE = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]{50,})$/

export function normalizeCid(value) {
  const cid = String(value || '').trim()
  if (!CID_RE.test(cid)) throw new TypeError('cid must be CIDv0 Qm... or CIDv1 baf...')
  return cid
}

export function replicaGatewayUrl(gateway, cid) {
  const base = String(gateway || '').trim()
  if (!base) throw new TypeError('gateway is required')
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}${normalizeCid(cid)}`
}

export function assertIndependentGateways(gateways = DEFAULT_IPFS_GATEWAYS, { pinProviderHost = '' } = {}) {
  if (!Array.isArray(gateways) || gateways.length < 2) {
    throw new TypeError('dual-gateway readback needs at least two gateways')
  }
  const hosts = gateways.map((gateway) => new URL(gateway).host)
  if (new Set(hosts).size < 2) throw new TypeError('readback gateways must be independent origins')
  if (pinProviderHost && hosts.includes(String(pinProviderHost))) {
    throw new TypeError('readback gateway cannot be the pinning provider')
  }
  return gateways
}

export async function buildContentReplica({ proof, entry } = {}) {
  if (!proof?.proofId || !proof?.contentHash?.value) throw new TypeError('signed proof is required')
  if (proof.contentKey !== entry?.contentKey) throw new TypeError('replica entry contentKey must match the proof')
  if (proof.version !== Number(entry?.version || 1)) throw new TypeError('replica entry version must match the proof')
  const replica = {
    schema: CONTENT_REPLICA_SCHEMA,
    contentKey: proof.contentKey,
    version: proof.version,
    proofId: proof.proofId,
    contentHash: proof.contentHash.value,
    canonical: JSON.parse(canonicalizeContent(entry)),
    proof,
  }
  const payload = `${canonicalizeJson(replica)}\n`
  return {
    payload,
    replica: JSON.parse(payload),
    replicaHash: await sha256(payload),
  }
}

export function createPinataPin({ jwt, fetch = globalThis.fetch, endpoint = 'https://api.pinata.cloud/pinning/pinFileToIPFS' } = {}) {
  if (!jwt) throw new Error('PINATA_JWT is required for IPFS pinning')
  return async ({ bytes, name }) => {
    const body = new FormData()
    body.append('file', new Blob([bytes], { type: 'application/json' }), name || 'replica.json')
    body.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body,
    })
    if (!response.ok) throw new Error(`Pinata pin HTTP ${response.status}`)
    const result = await response.json()
    return { cid: normalizeCid(result.IpfsHash), provider: 'pinata', bytes: Number(result.PinSize) || bytes.length }
  }
}

export async function pinContentReplica(built, { pin, name, existing } = {}) {
  if (!built?.payload || !built.replicaHash) throw new TypeError('built replica is required')
  if (existing?.replicaHash === built.replicaHash && existing?.cid) {
    return { ...existing, cid: normalizeCid(existing.cid), idempotent: true, replicaHash: built.replicaHash }
  }
  if (typeof pin !== 'function') throw new TypeError('pin function is required')
  const bytes = new TextEncoder().encode(built.payload)
  const pinned = await pin({ bytes, name: name || `${built.replica.contentKey}@${built.replica.version}.json` })
  return {
    cid: normalizeCid(pinned.cid),
    provider: pinned.provider || 'ipfs',
    replicaHash: built.replicaHash,
    bytes: pinned.bytes || bytes.length,
    idempotent: false,
  }
}

export async function readReplicaFromGateways(cid, {
  gateways = DEFAULT_IPFS_GATEWAYS,
  fetch = globalThis.fetch,
  expectedHash,
  pinProviderHost = '',
} = {}) {
  const independent = assertIndependentGateways(gateways, { pinProviderHost })
  const normalizedCid = normalizeCid(cid)
  const results = await Promise.all(independent.map(async (gateway) => {
    const url = replicaGatewayUrl(gateway, normalizedCid)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`gateway ${gateway} HTTP ${response.status}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    return { gateway, url, sha256: await sha256(bytes), bytes: bytes.byteLength }
  }))
  const hash = results[0].sha256
  if (results.some((result) => result.sha256 !== hash)) throw new Error('dual-gateway replica bytes do not match')
  if (expectedHash && hash !== expectedHash) throw new Error('gateway replica hash does not match the local replica')
  return { cid: normalizedCid, replicaHash: hash, gateways: results }
}
