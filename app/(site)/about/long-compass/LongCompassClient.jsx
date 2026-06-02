'use client'

import { Marked } from 'marked'
import { useEffect, useMemo, useState } from 'react'

const markdown = new Marked({ gfm: true, breaks: true })

function renderMarkdown(text) {
  if (!text) return ''
  try {
    return markdown.parse(text)
  } catch {
    return ''
  }
}

const KIND_LABELS = {
  snapshot: '资产现状',
  strategy: '行动框架',
  review: '阶段复盘',
}

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 120) }
  }
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function deriveKey(password, salt, iterations) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function decryptRecord(payload, password) {
  const salt = base64ToBytes(payload.salt)
  const iv = base64ToBytes(payload.iv)
  const encrypted = base64ToBytes(payload.data)
  const key = await deriveKey(password, salt, payload.iter)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return JSON.parse(new TextDecoder().decode(decrypted))
}

function login() {
  window.location.href = `/api/auth/login?returnTo=${encodeURIComponent('/about/long-compass')}`
}

export default function LongCompassClient() {
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)
  const [encryptedItems, setEncryptedItems] = useState([])
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [records, setRecords] = useState([])
  const [activeKind, setActiveKind] = useState('snapshot')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/private-records', { cache: 'no-store' })
        const data = await safeJson(res)
        if (res.status === 401) {
          setAuthError('UNAUTHORIZED')
          return
        }
        if (res.status === 403) {
          setAuthError('FORBIDDEN')
          return
        }
        if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
        setUser(data?.user || null)
        setEncryptedItems(Array.isArray(data?.items) ? data.items : [])
      } catch (e) {
        setError(e?.message || 'LOAD_FAILED')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const currentRecords = useMemo(
    () =>
      records
        .filter((item) => item.kind === activeKind)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [activeKind, records]
  )

  const counts = useMemo(() => {
    return records.reduce(
      (acc, item) => {
        acc[item.kind] = (acc[item.kind] || 0) + 1
        return acc
      },
      { snapshot: 0, strategy: 0, review: 0 }
    )
  }, [records])

  const stats = useMemo(() => {
    const cipherSizes = encryptedItems.map((it) => JSON.stringify(it.payload).length)
    const totalCipher = cipherSizes.reduce((a, b) => a + b, 0)
    const maxCipher = cipherSizes.length ? Math.max(...cipherSizes) : 0
    const totalPlain = records.reduce((acc, r) => acc + (r.plain?.content?.length || 0), 0)
    const maxPlain = records.length
      ? Math.max(...records.map((r) => r.plain?.content?.length || 0))
      : 0
    const oldest = records.reduce((min, r) => Math.min(min, r.plain?.updatedAt || Infinity), Infinity)
    return {
      total: encryptedItems.length,
      totalCipherKB: (totalCipher / 1024).toFixed(1),
      maxCipherKB: (maxCipher / 1024).toFixed(1),
      totalPlainKChars: (totalPlain / 1000).toFixed(1),
      maxPlainKChars: (maxPlain / 1000).toFixed(1),
      oldestYear: Number.isFinite(oldest) ? new Date(oldest).getFullYear() : null,
    }
  }, [encryptedItems, records])

  async function handleUnlock(e) {
    e.preventDefault()
    const value = password.trim()
    if (!value || busy) return
    setBusy(true)
    setError('')
    try {
      const decrypted = []
      for (const item of encryptedItems) {
        const plain = await decryptRecord(item.payload, value)
        decrypted.push({ ...item, plain })
      }
      setRecords(decrypted)
      setUnlocked(true)
      setPassword('')
    } catch {
      setError('口令错误，无法解密资料库。')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1080px] items-center px-4 py-8">
        <p className="font-mono text-xs text-[#8f8069] dark:text-[#8e9ab0]">Loading private workspace...</p>
      </main>
    )
  }

  if (authError) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[680px] flex-col justify-center px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
          Long Compass
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">长期罗盘</h1>
        <p className="mt-3 text-sm leading-7 text-[#5d554a] dark:text-gray-300">
          {authError === 'UNAUTHORIZED' ? '需要先登录。' : '当前账号没有访问权限。'}
        </p>
        {authError === 'UNAUTHORIZED' ? (
          <button
            type="button"
            onClick={login}
            className="mt-5 w-fit rounded-lg bg-[#3f3527] px-4 py-2 text-sm font-medium text-white hover:bg-[#221f19] dark:bg-gray-200 dark:text-[#111]"
          >
            登录
          </button>
        ) : null}
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 py-8">
      <header className="border-b border-[#e8dfd0] pb-5 dark:border-gray-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
              Long Compass
            </p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#221f19] dark:text-gray-100">
              长期罗盘
            </h1>
          </div>
          <span className="rounded-full border border-[#e8dfd0] px-3 py-1 text-xs text-[#6b5f4d] dark:border-[#2d3440] dark:text-gray-300">
            {unlocked ? '已解锁' : user?.name || user?.login || '已登录'}
          </span>
        </div>
      </header>

      {!unlocked ? (
        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-lg border border-[#e8dfd0] bg-white/82 p-6 dark:border-gray-800 dark:bg-[#121821]/82">
            <h2 className="font-serif text-lg font-semibold text-[#221f19] dark:text-gray-100">解锁资料库</h2>
            <p className="mt-2 text-sm leading-6 text-[#5d554a] dark:text-gray-300">
              当前共有 <strong>{encryptedItems.length}</strong> 条密文记录。口令只在浏览器本地使用。
            </p>
            <form onSubmit={handleUnlock} className="mt-4 flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                placeholder="资料库口令"
                className="rounded-lg border border-[#d8cdbb] bg-white px-3 py-2.5 text-sm text-[#221f19] outline-none focus:border-[#9c8e72] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
              <button
                type="submit"
                disabled={busy || !password.trim()}
                className="rounded-lg bg-[#3f3527] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#221f19] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-gray-200 dark:text-[#111]"
              >
                {busy ? '解锁中...' : '解锁'}
              </button>
            </form>
            {error ? <p className="mt-3 text-sm text-[#b42318] dark:text-red-400">{error}</p> : null}
          </div>

          <aside className="rounded-lg border border-dashed border-[#d8cdbb] bg-white/55 p-6 text-sm leading-7 text-[#5d554a] dark:border-gray-700 dark:bg-[#121821]/55 dark:text-gray-300">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
              这里写了什么
            </p>
            <h3 className="mt-2 font-serif text-base font-semibold text-[#221f19] dark:text-gray-100">
              长期罗盘 · v3 摘要
            </h3>
            <p className="mt-3">
              7 年个人长期档案（2018–2026），由 <strong>Opus 4.7 High</strong> 于 2026-06-02 重新提炼为 26 条结构化章节：
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>· <strong>6 条 资产现状</strong> — 债务时间线、收入曲线、家庭账户、投资沉默成本、流动性、矩联科技</li>
              <li>· <strong>8 条 行动框架</strong> — 信用观 / 博弈 / 写作 / 打工 / 极简 / 债务重组 / 2026 收入结构 / 家庭沟通</li>
              <li>· <strong>12 条 阶段复盘</strong> — 按年从 2018 排到 2026 + 4 个跨年专题</li>
            </ul>
            <p className="mt-3 text-[12px] text-[#847a67] dark:text-gray-400">
              所有内容都是密文，存在 Cloudflare D1。服务端不持有口令，看不到明文。
            </p>
          </aside>
        </section>
      ) : (
        <section className="mt-6">
          <div className="flex flex-wrap gap-2 border-b border-[#e8dfd0] pb-3 dark:border-gray-800">
            {Object.entries(KIND_LABELS).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setActiveKind(kind)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeKind === kind
                    ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                    : 'border border-[#e8dfd0] text-[#6b5f4d] hover:bg-white dark:border-[#2d3440] dark:text-gray-300 dark:hover:bg-[#121821]'
                }`}
              >
                {label} · {counts[kind] || 0}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {currentRecords.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#d8cdbb] px-4 py-6 text-sm text-[#847a67] dark:border-gray-700 dark:text-gray-400">
                暂无记录。
              </p>
            ) : activeKind === 'review' ? (
              <Timeline records={currentRecords} />
            ) : (
              <div className="space-y-3">
                {currentRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <StatusPanel
        unlocked={unlocked}
        total={stats.total}
        counts={counts}
        totalCipherKB={stats.totalCipherKB}
        maxCipherKB={stats.maxCipherKB}
        totalPlainKChars={stats.totalPlainKChars}
        maxPlainKChars={stats.maxPlainKChars}
        oldestYear={stats.oldestYear}
      />
    </main>
  )
}

function RecordCard({ record, dense = false }) {
  return (
    <article
      className={`rounded-lg border border-[#e8dfd0] bg-white/78 ${dense ? 'p-3' : 'p-4'} dark:border-gray-800 dark:bg-[#121821]/78`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-[#221f19] dark:text-gray-100">
            {record.plain?.title || '未命名记录'}
          </h2>
          {record.plain?.summary ? (
            <p className="mt-1 text-xs leading-5 text-[#847a67] dark:text-gray-400">{record.plain.summary}</p>
          ) : null}
        </div>
        <span className="font-mono text-[10px] text-[#a09176] dark:text-[#8e9ab0]">
          {new Date(record.updatedAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
      <div
        className="prose prose-sm mt-3 max-w-none rounded-lg bg-[#faf7f1] px-3 py-2.5 text-[#4d463c] dark:prose-invert dark:bg-[#0d1218] dark:text-gray-300 prose-headings:font-serif prose-headings:text-[#221f19] dark:prose-headings:text-gray-100 prose-p:leading-7 prose-li:leading-7 prose-table:text-xs prose-th:bg-[#f0e9d8] dark:prose-th:bg-[#1a222d] prose-blockquote:border-l-[#c5b89c] prose-blockquote:text-[#5d554a] dark:prose-blockquote:border-l-[#475061] dark:prose-blockquote:text-gray-400 prose-code:text-[#6b4f21] dark:prose-code:text-[#e0c38f]"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(record.plain?.content) }}
      />
    </article>
  )
}

function getRecordYear(record) {
  // 优先从 plain.updatedAt 取年份；fallback 到 row.updatedAt
  const ts = record.plain?.updatedAt || record.updatedAt
  if (!ts) return null
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return null
  return d.getFullYear()
}

function Timeline({ records }) {
  // 按年份升序（旧 → 新），未知年份归到「其他」
  const sorted = [...records].sort((a, b) => {
    const ya = getRecordYear(a) || 0
    const yb = getRecordYear(b) || 0
    if (ya !== yb) return ya - yb
    return (a.plain?.updatedAt || 0) - (b.plain?.updatedAt || 0)
  })

  // 按年分组
  const groups = []
  let currentYear = null
  for (const r of sorted) {
    const y = getRecordYear(r)
    if (y !== currentYear) {
      groups.push({ year: y, items: [r] })
      currentYear = y
    } else {
      groups[groups.length - 1].items.push(r)
    }
  }

  return (
    <div className="relative pl-12 sm:pl-16">
      {/* 竖向时间线 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[#d8cdbb] via-[#c5b89c] to-[#d8cdbb] dark:from-[#2d3440] dark:via-[#475061] dark:to-[#2d3440] sm:left-5"
      />
      <div className="space-y-8">
        {groups.map((group, gi) => (
          <div key={`${group.year ?? 'unknown'}-${gi}`} className="relative">
            {/* 年份标签 + 节点 */}
            <div className="absolute -left-12 top-1 flex w-10 flex-col items-center sm:-left-16 sm:w-12">
              <span className="rounded-full bg-[#3f3527] px-2 py-0.5 font-mono text-[10px] font-semibold text-white shadow-sm dark:bg-gray-200 dark:text-[#111]">
                {group.year ?? '?'}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="absolute -left-[26px] top-[10px] h-2 w-2 rounded-full bg-[#8b5a1f] ring-2 ring-[#faf7f1] dark:bg-[#e0b572] dark:ring-[#121821] sm:-left-[34px]"
            />

            <div className="space-y-3">
              {group.items.map((record) => (
                <RecordCard key={record.id} record={record} dense />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusPanel({
  unlocked,
  total,
  counts,
  totalCipherKB,
  maxCipherKB,
  totalPlainKChars,
  maxPlainKChars,
  oldestYear,
}) {
  return (
    <details className="mt-10 rounded-lg border border-[#e8dfd0] bg-white/70 px-4 py-3 text-sm dark:border-gray-800 dark:bg-[#121821]/70">
      <summary className="cursor-pointer select-none font-serif text-base font-semibold text-[#221f19] dark:text-gray-100">
        现状梳理 · 架构与数据
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
          read-only · e2ee
        </span>
      </summary>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            加密机制
          </h3>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#5d554a] dark:text-gray-300">
            <li>· 算法：<code className="font-mono text-[12px]">AES-256-GCM</code></li>
            <li>· 派生：<code className="font-mono text-[12px]">PBKDF2-SHA256 / 310,000 轮</code></li>
            <li>· 每条独立 salt（16 字节）+ iv（12 字节），密码学随机</li>
            <li>
              · payload 形状：
              <code className="font-mono text-[12px]">{'{ v, alg, kdf, iter, salt, iv, data }'}</code>
              （全 base64）
            </li>
            <li>· 口令仅存在于浏览器 React state，刷新即丢，从不上行</li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            解锁与渲染流程
          </h3>
          <ol className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#5d554a] dark:text-gray-300">
            <li>1. GitHub OAuth 登录，命中 D1 上 user_id 过滤</li>
            <li>
              2. <code className="font-mono text-[12px]">GET /api/private-records</code>
              拉回密文数组（服务端只见 ciphertext）
            </li>
            <li>3. 输入口令 → 浏览器 PBKDF2 派生 key</li>
            <li>4. 每条独立用自带的 salt/iv 解密 → 内存 plain 对象</li>
            <li>5. marked 渲染 markdown，注入 prose 卡片</li>
          </ol>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            当前数据
          </h3>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#5d554a] dark:text-gray-300">
            <li>· 版本：<strong>v3 · Opus 4.7 High · 2026-06-02</strong></li>
            <li>· 来源：DV Notion 导出（2018–2026）→ 由 Opus 4.7 High 提炼重写</li>
            <li>· 策略：26 条精写章节（不再 1:1 复原原文，每条带版本签名）</li>
            <li>
              · 当前 D1：<strong>{total}</strong> 条 · snapshot {counts.snapshot} / strategy {counts.strategy} / review {counts.review}
            </li>
            <li>· 密文总体积：约 {totalCipherKB} KB；单条最大 {maxCipherKB} KB（D1 单 SQL 100 KB 上限）</li>
            {unlocked ? (
              <li>· 明文体量：约 {totalPlainKChars} 千字，单条最长 {maxPlainKChars} 千字</li>
            ) : (
              <li className="opacity-60">· 明文体量：解锁后显示</li>
            )}
            {oldestYear ? <li>· 时间跨度：{oldestYear} – 至今</li> : null}
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            写路径状态
          </h3>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#5d554a] dark:text-gray-300">
            <li>
              · UI 端：✗ 已下线（
              <a
                href="https://github.com/TUARAN/tuaran-home-page/commit/5235582"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[12px] text-[#6b4f21] hover:underline dark:text-[#e0c38f]"
              >
                5235582
              </a>
              ）
            </li>
            <li>
              · API 端：POST/PATCH/DELETE 一律 405（
              <a
                href="https://github.com/TUARAN/tuaran-home-page/commit/9f30a41"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[12px] text-[#6b4f21] hover:underline dark:text-[#e0c38f]"
              >
                9f30a41
              </a>
              ）
            </li>
            <li>· 唯一写入通道：本地 wrangler d1 + 自带加密脚本（口令绝不入库）</li>
            <li>· 风险面：仅余 GET / 解密；服务器即便被攻破也只能拿到密文</li>
          </ul>
        </div>
      </div>

      <p className="mt-5 border-t border-dashed border-[#e8dfd0] pt-3 text-[11px] leading-5 text-[#847a67] dark:border-gray-700 dark:text-gray-400">
        本页面只对登录后的 owner 账号开放。即使 GitHub OAuth 被劫持，攻击者拉到的也只是密文 + 不带口令的 schema —— 没有口令派生密钥就解不开。
      </p>
    </details>
  )
}
