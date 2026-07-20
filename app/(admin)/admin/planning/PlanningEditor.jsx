'use client'

import { useMemo, useRef, useState } from 'react'
import { IconAlertTriangle, IconX } from '@tabler/icons-react'

import { AdminButton } from '../../components/ui'
import {
  buildInitialPlanningForm,
  buildPlanningPayload,
  validatePlanningEditor,
} from './planningUi'
import usePlanningModal from './planningModalFocus'

const ENTITY_LABELS = {
  direction: '方向',
  'project-profile': '项目规划资料',
  milestone: '里程碑',
  task: '任务',
  event: '历史事件',
  decision: '决策',
  dependency: '依赖关系',
}
const STATUS_OPTIONS = {
  direction: [['planned', '待规划'], ['active', '进行中'], ['paused', '已暂停'], ['completed', '已完成'], ['archived', '已归档']],
  'project-profile': [['active', '进行中'], ['paused', '已暂停'], ['archived', '已归档']],
  milestone: [['planned', '待规划'], ['active', '进行中'], ['blocked', '受阻'], ['completed', '已完成'], ['cancelled', '已取消'], ['archived', '已归档']],
  task: [['planned', '待规划'], ['doing', '处理中'], ['blocked', '受阻'], ['done', '已完成'], ['cancelled', '已取消'], ['archived', '已归档']],
  decision: [['open', '待决策'], ['decided', '已决策'], ['superseded', '已替代']],
}
const DEFAULT_STATUS = { direction: 'planned', 'project-profile': 'active', milestone: 'planned', task: 'planned', decision: 'open' }
const PRIORITIES = [['critical', '关键'], ['high', '高'], ['normal', '普通'], ['low', '低']]
const EVENT_TYPES = [
  ['created', '创建'], ['started', '开始'], ['blocked', '阻塞'], ['completed', '完成'],
  ['cancelled', '取消'], ['decision', '决策'], ['review', '复盘'], ['note', '备注'], ['imported', '导入'], ['corrected', '更正'],
]

function fieldClass() {
  return 'mt-1.5 w-full rounded-lg border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-ink)] outline-none focus:border-[var(--admin-focus)]'
}

function Field({ label, name, required = false, children }) {
  return (
    <label className="block text-sm font-medium text-[var(--admin-ink)]" htmlFor={`planning-editor-${name}`}>
      {label}{required ? <span aria-hidden="true"> *</span> : null}
      {children}
    </label>
  )
}

function TextInput({ label, name, value, onChange, required = false, type = 'text' }) {
  return (
    <Field label={label} name={name} required={required}>
      <input id={`planning-editor-${name}`} name={name} type={type} value={value || ''} required={required} className={fieldClass()} onChange={onChange} />
    </Field>
  )
}

function TextArea({ label, name, value, onChange, required = false, rows = 3 }) {
  return (
    <Field label={label} name={name} required={required}>
      <textarea id={`planning-editor-${name}`} name={name} value={value || ''} required={required} rows={rows} className={fieldClass()} onChange={onChange} />
    </Field>
  )
}

function SelectField({ label, name, value, onChange, options, required = false, emptyLabel, disabled = false }) {
  return (
    <Field label={label} name={name} required={required}>
      <select id={`planning-editor-${name}`} name={name} value={value || ''} required={required} disabled={disabled} className={fieldClass()} onChange={onChange}>
        {emptyLabel != null ? <option value="">{emptyLabel}</option> : null}
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </Field>
  )
}

function errorCopy(error) {
  const messages = {
    DB_UNAVAILABLE: '规划数据暂时不可用，输入已保留，请稍后重试。',
    TITLE_REQUIRED: '请填写标题。',
    MILESTONE_REQUIRED: '请选择所属里程碑。',
    PROJECT_REQUIRED: '请选择所属项目。',
    DIRECTION_REQUIRED: '请选择所属方向。',
    TARGET_BEFORE_START: '目标日期不能早于开始日期。',
    CONCLUSION_REQUIRED: '已决策记录必须填写最终结论。',
    MILESTONE_HAS_OPEN_TASKS: '这个里程碑仍有未完成任务，暂时不能标记为完成。',
    DEPENDENCY_CYCLE: '这条依赖会形成循环，请调整前置事项。',
    DEPENDENCY_TYPE_MISMATCH: '依赖关系只能连接两个里程碑或两个任务。',
    DEPENDENCY_SELF_LINK: '不能让规划事项依赖自身。',
    DEPENDENCY_ENDPOINT_NOT_FOUND: '依赖事项已不存在或已归档，请重新选择。',
    WRITE_CONFLICT: '记录已在别处更新，请保留输入并刷新后重试。',
  }
  return messages[error?.code] || error?.message || '保存失败，输入已保留，请重试。'
}

export default function PlanningEditor({
  mode,
  entity,
  initialValue = {},
  context = {},
  snapshot,
  backgroundRef,
  onSave,
  onClose,
  onOpenTree,
}) {
  const [form, setForm] = useState(() => ({
    status: DEFAULT_STATUS[entity] || '',
    priority: 'normal',
    eventType: 'note',
    entityType: context.entityType || 'milestone',
    ...buildInitialPlanningForm(entity, initialValue, context, snapshot),
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const dialogRef = useRef(null)
  const initialFocusRef = useRef(null)

  usePlanningModal({ dialogRef, initialFocusRef, backgroundRef, onClose, canClose: !saving })

  const projects = useMemo(
    () => (snapshot.projects || []).filter((item) => !form.directionId || item.directionId === form.directionId),
    [form.directionId, snapshot.projects],
  )
  const milestones = useMemo(
    () => (snapshot.milestones || []).filter((item) => (
      (!form.directionId || item.directionId === form.directionId)
      && (!form.projectId || item.projectId === form.projectId)
    )),
    [form.directionId, form.projectId, snapshot.milestones],
  )
  const profileProjects = useMemo(() => {
    const linkedProjectIds = new Set((snapshot.projects || []).map((item) => item.projectId))
    return (snapshot.projectCatalog || []).filter((item) => (
      item.id === form.projectId || !linkedProjectIds.has(item.id)
    ))
  }, [form.projectId, snapshot.projectCatalog, snapshot.projects])
  const dependencyItems = useMemo(
    () => form.fromType === 'task' ? (snapshot.tasks || []) : (snapshot.milestones || []),
    [form.fromType, snapshot.milestones, snapshot.tasks],
  )
  const dependencyOptions = useMemo(() => dependencyItems.map((item) => {
    const milestone = form.fromType === 'task'
      ? (snapshot.milestones || []).find((candidate) => candidate.id === item.milestoneId)
      : item
    const project = (snapshot.projects || []).find((candidate) => candidate.projectId === milestone?.projectId)
    return [item.id, `${project?.name ? `${project.name} · ` : ''}${item.title}`]
  }), [dependencyItems, form.fromType, snapshot.milestones, snapshot.projects])
  const eventTargets = useMemo(() => {
    if (form.entityType === 'direction') return snapshot.directions || []
    if (form.entityType === 'project') return snapshot.projects || []
    if (form.entityType === 'milestone') return snapshot.milestones || []
    if (form.entityType === 'task') return snapshot.tasks || []
    if (form.entityType === 'decision') return snapshot.decisions || []
    return []
  }, [form.entityType, snapshot])

  function change(event) {
    const { checked, name, type, value } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setError(null)
    setForm((current) => {
      const next = { ...current, [name]: nextValue }
      if (name === 'directionId' && entity !== 'project-profile') return { ...next, projectId: '', milestoneId: '' }
      if (name === 'projectId') return { ...next, milestoneId: '' }
      if (name === 'entityType') return { ...next, entityId: '' }
      if (name === 'fromType') return { ...next, fromId: '', toType: nextValue, toId: '' }
      if (name === 'fromId' && current.toId === nextValue) return { ...next, toId: '' }
      return next
    })
  }

  async function submit(event) {
    event.preventDefault()
    const validationError = validatePlanningEditor(entity, form)
    if (validationError) {
      setError({ message: validationError })
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(buildPlanningPayload(entity, form))
    } catch (saveError) {
      setError(saveError)
    } finally {
      setSaving(false)
    }
  }

  const isWorkItem = entity === 'direction' || entity === 'milestone' || entity === 'task'
  const title = entity === 'project-profile' && mode !== 'edit'
    ? '关联项目'
    : entity === 'dependency'
      ? '添加依赖关系'
      : `${mode === 'edit' ? '编辑' : '新建'}${ENTITY_LABELS[entity] || '规划记录'}`
  const openTaskIds = Array.isArray(error?.openTaskIds) ? error.openTaskIds : []

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="planning-editor-title">
      <button type="button" tabIndex={-1} className="absolute inset-0 hidden bg-black/35 sm:block" aria-label="关闭编辑器遮罩" onClick={saving ? undefined : onClose} />
      <section className="fixed inset-0 flex w-full flex-col overflow-hidden bg-[var(--admin-surface)] shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-w-xl">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
          <div>
            <p className="m-0 text-xs text-[var(--admin-muted)]">{mode === 'edit' ? '更新规划正本' : '添加到规划正本'}</p>
            <h2 id="planning-editor-title" className="m-0 mt-1 font-serif text-xl font-semibold">{title}</h2>
          </div>
          <button ref={initialFocusRef} type="button" aria-label="关闭编辑器" className="rounded-lg border p-2 transition hover:bg-[var(--admin-surface-subtle)]" disabled={saving} onClick={onClose}>
            <IconX size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {entity === 'project-profile' ? (
              <>
                <SelectField
                  label="所属方向"
                  name="directionId"
                  value={form.directionId}
                  onChange={change}
                  required
                  emptyLabel="请选择方向"
                  options={(snapshot.directions || []).map((item) => [item.id, item.title])}
                />
                <SelectField
                  label="项目台账记录"
                  name="projectId"
                  value={form.projectId}
                  onChange={change}
                  required
                  disabled={mode === 'edit'}
                  emptyLabel="请选择尚未关联的项目"
                  options={profileProjects.map((item) => [item.id, item.name || item.id])}
                />
              </>
            ) : null}
            {entity === 'milestone' || entity === 'task' || entity === 'decision' ? (
              <SelectField
                label="所属方向"
                name="directionId"
                value={form.directionId}
                onChange={change}
                required={entity === 'milestone' || entity === 'task'}
                emptyLabel={entity === 'decision' ? '不关联方向' : '请选择方向'}
                options={(snapshot.directions || []).map((item) => [item.id, item.title])}
              />
            ) : null}
            {entity === 'milestone' || entity === 'task' || entity === 'decision' ? (
              <SelectField
                label="所属项目"
                name="projectId"
                value={form.projectId}
                onChange={change}
                required={entity === 'milestone' || entity === 'task'}
                emptyLabel={entity === 'decision' ? '不关联项目' : '请选择项目'}
                options={projects.map((item) => [item.projectId, item.name || item.projectId])}
              />
            ) : null}
            {entity === 'task' || entity === 'decision' ? (
              <SelectField
                label="所属里程碑"
                name="milestoneId"
                value={form.milestoneId}
                onChange={change}
                required={entity === 'task'}
                emptyLabel={entity === 'decision' ? '不关联里程碑' : '请选择里程碑'}
                options={milestones.map((item) => [item.id, item.title])}
              />
            ) : null}
            {entity === 'event' ? (
              <>
                <SelectField label="关联类型" name="entityType" value={form.entityType} onChange={change} required options={[
                  ['direction', '方向'], ['project', '项目'], ['milestone', '里程碑'], ['task', '任务'], ['decision', '决策'],
                ]} />
                <SelectField
                  label="关联记录"
                  name="entityId"
                  value={form.entityId}
                  onChange={change}
                  required
                  emptyLabel="请选择关联记录"
                  options={eventTargets.map((item) => [form.entityType === 'project' ? item.projectId : item.id, item.title || item.name || item.projectId || item.id])}
                />
              </>
            ) : null}

            {entity === 'dependency' ? (
              <>
                <SelectField
                  label="依赖事项类型"
                  name="fromType"
                  value={form.fromType}
                  onChange={change}
                  disabled={Boolean(context.fromId)}
                  options={[["milestone", '里程碑'], ["task", '任务']]}
                />
                <SelectField
                  label="需要等待的事项"
                  name="fromId"
                  value={form.fromId}
                  onChange={change}
                  disabled={Boolean(context.fromId)}
                  required
                  emptyLabel="请选择需要等待的事项"
                  options={dependencyOptions}
                />
                <SelectField
                  label="前置事项"
                  name="toId"
                  value={form.toId}
                  onChange={change}
                  required
                  emptyLabel="请选择前置事项"
                  options={dependencyOptions.filter(([id]) => id !== form.fromId)}
                />
              </>
            ) : null}

            {entity !== 'project-profile' && entity !== 'dependency' ? <TextInput label="标题" name="title" value={form.title} onChange={change} required /> : null}
            {entity === 'direction' ? <TextArea label="方向愿景" name="description" value={form.description} onChange={change} /> : null}
            {entity === 'direction' ? <TextArea label="本期北极星" name="northStar" value={form.northStar} onChange={change} /> : null}
            {entity === 'project-profile' ? <TextArea label="规划摘要" name="summary" value={form.summary} onChange={change} /> : null}
            {entity === 'milestone' || entity === 'task' || entity === 'event' || entity === 'dependency' ? <TextArea label="说明" name="description" value={form.description} onChange={change} /> : null}
            {entity === 'milestone' ? <TextArea label="成功标准" name="successCriteria" value={form.successCriteria} onChange={change} /> : null}
            {entity === 'task' ? <TextInput label="负责人" name="assignee" value={form.assignee} onChange={change} /> : null}
            {entity === 'task' ? <TextArea label="备注" name="note" value={form.note} onChange={change} /> : null}
            {entity === 'task' && form.status === 'blocked' ? <TextArea label="阻塞原因" name="blockedReason" value={form.blockedReason} onChange={change} required /> : null}
            {entity === 'event' ? <SelectField label="事件类型" name="eventType" value={form.eventType} onChange={change} options={EVENT_TYPES} /> : null}
            {entity === 'decision' ? <TextArea label="背景与问题" name="context" value={form.context} onChange={change} /> : null}
            {entity === 'decision' ? <TextArea label="最终结论" name="conclusion" value={form.conclusion} onChange={change} required={form.status === 'decided'} /> : null}
            {entity === 'decision' ? <TextArea label="判断理由" name="rationale" value={form.rationale} onChange={change} /> : null}
            {entity === 'decision' ? <TextArea label="影响范围" name="impact" value={form.impact} onChange={change} /> : null}

            {entity === 'project-profile' ? <SelectField label="规划状态" name="planningStatus" value={form.planningStatus} onChange={change} options={STATUS_OPTIONS[entity]} /> : null}
            {entity !== 'project-profile' && STATUS_OPTIONS[entity] ? <SelectField label="状态" name="status" value={form.status} onChange={change} options={STATUS_OPTIONS[entity]} /> : null}
            {isWorkItem ? <SelectField label="优先级" name="priority" value={form.priority} onChange={change} options={PRIORITIES} /> : null}
            {entity === 'project-profile' ? (
              <label className="flex items-center gap-2 text-sm font-medium" htmlFor="planning-editor-isFocus">
                <input id="planning-editor-isFocus" name="isFocus" type="checkbox" checked={Boolean(form.isFocus)} onChange={change} />
                设为当前焦点项目
              </label>
            ) : null}

            {entity === 'task' ? <TextInput label="计划日期" name="plannedAt" value={form.plannedAt} onChange={change} type="date" /> : null}
            {isWorkItem || entity === 'project-profile' ? <TextInput label="开始日期" name="startAt" value={form.startAt} onChange={change} type="date" /> : null}
            {isWorkItem || entity === 'project-profile' ? <TextInput label="目标日期" name="targetAt" value={form.targetAt} onChange={change} type="date" /> : null}
            {isWorkItem ? <TextInput label="完成日期" name="completedAt" value={form.completedAt} onChange={change} type="date" /> : null}
            {entity === 'event' ? <TextInput label="发生日期" name="occurredAt" value={form.occurredAt} onChange={change} type="date" /> : null}
            {entity === 'decision' ? <TextInput label="决策日期" name="decidedAt" value={form.decidedAt} onChange={change} type="date" /> : null}

            {error ? (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                <div className="flex items-start gap-2">
                  <IconAlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="m-0 font-medium">{errorCopy(error)}</p>
                    {openTaskIds.length ? (
                      <>
                        <p className="mb-0 mt-2 text-xs">未完成任务：{openTaskIds.join('、')}</p>
                        <AdminButton type="button" size="sm" className="mt-3" onClick={onOpenTree}>前往规划树处理</AdminButton>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="flex justify-end gap-2 border-t px-4 py-4 sm:px-6">
            <AdminButton type="button" disabled={saving} onClick={onClose}>取消</AdminButton>
            <AdminButton type="submit" variant="primary" disabled={saving}>{saving ? '保存中…' : '保存'}</AdminButton>
          </footer>
        </form>
      </section>
    </div>
  )
}
