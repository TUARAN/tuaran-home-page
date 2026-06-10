'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function formatNumber(value) {
  if (value == null) return '—'
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatBytes(value) {
  if (value == null) return '—'
  const bytes = Number(value) || 0
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(value) {
  if (!value) return '—'
  let date = null
  if (typeof value === 'number') {
    date = new Date(value > 1_000_000_000_000 ? value : value * 1000)
  } else if (/^\d+$/.test(String(value))) {
    const n = Number(value)
    date = new Date(n > 1_000_000_000_000 ? n : n * 1000)
  } else {
    date = new Date(value)
  }

  if (!date || Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function stateLabel(snapshot) {
  if (!snapshot) return '加载中'
  if (snapshot.status === 'connected') return '已连接'
  if (snapshot.status === 'unavailable') return '未绑定'
  return '异常'
}

export default function DbAdminClient() {
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('all')
  const [selectedTable, setSelectedTable] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/db', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setSnapshot(data)
      setSelectedTable((current) => current || (Array.isArray(data?.tables) && data.tables[0] ? data.tables[0].name : ''))
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const tables = useMemo(() => (Array.isArray(snapshot?.tables) ? snapshot.tables : []), [snapshot])
  const groups = useMemo(() => {
    return ['all', ...Array.from(new Set(tables.map((table) => table.group).filter(Boolean)))]
  }, [tables])

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tables.filter((table) => {
      if (group !== 'all' && table.group !== group) return false
      if (!q) return true
      return [table.name, table.label, table.group, table.description].join(' ').toLowerCase().includes(q)
    })
  }, [tables, search, group])

  const selected = tables.find((table) => table.name === selectedTable) || filteredTables[0] || tables[0] || null
  const healthTone =
    snapshot?.status === 'connected'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-8 md:py-12">
      <header className="mb-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
          Admin · Database
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 font-serif text-[1.9rem] font-semibold text-[#15140f] dark:text-gray-100 md:text-[2.2rem]">
              数据库管理
            </h1>
            <p className="mb-0 max-w-[46rem] text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
              只读查看 Cloudflare D1 当前状态：表结构、行数、最近更新时间、文本体积估算和核心业务指标。这里不提供任意 SQL，不做删除或迁移。
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#caccc0] bg-white px-3 text-sm font-medium text-[#53554d] transition hover:border-[#818472] hover:text-[#15140f] disabled:opacity-50 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568]"
          >
            {loading ? '刷新中…' : '刷新状态'}
          </button>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {snapshot?.status === 'unavailable' ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <b className="block">当前环境没有 D1 绑定。</b>
          <span>{snapshot.message}</span>
        </div>
      ) : null}

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="连接状态" value={stateLabel(snapshot)} toneClass={healthTone} />
        <Stat label="表数量" value={formatNumber(snapshot?.tableCount)} hint={`预期 ${formatNumber(snapshot?.expectedTables)} 张`} />
        <Stat label="总行数" value={formatNumber(snapshot?.totalRows)} />
        <Stat label="文本量估算" value={formatBytes(snapshot?.approxTextBytes)} />
        <Stat label="刷新时间" value={formatTime(snapshot?.generatedAt)} compact />
      </section>

      {snapshot?.summaries?.length ? (
        <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {snapshot.summaries.map((item) => (
            <div key={item.key} className="rounded-xl border border-[#d5d7cd] bg-white/70 px-4 py-3 dark:border-[#252e39] dark:bg-[#10161f]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">
                {item.label}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[#15140f] dark:text-gray-100">
                {formatNumber(item.value)} <span className="text-xs font-normal text-[#63645a] dark:text-[#9aa6b6]">{item.unit}</span>
              </div>
              <div className="mt-1 text-[11px] text-[#63645a] dark:text-[#9aa6b6]">{item.hint}</div>
            </div>
          ))}
        </section>
      ) : null}

      {(snapshot?.missingTables?.length || snapshot?.extraTables?.length) ? (
        <section className="mb-5 grid gap-3 md:grid-cols-2">
          <ListNotice title="缺失预期表" items={snapshot.missingTables} empty="无" />
          <ListNotice title="额外表" items={snapshot.extraTables} empty="无" />
        </section>
      ) : null}

      <section className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {groups.map((item) => (
            <FilterChip key={item} current={group} value={item} onClick={setGroup}>
              {item === 'all' ? '全部' : item}
            </FilterChip>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索表名 / 说明 / 分组…"
          className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100 sm:w-80"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-xl border border-[#d5d7cd] dark:border-[#252e39]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#edefe7] text-[12px] uppercase tracking-[0.12em] text-[#616454] dark:bg-[#151c25] dark:text-[#8e9ab0]">
              <tr>
                <th className="px-3 py-2">表</th>
                <th className="px-3 py-2">行数</th>
                <th className="px-3 py-2">字段 / 索引</th>
                <th className="px-3 py-2">最近记录</th>
                <th className="px-3 py-2">文本量</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                    加载中…
                  </td>
                </tr>
              ) : filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                    没有匹配表
                  </td>
                </tr>
              ) : (
                filteredTables.map((table) => (
                  <tr
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`cursor-pointer border-t border-[#dfe0d8] transition hover:bg-[#f3f4ef] dark:border-[#252e39] dark:hover:bg-[#151c25] ${
                      selected?.name === table.name ? 'bg-[#f3f4ed] dark:bg-[#1b1c13]' : ''
                    }`}
                  >
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-[#15140f] dark:text-gray-100">{table.label}</b>
                        <span className="rounded bg-[#e8ece4] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#485a3b] dark:bg-[#1a1f17] dark:text-[#93a984]">
                          {table.group}
                        </span>
                        {!table.expected ? (
                          <span className="rounded bg-[#e4e9d6] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a6b2e] dark:bg-[#1b1c13] dark:text-[#9aa27a]">
                            extra
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-[#858779] dark:text-[#8e9ab0]">{table.name}</div>
                      <div className="mt-1 text-[12px] text-[#63645a] dark:text-[#9aa6b6]">{table.description}</div>
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-sm text-[#15140f] dark:text-gray-100">
                      {formatNumber(table.rowCount)}
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                      {formatNumber(table.columnsCount)} 字段 · {formatNumber(table.indexesCount)} 索引
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                      <div>{formatTime(table.recentValue)}</div>
                      <div className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">{table.recentColumn || 'no time column'}</div>
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-xs text-[#63645a] dark:text-[#9aa6b6]">
                      {formatBytes(table.approxTextBytes)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-xl border border-[#d5d7cd] bg-white/70 p-4 dark:border-[#252e39] dark:bg-[#10161f]">
          {selected ? (
            <>
              <div className="mb-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">
                  Table Detail
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold text-[#15140f] dark:text-gray-100">{selected.name}</h2>
                <p className="mt-1 text-sm leading-6 text-[#63645a] dark:text-[#9aa6b6]">{selected.description}</p>
              </div>
              <dl className="mb-4 grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                <dt className="text-[#858779] dark:text-[#8e9ab0]">分组</dt><dd>{selected.group}</dd>
                <dt className="text-[#858779] dark:text-[#8e9ab0]">行数</dt><dd>{formatNumber(selected.rowCount)}</dd>
                <dt className="text-[#858779] dark:text-[#8e9ab0]">字段</dt><dd>{formatNumber(selected.columnsCount)}</dd>
                <dt className="text-[#858779] dark:text-[#8e9ab0]">索引</dt><dd>{formatNumber(selected.indexesCount)}</dd>
                <dt className="text-[#858779] dark:text-[#8e9ab0]">文本量</dt><dd>{formatBytes(selected.approxTextBytes)}</dd>
              </dl>
              <div className="overflow-hidden rounded-lg border border-[#dfe0d8] dark:border-[#252e39]">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead className="bg-[#edefe7] text-[#616454] dark:bg-[#151c25] dark:text-[#8e9ab0]">
                    <tr>
                      <th className="px-2 py-1.5">字段</th>
                      <th className="px-2 py-1.5">类型</th>
                      <th className="px-2 py-1.5">标记</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.columns || []).map((column) => (
                      <tr key={column.name} className="border-t border-[#dfe0d8] dark:border-[#252e39]">
                        <td className="break-all px-2 py-1.5 font-mono">{column.name}</td>
                        <td className="px-2 py-1.5 text-[#63645a] dark:text-[#9aa6b6]">{column.type || '—'}</td>
                        <td className="px-2 py-1.5 text-[#63645a] dark:text-[#9aa6b6]">
                          {column.primaryKey ? 'PK' : column.required ? 'required' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#63645a] dark:text-[#9aa6b6]">选择一张表查看字段。</p>
          )}
        </aside>
      </section>
    </main>
  )
}

function Stat({ label, value, hint, toneClass, compact = false }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass || 'border-[#d5d7cd] bg-white/70 dark:border-[#252e39] dark:bg-[#10161f]'}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className={`mt-1 font-semibold ${compact ? 'text-sm' : 'text-2xl'}`}>{value}</div>
      {hint ? <div className="text-[11px] opacity-70">{hint}</div> : null}
    </div>
  )
}

function ListNotice({ title, items, empty }) {
  return (
    <div className="rounded-xl border border-[#d5d7cd] bg-white/70 px-4 py-3 text-sm dark:border-[#252e39] dark:bg-[#10161f]">
      <b className="block text-[#15140f] dark:text-gray-100">{title}</b>
      <p className="mt-1 break-words font-mono text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
        {items?.length ? items.join('、') : empty}
      </p>
    </div>
  )
}

function FilterChip({ current, value, onClick, children }) {
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        'rounded-full border px-3 py-1 text-xs transition',
        active
          ? 'border-[#8b5a1f] bg-[#e7eadc] text-[#8a6b2e] dark:border-[#d7a85c] dark:bg-[#1b1c13] dark:text-[#9aa27a]'
          : 'border-[#caccc0] bg-white text-[#63645a] hover:bg-[#edefe7] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
