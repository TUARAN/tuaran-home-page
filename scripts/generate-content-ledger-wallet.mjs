#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { Wallet } from 'ethers'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

const args = process.argv.slice(2)
const outputPath = resolve(valueAfter(args, '--output') || 'private/content-ledger-base-sepolia-wallet.json')
const wallet = Wallet.createRandom()

await mkdir(dirname(outputPath), { recursive: true, mode: 0o700 })
await writeFile(outputPath, `${JSON.stringify({
  address: wallet.address,
  chainId: 84532,
  createdAt: new Date().toISOString(),
  privateKey: wallet.privateKey,
}, null, 2)}\n`, { flag: 'wx', mode: 0o600 })

console.log(JSON.stringify({ address: wallet.address, chainId: 84532, output: outputPath }))
