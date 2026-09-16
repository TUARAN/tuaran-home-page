#!/usr/bin/env node
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { Wallet } from 'ethers'

import { getContentLedgerNetwork } from '../lib/contentLedgerNetworks.js'
import { assertPublisherAddress, buildKeyDrillReceipt, resolvePublisherWallet } from '../lib/contentLedgerWallet.js'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

function usage() {
  return `Usage:
  node scripts/content-ledger-key-drill.mjs --wallet-file publisher.wallet.json --network base-sepolia --output data/content-ledger/key-drill.json

Recovers an isolated content-attestation wallet, signs a drill message, and writes a
receipt that contains the address and signature only. The private key is never printed.`
}

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(usage())
  process.exit(0)
}

const walletPath = valueAfter(args, '--wallet-file')
const outputPath = valueAfter(args, '--output') || 'data/content-ledger/key-drill.json'
const network = getContentLedgerNetwork(valueAfter(args, '--network') || 'base-sepolia')
if (!walletPath) {
  console.error(usage())
  process.exit(1)
}

const resolvedPath = resolve(walletPath)
const fileStat = await stat(resolvedPath)
if ((fileStat.mode & 0o077) !== 0) throw new Error(`${walletPath} must be mode 0600 so the publisher key stays isolated`)
const walletRecord = JSON.parse(await readFile(resolvedPath, 'utf8'))
const resolved = resolvePublisherWallet({
  network,
  env: process.env,
  walletRecord,
  confirmMainnet: network.kind === 'mainnet' || args.includes('--confirm-mainnet'),
})
const wallet = new Wallet(resolved.privateKey)
assertPublisherAddress({
  address: wallet.address,
  allowlist: resolved.allowlist,
  forbiddenAddresses: resolved.forbiddenAddresses,
  requireAllowlist: resolved.requireAllowlist,
})
if (walletRecord.address && wallet.address.toLowerCase() !== walletRecord.address.toLowerCase()) {
  throw new Error('wallet file address does not match the recovered private key')
}
const recoveredAt = new Date().toISOString()
const signature = await wallet.signMessage(`2aran-content-ledger-key-drill:${network.name}:${wallet.address.toLowerCase()}:${recoveredAt}`)
const receipt = buildKeyDrillReceipt({
  address: wallet.address,
  network,
  signature,
  recoveredAt,
})
await mkdir(dirname(resolve(outputPath)), { recursive: true })
await writeFile(resolve(outputPath), `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', mode: 0o644 })
console.log(JSON.stringify({ address: receipt.address, network: receipt.network, output: resolve(outputPath), passed: true }))
