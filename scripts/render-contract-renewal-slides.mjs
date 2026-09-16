#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultPdf = path.join(root, 'private/contract-renewal/deck.pdf')
const outDir = path.join(root, 'public/admin/contract-renewal/slides')
const pdf = process.argv[2] || defaultPdf

mkdirSync(outDir, { recursive: true })

const python = `
import sys
from pathlib import Path
try:
    import fitz
except ImportError:
    raise SystemExit('pymupdf is required: python3 -m pip install pymupdf')

pdf = Path(${JSON.stringify(pdf)})
out = Path(${JSON.stringify(outDir)})
if not pdf.exists():
    raise SystemExit(f'PDF not found: {pdf}')

doc = fitz.open(pdf)
for index, page in enumerate(doc, 1):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.35, 1.35), alpha=False)
    dest = out / f'page-{index:02d}.jpg'
    pix.save(str(dest), jpg_quality=78)
    print(f'{index:02d} {dest.stat().st_size/1024:.1f}KB')
print(f'wrote {len(doc)} slides -> {out}')
`

const result = spawnSync('python3', ['-c', python], { encoding: 'utf8' })
if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)
process.exit(result.status ?? 1)
