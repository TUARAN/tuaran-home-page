'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  VAULT_TYPE_LABEL,
  groupVaultRecords,
  maskSecret,
  parseVaultNotes,
  securitySummary,
} from '../../../../lib/admin/informationVaultDisplay'
import { decryptPayload } from '../../../../lib/longCompass/crypto'
import { AdminPage, Section } from '../../components/ui'

function normalizePlain(value) {
  return {
    type: value?.type === 'apple-id' ? 'apple-id' : 'account',
    label: String(value?.label || ''),
    account: String(value?.account || ''),
    password: String(value?.password || ''),
    securityAnswers: {
      friend: String(value?.securityAnswers?.friend || ''),
      work: String(value?.securityAnswers?.work || ''),
      parents: String(value?.securityAnswers?.parents || ''),
    },
    birthday: String(value?.birthday || ''),
    notes: String(value?.notes || ''),
    schemaVersion: 1,
  }
}

const INPUT_CLASS =
  'w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100'

const TH_CLASS =
  'whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[#67695d] dark:text-gray-400'

const TD_CLASS = 'align-top px-3 py-2.5 text-sm text-[#15140f] dark:text-gray-100'

export default function InformationConsole() {
  const [encryptedItems, setEncryptedItems] = useState([])
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [revealSecrets, setRevealSecrets] = useState(false)
  const [query, setQuery] = useState('')
  const [recordView, setRecordView] = useState('active')

  const archivedCount = records.filter((record) => record.archivedAt != null).length
  const viewCount = recordView === 'archived' ? archivedCount : records.length - archivedCount

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return records.filter((record) => {
      if ((record.archivedAt != null) !== (recordView === 'archived')) return false
      if (!normalizedQuery) return true
      const plain = record.plain
      const searchableValues = [
        plain.label,
        plain.account,
        plain.birthday,
        plain.notes,
        plain.securityAnswers.friend,
        plain.securityAnswers.work,
        plain.securityAnswers.parents,
      ]
      return searchableValues.some((value) => String(value || '').toLocaleLowerCase().includes(normalizedQuery))
    })
  }, [query, records, recordView])

  const grouped = useMemo(() => groupVaultRecords(filteredRecords), [filteredRecords])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/information', { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok || data?.status !== 'ok') throw new Error(data?.message || data?.error || `HTTP_${res.status}`)
      setEncryptedItems(Array.isArray(data.items) ? data.items : [])
      setStatus('ok')
    } catch (error) {
      setStatus('error')
      setMessage(String(error?.message || error))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function unlock(event) {
    event.preventDefault()
    const candidate = passwordInput.trim()
    if (!candidate || busy) return
    setBusy(true)
    setMessage('')
    try {
      const decrypted = []
      for (const item of encryptedItems) {
        decrypted.push({ ...item, plain: normalizePlain(await decryptPayload(item.payload, candidate)) })
      }
      setRecords(decrypted)
      setPasswordInput('')
      setUnlocked(true)
    } catch {
      setMessage('口令错误，无法解密信息库。')
    } finally {
      setBusy(false)
    }
  }

  async function changeArchive(record) {
    if (busy) return
    const action = record.archivedAt != null ? 'restore' : 'archive'
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/information', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, action }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.message || data?.error || `HTTP_${res.status}`)
      const updateItems = (current) => current.map((item) =>
        item.id === record.id ? { ...item, archivedAt: data.archivedAt, updatedAt: data.updatedAt } : item
      )
      setRecords(updateItems)
      setEncryptedItems(updateItems)
      setMessage(action === 'archive' ? '记录已归档，可在「已归档」中恢复或删除。' : '记录已恢复到「未归档」。')
    } catch (error) {
      setMessage(`操作失败：${error?.message || error}`)
    } finally {
      setBusy(false)
    }
  }

  async function remove(record) {
    if (busy) return
    if (record.archivedAt == null) {
      setMessage('请先归档记录，再删除。')
      return
    }
    if (!confirm(`删除已归档记录「${record.plain.label || record.plain.account}」？删除后无法在信息金库中恢复。`)) return
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/information?id=${encodeURIComponent(record.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.message || data?.error || `HTTP_${res.status}`)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      setEncryptedItems((current) => current.filter((item) => item.id !== record.id))
      setMessage('记录已删除。')
    } catch (error) {
      setMessage(`删除失败：${error?.message || error}`)
    } finally {
      setBusy(false)
    }
  }

  async function copy(value, label) {
    await navigator.clipboard.writeText(value)
    setMessage(`${label}已复制。`)
  }

  return (
    <AdminPage
      title="信息金库"
      description="条目由智能体经脚本写入 D1；此处只读浏览、复制与归档。账号与密码仅在当前浏览器内解密。"
    >
      {status === 'loading' ? (
        <p className="text-sm text-[#67695d] dark:text-gray-400">正在读取加密信息库…</p>
      ) : status === 'error' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          {message} 请确认已应用 <code>0053_private_information_records.sql</code> 和 <code>0084_private_information_archive.sql</code>。
        </div>
      ) : !unlocked ? (
        <Section title="解锁信息库" description={`当前共有 ${encryptedItems.length} 条密文记录。口令不会发送到服务器。`}>
          <form onSubmit={unlock} className="flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              autoComplete="current-password"
              className={INPUT_CLASS}
              placeholder={encryptedItems.length ? '输入信息库口令' : '首次使用：设置一个信息库口令'}
            />
            <button type="submit" disabled={busy || !passwordInput.trim()} className="shrink-0 rounded-lg bg-[#15140f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]">
              {busy ? '解锁中…' : encryptedItems.length ? '解锁' : '创建信息库'}
            </button>
          </form>
          {message ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{message}</p> : null}
        </Section>
      ) : (
        <Section
          title="密钥台账"
          description={query.trim()
            ? `当前视图 ${filteredRecords.length} / ${viewCount} 条；按类型分组。新增请走智能体脚本写入 D1。`
            : `共 ${records.length} 条；未归档 ${records.length - archivedCount} 条。密码默认隐藏，可先归档再删除。`}
        >
          {message ? <p role="status" className="mb-3 text-sm text-[#67695d] dark:text-gray-400">{message}</p> : null}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label="记录归档状态">
              {[['active', '未归档', records.length - archivedCount], ['archived', '已归档', archivedCount]].map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={recordView === value}
                  onClick={() => { setRecordView(value); setRevealSecrets(false) }}
                  className={`rounded-lg border px-3 py-2 text-sm ${recordView === value ? 'border-[#15140f] bg-[#15140f] text-white dark:border-gray-100 dark:bg-gray-100 dark:text-[#10161f]' : 'border-[#caccc0] dark:border-[#2d3744]'}`}
                >
                  {label}（{count}）
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRevealSecrets((current) => !current)}
              className="rounded-lg border border-[#caccc0] px-3 py-2 text-sm dark:border-[#2d3744]"
            >
              {revealSecrets ? '隐藏敏感字段' : '显示敏感字段'}
            </button>
            <label className="min-w-[12rem] flex-1 sm:max-w-md">
              <span className="sr-only">搜索信息金库记录</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={INPUT_CLASS}
                placeholder="搜索名称、账号、备注…"
                autoComplete="off"
              />
            </label>
            {query ? (
              <button type="button" onClick={() => setQuery('')} className="rounded-lg border border-[#caccc0] px-3 py-2 text-sm dark:border-[#2d3744]">
                清空
              </button>
            ) : null}
          </div>

          {records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-6 text-sm text-[#717367] dark:border-gray-700 dark:text-gray-400">暂无记录。</p>
          ) : filteredRecords.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-6 text-sm text-[#717367] dark:border-gray-700 dark:text-gray-400">
              {query.trim() ? '没有匹配的记录。' : recordView === 'archived' ? '暂无已归档记录。' : '暂无未归档记录，可切换到「已归档」查看。'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#d5d7cd] dark:border-[#252e39]">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[#f5f6f2] dark:bg-[#0f141d]">
                  <tr className="border-b border-[#d5d7cd] dark:border-[#252e39]">
                    <th className={TH_CLASS}>名称</th>
                    <th className={TH_CLASS}>登录标识</th>
                    <th className={TH_CLASS}>密码</th>
                    <th className={TH_CLASS}>辅助邮箱</th>
                    <th className={TH_CLASS}>邮箱密码</th>
                    <th className={TH_CLASS}>2FA</th>
                    <th className={TH_CLASS}>密保</th>
                    <th className={TH_CLASS}>生日</th>
                    <th className={`${TH_CLASS} min-w-[200px]`}>其他备注</th>
                    <th className={TH_CLASS}>操作</th>
                  </tr>
                </thead>
                {grouped.map((group) => (
                  <tbody key={group.type} className="divide-y divide-[#e8e9e3] dark:divide-[#1e2630]">
                    <tr className="bg-[#eeefe9] dark:bg-[#161c26]">
                      <td colSpan={11} className="px-3 py-2 text-xs font-semibold text-[#53554d] dark:text-gray-300">
                        {VAULT_TYPE_LABEL[group.type] || group.type}
                        <span className="ml-2 font-normal text-[#77796e] dark:text-gray-500">{group.records.length} 条</span>
                      </td>
                    </tr>
                    {group.records.map((record) => {
                      const plain = record.plain
                      const archived = record.archivedAt != null
                      const parsed = parseVaultNotes(plain.notes)
                      const extraText = parsed.extra.join('\n')
                      return (
                        <tr key={record.id} className="bg-white/80 dark:bg-[#10161f]">
                          <td className={TD_CLASS}>
                            <div className="font-medium">{plain.label || '—'}</div>
                            {archived ? (
                              <p className="text-xs text-[#77796e] dark:text-gray-500">
                                已归档 · {new Date(record.archivedAt).toLocaleString('zh-CN')}
                              </p>
                            ) : null}
                          </td>
                          <td className={`${TD_CLASS} max-w-[12rem] break-all font-mono text-xs`}>{plain.account}</td>
                          <td className={`${TD_CLASS} font-mono text-xs`}>{maskSecret(plain.password, revealSecrets)}</td>
                          <td className={`${TD_CLASS} max-w-[11rem] break-all text-xs`}>{parsed.recoveryEmail || '—'}</td>
                          <td className={`${TD_CLASS} font-mono text-xs`}>{maskSecret(parsed.emailPassword, revealSecrets)}</td>
                          <td className={`${TD_CLASS} max-w-[10rem] break-all font-mono text-xs`}>{maskSecret(parsed.twoFa, revealSecrets)}</td>
                          <td className={`${TD_CLASS} max-w-[9rem] break-words text-xs`}>{securitySummary(plain.securityAnswers, revealSecrets)}</td>
                          <td className={TD_CLASS}>{plain.birthday || '—'}</td>
                          <td className={TD_CLASS}>
                            {extraText ? (
                              <div className="max-h-28 max-w-sm overflow-auto whitespace-pre-wrap break-words text-xs text-[#53554d] dark:text-gray-300">
                                {extraText}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className={TD_CLASS}>
                            <div className="flex flex-col gap-1">
                              <button type="button" onClick={() => copy(plain.account, '账号')} className="rounded border border-[#caccc0] px-2 py-1 text-xs dark:border-[#2d3744]">复制账号</button>
                              <button type="button" onClick={() => copy(plain.password, '密码')} className="rounded border border-[#caccc0] px-2 py-1 text-xs dark:border-[#2d3744]">复制密码</button>
                              <button type="button" disabled={busy} onClick={() => changeArchive(record)} className="rounded border border-[#caccc0] px-2 py-1 text-xs disabled:opacity-50 dark:border-[#2d3744]">
                                {archived ? '恢复' : '归档'}
                              </button>
                              {archived ? (
                                <button type="button" disabled={busy} onClick={() => remove(record)} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300">
                                  删除
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                ))}
              </table>
            </div>
          )}
        </Section>
      )}
    </AdminPage>
  )
}