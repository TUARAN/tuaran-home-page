'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { IconInfoCircle } from '@tabler/icons-react'
import { AdminButton, AdminPage, EmptyState, Section, StatCard } from '../../components/ui'
import { relationKey } from '../../../../lib/secondarySiteRegistry'
import {
  blankRelation,
  blankSite,
  RelationPanel,
  SiteEditor,
  SiteHeader,
  SubsiteDirectory,
} from './SubsiteWorkspace'

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
  const [panel, setPanel] = useState('details')

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
      setPanel('details')
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
    setPanel('details')
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
        <span className="group relative inline-flex">
          <AdminButton type="button" variant="ghost" aria-label="管理台账说明" aria-describedby="subsite-ledger-tip">
            <IconInfoCircle size={16} />
          </AdminButton>
          <span id="subsite-ledger-tip" role="tooltip" className="invisible absolute left-0 top-full z-50 w-80 max-w-[calc(100vw-2rem)] pt-2 group-hover:visible group-focus-within:visible sm:left-auto sm:right-0">
            <span className="block rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-xs leading-5 text-[#53554d] shadow-lg dark:border-[#34414f] dark:bg-[#10161f] dark:text-gray-300">
              管理台账与线上配置分开维护。修改或归档不自动改变公开目录、DNS、部署、登录白名单和燃币计费；“已接入”是人工登记状态，不代表实时健康检查。
            </span>
          </span>
        </span>
        <AdminButton href="https://2aran.com/sites" target="_blank" rel="noreferrer">公开目录 ↗</AdminButton>
        <AdminButton disabled={loading || saving} onClick={() => { if (discardAllowed()) { setNotice(''); refresh() } }}>刷新</AdminButton>
        <AdminButton variant="primary" disabled={disabled} onClick={() => choose(null)}>登记站点</AdminButton>
      </>}>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {data?.readOnly && <p role="status" className="mb-4 text-sm text-amber-700 dark:text-amber-300">{data.message}</p>}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="全部子域" value={data ? sites.length - 1 : '—'} sub={data ? `公开 ${sites.filter((site) => site.id !== 'main' && site.audience === 'public').length} · 内部 / 受控 ${sites.filter((site) => site.id !== 'main' && site.audience === 'private').length}` : '不含主站关系锚点'} />
        <StatCard label="运营中" value={data ? sites.filter((site) => site.id !== 'main' && site.status === 'active').length : '—'} tone="success" />
        <StatCard label="已接入关系" value={data ? relations.filter((edge) => edge.status === 'active').length : '—'} tone="info" />
        <StatCard label="待接入关系" value={data ? relations.filter((edge) => edge.status === 'planned').length : '—'} tone="warning" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SubsiteDirectory
          loading={loading} data={data} sites={sites} relations={relations} visible={visible}
          selectedId={selectedId} saving={saving} query={query} setQuery={setQuery}
          statusFilter={filter} setStatusFilter={setFilter}
          audienceFilter={audienceFilter} setAudienceFilter={setAudienceFilter}
          onChoose={choose}
        />

        <div className="min-w-0 space-y-5">
          {!form ? <Section title="站点资料与关系"><EmptyState title="选择一个二级站点" description="左侧选择已有站点，或登记新站点。主站作为只读的归属和服务提供方。" /></Section> : <>
            <SiteHeader site={form} creating={creating} panel={panel} setPanel={setPanel} />
            {(creating || panel === 'details') ? <Section title={creating ? '登记新站点' : '站点资料'} description={creating ? '先登记基本资料，保存后即可维护站点关系。' : '站点标识保存后固定；归档会保留历史资料与关系。'}>
              <SiteEditor form={form} creating={creating} disabled={disabled} saving={saving} onEdit={edit} onSubmit={saveSite} />
            </Section> : null}
            {!creating && panel === 'relations' ? <Section title="关系管理" description="查看当前站点提供或依赖的账号、燃币、部署、内容与服务。">
              <RelationPanel
                sites={sites} edges={edges} selectedId={selectedId} relation={relation}
                editing={editingRelation} disabled={disabled} saving={saving} name={name}
                onEdit={(next) => {
                  if (editingRelation && relationKey(next) !== relationKey(relation) && !window.confirm('放弃当前未保存的关系编辑？')) return
                  setRelation({ ...next }); setEditingRelation(true)
                }}
                onSelectSource={(source) => choose(sites.find((site) => site.id === source))}
                onDelete={async (edge) => {
                  if (!window.confirm(`确认移除「${name(edge.source)} → ${name(edge.target)}」关系？仅删除台账记录。`)) return
                  if (await save({ type: 'delete-relation', key: relationKey(edge) })) { setRelation({ ...blankRelation }); setEditingRelation(false) }
                }}
                onCancel={() => { setRelation({ ...blankRelation }); setEditingRelation(false) }}
                onSubmit={saveRelation}
              />
            </Section> : null}
          </>}
          <p className="text-xs leading-6 text-[#82847a] dark:text-gray-500">运行配置可在 <Link href="/admin/cloudflare-personal-site-map" className="underline">站点架构</Link> 核对；服务凭证统一在 <Link href="/admin/integrations" className="underline">集成密钥</Link> 管理。</p>
        </div>
      </div>
    </AdminPage>
  )
}
