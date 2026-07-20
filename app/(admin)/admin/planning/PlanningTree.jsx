'use client'

import { useMemo, useState } from 'react'
import { IconChevronDown, IconChevronRight, IconGitBranch } from '@tabler/icons-react'

import { AdminButton, EmptyState, StatusPill } from '../../components/ui'
import {
  PLANNING_STATUS_META,
  buildPlanningTree,
  formatPlanningDate,
} from './planningUi'

const PRIORITY_LABELS = { critical: '关键', high: '高', normal: '普通', low: '低' }

function TreeNode({ node, depth, expanded, onToggle, onEdit, onArchive, onCreate, onLinkProject, onCreateDependency }) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const status = PLANNING_STATUS_META[node.status] || { label: node.status || '未设置', tone: 'neutral' }
  const controlsId = `planning-tree-children-${node.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  return (
    <li>
      <article className="rounded-xl border bg-[var(--admin-surface)] p-3" style={{ marginLeft: `${Math.min(depth, 3) * 16}px` }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            {hasChildren ? (
              <button
                type="button"
                className="mt-0.5 rounded p-1 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-subtle)] hover:text-[var(--admin-ink)]"
                aria-label={`${isExpanded ? '收起' : '展开'}${node.title}`}
                aria-expanded={isExpanded}
                aria-controls={controlsId}
                onClick={() => onToggle(node.id)}
              >
                {isExpanded ? <IconChevronDown size={17} aria-hidden="true" /> : <IconChevronRight size={17} aria-hidden="true" />}
              </button>
            ) : <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--admin-muted)]" aria-hidden="true" />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-sm font-semibold leading-6">{node.title}</h3>
                <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
              </div>
              <p className="mb-0 mt-1 text-xs text-[var(--admin-muted)]">
                优先级 {PRIORITY_LABELS[node.priority] || node.priority || '普通'} · 目标 {formatPlanningDate(node.targetAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:justify-end">
            {node.entityType === 'direction' ? <AdminButton type="button" size="sm" variant="ghost" onClick={() => onLinkProject(node)}>关联项目</AdminButton> : null}
            {node.entityType === 'project-profile' ? <AdminButton type="button" size="sm" variant="ghost" onClick={() => onCreate('milestone', { directionId: node.directionId, projectId: node.projectId })}>添加里程碑</AdminButton> : null}
            {node.entityType === 'milestone' ? <AdminButton type="button" size="sm" variant="ghost" onClick={() => onCreate('task', { directionId: node.directionId, projectId: node.projectId, milestoneId: node.id })}>添加任务</AdminButton> : null}
            {node.entityType === 'milestone' || node.entityType === 'task' ? <AdminButton type="button" size="sm" variant="ghost" onClick={() => onCreateDependency(node)}>添加依赖</AdminButton> : null}
            <AdminButton type="button" size="sm" variant="ghost" onClick={() => onEdit(node)}>编辑</AdminButton>
            <AdminButton type="button" size="sm" variant="danger" onClick={() => onArchive(node)}>归档</AdminButton>
          </div>
        </div>
      </article>
      {hasChildren && isExpanded ? (
        <ul id={controlsId} className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onArchive={onArchive}
              onCreate={onCreate}
              onLinkProject={onLinkProject}
              onCreateDependency={onCreateDependency}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export default function PlanningTree({ snapshot, onEdit, onArchive, onCreate, onLinkProject, onCreateDependency }) {
  const [showArchived, setShowArchived] = useState(false)
  const tree = useMemo(() => buildPlanningTree(snapshot, { showArchived }), [showArchived, snapshot])
  const [expanded, setExpanded] = useState(() => new Set((snapshot.directions || []).map((item) => item.id)))

  function toggle(id) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="rounded-2xl border bg-[var(--admin-surface)] p-4 sm:p-5" aria-labelledby="planning-tree-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="planning-tree-title" className="m-0 font-serif text-lg font-semibold">方向到任务的规划树</h2>
          <p className="mb-0 mt-1 text-xs leading-5 text-[var(--admin-muted)]">项目节点引用项目台账；移动节点只更新它的规划方向。</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--admin-muted)]">
          <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
          显示已归档
        </label>
      </div>

      {tree.length ? (
        <ul className="mt-5 space-y-3">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              onEdit={onEdit}
              onArchive={onArchive}
              onCreate={onCreate}
              onLinkProject={onLinkProject}
              onCreateDependency={onCreateDependency}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={IconGitBranch}
          title="还没有规划树"
          description="先添加一个方向，再从方向节点关联项目。"
          action={<AdminButton type="button" variant="primary" onClick={() => onCreate('direction')}>添加方向</AdminButton>}
        />
      )}
    </section>
  )
}
