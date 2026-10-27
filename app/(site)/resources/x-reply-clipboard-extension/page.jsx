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
import SharePageButton from '../../components/SharePageButton'
import ExtensionDownloadButton from './ExtensionDownloadButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-reply-clipboard-extension&file=extension-zip'
const VERSION = '3.32.44'

const title = 'X高频互动助手：评论、点赞、关注与定时发帖'
const description =
  'X高频互动助手是本地运行的 Chrome 扩展，提供评论、点赞、关注管理和定时发帖；全流程按任务状态调度。'
const shareText = 'X高频互动助手：在本地面板查看评论、点赞、关注和定时发帖的任务进度。'

const VERSION_HISTORY = [
  {
    version: '3.32.44',
    title: '修复 Grok 评论重复',
    description: '合并模型生成的重复 Grok 问题；写入回复框时避免提及补全重复插入，发送前核对草稿全文。',
    current: true,
  },
  {
    version: '3.32.43',
    title: '评论、任务状态与发帖卡片更新',
    description: '评论帖子加入约 20% 的 Grok 补充观点提问；七项任务显示后台等待与受限状态，点赞限制判断改为核对点击结果；发帖文字卡片增加四种版式。',
  },
  {
    version: '3.32.22',
    title: '降低站点用量',
    description: '减少运行状态上报频率，避免插件持续运行时产生过多站点请求。',
  },
  {
    version: '3.32.21',
    title: '全流程任务队列与异常恢复',
    description: '评论任务常驻；点赞、关注和发帖按后台队列轮换。等待与冷却截止时间保存在扩展本地，到期重开任务窗口；连续 3 次受限后停止该任务自动重试，详情显示原因。',
  },
  {
    version: '3.32.0',
    title: '任务状态与本地更新',
    description: '新增任务详情、暂停后的自动重扫和本地新版提醒；评论通知只回复，清理未回关按资料中的中文判断。',
  },
  {
    version: '3.12.1',
    title: '热点发帖提示词与取材修正',
    description: '发帖实际使用设置中的提示词；旧草稿不再发送。知乎、头条优先，素材不足时读取站内舆情分析，并保留来源。写法避免固定三行和空悬念。下载需联系站长获取密码。',
  },
  {
    version: '3.9.0',
    title: '短行发帖与设置自动保存',
    description: '定时发帖保留素材首句，改写为 35～75 字、3～5 行，每行之间留空行；过长的旧草稿会跳过。配置 DeepSeek Key 后主面板收起密钥栏，设置中的修改自动保存。任务等待可手动点击「立即开始」。PDF 导出已并入右上角工具箱。',
  },
  {
    version: '3.6.11',
    title: '收起回复说明卡',
    description: '时间线和通知回复不再展示计划说明，也不再重复当前 AI 回复。轮次进度还在。只有发送失败、密钥无效或评论过密被停时，才出现一行提示。',
  },
  {
    version: '3.6.10',
    title: '开始按钮合并密钥输入',
    description: '时间线和通知回复只保留一个开始按钮，文字居中。还没保存 DeepSeek Key 时，在这个按钮里粘贴后直接开始。保存之后输入框收起，之后到右上角设置里修改。',
  },
  {
    version: '3.6.9',
    title: '评论过密时停止时间线和通知回复',
    description: '评论框或页面底部出现“看起来像自动操作”或“Something went wrong, but don’t fret”时，时间线回复和通知回复都会停止，不再自动重试。互关和定时发推不受这次停止影响。',
  },
  {
    version: '3.6.8',
    title: '回复只保留 AI，频率收进轮次',
    description: '时间线和通知回复不再提供模板随机，也不再展示话术池。回复由 DeepSeek 阅读原帖后生成。频率滑块放在轮次进度里，原来的运行设置收起来了。',
  },
  {
    version: '3.6.7',
    title: '默认右下角浮窗，嵌入改为设置项',
    description: '面板默认浮在页面右下角。标题栏齿轮里可以打开设置，「嵌入到页面」会把面板挂到右侧搜索框下面。右侧栏还没出现时先保持浮窗，出现后再挂上去。',
  },
  {
    version: '3.6.6',
    title: '功能导航改为图标页签',
    description: '面板顶部的时间线、通知回复、互关浇友和推文浇给改成图标加文字的一排页签。当前项用蓝色文字和下划线标出，不再使用带底色的胶囊按钮。',
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

const WORKFLOWS = [
  {
    title: '评论管理',
    detail: '评论帖子与评论通知分别使用独立窗口。通知只处理近 2 小时内的回复，不执行点赞；评论任务在全流程中常驻运行。',
    icon: IconMessageCircle,
  },
  {
    title: '点赞管理',
    detail: '点赞帖子与点赞评论分别记录处理历史。全流程按后台队列轮换非评论任务，连续 3 次受限后停止自动重试。',
    icon: IconBell,
  },
  {
    title: '关注管理',
    detail: '在 Following 页清理未回关账号，在 Followers 页回关粉丝。关注候选当前暂停使用。',
    icon: IconUsers,
  },
  {
    title: '定时发帖',
    detail: '优先从知乎、今日头条取材，必要时补充 AI HOT，再使用本地社会观察素材。每轮准备一条，记录来源和链接；默认发送间隔为 25～35 分钟。',
    icon: IconRobot,
  },
]

const INSTALL_STEPS = [
  '扫码联系站长获取解密密码，输入密码下载并解压插件包。',
  '打开 Chrome 的 chrome://extensions/，开启「开发者模式」。',
  '点击「加载已解压的扩展程序」，选择解压后的目录。',
  '登录 X，面板默认浮在页面右下角。使用 AI 回复或发帖前，先在模型设置中配置所需密钥。',
  '点击「全流程启动」后，评论任务常驻，点赞、关注和发帖按后台队列轮换；顶部页签只切换对应窗口。',
  '关注管理提供清理未回关、回关粉丝两个可用子页签；关注候选当前暂停使用。',
  '时间线模式可在首页、个人主页或搜索结果运行。轮次进度里把频率滑到慢、中、快或超快；默认「中」每次随机安排 3～5 轮，每轮 25～35 条。',
  '通知回复会进入通知页，处理近 2 小时内尚未成功互动的回复。',
  '定时发帖优先读取知乎与今日头条热榜，素材不足时读取站内舆情分析。默认间隔为 25～35 分钟。',
  '单独运行时点击对应的「启动单项任务」；倒计时可点「立即开始」，需要停下时点击停止。',
]

const TECH_NOTES = [
  '模型密钥保存在 Chrome 扩展本地存储中；AI 请求不会附带 X 登录 Cookie。',
  '评论任务可持续运行；点赞、关注和发帖按后台队列轮换。等待与冷却截止时间保存在扩展本地，到期重开任务窗口。',
  '插件会先核对评论框里的文字没有重复，再等待 Reply 可用；存在无法识别的手写内容时会暂停，避免覆盖。',
  '发送结果未确认时不会计数。评论帖子只有确认发出的回复才计入轮次，评论通知只有确认回复成功后才写入去重历史。',
  '已经加载过旧版目录时，到扩展管理页点击刷新，再回到 X 刷新已打开的标签页。',
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

        <div className="mt-8 grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
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
              评论帖子与通知、点赞、关注管理和定时发帖集中在本地面板。全流程让评论任务持续运行，其他任务按后台队列轮换，进度与等待时间保存在扩展本地。
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
              <span className="inline-flex items-center gap-1.5"><IconRobot size={15} className="text-violet-300" /> DeepSeek 配置</span>
              <span>打包于 2026-10-26</span>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-[360px] lg:my-0">
            <div className="relative aspect-[720/737] overflow-hidden rounded-[20px] border border-white/20 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
              <Image
                src="/images/x-reply-clipboard-extension/panel-real-v3.32.20.webp"
                alt="X 高频互动助手任务区旧版截图，显示今日统计、功能导航和评论进度"
                width={726}
                height={1092}
                sizes="(max-width: 640px) calc(100vw - 72px), 360px"
                priority
                className="absolute bottom-0 right-0 block h-auto w-[101%] max-w-none"
              />
            </div>
            <figcaption className="mt-3 text-center text-xs leading-5 text-slate-400">任务区示意 · 旧版面板截图</figcaption>
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
                扫码添加站长微信 atar24，获取解密密码。输入密码后下载 ZIP，解压并在 Chrome 扩展管理页安装。
              </p>
            </div>
            <DownloadButton className="shrink-0" />
          </div>
        </div>

        <section className="not-prose" aria-labelledby="workflow-heading">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="m-0 text-xs font-semibold tracking-[0.14em] text-blue-600 dark:text-cyan-300">功能与运行方式</p>
              <h2 id="workflow-heading" className="m-0 mt-2 border-0 p-0 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">四组功能，按计划运行</h2>
            </div>
            <p className="m-0 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">顶部页签可切换到已有专用 X 窗口，或新建窗口；任务进度独立保存。</p>
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
              <div><h3 className="m-0 text-sm font-bold text-slate-950 dark:text-white">AI 回复</h3><p className="m-0 mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">评论内容由已启用的模型读取原帖文字后生成。模型密钥在扩展面板配置，保存在 Chrome 本地。</p></div>
            </div>
            <div className="flex items-start gap-3">
              <IconShieldLock size={21} stroke={1.8} className="mt-0.5 shrink-0 text-blue-600 dark:text-cyan-300" aria-hidden="true" />
              <div><h3 className="m-0 text-sm font-bold text-slate-950 dark:text-white">本地运行</h3><p className="m-0 mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">插件在已登录的 x.com 或 twitter.com 页面运行。不读取密码，也不把评论上传到本站；AI 请求不包含 X 登录 Cookie。</p></div>
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
              <p className="m-0 mt-2 text-sm text-blue-100">联系站长获取密码后即可下载；更新扩展时保留原目录并重新加载即可。</p>
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
