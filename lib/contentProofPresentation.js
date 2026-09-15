const EXPECTED_CHAIN_ID = 84532

export function shortDigest(value, head = 10, tail = 8) {
  const text = String(value || '')
  if (text.length <= head + tail + 1) return text || '—'
  return `${text.slice(0, head)}…${text.slice(-tail)}`
}

export function describeProofStatus({ proof, verification, batch } = {}) {
  if (!proof || !verification) {
    return { level: 'loading', label: '正在本地验证', detail: '浏览器正在计算内容指纹。' }
  }
  if (!verification.valid) {
    return { level: 'error', label: '内容与凭证不一致', detail: '内容、凭证身份或站点签名至少有一项未通过。' }
  }
  if (!batch) {
    return { level: 'signed', label: '站点签名已验证', detail: '当前版本完整，正在等待加入 Merkle 批次并写入测试网。' }
  }
  if (!batch.membershipValid) {
    return { level: 'error', label: 'Merkle Root 不一致', detail: '该凭证的 Path 无法计算出批次公布的 Root。' }
  }
  if (batch.anchor?.chainId !== EXPECTED_CHAIN_ID) {
    return { level: 'error', label: '链网络不匹配', detail: `预期 Base Sepolia（${EXPECTED_CHAIN_ID}），实际为 ${batch.anchor?.chainId ?? '未提供'}。` }
  }
  if (!batch.anchor?.transactionHash || !batch.anchor?.attestationUid) {
    return { level: 'batched', label: '批次已验证', detail: 'Merkle Path 已通过，批次正在等待链上确认。' }
  }
  return { level: 'confirmed', label: '发布记录已验证', detail: '内容、站点签名、Merkle Path 与链上存证均通过。' }
}

export function isOlderVersion(version, currentVersion) {
  return Number(version) < Number(currentVersion)
}
