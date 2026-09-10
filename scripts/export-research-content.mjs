#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { documents } from './research-snapshots.mjs'

const outputArg = process.argv.indexOf('--output')
if (outputArg < 0 || !process.argv[outputArg + 1]) throw new Error('Usage: node scripts/export-research-content.mjs --output /absolute/path/research-content.json (local export only)')
const output = path.resolve(process.argv[outputArg + 1])
fs.writeFileSync(output, JSON.stringify({ version: 1, documents })+'\n', { mode: 0o600 })
console.log(`[research-export] ${documents.length} documents; ${documents.filter((item) => item.entry.encrypted).length} encrypted; output ${output}; no publication performed`)
