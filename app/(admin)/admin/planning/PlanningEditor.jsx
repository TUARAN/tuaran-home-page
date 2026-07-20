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
  milestone: '里程碑',
  task: '任务',
  event: '历史事件',
  decision: '决策',
}
const STATUS_OPTIONS = {
  direction: [['planned', '待规划'], ['active', '进行中'], ['paused', '已暂停'], ['completed', '已完成'], ['archived', '已归档']],
  milestone: [['planned', '待规划'], ['active', '进行中'], ['blocked', '受阻'], ['completed', '已完成'], ['cancelled', '已取消'], ['archived', '已归档']],
  task: [['planned', '待规划'], ['doing', '处理中'], ['blocked', '受阻'], ['done', '已完成'], ['cancelled', '已取消'], ['archived', '已归档']],
  decision: [['open', '待决策'], ['decided', '已决策'], ['superseded', '已替代']],
}
const DEFAULT_STATUS = { direction: 'planned', milestone: 'planned', task: 'planned', decision: 'open' }
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

function SelectField({ label, name, value, onChange, options, required = false, emptyLabel }) {
  return (
    <Field label={label} name={name} required={required}>
      <select id={`planning-editor-${name}`} name={name} value={value || ''} required={required} className={fieldClass()} onChange={onChange}>
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
  const eventTargets = useMemo(() => {
    if (form.entityType === 'direction') return snapshot.directions || []
    if (form.entityType === 'project') return snapshot.projects || []
    if (form.entityType === 'milestone') return snapshot.milestones || []
    if (form.entityType === 'task') return snapshot.tasks || []
    if (form.entityType === 'decision') return snapshot.decisions || []
    return []
  }, [form.entityType, snapshot])

  function change(event) {
    const { name, value } = event.target
    setError(null)
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'directionId') return { ...next, projectId: '', milestoneId: '' }
      if (name === 'projectId') return { ...next, milestoneId: '' }
      if (name === 'entityType') return { ...next, entityId: '' }
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
  const title = `${mode === 'edit' ? '编辑' : '新建'}${ENTITY_LABELS[entity] || '规划记录'}`
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

            <TextInput label="标题" name="title" value={form.title} onChange={change} required />
            {entity === 'direction' ? <TextArea label="方向愿景" name="description" value={form.description} onChange={change} /> : null}
            {entity === 'direction' ? <TextArea label="本期北极星" name="northStar" value={form.northStar} onChange={change} /> : null}
            {entity === 'milestone' || entity === 'task' || entity === 'event' ? <TextArea label="说明" name="description" value={form.description} onChange={change} /> : null}
            {entity === 'milestone' ? <TextArea label="成功标准" name="successCriteria" value={form.successCriteria} onChange={change} /> : null}
            {entity === 'task' ? <TextInput label="负责人" name="assignee" value={form.assignee} onChange={change} /> : null}
            {entity === 'task' ? <TextArea label="备注" name="note" value={form.note} onChange={change} /> : null}
            {entity === 'task' && form.status === 'blocked' ? <TextArea label="阻塞原因" name="blockedReason" value={form.blockedReason} onChange={change} required /> : null}
            {entity === 'event' ? <SelectField label="事件类型" name="eventType" value={form.eventType} onChange={change} options={EVENT_TYPES} /> : null}
            {entity === 'decision' ? <TextArea label="背景与问题" name="context" value={form.context} onChange={change} /> : null}
            {entity === 'decision' ? <TextArea label="最终结论" name="conclusion" value={form.conclusion} onChange={change} required={form.status === 'decided'} /> : null}
            {entity === 'decision' ? <TextArea label="判断理由" name="rationale" value={form.rationale} onChange={change} /> : null}
            {entity === 'decision' ? <TextArea label="影响范围" name="impact" value={form.impact} onChange={change} /> : null}

            {STATUS_OPTIONS[entity] ? <SelectField label="状态" name="status" value={form.status} onChange={change} options={STATUS_OPTIONS[entity]} /> : null}
            {isWorkItem ? <SelectField label="优先级" name="priority" value={form.priority} onChange={change} options={PRIORITIES} /> : null}

            {entity === 'task' ? <TextInput label="计划日期" name="plannedAt" value={form.plannedAt} onChange={change} type="date" /> : null}
            {isWorkItem ? <TextInput label="开始日期" name="startAt" value={form.startAt} onChange={change} type="date" /> : null}
            {isWorkItem ? <TextInput label="目标日期" name="targetAt" value={form.targetAt} onChange={change} type="date" /> : null}
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
