import Link from 'next/link'

import PageContainer from '../../../components/PageContainer'

export const dynamic = 'force-static'

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
      { id: 'states', label: '02 · 状态和按钮' },
      { id: 'risk', label: '03 · 风控与自动恢复' },
    ],
  },
  {
    heading: '按任务查找',
    items: [
      { id: 'tasks', label: '04 · 四类任务规则' },
      { id: 'comments', label: '评论管理', child: true },
      { id: 'likes', label: '点赞管理', child: true },
      { id: 'mutual-rules', label: '关注管理', child: true },
      { id: 'poster', label: '定时发帖', child: true },
      { id: 'frequency', label: '05 · 频率与设置' },
    ],
  },
  {
    heading: '参考资料',
    items: [
      { id: 'rules', label: '06 · 平台边界' },
      { id: 'maintenance', label: '07 · 更新与数据维护' },
      { id: 'releases', label: '08 · 版本记录' },
    ],
  },
]

const STATE_ROWS = [
  ['执行中', '当前任务正在扫描、生成或发送；详情显示最近更新时间。'],
  ['等待中', '任务在后台队列、普通排程、冷却或自动恢复倒计时中；详情显示原因和剩余时间。评论任务或当前队列任务状态失联时，后台到期复查并逐步延长重试间隔。'],
  ['需人工检查', '该任务连续 3 次受限，已退出自动队列；检查账号状态后可单项启动。'],
  ['停止中', '已收到停止指令，正在结束当前步骤；结束后退出运行记录。'],
  ['已暂停', '全流程已被手动暂停。点“重新启动”才会重新打开任务。'],
  ['未启动', '当前没有该任务的运行记录，可在对应窗口单独启动。'],
  ['待确认', '未启用全流程时，超过 90 秒没有状态更新会显示此状态；启用全流程后由后台安排自动恢复倒计时。'],
]

const RELEASES = [
  {
    version: 'v3.32.21',
    title: '按需调度任务窗口',
    detail: '评论任务常驻，其余任务后台排队；冷却先保存再关窗，连续受限后等待人工检查。',
  },
  {
    version: 'v3.32.13',
    title: '后台远程操控',
    detail: '站长监控可远程启停全流程或单项任务，并显示等待原因、倒计时与指令回执。',
  },
  {
    version: 'v3.32.12',
    title: '监控状态同步',
    detail: '站长插件监控同步评论、点赞、关注、发帖四类功能的实时状态，不只看单次动作回执。',
  },
  {
    version: 'v3.32.11',
    title: '文档中心迁到站点',
    detail: '说明文档改在 2aran.com 独立页面阅读；插件内入口直接打开对应章节。',
  },
  {
    version: 'v3.32.10',
    title: '更新状态与文档折叠修复',
    detail: '更新后恢复任务时清除旧暂停标记；文档章节可以正常展开和收起。',
  },
  {
    version: 'v3.32.9',
    title: '风控等待与自动重试',
    detail: '四类任务只让受限项等待，10、20、30 分钟递增；手动停止可取消等待。',
  },
  {
    version: 'v3.32.8',
    title: '标题换行',
    detail: '稳定运行时间单独显示一行。',
  },
  {
    version: 'v3.32.7',
    title: '全局停止状态修复',
    detail: '停止后清理旧运行记录，定时发帖等待可立即结束。',
  },
  {
    version: 'v3.32.6',
    title: '手动更新后恢复任务',
    detail: '加载本地新版后恢复原先运行的任务。',
  },
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
                    {group.items.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block rounded-lg px-2 py-1.5 text-[13px] text-[var(--site-muted)] no-underline transition hover:bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] hover:text-[var(--site-ink)] ${item.child ? 'pl-5 text-[12px]' : ''}`}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-3">
          <Section id="flow" index="01" title="运行与任务窗口" summary="全流程、单项任务和手动停止" defaultOpen>
            <p className="text-[var(--site-ink)]">全流程启动时，评论帖子和评论通知保持运行；点赞、关注和发帖进入后台队列，同一时间只启动一项。等待冷却时，后台先保存恢复时间，再关闭对应任务窗口，到期重新打开。</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>评论帖子、评论通知、点赞帖子、点赞评论、清理未回关、回关粉丝和定时发帖各用自己的任务窗口。</li>
              <li>顶部页签会打开尚未创建的任务窗口，已打开则跳转；不会重启任务。单项按钮只控制当前任务。</li>
              <li>有任务执行时，主按钮显示“暂停全部任务”；只有等待任务且仍有未启动项时，显示“启动未运行任务”，点击后等待中的倒计时照常保留。全部任务都在等待时显示“暂停自动调度”。各任务的“停止”只停止该任务；风控等待不会暂停其他任务。</li>
              <li>队列任务每次运行最多 15 分钟，安全结束当前动作后轮换。连续 3 次受限会停止该任务的自动重试，详情中保留原因，人工检查后可单项重新启动。</li>
              <li>回复和发帖的普通排程可点“立即开始”；疑似自动化冷却期间，该按钮用于停止任务，不能跳过风控等待。</li>
            </ul>
          </Section>

          <Section id="states" index="02" title="状态和按钮速查" summary="看到状态就知道任务会不会继续" defaultOpen>
            <dl className="space-y-3">
              {STATE_ROWS.map(([label, text]) => (
                <div key={label} className="grid gap-1 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-semibold text-[var(--site-ink)]">{label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-xl border border-[color-mix(in_srgb,var(--site-green)_20%,var(--site-line))] bg-[color-mix(in_srgb,var(--site-green)_7%,var(--site-panel))] px-4 py-3 text-[13px] leading-6">
              顶部“详情”汇总 7 项任务。状态只反映扩展记录；X 页面是否完成动作，以页面反馈和已确认的统计为准。
            </p>
          </Section>

          <Section id="risk" index="03" title="风控与异常恢复" summary="10 → 20 → 30 分钟；只等待触发提示的任务">
            <div className="space-y-5">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">疑似自动化提示</h3>
                <p className="mt-1 text-[12px] text-[var(--site-faint)]">评论、点赞、关注和发帖共用递增规则</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>检测到提示后，当前任务停止新动作并进入“等待中”；其他任务照常运行。</li>
                  <li>第一次等待 10 分钟，再次受限等待 20 分钟，第三次 30 分钟，此后每次增加 10 分钟。倒计时结束后自动检查并继续。</li>
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
                  <li>评论帖子从首页找可回复的帖子；评论通知只处理最近 2 小时内别人对当前账号的回复，不执行点赞。</li>
                  <li>两项各在独立窗口运行，保留去重进度。通知列表扫完后等待 10 分钟，再检查新通知。</li>
                  <li>普通轮次和周期等待可“立即开始”；疑似自动化提示进入上面的递增冷却。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="likes" badge="赞" title="点赞管理" summary="点赞帖子 · 点赞评论">
                <ul className="list-disc space-y-2 pl-5">
                  <li>点赞帖子处理首页帖；点赞评论逐帖打开评论，只点赞评论，不重复点赞原帖。</li>
                  <li>两项独立记录进度。普通次数限制使用较长冷却；疑似自动化提示使用 10 分钟起的递增冷却。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="mutual-rules" badge="关" title="关注管理" summary="清理未回关 · 回关粉丝">
                <ul className="list-disc space-y-2 pl-5">
                  <li>清理未回关：没有“Follows you”标记的 Following 会进入取关候选；已回关账号默认保留。</li>
                  <li>默认开启“非中文资料也清理”：已回关账号的姓名和简介都有文字且都不含汉字时，也会进入取关候选；任一处有汉字就保留。未回关账号照常清理。</li>
                  <li>清理操作每次间隔 2 秒，不套用回关的批次或每日数量上限。</li>
                  <li>回关粉丝优先处理姓名或简介含汉字的账号；每 15 个暂停 30 分钟，每日最多 400 个，次日继续。关注候选暂时停用。</li>
                </ul>
              </TaskBlock>
              <TaskBlock id="poster" badge="帖" title="定时发帖" summary="取材 → 改写 → 待发 → 发送">
                <ul className="list-disc space-y-2 pl-5">
                  <li>先读知乎、今日头条，每路最多试写 12 条；仍没有草稿时补充 AI HOT，最后使用常用社会观察。</li>
                  <li>模型返回可用正文后写入待发列表，成功入队一条即进入发送；记录来源和原始链接，列表发完再取新素材。</li>
                  <li>新帖子按条随机选择格式：20% 概率配原创背景文字卡片，40% 为原篇幅纯文字，40% 为精简纯文字。精简稿目标约 35～60 字，写成 3～4 个短行，每行之间留一个空行。抽取结果随待发稿保存，重试不改变。发帖框若已有图片，会等待人工确认或移除，避免误发。</li>
                  <li>第一条立即发送，其后按所选挡位等待；X 提示重复时跳过该条。疑似自动化提示会暂停当前发帖任务并倒计时重试。</li>
                </ul>
              </TaskBlock>
            </div>
          </Section>

          <Section id="frequency" index="05" title="频率与设置" summary="默认值、修改位置和运行中的限制">
            <ul className="list-disc space-y-2 pl-5">
              <li>频率设置里可修改各挡位数字；工作区只选择边界测试、慢、中、快、超快。任务运行时不能改挡位，停止后修改会自动保存。</li>
              <li>回复默认“边界测试”：起步每条 6～10 秒、每轮 20～30 条、每次 2～3 轮、周期休息 10～15 分钟；根据已确认的运行结果调整。慢、中、快、超快的具体数字以“频率设置”为准。</li>
              <li>发帖默认“中”：两条之间随机等待 25～35 分钟；慢为 50～70 分钟，快为 12～18 分钟，超快为 6～10 分钟。</li>
              <li>回复模型、DeepSeek API Key 和两种提示词在“模型设置”管理。发帖正文每行之间留一个空行；精简稿目标约 35～60 字、3～4 行。随机开头和措辞由提示词控制，本地不按字数或风格退稿。</li>
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

          <Section id="releases" index="08" title="最近版本" summary="只列当前相关改动；完整历史见仓库 README">
            <div className="space-y-3">
              {RELEASES.map((item) => (
                <article key={item.version} className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <b className="font-mono text-[12px] text-[var(--site-faint)]">{item.version}</b>
                    <strong className="text-[14px] text-[var(--site-ink)]">{item.title}</strong>
                  </div>
                  <p className="mt-1 text-[13px] leading-6">{item.detail}</p>
                </article>
              ))}
            </div>
            <p className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3 text-[13px] leading-6">
              本地开发版本记录以仓库 README 为准；公开下载页可能仍是较早版本。
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
