#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { generateSiteKeyPair, getSiteKeyId } from '../lib/contentProof.js'

function valueAfter(args, flag) {
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1]
}

const args = process.argv.slice(2)
const privatePath = valueAfter(args, '--private-key')
const publicPath = valueAfter(args, '--public-key')
if (!privatePath || !publicPath) {
  console.error('Usage: node scripts/generate-content-proof-key.mjs --private-key site.private.jwk.json --public-key site-public.jwk.json')
  process.exit(1)
}

const { privateKeyJwk, publicKeyJwk } = await generateSiteKeyPair()
await writeFile(resolve(privatePath), `${JSON.stringify(privateKeyJwk, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
try {
  await writeFile(resolve(publicPath), `${JSON.stringify(publicKeyJwk, null, 2)}\n`, { flag: 'wx', mode: 0o644 })
} catch (error) {
  console.error(`Private key was created at ${resolve(privatePath)}, but the public key could not be written: ${error.message}`)
  process.exitCode = 1
}
console.log(JSON.stringify({ keyId: await getSiteKeyId(publicKeyJwk), privateKey: resolve(privatePath), publicKey: resolve(publicPath) }))
