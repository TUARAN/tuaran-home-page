'use client'

import { useEffect, useState } from 'react'

export default function StatusPanel({
  unlocked,
  total,
  counts,
  totalCipherKB,
  maxCipherKB,
  totalPlainKChars,
  maxPlainKChars,
  oldestYear,
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <>
      <div className="mt-8 flex items-center gap-2 border-t border-[#dee0db] pt-3 dark:border-gray-800">
        <span className="font-serif text-sm font-semibold text-[#51514a] dark:text-gray-300">
        现状梳理 · 架构与数据
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="查看长期罗盘的架构与数据说明"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#b7baad] font-serif text-xs font-semibold text-[#626459] transition hover:border-[#8b5a1f] hover:text-[#8b5a1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5a1f] dark:border-[#475061] dark:text-[#9aa6b6] dark:hover:border-[#d7a85c] dark:hover:text-[#d7a85c] dark:focus-visible:ring-[#d7a85c]"
        >
          i
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
          read-only · e2ee
        </span>
      </div>

      {open ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#15140f]/35 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="long-compass-info-title"
            className="max-h-[min(760px,calc(100vh-2rem))] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#d5d7cd] bg-[#fdfdf9] p-5 shadow-2xl dark:border-[#2d3744] dark:bg-[#10161f] sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#dee0db] pb-4 dark:border-gray-800">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
                  Read-only · E2EE
                </p>
                <h2 id="long-compass-info-title" className="mt-1 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">
                  现状梳理 · 架构与数据
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[#d5d7cd] px-2.5 py-1.5 text-xs font-medium text-[#626459] transition hover:bg-[#edefe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5a1f] dark:border-[#344052] dark:text-[#9aa6b6] dark:hover:bg-[#151c25] dark:focus-visible:ring-[#d7a85c]"
              >
                关闭
              </button>
            </header>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
        <SectionBlock title="加密机制">
          <li>· 算法：<code className="font-mono text-[12px]">AES-256-GCM</code></li>
          <li>· 派生：<code className="font-mono text-[12px]">PBKDF2-SHA256 / 310,000 轮</code></li>
          <li>· 每条独立 salt（16 字节）+ iv（12 字节），密码学随机</li>
          <li>
            · payload 形状：
            <code className="font-mono text-[12px]">{'{ v, alg, kdf, iter, salt, iv, data }'}</code>
            （全 base64）
          </li>
          <li>· 口令仅存在于浏览器 React state，刷新即丢，从不上行</li>
        </SectionBlock>

        <SectionBlock title="解锁与渲染流程">
          <li>1. GitHub OAuth 登录，命中 D1 上 user_id 过滤</li>
          <li>
            2. <code className="font-mono text-[12px]">GET /api/private-records</code>
            拉回密文数组（服务端只见 ciphertext）
          </li>
          <li>3. 输入口令 → 浏览器 PBKDF2 派生 key</li>
          <li>4. 每条独立用自带的 salt/iv 解密 → migrate() 升级到当前 schema</li>
          <li>5. marked 渲染 Markdown，支持 HTTPS 图片；小型内嵌图片会随正文解密后显示</li>
        </SectionBlock>

        <SectionBlock title="当前数据">
          <li>· 版本：<strong>v3 · Opus 4.7 High · 2026-06-02</strong></li>
          <li>· 来源：DV Notion 导出（2018–2026）→ Opus 4.7 High 重写为 26 条章节</li>
          <li>· 本地形态：<code className="font-mono text-[12px]">private/seeds/{'{kind}/{id}.md'}</code>（每条一个 markdown 文件 + YAML frontmatter）</li>
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
        </SectionBlock>

        <SectionBlock title="编辑与写入流程">
          <li>① 改 <code className="font-mono text-[12px]">private/seeds/{'{kind}'}/xxx.md</code> 正文（frontmatter 一般不动）</li>
          <li>② <code className="font-mono text-[12px]">node private/build-seed.mjs</code> → 装配回 seed.json</li>
          <li>③ <code className="font-mono text-[12px]">node private/seed-to-d1.mjs --reset</code> → stdin 输口令 → 加密 → wrangler 写 D1</li>
          <li>· 财务视图会识别 Markdown 表格中的「时点｜估算资产」「时点｜总额」「年份｜年终金额」等明确列名</li>
          <li className="opacity-70">⚠ 当前为「全量重加密」：改 1 条也会重导全部 26 条（密文一次性置换）</li>
          <li>· 模块化：加密 / schema / API 归 <code className="font-mono text-[12px]">lib/longCompass</code></li>
          <li>
            · 写路径：UI ✗{' '}
            <CommitLink hash="5235582" /> · API POST/PATCH/DELETE → 405{' '}
            <CommitLink hash="9f30a41" />
          </li>
        </SectionBlock>

            </div>

            <p className="mt-5 border-t border-dashed border-[#dee0db] pt-3 text-[11px] leading-5 text-[#717367] dark:border-gray-700 dark:text-gray-400">
              本页面只对登录后的 owner 账号开放。即使 GitHub OAuth 被劫持，攻击者拉到的也只是密文 + 不带口令的 schema —— 没有口令派生密钥就解不开。
            </p>
          </section>
        </div>
      ) : null}
    </>
  )
}

function SectionBlock({ title, children }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-[13px] leading-6 text-[#51514a] dark:text-gray-300">
        {children}
      </ul>
    </div>
  )
}

function CommitLink({ hash }) {
  return (
    <a
      href={`https://github.com/TUARAN/tuaran-home-page/commit/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-[12px] text-[#6b4f21] hover:underline dark:text-[#abb18f]"
    >
      {hash}
    </a>
  )
}
