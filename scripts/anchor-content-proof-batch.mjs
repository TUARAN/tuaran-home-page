#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { AbiCoder, Contract, Interface, JsonRpcProvider, Wallet, ZeroAddress, ZeroHash, solidityPackedKeccak256 } from 'ethers'

const CHAIN = Object.freeze({
  chainId: 84532,
  eas: '0x4200000000000000000000000000000000000021',
  explorer: 'https://base-sepolia.easscan.org',
  name: 'base-sepolia',
  rpcUrl: 'https://sepolia.base.org',
  schemaRegistry: '0x4200000000000000000000000000000000000020',
})
const SCHEMA = 'bytes32 merkleRoot,uint32 itemCount,uint64 generatedAt,bytes32 manifestHash,bytes32 previousRoot,string manifestURI'
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
  CONTENT_LEDGER_TESTNET_PRIVATE_KEY=0x... node scripts/anchor-content-proof-batch.mjs --batch batch.json --output anchored-batch.json --register-schema

Options: --rpc-url URL  Override the public Base Sepolia RPC endpoint.
         --prepare       Print the exact EAS schema and fields without network or wallet access.`
}

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(usage())
  process.exit(0)
}

const batchPath = valueAfter(args, '--batch')
const outputPath = valueAfter(args, '--output')
if (!batchPath || (!outputPath && !args.includes('--prepare'))) {
  console.error(usage())
  process.exit(1)
}

const batch = JSON.parse(await readFile(resolve(batchPath), 'utf8'))
const fields = [
  { name: 'merkleRoot', type: 'bytes32', value: `0x${batch.merkleRoot}` },
  { name: 'itemCount', type: 'uint32', value: batch.count },
  { name: 'generatedAt', type: 'uint64', value: Math.floor(new Date(batch.generatedAt).valueOf() / 1000) },
  { name: 'manifestHash', type: 'bytes32', value: `0x${batch.manifestHash}` },
  { name: 'previousRoot', type: 'bytes32', value: batch.previousRoot ? `0x${batch.previousRoot}` : ZeroHash },
  { name: 'manifestURI', type: 'string', value: batch.manifestUri || '' },
]

if (args.includes('--prepare')) {
  console.log(JSON.stringify({ chain: CHAIN, schema: SCHEMA, fields }, null, 2))
  process.exit(0)
}

const privateKey = process.env.CONTENT_LEDGER_TESTNET_PRIVATE_KEY
if (!privateKey) throw new Error('CONTENT_LEDGER_TESTNET_PRIVATE_KEY is required; never put this key in the repository or batch JSON')
const provider = new JsonRpcProvider(valueAfter(args, '--rpc-url') || CHAIN.rpcUrl, CHAIN.chainId)
const signer = new Wallet(privateKey, provider)
let schemaUid = valueAfter(args, '--schema-uid')

if (args.includes('--register-schema')) {
  const registry = new Contract(CHAIN.schemaRegistry, SCHEMA_REGISTRY_ABI, signer)
  schemaUid = solidityPackedKeccak256(['string', 'address', 'bool'], [SCHEMA, ZeroAddress, true])
  const transaction = await registry.register(SCHEMA, ZeroAddress, true)
  await transaction.wait()
}
if (!/^0x[a-fA-F0-9]{64}$/.test(schemaUid || '')) throw new Error('--schema-uid is required unless --register-schema is used')

const eas = new Contract(CHAIN.eas, EAS_ABI, signer)
const data = AbiCoder.defaultAbiCoder().encode(
  fields.map((field) => field.type),
  fields.map((field) => field.value),
)
const transaction = await eas.attest({
  schema: schemaUid,
  data: { recipient: ZeroAddress, expirationTime: 0, revocable: true, refUID: ZeroHash, data, value: 0 },
})
const transactionReceipt = await transaction.wait()
const easInterface = new Interface(EAS_ABI)
const attestationEvent = transactionReceipt.logs
  .map((log) => { try { return easInterface.parseLog(log) } catch { return null } })
  .find((event) => event?.name === 'Attested')
const attestationUid = attestationEvent?.args?.uid
if (!attestationUid) throw new Error(`transaction ${transactionReceipt.hash} confirmed without an EAS Attested event`)
const anchored = {
  ...batch,
  anchor: {
    attestationUid,
    chainId: CHAIN.chainId,
    contract: CHAIN.eas,
    explorerUrl: `${CHAIN.explorer}/attestation/view/${attestationUid}`,
    schemaUid,
    transactionHash: transactionReceipt.hash,
  },
}
await writeFile(resolve(outputPath), `${JSON.stringify(anchored, null, 2)}\n`, { flag: 'wx', mode: 0o644 })
console.log(JSON.stringify(anchored.anchor))
