/** Human- and agent-readable claims for what a content proof can and cannot establish. */
export const CONTENT_PROOF_CLAIMS = Object.freeze({
  verifies: Object.freeze([
    Object.freeze({
      id: 'content_integrity',
      label: '内容完整性',
      detail: '规范化正文、元数据和资源清单的 SHA-256 与凭证记录一致。',
    }),
    Object.freeze({
      id: 'proof_identity',
      label: '凭证身份',
      detail: 'Proof ID 是未签名载荷的哈希，凭证本身没有被改写。',
    }),
    Object.freeze({
      id: 'publisher_signature',
      label: '发布签名',
      detail: '独立固定的 P-256 公钥确认该版本由对应发布身份签发。',
    }),
    Object.freeze({
      id: 'merkle_membership',
      label: '批次成员关系',
      detail: 'Merkle Path 能重算出批次公布的 Root。',
    }),
  ]),
  doesNotVerify: Object.freeze([
    Object.freeze({
      id: 'factual_accuracy',
      label: '观点或事实正确',
      detail: '完整性证明不判断文章中的数字、引用或结论是否为真。',
    }),
    Object.freeze({
      id: 'legal_ownership',
      label: '版权归属裁决',
      detail: '发布时间线有助于核对版本，但不能单独解决版权争议。',
    }),
    Object.freeze({
      id: 'reader_wallet',
      label: '读者钱包身份',
      detail: '验证不要求连接钱包，也不确认读者身份。',
    }),
  ]),
})
