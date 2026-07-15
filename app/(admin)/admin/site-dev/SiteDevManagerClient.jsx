'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AdminButton,
  AdminPage,
  EmptyState,
  Section,
  StatCard,
  StatusPill,
} from '../../components/ui'

const STATUS_META = {
  inbox: { label: 'Inbox', tone: 'neutral' },
  todo: { label: 'Todo', tone: 'info' },
  doing: { label: 'Doing', tone: 'warning' },
  blocked: { label: 'Blocked', tone: 'danger' },
  done: { label: 'Done', tone: 'success' },
}

const PRIORITY_META = {
  low: { label: '低', tone: 'neutral' },
  normal: { label: '普通', tone: 'info' },
  high: { label: '高', tone: 'danger' },
}

const CONTROL_CLASS =
  'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function projectName(projects, id) {
  return projects.find((project) => project.id === id)?.name || id
}

function sourceTitle(source) {
  if (!source) return '—'
  if (source.displayName) return source.displayName
  if (source.provider === 'github') return `${source.owner}/${source.repo}`
  return source.npmPackage
}

function SourceForm({ projects, onSaved, disabled }) {
  const [provider, setProvider] = useState('github')
  const [projectId, setProjectId] = useState('')
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [npmPackage, setNpmPackage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!projectId && projects[0]?.id) setProjectId(projects[0].id)
  }, [projectId, projects])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/site-dev', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert-source',
          provider,
          projectId,
          owner,
          repo,
          npmPackage,
        }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setOwner('')
      setRepo('')
      setNpmPackage('')
      await onSaved()
    } catch (err) {
      setError(err?.message || '来源保存失败。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
          站内项目
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className={`${CONTROL_CLASS} mt-1 w-full`}
            disabled={disabled || saving}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
          来源类型
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className={`${CONTROL_CLASS} mt-1 w-full`}
            disabled={disabled || saving}
          >
            <option value="github">GitHub 仓库</option>
            <option value="npm">npm 包</option>
          </select>
        </label>
      </div>
      {provider === 'github' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
            Owner
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className={`${CONTROL_CLASS} mt-1 w-full`}
              placeholder="TUARAN"
              disabled={disabled || saving}
              required
            />
          </label>
          <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
            Repo
            <input
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              className={`${CONTROL_CLASS} mt-1 w-full`}
              placeholder="tuaran-home-page"
              disabled={disabled || saving}
              required
            />
          </label>
        </div>
      ) : (
        <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
          npm package
          <input
            value={npmPackage}
            onChange={(event) => setNpmPackage(event.target.value)}
            className={`${CONTROL_CLASS} mt-1 w-full`}
            placeholder="@scope/package 或 package-name"
            disabled={disabled || saving}
            required
          />
        </label>
      )}
      {error ? <p className="mb-0 text-[12px] text-rose-600 dark:text-rose-300">{error}</p> : null}
      <div className="flex justify-end">
        <AdminButton type="submit" variant="primary" disabled={disabled || saving || !projectId}>
          {saving ? '保存中…' : '绑定来源'}
        </AdminButton>
      </div>
    </form>
  )
}

function SourceList({ sources, projects, onSync, syncingId }) {
  if (!sources.length) {
    return <EmptyState title="还没有绑定来源" description="先把站内项目和 GitHub 仓库或 npm 包绑定起来。" />
  }
  return (
    <div className="divide-y divide-[#eceee6] dark:divide-[#1b2430]">
      {sources.map((source) => (
        <div key={source.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <b className="break-words text-[14px] text-[#15140f] dark:text-gray-100">{sourceTitle(source)}</b>
              <StatusPill tone={source.provider === 'github' ? 'info' : 'neutral'} size="sm">
                {source.provider}
              </StatusPill>
              <StatusPill tone={source.lastSyncStatus === 'failed' ? 'danger' : source.lastSyncStatus === 'ok' ? 'success' : 'neutral'} size="sm">
                {source.lastSyncStatus}
              </StatusPill>
            </div>
            <p className="mb-0 mt-1 text-[12px] leading-5 text-[#82847a] dark:text-gray-500">
              {projectName(projects, source.projectId)} · issue {source.openIssuesCount} / PR {source.openPrsCount}
              {source.latestVersion ? ` · ${source.latestVersion}` : ''}
              {' · '}
              {formatDate(source.lastSyncedAt)}
            </p>
            {source.lastSyncError ? (
              <p className="mb-0 mt-1 break-words text-[12px] text-rose-600 dark:text-rose-300">{source.lastSyncError}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {source.repoUrl ? (
              <AdminButton href={source.repoUrl} target="_blank" rel="noreferrer" size="sm">
                打开
              </AdminButton>
            ) : null}
            <AdminButton type="button" size="sm" onClick={() => onSync(source.id)} disabled={Boolean(syncingId)}>
              {syncingId === source.id ? '同步中…' : '同步'}
            </AdminButton>
          </div>
        </div>
      ))}
    </div>
  )
}

function WorkItemCard({ item, source, projects, onPatch, savingId }) {
  const priority = PRIORITY_META[item.priority] || PRIORITY_META.normal
  return (
    <article className="rounded-lg border border-[#e2e3da] bg-[#fbfcf8] p-3 dark:border-[#243040] dark:bg-[#0d131b]">
      <div className="flex items-start justify-between gap-3">
        <a
          href={item.url || undefined}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 text-[13px] font-semibold leading-5 text-[#15140f] hover:text-[#8a6422] dark:text-gray-100 dark:hover:text-[#d4ae66]"
        >
          {item.number ? `#${item.number} ` : ''}
          {item.title}
        </a>
        <StatusPill tone={item.type === 'pr' ? 'info' : 'neutral'} size="sm" icon={false}>
          {item.type}
        </StatusPill>
      </div>
      {item.bodyExcerpt ? (
        <p className="mb-0 mt-2 line-clamp-2 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">{item.bodyExcerpt}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusPill tone={priority.tone} size="sm" icon={false}>{priority.label}</StatusPill>
        {item.labels.slice(0, 3).map((label) => (
          <span key={label} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#67695d] dark:bg-[#151c26] dark:text-gray-400">
            {label}
          </span>
        ))}
      </div>
      <p className="mb-0 mt-3 text-[11px] leading-5 text-[#8b8d82] dark:text-gray-500">
        {projectName(projects, item.projectId)} · {sourceTitle(source)} · {formatDate(item.externalUpdatedAt || item.updatedAt)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          value={item.localStatus}
          onChange={(event) => onPatch(item.id, { localStatus: event.target.value })}
          className={CONTROL_CLASS}
          disabled={savingId === item.id}
        >
          {Object.entries(STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
        <select
          value={item.priority}
          onChange={(event) => onPatch(item.id, { priority: event.target.value })}
          className={CONTROL_CLASS}
          disabled={savingId === item.id}
        >
          {Object.entries(PRIORITY_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  )
}

function WorkBoard({ items, sources, projects, onPatch, savingId }) {
  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources])
  const grouped = useMemo(() => {
    const map = Object.fromEntries(Object.keys(STATUS_META).map((status) => [status, []]))
    for (const item of items) {
      const status = map[item.localStatus] ? item.localStatus : 'inbox'
      map[status].push(item)
    }
    return map
  }, [items])

  if (!items.length) {
    return <EmptyState title="还没有同步到待办" description="绑定 GitHub 仓库后点同步，open issue / PR 会进入 Inbox。" />
  }

  return (
    <div className="grid gap-3 xl:grid-cols-5">
      {Object.entries(STATUS_META).map(([status, meta]) => (
        <section key={status} className="min-w-0 rounded-xl border border-[#e2e3da] bg-white/70 dark:border-[#1e2733] dark:bg-[#10161f]/70">
          <header className="flex items-center justify-between border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">
            <StatusPill tone={meta.tone} size="sm">{meta.label}</StatusPill>
            <span className="text-[12px] text-[#82847a] dark:text-gray-500">{grouped[status].length}</span>
          </header>
          <div className="space-y-2 p-2">
            {grouped[status].slice(0, 20).map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                source={sourceMap.get(item.sourceId)}
                projects={projects}
                onPatch={onPatch}
                savingId={savingId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function SyncEvents({ events }) {
  if (!events.length) return <p className="mb-0 text-[13px] text-[#82847a] dark:text-gray-500">暂无同步记录。</p>
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="flex flex-col gap-1 rounded-lg bg-[#f6f7f1] px-3 py-2 text-[12px] dark:bg-[#0d131b] md:flex-row md:items-center md:justify-between">
          <span className="break-words text-[#3f4039] dark:text-gray-200">
            {event.provider || 'sync'} · {event.message || event.status} · {event.itemCount} 项
          </span>
          <span className="text-[#82847a] dark:text-gray-500">{formatDate(event.startedAt)}</span>
          {event.errorDetail ? <span className="break-words text-rose-600 dark:text-rose-300">{event.errorDetail}</span> : null}
        </div>
      ))}
    </div>
  )
}

export default function SiteDevManagerClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncingId, setSyncingId] = useState('')
  const [savingId, setSavingId] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/site-dev', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (err) {
      setError(err?.message || '本站开发管理读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function sync(sourceId = '') {
    setSyncingId(sourceId || 'all')
    setError('')
    try {
      const response = await fetch('/api/admin/site-dev', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'sync', sourceId }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (err) {
      setError(err?.message || '同步失败。')
    } finally {
      setSyncingId('')
    }
  }

  async function patchItem(id, patch) {
    setSavingId(id)
    setError('')
    try {
      const response = await fetch('/api/admin/site-dev', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (err) {
      setError(err?.message || '待办更新失败。')
    } finally {
      setSavingId('')
    }
  }

  const projects = data?.projects || []
  const sources = data?.sources || []
  const items = data?.items || []
  const stats = data?.stats || {}
  const status = data?.status || 'loading'

  return (
    <AdminPage
      title="本站开发管理"
      description="把站内项目、GitHub issue / PR 和 npm 发布状态放到同一个执行看板里。第一阶段只读同步 GitHub / npm，本地维护优先级和推进状态。"
      actions={
        <AdminButton type="button" variant="primary" onClick={() => sync('')} disabled={Boolean(syncingId) || !sources.length}>
          {syncingId === 'all' ? '同步中…' : '同步全部'}
        </AdminButton>
      }
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}
      {loading ? (
        <EmptyState title="正在读取开发管理台" description="加载项目、来源和待办数据。" />
      ) : status === 'unavailable' ? (
        <EmptyState title="D1 未绑定" description={data?.message || '当前环境无法读取本站开发管理数据。'} />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <StatCard label="绑定来源" value={stats.sources || 0} sub={`${stats.activeSources || 0} 个启用`} icon="integrations" />
            <StatCard label="Open Issues" value={stats.openIssues || 0} sub="GitHub 同步口径" icon="todo" tone="info" />
            <StatCard label="Open PRs" value={stats.openPrs || 0} sub="GitHub 同步口径" icon="portfolio" tone="warning" />
            <StatCard label="待办项" value={stats.items || 0} sub={`Doing ${stats.byStatus?.doing || 0} · Blocked ${stats.byStatus?.blocked || 0}`} icon="todo" />
            <StatCard
              label="GitHub Token"
              value={stats.tokenConfigured ? '已配' : '未配'}
              sub={stats.tokenConfigured ? '支持更高额度 / 私有仓库' : '仅同步公开仓库'}
              icon="settings"
              tone={stats.tokenConfigured ? 'success' : 'neutral'}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Section title="绑定项目来源" description="把 portfolio_projects 里的项目绑定到 GitHub 仓库或 npm 包。">
                <SourceForm projects={projects} onSaved={refresh} disabled={!projects.length} />
              </Section>
              <Section title="来源列表" description="GitHub issue / PR 会同步成本站待办；npm 先记录最新版本。">
                <SourceList sources={sources} projects={projects} onSync={sync} syncingId={syncingId} />
              </Section>
              <Section title="同步日志">
                <SyncEvents events={data?.events || []} />
              </Section>
            </div>
            <Section title="待办看板" description="GitHub issue 默认进入 Inbox；这里的状态先只保存在本站 D1，不反写 GitHub。">
              <WorkBoard items={items} sources={sources} projects={projects} onPatch={patchItem} savingId={savingId} />
            </Section>
          </div>
        </>
      )}
    </AdminPage>
  )
}
