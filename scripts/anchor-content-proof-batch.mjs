#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { AbiCoder, Contract, Interface, JsonRpcProvider, Wallet, ZeroAddress, ZeroHash, solidityPackedKeccak256 } from 'ethers'

import { contentLedgerExplorerUrl, CONTENT_LEDGER_SCHEMA, getContentLedgerNetwork } from '../lib/contentLedgerNetworks.js'
import {
  contentLedgerIdempotencyKey,
  findLedgerRecord,
  recordContentLedgerCost,
  resolveIdempotentPublish,
  upsertPublishLedger,
  withPublishRetry,
} from '../lib/contentLedgerPublish.js'
import {
  assertPublisherAddress,
  assertRecordHasNoSecrets,
  parseAddressList,
  resolvePublisherWallet,
} from '../lib/contentLedgerWallet.js'

const SCHEMA_REGISTRY_ABI = ['function register(string schema,address resolver,bool revocable) returns (bytes32)']
const EAS_ABI = [
  'function attest((bytes32 schema,(address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value) data) request) payable returns (bytes32)',
  'event Attested(address indexed recipient,address indexed attester,bytes32 uid,bytes32 indexed schemaUID)',
]

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

function usage() {
  return `Usage:
  CONTENT_LEDGER_TESTNET_PRIVATE_KEY=0x... node scripts/anchor-content-proof-batch.mjs --batch batch.json --output anchored-batch.json --schema-uid 0x...
  CONTENT_LEDGER_MAINNET_PRIVATE_KEY=0x... node scripts/anchor-content-proof-batch.mjs --network base --confirm-mainnet --batch batch.json --output anchored.json --schema-uid 0x...

Options: --rpc-url URL  Override the network RPC endpoint.
         --wallet-file  Isolated publisher wallet JSON (role=content_attestation).
         --ledger PATH  Idempotency and cost ledger. Defaults to data/content-ledger/publish-ledger.json.
         --prepare      Print the exact EAS schema and fields without network or wallet access.`
}

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(usage())
  process.exit(0)
}

const batchPath = valueAfter(args, '--batch')
const outputPath = valueAfter(args, '--output')
const network = getContentLedgerNetwork(valueAfter(args, '--network') || 'base-sepolia')
if (!batchPath || (!outputPath && !args.includes('--prepare'))) {
  console.error(usage())
  process.exit(1)
}

const batch = JSON.parse(await readFile(resolve(batchPath), 'utf8'))
assertRecordHasNoSecrets(batch, 'batch JSON')
const fields = [
  { name: 'merkleRoot', type: 'bytes32', value: `0x${batch.merkleRoot}` },
  { name: 'itemCount', type: 'uint32', value: batch.count },
  { name: 'generatedAt', type: 'uint64', value: Math.floor(new Date(batch.generatedAt).valueOf() / 1000) },
  { name: 'manifestHash', type: 'bytes32', value: `0x${batch.manifestHash}` },
  { name: 'previousRoot', type: 'bytes32', value: batch.previousRoot ? `0x${batch.previousRoot}` : ZeroHash },
  { name: 'manifestURI', type: 'string', value: batch.manifestUri || '' },
]

if (args.includes('--prepare')) {
  console.log(JSON.stringify({ chain: network, schema: CONTENT_LEDGER_SCHEMA, fields }, null, 2))
  process.exit(0)
}

const walletFile = valueAfter(args, '--wallet-file')
const walletRecord = walletFile ? JSON.parse(await readFile(resolve(walletFile), 'utf8')) : null
const resolved = resolvePublisherWallet({
  network,
  env: process.env,
  walletRecord,
  confirmMainnet: args.includes('--confirm-mainnet'),
  allowlist: parseAddressList(valueAfter(args, '--allowlist-address')),
  forbiddenAddresses: parseAddressList(valueAfter(args, '--forbidden-address')),
})
const provider = new JsonRpcProvider(valueAfter(args, '--rpc-url') || network.rpcUrl, network.chainId)
const signer = new Wallet(resolved.privateKey, provider)
assertPublisherAddress({
  address: signer.address,
  allowlist: resolved.allowlist,
  forbiddenAddresses: resolved.forbiddenAddresses,
  requireAllowlist: resolved.requireAllowlist,
})
let schemaUid = valueAfter(args, '--schema-uid')

if (args.includes('--register-schema')) {
  const registry = new Contract(network.schemaRegistry, SCHEMA_REGISTRY_ABI, signer)
  schemaUid = solidityPackedKeccak256(['string', 'address', 'bool'], [CONTENT_LEDGER_SCHEMA, ZeroAddress, true])
  const transaction = await registry.register(CONTENT_LEDGER_SCHEMA, ZeroAddress, true)
  await transaction.wait()
}
if (!/^0x[a-fA-F0-9]{64}$/.test(schemaUid || '')) throw new Error('--schema-uid is required unless --register-schema is used')

const ledgerPath = resolve(valueAfter(args, '--ledger') || 'data/content-ledger/publish-ledger.json')
let ledger = { schema: 'https://2aran.com/schemas/content-ledger-publish-ledger/v1', items: [] }
try {
  ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}
const idempotencyKey = contentLedgerIdempotencyKey({
  chainId: network.chainId,
  merkleRoot: batch.merkleRoot,
  schemaUid,
})
const existing = findLedgerRecord(ledger, idempotencyKey)
const decision = resolveIdempotentPublish(existing, { idempotencyKey, merkleRoot: String(batch.merkleRoot).replace(/^0x/, '').toLowerCase() })
const startedAt = Date.now()
let transactionReceipt
let attestationUid
let attemptCount = (existing?.attemptCount || 0) + 1

if (decision.action === 'reuse') {
  transactionReceipt = { hash: decision.record.transactionHash, gasUsed: decision.record.gasUsed, gasPrice: decision.record.effectiveGasPriceWei }
  attestationUid = decision.record.attestationUid
  attemptCount = decision.record.attemptCount || attemptCount
} else {
  const eas = new Contract(network.eas, EAS_ABI, signer)
  const data = AbiCoder.defaultAbiCoder().encode(
    fields.map((field) => field.type),
    fields.map((field) => field.value),
  )
  const result = await withPublishRetry(async () => {
    if (decision.action === 'resume') {
      const receipt = await provider.waitForTransaction(decision.record.transactionHash)
      if (!receipt) throw new Error('existing transaction is not yet confirmed')
      return { receipt, hash: decision.record.transactionHash }
    }
    const transaction = await eas.attest({
      schema: schemaUid,
      data: { recipient: ZeroAddress, expirationTime: 0, revocable: true, refUID: ZeroHash, data, value: 0 },
    })
    return { receipt: await transaction.wait(), hash: transaction.hash }
  })
  transactionReceipt = result.receipt
  const easInterface = new Interface(EAS_ABI)
  const attestationEvent = transactionReceipt.logs
    .map((log) => { try { return easInterface.parseLog(log) } catch { return null } })
    .find((event) => event?.name === 'Attested')
  attestationUid = attestationEvent?.args?.uid
  if (!attestationUid) throw new Error(`transaction ${transactionReceipt.hash} confirmed without an EAS Attested event`)
}

const cost = recordContentLedgerCost({
  idempotencyKey,
  chainId: network.chainId,
  network: network.name,
  transactionHash: transactionReceipt.hash,
  publisherAddress: signer.address,
  gasUsed: transactionReceipt.gasUsed ?? existing?.gasUsed ?? 0,
  effectiveGasPriceWei: transactionReceipt.effectiveGasPrice ?? transactionReceipt.gasPrice ?? existing?.effectiveGasPriceWei ?? 0,
  latencyMs: Date.now() - startedAt,
  attemptCount,
  recordedAt: new Date().toISOString(),
})
const publishRecord = {
  idempotencyKey,
  merkleRoot: String(batch.merkleRoot).replace(/^0x/, '').toLowerCase(),
  status: 'confirmed',
  attestationUid,
  publisherAddress: signer.address.toLowerCase(),
  ...cost,
  updatedAt: cost.recordedAt,
}
assertRecordHasNoSecrets(publishRecord, 'publish record')
const nextLedger = upsertPublishLedger(ledger, publishRecord)
await mkdir(dirname(ledgerPath), { recursive: true })
await writeFile(ledgerPath, `${JSON.stringify(nextLedger, null, 2)}\n`, { mode: 0o600 })

const anchored = {
  ...batch,
  anchor: {
    attestationUid,
    chainId: network.chainId,
    contract: network.eas,
    explorerUrl: contentLedgerExplorerUrl(network, attestationUid),
    schemaUid,
    transactionHash: transactionReceipt.hash,
    publisherAddress: signer.address.toLowerCase(),
    costWei: cost.costWei,
    gasUsed: cost.gasUsed,
    latencyMs: cost.latencyMs,
  },
}
assertRecordHasNoSecrets(anchored, 'anchored batch')
try {
  await writeFile(resolve(outputPath), `${JSON.stringify(anchored, null, 2)}\n`, { flag: 'wx', mode: 0o644 })
} catch (error) {
  if (error?.code !== 'EEXIST') throw error
  const previous = JSON.parse(await readFile(resolve(outputPath), 'utf8'))
  if (previous?.anchor?.transactionHash !== anchored.anchor.transactionHash) {
    throw new Error(`refusing to overwrite ${outputPath} with a different transaction`)
  }
}
console.log(JSON.stringify({ ...anchored.anchor, idempotencyKey, reused: decision.action === 'reuse' }))
