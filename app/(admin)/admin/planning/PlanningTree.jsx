'use client'

import { useMemo, useState } from 'react'
import {
  IconArchive,
  IconChevronDown,
  IconChevronRight,
  IconGitBranch,
  IconLink,
  IconPencil,
  IconPlus,
} from '@tabler/icons-react'

import { AdminButton, EmptyState, StatusPill } from '../../components/ui'
import {
  PLANNING_STATUS_META,
  buildPlanningTree,
  formatPlanningDate,
  planningNodeCapabilities,
} from './planningUi'

const PRIORITY_LABELS = { critical: '关键', high: '高', normal: '普通', low: '低' }
const NODE_META = {
  direction: { label: '方向', childLabel: '项目' },
  'project-profile': { label: '项目', childLabel: '里程碑' },
  milestone: { label: '里程碑', childLabel: '任务' },
  task: { label: '任务', childLabel: '' },
}

function NodeAction({ children, icon: Icon, ...props }) {
  return (
    <AdminButton type="button" size="sm" variant="ghost" {...props}>
      <Icon size={15} aria-hidden="true" />
      {children}
    </AdminButton>
  )
}

function TreeNode({ node, depth, expanded, onToggle, onEdit, onArchive, onCreate, onLinkProject, onCreateDependency }) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const status = PLANNING_STATUS_META[node.status] || { label: node.status || '未设置', tone: 'neutral' }
  const capabilities = planningNodeCapabilities(node)
  const nodeMeta = NODE_META[node.entityType] || { label: '事项', childLabel: '子项' }
  const targetDate = formatPlanningDate(node.targetAt)
  const controlsId = `planning-tree-children-${node.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  return (
    <li className="relative">
      <article className={[
        'group rounded-xl border px-3 py-3 transition-colors sm:px-4',
        depth === 0
          ? 'border-[var(--admin-line)] bg-[var(--admin-surface-subtle)]'
          : 'border-[var(--admin-line-soft)] bg-[var(--admin-surface)] hover:border-[var(--admin-line)]',
        node.effectivelyArchived ? 'opacity-60' : '',
      ].join(' ')}>
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            {hasChildren ? (
              <button
                type="button"
                className="mt-0.5 rounded-md border border-[var(--admin-line-soft)] bg-[var(--admin-surface)] p-1 text-[var(--admin-muted)] transition hover:border-[var(--admin-line)] hover:text-[var(--admin-ink)]"
                aria-label={`${isExpanded ? '收起' : '展开'}${node.title}`}
                aria-expanded={isExpanded}
                aria-controls={controlsId}
                onClick={() => onToggle(node.id)}
              >
                {isExpanded ? <IconChevronDown size={17} aria-hidden="true" /> : <IconChevronRight size={17} aria-hidden="true" />}
              </button>
            ) : <span className="ml-1 mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--admin-muted)]" aria-hidden="true" />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--admin-surface)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--admin-muted)] ring-1 ring-inset ring-[var(--admin-line-soft)]">
                  {nodeMeta.label}
                </span>
                <h3 className={`${depth === 0 ? 'text-[15px]' : 'text-sm'} m-0 font-semibold leading-6`}>{node.title}</h3>
                <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--admin-muted)]">
                <span>{PRIORITY_LABELS[node.priority] || node.priority || '普通'}优先级</span>
                <span aria-hidden="true">·</span>
                <span>{targetDate === '—' ? '未设目标日期' : `目标 ${targetDate}`}</span>
                {hasChildren ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{node.children.length} 个{nodeMeta.childLabel}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-0.5 pl-8 xl:justify-end xl:pl-0">
            {capabilities.canLinkProject ? <NodeAction icon={IconLink} onClick={() => onLinkProject(node)}>关联项目</NodeAction> : null}
            {capabilities.canAddMilestone ? <NodeAction icon={IconPlus} onClick={() => onCreate('milestone', { directionId: node.directionId, projectId: node.projectId })}>添加里程碑</NodeAction> : null}
            {capabilities.canAddTask ? <NodeAction icon={IconPlus} onClick={() => onCreate('task', { directionId: node.directionId, projectId: node.projectId, milestoneId: node.id })}>添加任务</NodeAction> : null}
            {capabilities.canAddDependency ? <NodeAction icon={IconGitBranch} onClick={() => onCreateDependency(node)}>添加依赖</NodeAction> : null}
            <NodeAction icon={IconPencil} onClick={() => onEdit(node)}>编辑</NodeAction>
            <AdminButton type="button" size="sm" variant="ghost" className="text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40" onClick={() => onArchive(node)}>
              <IconArchive size={15} aria-hidden="true" />
              归档
            </AdminButton>
          </div>
        </div>
      </article>
      {hasChildren && isExpanded ? (
        <ul id={controlsId} className="ml-4 mt-2 space-y-2 border-l-2 border-[var(--admin-line-soft)] pl-3 sm:ml-5 sm:pl-4">
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

  function allExpandableIds(nodes) {
    return nodes.flatMap((node) => (node.children.length ? [node.id, ...allExpandableIds(node.children)] : []))
  }

  function expandAll() {
    setExpanded(new Set(allExpandableIds(tree)))
  }

  return (
    <section className="rounded-2xl border bg-[var(--admin-surface)] p-4 sm:p-5" aria-labelledby="planning-tree-title">
      <div className="flex max-w-6xl flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="planning-tree-title" className="m-0 font-serif text-lg font-semibold">规划结构</h2>
          <p className="mb-0 mt-1 text-xs leading-5 text-[var(--admin-muted)]">按“方向 → 项目 → 里程碑 → 任务”逐层拆解，点击箭头查看下一级。</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <AdminButton type="button" size="sm" variant="ghost" onClick={expandAll}>全部展开</AdminButton>
          <AdminButton type="button" size="sm" variant="ghost" onClick={() => setExpanded(new Set())}>全部收起</AdminButton>
          <label className="ml-1 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--admin-line-soft)] px-2.5 py-1.5 text-xs text-[var(--admin-muted)]">
            <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
            显示已归档
          </label>
        </div>
      </div>

      {tree.length ? (
        <ul className="mt-5 max-w-6xl space-y-4">
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
