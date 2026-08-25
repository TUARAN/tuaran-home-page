'use client'

import { useState } from 'react'
import { IconLock } from '@tabler/icons-react'

import { AdminPage, Section } from '../../components/ui'
import SelfRegulationReview from './SelfRegulationReview'

const INPUT_CLASS =
  'h-10 min-w-0 flex-1 rounded-lg border border-[#caccc0] bg-white px-3 text-sm outline-none focus:border-[#7f8863] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100'

function formatUpdatedAt(value) {
  if (!value) return '更新时间未知'
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SelfRegulationClient() {
  const [password, setPassword] = useState('')
  const [document, setDocument] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function unlock(event) {
    event.preventDefault()
    if (!password.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/self-regulation', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || data?.status !== 'ok') {
        if (response.status === 403) throw new Error('口令错误，无法访问。')
        if (data?.error === 'DOCUMENT_NOT_FOUND') throw new Error('回忆录尚未写入私密文档库。')
        if (data?.error === 'DB_UNAVAILABLE') throw new Error('当前环境未绑定 D1 数据库。')
        throw new Error(data?.error || `HTTP_${response.status}`)
      }
      setDocument({ ...data, updatedLabel: formatUpdatedAt(data.updatedAt) })
      setPassword('')
    } catch (unlockError) {
      setError(String(unlockError?.message || unlockError))
    } finally {
      setBusy(false)
    }
  }

  if (document) return <SelfRegulationReview memoir={document} />

  return (
    <AdminPage
      title="锻炼与自控"
      description="站长身份通过后仍需输入独立口令；验证成功后才从 D1 读取回忆录。"
      actions={<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"><IconLock size={13} />二次门禁</span>}
    >
      <Section title="输入访问口令" description="口令由 Edge 服务端校验；正文不在未解锁页面或客户端脚本中。">
        <form onSubmit={unlock} className="flex max-w-xl flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className={INPUT_CLASS}
            placeholder="输入锻炼与自控访问口令"
            autoFocus
          />
          <button
            type="submit"
            disabled={busy || !password.trim()}
            className="h-10 shrink-0 rounded-lg bg-[#15140f] px-5 text-sm font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]"
          >
            {busy ? '验证中…' : '验证并访问'}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        <p className="mt-4 max-w-2xl text-xs leading-6 text-[#7a7c71] dark:text-gray-500">
          这不是端到端加密：服务端在口令验证后读取明文并渲染。站长登录仍是第一层权限，独立口令是第二层保护。
        </p>
      </Section>
    </AdminPage>
  )
}
