# 内容指纹原型

更新：2026-09-16

第 1—2 周原型由 `lib/contentProof.js`、`scripts/build-content-proof.mjs`、公开 proof JSON 和 `/onchain-blog` 上的浏览器验证器组成。它只完成内容规范化、SHA-256、站点签名与离线验证；不包含 Merkle Tree、测试网或主网交易。

第 5—6 周的读者界面由 `ContentProofCard`、`/proofs/[contentKey]`、`contentProofRegistry.js` 和 `contentProofPresentation.js` 组成。已登记凭证可在文章页显示紧凑卡片，详情页在浏览器本地核对内容指纹、Proof ID 和站点签名，并展示 Merkle/链上状态、版本时间线和区块浏览器入口。读者全程无需连接钱包。

第 7—10 周接入 IPFS 副本和主网小批量控制。`lib/contentReplica.js` 生成规范化副本并要求两个独立网关回读同一 SHA-256；`scripts/pin-content-replica.mjs` 默认只写本地副本，`--pin` 才使用 `PINATA_JWT`。发布钱包必须是 `content_attestation` 角色，测试网与主网密钥隔离，主网还要 `--confirm-mainnet`。`scripts/anchor-content-proof-batch.mjs` 按 `chainId + merkleRoot + schemaUid` 幂等，瞬时错误重试，并把 gas / 延迟写入本地 ledger。RSS、`llms.txt` 和 `/proofs.xml` 暴露 proof 与副本链接。活 pinning 与主网交易仍需隔离钱包和 Pinata 凭据，不在构建机执行。

首个 bootstrap 批次已于 2026-09-15 写入 Base Sepolia EAS。Merkle Root 为 `3c4a2b76a8b817924060e0c571797337cad09045b8d9e8f84fd0ec4595392f05`，attestation UID 为 `0xaf0c38c741b062f0097e88a3a7ff4563b10d19adfafc26b386ad160494085c3d`，交易为 `0xb8bee63535fef3e81bafeac38666ad3ab28ee725d852e5d07ed11236ec6742fd`。读者验证页会本地核对 Merkle Path，并直接链接该 EAS attestation。

## v1 规范化契约

- 输入只取 `contentKey`、`version`、`title`、`summary`、`date`、`updated`、`author`、`language`、`tags`、`body/content` 和 `assets`，运行时内部字段不参与哈希。
- 所有文本转为 Unicode NFC，换行统一为 LF。标题等元数据去掉首尾空白。
- 正文移除 BOM、行尾空格和首尾空行，非空正文统一保留一个结尾 LF。
- 标签去空、去重后按 Unicode 码位排序；资源按 URL 排序并记录 SHA-256 与字节数。
- JSON 对象键递归排序，最终以 UTF-8 编码后计算 SHA-256。

固定测试向量的内容哈希是 `dec45fa63b5bd7c235603a9b83506adf63cbebb443ed8d54f4a9ae030babac21`。Node 测试和浏览器页面使用同一个无 Node 依赖的实现。

## 签名与信任边界

proof v1 使用 Web Crypto 的 ECDSA P-256 + SHA-256。`proofId` 是未签名 proof 载荷的 SHA-256；站点签名覆盖同一载荷。`keyId` 按 RFC 7638 的 EC JWK thumbprint 字段生成。

公开公钥只能用于验证。验证者仍需从可信的 2aran.com 发布渠道固定该公钥，单独下载一份 proof 内自带的公钥不能证明发布身份。仓库中的 `.well-known/content-proof-key.json` 是浏览器原型公钥，生产发布钱包或受控签名服务接入前不得把它描述为生产身份。

## 本地生成

先生成原型密钥：

```bash
node scripts/generate-content-proof-key.mjs \
  --private-key local.private.jwk.json \
  --public-key local-public.jwk.json
```

私钥文件以 `0600` 创建，并由 `.gitignore` 排除。生产私钥不应由构建机脚本长期保存，应迁移到受控签名服务或硬件钱包。

内容输入 JSON 准备好后生成 proof：

```bash
node scripts/build-content-proof.mjs \
  --input entry.json \
  --private-key local.private.jwk.json \
  --output proof.json \
  --published-at 2026-09-14T00:00:00.000Z
```

脚本拒绝覆盖已有 proof。资源记录可提供 `data` 让脚本计算摘要，也可直接提供经过外部校验的 `sha256` 与 `bytes`。

生成本地副本（不上传）：

```bash
node scripts/pin-content-replica.mjs \
  --proof public/proofs/content-proof-demo-v1.json \
  --content-key research:topics:content-proof-demo \
  --output public/proofs/replicas/content-proof-demo-v1.json
```

主网存证需要隔离发布钱包，并显式确认：

```bash
CONTENT_LEDGER_MAINNET_PRIVATE_KEY=0x... \
CONTENT_LEDGER_PUBLISHER_ADDRESS=0x... \
node scripts/anchor-content-proof-batch.mjs \
  --network base \
  --confirm-mainnet \
  --batch public/proofs/batches/batch-001.json \
  --output public/proofs/batches/batch-001-anchored.json \
  --schema-uid 0x...
```

密钥恢复演练只写出地址和签名，不打印私钥：

```bash
node scripts/content-ledger-key-drill.mjs \
  --wallet-file local.publisher.wallet.json \
  --network base-sepolia \
  --output data/content-ledger/key-drill.json
```

## 验收

```bash
npm run content-proof:test
npm run build:check
```

测试覆盖固定 SHA-256 向量、换行与尾随空格归一、资源清单、签名验证、正文单字篡改、内容身份复用、已提交的公开 proof、IPFS 双网关回读、发布钱包隔离、失败重试、幂等和主网成本汇总。完整生产构建确认共享模块可进入浏览器 bundle。
