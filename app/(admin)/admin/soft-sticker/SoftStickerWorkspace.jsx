'use client'

import { useState } from 'react'
import { IconBarbell, IconFlower, IconHeart, IconLock } from '@tabler/icons-react'

import { decryptPayload } from '../../../../lib/longCompass/crypto'
import { decryptPrivateDocumentContent, normalizePrivateMarkdown } from '../../../../lib/privateDocuments'
import { renderMarkdown } from '../../../../lib/research/markdown'
import { AdminPage, Section } from '../../components/ui'
import StrawberryProfile from '../person-strawberry/StrawberryProfile'
import SelfRegulationClient from '../self-regulation/SelfRegulationClient'
import SoftStickerClient from './SoftStickerClient'
import { SOFT_STICKER_ENVELOPE } from './seed'

const TABS = [
  { id: 'records', label: '体验记录', description: '时间线、筛选表格与画像看板', icon: IconFlower },
  { id: 'self-regulation', label: '锻炼与自控', description: '回忆录、触发因素与行动复盘', icon: IconBarbell },
  { id: 'strawberry', label: '草莓专题', description: '关系时间线、人物画像与资金账目', icon: IconHeart },
]

const INPUT_CLASS =
  'h-10 min-w-0 flex-1 rounded-lg border border-[#caccc0] bg-white px-3 text-sm outline-none focus:border-[#92713d] focus:ring-2 focus:ring-[#92713d]/10 dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100'

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

export default function SoftStickerWorkspace({ initialTab = 'records' }) {
  const [activeTab, setActiveTab] = useState(
    ['records', 'self-regulation', 'strawberry'].includes(initialTab) ? initialTab : 'records'
  )
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function selectTab(tab) {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    if (tab === 'records') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  async function unlock(event) {
    event.preventDefault()
    const sharedPassword = password.trim()
    if (!sharedPassword || busy) return

    setBusy(true)
    setError('')
    try {
      if (!SOFT_STICKER_ENVELOPE) throw new Error('体验记录密文尚未写入。')
      const plain = await decryptPayload(SOFT_STICKER_ENVELOPE, sharedPassword)
      if (plain?.schemaVersion !== 1 || !Array.isArray(plain.records)) throw new Error('INVALID_DIARY_SCHEMA')

      let memoir = null
      let memoirError = ''
      try {
        const response = await fetch('/api/admin/self-regulation', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const data = await response.json().catch(() => null)
        if (response.ok && data?.status === 'ok') {
          const markdown = await decryptPrivateDocumentContent(data.encryptedContent, sharedPassword)
          memoir = {
            title: data.title,
            html: renderMarkdown(normalizePrivateMarkdown(markdown), { breaks: true }),
            updatedAt: data.updatedAt,
            updatedLabel: formatUpdatedAt(data.updatedAt),
          }
        } else if (data?.error === 'DOCUMENT_NOT_FOUND') {
          memoirError = '回忆录尚未写入私密文档库。'
        } else if (data?.error === 'DB_UNAVAILABLE') {
          memoirError = '当前环境未绑定 D1 数据库。'
        } else {
          memoirError = data?.error || `回忆录读取失败（HTTP ${response.status}）。`
        }
      } catch (memoirRequestError) {
        if (memoirRequestError?.message === 'PRIVATE_DOCUMENT_DECRYPT_FAILED') {
          throw new Error('统一口令与回忆录密文不匹配。')
        }
        memoirError = String(memoirRequestError?.message || memoirRequestError)
      }

      setUnlocked({ records: plain.records, memoir, memoirError })
      setPassword('')
    } catch (unlockError) {
      setError(
        unlockError?.message === '统一口令与回忆录密文不匹配。'
          ? unlockError.message
          : '口令错误，无法解锁 SoftSticker。'
      )
    } finally {
      setBusy(false)
    }
  }

  if (!unlocked) {
    return (
      <AdminPage
        title="软贴空间"
        description="一个统一口令保护体验记录、锻炼与自控和草莓专题。"
        actions={<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"><IconLock size={13} />统一门禁</span>}
      >
        <Section title="解锁空间" description="输入一次口令即可访问全部三个 Tab；切换期间无需再次验证。">
          <form onSubmit={unlock} className="flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className={INPUT_CLASS}
              placeholder="输入 SoftSticker 统一口令"
              autoFocus
            />
            <button
              type="submit"
              disabled={busy || !password.trim()}
              className="h-10 shrink-0 rounded-lg bg-[#171610] px-5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]"
            >
              {busy ? '解锁中…' : '解锁全部内容'}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          <p className="mt-4 max-w-2xl text-xs leading-6 text-[#7a7c71] dark:text-gray-500">
            口令只在浏览器内解密体验记录与回忆录，不会发送到服务器；页面刷新后需重新输入。
          </p>
        </Section>
      </AdminPage>
    )
  }

  return (
    <>
      <div className="admin-page mx-auto w-full px-4 pt-5 sm:px-5 md:px-6">
        <div className="grid gap-2 rounded-xl border border-[#dedfd6] bg-[#f5f4ee] p-1.5 dark:border-[#26303c] dark:bg-[#111821] sm:grid-cols-3" role="tablist" aria-label="SoftSticker 私密空间">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${active ? 'bg-white text-[#24251f] shadow-sm dark:bg-[#202a36] dark:text-white' : 'text-[#74766c] hover:bg-white/60 hover:text-[#35372f] dark:text-gray-500 dark:hover:bg-[#18212c] dark:hover:text-gray-300'}`}
              >
                <Icon size={19} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-5 opacity-75">{tab.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div hidden={activeTab !== 'records'} aria-hidden={activeTab !== 'records'}>
        <SoftStickerClient rows={unlocked.records} />
      </div>
      <div hidden={activeTab !== 'self-regulation'} aria-hidden={activeTab !== 'self-regulation'}>
        <SelfRegulationClient document={unlocked.memoir} error={unlocked.memoirError} />
      </div>
      <div hidden={activeTab !== 'strawberry'} aria-hidden={activeTab !== 'strawberry'}>
        <StrawberryProfile />
      </div>
    </>
  )
}
