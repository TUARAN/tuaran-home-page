import { contentProofHref, listContentProofCredentials } from './contentProofRegistry.js'

const SITE_URL = 'https://2aran.com'

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

export function renderContentProofLlmsSection(entries = listContentProofDiscoveryEntries()) {
  const lines = [
    '## 内容凭证',
    '公开内容的指纹、站点签名、proof JSON 与可选 IPFS 副本。验证在浏览器本地完成，无需钱包。',
    `- [内容账本](${SITE_URL}/onchain-blog): 可验证发布说明`,
    `- [内容凭证 RSS](${SITE_URL}/proofs.xml): 凭证与副本发现源`,
  ]
  for (const entry of entries) {
    lines.push(`- [${entry.title}](${entry.proofPageUrl})`)
    lines.push(`  - proof JSON: ${entry.proofJsonUrl}`)
    if (entry.replicaUrl) lines.push(`  - 副本: ${entry.replicaUrl}`)
    if (entry.ipfsUri) lines.push(`  - IPFS: ${entry.ipfsUri}`)
  }
  return lines.join('\n')
}
