import Link from 'next/link'
import Image from 'next/image'

import { loadXExtensionReleaseWeeks } from '../../../../../lib/community/xExtensionReleaseWeeks'
import { X_EXTENSION_LATEST_VERSION } from '../../../../../lib/community/xExtensionVersion'
import { getResourceDelivery } from '../../../../../lib/content/resourceCatalog'
import PageContainer from '../../../components/PageContainer'
import DocsHashNavigation from './DocsHashNavigation'
import DocsToc from './DocsToc'
import PostWaveTimeline from './PostWaveTimeline'
import PromptVoteLedger from './PromptVoteLedger'
import TaskWindowPlan from './TaskWindowPlan'

export const dynamic = 'force-static'

const RELEASE_WEEKS = loadXExtensionReleaseWeeks()

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const DOCS_PATH = `/resources/${RESOURCE_SLUG}/docs`
const RESOURCE_PATH = `/resources/${RESOURCE_SLUG}`
const DOCS_URL = `https://2aran.com${DOCS_PATH}`
const DOWNLOAD_VERSION = getResourceDelivery('resource:x-reply-clipboard-extension', 'extension-zip')?.fileName?.match(/-v([\d.]+)\.zip$/)?.[1] || '待核对'

const title = 'X高频互动助手文档中心'
const description =
  'X 高频互动助手使用手册：快速开始、十七项任务、排班设置、异常恢复、数据维护与版本记录。'

export const metadata = {
  title,
  description,
  alternates: { canonical: DOCS_PATH },
  openGraph: {
    title,
    description,
    url: DOCS_URL,
    type: 'article',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

const VERSION_ERAS = [
  {
    id: 'era-v0',
    version: 'v0',
    title: '原型闭环',
    span: '约 0.2.x',
    oneLiner: '固定话术自动开评、写入、点 Reply。',
    points: [
      '从时间线打开评论弹窗，随机选固定话术写入 X 编辑器并发送。',
      '集中修 DraftJS / 编辑器兼容：重复写入、占位混入、空弹窗接管、发送后弹窗残留。',
      '节奏雏形：每轮 35 条、一次 5 轮共 175 条后停止；已回帖 ID 跨刷新保留。',
    ],
  },
  {
    id: 'era-v1',
    version: 'v1',
    title: '正式面板',
    span: '1.0–1.5',
    oneLiner: '看得见进度的第一版产品界面。',
    points: [
      '正式面板：轮次、整体进度、运行状态、当前话术与重试次数。',
      '可浏览话术池（55→100 条），当前话术高亮走马灯；短词改写成完整句子。',
      '加入运行计时，以及条间 / 轮间可调间隔；面板可折叠与放大。',
    ],
  },
  {
    id: 'era-v2',
    version: 'v2',
    title: 'AI 回复',
    span: '2.0–2.1',
    oneLiner: '模板随机之外，按帖文生成自然回复。',
    points: [
      '新增 DeepSeek AI 模式：读当前帖文字生成 15～50 字中文回复；Key 只存本机。',
      '默认仍可用 100 条模板随机；AI 请求关思考、约 10 秒超时。',
      '进度改成一条五色分段条，同时表达 5 轮与 175 次，减少卡片堆叠。',
    ],
  },
  {
    id: 'era-v3',
    version: 'v3',
    title: '多任务并行',
    span: '3.0–3.32',
    oneLiner: '改名高频互动助手；多页签各跑一类任务。',
    points: [
      '3.0 起：时间线回复 + 通知回复；随后并入互关三项、点赞、定时发帖。',
      '3.3 起四类任务各占独立 X 页签并行；长期循环、四挡频率、风控冷却与文档中心成型。',
      '后期补全流程总控、站长监控、精品发帖、本地热更新；评论常驻、其余队列轮换——页签多、切换与空等仍是主矛盾。',
    ],
  },
  {
    id: 'era-v4',
    version: 'v4',
    title: '单页签排班',
    span: '4.0 起',
    oneLiner: '一账号一个执行页签，十七项按到期串行轮班。',
    points: [
      '冷却、档期只卡住自己；到期项立刻接手，不再为无关等待干耗页签。',
      '排班台卡片可勾选参与；右侧「查看」进子页改优先级/时段与速度并启停。',
      '在此底座上继续加评论大V、清理低质帖、提示词台账、不限速等，仍共用同一执行页签。',
    ],
  },
]

const TOC = [{'heading': '开始使用', 'items': [{'id': 'quick-start', 'label': '快速开始'}, {'id': 'flow', 'label': '运行与界面'}, {'id': 'task-window-plan', 'label': '面板截图'}, {'id': 'states', 'label': '状态和按钮'}]}, {'heading': '任务与配置', 'items': [{'id': 'tasks', 'label': '十七项任务'}, {'id': 'community-share', 'label': '社群分发', 'depth': 2}, {'id': 'comments', 'label': '评论管理'}, {'id': 'likes', 'label': '点赞管理'}, {'id': 'mutual-rules', 'label': '关注与取关'}, {'id': 'poster', 'label': '发帖、草稿与清理'}, {'id': 'prune-posts', 'label': '清理低质帖'}, {'id': 'prune-replies', 'label': '清理低质评论'}, {'id': 'schedule-order', 'label': '排序'}, {'id': 'frequency', 'label': '速度与排班设置'}, {'id': 'prompt-feedback', 'label': '提示词反馈台账'}]}, {'heading': '排查与维护', 'items': [{'id': 'risk', 'label': '异常恢复'}, {'id': 'rules', 'label': '平台边界'}, {'id': 'maintenance', 'label': '更新与数据'}]}, {'heading': '历史与观察', 'items': [{'id': 'history', 'label': '版本演进'}, {'id': 'releases', 'label': '周总结'}, {'id': 'ops-journal', 'label': '运营纪事'}]}]

const STATE_ROWS = [
  ['运行中', '当前任务正在扫描、生成或发送；详情显示最近更新时间。'],
  ['等待中', '在排队、冷却、档期倒计时，或正在停止。详情写明原因和剩余时间。'],
  ['需处理', '要你先确认账号或详情后再继续，例如点赞 / 关注 / 发帖连续受限。评论三项一般继续倒计时，不进此态。'],
  ['已停止', '还没启动、已手动停，或全流程已关。可点排班台右上角「开始」，也可在任务子页单独启动。'],
]

// 主区是状态点和一句提示。排班台右上角在「暂停全部」和「开始」之间切换。
const FLOW_BUTTON_ROWS = [
  ['还没跑 / 已全停', '状态点', '右上角「开始」', '点「开始」启动排班；评论先跑，其他进队列。'],
  ['正在打开执行页', '状态点', '右上角暂时不可点', '等它自己开好。'],
  ['有任务在跑', '状态点', '右上角「暂停全部」', '看排班台；单项启停去任务子页。'],
  ['在排队等下一项', '状态点', '右上角「暂停全部」', '到期会自动切换；倒计时写在调度卡上。'],
  ['部分任务还没进队', '状态点', '右上角「暂停全部」', '排班已经开着。已有倒计时保留。'],
  ['排班关了但仍有冷却', '状态点', '右上角「开始」', '点「开始」重新打开排班；原来的倒计时还在。'],
  ['正在全停', '状态点', '右上角暂时不可点', '等停完。停完后右上角变成「开始」。超时后可再点「暂停全部」。'],
  ['状态对不上', '状态点', '右上角「开始」', '点「开始」核对并启动未运行项。'],
  ['任务连续受限', '状态点', '看详情', '先看详情和账号；确认后在子页单独启动。'],
]

const SINGLE_BUTTON_ROWS = [
  ['正在执行', '运行中 · 点击停止', '只停止当前任务；正常排程的“立即开始”仍只跳过普通等待。'],
  ['在共用执行页签运行', '运行中 · 点击查看', '只打开面板详情，不改变排班。当前任务卡上的「查看」也会打开当前任务子页。'],
  ['后台队列或自动恢复倒计时', '等待中 · 约 X · 点击查看', '等待原因写在悬停提示；排班台只查看；子页可点“点击立即启动”请求优先重试。'],
  ['调度关闭但任务仍等待', '等待中 · 点击查看', '等待原因写在悬停提示；打开对应任务详情查看当前等待状态。'],
  ['状态暂未同步', '需处理 · 点击查看', '打开对应任务窗口核对状态，不直接启动第二份任务。'],
  ['连续受限', '需处理 · 点击启动', '仅适用于点赞、关注和发帖；确认账号状态后可单独重新启动。评论任务继续显示等待倒计时。'],
  ['已经手动停止 / 空闲', '已停止 · 点击启动', '单独恢复或启动该任务，不重启其他任务。'],
  ['正在停止', '等待中 · 请稍候', '暂不可点击；正在停止归入等待中。'],
  ['正在确认页内启动', '启动中 · 约 X · 请稍候', '子页按钮不可点，并显示确认剩余时间；手动任务会先尝试在执行页启动。仍未确认时自动重试，评论任务连续三次未确认会停止并显示最近原因。'],
]

function Section({ id, index, title: sectionTitle, summary, children, defaultOpen = true }) {
  return (
    <details id={id} className="group scroll-mt-24 rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_88%,transparent)] open:shadow-[0_14px_45px_color-mix(in_srgb,var(--site-shadow)_12%,transparent)]" open={defaultOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 marker:content-none md:px-6 md:py-5 [&::-webkit-details-marker]:hidden">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] font-mono text-[11px] font-semibold text-[var(--site-faint)]">{index}</span>
        <span className="min-w-0 flex-1">
          <strong className="block text-[17px] font-semibold leading-7 text-[var(--site-ink)] md:text-[18px]">{sectionTitle}</strong>
          <small className="mt-0.5 block text-[13px] leading-6 text-[var(--site-muted)]">{summary}</small>
        </span>
        <span className="mt-1 text-[var(--site-faint)] transition group-open:rotate-180" aria-hidden="true">▾</span>
      </summary>
      <div className="space-y-4 border-t border-[var(--site-line)] px-5 py-5 text-[14px] leading-7 text-[var(--site-muted)] md:px-6 md:pl-[4.5rem]">
        {children}
      </div>
    </details>
  )
}

function PaceTable({ id, caption, headers, rows, note }) {
  return (
    <div id={id} className="scroll-mt-24 overflow-x-auto rounded-xl border border-[var(--site-line)]">
      <table className="w-full min-w-[520px] border-collapse text-left text-[13px] leading-6">
        <caption className="px-4 py-3 text-left text-[14px] font-semibold text-[var(--site-ink)]">{caption}</caption>
        <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-[var(--site-line)]">
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`} className={`px-4 py-2 ${index === 0 ? 'font-semibold' : ''} text-[var(--site-ink)]`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {note ? <p className="m-0 border-t border-[var(--site-line)] px-4 py-3 text-[13px] leading-6 text-[var(--site-muted)]">{note}</p> : null}
    </div>
  )
}

function TaskBlock({ id, badge, title: blockTitle, summary, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--site-line)] font-mono text-[10px] font-semibold text-[var(--site-faint)]">{badge}</span>
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">{blockTitle}</h3>
          <p className="mt-0.5 text-[12px] leading-5 text-[var(--site-faint)]">{summary}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export default function XReplyClipboardDocsPage() {
  return (
    <PageContainer className="pb-16 pt-5 md:pb-24 md:pt-8">
      <DocsHashNavigation />
      <div className="mb-8 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--site-faint)]">
          <Link href="/tools" className="no-underline transition hover:text-[var(--site-ink)]">工具库</Link>
          <span aria-hidden="true">/</span>
          <Link href={RESOURCE_PATH} className="no-underline transition hover:text-[var(--site-ink)]">X高频互动助手</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--site-ink)]">文档中心</span>
        </div>
        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.03em] text-[var(--site-ink)] md:text-[34px]">文档中心</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--site-muted)]">
          从安装配置到日常排班，按操作目标查找说明。任务规则、设置与异常恢复分别归类；旧版行为和运营观察单独归档。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={RESOURCE_PATH} className="inline-flex items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3.5 py-2 text-[12px] font-semibold text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]">
            返回插件介绍
          </Link>
          <a href="#history" className="inline-flex items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3.5 py-2 text-[12px] font-semibold text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]">
            查看版本演进
          </a>
          <a href="#quick-start" className="inline-flex items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3.5 py-2 text-[12px] font-semibold text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]">
            快速开始
          </a>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
          <DocsToc groups={TOC} />
        </aside>

        <div className="min-w-0 space-y-3">
          <Section id="quick-start" index="00" title="快速开始" summary="先配置模型，再选择任务，最后启动排班" defaultOpen>
            <ol className="list-decimal space-y-3 pl-5">
              <li>在插件介绍页获取安装包，解压后通过 Chrome 扩展管理页加载。打开已登录的 X 页面，核对面板顶部的账号与版本。关掉面板后，点浏览器工具栏里的扩展图标重新打开。</li>
              <li>右上角齿轮进入设置中心，在「模型」中配置服务与提示词。密钥仅在本机配置，不要写进截图或分享材料。</li>
              <li>在排班台勾选需要的任务，用「查看」进入子页设置速度、优先级与时段。首次使用先选少量任务，核对运行结果后再增加。</li>
              <li>点右上角「开始」启动排班。「全自动排班」负责勾选全部任务；单项暂停在任务子页，全停用「暂停全部」。</li>
              <li>等待倒计时结束表示具备候选资格，仍需等待共享页签与优先级安排。普通等待可通过「立即开启」请求启动；共享关注冷却、风控与每日额度继续生效。</li>
            </ol>
            <p>当前说明核对至本地源码 v{X_EXTENSION_LATEST_VERSION}（2026-11-05）；站内下载包配置为 v{DOWNLOAD_VERSION}，实际交付以下载文件为准。本地尚未打包的功能不能据此推断已进入下载包；多配置后台长时间持续运行仍需验证。</p>
          </Section>

          <Section id="flow" index="01" title="运行与任务窗口" summary="共享执行页签、排班台与真实界面" defaultOpen>
            <div id="system-architecture" className="scroll-mt-24 space-y-3 rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 md:p-5">
              <h3 className="m-0 text-[15px] font-semibold text-[var(--site-ink)]">当前系统结构图 · 本地 v4 源码</h3>
              <p className="m-0 text-[13px] leading-6">使用者在 X 页面内操作面板；扩展后台保存 17 项任务的排班状态与闹钟，安排同一账号的共享执行页签。执行页签读取 X 页面内容并执行已启动的任务；AI 回复按已启用顺序尝试 MobileOffice、DeepSeek、NAS 或 B.AI。动作结果先记在本地，再经 2aran.com 回执 API 写入 D1；站长后台可通过回执链路下发启动、暂停和更新等指令。</p>
              <figure className="m-0">
                <a href="/images/x-reply-clipboard-extension/system-architecture-v4.png" target="_blank" rel="noopener noreferrer" className="block overflow-x-auto rounded-xl border border-[var(--site-line)] bg-white" aria-label="打开当前系统结构图原图">
                  <Image src="/images/x-reply-clipboard-extension/system-architecture-v4.png" alt="X 高频互动助手的面板、扩展后台、任务排班、X 执行页签、模型服务、本地回执、站点 API、D1 与站长后台之间的数据流" width={2984} height={804} className="h-auto w-full min-w-[840px]" sizes="(min-width: 1024px) 900px, 100vw" />
                </a>
                <figcaption className="mt-2 text-[12px] leading-6 text-[var(--site-faint)]">图 1 · 依据当前本地 v4 源码梳理的组件与数据流。箭头表示调用或回传路径，不表示所有动作都经过模型，也不表示站内下载包已包含本地开发功能。窄屏可横向滚动，点击可查看原图。</figcaption>
              </figure>
              <p className="m-0 text-[12px] leading-6 text-[var(--site-faint)]">评论 3 项、点赞 2 项、关注 2 项、发帖 6 项、社群 1 项、清理 3 项，共 17 项。它们按排班顺序占用执行页签，不会同时在这一页签执行。</p>
            </div>
            <h3 className="pt-2 text-[15px] font-semibold text-[var(--site-ink)]">v4 怎么跑</h3>
            <p className="text-[var(--site-ink)]">后台按到期时间、时段与优先级安排十七项任务；没有到期任务时保留共享页签，倒计时结束后在原页签继续。旧版若已清掉页签记录，会先核对并复用当前激活的同账号 X 页签；找不到可用页签时才新建。</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>评论首页、评论回复、评论大V、点赞帖子、点赞评论、清理未回关、回关粉丝、纯文字帖、精品发帖、X主题发帖、普通发文和站长转发进入同一队列。任务切换前会等当前操作结束并保存状态；冷却、发帖排程和手动停止优先于排班。</li>
              <li>卡片左侧勾选是否参与自动排班；清理未回关、清理低质帖、清理低质评论、X主题发帖、小红书发帖和站长转发默认不勾选，需要时手动加入，已保存的个人选择继续生效。X主题发帖卡片标注「调试中」。右侧「查看」打开任务子页。子页先速度表与启停，排班（优先级、时段、名单）靠后。不新开或切换浏览器页签。整卡不再一点就进子页。</li>
              <li>排班台左上角「全自动排班」会勾选全部任务；排班已暂停时还需点「开始」。排班开着时，右上角是「暂停全部」，点一下关掉排班并结束各任务；停完后同一位置变成「开始」。只关页签不会关掉后台排班。风控等待不会暂停其他任务。</li>
              <li>详情和十七项子功能顶部共用四类状态：运行中、等待中、需处理、已停止。每个任务子页顶部都有「暂停当前任务」，只手动暂停这一项；重新开启使用该页的启动按钮。评论首页、评论回复、评论大V遇到疑似自动化提示时显示等待原因和倒计时，不转成“需处理”。点赞、关注、发帖连续受限后的需处理状态会在子功能和详情中同步显示。打开详情刷新后台状态后，整个面板会同步更新；停止超过 15 秒可点击重试停止。</li>
              <li>排班台标注「当前任务 / 下一任务 / 候选任务」。绿边表示运行，黄边表示等待，红边表示已停止或需处理。未参与的任务降饱和并排在后面；「查看」只进入详情，不改变排班。</li>
              <li>到期任务还需满足时段、共享冷却与优先级条件。评论完成本次轮次后让位；纯文字帖和 X主题发帖每次只发 1 条，随后等待下一周期。具体数值见「速度与排班设置」。</li>
              <li>回关粉丝和关注候选默认全天，均为 7 分。确认满 100 个才让出页签，然后按速度档休息：慢 10 分钟、中 5 分钟、快 3 分钟、超快 2 分钟。清理类可连续执行，遇 X 受限或手动暂停后停止；下次时间与异常原因以卡片为准。</li>
              <li>一次任务包含若干轮；评论首页按成功回复数推进每轮，评论回复按已检查的不同通知数推进每轮，并单独显示成功回复数。没有足够可回复通知时，本次扫描结束，不等待凑满成功数。点赞帖子与点赞评论每轮设置要完成的点赞个数。排班历史按实际成功数计数。</li>
              <li>单项冷却时先持久化恢复时间，再让执行页签轮给其他到期任务。点赞、关注、发帖连续 3 次受限会停止该任务的自动重试；评论两项持续按 10、20、30 分钟递增倒计时，到期自动重试。手动停止仍会取消对应任务的自动重试。</li>
              <li>回复和发帖的普通排程可点“立即开始”；疑似自动化冷却期间，该按钮用于停止任务，不能跳过风控等待。</li>
            </ul>
            <div id="task-window-plan" className="scroll-mt-24">
              <TaskWindowPlan />
            </div>
            <div className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
              <h3 className="text-[14px] font-semibold text-[var(--site-ink)]">排班边界</h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[12px] leading-6">
                <li>后台按账号、按任务分别保存已处理记录、草稿、运行阶段、下次到期时间与冷却原因；页签只执行当前获选任务。旧版多窗口迁移时先安全停止旧窗口。</li>
                <li>到期的评论、点赞、关注、发帖公平轮转；精品发帖按自己的档期进入队列，错过档期不集中补发。</li>
                <li>只在确认当前点击或发送完成后切换 X 页面。单项冷却只延后该项；账号级限制由该账号单独等待，另一个账号继续排班。</li>
              </ol>
            </div>
          </Section>

          <Section id="states" index="02" title="状态和按钮速查" summary="主区显示状态点和提示。排班台右上角在「暂停全部」和「开始」之间切换" defaultOpen>
            <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">排班启动与状态</h3>
            <p className="m-0 text-[13px] leading-6">
              排班台上方是各任务的状态点和一句提示。左上角「全自动排班」会勾选全部任务；排班已暂停时还需点「开始」。排班开着时，右上角是「暂停全部」，点一下关掉排班并结束各任务；停完后同一位置变成「开始」。只关执行页签不会关掉后台排班。单项启停进任务子页。
            </p>
            <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
              <table className="w-full min-w-[620px] text-left text-[12px] leading-5">
                <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]"><tr><th className="px-3 py-2">你看到的情况</th><th className="px-3 py-2">主区</th><th className="px-3 py-2">右上角</th><th className="px-3 py-2">你怎么做</th></tr></thead>
                <tbody>
                  {FLOW_BUTTON_ROWS.map(([condition, label, kind, action]) => (
                    <tr key={condition} className="border-t border-[var(--site-line)]"><td className="px-3 py-2">{condition}</td><td className="px-3 py-2 font-semibold text-[var(--site-ink)]">{label}</td><td className="px-3 py-2">{kind}</td><td className="px-3 py-2">{action}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 text-[15px] font-semibold text-[var(--site-ink)]">单项任务按钮</h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
              <table className="w-full min-w-[620px] text-left text-[12px] leading-5">
                <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]"><tr><th className="px-3 py-2">当前情况</th><th className="px-3 py-2">按钮显示</th><th className="px-3 py-2">点击结果</th></tr></thead>
                <tbody>
                  {SINGLE_BUTTON_ROWS.map(([condition, label, action]) => (
                    <tr key={condition} className="border-t border-[var(--site-line)]"><td className="px-3 py-2">{condition}</td><td className="px-3 py-2 font-semibold text-[var(--site-ink)]">{label}</td><td className="px-3 py-2">{action}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 text-[15px] font-semibold text-[var(--site-ink)]">四类状态</h3>
            <dl className="space-y-3">
              {STATE_ROWS.map(([label, text]) => (
                <div key={label} className="grid gap-1 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-semibold text-[var(--site-ink)]">{label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-xl border border-[color-mix(in_srgb,#d97706_25%,var(--site-line))] bg-[color-mix(in_srgb,#f59e0b_7%,var(--site-panel))] px-4 py-3 text-[13px] leading-6">
              等待中的任务会说明正在等什么：前一项任务完成、下一次运行时间、X 限制冷却、固定发帖档位或自定义运行时段。有截止时间时显示剩余倒计时；排班卡、详情和任务子页使用同一份后台状态。等待动效仅用于提示状态，系统开启“减少动态效果”后不播放。
            </p>
            <p className="rounded-xl border border-[color-mix(in_srgb,var(--site-green)_20%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_7%,var(--site-panel))] px-4 py-3 text-[13px] leading-6">
              顶部“详情”汇总 17 项任务；概览显示已排班总数及其中运行、等待、需处理的数量，再显示未排班数量。全流程暂停时，仍按任务配置统计已排班。界面只显示上述四类；“启动中 / 停止中”是短暂过渡。状态只反映扩展记录；X 页面是否完成动作，以页面反馈和已确认的统计为准。
            </p>
          </Section>

          <Section id="tasks" index="03" title="十七项任务规则" summary="评论 · 点赞 · 关注 · 发帖与草稿 · 社群 · 清理">
            <div className="space-y-3">
              <TaskBlock id="comments" badge="评" title="评论管理" summary="评论首页 · 评论回复 · 评论大V">
                <div id="reply-timeline" className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
                  <h4 className="font-semibold text-[var(--site-ink)]">评论首页</h4>
                  <ol className="mt-2 list-decimal space-y-2 pl-5">
                    <li>在首页 For You 推荐流里找可评论的帖子，只发评论，不顺手点赞；已处理的帖子会记下来，避免重复。</li>
                    <li>一次任务会按所选速度档位生成多轮计划，每轮各有回复条数目标。各轮实际目标可能不同。速度表下面写明本次共几轮、现在第几轮、每轮多少条、现在第几条。档位数字见<a href="#pace-reply" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">评论轮次表</a>。</li>
                    <li>正常情况下完成本次全部轮次后才让出共享执行页签；轮间短暂等待仍属于本次任务。遇到 X 频率限制时，先保存冷却截止时间并让其他到期任务运行，到期后自动重新排班。普通周期等待可请求立即开始，风控冷却不能跳过。</li>
                    <li>评论首页有 @Grok 开关，默认关闭。打开后，AI 模式约 5% 的回复会短问或短评并 @grok 一次（可直接以 @grok 开头），其余直接回应原帖。选择随待发回复保存，重试时沿用；模板模式使用固定话术，不参与这项抽取。提及 Grok 不保证它一定回复。</li>
                  </ol>
                </div>
                <ul className="list-disc space-y-2 pl-5">
                  <li id="reply-notifications" className="scroll-mt-24 space-y-2">
                    <strong className="text-[var(--site-ink)]">评论回复：维护自己帖子的对话</strong>
                    <p>主要目标是及时回应别人对自己原帖的留言，延续自己帖子的讨论，提高自己帖子的互动率。任务只对当前登录账号自己的原帖继续接话，不去别人帖子的评论区反复对话；互动率是目标，不保证每条回复都能带来更多互动。</p>
                    <ol className="list-decimal space-y-1 pl-5">
                      <li>从通知页找别人对当前账号的回复，不设「只看最近两小时」的限制。打开会话，确认最上方原帖由当前账号发布且本身不是评论；换账号后按新账号重新判断。原帖还未加载出来时，本轮暂缓，下次再核对，不会当作别人的帖子永久跳过。核对页签后台加载停滞时会自动激活；读完回到任务页，用户主动切走后不抢焦点。</li>
                      <li>AI 模式把页面读取到的会话按时间顺序交给已启用的回复模型：我的原帖 → 对方第一次回复 → 我的第一次回复 → 对方第二次回复，依此类推。提示词注明每句是谁说的，要求只回应对方最新一句，不重复自己的原话，也不把自己的话当作对方说的。生成的回复以短、友好、自然为先，可用表情；具体问题才简短答要点。模板模式按已选话术发送，不调用模型生成这段回复。</li>
                      <li>同一段对话最多由我接话 3 次，自己的原帖不计入次数。第三次接话后，对方即使再次回复，也跳过并提示「这段对话已回复 3 轮」；该通知记为已处理。候选评论自身的回复按钮只要显示非零数字，也会跳过；原帖或引用帖的回复数不用于这个判断。@grok 发来的通知直接跳过。</li>
                      <li>已处理通知持续去重，任务不顺手点赞。每核对一条不同通知就推进本轮检查进度，成功发出回复另计；没有足够可回复通知时，本次扫描结束，不等待凑满成功数。默认优先级 8 分，与评论首页、评论大V同分轮换。评论回复页的 @Grok 开关默认关闭；打开后约 5% 的 AI 回复会带一次 @grok。</li>
                    </ol>
                  </li>
                  <li id="reply-kol" className="scroll-mt-24 space-y-2">
                    <strong className="text-[var(--site-ink)]">评论大V：名单与访问方式</strong>
                    <p>默认先从当前账号的 X 首页推荐流积累当天活跃作者，不请求第三方榜单，也不需要 X API 密钥。候选帖子须是当天的中文原创内容，至少有 100 个赞，并达到 10 次转发或 300 个赞；每个作者只取互动分数最高的一条。互动分数为赞数加转发数的 4 倍，从中选 5 个账号，优先避开前一天已选的账号。名单选出后当天固定，次日重新选。</p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>首页任务当天没有看到至少 5 个达标作者，或页面数据无法读取时，回退到下面的内置组。界面会标明「今日首页活跃账号」或「今日候选不足，回退内置」。所以每天换人的前提是当天首页确实积累到足够候选；回退期间内置组仍按原来的 7 天周期切换。</li>
                      <li>内置第 1 组：@xupaopaogm、@thankucrypto、@hotmailfromsh、@weiyux2021、@huoshan007。</li>
                      <li>内置第 2 组：@alanshao111、@vicentyip、@xiaqingfeng666、@JMkernt、@DISONYYDS。</li>
                      <li>内置两组按北京时间每 7 天交替。名单来源或组别改变时，正在进行的一轮仍走完已抽出的顺序；下一轮才使用新名单。每轮开始时只打乱当前名单一次，轮内按抽出的顺序访问尚未访问的账号。</li>
                      <li>在排班设置里清空名单，或保存与内置总名单、任一内置组完全相同的账号集合，会使用每日动态名单，并在不足时回退内置组。增删账号后使用固定的自定义名单，不再自动换人；每轮仍打乱访问顺序。名单保存在当前 Chrome 配置文件；每日候选和每个登录 X 账号的本轮访问进度分别保存。</li>
                      <li>逐个打开名单里的账号主页，优先评论当天的帖子。慢、中、快、超快分别在每个主页最多评论 3、5、7、11 条；达到上限或当天没有可评帖子就换下一个。名单扫完后休息，下一轮重新打乱。连续 3 次无法确认启动时停止自动重试并显示原因，检查执行页和模型设置后可手动重启。</li>
                    </ul>
                    <p>内置 10 个账号是固定回退名单，源码没有记录其最初的量化入选标准。需要自定义时，可参考 <a href="https://xbangdan.com/accounts/" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">X榜单账号榜</a> 等资料自行核对账号；自动名单不读取该榜单。</p>
                  </li>
                  <li>三项轮流占用同一个执行页签，分别保留去重进度。评论首页与评论回复完成本次全部轮次后休息；评论大V扫完名单后休息。通知页没有更多待处理内容时也会结束本次任务。</li>
                  <li>三项评论任务共用上面的递增冷却；排班开着时会先让出执行页签，到期后按优先级继续。普通轮次和周期等待可“立即开始”，风控冷却不能跳过。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="community-share" badge="社" title="社群类" summary="社群分发">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="community-share-rules" className="scroll-mt-24">社群分发默认不参与排班。在任务库勾选「社群类 · 社群分发」，或打开子页后点启动。它和其余任务共用同一个执行页签。当前规则如下。</li>
                  <li>来源：打开当前账号主页，等待帖子加载并继续向下寻找，跳过置顶和转发，选择最新的本人帖子。</li>
                  <li>发送：点帖子操作栏书签右侧的分享按钮，选择「Send via Chat」。在分享窗口里依次多选所有可点击且显示人数的群聊，置灰群聊和个人账号跳过，然后只点一次 Send；没有群聊速度设置。</li>
                  <li>确认：看到这次发送成功提示后，才把整条帖子标记为已分发，并把已选群聊计入成功，本轮立即结束。X 明确拒绝发送或没有成功提示时不写已分发标记，并提示手动核对。</li>
                  <li>同一条帖子只分发一次。之后再次运行时，若最新帖子已有已分发标记，就直接跳过，不再打开分享窗口；参与排班时，本轮结束即让出执行页签。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="likes" badge="赞" title="点赞管理" summary="点赞帖子 · 点赞评论">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="likes-posts" className="scroll-mt-24">点赞帖子处理首页帖。</li>
                  <li id="likes-replies" className="scroll-mt-24">点赞评论逐帖打开评论，只点赞评论，不重复点赞原帖。</li>
                  <li>两项独立记录进度。点击后以 X 的“已点赞”状态确认成功。未确认且出现新限制提示时进入冷却；如果旧 X 限制提示一直存在，连续两次未确认才进入冷却。插件面板文字和普通等待提示不算受限。</li>
                  <li>点赞帖子和点赞评论各自按速度生成本次轮数和每轮点赞个数，数字见<a href="#pace-likes" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">点赞轮次表</a>。排班每次大约只给 3 分钟；慢档结束后约 4～6 小时再排。X 提示频率限制时保存冷却时间并先运行其他任务。</li>
                  <li>确认受限后，普通次数限制使用较长冷却；疑似自动化提示使用 10 分钟起的递增冷却。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="mutual-rules" badge="关" title="关注管理" summary="清理未回关 · 回关粉丝 · 关注候选">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="mutual-unfollow" className="scroll-mt-24">清理未回关默认使用手动模式：扫描自己的 Following 列表，把没有“Follows you”标记的账号保存到待人工核对清单；已回关账号默认保留。点击清单中的账号打开资料页，由你在 X 上取关，完成后点击“已处理”从清单移除。清单按当前账号保存在扩展本地存储，重复扫描会去重；扫描到底后结束本轮。开启“非中文资料也清理”时，这类账号同样进入清单，取关前请核对。可切换自动模式，按慢 / 中 / 快 / 超快每次最多尝试 15 / 30 / 45 / 60 个；遇 X 受限立即停止。</li>
                  <li><strong>互关搅拌风险很高，推荐手动模式。</strong>频繁关注与取关可能触发 X 的操作限制，也可能误伤真实关系。名单只是核对线索，不是取关结论。“没回关”或资料不含中文，都不能单独决定一个账号的价值。先明确自己的关注标准：内容是否长期有用、是否与自己的主题相关、是否有真实交流或合作关系、是否仍想持续阅读。逐个查看近期内容和往来记录；不确定时先保留。只对确认不再符合标准的账号手动取关，避免为了数字反复关注与取关。</li>
                  <li>默认开启“非中文资料也清理”：已回关账号的姓名和简介都有文字且都不含汉字时，也会进入取关候选；任一处有汉字就保留。未回关账号照常清理。</li>
                  <li>只有主动切换到自动模式后，取关操作才会按每次间隔 2 秒执行；不套用回关的批次或每日数量上限。自动模式只依据页面上的回关标记和资料语言，无法判断关系和内容价值，建议保持手动模式。</li>
                  <li id="mutual-followback" className="scroll-mt-24">回关粉丝优先处理姓名或简介含汉字的账号，默认全天排班，已有旧夜间配置会迁移一次；之后自定义的时段保留。回关与关注候选合计每天以 300 个确认为目标、400 个为上限。每确认 100 个才共享休息，慢 10 分钟、中 5 分钟、快 3 分钟、超快 2 分钟；这一轮没做完时，评论和点赞不能把页签抢走。X 提示受限时两项共用倒计时并立即让位，其他任务可在此期间运行。实际数量取决于候选和 X 的限制，不保证达到目标。进度见<a href="#pace-follow" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">回关 / 关注轮次表</a>。</li>
                  <li id="mutual-target" className="scroll-mt-24">关注候选从「关注候选」子页配置区的名单随机打开一个账号的 Followers 页，与回关粉丝分批交替排班，不再每周只运行一次；两项共用每日计数、100 人一轮和 X 受限倒计时。名单可随时增删。</li>
                  <li>排班示例：先连续关注或回关 100 人，再按当前速度档休息。休息期间共享页签可以执行评论、点赞或发帖。一天内两项累计到 300 人后恢复通常优先级；到 400 人后当天都不再关注。300 是目标，不是保证完成的数量。</li>
                  <li>进度段的「2～3 轮」等数字只用于展示本次计划，不要求一口气占住页签做完；每满 15 人先让位。若 X 明确提示关注受限，两项一起等待相同的限制倒计时，到期后重新排班。排班台和两个子页应显示同一份每日计数与冷却状态；手动点“立即开始”也不能越过共享冷却或当日上限。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="poster" badge="帖" title="定时发帖与清理" summary="纯文字帖 · 精品发帖 · X主题发帖 · 普通发文 · 站长转发 · 清理低质帖 · 清理低质评论">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="poster-xhs" className="scroll-mt-24">小红书发帖（调试中）：使用开源 XHS-TextCard 极简杂志原版模板和分页器，将文字排成 3:4 高清图卡。与 X主题发帖一样，仅保存本机草稿，不点击发布，不计入已发帖数。发帖子页的「查看图文草稿」可预览、下载最近 8 份内容；不会同步到 X 云端草稿或小红书。</li>
                  <li>纯文字帖、精品发帖、X主题发帖、普通发文、清理低质帖、清理低质评论各自独立启停，可在排班台对应卡片取消勾选单独退出自动排班，也可随全流程一起调度。</li>
                  <li id="poster-normal" className="scroll-mt-24">纯文字帖：先读知乎、今日头条，每路最多试写 12 条；仍没有草稿时补充 AI HOT，最后使用常用社会观察。普通新帖按条随机：90% 精炼纯文字、10% 原篇幅纯文字；每次发帖任务只准备并发送 1 条。开头钩子可以用「说个暴论」「我真心觉得」「卧槽卧槽卧槽」。发完后进入下次排班倒计时，旧待发队列也按完整周期逐条发送，数字见<a href="#pace-post" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">发帖速度表</a>。周期长短仍按北京时间波浪加密：早 7:00–10:00、午 12:30–13:30、晚 18:00–22:00 更密，其他时段更疏。完整曲线见下方<a href="#poster-wave" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">发帖波浪时间线</a>。</li>
                  <li>普通帖优秀开头示例：我真的很好奇、说个暴论、卧槽卧槽卧槽、讲真、说句难听的、我有点想不通、这事真离谱、等等，这就有意思了、我突然意识到一件事、我越想越不对劲、这回我站这一边、我是真没想到、先说结论、别急，先看这件事、说实话我不服、这点太关键了。每条只选一个与素材相称的开头，下一句就说具体人、事和判断；不编造亲历或没有依据的情绪。</li>
                  <li id="poster-premium" className="scroll-mt-24">精品发帖：每天最多 5 条，按北京时间 08:00 / 09:30 / 12:00 / 15:00 / 19:00 发布；正文固定原篇幅，配图比例约 50%。晚启动或准备超时会跳过已经错过的档位，等待下一档；当天最后一档过后等到次日 08:00，不集中补发。等待时按钮可停止任务。</li>
                  <li id="poster-x" className="scroll-mt-24">X主题发帖（调试中）：默认不勾选参与排班，需手动开启；每次任务 1 条，下次间隔随时段变化，默认慢档。每条都生成文字卡片，卡片上正好两行，两行都居中。题材只围绕 X、Grok/xAI、Tesla、SpaceX、Neuralink 和 The Boring Company，不改写无关热点。模型没写出正文时，用本地准备好的同题短稿。排班台卡片可单独取消勾选退出自动排班。</li>
                  <li id="article" className="scroll-mt-24">普通发文：打开 X 文章草稿页，按一条 AI 资讯写一篇中文文章，填进标题和正文，等页面自动保存进草稿。不点发布。慢档约 50～70 分钟一篇，中档 25～35 分钟，快档 12～18 分钟，超快 6～10 分钟。每天最多 3 篇，写满等到第二天。编辑器里已有内容时暂停，避免覆盖。</li>
                  <li id="site-forward" className="scroll-mt-24">站长转发：仅供站长内部测试，默认不参与排班。文章读取、转换和发布流程尚未完成实机核对，不作为已验证的公开功能介绍。</li>
                  <li id="prune-posts" className="scroll-mt-24">清理低质帖：按慢 / 中 / 快 / 超快分段，每次最多 15 / 30 / 45 / 60 项，下次间隔为 240 / 120 / 60 / 30 分钟。默认先扫自己的主页；勾选「直接从搜索删」会跳过主页。每次点击开启都会清空上一次任务的月份进度，从当前日期的上个月重新开始，随后自动按整月往前查，最多回溯五个日历年；边界以前的内容保留。每月先按阅读规则清理自己的低质帖，再单独搜索并撤销该月的普通转发，两个阶段都完成后才标记该月已扫并自动打开上一个月；转发搜索页续跑时保留当前月份，扫完再进入更早月份，不重复打开同一链接。保留的帖子、删除失败和页面高度变化都不会触发当月从头重扫。搜索页出现 Retry 会先重试当前月，连续失败后保留该月，约 5 分钟后自动重试，不把它误记为已扫完。达到分段上限后让位，按速度档等待下次排班；X 提示受限或手动暂停时立即停止。图文和纯文字的阅读线见<a href="#prune-rules" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">清理规则表</a>。有图片或视频的图文，各档比纯文字高 100。置顶保留；普通转发全部撤销，不删除原作者的帖子。引用帖作为自己发布的帖子，仍按原阅读规则处理。阅读读不到就跳过；未满 30 天时，赞、回复、转帖或收藏读不到也跳过。确认删掉的帖子计入今日合计和每日报告的「删帖」。优先级 2 分。大约 3 万条按 2026-10-30 的旧发帖比例估计，内容体积大约 0.6～1.2 GB，拆开见<a href="#prune-size" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">帖子体积估计</a>。</li>
                  <li id="prune-replies" className="scroll-mt-24">清理低质评论：独立于清理低质帖。只搜索自己发出的评论与回复，发布满 30 天，且可见的点赞、回复、转帖、引用和收藏全部为 0 才删除；不设阅读量门槛。互动数据缺失、置顶或无法确认属于自己的内容一律跳过。首次或人工重新开启从当前日期的上个月开始，按整月自动往前搜索，最多回溯五个日历年；排班续跑保留进度，同一次任务内已扫月份不重刷。搜索加载失败时保留当月并重试；按所选速度档分段与休息，X 受限或手动停止时立即停止。确认删除后计入今日合计、每日报告及站长后台的「删评论」，不混入「删帖」。默认优先级 2 分。</li>
                  <li>模型返回可用正文后写入待发列表；发帖框若已有图片会等待人工确认或移除。X 提示重复时跳过该条；疑似自动化提示会暂停当前发帖任务并倒计时重试。</li>
                </ul>
                <div id="poster-wave" className="mt-4 scroll-mt-24">
                  <PostWaveTimeline />
                </div>
              </TaskBlock>
            </div>
          </Section>

          <Section id="schedule-order" index="04" title="排序" summary="空档出现时，谁先拿到共享页签">
            <p className="m-0 text-[13px] leading-6 text-[var(--site-ink)]">空档出现时，只在已经可以跑的任务里排先后。可以跑的条件：已参与排班，没有手动停止，自己的冷却和间隔已经到点，并且落在设定时段里。站长转发当天已经发过不再入队。精品发帖只在北京时间档位的 15 分钟内入队。点「立即开启」可以跳过普通等待；共享关注冷却和精品发帖档位不能靠手动跳过。</p>
            <p className="m-0 text-[13px] leading-6 text-[var(--site-ink)]">可以跑的任务按下面四步排。前一步已经分出先后，就不再看后一步。</p>
            <ol className="list-decimal space-y-2 pl-5 text-[13px] leading-6 text-[var(--site-ink)]">
              <li>有人点过「立即开启」的任务排最前。</li>
              <li>比较有效分，分高的先上。默认分：评论首页、评论回复、评论大V、精品发帖 8；纯文字帖、X主题发帖、小红书发帖、普通发文、站长转发、回关粉丝、关注候选 7；点赞帖子、点赞评论 6；取消未回关 3；清理低质帖、清理低质评论 2。子页里改过的分按改过的数比较。两项临时加分盖在这个分上：精品发帖在档位内至少按 8.75；当天关注确认还没到 300，并且距离上次关注休息已经结束时，回关和关注候选至少按 8.5。</li>
              <li>有效分相同：还没跑过的排在已经跑过的前面；两边都跑过，谁距离上次跑完更久，谁先上。三项评论任务默认都是 8 分，就按这一步轮换。</li>
              <li>等待时间也完全相同：按任务列表的固定顺序，评论回复排在评论大V前面。这一步只处理完全同时的情况。</li>
            </ol>
            <p className="m-0 text-[13px] leading-6 text-[var(--site-ink)]">排班台右上角「开始」开启整条队列：已到期的任务按上面的规则选，正在进行的评论计划占住页签直到本次计划做完并进入休息。进入任务子页点「立即开启当前任务」会安全停止当前操作，随后切换到手动选择的任务；启动确认中的旧任务也会让位。手动任务会持续占用排班优先权，普通等待期间其他任务也不会切入。手动停止这项任务后恢复自动排班；手动开启另一项会改以新任务为准。若要整条队列重新自动轮换，可先「暂停全部」，再点「启动已选任务」。共享关注冷却、风控和平台限制仍需遵守。</p>
          </Section>

          <Section id="frequency" index="05" title="频率与设置" summary="默认值、修改位置和一天大约能做多少">
            <div id="daily-volume" className="scroll-mt-24 overflow-x-auto rounded-xl border border-[var(--site-line)]">
              <table className="w-full min-w-[520px] border-collapse text-left text-[13px] leading-6">
                <caption className="px-4 py-3 text-left text-[14px] font-semibold text-[var(--site-ink)]">一个账号全天排班、没有碰到 X 限制时，一天大约能做多少</caption>
                <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]">
                  <tr>
                    <th className="px-4 py-2 font-semibold">任务</th>
                    <th className="px-4 py-2 font-semibold">分</th>
                    <th className="px-4 py-2 font-semibold">一天大约</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['评论回复', '8', '短友好多表情；只回别人对你帖子的留言，不跟别人帖子下来回'],
                    ['评论首页', '8', '300～500 条；@Grok 默认关闭，打开后约 15～25 条'],
                    ['精品发帖', '8', '5 条，卡在五个钟点上'],
                    ['纯文字帖', '7', '每次任务 1 条；实际每日条数取决于排班空档和间隔'],
                    ['X主题发帖', '7', '节奏同纯文字帖；每条都是两行居中的文字卡片。和纯文字帖一起开时共用发帖时间'],
                    ['点赞帖子', '6', '40～80 个'],
                    ['点赞评论', '6', '40～80 个'],
                    ['回关粉丝', '7', '每批 100 个；默认全天，休息后按优先级排班'],
                    ['关注候选', '7', '每批 100 个；全天补量，休息后继续'],
                    ['取消未回关', '3', '按速度档分段；未回关才取'],
                    ['清理低质帖', '2', '按速度档分段。图文阅读线比纯文字高 100'],
                    ['清理低质评论', '2', '满 30 天且零互动；按整月往前清理'],
                  ].map(([task, score, amount]) => (
                    <tr key={task} className="border-t border-[var(--site-line)]">
                      <td className="px-4 py-2 text-[var(--site-ink)]">{task}</td>
                      <td className="px-4 py-2 font-mono text-[var(--site-muted)]">{score}</td>
                      <td className="px-4 py-2 text-[var(--site-ink)]">{amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 text-[13px] leading-6 text-[var(--site-muted)]">评论回复默认用「中」，评论首页用边界测试起步档，评论大V默认用「慢」（每个账号最多 3 条），点赞和纯文字帖用「慢」。模型每次回复大约再占 20 秒。通知量、大V名单长度及当天可评帖子数都会影响实际总量。谁先拿到页签见「排序」。评论大V的单次上限由每个账号的条数和名单长度决定。</p>
            <p className="m-0 text-[13px] leading-6 text-[var(--site-muted)]">评论大V按每个账号的条数计，不使用轮次。每天优先使用首页收集的高互动作者；候选不足时回退到每 7 天切换的内置组。自定义名单保持不动，每一轮仍打乱访问顺序。其他任务的默认轮次如下；点赞的慢 / 中 / 快 / 超快与评论表共用轮数，回关 / 关注候选的进度段轮数也跟这组。清理三项独立选择速度档，完成本段后让出页签，规则见下方清理规则表。</p>
            <div className="space-y-3">
              <PaceTable
                id="pace-reply"
                caption="评论首页、评论回复"
                headers={['速度', '每次轮数', '一轮条数', '条与条之间', '轮与轮之间', '做完休息']}
                rows={[
                  ['慢', '2～3 轮', '12～20 条', '15～30 秒', '15 秒', '4～6 小时'],
                  ['中（评论回复默认）', '3～5 轮', '25～35 条', '5～15 秒', '5 秒', '2～3 小时'],
                  ['快', '4～6 轮', '30～42 条', '3～6 秒', '3 秒', '1～1.5 小时'],
                  ['超快', '5～8 轮', '40～55 条', '2～4 秒', '1 秒', '20～40 分钟'],
                ]}
                note="评论首页的一轮条数按成功回复计，评论回复按已核对的不同通知计；评论回复的成功数另列。评论首页默认用下面的边界测试。任务运行中可在子页切换速度档，确认后按新档继续。"
              />
              <PaceTable
                id="pace-kol"
                caption="评论大V · 每个账号"
                headers={['速度', '每个大V最多评论']}
                rows={[
                  ['慢（默认）', '3 条'],
                  ['中', '5 条'],
                  ['快', '7 条'],
                  ['超快', '11 条'],
                ]}
                note="达到上限或主页没有可评的帖子就换下一个；名单扫完后休息。"
              />
              <PaceTable
                id="pace-boundary"
                caption="评论首页、点赞的边界测试"
                headers={['档位', '每次轮数', '一轮数量', '条与条之间', '轮与轮之间', '做完休息']}
                rows={[
                  ['降档', '2 轮', '12～20', '10～16 秒', '12 秒', '2.5～3 小时'],
                  ['起步（默认）', '2～3 轮', '20～30', '6～10 秒', '8 秒', '1.5～2 小时'],
                  ['加快', '2～3 轮', '22～32', '5～8 秒', '6 秒', '1.5～2 小时'],
                  ['最高', '2～3 轮', '24～34', '4～7 秒', '5 秒', '1.5～2 小时'],
                ]}
                note="从起步开始。连续一轮稳定后升一档，条间略缩短，休息仍在 1.5～2 小时。满 10 条后的限制降到降档。遇到自动化提示后，每次只处理 1 条，等待依次加到 15、30、45、60、90、120 分钟。"
              />
              <PaceTable
                id="pace-likes"
                caption="点赞帖子、点赞评论"
                headers={['速度', '每次轮数', '一轮个数', '轮与轮之间']}
                rows={[
                  ['慢（默认）', '2～3 轮', '12～20 个', '15 秒'],
                  ['中', '3～5 轮', '25～35 个', '5 秒'],
                  ['快', '4～6 轮', '30～42 个', '3 秒'],
                  ['超快', '5～8 轮', '40～55 个', '1 秒'],
                ]}
                note="排班每次大约 3 分钟。慢档默认，这次做完约 4～6 小时再排。边界测试与评论首页共用上一张档位表。"
              />
              <PaceTable
                id="pace-follow"
                caption="回关粉丝 · 关注候选"
                headers={['速度', '进度段轮数', '一轮人数', '满 100 人后休息']}
                rows={[
                  ['慢', '2～3 轮', '100', '10 分钟'],
                  ['中（默认）', '3～5 轮', '100', '5 分钟'],
                  ['快', '4～6 轮', '100', '3 分钟'],
                  ['超快', '5～8 轮', '100', '2 分钟'],
                ]}
                note="速度档决定满 100 人后的休息。这一轮进行中，评论和点赞不能把页签抢走。回关与关注候选默认全天运行；两项合计最多 400 个。"
              />
              <PaceTable
                id="prune-rules"
                caption="清理低质帖 · 不限速"
                headers={['条件', '图文', '纯文字']}
                rows={[
                  ['超过 24 小时，赞少于 2，且没有回复、转帖、引用、收藏', '低于 200', '低于 100'],
                  ['超过 24 小时，公开互动全是 0', '200–499', '100–399'],
                  ['满 30 天', '低于 250', '低于 150'],
                  ['满 60 天', '低于 300', '低于 200'],
                  ['满 90 天', '低于 350', '低于 250'],
                  ['满 120 天', '低于 400', '低于 300'],
                  ['之后每满 30 天', '仍比纯文字高 100', '再加 50'],
                ]}
                note="不限速，按月先清理自己的低质帖，再撤销该月普通转发；遇 X 限制或手动暂停后停止，约 7 天再排。图文阅读线比纯文字高 100。置顶保留；撤销转发不删除原帖，也不计入删帖。阅读读不到就跳过。未满 30 天时，赞、回复、转帖或收藏读不到也跳过。"
              />
              <PaceTable
                id="prune-size"
                caption="清理低质帖 · 大约 3 万条的体积估计"
                headers={['组成', '大约多少', '体积']}
                rows={[
                  ['正文', '3 万条里的文字', '大约 10 MB'],
                  ['文字卡片', '大约 6 千张，占 20%', '0.6～1.2 GB'],
                  ['合计', '按 2026-10-30 的旧发帖比例', '0.6～1.2 GB'],
                  ['几乎没有图', '3 万条纯文字', '大约十几 MB'],
                  ['一半带图', '大约 1.5 万张', '1.5～3 GB'],
                ]}
                note="2026-10-30 的预算估计，按当时纯文字帖的比例：20% 文字卡片、40% 原篇幅、40% 精简。文字卡片按上传到 X 之后计算，一张多在 100～200 KB。视频另计。X 账号页不显示这项占用。"
              />
              <PaceTable
                id="pace-premium"
                caption="精品发帖"
                headers={['档位', '时间', '每档条数']}
                rows={[
                  ['第 1 档', '08:00', '1 条'],
                  ['第 2 档', '09:30', '1 条'],
                  ['第 3 档', '12:00', '1 条'],
                  ['第 4 档', '15:00', '1 条'],
                  ['第 5 档', '19:00', '1 条'],
                ]}
                note="北京时间。错过的档位等到下一档，不集中补发。每天 5 条。"
              />
              <PaceTable
                id="pace-post"
                caption="纯文字帖、X主题发帖"
                headers={['速度', '每次任务', '下次间隔']}
                rows={[
                  ['慢（默认）', '1 条', '45～70 分钟'],
                  ['中', '1 条', '25～40 分钟'],
                  ['快', '1 条', '15～28 分钟'],
                  ['超快', '1 条', '10～18 分钟'],
                ]}
                note="早晚高峰会缩短下一次等待，夜里更疏。每次任务只发 1 条；实际每日条数取决于排班空档。X主题发帖占用同一段发帖时间。"
              />
            </div>
            <ul className="list-disc space-y-2 pl-5">
              <li>插件里的速度表和这里同一套栏目。评论任务运行中点另一档会先确认，当前操作完成后按新档继续，累计已完成条数保留，已有风控冷却不会跳过。速度与排班参数在对应任务子页调整；设置中心已移除独立的频率设置和排班台入口。</li>
              <li>纯文字帖和 X主题发帖默认“慢”。原先停在“中”的纯文字帖会自动改成“慢”，手选过快或超快的保持原样。精品发帖固定每天 5 档，钟点见任务说明。</li>
              <li>回复模型的启用顺序、MobileOffice 本地桥接、DeepSeek / NAS / B.AI 配置，以及评论首页 / 评论回复 / 纯文字帖 / 精品发帖 / X主题发帖五份提示词，在设置中心的「模型」里管理。配置读取完成且没有可用模型时，首页才显示设置引导；保存可用密钥会同步启用对应模型，手动关闭的选择保留。发帖正文每行之间留一个空行；精简稿开头后目标约 35～60 字、2～3 行。抓人开头与措辞由提示词控制，本地不按字数或风格退稿。正反例和修改记录写在文档中心「提示词反馈台账」。</li>
              <li>插件不设每日回复总量；清理未回关的手动模式只记录候选，不会自动点击取关。切换到自动模式后才按速度档执行取关。</li>
            </ul>
          </Section>

          <Section id="risk" index="06" title="风控与异常恢复" summary="10 → 20 → 30 分钟；只等待触发提示的任务">
            <div className="space-y-5">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">疑似自动化提示</h3>
                <p className="mt-1 text-[12px] text-[var(--site-faint)]">评论任务持续倒计时；其他任务保留连续受限保护</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>检测到提示后，当前任务停止新动作并进入“等待中”；其他任务照常运行。</li>
                  <li>评论首页、评论回复、评论大V 共用同一套评论限制冷却：第一次等待 10 分钟，再次受限等待 20 分钟，第三次 30 分钟，此后每次增加 10 分钟。其中一个撞到限制，三项一起等待；后台保存截止时间，到期后按优先级重新排队，不进入“需处理”。</li>
                  <li>如果限制提示仍在，关注和发帖不会直接继续点击或发送，而是进入下一档等待。评论再次被 X 拒绝时也会进入下一档。</li>
                  <li>评论任务因异常让出共享页签前，会先清空插件生成但尚未发送的草稿、关闭 X 页内回复框，再切换任务。若回复框仍无法关闭，保留原浏览器页签及内容，其他任务在另一页签继续；用户自己写的草稿始终保留。不会为了切换任务关闭原页签或导航它，从而避免触发 Chrome 的“离开此网站？”确认框。</li>
                  <li>等待期间可手动停止单项或全部任务；手动停止会取消该任务本次等待。</li>
                </ol>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">其他等待与异常</h3>
                <p className="mt-1 text-[12px] text-[var(--site-faint)]">这些时间与疑似自动化冷却分开计算</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>关注名单提示普通限速：先等 15 分钟；扫到列表底部后等 30 分钟再扫描。</li>
                  <li>点赞普通次数限制：依次等待 1、2、6 小时，之后每次 24 小时；到时只重试当前点赞任务。</li>
                  <li>评论或发帖遇到临时错误，会跳过当前内容、短暂重试或重连；无法安全关闭的草稿和缺失的配置会给出具体提示。</li>
                  <li>验证码、手机号验证或账号状态异常需要按 X 页面提示人工处理；倒计时不能代替账号验证。</li>
                </ul>
              </div>
              <div id="action-review-proposal" className="scroll-mt-24 space-y-3 rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-[15px] font-semibold text-[var(--site-ink)]">动作审阅流程 · 改进建议</h3>
                  <span className="rounded-full border border-[var(--site-line)] px-2 py-0.5 text-[11px] font-semibold text-[var(--site-faint)]">尚未实现</span>
                </div>
                <p className="m-0 text-[13px] leading-6">这张图描绘建议采用的操作闭环，不是当前插件的运行步骤。插件先发现候选内容并给出来源与判断理由，再按动作风险进入不同的人工审阅：回复和发帖核对正文与互动对象；删除和取关核对候选清单与批次。确认后只执行一项动作，记录页面能确认的结果，再观察内容可见性、对话质量和账号限制，作为下一轮筛选依据。</p>
                <figure className="m-0">
                  <a href="/images/x-reply-clipboard-extension/action-review-proposal.png" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[var(--site-line)] bg-white p-3" aria-label="打开动作审阅流程建议原图">
                    <Image src="/images/x-reply-clipboard-extension/action-review-proposal.png" alt="建议流程：发现候选内容，说明来源与判断理由；回复发帖交由人工审阅内容与对象，删除取关交由人工确认候选清单与批次；每次执行一项，记录结果，并观察可见性、对话质量与账号限制" width={968} height={1524} className="mx-auto h-auto w-full max-w-[560px]" sizes="(min-width: 768px) 560px, 100vw" />
                  </a>
                  <figcaption className="mt-2 text-[12px] leading-6 text-[var(--site-faint)]">图 2 · 目标流程草图。图中的人工审阅、批次确认和逐项执行尚未作为统一流程接入插件；当前自动任务仍按各自规则运行。点击可查看原图。</figcaption>
                </figure>
                <p className="m-0 text-[12px] leading-6 text-[var(--site-faint)]">“记录真实结果”应区分插件检测到的页面操作成功与 X 后台的曝光、可见性等效果数据；账号限制也需单独记录，不能从本机动作计数推断。清理动作一旦在 X 确认删除，原内容无法由插件恢复。</p>
              </div>
            </div>
          </Section>

          <Section id="rules" index="07" title="平台边界与官方来源" summary="技术上限不代表账号可用频率">
            <p>X 的公开自动化、账户限制和真实性规则适用于这些操作。扩展的频率挡位与倒计时只是本地调度参数，不代表 X 认可的安全阈值。</p>
            <p>公开的每日数量、账户状态和更短时间窗口是不同约束；发生限制时，应以 X 页面给出的验证或限制提示为准。</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a href="https://help.x.com/en/rules-and-policies/x-automation" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 text-[12px] font-semibold text-[var(--site-ink)] no-underline">自动化规则 ↗</a>
              <a href="https://help.x.com/en/rules-and-policies/x-limits" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 text-[12px] font-semibold text-[var(--site-ink)] no-underline">账户限制 ↗</a>
              <a href="https://help.x.com/en/rules-and-policies/authenticity" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 text-[12px] font-semibold text-[var(--site-ink)] no-underline">真实性政策 ↗</a>
            </div>
          </Section>

          <Section id="maintenance" index="08" title="更新与数据维护" summary="版本提示、自动维护、每日报告">
            <ul className="list-disc space-y-2 pl-5">
              <li>在扩展管理页重新加载本地目录后，已打开的 X 标签需要刷新一次，页面才会换上新脚本。旧页面发现扩展上下文失效后会停掉每秒刷新，不再连续报 Extension context invalidated。关掉浮窗后，点浏览器工具栏里的扩展图标可以重新打开。</li>
              <li>标题旁“检查中 / 最新版 / 有新版本”比较当前加载的扩展与本地开发目录。“立即更新”会先停止运行中的任务，加载新版后只恢复原先在运行或冷却的任务；没有新版本时不会停任务。</li>
              <li>从旧版多窗口扩展切到当前本地源码时，首次启动会把旧多窗口任务安全收敛到单执行页签；排班与冷却状态保留在扩展本地，不需要手动清数据。下载包与本地开发版分别核对版本号，不根据文档截图推断下载包版本。</li>
              <li>主操作区只保留全流程按钮、排班台和任务详情。旧的清理与说明按钮已移除；各任务状态、限制倒计时和恢复规则在本文档对应章节查看。</li>
              <li>面板的今日数据分两行：上行按评论、点赞、发帖、关注、清理五类汇总，下行可横向查看每项任务的成功数。日历图标在面板右上角；放大/缩小入口暂时停用。点赞帖子与点赞评论、纯文字帖与精品及 X 主题发帖从新版回执起分别计数；旧记录无法拆分时显示已明确归属数加「+」。普通发文统计已保存的草稿，不算已发布帖子。</li>
              <li>每日报告随心跳自动同步当日统计，并在每天北京时间 09:00 补传前一天；休眠或关闭浏览器错过时间后，下次启动会继续同步。确认删除的原创帖和评论分别计入「删帖」「删评论」；云端新增字段需应用 0128 迁移，迁移前本地保留待上传报告。逐任务明细目前保存在本机，云端日报仍保存合计。</li>
            </ul>
          </Section>

          <Section id="history" index="09" title="版本演进与迁移" summary="历史行为仅供版本对照，不作为当前操作指南">
            <div id="version-path" className="scroll-mt-24 space-y-3 rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 md:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="m-0 text-[15px] font-semibold text-[var(--site-ink)]">来时路 · v0 → v4</h3>
                <p className="m-0 text-[12px] leading-6 text-[var(--site-faint)]">世代摘要；逐条补丁见周总结与仓库 README</p>
              </div>
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {VERSION_ERAS.map((era) => (
                  <li
                    key={era.id}
                    id={era.id}
                    className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_70%,transparent)] p-3.5 md:p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
                      <div className="flex shrink-0 flex-row items-baseline gap-x-2 md:w-36 md:flex-col md:gap-y-1">
                        <strong className="font-mono text-[15px] text-[var(--site-ink)]">{era.version}</strong>
                        <span className="text-[13px] font-semibold text-[var(--site-ink)]">{era.title}</span>
                        <span className="text-[11px] leading-5 text-[var(--site-faint)] md:mt-0.5">{era.span}</span>
                      </div>
                      <div className="min-w-0 flex-1 border-[var(--site-line)] md:border-l md:pl-5">
                        <p className="m-0 text-[13px] leading-6 text-[var(--site-ink)]">{era.oneLiner}</p>
                        <ul className="mb-0 mt-2 list-disc space-y-1.5 pl-4 text-[12px] leading-6 text-[var(--site-muted)]">
                          {era.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="m-0 text-[12px] leading-6 text-[var(--site-faint)]">
                一句话：v0 能发 → v1 看得清 → v2 会写话 → v3 多任务并行占多页签 → v4 收成单页签按到期轮班。
              </p>
            </div>
            <div id="v3-to-v4" className="scroll-mt-24 space-y-3 rounded-2xl border border-[color-mix(in_srgb,var(--site-green)_28%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_6%,var(--site-panel))] p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--site-green)_30%,var(--site-line))] bg-[var(--site-panel)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--site-green)]">2026-10-28</span>
                <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">从 v3 升级到 v4</h3>
              </div>
              <p className="m-0 text-[14px] leading-7 text-[var(--site-ink)]">
                v3 常为多项任务同时开多个 X 页签并行跑；某一项在冷却或排队时，其他项也容易跟着空等，页签多、切换乱。v4 改为每个 Chrome 配置文件里的一个 X 账号共用一个执行页签，评论、点赞、关注、发帖、普通发文、站长转发、社群分发和清理按到期时间串行轮班：当前项做完、让位或进入冷却后，其他到期项立刻接手，不再为无关等待干耗时间。
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-3.5">
                  <strong className="text-[12px] text-[var(--site-faint)]">v3 · 多页签并行</strong>
                  <ul className="mb-0 mt-2 list-disc space-y-1.5 pl-4 text-[13px] leading-6 text-[var(--site-muted)]">
                    <li>多项任务可同时占多个执行页签</li>
                    <li>单项冷却时，其他任务也容易一起空等</li>
                    <li>页签多、焦点抢夺，状态更难一眼看清</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--site-green)_35%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] p-3.5">
                  <strong className="text-[12px] text-[var(--site-green)]">v4 · 单页签串行</strong>
                  <ul className="mb-0 mt-2 list-disc space-y-1.5 pl-4 text-[13px] leading-6 text-[var(--site-muted)]">
                    <li>一账号一个执行页签，十七项任务轮班占用</li>
                    <li>冷却中的任务让位，其他允许执行的到期项按优先级排班</li>
                    <li>排班台卡片勾选参与；「查看」进子页，不改队列</li>
                  </ul>
                </div>
              </div>
              <p className="m-0 text-[12px] leading-6 text-[var(--site-faint)]">当前本地源码 v{X_EXTENSION_LATEST_VERSION} 尚未打包；站内下载包配置为 v{DOWNLOAD_VERSION}，交付版本以实际文件为准。加载新版本地源码后，旧多窗口会在首次启动时收敛到单页签。</p>
            </div>
          </Section>

          <Section id="releases" index="10" title="周总结" summary="从首个有日期版本所在周起算；每周提炼重点，完整条目见仓库 README">
            <p className="m-0 text-[13px] leading-6">
              周次按北京时间周一到周日划分。第 1 周从 README 里第一条带日期的版本所在周开始；更早且未标注日期的版本归入「起步阶段」。
            </p>
            <div className="space-y-3">
              {RELEASE_WEEKS.map((week) => (
                <article key={week.id} id={week.id} className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <strong className="text-[14px] text-[var(--site-ink)]">{week.title}</strong>
                    <b className="font-mono text-[12px] text-[var(--site-faint)]">{week.versionRange}</b>
                    <span className="text-[12px] text-[var(--site-faint)]">{week.count} 个版本</span>
                  </div>
                  <ul className="mb-0 mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-6">
                    {week.highlights.map((item) => (
                      <li key={`${week.id}-${item.version}`}>
                        <span className="font-mono text-[12px] text-[var(--site-faint)]">{item.version}</span>
                        {' '}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3 text-[13px] leading-6">
              完整版本说明以仓库 README 为准；公开下载页可能仍是较早版本。
            </p>
            <Link href={`${RESOURCE_PATH}#version-history`} className="inline-flex text-[13px] font-semibold text-[var(--site-ink)] no-underline hover:text-[var(--site-accent)]">
              查看公开版本页 ↗
            </Link>
          </Section>

          <Section id="ops-journal" index="11" title="运营纪事" summary="增长实验台账：阶段事实、指标对照、假设与自检；观察与推断分开">
            <h3 className="mb-0 mt-4 text-[15px] font-semibold text-[var(--site-ink)]">阶段时间线（事实）</h3>
            <ul className="mb-0 list-disc space-y-2 pl-5 text-[14px] leading-7">
              <li>更早：互关 + 高频发帖；规则改成更看重原创后，手工日回约五六百条开始有起色。</li>
              <li>近约三周：助手运行后曝光曾冲到约 5M（站长侧观测）。</li>
              <li>截至 2026-10-30：降量账号从单日接近约 100 万落到不到 5 千，已连续三天。当天又发出七百多条评论，曝光没有回来。本机面板今日合计仍可能偏高，X 后台可见评论更少（口径待核实）。</li>
              <li>2026-10-30：对照账号此前浏览大约几百，当天到三十多 K。评论一发出，消息和数据就上来。</li>
              <li>约 2026-10-28～29：本地到 v4 排班；昨天仍可见约 1000 条评论级动作——因此「单纯 v3→v4 bug」未证实。</li>
              <li>约 2026-10-30：评论拆成评论首页（For You）与评论大V；关注、质量发帖、大V评论按一套联动实验，不单押首页回复条数。</li>
              <li>约 2026-10-30：痛定思痛，推倒重来——开清浏览量低于 100 的低质帖。对照：发帖从约 10K 堆到约 30K 大约半个月；从约 30K 清回，或许只要约 1 天。堆易清快，先收低质存量。</li>
            </ul>

            <h3 className="mb-0 mt-4 text-[15px] font-semibold text-[var(--site-ink)]">指标对照（样本）</h3>
            <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[32rem] border-collapse text-left text-[13px] leading-6">
                <thead>
                  <tr className="border-b border-[var(--site-line)] text-[var(--site-faint)]">
                    <th className="py-2 pr-3 font-semibold">指标</th>
                    <th className="py-2 pr-3 font-semibold">此前</th>
                    <th className="py-2 font-semibold">近况（至 10/30）</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--site-ink)]">
                  <tr className="border-b border-[var(--site-line)]"><td className="py-2 pr-3">曝光（降量账号）</td><td className="py-2 pr-3">峰值约 5M / 曾近百万级</td><td className="py-2">不到 5 千，已连续三天；当天七百多条评论，曝光仍未回来</td></tr>
                  <tr className="border-b border-[var(--site-line)]"><td className="py-2 pr-3">曝光（对照账号）</td><td className="py-2 pr-3">此前大约几百</td><td className="py-2">当天三十多 K；评论一发，消息和数据就上来</td></tr>
                  <tr className="border-b border-[var(--site-line)]"><td className="py-2 pr-3">原创相关流量</td><td className="py-2 pr-3">约 70K→120K</td><td className="py-2">待核实</td></tr>
                  <tr className="border-b border-[var(--site-line)]"><td className="py-2 pr-3">关注数</td><td className="py-2 pr-3">约 7500 顶</td><td className="py-2">清理后约 6000+</td></tr>
                  <tr className="border-b border-[var(--site-line)]"><td className="py-2 pr-3">互动率</td><td className="py-2 pr-3">相对较低</td><td className="py-2">升高（观测）</td></tr>
                  <tr className="border-b border-[var(--site-line)]"><td className="py-2 pr-3">外测评分</td><td className="py-2 pr-3">—</td><td className="py-2">约 58</td></tr>
                  <tr><td className="py-2 pr-3">本机今日合计</td><td className="py-2 pr-3">—</td><td className="py-2">评论 ~258 · 点赞 ~881 · 发帖 ~48（本机确认，≠ 后台）</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="mb-0 mt-4 text-[15px] font-semibold text-[var(--site-ink)]">已排除 / 未证实</h3>
            <ul className="mb-0 list-disc space-y-2 pl-5 text-[14px] leading-7">
              <li>未证实：曝光断崖单纯因为 v3→v4。</li>
              <li>当前样本不支持：整号已废（外测约 58、互动率升）。</li>
              <li>未对齐：面板数字 ≠ X Analytics；点赞尤甚。</li>
            </ul>

            <h3 className="mb-0 mt-4 text-[15px] font-semibold text-[var(--site-ink)]">开放假设</h3>
            <ul className="mb-0 list-disc space-y-2 pl-5 text-[14px] leading-7">
              <li>降量账号已连续三天停在五千以下，七百多条评论没有把曝光带回来。对照账号同一天从大约几百到三十多 K，评论一发，消息和数据就上来。更像降量账号自己的分发被压；For You 小微互关帖上的同量级回复也可能几乎无分发。</li>
              <li>约 2026-08 原创激励变化：评论当入口、变现认原创合格曝光。</li>
              <li>短时海量相似评论 + 关注墙附近大批清理未回关，可叠成「不真实行为」信号；关注搅拌 vs 评论搅拌单归因待核实。</li>
              <li>本机统计可能虚高：DOM 确认成功，非官方 API；「全部账号」合计会抬高今日条。评论/发帖在弹窗关或框清空时也可能 +1；点赞认 unlike 按钮约 1.75s。排班卡在点赞帖子：整次轮次占满共享页签，其它任务插不进来。</li>
            </ul>

            <h3 className="mb-0 mt-4 text-[15px] font-semibold text-[var(--site-ink)]">自检与下一窗口</h3>
            <ul className="mb-0 list-disc space-y-2 pl-5 text-[14px] leading-7">
              <li>未登录看自己内容；热帖回复是否沉底；近 7 天曝光断崖还是阴跌；有官方可见性标签再申诉。</li>
              <li>下一窗口：看降量账号是否还停在五千以下，以及对照账号三十多 K 能否稳住。同时记回复可见性、面板与后台差，并对照评论首页 / 评论大V拆分。策略实验：大V评论 + 质量发帖 + 关注重建联动，不单押首页条数。清帖不限速：纯文字低于 100 且几乎无互动，或 100–399 且零互动；满 30 天起按 100+50×档。图文各档再高 100。窗口内不做定论。</li>
            </ul>
          </Section>
        </div>
      </div>
    </PageContainer>
  )
}
