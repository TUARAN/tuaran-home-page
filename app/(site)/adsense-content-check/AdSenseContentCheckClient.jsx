'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBook2,
  IconCheck,
  IconChecklist,
  IconCircleCheck,
  IconCopy,
  IconExternalLink,
  IconHelpCircle,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react'

import ContentPvBeacon from '../components/ContentPvBeacon'
import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'

const PAGE_URL = 'https://2aran.com/adsense-content-check'
const STORAGE_KEY = 'adsense-content-check:v1'

const POLICY_SUMMARIES = [
  {
    id: 'minimum',
    index: '01',
    title: '最低内容要求',
    summary: '广告不应出现在没有发布者内容、内容价值较低、尚在建设，或主要用于提醒和导航的页面上。',
    href: 'https://support.google.com/publisherpolicies/answer/11112688?hl=zh-Hans',
  },
  {
    id: 'quality',
    index: '02',
    title: '独特内容与用户体验',
    summary: '内容需要原创、与访客相关，并通过清晰导航帮助用户找到所需信息。引用外部资源时仍要加入自己的贡献。',
    href: 'https://support.google.com/adsense/answer/7299563?hl=zh-Hans',
  },
  {
    id: 'thin',
    index: '03',
    title: '内容贫乏',
    summary: '内容贫乏常见于联属营销薄页、抓取或低质量外来内容、以及为搜索引擎批量制作的门页。修复标准是“显著附加价值”。',
    href: 'https://support.google.com/webmasters/answer/9044175?hl=zh-Hans#thin-content',
  },
  {
    id: 'spam',
    index: '04',
    title: '搜索垃圾政策',
    summary: '避免堆砌关键词、虚假声明、门页、批量套模板、抓取拼接、伪装和其他操纵搜索排名的做法。',
    href: 'https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn',
  },
]

const CHECK_GROUPS = [
  {
    id: 'substance',
    index: '01',
    title: '页面有实质内容',
    description: '先确认页面是否适合承载广告。',
    items: [
      { id: 'publisher-content', critical: true, title: '页面主体是发布者内容', detail: '不是空页、纯导航、登录、感谢、错误或结果状态页。' },
      { id: 'finished', critical: true, title: '页面已经完成', detail: '没有“建设中”、占位文字、空白模块或未完成的主要功能。' },
      { id: 'content-focus', critical: true, title: '内容是页面的视觉重心', detail: '用户打开页面后，正文或核心交互明显高于广告与推广信息。' },
      { id: 'manual-review', critical: false, title: '自动生成内容经过人工复核', detail: '有明确的筛选、编辑、事实核验或使用边界。' },
    ],
  },
  {
    id: 'originality',
    index: '02',
    title: '有原创贡献',
    description: '外部资料可以使用，但页面要能说明自己增加了什么。',
    items: [
      { id: 'own-contribution', critical: true, title: '加入了自己的知识或判断', detail: '例如亲历经验、专业知识、分析、评论、测试或改进建议。' },
      { id: 'source-boundary', critical: false, title: '读者能区分来源与作者判断', detail: '引用、公开事实、计算与个人观点有清楚边界。' },
      { id: 'not-replicated', critical: true, title: '不是复制、抓取或轻度改写', detail: '即使换了句式，如果没有新信息或新视角，仍然缺少附加价值。' },
      { id: 'rights', critical: true, title: '外部文字与图片的使用合规', detail: '有可核对的来源、授权或符合引用范围，不侵犯版权。' },
    ],
  },
  {
    id: 'value',
    index: '03',
    title: '能提供显著价值',
    description: '不用字数代替对用户价值的判断。',
    items: [
      { id: 'complete-answer', critical: true, title: '完整回答了一个明确问题', detail: '读者不需要再去多个页面拼凑才能理解核心结论。' },
      { id: 'unique-utility', critical: true, title: '提供了别处不易获得的信息或用法', detail: '可以是数据整理、交叉核验、比较框架、操作工具或亲历证据。' },
      { id: 'not-thin-affiliate', critical: true, title: '不是以跳转或联属链接为主的薄页', detail: '商业链接只是补充，不是页面存在的唯一理由。' },
      { id: 'not-doorway', critical: true, title: '不是批量生成的门页', detail: '没有为相似关键词、城市或产品复制同一套模板。' },
    ],
  },
  {
    id: 'experience',
    index: '04',
    title: '用户能顺利使用',
    description: '用户体验是审核对象，不是页面装饰。',
    items: [
      { id: 'navigation', critical: true, title: '导航清晰且可用', detail: '链接、菜单和下拉列表能正常工作，读者知道当前位置。' },
      { id: 'readability', critical: false, title: '正文容易阅读', detail: '标题层级、字号、对比度、行距和内容宽度没有阻碍理解。' },
      { id: 'mobile', critical: true, title: '移动端能完整访问主要内容', detail: '不溢出、不遮挡、不依赖悬停，主要交互可用触控完成。' },
      { id: 'no-interruption', critical: false, title: '没有过度干扰', detail: '弹窗、自动跳转、广告和固定浮层不会阻断阅读与操作。' },
    ],
  },
  {
    id: 'integrity',
    index: '05',
    title: '不操纵、不误导',
    description: '保持页面面向读者，而不是面向排名技巧。',
    items: [
      { id: 'no-keyword-stuffing', critical: true, title: '没有堆砌关键词', detail: '标题、正文、alt 文字和元信息不重复塞入搜索词。' },
      { id: 'accurate-claims', critical: true, title: '标题与声明有内容支撑', detail: '不声称提供实际不存在的内容、服务、数据或完成程度。' },
      { id: 'same-content', critical: true, title: '用户与搜索引擎看到的核心内容一致', detail: '没有隐藏文字、伪装、条件跳转或只向爬虫提供的内容。' },
      { id: 'template-control', critical: false, title: '批量页面之间有真实差异', detail: '每页的主要信息和用户价值不是由少量变量替换出来的。' },
    ],
  },
  {
    id: 'monetization',
    index: '06',
    title: '广告与内容分开管理',
    description: '页面有价值，不等于所有页面都适合投放广告。',
    items: [
      { id: 'ad-whitelist', critical: true, title: '广告使用明确的内容白名单', detail: '只在经过人工审查的内容路由上加载广告，不默认全站覆盖。' },
      { id: 'ad-ratio', critical: true, title: '广告与付费推广少于发布者内容', detail: '首屏和全页都不会出现广告比内容更显眼或更多的情况。' },
      { id: 'ad-separation', critical: true, title: '广告不会被误认为内容或操作按钮', detail: '广告标识、间距和位置足够清楚，不诱导用户误点。' },
      { id: 'no-click-encouragement', critical: true, title: '没有鼓励用户点击或观看广告', detail: '不使用“支持本站”“点击广告”等引导，也不用图形将注意力指向广告。' },
    ],
  },
]

const ALL_CHECKS = CHECK_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupId: group.id, groupTitle: group.title })),
)

const ANSWER_META = {
  pass: { label: '通过', icon: IconCheck },
  fix: { label: '待整改', icon: IconAlertTriangle },
  unsure: { label: '待确认', icon: IconHelpCircle },
}

function answerButtonClass(answer, active) {
  if (!active) return 'border-transparent text-[#7e7485] hover:border-[#d8ccdf] hover:bg-white dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-white/5'
  if (answer === 'pass') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
  if (answer === 'fix') return 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
}

function statusTone(status) {
  if (status === 'ready') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
  if (status === 'fix') return 'border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300'
  return 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300'
}

export default function AdSenseContentCheckClient() {
  const [answers, setAnswers] = useState({})
  const [filter, setFilter] = useState('all')
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
      if (stored && typeof stored === 'object') setAnswers(stored)
    } catch {
      // 本地存储不可用不影响当次检查。
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
    } catch {
      // 本地存储不可用时，仅保留当前会话状态。
    }
  }, [answers, loaded])

  const result = useMemo(() => {
    const pass = ALL_CHECKS.filter((item) => answers[item.id] === 'pass')
    const fix = ALL_CHECKS.filter((item) => answers[item.id] === 'fix')
    const unsure = ALL_CHECKS.filter((item) => answers[item.id] === 'unsure')
    const unanswered = ALL_CHECKS.filter((item) => !answers[item.id])
    const criticalFixes = fix.filter((item) => item.critical)
    const answered = pass.length + fix.length + unsure.length
    const score = Math.round((pass.length / ALL_CHECKS.length) * 100)

    if (!answered) return { pass, fix, unsure, unanswered, criticalFixes, answered, score, status: 'start', label: '未开始' }
    if (criticalFixes.length) return { pass, fix, unsure, unanswered, criticalFixes, answered, score, status: 'fix', label: '优先整改' }
    if (fix.length || unsure.length || unanswered.length) return { pass, fix, unsure, unanswered, criticalFixes, answered, score, status: 'review', label: '继续核验' }
    return { pass, fix, unsure, unanswered, criticalFixes, answered, score, status: 'ready', label: '完成自检' }
  }, [answers])

  function setAnswer(id, answer) {
    setAnswers((current) => ({ ...current, [id]: current[id] === answer ? undefined : answer }))
  }

  function resetAnswers() {
    setAnswers({})
    setFilter('all')
  }

  function matchesFilter(item) {
    if (filter === 'all') return true
    if (filter === 'unanswered') return !answers[item.id]
    return answers[item.id] === filter
  }

  async function copyResult() {
    const lines = [
      'AdSense 内容质量自检',
      `进度：${result.answered}/${ALL_CHECKS.length}`,
      `通过：${result.pass.length}｜待整改：${result.fix.length}｜待确认：${result.unsure.length}｜未填写：${result.unanswered.length}`,
      '',
      ...result.fix.map((item) => `- [待整改] ${item.groupTitle} / ${item.title}`),
      ...result.unsure.map((item) => `- [待确认] ${item.groupTitle} / ${item.title}`),
      ...result.unanswered.map((item) => `- [未填写] ${item.groupTitle} / ${item.title}`),
      '',
      '注：这是站内自检结果，不是 Google 审核结果预测。',
      PAGE_URL,
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(124,89,145,0.16),transparent_32%),linear-gradient(180deg,#f8f4f5_0%,#f2efe9_55%,#f8f7f3_100%)] text-[#241b29] dark:bg-[radial-gradient(circle_at_15%_0%,rgba(127,91,151,0.17),transparent_28%),linear-gradient(180deg,#0d1015_0%,#111319_100%)] dark:text-gray-100">
      <ContentPvBeacon category="rich-page" slug="adsense-content-check" />
      <PageContainer width="standard" className="py-6 md:py-10">
        <header className="overflow-hidden rounded-[30px] border border-[#ded2dc] bg-white/65 p-5 shadow-[0_28px_90px_rgba(69,47,81,0.10)] backdrop-blur dark:border-white/10 dark:bg-white/[0.035] md:p-9 lg:p-12">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-end">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <Link href="/rich-pages" className="rounded-full border border-[#d2c4d0] bg-white/70 px-3 py-1.5 text-[#67526d] no-underline hover:border-[#8e7098] dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  互动专题
                </Link>
                <span className="rounded-full border border-[#bea8c3] bg-[#eee4ef] px-3 py-1.5 text-[#68436f] dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-200">
                  24 项自检
                </span>
                <span className="font-mono text-[#8b7f8e]">2026-08-10</span>
              </div>
              <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#865a8f] dark:text-[#d6a8df]">Content quality field check</p>
              <h1 className="m-0 mt-4 max-w-3xl text-[42px] font-black leading-[1.02] tracking-[-0.055em] text-[#241829] dark:text-white sm:text-[58px] lg:text-[70px]">
                低价值内容，<br />不靠猜字数。
              </h1>
              <p className="m-0 mt-6 max-w-3xl text-[15px] leading-8 text-[#685e6b] dark:text-gray-300">
                把 Google 的四类说明转成一张可执行的站点检查表。逐项选择“通过”“待整改”或“待确认”，页面会自动整理阻断项和后续任务。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#checklist" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#56345f] px-5 text-sm font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[#42264a] dark:bg-[#d6a8df] dark:text-[#241829]">
                  开始自检 <IconArrowRight size={17} aria-hidden="true" />
                </a>
                <SharePageButton title="AdSense 内容质量自检" text="24 项自检，把低价值内容政策转成整改清单。" url={PAGE_URL} />
              </div>
            </div>

            <div className="rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_50px_rgba(73,51,83,0.10)] dark:border-white/10 dark:bg-black/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8d7e91]">当前进度</p>
                  <strong className="mt-2 block font-mono text-5xl font-black tracking-tight text-[#3e2945] dark:text-white">{result.answered}<span className="text-xl text-[#a397a6]">/{ALL_CHECKS.length}</span></strong>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusTone(result.status)}`}>{result.label}</span>
              </div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e9e1e8] dark:bg-white/10">
                <div className="h-full rounded-full bg-[#704879] transition-all duration-500 dark:bg-[#d6a8df]" style={{ width: `${Math.round((result.answered / ALL_CHECKS.length) * 100)}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  [result.pass.length, '通过', 'text-emerald-700 dark:text-emerald-300'],
                  [result.fix.length, '待整改', 'text-rose-700 dark:text-rose-300'],
                  [result.unsure.length, '待确认', 'text-amber-700 dark:text-amber-300'],
                ].map(([value, label, tone]) => (
                  <div key={label} className="rounded-xl bg-[#f6f1f5] p-3 dark:bg-white/5">
                    <strong className={`block font-mono text-xl ${tone}`}>{value}</strong>
                    <span className="mt-1 block text-[10px] text-[#8e8491] dark:text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
              <p className="m-0 mt-5 border-t border-[#e9e1e7] pt-4 text-xs leading-6 text-[#817784] dark:border-white/10 dark:text-gray-400">
                进度与数量用于整理任务，不是 Google 官方评分，也不预测审核结果。
              </p>
            </div>
          </div>
        </header>

        <section className="py-9 md:py-12" aria-labelledby="policy-heading">
          <div className="mb-6 flex items-end justify-between gap-5">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.23em] text-[#8a5b92] dark:text-[#d3a7dc]">Policy in four parts</p>
              <h2 id="policy-heading" className="m-0 mt-2 text-3xl font-black tracking-tight md:text-4xl">四份说明，一条主线</h2>
            </div>
            <IconBook2 size={26} className="text-[#9a869d]" aria-hidden="true" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {POLICY_SUMMARIES.map((policy) => (
              <article key={policy.id} className="rounded-2xl border border-[#ded4dc] bg-white/55 p-5 dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs font-bold text-[#8b5a91] dark:text-[#d5a7df]">{policy.index}</span>
                  <a href={policy.href} target="_blank" rel="noreferrer" aria-label={`打开${policy.title}官方说明`} className="text-[#918397] hover:text-[#4d3453] dark:text-gray-500 dark:hover:text-gray-200">
                    <IconExternalLink size={17} aria-hidden="true" />
                  </a>
                </div>
                <h3 className="m-0 mt-6 text-lg font-black">{policy.title}</h3>
                <p className="m-0 mt-2 text-sm leading-7 text-[#6f6572] dark:text-gray-400">{policy.summary}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-[#cdbbd1] bg-[#eee5ef] p-5 dark:border-fuchsia-300/15 dark:bg-fuchsia-300/[0.06]">
            <div className="flex gap-3">
              <IconSparkles className="mt-0.5 shrink-0 text-[#76517d] dark:text-[#d4a8dd]" size={20} aria-hidden="true" />
              <p className="m-0 text-sm font-medium leading-7 text-[#5f4d64] dark:text-gray-300">
                四份说明都没有规定统一的“最低文章篇数”或“每篇最低字数”。检查重点是页面是否完整、原创，并且对读者有显著价值。
              </p>
            </div>
          </div>
        </section>

        <section id="checklist" className="scroll-mt-24 border-t border-[#d9ced6] py-9 dark:border-white/10 md:py-12" aria-labelledby="checklist-heading">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.23em] text-[#8a5b92] dark:text-[#d3a7dc]">Site checklist</p>
              <h2 id="checklist-heading" className="m-0 mt-2 text-3xl font-black tracking-tight md:text-4xl">把政策换成站点动作</h2>
              <p className="m-0 mt-3 max-w-2xl text-sm leading-7 text-[#746a76] dark:text-gray-400">选择会自动保存在当前设备。标有“阻断项”的问题应在再次提交审核前优先解决。</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end" role="group" aria-label="筛选检查项">
              {[
                ['all', '全部'],
                ['fix', '待整改'],
                ['unsure', '待确认'],
                ['unanswered', '未填写'],
                ['pass', '已通过'],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${filter === id ? 'border-[#76527e] bg-[#5a3762] text-white dark:border-[#d1a6da] dark:bg-[#d1a6da] dark:text-[#251a29]' : 'border-[#d8ccd6] bg-white/55 text-[#756978] hover:border-[#9e83a4] dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 space-y-4">
            {CHECK_GROUPS.map((group) => {
              const items = group.items.filter(matchesFilter)
              if (!items.length) return null
              const groupAnswered = group.items.filter((item) => answers[item.id]).length
              return (
                <section key={group.id} className="overflow-hidden rounded-[24px] border border-[#ddd2da] bg-white/[0.58] dark:border-white/10 dark:bg-white/[0.025]" aria-labelledby={`group-${group.id}`}>
                  <div className="flex flex-col gap-4 border-b border-[#e7dee5] p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between md:p-6">
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 font-mono text-xs font-bold text-[#8d5d94] dark:text-[#d7abdf]">{group.index}</span>
                      <div>
                        <h3 id={`group-${group.id}`} className="m-0 text-xl font-black">{group.title}</h3>
                        <p className="m-0 mt-1 text-xs leading-6 text-[#817684] dark:text-gray-500">{group.description}</p>
                      </div>
                    </div>
                    <span className="self-start rounded-full bg-[#eee7ed] px-3 py-1.5 font-mono text-[11px] font-bold text-[#756779] dark:bg-white/5 dark:text-gray-400">{groupAnswered}/{group.items.length}</span>
                  </div>
                  <div className="divide-y divide-[#e9e1e7] dark:divide-white/[0.07]">
                    {items.map((item) => (
                      <div key={item.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="m-0 text-sm font-bold text-[#302536] dark:text-gray-100">{item.title}</h4>
                            {item.critical ? <span className="rounded-full border border-rose-500/20 bg-rose-500/[0.07] px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300">阻断项</span> : null}
                          </div>
                          <p className="m-0 mt-1.5 text-xs leading-6 text-[#817783] dark:text-gray-500">{item.detail}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-1 rounded-xl border border-[#dfd4dc] bg-[#f8f4f6] p-1 dark:border-white/10 dark:bg-black/15" role="group" aria-label={`${item.title}检查结果`}>
                          {Object.entries(ANSWER_META).map(([answer, meta]) => {
                            const Icon = meta.icon
                            const active = answers[item.id] === answer
                            return (
                              <button key={answer} type="button" onClick={() => setAnswer(item.id, answer)} aria-pressed={active} className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition ${answerButtonClass(answer, active)}`}>
                                <Icon size={14} aria-hidden="true" /> {meta.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          {CHECK_GROUPS.every((group) => group.items.every((item) => !matchesFilter(item))) ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#cfc1cc] p-10 text-center dark:border-white/15">
              <IconCircleCheck className="mx-auto text-emerald-600 dark:text-emerald-300" size={28} aria-hidden="true" />
              <p className="m-0 mt-3 text-sm font-bold">当前筛选下没有检查项</p>
            </div>
          ) : null}
        </section>

        <section className="border-t border-[#d9ced6] py-9 dark:border-white/10 md:py-12" aria-labelledby="result-heading">
          <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-[26px] bg-[#4e3156] p-6 text-white dark:bg-[#d0a6d9] dark:text-[#241829] md:p-8">
              <IconShieldCheck size={26} aria-hidden="true" />
              <p className="m-0 mt-10 font-mono text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">Current result</p>
              <h2 id="result-heading" className="m-0 mt-3 text-3xl font-black leading-tight tracking-tight">{result.label}</h2>
              <p className="m-0 mt-4 text-sm leading-7 opacity-80">
                {result.status === 'start' && '先完成六类检查。不确定的项目选“待确认”，不要为了提高数字直接选通过。'}
                {result.status === 'fix' && `当前有 ${result.criticalFixes.length} 个阻断项标记为待整改。优先解决它们，再处理其他优化。`}
                {result.status === 'review' && '已没有明确标记的阻断问题，但仍存在待整改、待确认或未填写项。'}
                {result.status === 'ready' && '所有项目已标记为通过。提交复审前，再用真实设备和非站长账号做一次完整访问。'}
              </p>
              <div className="mt-7 border-t border-white/20 pt-5 text-xs leading-6 opacity-75 dark:border-black/15">
                通过比例 {result.score}% 只表示自检选项状态，不是质量得分。
              </div>
            </div>

            <div className="rounded-[26px] border border-[#ddd1d9] bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.025] md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d5e94] dark:text-[#d6a8df]">Action list</p>
                  <h3 className="m-0 mt-2 text-2xl font-black">当前处理清单</h3>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={copyResult} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d4c7d1] bg-white/70 px-4 text-xs font-bold text-[#67586b] hover:border-[#94779b] dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                    {copied ? <IconCheck size={15} aria-hidden="true" /> : <IconCopy size={15} aria-hidden="true" />} {copied ? '已复制' : '复制清单'}
                  </button>
                  <button type="button" onClick={resetAnswers} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-transparent px-3 text-xs font-bold text-[#8b7c8e] hover:bg-black/[0.04] dark:text-gray-500 dark:hover:bg-white/5">
                    <IconRefresh size={15} aria-hidden="true" /> 重置
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {[...result.fix, ...result.unsure, ...result.unanswered].slice(0, 12).map((item) => {
                  const state = answers[item.id] || 'unanswered'
                  return (
                    <div key={item.id} className="flex items-start gap-3 rounded-xl border border-[#e4dbe2] bg-[#faf7f9] p-3.5 dark:border-white/[0.07] dark:bg-white/[0.02]">
                      {state === 'fix' ? <IconAlertTriangle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-300" size={16} aria-hidden="true" /> : <IconHelpCircle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={16} aria-hidden="true" />}
                      <div>
                        <p className="m-0 text-xs font-bold">{item.title}</p>
                        <p className="m-0 mt-1 text-[11px] text-[#8b808e] dark:text-gray-500">{item.groupTitle} · {state === 'fix' ? '待整改' : state === 'unsure' ? '待确认' : '未填写'}</p>
                      </div>
                    </div>
                  )
                })}
                {!result.fix.length && !result.unsure.length && !result.unanswered.length ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    <IconCircleCheck className="mr-2 inline" size={18} aria-hidden="true" />
                    没有待处理项。
                  </div>
                ) : null}
                {[...result.fix, ...result.unsure, ...result.unanswered].length > 12 ? (
                  <p className="m-0 pt-2 text-xs text-[#8c818f] dark:text-gray-500">还有 {[...result.fix, ...result.unsure, ...result.unanswered].length - 12} 项，复制清单可获取完整结果。</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <footer className="mb-6 rounded-[24px] border border-[#ddd2da] bg-white/55 p-6 dark:border-white/10 dark:bg-white/[0.025] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <IconChecklist size={19} className="text-[#7e5685] dark:text-[#d1a4da]" aria-hidden="true" />
                <h2 className="m-0 text-lg font-black">需要看 2aran.com 的完整整改判断？</h2>
              </div>
              <p className="m-0 mt-2 text-sm leading-7 text-[#786d7a] dark:text-gray-400">已有一份站点级调研，将官方规则与 2aran.com 的内容、导航、广告路由和复审步骤分开说明。</p>
            </div>
            <Link href="/articles/research/topics/google-adsense-low-value-content-rejection" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#9b7da1] px-5 text-sm font-bold text-[#62446a] no-underline hover:bg-[#eee5ef] dark:border-[#b88fc1] dark:text-[#d8afe0] dark:hover:bg-white/5">
              查看完整调研 <IconArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </footer>
      </PageContainer>
    </main>
  )
}
