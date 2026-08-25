'use client'

import { useMemo, useState } from 'react'
import {
  IconAdjustmentsHorizontal,
  IconChartBar,
  IconClock,
  IconListDetails,
  IconLock,
  IconMapPin,
  IconSearch,
  IconTable,
  IconTimeline,
  IconWallet,
} from '@tabler/icons-react'

import { decryptPayload } from '../../../../lib/longCompass/crypto'
import { AdminPage, Section, StatCard } from '../../components/ui'
import { SOFT_STICKER_ENVELOPE } from './seed'

const CONTROL_CLASS =
  'h-10 rounded-lg border border-[#caccc0] bg-white px-3 text-sm text-[#34362f] outline-none transition focus:border-[#92713d] focus:ring-2 focus:ring-[#92713d]/10 dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100'

const SPEND_TIERS = [
  { value: 'all', label: '全部花费' },
  { value: 'under-500', label: '500 以下' },
  { value: '500-799', label: '500–799' },
  { value: '800-1199', label: '800–1199' },
  { value: '1200-plus', label: '1200 以上' },
]

const SCORE_BANDS = [
  { id: 'high', label: '8–10', test: (score) => score >= 8 },
  { id: 'good', label: '6–7.9', test: (score) => score >= 6 && score < 8 },
  { id: 'low', label: '< 6', test: (score) => score < 6 },
]

const STRENGTH_SIGNALS = [
  ['服务体验', /服务|体验很好|省心|配合度高/],
  ['年轻', /年轻/],
  ['方便', /方便|便捷|距离近/],
  ['身材', /身材|体型特点/],
  ['交流互动', /互动|交流|健谈|亲和/],
  ['可上门', /上门/],
]

const WEAKNESS_SIGNALS = [
  ['配合不足', /配合度低|配合度和主动性不足|互动消极|主动性不足|专注度/],
  ['照片差异', /照片差异|照片与本人|本人与照片/],
  ['外形偏差', /偏瘦|外形一般|颜值一般|身材状态一般|体型与预期/],
  ['年龄感', /年龄感|年龄偏大/],
  ['催促', /催促/],
  ['状态问题', /烟味|身体状态|热情下降/],
]

function money(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function decimal(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

function mean(rows, key) {
  if (!rows.length) return 0
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length
}

function matchesSpendTier(spend, tier) {
  if (tier === 'under-500') return spend < 500
  if (tier === '500-799') return spend >= 500 && spend < 800
  if (tier === '800-1199') return spend >= 800 && spend < 1200
  if (tier === '1200-plus') return spend >= 1200
  return true
}

function scoreClasses(score) {
  if (score >= 8) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
  if (score >= 6) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
  return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
}

function countSignals(rows, field, definitions) {
  return definitions
    .map(([label, pattern]) => ({
      label,
      count: rows.filter((row) => pattern.test(String(row[field] || ''))).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'))
}

function groupRows(rows, key) {
  const grouped = new Map()
  for (const row of rows) {
    const value = String(row[key] || '未标注')
    const current = grouped.get(value) || { label: value, count: 0, spend: 0, scoreTotal: 0 }
    current.count += 1
    current.spend += Number(row.spend || 0)
    current.scoreTotal += Number(row.score || 0)
    grouped.set(value, current)
  }
  return [...grouped.values()].map((item) => ({ ...item, avgScore: item.scoreTotal / item.count }))
}

function BarList({ items, valueLabel = (item) => `${item.count} 条` }) {
  const max = Math.max(...items.map((item) => item.count), 1)
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-[#46483f] dark:text-gray-300">{item.label}</span>
            <span className="shrink-0 tabular-nums text-[#7c7f72] dark:text-gray-500">{valueLabel(item)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eceee7] dark:bg-[#202a36]">
            <div className="h-full rounded-full bg-[#98733d] dark:bg-[#c79d62]" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function UnlockPanel({ onUnlock, busy, error, total }) {
  const [password, setPassword] = useState('')

  async function submit(event) {
    event.preventDefault()
    await onUnlock(password)
    setPassword('')
  }

  return (
    <Section title="解锁日记" description="口令只在当前浏览器内参与 AES-GCM 解密，不会发送到服务器。">
      <div className="flex max-w-2xl items-start gap-3 rounded-xl border border-[#e5dfd2] bg-[#fbf8f1] p-4 dark:border-[#3a3023] dark:bg-[#18150f]">
        <IconLock size={20} className="mt-0.5 shrink-0 text-[#98733d]" aria-hidden="true" />
        <div className="text-sm leading-6 text-[#5b5549] dark:text-[#c9c0b1]">
          <p className="font-medium text-[#302d27] dark:text-gray-100">双层私密保护</p>
          <p className="mt-1">页面先经过站长身份校验；通过后仍只能取得密文。正确口令解锁后，筛选与统计全部在本地完成。</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-4 flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className={`${CONTROL_CLASS} min-w-0 flex-1`}
          placeholder={`输入日记口令${total ? ` · ${total} 条密文记录` : ''}`}
        />
        <button
          type="submit"
          disabled={busy || !password.trim()}
          className="h-10 shrink-0 rounded-lg bg-[#171610] px-5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]"
        >
          {busy ? '解锁中…' : '解锁看板'}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
    </Section>
  )
}

function FilterBar({ filters, setFilters, years, places, count, total }) {
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <Section
      title="筛选器"
      description={`当前显示 ${count} / ${total} 条；筛选同时作用于指标、画像、时间线和表格。`}
      actions={<IconAdjustmentsHorizontal size={18} className="text-[#77796e]" aria-hidden="true" />}
    >
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-6">
        <label className="relative xl:col-span-2">
          <span className="sr-only">搜索记录</span>
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-3 text-[#8a8c80]" aria-hidden="true" />
          <input
            className={`${CONTROL_CLASS} w-full pl-9`}
            value={filters.query}
            onChange={(event) => update('query', event.target.value)}
            placeholder="搜索代称、区域、优点或问题"
          />
        </label>
        <select className={CONTROL_CLASS} value={filters.year} onChange={(event) => update('year', event.target.value)} aria-label="年份">
          <option value="all">全部年份</option>
          {years.map((year) => <option key={year} value={year}>{year} 年</option>)}
        </select>
        <select className={CONTROL_CLASS} value={filters.place} onChange={(event) => update('place', event.target.value)} aria-label="区域">
          <option value="all">全部区域</option>
          {places.map((place) => <option key={place} value={place}>{place}</option>)}
        </select>
        <select className={CONTROL_CLASS} value={filters.minScore} onChange={(event) => update('minScore', event.target.value)} aria-label="最低评分">
          <option value="0">全部评分</option>
          <option value="8">8 分以上</option>
          <option value="7">7 分以上</option>
          <option value="6">6 分以上</option>
        </select>
        <select className={CONTROL_CLASS} value={filters.spendTier} onChange={(event) => update('spendTier', event.target.value)} aria-label="花费区间">
          {SPEND_TIERS.map((tier) => <option key={tier.value} value={tier.value}>{tier.label}</option>)}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select className={`${CONTROL_CLASS} h-8 py-0 text-xs`} value={filters.sort} onChange={(event) => update('sort', event.target.value)} aria-label="排序方式">
          <option value="newest">按日期：新到旧</option>
          <option value="oldest">按日期：旧到新</option>
          <option value="score">按评分：高到低</option>
          <option value="spend">按花费：高到低</option>
        </select>
        <button
          type="button"
          onClick={() => setFilters({ query: '', year: 'all', place: 'all', minScore: '0', spendTier: 'all', sort: 'newest' })}
          className="h-8 rounded-lg border border-[#caccc0] px-3 text-xs text-[#56584f] dark:border-[#2d3744] dark:text-gray-300"
        >
          清空筛选
        </button>
      </div>
    </Section>
  )
}

function ProfileDashboard({ rows }) {
  const yearly = groupRows(rows, 'year').sort((a, b) => Number(a.label) - Number(b.label))
  const places = groupRows(rows, 'place').sort((a, b) => b.count - a.count || b.avgScore - a.avgScore).slice(0, 8)
  const scoreBands = SCORE_BANDS.map((band) => ({ label: band.label, count: rows.filter((row) => band.test(row.score)).length }))
  const strengths = countSignals(rows, 'advantage', STRENGTH_SIGNALS)
  const weaknesses = countSignals(rows, 'weakness', WEAKNESS_SIGNALS)
  const bestPlace = [...groupRows(rows, 'place')].filter((item) => item.count >= 2).sort((a, b) => b.avgScore - a.avgScore)[0]

  if (!rows.length) return <p className="text-sm text-[#717367] dark:text-gray-400">当前筛选下没有可生成的画像。</p>

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <div className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] xl:col-span-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b7a5e]">筛选结果画像</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
          <div><dt className="text-xs text-[#7a7c71]">平均年龄</dt><dd className="mt-1 text-xl font-semibold">{decimal(mean(rows, 'age'))}<span className="ml-1 text-xs font-normal text-[#8a8c80]">岁</span></dd></div>
          <div><dt className="text-xs text-[#7a7c71]">平均身高</dt><dd className="mt-1 text-xl font-semibold">{decimal(mean(rows, 'height'))}<span className="ml-1 text-xs font-normal text-[#8a8c80]">cm</span></dd></div>
          <div><dt className="text-xs text-[#7a7c71]">平均评分</dt><dd className="mt-1 text-xl font-semibold">{decimal(mean(rows, 'score'))}<span className="ml-1 text-xs font-normal text-[#8a8c80]">/ 10</span></dd></div>
          <div><dt className="text-xs text-[#7a7c71]">平均花费</dt><dd className="mt-1 text-xl font-semibold">¥{money(Math.round(mean(rows, 'spend')))}</dd></div>
        </dl>
        <div className="mt-5 border-t border-[#eceee7] pt-4 text-xs leading-6 text-[#66695f] dark:border-[#202a36] dark:text-gray-400">
          <p>高分记录：{rows.filter((row) => row.score >= 8).length} 条</p>
          <p>高频区域：{places[0]?.label || '—'}（{places[0]?.count || 0} 条）</p>
          <p>重复样本区域最佳：{bestPlace ? `${bestPlace.label} · ${decimal(bestPlace.avgScore)} 分` : '样本不足'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] xl:col-span-4">
        <h3 className="font-serif font-semibold text-[#24241f] dark:text-gray-100">年度频次</h3>
        <p className="mb-4 mt-1 text-xs text-[#85877d]">按记录发生年份统计</p>
        <BarList items={yearly} valueLabel={(item) => `${item.count} 条 · ¥${money(item.spend)}`} />
      </div>

      <div className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] xl:col-span-4">
        <h3 className="font-serif font-semibold text-[#24241f] dark:text-gray-100">区域分布</h3>
        <p className="mb-4 mt-1 text-xs text-[#85877d]">最多显示前 8 个区域</p>
        <BarList items={places} valueLabel={(item) => `${item.count} 条 · ${decimal(item.avgScore)} 分`} />
      </div>

      <div className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] xl:col-span-4">
        <h3 className="font-serif font-semibold text-[#24241f] dark:text-gray-100">评分结构</h3>
        <p className="mb-4 mt-1 text-xs text-[#85877d]">按 10 分制划分</p>
        <BarList items={scoreBands} />
      </div>

      <div className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] xl:col-span-4">
        <h3 className="font-serif font-semibold text-[#24241f] dark:text-gray-100">偏好信号</h3>
        <p className="mb-4 mt-1 text-xs text-[#85877d]">从优点摘要中提取，可能一条命中多个信号</p>
        <BarList items={strengths} />
      </div>

      <div className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] xl:col-span-4">
        <h3 className="font-serif font-semibold text-[#24241f] dark:text-gray-100">避雷信号</h3>
        <p className="mb-4 mt-1 text-xs text-[#85877d]">从问题摘要中提取，属于主观记录</p>
        <BarList items={weaknesses} />
      </div>
    </div>
  )
}

function TimelineView({ rows }) {
  if (!rows.length) return <p className="text-sm text-[#717367] dark:text-gray-400">当前筛选下没有时间线记录。</p>
  return (
    <ol className="relative ml-2 border-l border-[#d8d9d0] dark:border-[#2a3440]">
      {rows.map((row) => (
        <li key={row.id} className="relative pb-7 pl-6 last:pb-0">
          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#9a743d] dark:border-[#10161f] dark:bg-[#d0a66b]" />
          <article className="rounded-xl border border-[#e0e1d8] bg-white/80 p-4 dark:border-[#252e39] dark:bg-[#10161f]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] text-[#888a7f]">{row.dateLabel}</p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-[#20211c] dark:text-gray-100">{row.name}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#77796e] dark:text-gray-500">
                  <span className="inline-flex items-center gap-1"><IconMapPin size={13} />{row.place}</span>
                  <span className="inline-flex items-center gap-1"><IconWallet size={13} />¥{money(row.spend)}</span>
                  <span className="inline-flex items-center gap-1"><IconClock size={13} />{row.durationLabel}</span>
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${scoreClasses(row.score)}`}>{row.score} 分</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm leading-6 md:grid-cols-2">
              <p><span className="mr-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">优点</span>{row.advantage}</p>
              <p><span className="mr-2 text-xs font-medium text-rose-700 dark:text-rose-400">问题</span>{row.weakness}</p>
            </div>
          </article>
        </li>
      ))}
    </ol>
  )
}

function TableView({ rows }) {
  if (!rows.length) return <p className="text-sm text-[#717367] dark:text-gray-400">当前筛选下没有表格记录。</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-[#dfe1d7] dark:border-[#26303c]">
      <table className="min-w-[1280px] w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-[#f4f2eb] text-[#55574e] dark:bg-[#18202a] dark:text-gray-300">
          <tr>
            {['序号', '日期', '代称', '身高', '年龄', '评分', '优点摘要', '问题摘要', '区域', '花费', '耗时', '标记'].map((label) => (
              <th key={label} className="whitespace-nowrap border-b border-[#d8dad0] px-3 py-3 font-medium dark:border-[#303b48]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eceee7] bg-white dark:divide-[#202a36] dark:bg-[#10161f]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top transition hover:bg-[#faf9f4] dark:hover:bg-[#141c26]">
              <td className="px-3 py-3 tabular-nums text-[#85877d]">{row.order}</td>
              <td className="whitespace-nowrap px-3 py-3 font-mono">{row.dateLabel}</td>
              <td className="whitespace-nowrap px-3 py-3 font-medium">{row.name}</td>
              <td className="px-3 py-3 tabular-nums">{row.height}</td>
              <td className="px-3 py-3 tabular-nums">{row.age}</td>
              <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 font-semibold ${scoreClasses(row.score)}`}>{row.score}</span></td>
              <td className="max-w-[260px] px-3 py-3 leading-5">{row.advantage}</td>
              <td className="max-w-[260px] px-3 py-3 leading-5">{row.weakness}</td>
              <td className="whitespace-nowrap px-3 py-3">{row.place}</td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums">¥{money(row.spend)}</td>
              <td className="whitespace-nowrap px-3 py-3">{row.durationLabel}</td>
              <td className="whitespace-nowrap px-3 py-3 font-mono">{row.marker}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SoftStickerClient() {
  const [rows, setRows] = useState([])
  const [unlocked, setUnlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('profile')
  const [filters, setFilters] = useState({ query: '', year: 'all', place: 'all', minScore: '0', spendTier: 'all', sort: 'newest' })

  async function unlock(password) {
    if (!SOFT_STICKER_ENVELOPE) {
      setError('日记密文尚未写入。')
      return
    }
    setBusy(true)
    setError('')
    try {
      const plain = await decryptPayload(SOFT_STICKER_ENVELOPE, password.trim())
      if (plain?.schemaVersion !== 1 || !Array.isArray(plain.records)) throw new Error('INVALID_DIARY_SCHEMA')
      setRows(plain.records)
      setUnlocked(true)
    } catch {
      setError('口令错误，无法解密 SoftSticker。')
    } finally {
      setBusy(false)
    }
  }

  const years = useMemo(() => [...new Set(rows.map((row) => String(row.year)))].sort((a, b) => Number(b) - Number(a)), [rows])
  const places = useMemo(() => [...new Set(rows.map((row) => row.place))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [rows])

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    const result = rows.filter((row) => {
      const haystack = [row.name, row.place, row.advantage, row.weakness, row.marker].join(' ').toLowerCase()
      return (
        (!query || haystack.includes(query)) &&
        (filters.year === 'all' || String(row.year) === filters.year) &&
        (filters.place === 'all' || row.place === filters.place) &&
        Number(row.score) >= Number(filters.minScore) &&
        matchesSpendTier(Number(row.spend), filters.spendTier)
      )
    })
    return result.sort((a, b) => {
      if (filters.sort === 'oldest') return a.sortDate.localeCompare(b.sortDate)
      if (filters.sort === 'score') return b.score - a.score || b.sortDate.localeCompare(a.sortDate)
      if (filters.sort === 'spend') return b.spend - a.spend || b.sortDate.localeCompare(a.sortDate)
      return b.sortDate.localeCompare(a.sortDate)
    })
  }, [filters, rows])

  const totalSpend = filteredRows.reduce((sum, row) => sum + Number(row.spend || 0), 0)
  const topScoreCount = filteredRows.filter((row) => row.score >= 8).length

  const views = [
    { id: 'profile', label: '画像看板', icon: IconChartBar },
    { id: 'timeline', label: '时间线', icon: IconTimeline },
    { id: 'table', label: '大表格', icon: IconTable },
  ]

  return (
    <AdminPage
      title="SoftSticker"
      description="私人体验记录的只读复盘页。解锁后可按年份、区域、评分和花费筛选，并在画像、时间线与明细表之间切换。"
      actions={unlocked ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"><IconLock size={13} />已在本地解锁</span> : null}
    >
      {!unlocked ? (
        <UnlockPanel onUnlock={unlock} busy={busy} error={error} total={SOFT_STICKER_ENVELOPE ? 27 : 0} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <StatCard label="记录数" value={filteredRows.length} sub={`全部 ${rows.length} 条`} icon="flower" />
            <StatCard label="累计花费" value={`¥${money(totalSpend)}`} sub="按当前筛选口径" icon="analytics" tone="warning" />
            <StatCard label="平均评分" value={filteredRows.length ? decimal(mean(filteredRows, 'score')) : '—'} sub="10 分制" icon="chartLine" tone="success" />
            <StatCard label="高分记录" value={topScoreCount} sub="评分 ≥ 8" icon="audit" tone="success" />
            <StatCard label="平均耗时" value={filteredRows.length ? `${Math.round(mean(filteredRows, 'durationMinutes'))} min` : '—'} sub="区间按中值计算" icon="planning" />
          </div>

          <FilterBar filters={filters} setFilters={setFilters} years={years} places={places} count={filteredRows.length} total={rows.length} />

          <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-[#dedfd6] bg-[#f7f6f1] p-1 dark:border-[#26303c] dark:bg-[#111821]" role="tablist" aria-label="日记视图">
            {views.map((item) => {
              const Icon = item.icon
              const active = view === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(item.id)}
                  className={`inline-flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${active ? 'bg-white text-[#22231e] shadow-sm dark:bg-[#202a36] dark:text-white' : 'text-[#74766c] hover:text-[#35372f] dark:text-gray-500 dark:hover:text-gray-300'}`}
                >
                  <Icon size={16} aria-hidden="true" />{item.label}
                </button>
              )
            })}
          </div>

          {view === 'profile' ? (
            <Section title="画像看板" description="所有指标均由当前筛选结果即时聚合；文字评价属于当时的主观记录。" actions={<IconListDetails size={18} className="text-[#77796e]" />}>
              <ProfileDashboard rows={filteredRows} />
            </Section>
          ) : view === 'timeline' ? (
            <Section title="时间线" description="按当前排序展示记录节点。">
              <TimelineView rows={filteredRows} />
            </Section>
          ) : (
            <Section title="完整明细" description="横向滚动查看全部字段；表头在容器内保持可见。">
              <TableView rows={filteredRows} />
            </Section>
          )}
        </div>
      )}
    </AdminPage>
  )
}
