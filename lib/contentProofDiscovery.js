import { CONTENT_PROOF_CLAIMS } from './contentProofClaims.js'
import { contentProofHref, listContentProofCredentials } from './contentProofRegistry.js'
import { CONTENT_PROOF_DISCOVERY_SCHEMA } from './contentProofSchemas.js'

const SITE_URL = 'https://2aran.com'
const GITHUB_REPO = 'https://github.com/TUARAN/tuaran-home-page'
const VERIFIER_PATH = 'tools/content-proof-verifier'

export function proofAbsoluteUrl(path) {
  if (!path) return null
  if (String(path).startsWith('http')) return path
  return `${SITE_URL}${path}`
}

export function listContentProofDiscoveryEntries(credentials = listContentProofCredentials()) {
  return credentials.map((credential) => {
    const current = credential.versions.find((version) => version.version === credential.currentVersion) || credential.versions[0]
    const cid = credential.replica?.cid || null
    return {
      contentKey: credential.contentKey,
      title: credential.title,
      proofPageUrl: proofAbsoluteUrl(contentProofHref(credential.contentKey)),
      proofJsonUrl: proofAbsoluteUrl(credential.proofUrl),
      replicaUrl: proofAbsoluteUrl(credential.replica?.replicaUrl),
      ipfsUri: cid ? `ipfs://${cid}` : null,
      publishedAt: current?.publishedAt || null,
      status: credential.status,
    }
  })
}

export function listContentProofRssEntries(credentials = listContentProofCredentials()) {
  return listContentProofDiscoveryEntries(credentials).map((entry) => {
    const details = [entry.proofJsonUrl, entry.replicaUrl, entry.ipfsUri].filter(Boolean).join(' · ')
    return {
      title: `${entry.title}｜内容凭证`,
      link: entry.proofPageUrl,
      description: `内容凭证：${details}`,
      publishedAt: entry.publishedAt,
      category: '内容凭证',
      guid: `urn:2aran:rss:proof:${encodeURIComponent(entry.contentKey)}`,
      ctaLabel: '打开内容凭证',
    }
  })
}

export function getContentProofDiscoveryDocument(credentials = listContentProofCredentials()) {
  const proofs = listContentProofDiscoveryEntries(credentials)
  return {
    schema: CONTENT_PROOF_DISCOVERY_SCHEMA,
    protocol: '2aran-content-proof',
    version: 1,
    publisher: 'TUARAN',
    site: SITE_URL,
    publicKey: {
      url: `${SITE_URL}/.well-known/content-proof-key.json`,
      algorithm: 'ECDSA-P256-SHA256',
      pinIndependently: true,
      note: 'Pin this JWK from a trusted channel. A key that exists only inside a downloaded proof does not prove publisher identity.',
    },
    discovery: {
      humanGuide: `${SITE_URL}/onchain-blog`,
      agentGuide: `${SITE_URL}/verify.txt`,
      wellKnown: `${SITE_URL}/.well-known/content-proof.json`,
      proofIndex: `${SITE_URL}/proofs.xml`,
      llms: `${SITE_URL}/llms.txt`,
      schemas: {
        proof: 'https://2aran.com/schemas/content-proof/v1',
        batch: 'https://2aran.com/schemas/content-proof-batch/v1',
        replica: 'https://2aran.com/schemas/content-replica/v1',
        report: 'https://2aran.com/schemas/content-proof-report/v1',
      },
    },
    verifier: {
      offline: true,
      repository: GITHUB_REPO,
      path: VERIFIER_PATH,
      command: `node ${VERIFIER_PATH}/cli.mjs --replica replica.json --public-key site-public.jwk.json --batch batch.json`,
      requires: ['Node.js 18+ with Web Crypto', 'locally pinned P-256 public JWK', 'proof or replica JSON'],
      doesNotFetch: ['https://2aran.com'],
    },
    claims: {
      verifies: CONTENT_PROOF_CLAIMS.verifies.map((claim) => ({ id: claim.id, label: claim.label, detail: claim.detail })),
      doesNotVerify: CONTENT_PROOF_CLAIMS.doesNotVerify.map((claim) => ({ id: claim.id, label: claim.label, detail: claim.detail })),
    },
    proofs,
  }
}

export function renderContentProofAgentGuide(document = getContentProofDiscoveryDocument()) {
  const lines = [
    '# 2aran Content Proof',
    '',
    'Machine-readable protocol for verifying 2aran.com public content without a wallet and without trusting the live website at verification time.',
    '',
    '## What a passing result means',
    ...document.claims.verifies.map((claim) => `- ${claim.id}: ${claim.detail}`),
    '',
    '## What a passing result does not mean',
    ...document.claims.doesNotVerify.map((claim) => `- ${claim.id}: ${claim.detail}`),
    '',
    '## Discovery',
    `- well-known: ${document.discovery.wellKnown}`,
    `- human guide: ${document.discovery.humanGuide}`,
    `- proof index: ${document.discovery.proofIndex}`,
    `- llms.txt: ${document.discovery.llms}`,
    `- public key: ${document.publicKey.url}`,
    `- proof schema: ${document.discovery.schemas.proof}`,
    `- batch schema: ${document.discovery.schemas.batch}`,
    `- replica schema: ${document.discovery.schemas.replica}`,
    '',
    '## Offline verifier',
    'Pin the publisher public key independently, then run the open-source CLI against local files. The CLI does not fetch 2aran.com.',
    '',
    `Repository: ${document.verifier.repository}`,
    `Path: ${document.verifier.path}`,
    '',
    '```',
    document.verifier.command,
    '```',
    '',
    'Required inputs: replica JSON or (entry JSON + proof JSON), plus the pinned public JWK. Optional: Merkle batch JSON.',
    'The public key inside a proof file is not sufficient trust; compare keyId with a key you already pinned.',
    '',
    '## Published proofs',
  ]
  for (const entry of document.proofs) {
    lines.push(`- ${entry.contentKey}`)
    lines.push(`  title: ${entry.title}`)
    lines.push(`  page: ${entry.proofPageUrl}`)
    lines.push(`  proof: ${entry.proofJsonUrl}`)
    if (entry.replicaUrl) lines.push(`  replica: ${entry.replicaUrl}`)
    if (entry.ipfsUri) lines.push(`  ipfs: ${entry.ipfsUri}`)
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

export function renderContentProofLlmsSection(entries = listContentProofDiscoveryEntries()) {
  const lines = [
    '## 内容凭证',
    '公开内容的指纹、站点签名、proof JSON 与可选 IPFS 副本。验证在浏览器本地或离线脚本中完成，无需钱包。通过只证明版本、时间和完整性，不证明观点或事实正确。',
    `- [内容账本](${SITE_URL}/onchain-blog): 读者验证与开放测试`,
    `- [Agent 验证说明](${SITE_URL}/verify.txt): 机器可读协议、信任边界与离线命令`,
    `- [内容凭证发现](${SITE_URL}/.well-known/content-proof.json): well-known 发现文档`,
    `- [内容凭证 RSS](${SITE_URL}/proofs.xml): 凭证与副本发现源`,
    `- [离线验证器](${GITHUB_REPO}/tree/main/${VERIFIER_PATH}): 可脱离 2aran.com 运行的开源 CLI`,
  ]
  for (const entry of entries) {
    lines.push(`- [${entry.title}](${entry.proofPageUrl})`)
    lines.push(`  - proof JSON: ${entry.proofJsonUrl}`)
    if (entry.replicaUrl) lines.push(`  - 副本: ${entry.replicaUrl}`)
    if (entry.ipfsUri) lines.push(`  - IPFS: ${entry.ipfsUri}`)
  }
  return lines.join('\n')
}
