import { DEFAULT_IPFS_GATEWAYS } from './contentReplica.js'

const BASE_SEPOLIA = Object.freeze({
  chainId: 84532,
  explorerUrl: 'https://base-sepolia.easscan.org',
  name: 'Base Sepolia',
})

const DEMO_ENTRY = Object.freeze({
  author: 'TUARAN',
  body: '第一行\r\n第二行  \r\n',
  contentKey: 'research:topics:content-proof-demo',
  date: '2026-09-14',
  language: 'zh-CN',
  summary: '同一份内容在 Node 与浏览器中得到相同指纹。',
  tags: ['内容存证', 'SHA-256'],
  title: '可验证内容示例',
  version: 1,
})

const CREDENTIALS = Object.freeze({
  [DEMO_ENTRY.contentKey]: Object.freeze({
    contentKey: DEMO_ENTRY.contentKey,
    currentVersion: 1,
    entry: DEMO_ENTRY,
    batchUrl: '/proofs/batches/bootstrap-001-anchored.json',
    network: BASE_SEPOLIA,
    proofUrl: '/proofs/content-proof-demo-v1.json',
    publicKeyUrl: '/.well-known/content-proof-key.json',
    replica: Object.freeze({
      cid: null,
      replicaUrl: '/proofs/replicas/content-proof-demo-v1.json',
      gateways: DEFAULT_IPFS_GATEWAYS,
      status: 'local',
    }),
    status: 'confirmed',
    title: DEMO_ENTRY.title,
    versions: Object.freeze([
      Object.freeze({
        note: '首次发布的浏览器验证样本，已由站点原型密钥签名并写入 Base Sepolia EAS。',
        proofUrl: '/proofs/content-proof-demo-v1.json',
        replicaUrl: '/proofs/replicas/content-proof-demo-v1.json',
        publishedAt: '2026-09-14T00:00:00.000Z',
        status: 'confirmed',
        version: 1,
      }),
    ]),
  }),
})

export function contentProofHref(contentKey) {
  return `/proofs/${String(contentKey || '')}`
}

export function getContentProofCredential(contentKey) {
  const key = String(contentKey || '')
  try {
    return CREDENTIALS[decodeURIComponent(key)] || null
  } catch {
    return CREDENTIALS[key] || null
  }
}

export function listContentProofCredentials() {
  return Object.values(CREDENTIALS)
}
