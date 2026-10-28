import Link from 'next/link'

import { loadXExtensionReleaseWeeks } from '../../../../../lib/community/xExtensionReleaseWeeks'
import PageContainer from '../../../components/PageContainer'
import DocsHashNavigation from './DocsHashNavigation'
import PostWaveTimeline from './PostWaveTimeline'
import TaskWindowPlan from './TaskWindowPlan'

export const dynamic = 'force-static'

const RELEASE_WEEKS = loadXExtensionReleaseWeeks()

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const DOCS_PATH = `/resources/${RESOURCE_SLUG}/docs`
const RESOURCE_PATH = `/resources/${RESOURCE_SLUG}`
const DOCS_URL = `https://2aran.com${DOCS_PATH}`

const title = 'X高频互动助手文档中心'
const description =
  'v4 单页签串行排班说明：相对 v3 多页签并行，任务轮班更顺、无关等待更短。含状态速查、任务规则、风控恢复与频率设置。'

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
      { id: 'v3-to-v4', label: 'v3 → v4 升级', depth: 1 },
      { id: 'task-window-plan', label: '面板截图', depth: 1 },
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
  ['尚未运行 / 已停止', '已停止 · 点击启动全部', '启动后评论先跑，其他任务进入后台队列。', '启动评论；点赞、关注、发帖进后台队列。'],
  ['正在启动', '启动中 · 请稍候', '正在打开执行页，完成后自动开始。', '暂不可点击。'],
  ['有任务执行', '运行中 · 点击暂停全部', '有任务正在执行。', '暂停全部并关闭后台调度。'],
  ['有等待项和已停止项', '已停止 · 点击启动未运行', '有任务尚未启动；已有倒计时会保留。', '只启动未运行项。'],
  ['占用槽位但未确认启动', '后台调度中 · 点击暂停', '正在确认当前任务是否已启动，确认后开始执行。', '暂停排班。'],
  ['全部等待，调度开启', '后台调度中 · 点击暂停', '等待下一项到期后自动切换；有倒计时时提示“约 X 后继续”。', '暂停排班。'],
  ['全部等待，调度关闭', '等待恢复 · 点击恢复全部', '排班已关，倒计时仍保留。', '重新开启全流程。'],
  ['手动暂停', '已停止 · 点击启动全部', '全流程已暂停，可重新启动。', '重新启动全流程。'],
  ['正在停止', '停止中 · 请稍候', '正在结束全部任务，结束后可再启动。', '暂不可点击。'],
  ['停止超时', '需处理 · 点击重试停止', '停止超时，请再点一次暂停。', '再次发送暂停指令。'],
  ['状态未同步', '需处理 · 点击检查并启动', '任务状态未同步，点击后检查并启动。', '检查并启动未运行项。'],
  ['全部受限，调度开启', '需处理 · 点击暂停', '任务受限，请先查看详情。', '也可暂停排班。'],
  ['全部受限，调度关闭', '需处理 · 请先看详情', '任务受限，确认账号后再单独启动。', '暂不可点击。'],
  ['已结束', '已停止 · 点击重新启动', '全流程已结束。', '重新启动全流程。'],
]

const SINGLE_BUTTON_ROWS = [
  ['正在执行', '运行中 · 点击停止', '只停止当前任务；正常排程的“立即开始”仍只跳过普通等待。'],
  ['在共用执行页签运行', '运行中 · 点击查看', '只打开面板详情，不改变排班。排班台的「查看当前任务详情」也会打开当前任务子页。'],
  ['后台队列或自动恢复倒计时', '等待中 · 约 X · 点击查看', '等待原因写在悬停提示；排班台只查看；子页可点“点击立即启动”请求优先重试。'],
  ['调度关闭但任务仍等待', '等待中 · 点击查看', '等待原因写在悬停提示；打开对应任务详情查看当前等待状态。'],
  ['状态暂未同步', '需处理 · 点击查看', '打开对应任务窗口核对状态，不直接启动第二份任务。'],
  ['连续受限', '需处理 · 点击启动', '仅适用于点赞、关注和发帖；确认账号状态后可单独重新启动。评论任务继续显示等待倒计时。'],
  ['已经手动停止 / 空闲', '已停止 · 点击启动', '单独恢复或启动该任务，不重启其他任务。'],
  ['正在停止', '等待中 · 请稍候', '暂不可点击；正在停止归入等待中。'],
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
          v4 把多页签并行改成单页签串行排班：八项任务按到期轮班，冷却只卡住自己，其他到期项立刻接手。下面是状态速查、任务规则、异常恢复与设置边界。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={RESOURCE_PATH} className="inline-flex items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3.5 py-2 text-[12px] font-semibold text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]">
            返回插件介绍
          </Link>
          <a href="#v3-to-v4" className="inline-flex items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3.5 py-2 text-[12px] font-semibold text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]">
            看 v3 → v4 升级
          </a>
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
          <Section id="flow" index="01" title="运行与任务窗口" summary="v3→v4、全流程、单项任务和手动停止" defaultOpen>
            <div id="v3-to-v4" className="scroll-mt-24 space-y-3 rounded-2xl border border-[color-mix(in_srgb,var(--site-green)_28%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_6%,var(--site-panel))] p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--site-green)_30%,var(--site-line))] bg-[var(--site-panel)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--site-green)]">2026-10-28</span>
                <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">从 v3 升级到 v4</h3>
              </div>
              <p className="m-0 text-[14px] leading-7 text-[var(--site-ink)]">
                v3 常为多项任务同时开多个 X 页签并行跑；某一项在冷却或排队时，其他项也容易跟着空等，页签多、切换乱。v4 改为每个 Chrome 配置文件里的一个 X 账号共用一个执行页签，评论、点赞、关注和发帖共八项任务按到期时间串行轮班：当前项做完、让位或进入冷却后，其他到期项立刻接手，不再为无关等待干耗时间。
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
                    <li>一账号一个执行页签，八项任务轮班占用</li>
                    <li>冷却、档期等待只卡住自己，到期项马上接手</li>
                    <li>排班台按上一 / 当前 / 下一展示，查看不改队列</li>
                  </ul>
                </div>
              </div>
              <p className="m-0 text-[12px] leading-6 text-[var(--site-faint)]">v4 仍是本地开发版，尚未打包；站内下载包仍是 v3，按旧规则运行。加载本地 v4 后，旧多窗口会在首次启动时安全收敛到单页签。</p>
            </div>
            <h3 className="pt-2 text-[15px] font-semibold text-[var(--site-ink)]">v4 怎么跑</h3>
            <p className="text-[var(--site-ink)]">后台按到期时间、时段与优先级安排八项任务；没有到期任务时保留共享页签，倒计时结束后在原页签继续。旧版若已清掉页签记录，会先核对并复用当前激活的同账号 X 页签；找不到可用页签时才新建。</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>评论帖子、评论通知、点赞帖子、点赞评论、清理未回关、回关粉丝、普通发帖和精品发帖进入同一队列。任务切换前会等当前操作结束并保存状态；冷却、发帖排程和手动停止优先于排班。</li>
              <li>点击任务只切换面板里的详情，不改变排班队列。「查看当前任务详情」直接打开当前任务子页，不新开或切换浏览器页签。单项按钮只控制对应任务的启停。</li>
              <li>主按钮只写短句「状态 · 动作」，例如“后台调度中 · 点击暂停”“运行中 · 点击暂停全部”；接下来怎样写在按钮下方一行提示。单项按钮同样保持短句，等待原因放在悬停提示。全流程手动暂停后按钮为“已停止 · 点击启动全部”。各任务的“停止”只停止该任务；风控等待不会暂停其他任务。</li>
              <li>详情和八项子功能顶部共用四类状态：运行中、等待中、需处理、已停止。评论帖子、评论通知遇到疑似自动化提示时显示等待原因和倒计时，不转成“需处理”。点赞、关注、发帖连续受限后的需处理状态会在子功能和详情中同步显示。打开详情刷新后台状态后，整个面板会同步更新；停止超过 15 秒可点击重试停止。</li>
              <li>排班台是默认常驻主界面，按「上一任务 / 当前任务 / 下一任务」展示轮班历史与预计顺序；运行中绿边跑马灯，等待中黄边跑马灯，已停止 / 需处理红边呼吸。点任务进入单项详情，「← 排班台」返回；查看不改变排班。默认权重依次为评论帖子、评论通知、点赞帖子、点赞评论、普通发帖、精品发帖、回关粉丝、清理未回关；精品发帖到固定档位时优先。评论和点赞各按自己的速度档位完成本次全部轮次后让出共享页签；遇 X 频率限制时先保存冷却截止时间并让其他任务运行。8 小时占用上限仅用于异常恢复。普通发帖按批次发完后进入周期等待再让位。回关粉丝在北京时间 22:00–次日 06:00 处理，约每天一次，每确认 15 个冷却 30 分钟；清理未回关约每 7 天一轮。排班设置可分别选择四项评论、点赞任务的轮次速度。精品发帖仍按北京时间 08:00、09:30、12:00、15:00、19:00 排程，不集中补发。</li>
              <li>一次任务包含若干轮；评论帖子与评论通知每轮设置要完成的回复条数，点赞帖子与点赞评论每轮设置要完成的点赞个数。界面分别写“第几次任务”“第几轮”“几条回复 / 几个点赞”，排班历史也按实际单位计数。</li>
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

          <Section id="states" index="02" title="状态和按钮速查" summary="四类状态：运行中、等待中、需处理、已停止" defaultOpen>
            <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">全流程主按钮</h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
              <table className="w-full min-w-[620px] text-left text-[12px] leading-5">
                <thead className="bg-[var(--site-panel)] text-[var(--site-faint)]"><tr><th className="px-3 py-2">当前情况</th><th className="px-3 py-2">按钮显示</th><th className="px-3 py-2">按钮下方提示</th><th className="px-3 py-2">点击结果</th></tr></thead>
                <tbody>
                  {FLOW_BUTTON_ROWS.map(([condition, label, hint, action]) => (
                    <tr key={condition} className="border-t border-[var(--site-line)]"><td className="px-3 py-2">{condition}</td><td className="px-3 py-2 font-semibold text-[var(--site-ink)]">{label}</td><td className="px-3 py-2">{hint}</td><td className="px-3 py-2">{action}</td></tr>
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
              等待中的任务会说明正在等什么：前一项任务完成、下一次运行时间、X 限制冷却、固定发帖档位或夜间回关时段。有截止时间时显示剩余倒计时；排班卡、详情和任务子页使用同一份后台状态。等待动效仅用于提示状态，系统开启“减少动态效果”后不播放。
            </p>
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
            </div>
          </Section>

          <Section id="tasks" index="04" title="四类任务规则" summary="评论 · 点赞 · 关注 · 发帖">
            <div className="space-y-3">
              <TaskBlock id="comments" badge="评" title="评论管理" summary="评论帖子 · 评论通知">
                <div id="reply-timeline" className="scroll-mt-24 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
                  <h4 className="font-semibold text-[var(--site-ink)]">评论帖子</h4>
                  <ol className="mt-2 list-decimal space-y-2 pl-5">
                    <li>从首页寻找可回复的帖子，只发送评论，不顺手点赞；已处理的帖子会记录下来，避免重复回复。</li>
                    <li>一次任务会按所选速度档位生成多轮计划，每轮各有回复条数目标。例如本次计划 5 轮，每轮约 30 条，合计约 150 条；各轮实际目标可能不同。界面的“第几次任务”指整次计划，“第几轮”指当前轮，进度和排班历史按已确认的“条回复”计数。</li>
                    <li>正常情况下完成本次全部轮次后才让出共享执行页签；轮间短暂等待仍属于本次任务。遇到 X 频率限制时，先保存冷却截止时间并让其他到期任务运行，到期后自动重新排班。普通周期等待可请求立即开始，风控冷却不能跳过。</li>
                    <li>默认 AI 模式下，每条回复独立抽取：约 80% 直接回应原帖；约 20% 先说自己的具体看法，再在末尾 @grok 一次，请它补充另一个有依据的角度。选择随待发回复保存，重试时沿用；模板模式使用固定话术，不参与这项抽取。提及 Grok 不保证它一定回复。</li>
                  </ol>
                </div>
                <ul className="list-disc space-y-2 pl-5">
                  <li id="reply-notifications" className="scroll-mt-24">评论通知按所选速度档位的轮数与每轮回复条数处理别人对当前账号的回复，不按通知时间划定两小时范围；已处理通知持续去重。@grok 发来的通知直接跳过，不回复、不计入成功数。其余通知不执行点赞，也不加入 @grok；直接回应对方最新一句。</li>
                  <li>两项轮流占用同一个执行页签，分别保留去重进度。完成本次全部轮次或通知页没有更多待处理内容后，按各自速度档位等待下一次排班；本次计划内的轮间等待不让位。</li>
                  <li>两项评论任务遇到疑似自动化提示都会进入上面的递增冷却，到期自动重试；普通轮次和周期等待可“立即开始”，风控冷却不能跳过。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="likes" badge="赞" title="点赞管理" summary="点赞帖子 · 点赞评论">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="likes-posts" className="scroll-mt-24">点赞帖子处理首页帖。</li>
                  <li id="likes-replies" className="scroll-mt-24">点赞评论逐帖打开评论，只点赞评论，不重复点赞原帖。</li>
                  <li>两项独立记录进度。点击后以 X 的“已点赞”状态确认成功。未确认且出现新限制提示时进入冷却；如果旧 X 限制提示一直存在，连续两次未确认才进入冷却。插件面板文字和普通等待提示不算受限。</li>
                  <li>点赞帖子和点赞评论各自按排班设置中的速度档位生成本次轮数和每轮点赞个数；本次完成后让位，X 提示频率限制时保存冷却时间并先运行其他任务。</li>
                  <li>确认受限后，普通次数限制使用较长冷却；疑似自动化提示使用 10 分钟起的递增冷却。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="mutual-rules" badge="关" title="关注管理" summary="清理未回关 · 回关粉丝">
                <ul className="list-disc space-y-2 pl-5">
                  <li id="mutual-unfollow" className="scroll-mt-24">清理未回关：没有“Follows you”标记的 Following 会进入取关候选；已回关账号默认保留。全流程排班默认约每周一次，到点后占用约 10 分钟做一轮清理，不会和其他任务一样频繁轮换。</li>
                  <li>默认开启“非中文资料也清理”：已回关账号的姓名和简介都有文字且都不含汉字时，也会进入取关候选；任一处有汉字就保留。未回关账号照常清理。</li>
                  <li>清理操作每次间隔 2 秒，不套用回关的批次或每日数量上限。</li>
                  <li id="mutual-followback" className="scroll-mt-24">回关粉丝优先处理姓名或简介含汉字的账号；默认在北京时间 22:00–次日 06:00 开启夜间处理，约每天一次。每次占用共享页签最长约 10 分钟；每确认 15 个就冷却 30 分钟，冷却期间让出页签，夜间时段内到期后继续。06:00 后等待下一次夜间时段。每日 400 个是底层上限，不是排班目标。任务自身冷却与 X 限制仍优先，关注候选暂时停用。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="poster" badge="帖" title="定时发帖" summary="普通发帖与精品发帖">
                <ul className="list-disc space-y-2 pl-5">
                  <li>定时发帖下分普通发帖、精品发帖两个子任务，各自独立窗口启停，可随全流程一起调度。</li>
                  <li id="poster-normal" className="scroll-mt-24">普通发帖：先读知乎、今日头条，每路最多试写 12 条；仍没有草稿时补充 AI HOT，最后使用常用社会观察。新帖按条随机：20% 配图、40% 原篇幅、40% 精简。一次按速度档位抓一批（慢约 5～10 条，高峰快档可达约 20～30 条），条间约 10～20 秒发完；本批发完后再进入周期倒计时抓下一批。周期长短仍按北京时间波浪加密：早 7:00–10:00、午 12:30–13:30、晚 18:00–22:00 更密，其他时段更疏。完整曲线见下方<a href="#poster-wave" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">发帖波浪时间线</a>。</li>
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
              <li>普通发帖默认“中”：一次抓一批、条间短间隔发完，再按档位进入批次间倒计时；早晚高峰批次更大、间隔更短，低峰相反（见<a href="#poster-wave" className="font-semibold text-[var(--site-ink)] underline-offset-2 hover:underline">发帖波浪时间线</a>）。精品发帖不使用频率挡位，固定每天 5 档。</li>
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
              <li>从已安装的 v3 下载包切到本地 v4 时，首次启动会把旧多窗口任务安全收敛到单执行页签；排班与冷却状态保留在扩展本地，不需要手动清数据。站内 ZIP 仍是 v3，直到 v4 正式打包。</li>
              <li>主操作区只保留全流程按钮、排班台和任务详情。旧的清理与说明按钮已移除；各任务状态、限制倒计时和恢复规则在本文档对应章节查看。</li>
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
