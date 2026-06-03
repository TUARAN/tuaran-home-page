#!/usr/bin/env node
// 加密快照本地的 Claude / 仓库 ai-context 记忆，输出到 public/data/memory/。
// 每次内容变化才写一份新版本（按 SHA-256 比对），密文用 AES-GCM-256 + PBKDF2-SHA256 派生密钥。
// 密码来源：环境变量 TUARAN_MEMORY_KEY，或 ~/.tuaran-memory-key 文件。
// 浏览器端解密用 Web Crypto API，与 Node 端的密文格式严格对齐（ct||tag 拼接）。
//
// 用法：
//   pnpm snapshot-memory                  # 缺密码会报错退出
//   pnpm snapshot-memory --if-changed     # pre-push 钩子用：缺密码静默跳过

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  statSync,
} from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

const REPO_ROOT = process.cwd()
const OUT_DIR = path.join(REPO_ROOT, 'public/data/memory')
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json')

const SOURCES = [
  {
    id: 'claude',
    label: 'Claude Code 项目记忆',
    description: '~/.claude/projects/…/memory/ 下的跨会话项目级记忆',
    dir: path.join(
      homedir(),
      '.claude/projects/-Users-tuaran-Documents-GitHub-tuaran-home-page/memory',
    ),
  },
  {
    id: 'ai-context',
    label: '仓库 ai-context/',
    description: '仓库内长期保存的架构 / 规划 / 审查文档',
    dir: path.join(REPO_ROOT, 'ai-context'),
  },
]

// 加密参数（与 MemoryVault.jsx 必须一致）
const KDF_ITER = 200000
const KEY_BYTES = 32 // AES-256
const SALT_BYTES = 16
const IV_BYTES = 12 // AES-GCM 标准 IV

function readPassphrase() {
  const env = process.env.TUARAN_MEMORY_KEY
  if (env && env.length > 0) return env.trim()
  const keyfile = path.join(homedir(), '.tuaran-memory-key')
  if (existsSync(keyfile)) {
    const v = readFileSync(keyfile, 'utf8').trim()
    if (v) return v
  }
  return null
}

function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, KDF_ITER, KEY_BYTES, 'sha256')
}

function encryptBlob(plaintext, passphrase) {
  const salt = crypto.randomBytes(SALT_BYTES)
  const iv = crypto.randomBytes(IV_BYTES)
  const key = deriveKey(passphrase, salt)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    v: 1,
    kdf: {
      alg: 'PBKDF2-SHA256',
      iter: KDF_ITER,
      salt: salt.toString('base64'),
    },
    cipher: 'AES-GCM',
    iv: iv.toString('base64'),
    // Web Crypto subtle.decrypt(AES-GCM) 要求 ct||tag 串在一起
    ciphertext: Buffer.concat([ct, tag]).toString('base64'),
  }
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const meta = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.+)$/)
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return meta
}

function tsForPath() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return {
      generatedAt: null,
      kdf: { algorithm: 'PBKDF2-SHA256', iterations: KDF_ITER, keyBits: 256 },
      cipher: 'AES-GCM',
      sources: {},
    }
  }
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  } catch {
    console.error('[snapshot-memory] manifest corrupted, refusing to overwrite')
    process.exit(2)
  }
}

function saveManifest(manifest) {
  mkdirSync(OUT_DIR, { recursive: true })
  manifest.generatedAt = new Date().toISOString()
  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8',
  )
}

function main() {
  const ifChanged = process.argv.includes('--if-changed')
  const passphrase = readPassphrase()
  if (!passphrase) {
    if (ifChanged) {
      console.log('[snapshot-memory] no passphrase set, skipping (pre-push soft mode).')
      process.exit(0)
    }
    console.error('[snapshot-memory] no passphrase found.')
    console.error('  Set env: export TUARAN_MEMORY_KEY="your-long-passphrase"')
    console.error('  Or write to ~/.tuaran-memory-key (chmod 600).')
    process.exit(1)
  }

  const manifest = loadManifest()
  let writes = 0

  for (const source of SOURCES) {
    if (!existsSync(source.dir)) {
      console.warn(`[snapshot-memory] source dir missing, skip: ${source.dir}`)
      continue
    }
    if (!manifest.sources[source.id]) {
      manifest.sources[source.id] = {
        label: source.label,
        description: source.description,
        files: {},
      }
    } else {
      // Always refresh label/description from script source-of-truth
      manifest.sources[source.id].label = source.label
      manifest.sources[source.id].description = source.description
    }
    const srcEntry = manifest.sources[source.id]

    const files = readdirSync(source.dir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => {
        const st = statSync(path.join(source.dir, f))
        return st.isFile()
      })
      .sort()

    for (const filename of files) {
      const fullPath = path.join(source.dir, filename)
      const content = readFileSync(fullPath, 'utf8')
      const slug = filename.replace(/\.md$/, '')
      const hash = sha256Hex(content)
      const meta = parseFrontmatter(content)

      if (!srcEntry.files[slug]) {
        srcEntry.files[slug] = {
          title: meta.name || meta.title || slug,
          description: meta.description || '',
          versions: [],
        }
      }
      const fileEntry = srcEntry.files[slug]
      // Title / description 公开（用于导航），可被覆盖
      fileEntry.title = meta.name || meta.title || slug
      fileEntry.description = meta.description || ''

      const last = fileEntry.versions[fileEntry.versions.length - 1]
      if (last && last.hash === hash) {
        continue // 内容未变
      }

      const ts = new Date().toISOString()
      const blob = encryptBlob(content, passphrase)
      const relPath = `${source.id}/${slug}/${tsForPath()}.enc.json`
      const absPath = path.join(OUT_DIR, relPath)
      mkdirSync(path.dirname(absPath), { recursive: true })
      writeFileSync(absPath, JSON.stringify(blob) + '\n', 'utf8')

      fileEntry.versions.push({
        ts,
        hash,
        path: relPath,
        bytes: content.length,
      })
      writes++
      console.log(`[snapshot-memory] + ${source.id}/${slug} @ ${ts}`)
    }
  }

  saveManifest(manifest)

  if (writes === 0) {
    console.log('[snapshot-memory] no content changed, manifest refreshed only.')
  } else {
    console.log(`[snapshot-memory] done. ${writes} new version(s) written.`)
  }
}

main()
