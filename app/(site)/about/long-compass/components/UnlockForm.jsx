'use client'

export default function UnlockForm({ encryptedCount, password, onPasswordChange, onSubmit, busy, error }) {
  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-lg border border-[#e8dfd0] bg-white/82 p-6 dark:border-gray-800 dark:bg-[#121821]/82">
        <h2 className="font-serif text-lg font-semibold text-[#221f19] dark:text-gray-100">解锁资料库</h2>
        <p className="mt-2 text-sm leading-6 text-[#5d554a] dark:text-gray-300">
          当前共有 <strong>{encryptedCount}</strong> 条密文记录。口令只在浏览器本地使用。
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
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
  )
}
