import Link from 'next/link'
import {
  IconBook2,
  IconCoin,
  IconEdit,
  IconFileText,
  IconHistory,
  IconHome,
  IconMail,
  IconMap2,
  IconMessageCircle,
  IconRocket,
  IconShieldLock,
  IconUserCircle,
} from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '帮助与文档',
  description: '2aran.com 完整使用文档：了解本站、浏览内容、管理账号、参与讨论、使用燃币、领取资源和排查常见问题。',
  alternates: { canonical: '/help' },
}

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: '新手入门',
    items: [
      {
        id: 'about-site',
        title: '开始使用',
        description: '从内容入口进入；需要保存权益或管理账号时再登录。',
        icon: IconHome,
        steps: [
          '从“统一内容目录”浏览文章、深度分析、工程实践、互动专题和资源。',
          '公开内容可以直接阅读；登录用于跨设备保存燃币、资源权益、评论归属和授权记录。',
          '页面内容有误时，可在原页面评论或通过联系页提交更正。',
        ],
        actions: [
          { href: '/site', label: '查看站点总说明' },
          { href: '/articles', label: '开始浏览内容' },
        ],
      },
      {
        id: 'browse-content',
        title: '浏览统一内容目录',
        description: '按内容主题和内容类型缩小范围。',
        icon: IconBook2,
        steps: [
          '第一次访问可以从首页“从这里开始”选择学习 AI、了解公司、查看工程实践、寻找资料或订阅动态。',
          '内容菜单先列内容主题，再列文章、分析、实践和资源四种内容类型。',
          '搜索会匹配标题、摘要、主题和对象；筛选与关键词会写入网址，复制链接即可保留当前结果。',
          '列表默认先显示一批内容，页面底部可继续加载；文章详情页的目录可用于长文内跳转。',
        ],
        note: '找不到内容时，先清空细分类，再使用更短的关键词搜索。',
        actions: [{ href: '/articles', label: '打开统一内容目录' }],
      },
      {
        id: 'account',
        title: '登录与账号',
        description: '登录、绑定凭据，并查看燃币、资源权益和客户端授权。',
        icon: IconUserCircle,
        steps: [
          '登录后进入“个人资料”，可查看平台 ID、当前燃币、已解锁资源和资源领取记录。',
          '“连接账号”用于给同一个站内账号添加 GitHub、Google 等登录凭据；至少会保留一种可登录方式。',
          '添加第三方登录只会新增凭据，不会根据昵称或邮箱猜测并自动合并两个已有账号。',
          '登录前产生的游客评论、燃币和已付费解锁会在登录时归入当前账号；个人资料不再展示内部游客身份列表。',
          '“授权管理”用于查看并撤销已经获得本站 MCP 权限的客户端，不影响普通网页登录。',
        ],
        note: '如果同一种登录方式已属于另一个账号，系统会拒绝自动合并，以免把两个真实用户的数据混在一起。',
        actions: [
          { href: '/login?returnTo=/account', label: '登录' },
          { href: '/account', label: '打开个人资料' },
        ],
      },
    ],
  },
  {
    id: 'participation',
    title: '参与和权益',
    items: [
      {
        id: 'comments',
        title: '评论与讨论',
        description: '在具体内容下留言、回复，并在讨论中心跟进站内交流。',
        icon: IconMessageCircle,
        steps: [
          '文章、调研和部分资源页底部提供讨论区；直接输入内容即可发表，也可以回复某一条评论。',
          '游客可以评论；登录后，当前浏览器中已有的游客历史评论会绑定到登录账号。',
          '登录用户收到回复后，可从顶部账号菜单或讨论中心查看通知，并跳回具体评论位置。',
          '讨论中心汇总近期评论、活跃话题与专题圈子；真正的评论仍归属于原文章或资源。',
          '有效评论会按当前燃币规则获得奖励；重复、垃圾或被删除的评论不计入奖励。',
        ],
        note: '请围绕页面主题讨论。账号、隐私、付款和需要公开材料以外信息的问题，应通过邮件联系。',
        actions: [{ href: '/community', label: '打开讨论中心' }],
      },
      {
        id: 'ranbi',
        title: '燃币说明',
        description: '理解燃币的获取、使用、记录方式，以及它与资源权益的关系。',
        icon: IconCoin,
        steps: [
          '燃币是本站的资源权益和参与记录，不可提现，也没有自动充值入口。',
          '游客首次访问会有试用额度；登录账号可通过注册、签到、有效评论、活动或站长调整获得燃币。',
          '打开有门槛的文字内容时会自动解锁；工具包和安装包只在点击领取时结算。',
          '同一资源解锁一次后永久有效，刷新或再次打开不会重复使用燃币。',
          '个人资料会显示当前余额、已解锁资源和领取记录；完整数值以燃币说明页展示的实时规则为准。',
        ],
        note: '部分壁纸、音乐等免费资源也会记录领取或打开，但不使用燃币。',
        actions: [
          { href: '/ranbi', label: '查看实时规则与余额' },
          { href: '/account', label: '查看我的权益' },
        ],
      },
      {
        id: 'resources',
        title: '查找与领取资源',
        description: '从资源库筛选资料、外部收藏和可下载内容，并保存领取记录。',
        icon: IconFileText,
        steps: [
          '进入统一内容目录的“资源”，可继续按内容主题筛选。',
          '内容型资源可能在进入详情时使用燃币；工具包和安装包会在点击领取按钮时明确结算。',
          '余额不足时先登录并签到，或通过评论、活动和联系站长补充；不要重复刷新领取按钮。',
          '登录后，已解锁内容会列在个人资料中；永久权益可以从记录重新打开。',
          '如果下载链接失效、文件损坏或解锁后仍打不开，请附资源标题、页面网址和报错截图联系站长。',
        ],
        note: '外部收藏会跳到第三方网站，其可用性和隐私规则由对应服务决定。',
        actions: [
          { href: '/articles?tab=resources', label: '浏览资源库' },
          { href: '/account', label: '查看领取记录' },
        ],
      },
    ],
  },
  {
    id: 'reference',
    title: '规则与参考',
    items: [
      {
        id: 'editorial',
        title: '内容说明',
        description: '查看统一的作者责任、来源、安全边界与修订政策。',
        icon: IconEdit,
        steps: [
          '内容详情页会显示实际内容形态，例如观点、分析、工程案例、建站日志、事实核验或资料。',
          '完整政策集中在“内容说明与更正政策”，帮助页不再重复维护另一套规则。',
          '提交更正时请附页面网址、具体段落、可核验来源和建议修改方式。',
        ],
        actions: [{ href: '/editorial', label: '查看完整内容政策' }],
      },
      {
        id: 'privacy',
        title: '隐私政策',
        description: '了解登录、评论、Cookie、统计、广告和第三方服务如何处理数据。',
        icon: IconShieldLock,
        steps: [
          '基础访问数据用于统计、故障排查、安全和内容改进；登录或互动时会保存你主动提交的信息。',
          'Cookie 与本地存储用于保存登录状态、游客身份、语言、主题和阅读偏好。',
          '登录提供方、Cloudflare、邮件、统计和广告等第三方服务会按各自政策处理必要数据。',
          '本站不会出售你的个人信息，也不会主动把评论、邮箱或登录信息提供给无关第三方。',
          '你可以请求查询、修改或删除评论、账号关联、订阅及其他个人数据。',
        ],
        note: '语言和主题偏好保存在当前浏览器；清理站点数据后需要重新选择，也可能生成新的游客试用身份。',
        actions: [{ href: '/privacy', label: '查看完整隐私政策' }],
      },
      {
        id: 'site-map',
        title: '全站导航',
        description: '理解主导航与全站地图的区别，查找不常出现在顶部的页面。',
        icon: IconMap2,
        steps: [
          '顶部主导航只保留常用频道，避免每个页面都挤进菜单。',
          '全站导航按内容、工具、系统、社区和身份等频道列出站点结构。',
          '部分页面只对登录用户或站长可见；未满足权限时不会在公开入口中展示。',
          '如果你记得页面名称但找不到入口，可先用全站导航，再用浏览器页内查找。',
        ],
        actions: [{ href: '/map', label: '打开全站导航' }],
      },
      {
        id: 'preferences',
        title: '语言与主题',
        description: '切换中文或 English，并保存浅色、深色和经典主题。',
        icon: IconRocket,
        steps: [
          '点击右上角头像，在“语言”中直接选择“中文”或“English”；当前语言会显示勾选状态。',
          '在“主题”中选择浅色、深色或经典；选择会保存在当前浏览器。',
          '语言切换主要覆盖全站公共导航和已接入双语的界面；历史文章正文不会被自动机器翻译。',
          '若切换后没有变化，先刷新当前页；仍无效时检查浏览器是否阻止本地存储，或清除本站数据后重试。',
        ],
        note: '换设备、无痕窗口或清除浏览器数据后，语言和主题需要重新设置。',
      },
      {
        id: 'changelog',
        title: '更新记录',
        description: '查看已经交付的功能、内容建设和后续计划。',
        icon: IconHistory,
        steps: [
          '更新记录默认按自然周整理，也可以切换到月度、季度和年度；同一周期内的多次更新会自动合并。',
          '“已做”代表已经进入代码或内容库；“计划”只是下一步方向，不等于已经上线。',
          '页面同时记录设计原则，作为后续主题、配色、间距和组件一致性的维护依据。',
        ],
        actions: [{ href: '/changelog', label: '查看更新记录' }],
      },
      {
        id: 'contact',
        title: '联系与反馈',
        description: '按问题类型选择评论、邮件、微信或 GitHub，减少来回确认。',
        icon: IconMail,
        steps: [
          '具体文章或资源的公开补充，可以直接留在对应页面评论区。',
          '账号、隐私、数据删除和正式合作优先使用邮件，便于确认身份并保留处理记录。',
          '资源领取、燃币调整和轻量交流可使用微信；开源代码问题适合通过 GitHub 提交。',
          '反馈故障时请附页面网址、发生时间、浏览器或设备、操作步骤和截图；不要发送密码或登录 Cookie。',
        ],
        note: '描述“期望发生什么”和“实际发生什么”，通常能最快定位问题。',
        actions: [{ href: '/contact', label: '查看联系方式' }],
      },
    ],
  },
]

function Sidebar() {
  return (
    <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
      <nav
        aria-label="帮助目录"
        className="flex gap-3 overflow-x-auto border-b border-[var(--site-line)] pb-4 lg:block lg:max-h-[calc(100vh-var(--site-header-height)-3rem)] lg:space-y-6 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-4 lg:pr-6"
      >
        {HELP_SECTIONS.map((section) => (
          <div key={section.id} className="min-w-[190px] lg:min-w-0">
            <a
              href={`#${section.id}`}
              className="mb-2 block px-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--site-faint)] no-underline hover:text-[var(--site-ink)]"
            >
              {section.title}
            </a>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[var(--site-muted)] no-underline transition hover:bg-[var(--site-panel)] hover:text-[var(--site-ink)]"
                  >
                    <Icon size={17} stroke={1.65} aria-hidden="true" />
                    <span>{item.title}</span>
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

function DocumentationArticle({ item, index }) {
  const Icon = item.icon
  return (
    <article
      id={item.id}
      className="scroll-mt-24 border-t border-[var(--site-line)] py-7 first:border-t-0 first:pt-0 md:py-9"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--site-green)_10%,var(--site-panel))] text-[var(--site-green)]">
          <Icon size={19} stroke={1.7} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--site-faint)]">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h2 className="mt-1 text-[22px] font-semibold leading-8 text-[var(--site-ink)]">{item.title}</h2>
          <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[var(--site-muted)]">{item.description}</p>
        </div>
      </div>

      <ol className="mt-5 space-y-3 pl-12">
        {item.steps.map((step, stepIndex) => (
          <li key={step} className="grid max-w-3xl grid-cols-[24px_minmax(0,1fr)] gap-2 text-[14px] leading-7 text-[var(--site-muted)]">
            <span className="font-mono text-[11px] text-[var(--site-faint)]">
              {String(stepIndex + 1).padStart(2, '0')}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {item.note ? (
        <p className="ml-12 mt-5 max-w-3xl border-l-2 border-[var(--site-line-strong)] bg-[color-mix(in_srgb,var(--site-panel)_70%,transparent)] px-4 py-3 text-[13px] leading-6 text-[var(--site-muted)]">
          <strong className="mr-2 font-semibold text-[var(--site-ink)]">注意</strong>
          {item.note}
        </p>
      ) : null}

      {item.actions?.length ? (
        <div className="ml-12 mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {item.actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="text-[12px] font-medium text-[var(--site-accent)] no-underline hover:underline"
            >
              {action.label} →
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  )
}

export default function HelpPage() {
  let articleIndex = 0

  return (
    <PageContainer className="py-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
        <Sidebar />

        <div className="min-w-0">
          <header className="border-b border-[var(--site-line)] pb-7 md:pb-9">
            <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--site-green)]">
              <IconRocket size={17} stroke={1.7} aria-hidden="true" />
              使用文档
            </div>
            <h1 className="mt-3 font-serif text-[34px] font-semibold leading-tight text-[var(--site-ink)] md:text-[42px]">
              帮助与文档
            </h1>
            <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[var(--site-muted)]">
              所有常用说明都在当前页展开。左侧目录和章节标题只会在文档内定位；需要实际操作时，再使用每篇末尾的文字入口。
            </p>
            <p className="mt-3 text-[12px] text-[var(--site-faint)]">
              共 {HELP_SECTIONS.reduce((count, section) => count + section.items.length, 0)} 篇 · 最后整理：2026 年 7 月 27 日
            </p>
          </header>

          <div className="mt-2">
            {HELP_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 pt-9 md:pt-11">
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="shrink-0 text-[12px] font-semibold tracking-[0.08em] text-[var(--site-muted)]">
                    {section.title}
                  </h2>
                  <span className="h-px flex-1 bg-[var(--site-line)]" aria-hidden="true" />
                </div>
                <div>
                  {section.items.map((item) => {
                    const currentIndex = articleIndex
                    articleIndex += 1
                    return <DocumentationArticle key={item.id} item={item} index={currentIndex} />
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
