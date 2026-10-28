import Link from 'next/link'

import { loadXExtensionReleaseWeeks } from '../../../../../lib/community/xExtensionReleaseWeeks'
import PageContainer from '../../../components/PageContainer'
import DocsHashNavigation from './DocsHashNavigation'
import PostWaveTimeline from './PostWaveTimeline'
import TaskWindowPlan from './TaskWindowPlan'
import TaskSchedulePrototype from './TaskSchedulePrototype'

export const dynamic = 'force-static'

const RELEASE_WEEKS = loadXExtensionReleaseWeeks()

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const DOCS_PATH = `/resources/${RESOURCE_SLUG}/docs`
const RESOURCE_PATH = `/resources/${RESOURCE_SLUG}`
const DOCS_URL = `https://2aran.com${DOCS_PATH}`

const title = 'X高频互动助手文档中心'
const description =
  '状态速查、任务规则、风控恢复、频率设置与平台边界说明。插件内文档入口会打开本页。'

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

const TOC = [
  {
    heading: '先看这里',
    items: [
      { id: 'flow', label: '01 · 运行与任务窗口' },
      { id: 'task-window-plan', label: '规划：单页签排班', depth: 1 },
      { id: 'task-schedule-prototype', label: '原型：排班管理', depth: 1 },
      { id: 'states', label: '02 · 状态和按钮' },
      { id: 'risk', label: '03 · 风控与自动恢复' },
    ],
  },
  {
    heading: '按任务查找',
    items: [
      { id: 'tasks', label: '04 · 四类任务规则' },
      { id: 'comments', label: '评论管理', depth: 1 },
      { id: 'reply-timeline', label: '评论帖子', depth: 2 },
      { id: 'reply-notifications', label: '评论通知', depth: 2 },
      { id: 'likes', label: '点赞管理', depth: 1 },
      { id: 'likes-posts', label: '点赞帖子', depth: 2 },
      { id: 'likes-replies', label: '点赞评论', depth: 2 },
      { id: 'mutual-rules', label: '关注管理', depth: 1 },
      { id: 'mutual-unfollow', label: '清理未回关', depth: 2 },
      { id: 'mutual-followback', label: '回关粉丝', depth: 2 },
      { id: 'poster', label: '定时发帖', depth: 1 },
      { id: 'poster-normal', label: '普通发帖', depth: 2 },
      { id: 'poster-wave', label: '发帖波浪时间线', depth: 2 },
      { id: 'poster-premium', label: '精品发帖', depth: 2 },
      { id: 'frequency', label: '05 · 频率与设置' },
    ],
  },
  {
    heading: '参考资料',
    items: [
      { id: 'rules', label: '06 · 平台边界' },
      { id: 'maintenance', label: '07 · 更新与数据维护' },
      { id: 'releases', label: '08 · 周总结' },
    ],
  },
]

const STATE_ROWS = [
  ['运行中', '当前任务正在扫描、生成或发送；详情显示最近更新时间。'],
  ['等待中', '任务在后台队列、普通排程、冷却、自动恢复倒计时，或正在停止中；详情显示原因和剩余时间。评论任务或当前队列任务状态失联时，后台到期复查并逐步延长重试间隔。'],
  ['需处理', '需要你确认后再继续：点赞、关注或发帖连续 3 次受限后退出自动队列；状态超过 90 秒未更新（未开全流程时）；或停止超时需重试。评论帖子和评论通知继续倒计时重试，不进入此态。'],
  ['已停止', '没有运行记录、已手动停止，或全流程已暂停。可点主按钮启动全部，或点单项按钮单独启动。'],
]

const FLOW_BUTTON_ROWS = [
  ['尚未运行 / 已停止', '已停止 · 点击启动全部', '启动评论任务；点赞、关注、发帖进入后台队列。'],
  ['正在启动', '启动中 · 请稍候', '暂不可点击，等待任务窗口建立。'],
  ['有任务执行', '运行中 · 点击暂停全部', '手动停止当前任务并关闭自动调度。'],
  ['有等待项和已停止项', '已停止 · 点击启动未运行', '启动未运行项；已有的等待倒计时保留。'],
  ['全部等待，调度开启', '等待中 · 点击暂停调度', '停止后台调度和正在等待的任务。'],
  ['全部等待，调度关闭', '等待中 · 点击恢复全部', '重新开启全流程；已有的等待倒计时保留。'],
  ['手动暂停', '已停止 · 点击启动全部', '点击后启动全部任务。'],
  ['正在停止', '停止中 · 请稍候', '暂不可点击，等待当前步骤退出。'],
  ['停止超时', '需处理 · 点击重试停止', '停止超过 15 秒后，点击再次发送暂停指令。'],
  ['状态未同步', '需处理 · 点击检查并启动', '点击后检查任务并启动未运行项。'],
  ['全部受限，调度开启', '需处理 · 点击暂停调度', '点击后暂停后台调度；先检查账号状态。'],
  ['全部受限，调度关闭', '需处理 · 请先查看详情', '暂不可点击；先查看详情并检查账号状态。'],
  ['已结束', '已停止 · 点击重新启动', '点击后重新启动全流程。'],
]

const SINGLE_BUTTON_ROWS = [
  ['正在执行', '运行中 · 点击停止', '只停止当前任务；正常排程的“立即开始”仍只跳过普通等待。'],
  ['在其他窗口执行', '运行中 · 点击前往', '跳转到正在执行的任务窗口，不重复启动。'],
  ['后台队列或自动恢复倒计时', '等待中 · 约 X · 点击停止', '只取消这一项的自动调度；其他任务继续等待或执行。剩余时间和原因见按钮提示、任务详情。'],
  ['调度关闭但任务仍等待', '等待中 · 点击查看', '打开对应任务窗口查看当前等待状态。'],
  ['状态暂未同步', '需处理 · 点击查看', '打开对应任务窗口核对状态，不直接启动第二份任务。'],
  ['连续受限', '需处理 · 点击启动', '仅适用于点赞、关注和发帖；确认账号状态后可单独重新启动。评论任务继续显示等待倒计时。'],
  ['已经手动停止 / 空闲', '已停止 · 点击启动', '单独恢复或启动该任务，不重启其他任务。'],
  ['正在停止', '停止中 · 请稍候', '暂不可点击，等待当前步骤结束。'],
]

function Section({ id, index, title: sectionTitle, summary, children, defaultOpen = false }) {
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
          状态速查 · 任务规则 · 异常恢复 · 设置与边界。先看任务状态和下一步操作；需要具体规则时再展开对应任务。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={RESOURCE_PATH} className="inline-flex items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3.5 py-2 text-[12px] font-semibold text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]">
            返回插件介绍
          </Link>
          <a href="#flow" className="inline-flex items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3.5 py-2 text-[12px] font-semibold text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]">
            从运行说明开始
          </a>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
          <nav aria-label="文档目录" className="rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_82%,transparent)] p-4 shadow-[0_16px_50px_color-mix(in_srgb,var(--site-shadow)_12%,transparent)]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--site-faint)]">On this page</p>
            <div className="mt-4 space-y-4">
              {TOC.map((group) => (
                <div key={group.heading}>
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--site-faint)]">{group.heading}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const depth = Number(item.depth) || 0
                      const depthClass = depth === 1
                        ? 'pl-4 text-[12.5px] font-medium text-[var(--site-ink)]'
                        : depth >= 2
                          ? 'ml-4 border-l border-[var(--site-line)] pl-3 text-[12px] text-[var(--site-muted)]'
                          : 'text-[13px]'
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={`block rounded-lg px-2 py-1.5 text-[var(--site-muted)] no-underline transition hover:bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] hover:text-[var(--site-ink)] ${depthClass}`}
                        >
                          {item.label}
                        </a>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-3">
          <Section id="flow" index="01" title="运行与任务窗口" summary="全流程、单项任务和手动停止" defaultOpen>
            <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">当前实现</h3>
            <p className="text-[var(--site-ink)]">全流程启动时，评论帖子和评论通知保持运行；点赞、关注和发帖进入后台队列，同一时间只启动一项。等待冷却时，后台先保存恢复时间，再关闭对应任务窗口，到期重新打开。</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>评论帖子、评论通知、点赞帖子、点赞评论、清理未回关、回关粉丝、普通发帖和精品发帖各用自己的任务窗口。</li>
              <li>顶部页签会打开尚未创建的任务窗口，已打开则跳转；不会重启任务。任务详情中的“前往”执行相同的跳转，不启动任务。单项按钮只控制当前任务。</li>
              <li>主按钮与单项按钮统一为“状态 · 动作”。单项按钮点击前会重新读取后台调度状态，排队和倒计时期间不会误启动。全流程手动暂停后显示“已停止 · 点击启动全部”，仍可点击；顶部同步显示“已停止 · 全流程已暂停”。各任务的“停止”只停止该任务；风控等待不会暂停其他任务。</li>
              <li>详情和八项子功能顶部共用四类状态：运行中、等待中、需处理、已停止。评论帖子、评论通知遇到疑似自动化提示时显示等待原因和倒计时，不转成“需处理”。点赞、关注、发帖连续受限后的需处理状态会在子功能和详情中同步显示。打开详情刷新后台状态后，整个面板会同步更新；停止超过 15 秒可点击重试停止。</li>
              <li>队列任务每次运行最多 15 分钟，安全结束当前动作后轮换。点赞、关注、发帖连续 3 次受限会停止该任务的自动重试；评论两项持续按 10、20、30 分钟递增倒计时，到期自动重试。手动停止仍会取消对应任务的自动重试。</li>
              <li>回复和发帖的普通排程可点“立即开始”；疑似自动化冷却期间，该按钮用于停止任务，不能跳过风控等待。</li>
            </ul>
            <div id="task-window-plan" className="scroll-mt-24">
              <TaskWindowPlan />
            </div>
            <div id="task-schedule-prototype" className="scroll-mt-24">
              <TaskSchedulePrototype />
            </div>
            <div className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
              <h3 className="text-[14px] font-semibold text-[var(--site-ink)]">单页签排班要先满足的条件</h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[12px] leading-6">
                <li>后台按账号、按任务分别保存已处理记录、草稿、运行阶段、下次到期时间与冷却原因；页签只执行当前获选任务。</li>
                <li>到期的评论、点赞、关注、发帖公平轮转；精品发帖按自己的档期进入队列，错过档期不集中补发。</li>
                <li>只在确认当前点击或发送完成后切换 X 页面。单项冷却只延后该项；账号级限制由该账号单独等待，另一个账号继续排班。</li>
              </ol>
            </div>
          </Section>

          <Section id="states" index="02" title="状态和按钮速查" summary="四类状态：运行中、等待中、需处理、已停止" defaultOpen>
            <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">全流程主按钮</h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
              <table className="w-full min-w-[620px] text-left text-[12px] leading-5">
                <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]"><tr><th className="px-3 py-2">当前情况</th><th className="px-3 py-2">按钮显示</th><th className="px-3 py-2">点击结果</th></tr></thead>
                <tbody>
                  {FLOW_BUTTON_ROWS.map(([condition, label, action]) => (
                    <tr key={condition} className="border-t border-[var(--site-line)]"><td className="px-3 py-2">{condition}</td><td className="px-3 py-2 font-semibold text-[var(--site-ink)]">{label}</td><td className="px-3 py-2">{action}</td></tr>
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
            <p className="rounded-xl border border-[color-mix(in_srgb,var(--site-green)_20%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_7%,var(--site-panel))] px-4 py-3 text-[13px] leading-6">
              顶部“详情”汇总 8 项任务。界面只显示上述四类；“启动中 / 停止中”是短暂过渡。状态只反映扩展记录；X 页面是否完成动作，以页面反馈和已确认的统计为准。
            </p>
          </Section>

          <Section id="risk" index="03" title="风控与异常恢复" summary="10 → 20 → 30 分钟；只等待触发提示的任务">
            <div className="space-y-5">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">疑似自动化提示</h3>
                <p className="mt-1 text-[12px] text-[var(--site-faint)]">评论任务持续倒计时；其他任务保留连续受限保护</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>检测到提示后，当前任务停止新动作并进入“等待中”；其他任务照常运行。</li>
                  <li>评论帖子和评论通知第一次等待 10 分钟，再次受限等待 20 分钟，第三次 30 分钟，此后每次增加 10 分钟。后台保存截止时间；倒计时结束后自动检查并继续，不进入“需处理”。</li>
                  <li>如果限制提示仍在，关注和发帖不会直接继续点击或发送，而是进入下一档等待。评论再次被 X 拒绝时也会进入下一档。</li>
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
            </div>
          </Section>

          <Section id="tasks" index="04" title="四类任务规则" summary="评论 · 点赞 · 关注 · 发帖">
            <div className="space-y-3">
              <TaskBlock id="comments" badge="评" title="评论管理" summary="评论帖子 · 评论通知">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="reply-timeline" className="scroll-mt-24">评论帖子从首页找可回复的帖子，不执行点赞。默认 AI 模式下，每条独立抽取：约 80% 直接回应原帖，约 20% 先说自己的具体看法，再在末尾 @grok 一次，请它补充另一个有依据的角度。抽取结果随待发回复保存，重试和重复换写沿用同一选择。</li>
                  <li id="reply-notifications" className="scroll-mt-24">评论通知只处理最近 2 小时内别人对当前账号的回复；@grok 发来的通知直接跳过，不回复、不计入成功数。其余通知不执行点赞，也不加入 @grok；直接回应对方最新一句。</li>
                  <li>这是评论正文目前唯一的概率分配：每条独立按 20% 概率抽取，不保证每天恰好五条里有一条。手动切换到模板模式时，全部使用固定话术，不参与 AI 模式的 80%／20% 抽取；提及 Grok 也不保证它一定回复。</li>
                  <li>两项各在独立窗口运行，保留去重进度。通知列表扫完后等待 10 分钟，再检查新通知。</li>
                  <li>两项评论任务遇到疑似自动化提示都会进入上面的递增冷却，到期自动重试；普通轮次和周期等待可“立即开始”，风控冷却不能跳过。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="likes" badge="赞" title="点赞管理" summary="点赞帖子 · 点赞评论">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="likes-posts" className="scroll-mt-24">点赞帖子处理首页帖。</li>
                  <li id="likes-replies" className="scroll-mt-24">点赞评论逐帖打开评论，只点赞评论，不重复点赞原帖。</li>
                  <li>两项独立记录进度。点击后以 X 的“已点赞”状态确认成功。未确认且出现新限制提示时进入冷却；如果旧 X 限制提示一直存在，连续两次未确认才进入冷却。插件面板文字和普通等待提示不算受限。</li>
                  <li>确认受限后，普通次数限制使用较长冷却；疑似自动化提示使用 10 分钟起的递增冷却。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="mutual-rules" badge="关" title="关注管理" summary="清理未回关 · 回关粉丝">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="mutual-unfollow" className="scroll-mt-24">清理未回关：没有“Follows you”标记的 Following 会进入取关候选；已回关账号默认保留。</li>
                  <li>默认开启“非中文资料也清理”：已回关账号的姓名和简介都有文字且都不含汉字时，也会进入取关候选；任一处有汉字就保留。未回关账号照常清理。</li>
                  <li>清理操作每次间隔 2 秒，不套用回关的批次或每日数量上限。</li>
                  <li id="mutual-followback" className="scroll-mt-24">回关粉丝优先处理姓名或简介含汉字的账号；每 15 个暂停 30 分钟，每日最多 400 个，次日继续。关注候选暂时停用。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="poster" badge="帖" title="定时发帖" summary="普通发帖与精品发帖">
                <ul className="list-disc space-y-2 pl-5">
                  <li>定时发帖下分普通发帖、精品发帖两个子任务，各自独立窗口启停，可随全流程一起调度。</li>
                  <li id="poster-normal" className="scroll-mt-24">普通发帖：先读知乎、今日头条，每路最多试写 12 条；仍没有草稿时补充 AI HOT，最后使用常用社会观察。新帖按条随机：20% 配图、40% 原篇幅、40% 精简。第一条立即发送，其后按所选频率挡位等待，并按北京时间波浪加密：早 7:00–10:00、午 12:30–13:30、晚 18:00–22:00 更密，其他时段更疏，不是均匀铺开。完整曲线见下方<a href="#poster-wave" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">发帖波浪时间线</a>。</li>
                  <li id="poster-premium" className="scroll-mt-24">精品发帖：每天最多 5 条，按北京时间 08:00 / 09:30 / 12:00 / 15:00 / 19:00 发布；正文固定原篇幅，配图比例约 50%。晚启动或准备超时会跳过已经错过的档位，等待下一档；当天最后一档过后等到次日 08:00，不集中补发。等待时按钮可停止任务。</li>
                  <li>模型返回可用正文后写入待发列表；发帖框若已有图片会等待人工确认或移除。X 提示重复时跳过该条；疑似自动化提示会暂停当前发帖任务并倒计时重试。</li>
                </ul>
                <div id="poster-wave" className="mt-4 scroll-mt-24">
                  <PostWaveTimeline />
                </div>
              </TaskBlock>
            </div>
          </Section>

          <Section id="frequency" index="05" title="频率与设置" summary="默认值、修改位置和运行中的限制">
            <ul className="list-disc space-y-2 pl-5">
              <li>频率设置里可修改各挡位数字；工作区只选择边界测试、慢、中、快、超快。任务运行时不能改挡位，停止后修改会自动保存。</li>
              <li>回复默认“边界测试”：起步每条 6～10 秒、每轮 20～30 条、每次 2～3 轮、周期休息 10～15 分钟；根据已确认的运行结果调整。慢、中、快、超快的具体数字以“频率设置”为准。</li>
              <li>普通发帖默认“中”：基础间隔 25～35 分钟，再按早晚高峰加密、低峰拉疏（见<a href="#poster-wave" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">发帖波浪时间线</a>）；慢 / 快 / 超快同理缩放。精品发帖不使用频率挡位，固定每天 5 档。</li>
              <li>回复模型、DeepSeek API Key 和两种提示词在“模型设置”管理。尚未配置 DeepSeek 时，首页只显示前往模型设置的引导，点击后定位密钥输入框。发帖正文每行之间留一个空行；精简稿目标约 35～60 字、3～4 行。随机开头和措辞由提示词控制，本地不按字数或风格退稿。</li>
              <li>插件不设每日回复总量；清理未回关不设批次或每日数量上限。平台限制仍会触发对应等待。</li>
            </ul>
          </Section>

          <Section id="rules" index="06" title="平台边界与官方来源" summary="技术上限不代表账号可用频率">
            <p>X 的公开自动化、账户限制和真实性规则适用于这些操作。扩展的频率挡位与倒计时只是本地调度参数，不代表 X 认可的安全阈值。</p>
            <p>公开的每日数量、账户状态和更短时间窗口是不同约束；发生限制时，应以 X 页面给出的验证或限制提示为准。</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a href="https://help.x.com/en/rules-and-policies/x-automation" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 text-[12px] font-semibold text-[var(--site-ink)] no-underline">自动化规则 ↗</a>
              <a href="https://help.x.com/en/rules-and-policies/x-limits" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 text-[12px] font-semibold text-[var(--site-ink)] no-underline">账户限制 ↗</a>
              <a href="https://help.x.com/en/rules-and-policies/authenticity" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 text-[12px] font-semibold text-[var(--site-ink)] no-underline">真实性政策 ↗</a>
            </div>
          </Section>

          <Section id="maintenance" index="07" title="更新与数据维护" summary="版本提示、自动维护、每日报告">
            <ul className="list-disc space-y-2 pl-5">
              <li>标题旁“检查中 / 最新版 / 有新版本”比较当前加载的扩展与本地开发目录。“立即更新并恢复”会先停止运行中的任务，加载新版后只恢复原先在运行或冷却的任务；没有新版本时不会停任务。</li>
              <li>主操作区只保留全流程按钮和任务详情。旧的清理与说明按钮已移除；各任务状态、限制倒计时和恢复规则在本文档对应章节查看。</li>
              <li>每日报告随心跳自动同步当日统计，并在每天北京时间 09:00 补传前一天；休眠或关闭浏览器错过时间后，下次启动会继续同步。</li>
            </ul>
          </Section>

          <Section id="releases" index="08" title="周总结" summary="从首个有日期版本所在周起算；每周提炼重点，完整条目见仓库 README">
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
        </div>
      </div>
    </PageContainer>
  )
}
