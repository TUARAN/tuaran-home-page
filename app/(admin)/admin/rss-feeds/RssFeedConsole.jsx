'use client'

import { useCallback, useEffect, useState } from 'react'

const EMPTY_FORM = {
  siteName: '',
  rssUrl: '',
  siteUrl: '',
  category: '',
  description: '',
  sortOrder: '',
}

export default function RssFeedConsole() {
  const [items, setItems] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rss-feeds', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (data?.status === 'ok') {
        setItems(Array.isArray(data.feeds) ? data.feeds : [])
        setAnalytics(data.analytics || null)
        setStatus('ok')
      } else if (data?.status === 'unavailable') {
        setStatus('unavailable')
        setMessage(data.message || '存储未就绪')
      } else {
        setStatus('error')
        setMessage(data?.message || data?.error || '读取失败')
      }
    } catch (err) {
      setStatus('error')
      setMessage(String(err?.message || err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.siteName.trim() || !form.rssUrl.trim()) {
      setMessage('「站点名称」和「RSS 链接」必填')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/rss-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          siteName: form.siteName,
          rssUrl: form.rssUrl,
          siteUrl: form.siteUrl,
          category: form.category,
          description: form.description,
          sortOrder: form.sortOrder === '' ? 0 : Number(form.sortOrder),
        }),
      })
      const data = await res.json()
      if (res.ok && data?.ok) {
        setForm(EMPTY_FORM)
        setMessage('已添加')
        load()
      } else {
        setMessage(data?.error || '添加失败')
      }
    } catch (err) {
      setMessage(String(err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(item) {
    try {
      const res = await fetch('/api/admin/rss-feeds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: item.id, published: item.published ? 0 : 1 }),
      })
      if (res.ok) load()
      else setMessage('更新失败')
    } catch (err) {
      setMessage(String(err?.message || err))
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`确认删除「${item.siteName}」？`)) return
    try {
      const res = await fetch(`/api/admin/rss-feeds?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) load()
      else setMessage('删除失败')
    } catch (err) {
      setMessage(String(err?.message || err))
    }
  }

  const inputClass =
    'w-full rounded-md border border-[#dcdfe5] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#9aa0aa] dark:border-[#2a3440] dark:bg-[#0f151d] dark:text-gray-100'

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-[#15140f] dark:text-gray-100">RSS 订阅管理台</h1>
        <p className="mt-1 text-sm text-[#67695d] dark:text-gray-400">
          这里增删的订阅会展示在公开页{' '}
          <a href="/resources/rss" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            /resources/rss
          </a>
          。需先在 Cloudflare 跑迁移 0031 并绑定 D1。
        </p>
      </header>

      {status === 'unavailable' ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          {message || 'D1 未绑定，管理台只读不可用。本地预览无 D1 属正常。'}
        </div>
      ) : null}

      <form
        onSubmit={handleAdd}
        className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-[#e2e3da] bg-white p-4 dark:border-[#1e2733] dark:bg-[#10161f] sm:grid-cols-2"
      >
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">站点名称 *</span>
          <input
            className={inputClass}
            value={form.siteName}
            onChange={(e) => setField('siteName', e.target.value)}
            placeholder="阮一峰的网络日志"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">RSS 链接 *</span>
          <input
            className={inputClass}
            value={form.rssUrl}
            onChange={(e) => setField('rssUrl', e.target.value)}
            placeholder="https://www.ruanyifeng.com/blog/atom.xml"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">主页链接</span>
          <input
            className={inputClass}
            value={form.siteUrl}
            onChange={(e) => setField('siteUrl', e.target.value)}
            placeholder="https://www.ruanyifeng.com/blog/"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">分类标签</span>
          <input
            className={inputClass}
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            placeholder="技术 / 周刊"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">简介</span>
          <textarea
            className={`${inputClass} min-h-[64px]`}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="一句话介绍这个订阅源"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">排序权重（大的靠前）</span>
          <input
            className={inputClass}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setField('sortOrder', e.target.value)}
            placeholder="0"
          />
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-5 py-2 text-sm font-medium text-white hover:bg-[#6a4f19] disabled:opacity-50"
          >
            {saving ? '添加中…' : '添加订阅'}
          </button>
          {message ? (
            <span className="text-xs text-[#82847a] dark:text-gray-500">{message}</span>
          ) : null}
        </div>
      </form>

      <RssAnalyticsPanel analytics={analytics} />

      <SiteRssCoveragePanel />

      <div className="rounded-xl border border-[#e2e3da] bg-white dark:border-[#1e2733] dark:bg-[#10161f]">
        {status === 'loading' ? (
          <p className="p-4 text-sm text-[#82847a] dark:text-gray-500">加载中…</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-[#82847a] dark:text-gray-500">
            {status === 'ok' ? '还没有订阅，先在上面添加一条。' : message || '暂不可用'}
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f2ec] dark:divide-[#161e29]">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-[#15140f] dark:text-gray-100">
                    {item.siteName}
                    {item.category ? (
                      <span className="rounded-full border border-[#e2e3da] px-1.5 py-0.5 text-[10px] text-[#82847a] dark:border-[#2a3440] dark:text-gray-500">
                        {item.category}
                      </span>
                    ) : null}
                    {!item.published ? (
                      <span className="rounded-full bg-[#f3f4ee] px-1.5 py-0.5 text-[10px] text-[#9a9c90] dark:bg-[#1a212b] dark:text-gray-500">
                        已下架
                      </span>
                    ) : null}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-5 text-[#67695d] dark:text-gray-400">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-1 break-all font-mono text-[11px] text-[#aaa] dark:text-gray-500">
                    {item.rssUrl}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-[#b6b8ab] dark:text-gray-600">#{item.sortOrder}</span>
                  <button
                    type="button"
                    onClick={() => togglePublished(item)}
                    className="rounded-md border border-[#dcdfe5] px-2.5 py-1 text-xs text-[#555] hover:border-[#b9bbad] dark:border-[#2a3440] dark:text-gray-300"
                  >
                    {item.published ? '下架' : '上架'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-md border border-[#e6c9c9] px-2.5 py-1 text-xs text-[#a85a5a] hover:border-[#d99] dark:border-[#3a2626] dark:text-[#d08a8a]"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// 本站 /rss.xml 覆盖口径——改了 app/(site)/rss.xml/route.js 的 buildItems() 后同步更新这张表
const SITE_RSS_COVERAGE = [
  {
    section: '精选文章',
    path: '/articles?tab=posts',
    status: 'in',
    note: 'articlesData 内链文章全文进 content:encoded；外链型文章剔除。',
  },
  {
    section: '公司 / 事项 / 人物调研',
    path: '/articles/research/*',
    status: 'in',
    note: 'listResearch() 全文进；加密文章只出摘要，明文不进静态产物。',
  },
  {
    section: '灵感流',
    path: '/feed',
    status: 'in',
    note: '图片 / 视频 / 资源 / 观点，统一归到「灵感」分类。视频给封面 + 跳详情页入口，不内嵌媒体。',
  },
  {
    section: '网络日志',
    path: '/diary',
    status: 'partial',
    note: '仅作为 articlesData 里一条聚合文章出现，逐条日志更新不会触发新 RSS item。',
  },
  {
    section: '富页面项目',
    path: '/zhang-juzheng-book、/ai-token-usage-research 等',
    status: 'out',
    note: '长期富页面，内容更新订阅者收不到。如需推送可单独建 item。',
  },
  {
    section: '工作台类',
    path: '/public-opinion、/stock-analysis、/agent-world-cup',
    status: 'out-ok',
    note: 'owner-facing / 自动采集，不进 RSS 是有意为之。',
  },
  {
    section: '收藏 / 资源',
    path: '/bookmarks/*、/resources/*',
    status: 'out',
    note: '索引型，看是否想推。',
  },
]

const COVERAGE_BADGE = {
  in: { label: '✓ 在', cls: 'bg-[#e8f5ec] text-[#2c7a45] dark:bg-[#16291d] dark:text-[#7fcaa0]' },
  partial: { label: '⚠ 半个', cls: 'bg-[#fdf3e3] text-[#a76a1e] dark:bg-[#2a2113] dark:text-[#e0b276]' },
  out: { label: '✕ 没有', cls: 'bg-[#f5f0f0] text-[#9a7373] dark:bg-[#241a1a] dark:text-[#c39a9a]' },
  'out-ok': { label: '✕ 没有（合理）', cls: 'bg-[#f3f4ee] text-[#82847a] dark:bg-[#1a212b] dark:text-gray-400' },
}

function SiteRssCoveragePanel() {
  return (
    <section className="mb-8 rounded-xl border border-[#e2e3da] bg-white p-4 dark:border-[#1e2733] dark:bg-[#10161f]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">本站 RSS 覆盖情况</h2>
        <p className="mt-1 text-xs leading-5 text-[#82847a] dark:text-gray-500">
          记录本站{' '}
          <a href="/rss.xml" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            /rss.xml
          </a>{' '}
          收录了哪些更新流。口径以 <code className="font-mono">app/(site)/rss.xml/route.js</code> 的{' '}
          <code className="font-mono">buildItems()</code> 为准，改动后同步更新此表。
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#eef0e8] dark:border-[#1b2633]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#fafaf6] text-[11px] uppercase tracking-wide text-[#82847a] dark:bg-[#0e141d] dark:text-gray-500">
              <th className="px-3 py-2 font-medium">板块</th>
              <th className="px-3 py-2 font-medium">路径</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">在 RSS 里吗</th>
              <th className="px-3 py-2 font-medium">说明</th>
            </tr>
          </thead>
          <tbody>
            {SITE_RSS_COVERAGE.map((row) => {
              const badge = COVERAGE_BADGE[row.status] || COVERAGE_BADGE.out
              return (
                <tr key={row.section} className="border-t border-[#f1f2ec] align-top dark:border-[#161e29]">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-[#15140f] dark:text-gray-100">
                    {row.section}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-[#67695d] dark:text-gray-400">{row.path}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs leading-5 text-[#67695d] dark:text-gray-400">{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatTime(value) {
  const n = Number(value) || 0
  if (!n) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(n))
}

function StatBox({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-[#e6e7df] bg-[#fafaf6] p-3 dark:border-[#243041] dark:bg-[#0e141d]">
      <p className="text-xs text-[#82847a] dark:text-gray-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-[#15140f] dark:text-gray-100">{value}</p>
      {sub ? <p className="mt-1 text-xs text-[#9a9c8f] dark:text-gray-500">{sub}</p> : null}
    </div>
  )
}

function RssAnalyticsPanel({ analytics }) {
  if (!analytics) return null

  if (analytics.status === 'unavailable') {
    return (
      <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        {analytics.message || 'RSS 请求统计未就绪。'}
      </section>
    )
  }

  if (analytics.status !== 'ok') return null

  const summary = analytics.summary || {}
  const readers = Array.isArray(analytics.readers) ? analytics.readers : []
  const recent = Array.isArray(analytics.recent) ? analytics.recent : []

  return (
    <section className="mb-8 rounded-xl border border-[#e2e3da] bg-white p-4 dark:border-[#1e2733] dark:bg-[#10161f]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">本站 RSS 请求记录</h2>
        <p className="mt-1 text-xs leading-5 text-[#82847a] dark:text-gray-500">
          {analytics.note || 'RSS 没有订阅回调；这里统计的是 /rss.xml 请求次数与近似独立客户端。'}
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label="累计请求" value={summary.totalRequests || 0} sub={`近似客户端 ${summary.totalClients || 0}`} />
        <StatBox label="近 24 小时" value={summary.requests24h || 0} sub="RSS feed 请求" />
        <StatBox label="近 7 天" value={summary.requests7d || 0} sub={`近似客户端 ${summary.clients7d || 0}`} />
        <StatBox label="近 30 天" value={summary.requests30d || 0} sub={`最近 ${formatTime(summary.lastSeenAt)}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-[#eef0e8] bg-[#fbfbf8] p-3 dark:border-[#1b2633] dark:bg-[#0c121a]">
          <h3 className="mb-3 text-sm font-semibold text-[#15140f] dark:text-gray-100">Reader / 客户端分布 · 近 30 天</h3>
          {readers.length ? (
            <ul className="grid gap-2">
              {readers.map((row) => (
                <li
                  key={row.reader}
                  className="flex items-center justify-between gap-3 rounded-md border border-[#edf0e8] bg-white px-3 py-2 dark:border-[#1e2733] dark:bg-[#10161f]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#15140f] dark:text-gray-100">{row.reader}</p>
                    <p className="text-[11px] text-[#9a9c8f] dark:text-gray-500">
                      近似客户端 {row.clients || 0} · 最近 {formatTime(row.lastSeenAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-[#15140f] dark:text-gray-100">
                    {row.requests || 0}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#82847a] dark:text-gray-500">还没有 RSS 请求记录。</p>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-[#eef0e8] bg-[#fbfbf8] p-3 dark:border-[#1b2633] dark:bg-[#0c121a]">
          <h3 className="mb-3 text-sm font-semibold text-[#15140f] dark:text-gray-100">最近请求</h3>
          {recent.length ? (
            <ol className="grid max-h-[360px] gap-2 overflow-auto pr-1">
              {recent.map((row, index) => (
                <li
                  key={`${row.createdAt}-${index}`}
                  className="rounded-md border border-[#edf0e8] bg-white px-3 py-2 dark:border-[#1e2733] dark:bg-[#10161f]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium text-[#15140f] dark:text-gray-100">
                      {row.reader || 'Unknown'}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-[#9a9c8f] dark:text-gray-500">
                      {formatTime(row.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-[#aaa] dark:text-gray-500" title={row.userAgent}>
                    {row.userAgent || '无 User-Agent'}
                  </p>
                  {row.referer ? (
                    <p className="mt-1 truncate font-mono text-[11px] text-[#bbb] dark:text-gray-600" title={row.referer}>
                      ref: {row.referer}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[#82847a] dark:text-gray-500">还没有 RSS 请求记录。</p>
          )}
        </div>
      </div>
    </section>
  )
}
