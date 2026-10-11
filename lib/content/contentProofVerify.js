import { CONTENT_PROOF_CLAIMS } from './contentProofClaims.js'
import { hashContent, verifyContentProof } from './contentProof.js'
import { verifyMerkleMembership } from './contentMerkle.js'
import { CONTENT_REPLICA_SCHEMA } from './contentReplica.js'
import { CONTENT_PROOF_REPORT_SCHEMA } from './contentProofSchemas.js'

function checkResult(status, extra = {}) {
  return { status, ...extra }
}

function replicaEntry(replica) {
  return replica?.canonical && typeof replica.canonical === 'object' ? replica.canonical : null
}

function replicaProof(replica) {
  return replica?.proof && typeof replica.proof === 'object' ? replica.proof : null
}

/**
 * Verify a content proof from local objects only. Callers must supply the
 * public key themselves; this function never fetches 2aran.com or a chain RPC.
 */
export async function verifyContentProofBundle({
  entry = null,
  proof = null,
  publicKey = null,
  batch = null,
  replica = null,
  expectedChainId = null,
} = {}) {
  const resolvedProof = proof || replicaProof(replica)
  const resolvedEntry = entry || replicaEntry(replica)
  const errors = []
  const performed = []

  if (!resolvedProof) errors.push('proof_missing')
  if (!resolvedEntry) errors.push('entry_missing')
  if (!publicKey) errors.push('public_key_missing')

  let content = {
    valid: false,
    contentHashMatches: false,
    proofIdMatches: false,
    signatureValid: false,
    errors: errors.length ? [...errors] : ['not_run'],
  }
  let localHash = null

  if (!errors.includes('proof_missing') && !errors.includes('entry_missing') && !errors.includes('public_key_missing')) {
    ;[content, localHash] = await Promise.all([
      verifyContentProof(resolvedEntry, resolvedProof, publicKey),
      hashContent(resolvedEntry),
    ])
    errors.push(...content.errors)
  }

  const contentHash = checkResult(
    content.contentHashMatches ? 'passed' : 'failed',
    { value: localHash || resolvedProof?.contentHash?.value || null },
  )
  const proofId = checkResult(
    content.proofIdMatches ? 'passed' : 'failed',
    { value: resolvedProof?.proofId || null },
  )
  const signature = checkResult(
    content.signatureValid ? 'passed' : 'failed',
    { keyId: resolvedProof?.siteSignature?.keyId || null },
  )
  if (content.contentHashMatches) performed.push('content_integrity')
  if (content.proofIdMatches) performed.push('proof_identity')
  if (content.signatureValid) performed.push('publisher_signature')

  let merkleMembership = checkResult('skipped', { merkleRoot: null, reason: 'no_batch' })
  if (batch) {
    const member = Array.isArray(batch.members)
      ? batch.members.find((item) => item?.proofId === resolvedProof?.proofId)
      : null
    const membershipValid = member ? await verifyMerkleMembership(member, batch.merkleRoot) : false
    merkleMembership = checkResult(membershipValid ? 'passed' : 'failed', {
      merkleRoot: batch.merkleRoot || null,
      memberFound: Boolean(member),
    })
    if (!membershipValid) errors.push('merkle_membership_invalid')
    if (membershipValid) performed.push('merkle_membership')
  }

  let replicaCheck = checkResult('skipped', { reason: 'no_replica' })
  if (replica) {
    const replicaErrors = []
    if (replica.schema !== CONTENT_REPLICA_SCHEMA) replicaErrors.push('replica_schema_mismatch')
    if (replica.proofId !== resolvedProof?.proofId) replicaErrors.push('replica_proof_id_mismatch')
    if (replica.contentHash !== resolvedProof?.contentHash?.value) replicaErrors.push('replica_content_hash_mismatch')
    if (replica.contentKey !== resolvedProof?.contentKey) replicaErrors.push('replica_content_key_mismatch')
    const canonicalHash = replicaEntry(replica) ? await hashContent(replica.canonical) : null
    if (canonicalHash !== resolvedProof?.contentHash?.value) replicaErrors.push('replica_canonical_mismatch')
    replicaCheck = checkResult(replicaErrors.length ? 'failed' : 'passed', {
      errors: replicaErrors,
      contentHash: replica.contentHash || null,
    })
    if (replicaErrors.length) errors.push(...replicaErrors)
  }

  let localAnchor = checkResult('skipped', { reason: 'no_anchor' })
  if (batch?.anchor) {
    const anchorErrors = []
    if (expectedChainId != null && batch.anchor.chainId !== expectedChainId) {
      anchorErrors.push('chain_id_mismatch')
    }
    if (!batch.anchor.transactionHash || !batch.anchor.attestationUid) {
      anchorErrors.push('anchor_incomplete')
    }
    localAnchor = checkResult(anchorErrors.length ? 'failed' : 'passed', {
      chainId: batch.anchor.chainId ?? null,
      transactionHash: batch.anchor.transactionHash || null,
      attestationUid: batch.anchor.attestationUid || null,
      errors: anchorErrors,
      note: 'offline verifier checks local anchor fields only; it does not query chain RPC',
    })
    if (anchorErrors.length) errors.push(...anchorErrors)
  }

  const uniqueErrors = [...new Set(errors)]
  const requiredFailed = [contentHash, proofId, signature].some((item) => item.status !== 'passed')
  const optionalFailed = [merkleMembership, replicaCheck, localAnchor].some((item) => item.status === 'failed')

  return {
    schema: CONTENT_PROOF_REPORT_SCHEMA,
    valid: uniqueErrors.length === 0 && !requiredFailed && !optionalFailed,
    offline: true,
    contentKey: resolvedProof?.contentKey || resolvedEntry?.contentKey || null,
    version: resolvedProof?.version ?? resolvedEntry?.version ?? null,
    checks: {
      contentHash,
      proofId,
      signature,
      merkleMembership,
      replica: replicaCheck,
      localAnchor,
    },
    verified: CONTENT_PROOF_CLAIMS.verifies
      .filter((claim) => performed.includes(claim.id))
      .map((claim) => claim.id),
    notVerified: [
      ...CONTENT_PROOF_CLAIMS.doesNotVerify.map((claim) => ({ id: claim.id, label: claim.label, detail: claim.detail })),
      ...(merkleMembership.status === 'skipped'
        ? [{ id: 'merkle_membership', label: '批次成员关系', detail: '未提供 batch JSON，跳过 Merkle Path 核对。' }]
        : []),
      {
        id: 'live_chain_rpc',
        label: '实时链上查询',
        detail: '离线验证器不访问 RPC。链上 attestation 需用 batch.anchor 中的浏览器链接另行打开。',
      },
    ],
    errors: uniqueErrors,
  }
}
