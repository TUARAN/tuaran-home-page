'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'
import { RELATION_STATUSES, RELATION_TYPES, SITE_AUDIENCES, SITE_STATUSES, relationKey } from '../../../../lib/secondarySiteRegistry'

const inputClass = 'mt-1 w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm text-[#15140f] disabled:opacity-60 dark:border-[#34414f] dark:bg-[#10161f] dark:text-gray-100'
const blankSite = { id: '', label: '', domain: '', category: '', project: '', platform: '', status: 'pending', audience: 'private', description: '', repository: '', notes: '' }
const blankRelation = { type: 'parent', target: 'main', status: 'planned', note: '' }
const tone = (status) => status === 'active' ? 'success' : ['pending', 'planned'].includes(status) ? 'warning' : 'neutral'

function Field({ label, children }) {
  return <label className="block text-xs text-[#67695d] dark:text-gray-400">{label}{children}</label>
}

export default function SubsiteManager() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const [creating, setCreating] = useState(false)
  const [relation, setRelation] = useState(blankRelation)
  const [editingRelation, setEditingRelation] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/subsites', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '加载失败。')
      setData(payload)
      setSelectedId((id) => payload.registry.sites.some((site) => site.id === id) ? id : payload.registry.sites.find((site) => site.id !== 'main')?.id || '')
      setDraft(null)
      setCreating(false)
      setRelation(blankRelation)
      setEditingRelation(false)
    } catch (err) {
      setError(err.message || '加载失败，请重试。')
      setData(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const sites = data?.registry.sites || []
  const relations = data?.registry.relations || []
  const selected = sites.find((site) => site.id === selectedId)
  const form = draft || selected
  const changed = creating || (draft && JSON.stringify(draft) !== JSON.stringify(selected)) || editingRelation
  const disabled = saving || loading || !data || data.readOnly
  const visible = sites.filter((site) => site.id !== 'main' && (!filter || site.status === filter) && (!audienceFilter || site.audience === audienceFilter) &&
    `${site.label} ${site.domain} ${site.project} ${site.category}`.toLowerCase().includes(query.toLowerCase().trim()))
  const name = (id) => sites.find((site) => site.id === id)?.label || id
  const edges = relations.filter((edge) => edge.source === selectedId || edge.target === selectedId)

  function discardAllowed() {
    return !changed || window.confirm('有尚未保存的编辑，确认放弃这些修改？')
  }

  function choose(site) {
    if (!discardAllowed()) return
    setSelectedId(site?.id || '')
    setDraft(site ? null : { ...blankSite })
    setCreating(!site)
    setRelation({ ...blankRelation })
    setEditingRelation(false)
    setNotice('')
    setError('')
  }

  function edit(field, value) { setDraft({ ...form, [field]: value }) }

  async function save(action) {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/subsites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: data.registry.revision, action }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '保存失败。')
      setData(payload)
      setNotice('已保存到管理台账。线上配置及公开目录未改变。')
      return true
    } catch (err) {
      setError(err.message || '保存失败，请重试。')
      return false
    } finally { setSaving(false) }
  }

  async function saveSite(event) {
    event.preventDefault()
    if (await save({ type: 'save-site', site: form, create: creating })) {
      setSelectedId(form.id.trim())
      setDraft(null)
      setCreating(false)
    }
  }

  async function saveRelation(event) {
    event.preventDefault()
    if (await save({ type: 'save-relation', create: !relation.source, relation: { ...relation, source: selectedId } })) {
      setRelation({ ...blankRelation })
      setEditingRelation(false)
    }
  }

  return (
    <AdminPage title="二级站管理" description="统一管理公开子站、内部服务与历史入口，维护部署资料、主从归属及账号、燃币、内容和服务依赖。"
      actions={<>
        <AdminButton href="https://2aran.com/sites" target="_blank" rel="noreferrer">公开目录 ↗</AdminButton>
        <AdminButton disabled={loading || saving} onClick={() => { if (discardAllowed()) { setNotice(''); refresh() } }}>刷新</AdminButton>
        <AdminButton variant="primary" disabled={disabled} onClick={() => choose(null)}>登记站点</AdminButton>
      </>}>
      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        管理台账与线上配置分开维护。修改或归档不自动改变公开目录、DNS、部署、登录白名单和燃币计费；“已接入”是人工登记状态，不代表实时健康检查。
      </p>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {data?.readOnly && <p role="status" className="mb-4 text-sm text-amber-700 dark:text-amber-300">{data.message}</p>}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="全部子域" value={data ? sites.length - 1 : '—'} sub={data ? `公开 ${sites.filter((site) => site.id !== 'main' && site.audience === 'public').length} · 内部 / 受控 ${sites.filter((site) => site.id !== 'main' && site.audience === 'private').length}` : '不含主站关系锚点'} />
        <StatCard label="运营中" value={data ? sites.filter((site) => site.id !== 'main' && site.status === 'active').length : '—'} tone="success" />
        <StatCard label="已接入关系" value={data ? relations.filter((edge) => edge.status === 'active').length : '—'} tone="info" />
        <StatCard label="待接入关系" value={data ? relations.filter((edge) => edge.status === 'planned').length : '—'} tone="warning" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
        <Section title="站点与服务目录" description="覆盖已登记的公开、内部及历史子域；选择条目查看资料与关联。">
          <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Field label="搜索站点"><input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名称、域名、部署项目" /></Field>
            <Field label="运营状态"><select className={inputClass} value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="">全部状态</option>{Object.entries(SITE_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></Field>
            <Field label="访问范围"><select className={inputClass} value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}>
              <option value="">全部范围</option>{Object.entries(SITE_AUDIENCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></Field>
          </div>
          {loading ? <p role="status" className="py-8 text-center text-sm">正在读取站点台账…</p> : !data ?
            <EmptyState title="台账暂不可用" description="请使用上方刷新按钮重试。" /> : !visible.length ?
              <EmptyState title="没有匹配的站点" description="调整搜索条件，或登记新站点。" /> :
              <div className="space-y-2">{visible.map((site) => <button key={site.id} type="button" disabled={saving} aria-pressed={selectedId === site.id}
                onClick={() => choose(site)} className={`w-full rounded-lg border p-3 text-left transition disabled:opacity-60 ${selectedId === site.id ? 'border-[#747d56] bg-[#f0f2e7] dark:bg-[#1e291b]' : 'border-[#e6e7df] hover:bg-[#f7f8f3] dark:border-[#243041] dark:hover:bg-[#151c26]'}`}>
                <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{site.label}</span><StatusPill size="sm" tone={tone(site.status)}>{SITE_STATUSES[site.status]}</StatusPill></span>
                <span className="mt-1 block break-all font-mono text-xs text-[#82847a] dark:text-gray-400">{site.domain}</span>
                <span className="mt-2 block"><StatusPill size="sm" tone={site.audience === 'private' ? 'info' : 'neutral'}>{SITE_AUDIENCES[site.audience]}</StatusPill></span>
                <span className="mt-2 block text-xs text-[#67695d] dark:text-gray-400">{site.project || '未登记部署项目'} · {relations.filter((edge) => edge.source === site.id || edge.target === site.id).length} 条关联</span>
              </button>)}</div>}
          {data && <p className="mb-0 mt-4 text-xs leading-5 text-[#82847a] dark:text-gray-500">
            {data.updatedAt ? `最近保存：${new Date(data.updatedAt).toLocaleString('zh-CN')} · ${data.updatedBy}` : '尚未保存，初始资料来自现有站点与域名目录。'}
          </p>}
        </Section>

        <div className="min-w-0 space-y-5">
          {!form ? <Section title="站点资料与关系"><EmptyState title="选择一个二级站点" description="左侧选择已有站点，或登记新站点。主站作为只读的归属和服务提供方。" /></Section> : <>
            <Section title={creating ? '登记新站点' : form.label} description={creating ? '先保存站点资料，再添加关系。' : '站点标识固定；其他资料可编辑，归档保留历史关系。'}
              actions={!creating && <AdminButton href={`https://${selected.domain}/`} target="_blank" rel="noreferrer" size="sm">访问 ↗</AdminButton>}>
              <form onSubmit={saveSite}>
                <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2">
                  <Field label="站点标识 *"><input required maxLength={48} pattern="[a-z][a-z0-9-]*" disabled={!creating} className={inputClass} value={form.id} onChange={(e) => edit('id', e.target.value)} placeholder="如 tools" /></Field>
                  <Field label="站点名称 *"><input required maxLength={80} className={inputClass} value={form.label} onChange={(e) => edit('label', e.target.value)} /></Field>
                  <Field label="子域名 *"><input required maxLength={253} className={inputClass} value={form.domain} onChange={(e) => edit('domain', e.target.value)} placeholder="tools.2aran.com" /></Field>
                  <Field label="运营状态"><select className={inputClass} value={form.status} onChange={(e) => edit('status', e.target.value)}>{Object.entries(SITE_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                  <Field label="访问范围（台账标记，不改变访问权限）"><select className={inputClass} value={form.audience} onChange={(e) => edit('audience', e.target.value)}>{Object.entries(SITE_AUDIENCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                  <Field label="分类"><input maxLength={60} className={inputClass} value={form.category} onChange={(e) => edit('category', e.target.value)} /></Field>
                  <Field label="部署项目"><input maxLength={100} className={inputClass} value={form.project} onChange={(e) => edit('project', e.target.value)} /></Field>
                  <Field label="部署平台"><input maxLength={120} className={inputClass} value={form.platform} onChange={(e) => edit('platform', e.target.value)} placeholder="如 Cloudflare Pages" /></Field>
                  <Field label="代码仓库 HTTPS 地址"><input type="url" maxLength={300} className={inputClass} value={form.repository} onChange={(e) => edit('repository', e.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label="简介"><textarea rows={2} maxLength={500} className={inputClass} value={form.description} onChange={(e) => edit('description', e.target.value)} /></Field></div>
                  <div className="sm:col-span-2"><Field label="部署与运维备注（不要填写密钥）"><textarea rows={3} maxLength={2000} className={inputClass} value={form.notes} onChange={(e) => edit('notes', e.target.value)} /></Field></div>
                  <div className="flex justify-end sm:col-span-2"><AdminButton type="submit" variant="primary" disabled={disabled}>{saving ? '保存中…' : '保存站点资料'}</AdminButton></div>
                </fieldset>
              </form>
            </Section>
            {!creating && <Section title="站点关系" description="箭头从当前站点指向归属方或服务提供方；同时列出其他站点指向它的关系。">
              {!edges.length ? <EmptyState title="尚未登记关系" description="可添加归属、账号、燃币、部署、内容或服务依赖关系。" /> : <div className="mb-5 space-y-3">{edges.map((edge) => <div key={relationKey(edge)} className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
                <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{name(edge.source)}</span><span className="text-xs text-[#82847a]">— {RELATION_TYPES[edge.type]} →</span><span className="font-medium">{name(edge.target)}</span><StatusPill tone={tone(edge.status)} size="sm">{RELATION_STATUSES[edge.status]}</StatusPill></div>
                {edge.note && <p className="mb-0 mt-2 whitespace-pre-wrap text-xs leading-5 text-[#67695d] dark:text-gray-400">{edge.note}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {edge.source === selectedId ? <AdminButton size="sm" disabled={disabled} onClick={() => {
                    if (editingRelation && !window.confirm('放弃当前未保存的关系编辑？')) return
                    setRelation({ ...edge }); setEditingRelation(true)
                  }}>编辑关系</AdminButton> : <AdminButton size="sm" disabled={saving} onClick={() => choose(sites.find((site) => site.id === edge.source))}>查看来源站点</AdminButton>}
                  <AdminButton size="sm" variant="danger" disabled={disabled} onClick={async () => {
                    if (!window.confirm(`确认移除「${name(edge.source)} → ${name(edge.target)}」的${RELATION_TYPES[edge.type]}关系？仅删除台账记录。`)) return
                    if (await save({ type: 'delete-relation', key: relationKey(edge) })) { setRelation({ ...blankRelation }); setEditingRelation(false) }
                  }}>移除</AdminButton>
                </div>
              </div>)}</div>}
              <form onSubmit={saveRelation} className="border-t border-[#e6e7df] pt-4 dark:border-[#243041]">
                <h3 className="mb-3 text-sm font-semibold">{editingRelation ? '编辑关联' : '添加关联'}</h3>
                <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2">
                  <Field label="关系类型"><select className={inputClass} disabled={Boolean(relation.source)} value={relation.type} onChange={(e) => { setRelation({ ...relation, type: e.target.value }); setEditingRelation(true) }}>{Object.entries(RELATION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                  <Field label="目标站点"><select className={inputClass} disabled={Boolean(relation.source)} value={relation.target} onChange={(e) => { setRelation({ ...relation, target: e.target.value }); setEditingRelation(true) }}>{sites.filter((site) => site.id !== selectedId).map((site) => <option key={site.id} value={site.id}>{site.label}{site.status === 'archived' ? '（已归档）' : ''}</option>)}</select></Field>
                  <Field label="接入状态"><select className={inputClass} value={relation.status} onChange={(e) => { setRelation({ ...relation, status: e.target.value }); setEditingRelation(true) }}>{Object.entries(RELATION_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                  <Field label="关系说明"><input maxLength={500} className={inputClass} value={relation.note} onChange={(e) => { setRelation({ ...relation, note: e.target.value }); setEditingRelation(true) }} placeholder="接入范围、待办与核验依据" /></Field>
                  <div className="flex justify-end gap-2 sm:col-span-2">
                    {editingRelation && <AdminButton type="button" onClick={() => { setRelation({ ...blankRelation }); setEditingRelation(false) }}>取消编辑</AdminButton>}
                    <AdminButton type="submit" variant="primary" disabled={disabled}>{saving ? '保存中…' : '保存关系'}</AdminButton>
                  </div>
                </fieldset>
              </form>
            </Section>}
          </>}
          <p className="text-xs leading-6 text-[#82847a] dark:text-gray-500">运行配置可在 <Link href="/admin/cloudflare-personal-site-map" className="underline">站点架构</Link> 核对；服务凭证统一在 <Link href="/admin/integrations" className="underline">集成密钥</Link> 管理。</p>
        </div>
      </div>
    </AdminPage>
  )
}
