'use client'

import {
  IconArrowRight,
  IconExternalLink,
  IconGitBranch,
  IconPlus,
  IconSearch,
  IconServer,
  IconWorld,
} from '@tabler/icons-react'
import { AdminButton, EmptyState, Section, StatusPill } from '../../components/ui'
import {
  RELATION_STATUSES,
  RELATION_TYPES,
  SITE_AUDIENCES,
  SITE_STATUSES,
  relationKey,
} from '../../../../lib/secondarySiteRegistry'

export const blankSite = {
  id: '', label: '', domain: '', category: '', project: '', platform: '', status: 'pending',
  audience: 'private', description: '', repository: '', notes: '',
}
export const blankRelation = { type: 'parent', target: 'main', status: 'planned', note: '' }

const controlClass = 'mt-1.5 w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60'

export function statusTone(status) {
  if (status === 'active') return 'success'
  if (status === 'pending' || status === 'planned') return 'warning'
  return 'neutral'
}

function Field({ label, hint, className = '', children }) {
  return (
    <label className={`block text-xs font-medium text-[var(--admin-muted)] ${className}`}>
      <span>{label}</span>
      {hint ? <span className="ml-1 font-normal text-[#95978c] dark:text-gray-600">{hint}</span> : null}
      {children}
    </label>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="min-w-0">
      <span className="sr-only">{label}</span>
      <select className={`${controlClass} mt-0 h-9 py-1.5 text-[13px]`} value={value} onChange={onChange}>
        {options}
      </select>
    </label>
  )
}

export function SubsiteDirectory({
  loading, data, sites, relations, visible, selectedId, saving,
  query, setQuery, statusFilter, setStatusFilter, audienceFilter, setAudienceFilter, onChoose,
}) {
  const filtered = Boolean(query.trim() || statusFilter || audienceFilter)
  return (
    <Section
      title="站点目录"
      description={data ? `${visible.length} / ${Math.max(0, sites.length - 1)} 个站点` : '公开、内部与历史入口'}
      className="xl:sticky xl:top-[76px]"
    >
      <div className="mb-4 space-y-2.5">
        <label className="relative block">
          <span className="sr-only">搜索站点</span>
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8d82]" />
          <input
            className={`${controlClass} mt-0 h-10 pl-9`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索名称、域名或项目"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <FilterSelect label="运营状态" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={<>
            <option value="">全部状态</option>
            {Object.entries(SITE_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </>} />
          <FilterSelect label="访问范围" value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)} options={<>
            <option value="">全部范围</option>
            {Object.entries(SITE_AUDIENCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </>} />
        </div>
      </div>

      {loading ? <p role="status" className="py-10 text-center text-sm text-[var(--admin-muted)]">正在读取站点台账…</p> : !data ?
        <EmptyState title="台账暂不可用" description="请使用页面右上角的刷新按钮重试。" /> : !visible.length ?
          <EmptyState title={filtered ? '没有匹配的站点' : '尚未登记站点'} description={filtered ? '调整搜索或筛选条件。' : '使用页面右上角登记第一个站点。'} /> :
          <div className="-mx-1 max-h-[calc(100vh-300px)] space-y-1 overflow-y-auto px-1 pb-1">
            {visible.map((site) => {
              const active = selectedId === site.id
              const edgeCount = relations.filter((edge) => edge.source === site.id || edge.target === site.id).length
              return (
                <button
                  key={site.id}
                  type="button"
                  disabled={saving}
                  aria-pressed={active}
                  onClick={() => onChoose(site)}
                  className={`group w-full rounded-lg border px-3 py-3 text-left transition disabled:opacity-60 ${active
                    ? 'border-[#8b9273] bg-[#f1f3e9] shadow-sm dark:border-[#526044] dark:bg-[#192218]'
                    : 'border-transparent hover:border-[var(--admin-line)] hover:bg-[var(--admin-surface-subtle)]'}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--admin-ink)]">{site.label}</span>
                      <span className="mt-1 block truncate font-mono text-[11px] text-[#85877c] dark:text-gray-500">{site.domain}</span>
                    </span>
                    <IconArrowRight size={15} className={`mt-0.5 shrink-0 transition ${active ? 'text-[#656d4c]' : 'text-[#b5b7ad] group-hover:translate-x-0.5'}`} />
                  </span>
                  <span className="mt-2.5 flex items-center gap-2 text-[11px] text-[var(--admin-muted)]">
                    <StatusPill size="sm" tone={statusTone(site.status)}>{SITE_STATUSES[site.status]}</StatusPill>
                    <span>{SITE_AUDIENCES[site.audience]}</span>
                    <span className="ml-auto">{edgeCount} 条关系</span>
                  </span>
                </button>
              )
            })}
          </div>}

      {data ? <p className="mb-0 mt-4 border-t border-[var(--admin-line-soft)] pt-3 text-[11px] leading-5 text-[#8b8d82] dark:text-gray-600">
        {data.updatedAt ? `最近保存 ${new Date(data.updatedAt).toLocaleString('zh-CN')} · ${data.updatedBy}` : '当前为代码目录中的初始资料，尚未保存。'}
      </p> : null}
    </Section>
  )
}

function FormGroup({ icon: Icon, title, description, children }) {
  return (
    <div className="grid gap-4 border-b border-[var(--admin-line-soft)] py-5 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[160px_minmax(0,1fr)]">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-ink)]"><Icon size={16} />{title}</div>
        {description ? <p className="mb-0 mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">{description}</p> : null}
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function SiteEditor({ form, creating, disabled, saving, onEdit, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={disabled}>
        <FormGroup icon={IconWorld} title="身份与状态" description="用于识别站点，并标记当前运营阶段。">
          <Field label="站点标识" hint="必填">
            <input required maxLength={48} pattern="[a-z][a-z0-9-]*" disabled={!creating} className={controlClass} value={form.id} onChange={(e) => onEdit('id', e.target.value)} placeholder="如 tools" />
          </Field>
          <Field label="站点名称" hint="必填">
            <input required maxLength={80} className={controlClass} value={form.label} onChange={(e) => onEdit('label', e.target.value)} />
          </Field>
          <Field label="完整子域名" hint="不含协议">
            <input required maxLength={253} className={controlClass} value={form.domain} onChange={(e) => onEdit('domain', e.target.value)} placeholder="tools.2aran.com" />
          </Field>
          <Field label="分类">
            <input maxLength={60} className={controlClass} value={form.category} onChange={(e) => onEdit('category', e.target.value)} placeholder="如内容站、内部服务" />
          </Field>
          <Field label="运营状态">
            <select className={controlClass} value={form.status} onChange={(e) => onEdit('status', e.target.value)}>{Object.entries(SITE_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </Field>
          <Field label="访问范围" hint="仅为台账标记">
            <select className={controlClass} value={form.audience} onChange={(e) => onEdit('audience', e.target.value)}>{Object.entries(SITE_AUDIENCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </Field>
        </FormGroup>

        <FormGroup icon={IconServer} title="部署信息" description="记录项目归属与代码位置，不在这里执行部署。">
          <Field label="部署项目">
            <input maxLength={100} className={controlClass} value={form.project} onChange={(e) => onEdit('project', e.target.value)} />
          </Field>
          <Field label="部署平台">
            <input maxLength={120} className={controlClass} value={form.platform} onChange={(e) => onEdit('platform', e.target.value)} placeholder="如 Cloudflare Pages" />
          </Field>
          <Field label="代码仓库 HTTPS 地址" className="sm:col-span-2">
            <input type="url" maxLength={300} className={controlClass} value={form.repository} onChange={(e) => onEdit('repository', e.target.value)} placeholder="https://github.com/…" />
          </Field>
        </FormGroup>

        <FormGroup icon={IconGitBranch} title="说明与备注" description="补充站点用途和运维约束，请勿填写密钥。">
          <Field label="站点简介" className="sm:col-span-2">
            <textarea rows={3} maxLength={500} className={controlClass} value={form.description} onChange={(e) => onEdit('description', e.target.value)} />
          </Field>
          <Field label="部署与运维备注" className="sm:col-span-2">
            <textarea rows={4} maxLength={2000} className={controlClass} value={form.notes} onChange={(e) => onEdit('notes', e.target.value)} />
          </Field>
        </FormGroup>

        <div className="mt-5 flex justify-end">
          <AdminButton type="submit" variant="primary" disabled={disabled}>{saving ? '保存中…' : creating ? '登记站点' : '保存资料'}</AdminButton>
        </div>
      </fieldset>
    </form>
  )
}

export function RelationPanel({
  sites, edges, selectedId, relation, editing, disabled, saving, name,
  onEdit, onSelectSource, onDelete, onCancel, onSubmit,
}) {
  const existingRelation = Boolean(relation.source)
  return (
    <div className="space-y-5">
      {!edges.length ? <EmptyState title="尚未登记关系" description="可添加归属、账号、燃币、部署、内容或服务依赖。" /> :
        <div className="grid gap-3 lg:grid-cols-2">
          {edges.map((edge) => {
            const outgoing = edge.source === selectedId
            return (
              <article key={relationKey(edge)} className="rounded-xl border border-[var(--admin-line)] bg-[var(--admin-surface-subtle)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--admin-muted)]">{outgoing ? '对外关系' : '被依赖'}</span>
                  <StatusPill tone={statusTone(edge.status)} size="sm">{RELATION_STATUSES[edge.status]}</StatusPill>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium">{name(edge.source)}</span>
                  <span className="shrink-0 text-[11px] text-[var(--admin-muted)]">{RELATION_TYPES[edge.type]}</span>
                  <IconArrowRight size={14} className="shrink-0 text-[var(--admin-muted)]" />
                  <span className="min-w-0 truncate font-medium">{name(edge.target)}</span>
                </div>
                {edge.note ? <p className="mb-0 mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-[var(--admin-muted)]">{edge.note}</p> : null}
                <div className="mt-4 flex gap-2 border-t border-[var(--admin-line-soft)] pt-3">
                  {outgoing ? <AdminButton size="sm" disabled={disabled} onClick={() => onEdit(edge)}>编辑</AdminButton> :
                    <AdminButton size="sm" disabled={saving} onClick={() => onSelectSource(edge.source)}>查看来源</AdminButton>}
                  <AdminButton size="sm" variant="danger" disabled={disabled} onClick={() => onDelete(edge)}>移除</AdminButton>
                </div>
              </article>
            )
          })}
        </div>}

      <div className="rounded-xl border border-[var(--admin-line)] p-4 md:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-sm font-semibold">{existingRelation ? '编辑关系' : '添加关系'}</h3>
            <p className="mb-0 mt-1 text-xs leading-5 text-[var(--admin-muted)]">关系从当前站点指向归属方或服务提供方。</p>
          </div>
          {!existingRelation ? <IconPlus size={18} className="text-[var(--admin-muted)]" /> : null}
        </div>
        <form onSubmit={onSubmit}>
          <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2">
            <Field label="关系类型">
              <select className={controlClass} disabled={Boolean(relation.source)} value={relation.type} onChange={(e) => onEdit({ ...relation, type: e.target.value })}>{Object.entries(RELATION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </Field>
            <Field label="目标站点">
              <select className={controlClass} disabled={Boolean(relation.source)} value={relation.target} onChange={(e) => onEdit({ ...relation, target: e.target.value })}>{sites.filter((site) => site.id !== selectedId).map((site) => <option key={site.id} value={site.id}>{site.label}{site.status === 'archived' ? '（已归档）' : ''}</option>)}</select>
            </Field>
            <Field label="接入状态">
              <select className={controlClass} value={relation.status} onChange={(e) => onEdit({ ...relation, status: e.target.value })}>{Object.entries(RELATION_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </Field>
            <Field label="关系说明">
              <input maxLength={500} className={controlClass} value={relation.note} onChange={(e) => onEdit({ ...relation, note: e.target.value })} placeholder="接入范围、待办与核验依据" />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              {editing ? <AdminButton type="button" onClick={onCancel}>取消编辑</AdminButton> : null}
              <AdminButton type="submit" variant="primary" disabled={disabled}>{saving ? '保存中…' : '保存关系'}</AdminButton>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  )
}

export function SiteHeader({ site, creating, panel, setPanel }) {
  if (creating) return null
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-xl border border-[var(--admin-line)] bg-[var(--admin-surface-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="m-0 truncate text-lg font-semibold text-[var(--admin-ink)]">{site.label}</h2>
          <StatusPill size="sm" tone={statusTone(site.status)}>{SITE_STATUSES[site.status]}</StatusPill>
          <StatusPill size="sm" tone={site.audience === 'private' ? 'info' : 'neutral'}>{SITE_AUDIENCES[site.audience]}</StatusPill>
        </div>
        <a href={`https://${site.domain}/`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 break-all font-mono text-xs text-[var(--admin-muted)] hover:underline">
          {site.domain}<IconExternalLink size={13} />
        </a>
      </div>
      <div className="flex shrink-0 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-surface)] p-1" role="tablist" aria-label="站点工作区">
        {[['details', '站点资料'], ['relations', '关系管理']].map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={panel === value} onClick={() => setPanel(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${panel === value ? 'bg-[#202019] text-white shadow-sm dark:bg-gray-100 dark:text-gray-900' : 'text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'}`}>{label}</button>
        ))}
      </div>
    </div>
  )
}
