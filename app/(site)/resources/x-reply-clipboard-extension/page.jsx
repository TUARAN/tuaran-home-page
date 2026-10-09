import Link from 'next/link'
import {
  IconArrowRight,
  IconBell,
  IconBolt,
  IconBrandChrome,
  IconBrandX,
  IconClock,
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
import SharePageButton from '../../components/SharePageButton'
import ExtensionDownloadButton from './ExtensionDownloadButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-reply-clipboard-extension&file=extension-zip'
const VERSION = '3.6.6'

const title = 'X高频互动助手：回复、互关与 DeepSeek 定时发推'
const description =
  'X高频互动助手是一个本地运行的 Chrome 扩展，提供时间线回复、通知回复、互关浇友和 DeepSeek 纯文字定时发推。'
const shareText = 'X高频互动助手：一个扩展完成时间线回复、通知回复、互关管理和 AI 定时发推。'

const VERSION_HISTORY = [
  {
    version: '3.6.6',
    title: '功能导航改为图标页签',
    description: '面板顶部的时间线、通知回复、互关浇友和推文浇给改成图标加文字的一排页签。当前项用蓝色文字和下划线标出，不再使用带底色的胶囊按钮。',
    current: true,
  },
  {
    version: '3.6.5',
    title: '推文浇给加入频率滑块',
    description: '推文浇给页面可以在慢、中、快、超快之间滑动。默认「中」仍是发送成功后随机等待 25～35 分钟。慢是 50～70 分钟，快是 12～18 分钟，超快是 6～10 分钟。已经开始的等待不会改写，新挡位从下一次发送成功后生效。',
  },
  {
    version: '3.6.4',
    title: '面板嵌进右侧搜索框下方',
    description: '面板直接排在 X 右侧栏搜索框下面，跟着页面滚动，不再用左下角浮层挡住时间线。右侧栏还没出现时先不显示，出现后自动挂回去。',
  },
  {
    version: '3.6.3',
    title: '频率调度改为四挡滑块',
    description: '时间线和通知回复的运行设置增加慢、中、快、超快四挡。拖动滑块后，每条间隔、每轮条数、每次轮数和执行后休息都会切换到对应区间。默认「中」保持原来的 5～15 秒、每轮 25～35 条、每次 3～5 轮、休息 2～3 小时。已经开始的计划和正在进行的等待不会中途改写。',
  },
  {
    version: '3.6.2',
    title: '移除插件每日回复总量限制',
    description: '时间线回复与通知回复不再共享插件自设的每日 100 条额度，也不会等到次日才恢复。随机回复间隔、随机轮次、执行后休息、通知去重和 X 风控提示停机机制继续保留。',
  },
  {
    version: '3.6.1',
    title: '重复回复自动换写、标题栏与下载修复',
    description: '识别 X 的重复内容提示：模板随机会切换下一句，AI 模式会避开被拒绝的文案重新生成并替换评论框。标题栏按钮统一改为 SVG；下载按钮只保存真正的 ZIP，接口错误改为页面中文提示。',
  },
  {
    version: '3.6.0',
    title: '随机频率调度、共享每日额度与风控停止',
    description: '时间线每次执行固定抽取 3～5 轮，每轮固定抽取 25～35 条；每条成功后随机等待 5～15 秒，执行完成后随机休息 2～3 小时。抽取结果和真实截止时间跨刷新保留。时间线与通知回复共享每日 100 条插件额度；检测到 X 疑似自动化提示时停止所有任务，不再自动重试。',
  },
  {
    version: '3.5.0',
    title: '在插件内加入官方规则与版本文档中心',
    description: '标题栏新增文档中心入口，集中解释 X 的自动化规则、公开技术上限、反自动化提示和应对方式，并在插件内保留最近版本记录。文档明确区分技术上限、平台许可与风控安全值：X 没有公开反自动化评分算法，也没有认可插件当前的操作间隔或轮次参数。',
  },
  {
    version: '3.4.1',
    title: '阻止密码管理器把 X 密码填进 AI Key',
    description: 'DeepSeek Key 输入框改为普通文本字段配合视觉掩码，并加入主流密码管理器忽略标记，不再被识别成 X 登录密码框。保存时必须是以 sk- 开头的 DeepSeek Key；升级后若检测到旧版误存的其他内容会自动清除。',
  },
  {
    version: '3.4.0',
    title: '回复任务升级为长期循环并加入稳定运行计时',
    description: '时间线每完成 5 轮、通知回复每处理完近 2 小时内容后，都会休息 2 小时再自动开始下一次；处理历史继续防止通知重复互动。标题栏显示整个插件的稳定运行时长，各任务保留独立运行时长。页面暂时不可用时保存真实重连截止时间，刷新、切页签或扩展后台重启后继续恢复。',
  },
  {
    version: '3.3.3',
    title: '修复切换浏览器页签后任务停止',
    description: '离屏 Worker 到点后，由扩展后台按原始 tabId 和 frameId 将唤醒消息精确发回任务页签，不再依赖会被 Chrome 后台限频的页面计时器。时间线、通知回复、互关浇友和推文浇给切到后台后都能继续推进。',
  },
  {
    version: '3.3.2',
    title: '修复内容已出现但没有点击 Post',
    description: '发帖模式不再把多段正文作为一次 insertText 写入，改为每行一个 DraftJS block，避免末段被复制到首段。写入后重新获取 X 替换过的编辑器节点，再核对当前内容、等待 Post 可用并点击发送。',
  },
  {
    version: '3.3.1',
    title: '修复 AI 定时发推找不到 Post 按钮',
    description: '适配 X 首页编辑器与 Post 按钮相隔较深的真实 DOM：扩大同区查找范围，并增加全页可见按钮兜底。失败原因会保留在倒计时中，未发出的内容按 1 分钟重试，不再反复生成新文案。',
  },
  {
    version: '3.3.0',
    title: '四类任务改用独立 X 页签并行运行',
    description: '顶部功能导航改为任务页签入口：已有页签会直接切回，没有则新建并传入对应任务。时间线、通知回复、互关浇友和推文浇给分别保存状态，切换面板功能不会清空或停止其他任务。回复状态与当前内容合并为一张提示卡。',
  },
  {
    version: '3.2.0',
    title: '新增「推文浇给」AI 定时发推',
    description: 'DeepSeek 从当前时间线与趋势区提炼话题，生成带空行排版的纯文字推文；发送成功后随机等待 25～35 分钟。后台计时同时改为长等待走离屏 Worker、短 DOM 轮询留在页面内，减少跨进程消息和无效重试。',
  },
  {
    version: '3.1.6',
    title: '时间线优先并精简 AI 配置',
    description: '时间线调整为第一项和默认项，其后为通知回复、互关浇友；删除 DeepSeek 测试连接，并用扩展离屏计时 Worker 保持后台任务运行。',
  },
  {
    version: '3.1.5',
    title: '支持后台页签继续执行',
    description: '移除切换浏览器页签后的主动暂停；等待和频率限制改按真实时间计算，切回 X 时不会重新等待。',
  },
  {
    version: '3.1.4',
    title: '通知回复改为两小时时间窗',
    description: '通知模式只处理最近 2 小时内尚未互动的回复，完成后停止；成功记录持久保存，后续运行不会重复处理。',
  },
  {
    version: '3.1.3',
    title: '合并关注频率与每日额度',
    description: '回关粉丝与关注候选统一为 2 秒一个，共享每批 15 个、暂停 30 分钟和每日合计 400 个的状态。',
  },
  {
    version: '3.1.2',
    title: '重建助手导航层级',
    description: '顶部改为明确的功能导航，开始按钮移动到工作区首位；回复方式与频率限制合并为可折叠的运行设置。',
  },
  {
    version: '3.1.1',
    title: '互关子 Tab 与标题栏修复',
    description: '互关三项任务改为独立子 Tab，选择后跳转到对应列表；同时压缩标题栏状态区，避免窄面板下控件拥挤。',
  },
  {
    version: '3.1.0',
    title: '互关能力完成合并',
    description: '新增「互关浇友」Tab，完整整合清理未回关、回关粉丝与关注候选；任务运行时锁定其他 Tab。',
  },
  {
    version: '3.0.0',
    title: '升级为 X高频互动助手',
    description: '增加时间线回复与通知回复双助手；通知模式识别别人对当前账号的回复，确认点赞后再发送回复。',
  },
  {
    version: '2.1.0',
    title: '重新设计任务进度',
    description: '用一条五色分段进度条表示 5 轮、175 次任务，并集中展示当前轮、本轮次数、总次数和运行时间。',
  },
  {
    version: '2.0.0',
    title: '新增 DeepSeek AI 模式',
    description: '可读取当前推文文字生成自然回复；API Key 保存在 Chrome 本地，请求设置 10 秒超时。',
  },
  {
    version: '1.5.0',
    title: '面板支持折叠与放大',
    description: '重构信息层级，加入迷你状态与放大视图，显示模式随当前标签页保存。',
  },
  {
    version: '1.4.0',
    title: '话术池扩充到 100 条',
    description: '短词、单字和纯 Emoji 改写为更自然的完整句子，同时保留旧话术识别能力。',
  },
  {
    version: '1.3.0',
    title: '加入轮次与频率限制',
    description: '35 次回复组成一轮，一次执行 5 轮；每条回复与每轮之间的等待时间可单独设置。',
  },
  {
    version: '1.2.0',
    title: '新增运行时间统计',
    description: '跨页面刷新累计运行时间，停止或完成任务后保留最终用时。',
  },
  {
    version: '1.1.0',
    title: '加入可浏览话术池',
    description: '当前话术自动升到首位、高亮并播放扫光动画，切换时形成走马灯效果。',
  },
  {
    version: '1.0.0',
    title: '完成第一版正式界面',
    description: '加入轮次、整体进度、运行状态、当前话术与重试次数，统一使用真实的自动发送状态描述。',
  },
  {
    version: '0.2.13–0.2.18',
    title: '集中修复 X 编辑器兼容问题',
    description: '解决重复写入、占位文字混入、编辑器定位错误、空弹窗接管和发送成功后弹窗残留等问题。',
  },
  {
    version: '0.2.1',
    title: '建立自动回复闭环',
    description: '从时间线打开评论弹窗，随机选择固定话术、写入 X 编辑器并点击 Reply，成功 35 条后刷新继续。',
  },
]

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

const FEATURE_ICONS = [IconMessageCircle, IconUsers, IconSparkles, IconClock, IconBell, IconRobot, IconShieldLock]
const FEATURE_TONES = [
  'from-cyan-400/20 to-blue-500/5 text-cyan-300 border-cyan-300/20',
  'from-violet-400/20 to-fuchsia-500/5 text-violet-300 border-violet-300/20',
  'from-fuchsia-400/20 to-pink-500/5 text-fuchsia-300 border-fuchsia-300/20',
  'from-blue-400/20 to-indigo-500/5 text-blue-300 border-blue-300/20',
  'from-amber-400/20 to-orange-500/5 text-amber-300 border-amber-300/20',
  'from-emerald-400/20 to-cyan-500/5 text-emerald-300 border-emerald-300/20',
  'from-slate-300/15 to-cyan-500/5 text-slate-200 border-slate-300/20',
]

const INSTALL_STEPS = [
  '下载并解压插件包。',
  '打开 Chrome 的 chrome://extensions/，开启「开发者模式」。',
  '点击「加载已解压的扩展程序」，选择解压后的目录。',
  '登录 X，面板出现在右侧搜索框下方，默认选择「时间线」；也可切换到「通知回复」「互关浇友」或「推文浇给」。',
  '互关模式按页面选择清理未回关、回关粉丝或关注候选；前两项会引导打开自己的对应列表。',
  '关注候选不会自动跳转。请先打开其他作者的 Followers 页面；它与回关粉丝共享频率状态和每日额度。',
  '时间线模式可在首页、个人主页或搜索结果运行。运行设置里把频率滑到慢、中、快或超快；默认「中」每次随机安排 3～5 轮，每轮 25～35 条。',
  '通知模式会进入通知页，处理近 2 小时内尚未成功互动的回复。',
  '推文浇给会进入 X 首页，使用已保存的 DeepSeek Key 生成并发送纯文字推文。发推间隔可滑到慢、中、快或超快，默认「中」是 25～35 分钟。',
  '点击对应任务的开始按钮运行；需要停下时，点击「停止」。',
]

const TECH_NOTES = [
  '“推文浇给”与 AI 回复共用一个 DeepSeek API Key。Key 只保存在 Chrome 扩展本地存储中，不会发送 X 登录 Cookie。',
  '四类任务各自绑定一个专用 X 页签，可以同时运行；离屏计时 Worker 管理后台等待，刷新页面后会按保存的真实截止时间恢复。',
  '插件会先核对评论框里的文字没有重复，再等待 Reply 可用；存在无法识别的手写内容时会暂停，避免覆盖。',
  '发送结果未确认时不会计数。时间线模式只有确认发出的回复才计入轮次，通知模式只有确认点赞并回复成功后才写入去重历史。',
  '已经加载过旧版目录时，到扩展管理页点击刷新，再回到 X 刷新已打开的标签页。',
]

function FeatureCard({ title, children, index, className = '' }) {
  const Icon = FEATURE_ICONS[index] || IconBolt
  const tone = FEATURE_TONES[index] || FEATURE_TONES[0]
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_45px_rgba(37,99,235,0.12)] dark:border-white/10 dark:bg-[#0b1120] dark:hover:border-cyan-300/30 ${className}`}>
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${tone} opacity-60 blur-2xl transition group-hover:opacity-90`} aria-hidden="true" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${tone}`}>
            <Icon size={22} stroke={1.8} aria-hidden="true" />
          </span>
          <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500">0{index + 1}</span>
        </div>
        <h3 className="mb-2 text-base font-bold text-slate-950 dark:text-white">{title}</h3>
        <p className="m-0 text-sm leading-7 text-slate-600 dark:text-slate-300">{children}</p>
      </div>
    </div>
  )
}

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
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> v{VERSION} LIVE
          </span>
        </div>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.72fr)]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 backdrop-blur-sm">
              <IconBrandX size={15} aria-hidden="true" />
              X Interaction Copilot
            </div>
            <h1 className="max-w-3xl text-[38px] font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-[52px] lg:text-[64px]">
              让每一次互动，
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">都有自己的运行轨道</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">
              时间线回复、通知回复、互关管理与 DeepSeek 定时发推集中在一个本地面板。四类任务使用独立页签运行，状态、计时和处理历史各自保存。
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <DownloadButton />
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
              <span className="inline-flex items-center gap-1.5"><IconRobot size={15} className="text-violet-300" /> DeepSeek 可选</span>
              <span>更新于 2026-10-09</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="absolute inset-8 rounded-full bg-blue-500/30 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-white/[0.07] p-3 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-3 pb-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black"><IconBrandX size={17} /></span>
                  <div>
                    <p className="m-0 text-xs font-bold text-white">X高频互动助手</p>
                    <p className="m-0 font-mono text-[9px] text-slate-400">CONTROL DECK · ONLINE</p>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 font-mono text-[9px] text-emerald-300">运行中 02:18:43</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 pt-4">
                {[
                  ['时间线回复', '四挡 · 可滑动', IconMessageCircle, 'from-cyan-400/20 to-blue-500/10', 'text-cyan-300'],
                  ['通知回复', '近 2 小时', IconBell, 'from-violet-400/20 to-fuchsia-500/10', 'text-violet-300'],
                  ['互关浇友', '3 项任务', IconUsers, 'from-amber-400/20 to-orange-500/10', 'text-amber-300'],
                  ['推文浇给', 'AI · 四挡间隔', IconRobot, 'from-emerald-400/20 to-cyan-500/10', 'text-emerald-300'],
                ].map(([label, value, Icon, gradient, color]) => (
                  <div key={label} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-3.5`}>
                    <Icon size={19} className={color} stroke={1.8} aria-hidden="true" />
                    <p className="mb-0 mt-5 text-xs font-bold text-white">{label}</p>
                    <p className="mb-0 mt-1 font-mono text-[10px] text-slate-400">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mx-2 mb-2 mt-1 rounded-2xl border border-white/10 bg-black/25 p-3.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>当前任务 · 时间线回复</span><span className="font-mono text-cyan-300">68%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400" /></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <article className="prose-tuaran mt-12">
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
                Manifest V3 本地扩展。下载并解压后，在 Chrome 扩展管理页通过「加载已解压的扩展程序」安装。
              </p>
            </div>
            <DownloadButton className="shrink-0" />
          </div>
        </div>

        <div className="not-prose flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-300">Core modules</p>
            <h2 className="m-0 mt-2 border-0 p-0 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">一块面板，七种能力</h2>
          </div>
          <p className="m-0 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">从内容互动到账号关系，每项任务都有独立状态与运行节奏。</p>
        </div>
        <div className="not-prose my-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title="时间线默认置顶" index={0}>
            顶部按时间线、通知回复、互关浇友、推文浇给排列；新安装默认选中时间线。点击其他功能会切换到已有专用 X 页签，或新建一个页签，当前任务不会被清空。
          </FeatureCard>
          <FeatureCard title="互关浇友" index={1}>
            在 Following 页清理未回关账号；在 Followers 页回关粉丝，也可按低频限制关注候选。原独立互关插件的三项能力已经合并。
          </FeatureCard>
          <FeatureCard title="随机话术" index={2}>
            默认使用“模板随机”，从插件内置的 100 条完整话术里随机抽取。也可切换到“AI 模式”，由 DeepSeek 阅读原帖文字后生成更适配的回复；API Key 由用户在扩展面板中自行配置并保存在 Chrome 本地。
          </FeatureCard>
          <FeatureCard title="时间线：持久化随机计划" index={3}>
            运行设置里用滑块选择慢、中、快或超快。默认「中」每次抽取 3～5 轮，每轮 25～35 条，成功后随机等待 5～15 秒，完成后随机休息 2～3 小时。计划、进度与真实截止时间跨刷新保留，不会因刷新重新抽取。
          </FeatureCard>
          <FeatureCard title="通知：最近 2 小时" index={4}>
            不设轮次和固定总条数。每次只识别近 2 小时内包含“Replying to @当前账号”的回复通知。每条间隔和扫描后的休息使用同一套频率挡位，默认「中」休息 2～3 小时。成功记录持久去重，插件不设置每日回复总量。
          </FeatureCard>
          <FeatureCard title="推文浇给：可调发推间隔" index={5}>
            DeepSeek 读取当前页面可见的趋势与时间线文字，选择一个有讨论空间的话题，生成 3～5 段纯文字推文。每段之间自动空一行。发推页用滑块选择慢、中、快或超快；默认「中」在发送成功后随机等待 25～35 分钟再生成下一条。
          </FeatureCard>
          <FeatureCard title="只在本机运行" index={6} className="md:col-span-2 lg:col-span-3">
            插件匹配 x.com 和 twitter.com，使用你已经登录的页面。不读取密码，也不把评论内容上传到本站。AI 模式只把当前原帖文字发送给 DeepSeek，不会发送 X 登录 Cookie。
          </FeatureCard>
        </div>

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
              <h3 className="m-0 mt-1 text-lg font-semibold text-[var(--site-ink)]">从时间线回复到完整互动工具</h3>
            </div>
            <span className="w-fit rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
              当前版本 v{VERSION}
            </span>
          </div>
          <ol className="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-white/5">
            {VERSION_HISTORY.map((release) => (
              <li key={release.version} className={`grid gap-3 px-6 py-4 transition hover:bg-blue-50/50 dark:hover:bg-white/[0.025] md:grid-cols-[110px_minmax(0,1fr)] ${release.current ? 'bg-blue-50/60 dark:bg-blue-500/[0.06]' : ''}`}>
                <div className="flex items-center gap-2 md:items-start">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${release.current ? 'bg-sky-500 text-white' : 'bg-[#eff3f4] text-[#536471] dark:bg-gray-800 dark:text-gray-300'}`}>
                    v{release.version}
                  </span>
                  {release.current ? <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-300">最新版</span> : null}
                </div>
                <div>
                  <h4 className="m-0 text-sm font-semibold text-[var(--site-ink)]">{release.title}</h4>
                  <p className="m-0 mt-1 text-sm leading-6 text-[#66717a] dark:text-gray-400">{release.description}</p>
                </div>
              </li>
            ))}
          </ol>
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
              <h2 className="m-0 mt-2 border-0 p-0 text-2xl font-black text-white">准备好后，从最新版开始</h2>
              <p className="m-0 mt-2 text-sm text-blue-100">下载后可永久重复领取；更新扩展时保留原目录并重新加载即可。</p>
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
