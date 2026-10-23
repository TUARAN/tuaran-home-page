'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const MODULES = [
  {
    name: '站点可用性',
    coverage: '状态探测',
    tone: 'sky',
    trigger: '定时探测发现站点健康检查失败。',
    handling: '每 5 分钟探测一次，连续 3 次失败或恢复后更新公开故障状态。结果写入站点状态存储；探测接口自身写入失败会返回 500。',
    boundary: '这条链路记录可用性状态，不写入消息中心的自动化告警。',
    href: '/admin/site-health?tab=incidents',
    link: '查看故障状态',
  },
  {
    name: '数据健康',
    coverage: '按需检查',
    tone: 'amber',
    trigger: '站长打开数据健康页，读取 D1 绑定、表清单与表详情。',
    handling: '接口读取失败会在页面显示错误；未绑定数据库会单独显示，方便核对部署配置。',
    boundary: '当前是按需检查，不会主动扫描所有表，也不会自动向消息中心发告警。',
    href: '/admin/db',
    link: '查看数据健康',
  },
  {
    name: '可用性探测',
    coverage: '探测记录',
    tone: 'sky',
    trigger: '站长手动访问目标站点、运行地区检查，或查看已配置调度器的历史。',
    handling: '每个探测展示 HTTP 状态、耗时或错误；当前浏览器保留最近操作日志，地区检查逐项显示结果。',
    boundary: '手动探测失败主要留在本页记录中，不等于全站故障，也不会自动形成消息中心告警。',
    href: '/admin/site-health?tab=probe',
    link: '查看可用性探测',
  },
  {
    name: '部署与云端定时任务',
    coverage: '失败告警',
    tone: 'emerald',
    trigger: 'Cloudflare Pages 部署状态失败，或已接入告警步骤的 GitHub Actions 任务失败。',
    handling: '工作流调用告警接口，写入站长消息中心。部署失败按环境和提交、定时任务按工作流和运行 ID 去重；任务中心保留最近运行与日志入口。',
    boundary: '告警发送失败不会替任务重跑；需要到对应运行日志确认原因。未接入告警步骤的工作流不在此范围内。',
    href: '/admin/ops',
    link: '查看任务中心',
  },
  {
    name: 'X 浏览器插件',
    coverage: '部分异常告警',
    tone: 'amber',
    trigger: '回复页临时错误、X 无法连接，或未发送草稿阻止安全重连。',
    handling: '回复任务检测连接并按 2～30 秒逐步重试，能在原页恢复就继续当前回复；相关失败回执先存本地，联网后补报。相同设备、任务和错误 30 分钟内只提醒一次。',
    boundary: '点赞、关注和定时发帖的全部本地异常尚未统一进入消息中心；请同时查看插件面板和社区动作回执。',
    href: '/admin/community-actions?tab=extension',
    link: '查看插件回执',
  },
  {
    name: '站内互动',
    coverage: '运行记录',
    tone: 'sky',
    trigger: '自动点赞或评论失败、模型生成失败，或当天任务被配置与调度规则跳过。',
    handling: '逐条动作记录成功、跳过或失败；本次运行汇总失败数，部分成功标记为 partial。工作流整体失败时还会发送自动化告警。',
    boundary: '单条动作失败会留在运行记录中，不保证每条都生成单独通知。',
    href: '/admin/engagement-bots',
    link: '查看互动运行',
  },
  {
    name: '研究与内容任务',
    coverage: '日志与失败告警',
    tone: 'emerald',
    trigger: 'A 股研究、加密调研或舆情采集等定时流程返回失败。',
    handling: '研究任务写各自运行日志；已接入告警的 GitHub 工作流失败时向消息中心发送通知。加密调研遇到限流会返回 429 和重试等待时间。',
    boundary: '消息中心显示工作流失败；草稿质量或发布复核仍要在对应任务页查看。',
    href: '/admin/ops',
    link: '查看任务运行',
  },
  {
    name: '模型服务',
    coverage: '调用记录',
    tone: 'amber',
    trigger: 'DeepSeek 请求失败、超时，或结果没有通过业务校验。',
    handling: '能创建调用记录时，会写入失败状态、错误码和错误详情；业务页面自行决定重试、跳过或等待人工处理。',
    boundary: '调用记录采用尽力写入：D1 不可用时不阻断主请求，也不会因此自动产生消息中心告警。',
    href: '/admin/logs?tab=calls',
    link: '查看模型调用',
  },
]

const TONE = {
  sky: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
}

function timeLabel(value) {
  const at = Number(value)
  return at > 0 ? new Date(at).toLocaleString('zh-CN', { hour12: false }) : '时间未知'
}

export default function ExceptionMonitorClient() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/notifications?type=automation&limit=30', { cache: 'no-store', credentials: 'same-origin' })
      const data = await response.json()
      if (!response.ok || data.status === 'anonymous' || data.status === 'unavailable') throw new Error('暂时无法读取自动化告警')
      setItems(Array.isArray(data.items) ? data.items : [])
      setUnread(Number(data.unread) || 0)
      setTotal(Number(data.total) || 0)
    } catch (reason) {
      setError(reason?.message || '读取告警失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function loadMore() {
    setLoadingMore(true)
    setError('')
    try {
      const response = await fetch(`/api/notifications?type=automation&limit=30&offset=${items.length}`, { cache: 'no-store', credentials: 'same-origin' })
      const data = await response.json()
      if (!response.ok || data.status !== 'ok') throw new Error('读取更多告警失败')
      setItems((current) => [...current, ...(Array.isArray(data.items) ? data.items : [])])
      setTotal(Number(data.total) || 0)
    } catch (reason) {
      setError(reason?.message || '读取更多告警失败')
    } finally {
      setLoadingMore(false)
    }
  }

  const visible = items.filter((item) => {
    const plugin = String(item.articleKey || '').startsWith('extension:x:')
    return filter === 'all' || (filter === 'plugin' ? plugin : !plugin)
  })

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#d5d7cd] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#899183] dark:text-[#8c9b9a]">EXCEPTION MONITOR</p>
            <h2 className="mt-1 text-xl font-semibold text-[#171a17] dark:text-gray-100">异常监控中心</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62685f] dark:text-gray-400">集中查看已送达站长消息中心的自动化告警，并核对各板块现在如何发现、重试、记录和处理异常。</p>
          </div>
          <button type="button" onClick={refresh} disabled={loading} className="rounded-lg border border-[#d5d7cd] px-3 py-2 text-sm font-medium text-[#39423b] hover:bg-[#f5f7f2] disabled:opacity-50 dark:border-[#34404b] dark:text-gray-200 dark:hover:bg-[#1b2630]">{loading ? '读取中…' : '刷新告警'}</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-[#f6f8f3] p-3 dark:bg-[#0d131b]"><div className="text-xs text-[#6d756d] dark:text-gray-400">累计告警</div><div className="mt-1 text-2xl font-semibold text-[#1d2620] dark:text-gray-100">{loading ? '—' : total}</div><div className="text-xs text-[#838b82]">下方按时间分页查看</div></div>
          <div className="rounded-lg bg-[#f6f8f3] p-3 dark:bg-[#0d131b]"><div className="text-xs text-[#6d756d] dark:text-gray-400">未读告警</div><div className="mt-1 text-2xl font-semibold text-[#1d2620] dark:text-gray-100">{loading ? '—' : unread}</div><div className="text-xs text-[#838b82]">来自站长消息中心</div></div>
          <div className="rounded-lg bg-[#f6f8f3] p-3 dark:bg-[#0d131b]"><div className="text-xs text-[#6d756d] dark:text-gray-400">处理说明</div><div className="mt-1 text-2xl font-semibold text-[#1d2620] dark:text-gray-100">{MODULES.length} 个板块</div><div className="text-xs text-[#838b82]">按当前代码与接入情况整理</div></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#777e75] dark:text-gray-400">这里显示的是已送达的告警，不是全站实时健康判定。没有告警也可能是任务未运行、尚未接入上报或上报失败。</p>
      </section>

      <section className="rounded-xl border border-[#d5d7cd] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-lg font-semibold text-[#171a17] dark:text-gray-100">最近异常</h3><p className="mt-1 text-sm text-[#6c746b] dark:text-gray-400">工作流失败与 X 插件已上报的异常。</p></div>
          <div className="flex rounded-lg bg-[#f1f4ee] p-1 dark:bg-[#0d131b]" role="group" aria-label="筛选告警来源">
            {[['all', '全部'], ['workflow', '云端任务'], ['plugin', 'X 插件']].map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === id ? 'bg-white text-[#1a2820] shadow-sm dark:bg-[#26313c] dark:text-white' : 'text-[#687469] dark:text-gray-400'}`}>{label}</button>)}
          </div>
        </div>
        {error ? <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
        {!loading && !error && !visible.length ? <p className="mt-4 rounded-lg bg-[#f6f8f3] p-4 text-sm text-[#697168] dark:bg-[#0d131b] dark:text-gray-400">当前筛选范围内没有已送达的异常告警。</p> : null}
        <div className="mt-4 space-y-2">
          {visible.map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-[#e8ebe4] p-3 dark:border-[#2a3540] sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-[#232b25] dark:text-gray-100">{item.title}</span>{!item.readAt ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700 dark:bg-rose-950 dark:text-rose-200">未读</span> : null}</div><p className="mt-1 break-words text-sm leading-6 text-[#59645b] dark:text-gray-300">{item.messageExcerpt || '没有详细说明'}</p><p className="mt-1 text-xs text-[#8a9188]">{timeLabel(item.createdAt)}</p></div>
            <Link href={item.href || '/admin/ops'} className="shrink-0 text-sm font-medium text-[#26745b] hover:underline dark:text-emerald-400">查看处理页 →</Link>
          </div>)}
        </div>
        {!loading && items.length < total ? <button type="button" onClick={loadMore} disabled={loadingMore} className="mt-4 rounded-lg border border-[#d5d7cd] px-3 py-2 text-sm font-medium text-[#39423b] hover:bg-[#f5f7f2] disabled:opacity-50 dark:border-[#34404b] dark:text-gray-200 dark:hover:bg-[#1b2630]">{loadingMore ? '读取中…' : `加载更多（已显示 ${items.length} / ${total}）`}</button> : null}
      </section>

      <section>
        <div className="mb-3"><h3 className="text-lg font-semibold text-[#171a17] dark:text-gray-100">各板块如何处理异常</h3><p className="mt-1 text-sm text-[#6c746b] dark:text-gray-400">「告警」「运行记录」「状态探测」代表不同覆盖范围，不能互相替代。</p></div>
        <div className="grid gap-3 lg:grid-cols-2">
          {MODULES.map((module) => <article key={module.name} className="rounded-xl border border-[#d5d7cd] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
            <div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-semibold text-[#1f2821] dark:text-gray-100">{module.name}</h4><span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[module.tone]}`}>{module.coverage}</span></div>
            <dl className="mt-4 space-y-3 text-sm leading-6"><div><dt className="font-semibold text-[#2d3a2f] dark:text-gray-200">何时发现</dt><dd className="text-[#626c63] dark:text-gray-400">{module.trigger}</dd></div><div><dt className="font-semibold text-[#2d3a2f] dark:text-gray-200">当前处理</dt><dd className="text-[#626c63] dark:text-gray-400">{module.handling}</dd></div><div><dt className="font-semibold text-[#2d3a2f] dark:text-gray-200">覆盖边界</dt><dd className="text-[#626c63] dark:text-gray-400">{module.boundary}</dd></div></dl>
            <Link href={module.href} className="mt-4 inline-block text-sm font-medium text-[#26745b] hover:underline dark:text-emerald-400">{module.link} →</Link>
          </article>)}
        </div>
      </section>
    </div>
  )
}
