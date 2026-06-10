'use client'

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
  return (
    <details className="mt-10 rounded-lg border border-[#dee0db] bg-white/70 px-4 py-3 text-sm dark:border-gray-800 dark:bg-[#121821]/70">
      <summary className="cursor-pointer select-none font-serif text-base font-semibold text-[#15140f] dark:text-gray-100">
        现状梳理 · 架构与数据
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
          read-only · e2ee
        </span>
      </summary>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
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
          <li>5. marked 渲染 markdown，注入 prose 卡片</li>
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
    </details>
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
