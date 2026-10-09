import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-reply-clipboard-extension&file=extension-zip'
const VERSION = '3.4.1'

const title = 'X 互动帮手：回复、互关与 DeepSeek 定时发推'
const description =
  'X 互动帮手是一个本地运行的 Chrome 扩展，提供时间线回复、通知回复、互关浇友和 DeepSeek 纯文字定时发推。'
const shareText = 'X 互动帮手：一个扩展完成时间线回复、通知回复、互关管理和 AI 定时发推。'

const VERSION_HISTORY = [
  {
    version: '3.4.1',
    title: '阻止密码管理器把 X 密码填进 AI Key',
    description: 'DeepSeek Key 输入框改为普通文本字段配合视觉掩码，并加入主流密码管理器忽略标记，不再被识别成 X 登录密码框。保存时必须是以 sk- 开头的 DeepSeek Key；升级后若检测到旧版误存的其他内容会自动清除。',
    current: true,
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
    title: '升级为 X 互动帮手',
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
    'X 互动帮手',
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
  return (
    <a
      href={DOWNLOAD_URL}
      download
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#0f1419] bg-[#0f1419] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200 ${className}`}
    >
      下载 Chrome 插件 v{VERSION}
    </a>
  )
}

function FeatureCard({ title, children }) {
  return (
    <div className="rounded-lg border border-[#e6e0d3] bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/40">
      <h3 className="mb-2 text-base font-semibold text-[var(--site-ink)]">{title}</h3>
      <p className="m-0 text-sm leading-7 text-[#666] dark:text-gray-300">{children}</p>
    </div>
  )
}

export default function XReplyClipboardResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/tools" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            工具库
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/tools#x-platform" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            推特工具
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/tools#downloads" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            浏览器扩展
          </Link>
          <span aria-hidden="true">·</span>
          <span>更新于 2026-10-09</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          时间线回复、通知回复与互关浇友，集中在一个面板
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          顶部默认打开「时间线」，其后依次是「通知回复」与「互关浇友」。互关浇友整合清理未回关、回关粉丝和关注候选；
          时间线与通知模式支持模板随机或 AI 回复。时间线每次运行 5 轮，通知回复扫描近 2 小时内尚未成功互动的内容；两者完成后都会休息 2 小时再自动开始下一次。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['X 平台', '时间线回复', '通知回复', '互关浇友', '模板 / AI', 'Chrome 插件'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-3 py-1 text-xs text-[#7a5b1e] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <DownloadButton />
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享这个插件" />
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
          <span className="text-xs text-[#888] dark:text-gray-500">
            工具说明免费阅读；领取工具包按当前工具包价格结算，之后可永久重复下载。
          </span>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
        <div className="not-prose mb-8 rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7a55] dark:text-amber-300/80">
                Download
              </p>
              <h2 className="m-0 mt-1 border-0 p-0 text-xl font-semibold text-[var(--site-ink)]">
                X 互动帮手
              </h2>
              <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                Manifest V3 本地 Chrome 扩展。下载后在 Chrome 扩展管理页以「加载已解压」方式安装。
              </p>
            </div>
            <DownloadButton className="shrink-0" />
          </div>
        </div>

        <h2>它会做什么</h2>
        <div className="not-prose my-8 grid gap-3 md:grid-cols-2">
          <FeatureCard title="时间线默认置顶">
            顶部按时间线、通知回复、互关浇友、推文浇给排列；新安装默认选中时间线。点击其他功能会切换到已有专用 X 页签，或新建一个页签，当前任务不会被清空。
          </FeatureCard>
          <FeatureCard title="互关浇友">
            在 Following 页清理未回关账号；在 Followers 页回关粉丝，也可按低频限制关注候选。原独立互关插件的三项能力已经合并。
          </FeatureCard>
          <FeatureCard title="随机话术">
            默认使用“模板随机”，从插件内置的 100 条完整话术里随机抽取。也可切换到“AI 模式”，由 DeepSeek 阅读原帖文字后生成更适配的回复；API Key 由用户在扩展面板中自行配置并保存在 Chrome 本地。
          </FeatureCard>
          <FeatureCard title="时间线：35 条 × 5 轮">
            时间线回复每条默认等待 2 秒；回复 35 次组成 1 轮，轮间默认等待 5 秒，一次共执行 5 轮、175 次。完成后休息 2 小时，再从新一轮 175 次开始。面板显示当前执行次数、轮次、任务运行时间和下次启动倒计时。
          </FeatureCard>
          <FeatureCard title="通知：最近 2 小时">
            不设轮次和固定总条数。每次只识别近 2 小时内包含“Replying to @当前账号”的回复通知，处理完后休息 2 小时再扫描。成功处理的通知 ID 会写入 Chrome 本地历史，刷新、重开浏览器或后续周期都会跳过。
          </FeatureCard>
          <FeatureCard title="推文浇给：25～35 分钟一条">
            DeepSeek 读取当前页面可见的趋势与时间线文字，选择一个有讨论空间的话题，生成 3～5 段纯文字推文。每段之间自动空一行；确认发送成功后随机等待 25～35 分钟再生成下一条。
          </FeatureCard>
          <FeatureCard title="只在本机运行">
            插件匹配 x.com 和 twitter.com，使用你已经登录的页面。不读取密码，也不把评论内容上传到本站。AI 模式只把当前原帖文字发送给 DeepSeek，不会发送 X 登录 Cookie。
          </FeatureCard>
        </div>

        <h2>版本记录</h2>
        <div className="not-prose my-8 overflow-hidden rounded-2xl border border-[#e4e8eb] bg-white/70 dark:border-gray-800 dark:bg-gray-950/40">
          <div className="flex flex-col gap-2 border-b border-[#e4e8eb] bg-gradient-to-r from-sky-50 to-violet-50 px-5 py-4 dark:border-gray-800 dark:from-sky-950/30 dark:to-violet-950/20 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">Changelog</p>
              <h3 className="m-0 mt-1 text-lg font-semibold text-[var(--site-ink)]">从时间线回复到完整互动工具</h3>
            </div>
            <span className="w-fit rounded-full bg-[#0f1419] px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-black">
              当前版本 v{VERSION}
            </span>
          </div>
          <ol className="m-0 list-none divide-y divide-[#e8ecef] p-0 dark:divide-gray-800">
            {VERSION_HISTORY.map((release) => (
              <li key={release.version} className="grid gap-3 px-5 py-4 md:grid-cols-[110px_minmax(0,1fr)]">
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

        <h2>使用方法</h2>
        <ol>
          <li>下载并解压插件包。</li>
          <li>打开 Chrome 的 <code>chrome://extensions/</code>，开启「开发者模式」。</li>
          <li>点击「加载已解压的扩展程序」，选择解压后的目录。</li>
          <li>登录 X，左下角面板默认选择「时间线」；也可切换到「通知回复」「互关浇友」或「推文浇给」。</li>
          <li>互关模式按页面选择清理未回关、回关粉丝或关注候选；前两项会引导打开自己的对应列表。</li>
          <li>关注候选不会自动跳转。请先打开其他作者的 Followers 页面；它与回关粉丝共享频率状态和每日额度：2 秒一个，合计每 15 个暂停 30 分钟，每日合计最多 400 个。</li>
          <li>时间线模式可在首页、个人主页或搜索结果运行；每次按 35 条一轮、共 5 轮执行，完成后等待 2 小时再开始下一次。</li>
          <li>通知模式会进入通知页，处理近 2 小时内尚未成功互动的回复；处理完等待 2 小时，再扫描新的近 2 小时通知。</li>
          <li>推文浇给会进入 X 首页，使用已保存的 DeepSeek Key 立即生成并发送第一条纯文字推文，之后每条随机间隔 25～35 分钟。</li>
          <li>点击「开始时间线回复」或「开始通知回复」。需要停下时，点「停止」。</li>
        </ol>
        <p>
          已经加载过这个目录时，到扩展管理页点一次刷新，再回到 X 重新开始。
          “推文浇给”与 AI 回复共用一个 DeepSeek API Key。它只读取当前 X 页面已经加载的趋势和时间线文字，用来生成原创短帖；不读取本站后台任务，也不会发送 X 登录 Cookie。每条推文强制使用段间空行排版，只发送纯文字。发送结果未确认时不会计数；发帖框存在手写内容时会暂停，避免覆盖。
          开始前可选择“模板随机”或“AI 模式”。两种回复助手都可设置每条回复间隔，默认 2 秒；“每轮之间间隔”只适用于时间线模式，通知模式没有轮次。AI 模式只需保存 DeepSeek API Key。Key 只保存在 Chrome 扩展本地存储中。四类任务各自绑定一个专用 X 页签，可以同时运行；离屏计时 Worker 管理后台等待，刷新页面后按保存的真实截止时间恢复。标题栏显示整个插件的稳定运行时长，任务卡显示单项运行时长。关闭专用 X 页签会停止对应任务。
          这里的“2 秒”是发送成功后的最小间隔，不包含 DeepSeek 生成、打开评论框、写入编辑器和确认发送所需的时间。v3.2.0 只把 1 秒以上的等待交给离屏 Worker，短 DOM 轮询留在页面内；评论框和 Reply 的单步等待上限为 5 秒，避免一次失败拖住十几秒。
          插件会先核对评论框里的文字没有重复，再等待 Reply 可用。已有弹窗中的内容能匹配任意一条固定话术时会接着发送；比较时会忽略 X 插入的空格、换行、零宽字符和 Emoji 变体。内容不属于固定话术才暂停，避免覆盖手写内容。
          如果旧版和新版监听器曾把一句写成两遍，新版会识别这种连续重复，自动恢复成一句再发送。更新扩展后仍需刷新已经打开的 X 标签页。
          如果 X 把占位文字当作编辑器内容，插件会精确选中整个编辑器后替换；已经形成的“稳st your reply”也会被识别并修复。
          启动时页面已经打开空评论弹窗也可以直接接管：插件会填入当前话术并发送；只有弹窗里存在无法识别的真实文字时才暂停。
          X 第一次拒绝写入时，插件会重新聚焦并完整替换一次；仍未显示话术才尝试编辑器内部状态，避免一直重复“话术没有写进评论框”。
          没有确认成功时会保留当前帖子、弹窗和话术继续重试。时间线模式只有确认发出的回复才计入每轮 35 条；通知模式只有确认点赞并回复成功后才写入去重历史。
          X 显示「Your post was sent.」时也会立即确认为成功并清理残留弹窗。自己的帖子、自己刚发出的回复以及无法确认作者的帖子会自动排除。
          评论框出现重复或残留内容时，会自动替换成一条完整话术再点击 Reply，不会卡在内容不一致状态。
          话术和 macOS 上的
          <Link href="/resources/x-clipboard-phrase">X 粘贴板评论助手</Link>
          是同一组，插件自己随机抽取。
        </p>

        <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#eee] pt-6 dark:border-gray-800">
          <DownloadButton />
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
