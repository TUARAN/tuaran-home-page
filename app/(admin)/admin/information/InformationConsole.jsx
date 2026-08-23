'use client'

import { useCallback, useEffect, useState } from 'react'

import { decryptPayload, encryptPayload } from '../../../../lib/longCompass/crypto'
import { AdminPage, Section } from '../../components/ui'

const EMPTY_FORM = {
  label: '',
  account: '',
  password: '',
  securityFriend: '',
  securityWork: '',
  securityParents: '',
  birthday: '',
  notes: '',
}

function normalizePlain(value) {
  return {
    type: 'apple-id',
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

function formToPlain(form) {
  return normalizePlain({
    label: form.label,
    account: form.account,
    password: form.password,
    securityAnswers: {
      friend: form.securityFriend,
      work: form.securityWork,
      parents: form.securityParents,
    },
    birthday: form.birthday,
    notes: form.notes,
  })
}

function plainToForm(plain) {
  return {
    label: plain.label,
    account: plain.account,
    password: plain.password,
    securityFriend: plain.securityAnswers.friend,
    securityWork: plain.securityAnswers.work,
    securityParents: plain.securityAnswers.parents,
    birthday: plain.birthday,
    notes: plain.notes,
  }
}

function Field({ label, children }) {
  return (
    <label className="text-sm text-[#53554d] dark:text-gray-300">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  )
}

const INPUT_CLASS =
  'w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100'

export default function InformationConsole() {
  const [encryptedItems, setEncryptedItems] = useState([])
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [vaultPassword, setVaultPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [revealedId, setRevealedId] = useState('')

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
      setVaultPassword(candidate)
      setPasswordInput('')
      setUnlocked(true)
    } catch {
      setMessage('口令错误，无法解密信息库。')
    } finally {
      setBusy(false)
    }
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function startEdit(record) {
    setEditingId(record.id)
    setForm(plainToForm(record.plain))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId('')
    setForm(EMPTY_FORM)
  }

  async function save(event) {
    event.preventDefault()
    if (!form.account.trim() || !form.password || busy) return
    setBusy(true)
    setMessage('')
    try {
      const plain = formToPlain(form)
      const payload = await encryptPayload(plain, vaultPassword)
      const res = await fetch('/api/admin/information', {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId ? { id: editingId, payload } : { category: 'apple-id', payload }
        ),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      if (editingId) {
        setRecords((current) =>
          current.map((item) =>
            item.id === editingId ? { ...item, payload, plain, updatedAt: data.updatedAt } : item
          )
        )
      } else {
        setRecords((current) => [{ ...data.item, plain }, ...current])
        setEncryptedItems((current) => [data.item, ...current])
      }
      resetForm()
      setMessage(editingId ? '记录已更新并重新加密。' : '记录已加密保存。')
    } catch (error) {
      setMessage(`保存失败：${error?.message || error}`)
    } finally {
      setBusy(false)
    }
  }

  async function remove(record) {
    if (!confirm(`删除「${record.plain.label || record.plain.account}」？`)) return
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/information?id=${encodeURIComponent(record.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`)
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
      title="信息保险库"
      description="账号、密码、密保答案等字段只在当前浏览器内解密；服务器和数据库只接触 AES-GCM 密文。"
    >
      {status === 'loading' ? (
        <p className="text-sm text-[#67695d] dark:text-gray-400">正在读取加密信息库…</p>
      ) : status === 'error' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          {message} 请确认已应用 <code>0053_private_information_records.sql</code>。
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
        <div className="space-y-5">
          <Section title={editingId ? '编辑密钥' : '新增密钥'} description="保存前会在浏览器本地完成加密。">
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="名称">
                  <input className={INPUT_CLASS} value={form.label} onChange={(event) => updateForm('label', event.target.value)} placeholder="例如：账户 3" />
                </Field>
                <Field label="Apple ID / 邮箱 *">
                  <input className={INPUT_CLASS} type="email" required value={form.account} onChange={(event) => updateForm('account', event.target.value)} autoComplete="off" />
                </Field>
                <Field label="密码 *">
                  <input className={INPUT_CLASS} type="password" required value={form.password} onChange={(event) => updateForm('password', event.target.value)} autoComplete="new-password" />
                </Field>
                <Field label="生日">
                  <input className={INPUT_CLASS} type="date" value={form.birthday} onChange={(event) => updateForm('birthday', event.target.value)} />
                </Field>
                <Field label="密保 · 朋友">
                  <input className={INPUT_CLASS} value={form.securityFriend} onChange={(event) => updateForm('securityFriend', event.target.value)} autoComplete="off" />
                </Field>
                <Field label="密保 · 工作">
                  <input className={INPUT_CLASS} value={form.securityWork} onChange={(event) => updateForm('securityWork', event.target.value)} autoComplete="off" />
                </Field>
                <Field label="密保 · 父母">
                  <input className={INPUT_CLASS} value={form.securityParents} onChange={(event) => updateForm('securityParents', event.target.value)} autoComplete="off" />
                </Field>
                <Field label="备注">
                  <input className={INPUT_CLASS} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={busy} className="rounded-lg bg-[#15140f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]">
                  {busy ? '保存中…' : editingId ? '保存修改' : '加密保存'}
                </button>
                {editingId ? <button type="button" onClick={resetForm} className="rounded-lg border border-[#caccc0] px-4 py-2 text-sm dark:border-[#2d3744]">取消</button> : null}
                {message ? <span className="text-sm text-[#67695d] dark:text-gray-400">{message}</span> : null}
              </div>
            </form>
          </Section>

          <Section title="Apple ID 账户" description={`共 ${records.length} 条；密码与密保默认隐藏。`}>
            {records.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-6 text-sm text-[#717367] dark:border-gray-700 dark:text-gray-400">暂无记录。</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {records.map((record) => {
                  const visible = revealedId === record.id
                  const plain = record.plain
                  const answers = plain.securityAnswers
                  return (
                    <article key={record.id} className="rounded-xl border border-[#d5d7cd] bg-white/70 p-4 dark:border-[#252e39] dark:bg-[#10161f]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[#15140f] dark:text-gray-100">{plain.label || 'Apple ID'}</h3>
                          <p className="mt-1 break-all font-mono text-sm text-[#53554d] dark:text-gray-300">{plain.account}</p>
                        </div>
                        <button type="button" onClick={() => setRevealedId(visible ? '' : record.id)} className="shrink-0 rounded-md border border-[#caccc0] px-2.5 py-1 text-xs dark:border-[#2d3744]">
                          {visible ? '隐藏' : '显示'}
                        </button>
                      </div>
                      <dl className="mt-4 grid gap-2 text-sm">
                        <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#77796e]">密码</dt><dd className="break-all font-mono">{visible ? plain.password : '••••••••••••'}</dd></div>
                        {plain.birthday ? <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#77796e]">生日</dt><dd>{plain.birthday}</dd></div> : null}
                        {answers.friend ? <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#77796e]">朋友</dt><dd className="break-all font-mono">{visible ? answers.friend : '••••••'}</dd></div> : null}
                        {answers.work ? <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#77796e]">工作</dt><dd className="break-all font-mono">{visible ? answers.work : '••••••'}</dd></div> : null}
                        {answers.parents ? <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#77796e]">父母</dt><dd className="break-all font-mono">{visible ? answers.parents : '••••••'}</dd></div> : null}
                        {plain.notes ? <div className="flex gap-2"><dt className="w-20 shrink-0 text-[#77796e]">备注</dt><dd className="min-w-0 whitespace-pre-wrap break-words">{plain.notes}</dd></div> : null}
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => copy(plain.account, '账号')} className="rounded-md border border-[#caccc0] px-2 py-1 text-xs dark:border-[#2d3744]">复制账号</button>
                        <button type="button" onClick={() => copy(plain.password, '密码')} className="rounded-md border border-[#caccc0] px-2 py-1 text-xs dark:border-[#2d3744]">复制密码</button>
                        <button type="button" onClick={() => startEdit(record)} className="rounded-md border border-[#caccc0] px-2 py-1 text-xs dark:border-[#2d3744]">编辑</button>
                        <button type="button" disabled={busy} onClick={() => remove(record)} className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300">删除</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </Section>
        </div>
      )}
    </AdminPage>
  )
}
