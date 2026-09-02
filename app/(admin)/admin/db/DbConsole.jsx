'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminPage } from '../../components/ui'

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

const POEMCN_RELEASE_COMMANDS = [
  {
    title: '1. 一次性准备线上资源',
    note: '限额恢复后执行。R2 bucket 已存在时不要重复创建；先完成 migration，再部署读取新表的 Worker。',
    command: `npx wrangler r2 bucket create poemcn-content --config workers/poemcn/wrangler.toml
npx wrangler d1 migrations apply china-poetry --remote --config workers/poemcn/wrangler.toml`,
  },
  {
    title: '2. 固定上游版本并离线构建',
    note: '必须填写完整 40 位 commit SHA；禁止使用 master、tag 或短 SHA。需要真实增量时传入上一版 catalog。',
    command: `npm --prefix workers/poemcn run dataset:fetch -- --commit <40位SHA> --target /private/tmp/chinese-poetry
npm --prefix workers/poemcn run dataset:build -- --commit <40位SHA> --source-dir /private/tmp/chinese-poetry --baseline-catalog /path/to/previous/catalog.ndjson --output /private/tmp/poemcn-release`,
  },
  {
    title: '3. 先做零写入预检',
    note: '检查 manifest、delta 和预算结论。该命令不会上传 R2，也不会写 D1。',
    command: `npm --prefix workers/poemcn run dataset:publish -- --manifest /private/tmp/poemcn-release/manifest.json --database china-poetry --bucket poemcn-content`,
  },
  {
    title: '4. 人工确认后发布',
    note: '脚本按 R2 → 未激活 D1 索引 → 行数/查询计划验证 → 最后激活的顺序执行；任一预算超限都会在远端写入前停止。',
    command: `npm --prefix workers/poemcn run dataset:publish -- --manifest /private/tmp/poemcn-release/manifest.json --database china-poetry --bucket poemcn-content --apply --confirm-version <manifest.version>
npx wrangler deploy --config workers/poemcn/wrangler.toml`,
  },
]

export default function DbAdminClient() {
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('all')
  const [selectedTable, setSelectedTable] = useState('')
  const [tableDetails, setTableDetails] = useState({})
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/db', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setSnapshot(data)
      setSelectedTable('')
      setTableDetails({})
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openTable = useCallback(async (tableName) => {
    setSelectedTable(tableName)
    setDetailError('')
    if (tableDetails[tableName]) return
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/db?table=${encodeURIComponent(tableName)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok || !data?.table) throw new Error(data?.error || `HTTP_${res.status}`)
      setTableDetails((current) => ({ ...current, [tableName]: data.table }))
    } catch (e) {
      setDetailError(e?.message || 'TABLE_DETAIL_FAILED')
    } finally {
      setDetailLoading(false)
    }
  }, [tableDetails])

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

  const selectedMeta = tables.find((table) => table.name === selectedTable) || null
  const selected = selectedTable ? tableDetails[selectedTable] || selectedMeta : null
  const healthTone =
    snapshot?.status === 'connected'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'

  return (
    <AdminPage
      title="数据库管理"
      description="首屏只读取表目录。行数、字段、索引、最近记录和文本量仅在点开单表时查询，避免每次挂载扫描整库。"
      actions={
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[#caccc0] bg-white px-3 text-sm font-medium text-[#53554d] transition hover:border-[#818472] hover:text-[#15140f] disabled:opacity-50 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568]"
        >
          {loading ? '刷新中…' : '刷新状态'}
        </button>
      }
    >

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

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="连接状态" value={stateLabel(snapshot)} toneClass={healthTone} />
        <Stat label="表数量" value={formatNumber(snapshot?.tableCount)} hint={`预期 ${formatNumber(snapshot?.expectedTables)} 张`} />
        <Stat label="刷新时间" value={formatTime(snapshot?.generatedAt)} compact />
      </section>

      {(snapshot?.missingTables?.length || snapshot?.extraTables?.length) ? (
        <section className="mb-5 grid gap-3 md:grid-cols-2">
          <ListNotice title="缺失预期表" items={snapshot.missingTables} empty="无" />
          <ListNotice title="额外表" items={snapshot.extraTables} empty="无" />
        </section>
      ) : null}

      <PoemcnMigrationRunbook />

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
                <th className="px-3 py-2">分组</th>
                <th className="px-3 py-2 text-right">体检</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                    加载中…
                  </td>
                </tr>
              ) : filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                    没有匹配表
                  </td>
                </tr>
              ) : (
                filteredTables.map((table) => (
                  <tr
                    key={table.name}
                    onClick={() => openTable(table.name)}
                    className={`cursor-pointer border-t border-[#dfe0d8] transition hover:bg-[#f3f4ef] dark:border-[#252e39] dark:hover:bg-[#151c25] ${
                      selectedTable === table.name ? 'bg-[#f3f4ed] dark:bg-[#1b1c13]' : ''
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
                    <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                      {table.group}
                    </td>
                    <td className="px-3 py-3 text-right align-top text-xs text-[#63645a] dark:text-[#9aa6b6]">
                      {tableDetails[table.name] ? '已读取' : '点开检查'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-xl border border-[#d5d7cd] bg-white/70 p-4 dark:border-[#252e39] dark:bg-[#10161f]">
          {detailError ? (
            <p className="text-sm text-rose-700 dark:text-rose-300">读取失败：{detailError}</p>
          ) : selected && detailLoading && !tableDetails[selectedTable] ? (
            <p className="text-sm text-[#63645a] dark:text-[#9aa6b6]">正在按需检查 {selected.name}…</p>
          ) : selected && tableDetails[selectedTable] ? (
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
            <p className="text-sm leading-6 text-[#63645a] dark:text-[#9aa6b6]">点开一张表后才会执行该表的 COUNT、MAX、字段、索引和文本量检查。首次进入不会扫描业务表。</p>
          )}
        </aside>
      </section>
    </AdminPage>
  )
}

function PoemcnMigrationRunbook() {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-[#c9c4af] bg-[#fbfaf3] dark:border-[#3b3b2d] dark:bg-[#17170f]">
      <div className="border-b border-[#ddd8c4] px-4 py-4 dark:border-[#353528]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">阿燃诗词数据库改造运行手册</h2>
          <span className="rounded bg-[#e9e3c9] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#70582e] dark:bg-[#302b19] dark:text-[#d9bd78]">
            独立 D1：china-poetry
          </span>
          <span className="rounded bg-[#dfe9dc] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#3f6538] dark:bg-[#19301b] dark:text-[#91c68b]">
            生产运行时只读
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#616157] dark:text-[#a9b0a0]">
          本页上方连接状态和下方表目录属于主站 D1，不包含诗词库。诗词站使用单独的 <code>china-poetry</code> D1 与 <code>poemcn-content</code> R2；是否完成线上迁移必须按下面步骤和 Cloudflare/Wrangler 结果确认。
        </p>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-2">
        <RunbookStatus
          title="仓库已经完成"
          tone="ready"
          items={[
            'Worker 已移除 cron 与 scheduled 写入入口',
            'D1 新索引只保存元数据、搜索字段和 R2 body_key',
            '正文、统计与 sitemap 按 release 写入不可变 R2 分片',
            '发布器具备预算、文件哈希、记录数与 EXPLAIN 校验',
          ]}
        />
        <RunbookStatus
          title="线上仍需人工确认"
          tone="pending"
          items={[
            'D1 每日限额已经恢复',
            'poemcn-content bucket 已创建',
            '0004_r2_versioned_index migration 已应用',
            '上游已锁定完整 40 位 SHA，release 已通过 dry-run',
            '数据发布完成后 Worker 才切到新 binding/版本',
          ]}
        />
      </div>

      <details className="border-t border-[#ddd8c4] dark:border-[#353528]" open>
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#34342e] dark:text-gray-200">
          限额恢复后的标准执行顺序
        </summary>
        <div className="space-y-4 px-4 pb-4">
          {POEMCN_RELEASE_COMMANDS.map((step) => (
            <div key={step.title} className="rounded-lg border border-[#ddd8c4] bg-white/80 p-3 dark:border-[#353528] dark:bg-[#10160f]">
              <h3 className="text-sm font-semibold text-[#25241f] dark:text-gray-100">{step.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[#68685d] dark:text-[#9fa795]">{step.note}</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-[#20211d] px-3 py-2 font-mono text-[11px] leading-5 text-[#edf0e7]">
                <code>{step.command}</code>
              </pre>
            </div>
          ))}
        </div>
      </details>

      <details className="border-t border-[#ddd8c4] dark:border-[#353528]">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#34342e] dark:text-gray-200">
          数据量过大时：新 D1 离线构建与切换
        </summary>
        <div className="px-4 pb-4 text-sm leading-6 text-[#616157] dark:text-[#a9b0a0]">
          <ol className="list-decimal space-y-1 pl-5">
            <li>创建 <code>china-poetry-next</code>，只对新库执行 <code>0004_r2_versioned_index.sql</code>。</li>
            <li>把发布命令的 <code>--database</code> 指向新库；不要修改正在服务的 binding。</li>
            <li>确认发布器输出的记录数与三个查询计划，抽查标题搜索、分类搜索和若干 R2 详情。</li>
            <li>验证通过后再修改 <code>wrangler.toml</code> 的 <code>DB.database_id</code> 并部署。</li>
            <li>旧 D1 和旧 R2 release 暂不删除；回滚时恢复旧 database ID 并重新部署。</li>
          </ol>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-[#20211d] px-3 py-2 font-mono text-[11px] leading-5 text-[#edf0e7]"><code>{`npx wrangler d1 create china-poetry-next
npx wrangler d1 execute china-poetry-next --remote --file workers/poemcn/migrations/0004_r2_versioned_index.sql`}</code></pre>
        </div>
      </details>

      <details className="border-t border-[#ddd8c4] dark:border-[#353528]">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#34342e] dark:text-gray-200">
          验收、停止条件与权威文档
        </summary>
        <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
          <RunbookStatus
            title="必须停止"
            tone="danger"
            items={[
              '预算 decision.ok 不是 true',
              '完整 commit、R2 对象哈希或 D1 记录数不一致',
              'EXPLAIN 出现意外全表扫描或未使用预期索引',
              'migration、R2 上传或任一抽查失败',
            ]}
          />
          <div className="rounded-lg border border-[#ddd8c4] bg-white/80 p-3 text-sm leading-6 dark:border-[#353528] dark:bg-[#10160f]">
            <b className="text-[#25241f] dark:text-gray-100">权威参考</b>
            <div className="mt-1 flex flex-col items-start gap-1">
              <a className="text-[#866125] underline underline-offset-2 dark:text-[#d5b36a]" href="https://github.com/TUARAN/tuaran-home-page/blob/main/workers/poemcn/README.md" target="_blank" rel="noreferrer">仓库完整运行手册</a>
              <a className="text-[#866125] underline underline-offset-2 dark:text-[#d5b36a]" href="https://developers.cloudflare.com/d1/best-practices/use-indexes/" target="_blank" rel="noreferrer">Cloudflare D1 索引指南</a>
              <span className="text-xs text-[#737367] dark:text-[#969e8d]">页面仅提供执行摘要；参数、预算和文件位置以当前仓库脚本、manifest 与 README 为准。</span>
            </div>
          </div>
        </div>
      </details>
    </section>
  )
}

function RunbookStatus({ title, items, tone }) {
  const toneClass = tone === 'ready'
    ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30'
    : tone === 'danger'
      ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30'
      : 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30'
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <b className="text-sm text-[#25241f] dark:text-gray-100">{title}</b>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-[#616157] dark:text-[#a9b0a0]">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
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
