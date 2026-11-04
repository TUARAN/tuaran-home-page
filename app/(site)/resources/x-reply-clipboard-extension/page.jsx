import Link from 'next/link'
import Image from 'next/image'
import {
  IconArrowRight,
  IconBell,
  IconBolt,
  IconBrandChrome,
  IconBrandX,
  IconMessageCircle,
  IconRobot,
  IconShieldLock,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import { WECHAT_CONTACT } from '../../../../lib/site/contactChannels'
import { X_REPLY_EXTENSION_PACKAGE } from '../../../../lib/generated/xReplyExtensionPackage'
import { X_EXTENSION_LATEST_VERSION } from '../../../../lib/community/xExtensionVersion'
import { loadXExtensionReleaseWeeks } from '../../../../lib/community/xExtensionReleaseWeeks'
import SharePageButton from '../../components/SharePageButton'
import ExtensionDownloadButton from './ExtensionDownloadButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-reply-clipboard-extension&file=extension-zip'
const VERSION = X_REPLY_EXTENSION_PACKAGE.fileName.match(/-v(\d+\.\d+\.\d+)\.zip$/u)?.[1] || '未知'
const LOCAL_VERSION = X_EXTENSION_LATEST_VERSION

const title = 'X 高频互动助手：任务排班与本地开发进展'
const description =
  'X 高频互动助手的下载包与本地开发源码版本说明，以及评论、点赞、关注、发帖、群聊分享和清理任务的使用文档。'
const shareText = 'X 高频互动助手：查看站点配置的下载包、本地开发版与任务说明。'

const VERSION_HISTORY = loadXExtensionReleaseWeeks()
  .flatMap((week) => week.entries)
  .filter((entry) => entry.version.startsWith('v4.'))
  .slice(0, 5)
  .map((entry, index) => ({
    version: entry.version,
    title: `${entry.date || '未注明日期'} · ${entry.status || '本地记录'}`,
    description: entry.body,
    current: index === 0,
  }))

export const metadata = {
  title,
  description,
  keywords: [
    'X 评论回复',
    'X高频互动助手',
    'Twitter 回复插件',
    'Chrome 浏览器插件',
    'X 时间线',
    'DeepSeek 定时发推',
    'X 自动发帖',
    '本地运行',
  ],
  alternates: {
    canonical: `/resources/${RESOURCE_SLUG}`,
  },
  openGraph: {
    title,
    description,
    url: RESOURCE_URL,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

function DownloadButton({ className = '' }) {
  return <ExtensionDownloadButton href={DOWNLOAD_URL} version={VERSION} className={className} />
}

const WORKFLOWS = [
  { title: '评论管理', detail: '评论首页、评论回复、评论大V分别保留进度，按排班依次占用共享执行页签。', icon: IconMessageCircle },
  { title: '点赞管理', detail: '点赞帖子与点赞评论分别计数，确认 X 页面结果后才记录成功。', icon: IconBell },
  { title: '关注管理', detail: '清理未回关、回关粉丝、关注候选分别配置；回关与关注候选共享每日计数和冷却。', icon: IconUsers },
  { title: '发帖与草稿', detail: '纯文字帖、精品发帖、X主题发帖、小红书图卡、普通发文和站长转发各自按规则运行；草稿任务不自动发布。', icon: IconRobot },
  { title: '社群分发', detail: '本地开发版从本人最新非置顶帖进入「Send via Chat」，只尝试可点击的群聊；真实页面全链路仍待验证。', icon: IconBrandX },
  { title: '清理管理', detail: '低质帖与低质评论独立处理、独立计数；删除前核对各自的条件。', icon: IconShieldLock },
]

const INSTALL_STEPS = [
  '核对下载按钮标注的打包版版本；本地开发版的新增功能以本页和文档中心单独标注。',
  '联系站长获取人员邀请码，下载 ZIP，解压后在 chrome://extensions/ 开启开发者模式并加载目录。',
  '登录 X，确认面板显示的账号与版本。重新加载扩展后，也要刷新已打开的 X 标签页。',
  '本地开发版新安装时回复模型默认全部不勾选；在模型设置中选用需要的服务并完成配置。',
  '本地开发版在排班台勾选要运行的任务，再点击「开始」；同一账号的任务共用一个执行页签。',
  '群聊分享、X主题发帖、小红书图卡等仍在本地开发或调试，先核对对应文档与版本范围。',
]

const TECH_NOTES = [
  '同一 Chrome 配置文件中的一个 X 账号使用一个共享执行页签；任务按到期时间和优先级轮换。',
  '回复模型按勾选项配置；密钥保存在 Chrome 扩展本地。AI 请求不附带 X 登录 Cookie。',
  '评论、点赞、发帖、关注和清理只在确认结果后计入本地统计；无法确认的动作会显示原因。',
  '本地开发版与可下载 ZIP 的功能和版本可能不同；下载按钮只代表当前配置的打包文件。',
  '更新已解压目录后，到 Chrome 扩展管理页重新加载扩展，再刷新已打开的 X 标签页。',
]

export default function XReplyClipboardResourcePage() {
  return (
    <PageContainer className="py-6 md:py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
      <header className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-[#050814] px-5 py-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:px-8 sm:py-8 md:rounded-[36px] md:px-10 md:py-10">
        <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(56,189,248,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.16)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden="true" />
        <div className="absolute -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-cyan-500/25 blur-[90px]" aria-hidden="true" />
        <div className="absolute -right-24 -top-16 -z-10 h-80 w-80 rounded-full bg-violet-600/30 blur-[100px]" aria-hidden="true" />

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
          <Link href="/tools" className="text-cyan-300 no-underline transition hover:text-cyan-200">工具库</Link>
          <span aria-hidden="true">/</span>
          <Link href="/tools#x-platform" className="text-slate-400 no-underline transition hover:text-white">X 工具</Link>
          <span aria-hidden="true">/</span>
          <Link href="/tools#browser-extensions" className="text-slate-400 no-underline transition hover:text-white">浏览器扩展</Link>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> v{VERSION} 下载版
          </span>
        </div>

        <div className="mt-8 w-full">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 backdrop-blur-sm">
                <IconBrandX size={15} aria-hidden="true" />
                X Interaction Copilot
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-300/15 px-3 py-1.5 text-xs font-bold text-amber-200">VIP 工具 · 密码领取</span>
            </div>
            <h1 className="text-[36px] font-black leading-[1.12] tracking-[-0.04em] text-white sm:text-[46px] lg:text-[50px]">
              X 高频互动助手
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">查看任务，掌握进度</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">
              下载按钮提供当前已打包版本；下方功能说明对应本地开发源码 v{LOCAL_VERSION}。本地版将十七项任务放进六组，同一账号共用一个执行页签，运行与等待进度保存在扩展本地。
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <DownloadButton />
              <Link
                href={`/resources/${RESOURCE_SLUG}/docs`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                文档中心
              </Link>
              <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享插件" />
              <ArticleActionsDropdown label="更多">
                <DistributeContentButton
                  title={title}
                  summary={shareText}
                  url={`/resources/${RESOURCE_SLUG}`}
                  category="tools"
                  slug={RESOURCE_SLUG}
                  tags={['X 平台', 'Chrome 插件', '工具']}
                  kindLabel="工具"
                />
              </ArticleActionsDropdown>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5"><IconBrandChrome size={15} className="text-cyan-300" /> Manifest V3</span>
              <span className="inline-flex items-center gap-1.5"><IconShieldLock size={15} className="text-emerald-300" /> 本地运行</span>
              <span className="inline-flex items-center gap-1.5"><IconRobot size={15} className="text-violet-300" /> 按需配置回复模型</span>
              <span>本地源码 v{LOCAL_VERSION} · 下载包 v{VERSION}</span>
            </div>
          </div>

          <figure className="mx-auto mt-8 w-full lg:mt-10">
            <div className="relative aspect-[2974/1844] overflow-hidden rounded-[20px] border border-white/20 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
              <Image
                src="/images/x-reply-clipboard-extension/panel-dual-account.webp"
                alt="X 高频互动助手同时开在 @tarsixseveneig1 与 @tuaranx：左侧评论首页正在执行，右侧排班台显示当前任务和等待安排"
                width={2974}
                height={1844}
                sizes="(min-width: 1120px) 1008px, calc(100vw - 72px)"
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-center text-xs leading-5 text-slate-400">双账号实拍 · @tarsixseveneig1 / @tuaranx</figcaption>
          </figure>
        </div>
      </header>

      <article className="prose-tuaran mt-12 !max-w-none">
        <div className="not-prose relative mb-14 overflow-hidden rounded-[26px] border border-blue-200/70 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-5 shadow-[0_16px_50px_rgba(37,99,235,0.09)] dark:border-blue-400/15 dark:from-[#0a1830] dark:via-[#0b1120] dark:to-[#1b1030] sm:p-7">
          <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-300">
                <IconBolt size={14} /> Ready to launch
              </p>
              <h2 className="m-0 mt-2 border-0 p-0 text-2xl font-black tracking-[-0.02em] text-slate-950 dark:text-white">
                把互动工作流装进 Chrome
              </h2>
              <p className="m-0 mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                扫码添加站长微信 {WECHAT_CONTACT.value}，获取解密密码。输入密码后下载 ZIP，解压并在 Chrome 扩展管理页安装。
              </p>
            </div>
            <DownloadButton className="shrink-0" />
          </div>
        </div>

        <section className="not-prose" aria-labelledby="workflow-heading">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="m-0 text-xs font-semibold tracking-[0.14em] text-blue-600 dark:text-cyan-300">功能与运行方式</p>
              <h2 id="workflow-heading" className="m-0 mt-2 border-0 p-0 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">本地开发版：六组十七项任务</h2>
            </div>
            <p className="m-0 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">排班台按到期时间轮换，同一账号共用执行页签；各任务进度独立保存。</p>
          </div>
          <ol className="m-0 list-none divide-y divide-slate-200 p-0 dark:divide-white/10">
            {WORKFLOWS.map(({ title, detail, icon: Icon }, index) => (
              <li key={title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 py-6 sm:grid-cols-[3rem_minmax(0,12rem)_minmax(0,1fr)] sm:gap-5 sm:py-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-cyan-400/10 dark:text-cyan-300" aria-hidden="true"><Icon size={21} stroke={1.8} /></span>
                <h3 className="m-0 border-0 p-0 pt-1 text-lg font-bold text-slate-950 dark:text-white"><span className="mr-2 font-mono text-xs font-medium text-slate-400 dark:text-slate-500">0{index + 1}</span>{title}</h3>
                <p className="col-span-2 m-0 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:col-span-1">{detail}</p>
              </li>
            ))}
          </ol>
          <div className="grid gap-6 border-t border-slate-200 pt-6 dark:border-white/10 sm:grid-cols-2 sm:gap-10">
            <div className="flex items-start gap-3">
              <IconSparkles size={21} stroke={1.8} className="mt-0.5 shrink-0 text-blue-600 dark:text-cyan-300" aria-hidden="true" />
              <div><h3 className="m-0 text-sm font-bold text-slate-950 dark:text-white">按需启用回复模型</h3><p className="m-0 mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">本地开发版新安装时默认全部不勾选；在模型设置中选用服务并完成配置。密钥保存在 Chrome 本地。</p></div>
            </div>
            <div className="flex items-start gap-3">
              <IconShieldLock size={21} stroke={1.8} className="mt-0.5 shrink-0 text-blue-600 dark:text-cyan-300" aria-hidden="true" />
              <div><h3 className="m-0 text-sm font-bold text-slate-950 dark:text-white">本地运行</h3><p className="m-0 mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">扩展在已登录的 X 页面内执行任务；AI 请求不包含 X 登录 Cookie。动作回执和统计按配置同步。</p></div>
            </div>
          </div>
        </section>

        <div className="not-prose mt-16">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Safety boundary</p>
          <h2 className="m-0 mt-2 border-0 p-0 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">使用前，先看清平台边界</h2>
        </div>
        <div className="not-prose relative my-8 overflow-hidden rounded-[26px] border border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 text-sm leading-7 text-slate-700 shadow-[0_16px_45px_rgba(225,29,72,0.08)] dark:border-rose-400/20 dark:from-[#250d19] dark:via-[#120d18] dark:to-[#211109] dark:text-rose-100 sm:p-7">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-rose-400/15 blur-3xl" aria-hidden="true" />
          <div className="relative flex gap-4">
            <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 shadow-sm dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-300 sm:inline-flex"><IconShieldLock size={22} /></span>
            <div>
              <p className="m-0 text-base font-bold text-rose-950 dark:text-rose-100">X 没有公开反自动化判定算法，也没有公布一个“低于此频率就安全”的操作间隔。</p>
              <ul className="mb-0 mt-4 grid gap-2.5 pl-5 marker:text-rose-500">
            <li>X 的自动化规则明确禁止使用脚本直接自动操作网站，并提示可能导致账号永久停用。</li>
            <li>自动回复仅适用于事先明确选择接收联系的用户，每次用户互动最多一条；AI 回复机器人需要事先获得 X 的书面批准。</li>
            <li>自动点赞不被允许；批量、激进或无差别自动关注和取关也被禁止。</li>
            <li>未认证账号每天 50 条原创帖、200 条回复以及每天关注 400 个，属于公开技术上限，不代表平台许可、合规保证或风控安全值。</li>
            <li>X 的开源算法仓库主要涉及时间线与通知的推荐流程，不提供自动化操作的安全频率或完整反垃圾判定逻辑。</li>
              </ul>
              <p className="mb-0 mt-4 border-t border-rose-200/70 pt-4 dark:border-rose-400/15">
            规则来源：{' '}
            <a href="https://help.x.com/en/rules-and-policies/x-automation" target="_blank" rel="noopener noreferrer">X 自动化规则</a>、{' '}
            <a href="https://help.x.com/en/rules-and-policies/x-limits" target="_blank" rel="noopener noreferrer">账户限制</a>和{' '}
            <a href="https://help.x.com/en/rules-and-policies/authenticity" target="_blank" rel="noopener noreferrer">真实性政策</a>。
              </p>
            </div>
          </div>
        </div>

        <div className="not-prose mt-16" id="version-history">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Release stream</p>
          <h2 className="m-0 mt-2 border-0 p-0 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">版本记录</h2>
        </div>
        <div className="not-prose my-8 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#080d19]">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-blue-50 to-violet-50 px-6 py-5 dark:border-white/10 dark:from-cyan-950/40 dark:via-blue-950/30 dark:to-violet-950/30 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">Changelog</p>
              <h3 className="m-0 mt-1 text-lg font-semibold text-[var(--site-ink)]">本地源码近期更新</h3>
            </div>
            <span className="w-fit rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
              本地源码 v{LOCAL_VERSION}
            </span>
          </div>
          <ol className="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-white/5">
            {VERSION_HISTORY.map((release) => (
              <li key={release.version} className={`grid gap-3 px-6 py-4 transition hover:bg-blue-50/50 dark:hover:bg-white/[0.025] md:grid-cols-[110px_minmax(0,1fr)] ${release.current ? 'bg-blue-50/60 dark:bg-blue-500/[0.06]' : ''}`}>
                <div className="flex items-center gap-2 md:items-start">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${release.current ? 'bg-sky-500 text-white' : 'bg-[#eff3f4] text-[#536471] dark:bg-gray-800 dark:text-gray-300'}`}>
                    {release.version}
                  </span>
                  {release.current ? <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-300">当前源码</span> : null}
                </div>
                <div>
                  <h4 className="m-0 text-sm font-semibold text-[var(--site-ink)]">{release.title}</h4>
                  <p className="m-0 mt-1 text-sm leading-6 text-[#66717a] dark:text-gray-400">{release.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="border-t border-slate-200 px-6 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:text-slate-300">
            站点配置的 ZIP 为 v{VERSION}；上方是本地源码记录，新增功能尚未打入该 ZIP。完整版本流水与使用边界见<Link href={`/resources/${RESOURCE_SLUG}/docs#releases`} className="ml-1 font-semibold text-blue-700 dark:text-cyan-300">文档中心</Link>。
          </div>
        </div>

        <div className="not-prose mt-16">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-300">Setup protocol</p>
          <h2 className="m-0 mt-2 border-0 p-0 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">安装与启动</h2>
        </div>
        <ol className="not-prose my-8 grid list-none gap-3 p-0 md:grid-cols-2">
          {INSTALL_STEPS.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0b1120]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 font-mono text-xs font-black text-white shadow-md shadow-blue-500/20">{String(index + 1).padStart(2, '0')}</span>
              <p className="m-0 text-sm leading-7 text-slate-700 dark:text-slate-300">{step}</p>
            </li>
          ))}
        </ol>

        <div className="not-prose my-10 overflow-hidden rounded-[26px] border border-cyan-300/15 bg-[#050814] text-white shadow-[0_22px_60px_rgba(15,23,42,0.24)]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <IconBolt size={17} className="text-cyan-300" />
              <h3 className="m-0 text-base font-bold text-white">运行细节</h3>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">Runtime notes</span>
          </div>
          <ul className="m-0 grid list-none gap-0 p-0 md:grid-cols-2">
            {TECH_NOTES.map((note, index) => (
              <li key={note} className="flex gap-3 border-b border-white/5 px-6 py-4 text-sm leading-7 text-slate-300 md:odd:border-r">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="not-prose relative mt-12 overflow-hidden rounded-[26px] border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-[0_20px_55px_rgba(79,70,229,0.25)] dark:border-white/10 sm:p-8">
          <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full border border-white/15" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Launch your workflow</p>
              <h2 className="m-0 mt-2 border-0 p-0 text-2xl font-black text-white">下载前核对版本</h2>
              <p className="m-0 mt-2 text-sm text-blue-100">当前下载包为 v{VERSION}；本地源码 v{LOCAL_VERSION} 的新增功能尚未打包。更新已解压目录后，重新加载扩展并刷新 X 页面。</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DownloadButton />
              <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
            </div>
          </div>
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
