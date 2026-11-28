'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconCheck, IconClipboard, IconExternalLink, IconRobot, IconSearch } from '@tabler/icons-react'

import { DISTRIBUTOR_SKILL_NAME, HARNESS_VERSION } from '../../../../lib/distribution/harness'
import { DISTRIBUTION_PLAYBOOKS } from '../../../../lib/distribution/playbooks'
import { DISTRIBUTION_PLATFORMS } from '../../../../lib/distribution/platforms'
import { buildDistributionClaimPrompt } from '../../../../lib/distribution/taskPrompt'
import { copyPlainText } from '../../../../lib/content/contentClipboard'
import AdminButton from '../../components/ui/AdminButton'
import AdminPage from '../../components/ui/AdminPage'
import Section from '../../components/ui/Section'
import StatusPill from '../../components/ui/StatusPill'
import { articleFromHtml } from './articleMarkdown'
import DistributionJobsPanel from './DistributionJobsPanel'

const INSTALL_COMMAND = 'npm run distributor:skill:install'

// 有手册的平台可选；其余平台列出来但禁用，等实测写进 playbooks.js 后自动开放。
const PLATFORM_ROWS = DISTRIBUTION_PLATFORMS.map((platform) => ({
  ...platform,
  playbook: DISTRIBUTION_PLAYBOOKS[platform.id] || null,
}))
const READY_PLATFORM_IDS = PLATFORM_ROWS.filter((row) => row.playbook).map((row) => row.id)

const CREATE_ERRORS = {
  MIGRATION_REQUIRED: '任务表未建：请在 Cloudflare 执行迁移 0139_distribution_agent_jobs.sql。',
  PLATFORMS_REQUIRED: '至少选一个平台。',
  MARKDOWN_TOO_LARGE: '正文超过 40 万字符，无法建任务。',
}

function contentKeyFromLocation(fallback = '') {
  if (typeof window === 'undefined') return fallback
  return new URLSearchParams(window.location.search).get('contentKey')?.trim() || fallback
}

export default function ArticleDistributionClient({ requestedContentKey = '' }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState(requestedContentKey)
  const [selectedKey, setSelectedKey] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(READY_PLATFORM_IDS)
  const [message, setMessage] = useState({ tone: 'neutral', text: '选一篇文章和平台，建任务后把领取指令交给本机智能体。' })
  const [loading, setLoading] = useState(false)
  const [jobsVersion, setJobsVersion] = useState(0)

  const selectedItem = useMemo(
    () => items.find((item) => item.contentKey === selectedKey) || null,
    [items, selectedKey],
  )

  const loadItems = useCallback(async (search = '', preferredContentKey = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'all', status: 'published', limit: '100' })
      if (search.trim()) params.set('q', search.trim())
      const response = await fetch(`/api/admin/content-list?${params}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.detail || payload?.error || '内容读取失败')
      const nextItems = (payload.items || []).filter((item) => ['article', 'research'].includes(item.type) && /^\/articles\//.test(item.href))
      setItems(nextItems)
      setSelectedKey((current) => {
        if (preferredContentKey) {
          return nextItems.some((item) => item.contentKey === preferredContentKey) ? preferredContentKey : ''
        }
        return nextItems.some((item) => item.contentKey === current) ? current : (nextItems[0]?.contentKey || '')
      })
    } catch (error) {
      setMessage({ tone: 'danger', text: error.message || '内容读取失败。' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const targetContentKey = contentKeyFromLocation(requestedContentKey)
    setQuery(targetContentKey)
    loadItems(targetContentKey, targetContentKey)
  }, [loadItems, requestedContentKey])

  function togglePlatform(id) {
    setSelectedPlatforms((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function readArticle(item) {
    const response = await fetch(`/api/admin/article-distribution/article?href=${encodeURIComponent(item.href)}`, {
      credentials: 'same-origin',
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.html || !payload.sourceUrl) {
      throw new Error(payload?.error ? `文章页面读取失败：${payload.error}` : `文章页面读取失败（HTTP ${response.status}）`)
    }
    return articleFromHtml(payload.html, payload.sourceUrl, item.title)
  }

  async function createJob() {
    if (!selectedItem || !selectedPlatforms.length) return
    setLoading(true)
    setMessage({ tone: 'neutral', text: '正在读取文章正文并建任务…' })
    try {
      const article = await readArticle(selectedItem)
      const response = await fetch('/api/admin/distribution-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', contentKey: selectedItem.contentKey, platformIds: selectedPlatforms, ...article }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(CREATE_ERRORS[data.error] || data.error || `HTTP ${response.status}`)
      const copied = await copyPlainText(buildDistributionClaimPrompt({
        jobId: data.id,
        token: data.token,
        title: article.title,
        origin: window.location.origin,
      }))
      setJobsVersion((value) => value + 1)
      setMessage(copied
        ? { tone: 'success', text: `已建任务并复制领取指令（正文约 ${article.markdown.length.toLocaleString('zh-CN')} 字符）。粘贴给本机 Claude Desktop 或 Codex 即可开始。` }
        : { tone: 'warning', text: '任务已建，但复制失败。请在下方任务台点「复制领取指令」。' })
    } catch (error) {
      setMessage({ tone: 'danger', text: error.message || '建任务失败。' })
    } finally {
      setLoading(false)
    }
  }

  async function copyInstallCommand() {
    const copied = await copyPlainText(INSTALL_COMMAND)
    setMessage(copied
      ? { tone: 'success', text: '已复制安装命令，在本机仓库根目录执行。' }
      : { tone: 'danger', text: '复制失败。' })
  }

  const messageClass = {
    success: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-rose-600 dark:text-rose-300',
  }[message.tone] || 'text-[#53554d] dark:text-gray-300'

  return (
    <AdminPage
      title="分发智能体"
      description="把站内文章交给本机智能体，用你自己浏览器里的平台登录态发布；结果逐平台回到这里。"
      actions={(
        <AdminButton
          type="button"
          variant="primary"
          className="max-sm:h-auto max-sm:w-full max-sm:px-3 max-sm:py-2.5 max-sm:text-center"
          onClick={createJob}
          disabled={loading || !selectedItem || !selectedPlatforms.length}
        >
          <IconClipboard size={16} className="shrink-0" /> 建任务并复制领取指令
        </AdminButton>
      )}
    >
      <div className="grid min-w-0 max-w-full gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-5">
          <Section title="1. 选择站内文章" description="只列已公开的文章与调研。建任务时读取公开页正文，转成 Markdown 存进任务。">
            <form
              className="mb-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => { event.preventDefault(); loadItems(query) }}
            >
              <label className="relative block min-w-0 flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929487]" size={16} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题或 contentKey"
                  className="h-9 w-full rounded-lg border border-[#d8dad0] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f]"
                />
              </label>
              <AdminButton type="submit" className="w-full sm:w-auto" disabled={loading}>搜索</AdminButton>
            </form>
            <select
              value={selectedKey}
              onChange={(event) => setSelectedKey(event.target.value)}
              className="h-11 w-full rounded-lg border border-[#d8dad0] bg-white px-3 text-sm outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f]"
            >
              {items.length ? null : <option value="">暂无可分发文章</option>}
              {items.map((item) => (
                <option key={item.contentKey} value={item.contentKey}>{item.title} · {item.type === 'research' ? '调研' : '文章'}</option>
              ))}
            </select>
            {selectedItem ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#67695d] dark:text-gray-400">
                <span>{selectedItem.contentKey}</span>
                <span>·</span>
                <a href={selectedItem.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#15140f] dark:hover:text-white">
                  打开原文 <IconExternalLink size={13} />
                </a>
              </div>
            ) : null}
          </Section>

          <Section title="2. 选择平台" description="有实测手册的平台才能选；其余平台标「待实测」，补齐手册后自动开放。">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PLATFORM_ROWS.filter((row) => row.home || row.playbook).map((row) => {
                const ready = Boolean(row.playbook)
                const checked = ready && selectedPlatforms.includes(row.id)
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => togglePlatform(row.id)}
                    disabled={!ready}
                    aria-pressed={checked}
                    className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${checked ? 'border-[#7f8863] bg-[#f1f2ea] dark:border-[#82906a] dark:bg-[#151c26]' : 'border-[#d8dad0] bg-white hover:border-[#a6aa9a] dark:border-[#2d3744] dark:bg-[#10161f]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 text-sm font-semibold">{row.label}</span>
                      {checked ? <IconCheck size={16} /> : null}
                    </div>
                    <p className="mb-0 mt-2 text-[11px] text-[#7b7d72] dark:text-gray-500">
                      {ready ? `手册实测 ${row.playbook.verifiedAt}` : '待实测'}
                    </p>
                  </button>
                )
              })}
            </div>
            <p aria-live="polite" className={`mb-0 mt-4 text-sm leading-6 ${messageClass}`}>{message.text}</p>
          </Section>

          <DistributionJobsPanel key={jobsVersion} />
        </div>

        <div className="space-y-5">
          <Section title="智能体在哪里" description="执行在你的 Mac 上，本站只存任务和结果。">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="info" icon={false}><IconRobot size={14} /> {DISTRIBUTOR_SKILL_NAME}</StatusPill>
              <StatusPill tone="neutral" icon={false}>harness v{HARNESS_VERSION}</StatusPill>
            </div>
            <ol className="mb-0 mt-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-6 text-[#53554d] dark:text-gray-300">
              <li>在本机仓库根目录执行 <code className="break-all">{INSTALL_COMMAND}</code>，把 skill 装进 <code className="break-all">~/.claude/skills</code>。手册或规则更新、版本号变化后再执行一次。</li>
              <li>打开 ego lite，在里面登录要发的平台。智能体沿用这份浏览器登录态，本站不保存平台 Cookie。</li>
              <li>在这里建任务，把领取指令粘贴给 Claude Desktop 或 Codex。智能体领取正文、逐平台发布，并把文章地址和手册偏差回报到任务台。</li>
            </ol>
            <div className="mt-4">
              <AdminButton type="button" size="sm" onClick={copyInstallCommand}>
                <IconClipboard size={15} /> 复制安装命令
              </AdminButton>
            </div>
          </Section>

          <Section title="平台手册" description="来自真实发布的实测。平台改版时，智能体会在回报里写「手册偏差」，据此更新手册。">
            <ul className="m-0 space-y-3 p-0">
              {PLATFORM_ROWS.filter((row) => row.playbook).map((row) => (
                <li key={row.id} className="list-none rounded-lg border border-[#e1e2d9] p-3 text-[12px] leading-5 dark:border-[#263142]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a href={row.playbook.entry} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#15140f] hover:underline dark:text-gray-100">
                      {row.label} <IconExternalLink size={13} aria-hidden="true" />
                    </a>
                    <StatusPill tone="success" size="sm" icon={false}>实测 {row.playbook.verifiedAt}</StatusPill>
                  </div>
                  <p className="mb-0 mt-1.5 text-[#53554d] dark:text-gray-300">{row.playbook.success}</p>
                </li>
              ))}
            </ul>
          </Section>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            原创、翻译授权、转载声明这类权利声明，智能体会先停下来问你。领取指令 24 小时内有效，过期后在任务台重新复制。
          </div>
        </div>
      </div>
    </AdminPage>
  )
}
