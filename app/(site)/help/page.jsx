import Link from 'next/link'
import {
  IconBook2, IconCoin, IconEdit, IconFileText, IconHistory, IconHome,
  IconLoader2, IconMail, IconMap2, IconMessageCircle, IconPalette, IconRocket,
  IconShieldLock, IconUserCircle,
} from '@tabler/icons-react'

import { LoadingDots, LoadingSpinner, Skeleton } from '../../components/loading/LoadingPrimitives'
import { SITE_CHANNELS, isItemVisibleForAccount } from '../../../lib/siteNav'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '站点帮助',
  description: '2aran.com 统一站点指南：了解本站、查找内容、管理账号、参与讨论，并查看内容、隐私和联系说明。',
  alternates: { canonical: '/help' },
}

const SITE_MAP_GROUPS = SITE_CHANNELS.map((channel) => ({
  title: channel.label,
  links: channel.sections.flatMap((section) => section.items
    .filter((item) => isItemVisibleForAccount(item, null, null))
    .map((item) => ({ href: item.href, label: item.label, description: item.desc, external: item.external }))),
}))

const HELP_SECTIONS = [
  {
    id: 'getting-started', title: '了解本站', items: [
      {
        id: 'about-site', title: '关于本站', description: '2aran.com 是涂阿燃维护的前端与 AI 工程个人站。', icon: IconHome,
        steps: [
          '站点集中呈现原创文章、专题分析、真实项目复盘、工程实践、交互作品和整理后的资料。',
          '内容由涂阿燃选题、核验并承担最终责任；搜索、代码和大模型工具用于整理、校对和辅助表达。',
          '公开内容可以直接阅读。登录用于跨设备保存燃币、资源权益、评论归属和客户端授权记录。',
          '讨论围绕具体内容展开，不开放自由发帖；读者可以补充事实、指出错误和交流实践。',
          '引用时请保留作者、标题和原始链接；第三方数据、图片和代码仍需遵守原始来源的许可。',
        ],
        actions: [{ href: '/articles', label: '进入知识库' }, { href: '/about', label: '了解站长' }],
      },
      {
        id: 'browse-content', title: '浏览内容', description: '从统一内容目录进入，再按主题、对象或内容类型缩小范围。', icon: IconBook2,
        steps: [
          '首页“从这里开始”提供学习 AI、了解公司、查看工程实践、寻找资料和订阅动态等常用路径。',
          '内容目录包含文章、分析、实践和资源；搜索会匹配标题、摘要、主题和对象。',
          '筛选与关键词会写入网址，复制链接即可保留当前结果；长文可以使用页内目录跳转。',
        ],
        note: '找不到内容时，先清空细分类，再使用更短的关键词搜索。',
        actions: [{ href: '/articles', label: '打开内容目录' }, { href: '#site-map', label: '查看全站导航' }],
      },
    ],
  },
  {
    id: 'usage', title: '使用帮助', items: [
      {
        id: 'account', title: '登录与账号', description: '登录、连接凭据，并查看燃币、资源权益和客户端授权。', icon: IconUserCircle,
        steps: [
          '登录后进入个人资料，可查看平台 ID、当前燃币、已解锁资源和领取记录。',
          '“连接账号”用于给同一个站内账号添加 GitHub、Google 等凭据；至少会保留一种登录方式。',
          '添加第三方登录不会根据昵称或邮箱自动合并两个已有账号，以免混淆真实用户的数据。',
          '登录前产生的游客评论、燃币和已付费解锁会在登录时归入当前账号。',
          '“授权管理”用于查看和撤销已获得本站 MCP 权限的客户端，不影响普通网页登录。',
        ],
        actions: [{ href: '/login?returnTo=/account', label: '登录' }, { href: '/account', label: '打开个人资料' }],
      },
      {
        id: 'comments', title: '评论与讨论', description: '在具体内容下留言、回复，并在讨论中心跟进站内交流。', icon: IconMessageCircle,
        steps: [
          '文章、调研和部分资源页底部提供讨论区；可以直接留言或回复某一条评论。',
          '游客可以评论；登录后，当前浏览器中的游客历史评论会绑定到登录账号。',
          '登录用户可从账号菜单、讨论中心或通知中心查看回复，并跳回具体评论位置。',
          '有效评论会按当前规则获得燃币；重复、垃圾或被删除的评论不计入奖励。',
        ],
        note: '账号、隐私、付款和需要公开材料以外信息的问题，请使用邮件联系。',
        actions: [{ href: '/community', label: '打开讨论中心' }, { href: '/notifications', label: '打开通知中心' }],
      },
      {
        id: 'ranbi', title: '燃币与资源权益', description: '理解燃币的获取、使用、记录方式，以及它与资源权益的关系。', icon: IconCoin,
        steps: [
          '燃币是本站的资源权益和参与记录，不可提现，也没有自动充值入口。',
          '游客首次访问会有试用额度；登录账号可通过注册、签到、有效评论、活动或站长调整获得燃币。',
          '内容型资源可能在打开时自动解锁；工具包和安装包只在点击领取时结算。',
          '同一资源解锁一次后永久有效，刷新或再次打开不会重复使用燃币。',
          '完整数值以燃币页的实时规则为准；个人资料会显示余额、权益和领取记录。',
        ],
        actions: [{ href: '/ranbi', label: '查看实时规则' }, { href: '/articles?tab=resources', label: '浏览资源' }, { href: '/account', label: '查看我的权益' }],
      },
      {
        id: 'resources', title: '领取与故障排查', description: '处理资源领取、余额不足、下载失效和浏览器设置问题。', icon: IconFileText,
        steps: [
          '余额不足时先登录并签到，或通过有效评论、活动和联系站长补充；不要重复刷新领取按钮。',
          '下载链接失效、文件损坏或解锁后仍打不开时，请记录资源标题、页面网址和报错截图。',
          '语言和主题保存在当前浏览器；换设备、无痕窗口或清除数据后需要重新设置。',
          '界面设置没有生效时，先刷新页面，再检查浏览器是否阻止 Cookie 或本地存储。',
        ],
        note: '外部收藏会跳到第三方网站，其可用性和隐私规则由对应服务决定。',
        actions: [{ href: '#contact', label: '反馈问题' }],
      },
    ],
  },
  {
    id: 'design', title: '界面与设计', items: [
      {
        id: 'design-language', title: '站点设计语言', description: '了解全站共同使用的页面壳、颜色、排版、组件与可访问性原则。', icon: IconPalette,
        steps: [
          '主站以内容阅读为中心，使用统一导航、页脚、纸张感背景和 1120px 内容宽度；后台使用独立的数据密集型页面壳。',
          '颜色按正文、辅助文字、边界、表面和强调等语义令牌使用，深色模式保持相同信息层级，不在页面里重复发明近似颜色。',
          '长文与编辑性标题使用衬线气质，控件和数据使用清晰的无衬线排版，编号与短标签可使用等宽字体。',
          '列表、卡片、空状态、错误状态和等待状态复用共享组件；新增页面先沿用现有结构，再判断是否需要扩展设计系统。',
          '所有交互都要支持键盘操作、清晰焦点、状态文案和减少动态偏好，不能只靠颜色或动画传达结果。',
        ],
        note: '界面设计服务于阅读、查找和操作。专题页可以有独立气质，但导航、状态反馈和可访问性规则保持一致。',
      },
      {
        id: 'loading-motion', title: '加载与等待反馈', description: '页面、区块、内联与按钮使用同一套克制的加载语言。', icon: IconLoader2,
        steps: [
          '页面切换使用接近最终结构的流体骨架，先稳定布局，再显示真实内容。',
          '图表、列表和鉴权等独立区块使用平滑圆环与具体文案，让等待对象保持明确。',
          '加载更多和窄区域使用三点节奏；提交、保存和刷新按钮使用小圆环并暂时禁用重复操作。',
          '可获得真实进度时直接显示进度条；未知进度才使用循环动效。',
          '减少动态模式下停止循环，屏幕阅读器仍能获得正在执行的任务名称。',
        ],
        demo: 'loading',
        note: '动效参考 Amicro 的开源组件语言，并按本站色彩、性能与无障碍要求重新实现；站点不加载额外 Motion 运行时。',
      },
    ],
  },
  {
    id: 'policies', title: '规则说明', items: [
      {
        id: 'editorial', title: '内容说明', description: '作者责任、工具使用、来源、安全边界和修订规则统一以此处为准。', icon: IconEdit,
        steps: [
          '署名为 TUARAN 或涂阿燃的内容，由作者提出问题、选择材料、组织结构、形成判断并最终确认；辅助工具不作为共同作者。',
          '观点、分析、实践、指南、事实核验和资料整理会使用符合实际工作的标签，不把所有长文统称为研究。',
          '搜索、转录、代码、数据处理和大模型工具可用于查找线索、整理材料、列出待核查点和文字校对。',
          '可核验的日期、价格、政策、版本和数字优先引用官方资料或一手来源；推断和未确认信息会明确标注。',
          '健康、金融、法律和未成年人相关内容只作信息参考，不替代诊断、持牌投资建议或正式法律意见。',
          '发现事实错误、失效链接或重要遗漏后会直接修订；影响主要结论的改动会保留修订说明。',
        ],
        note: '提交更正时，请附页面网址、具体段落、可核验来源和建议修改方式。',
        actions: [{ href: '#contact', label: '提交更正' }],
      },
      {
        id: 'privacy', title: '隐私政策', description: '本政策适用于 2aran.com，最后更新于 2026 年 8 月 24 日。', icon: IconShieldLock,
        steps: [
          '服务器和统计服务可能记录访问时间、页面路径、浏览器、设备、来源页面和近似地区，用于统计、故障排查、安全和内容改进。',
          '登录、评论、订阅或领取资源时，本站会保存你主动提交的信息，以及登录提供方标识、燃币和资源权益记录。',
          'Cookie 与本地存储用于保存登录状态、游客身份、语言、主题和阅读偏好；限制它们可能影响相关功能。',
          'GitHub、Google、微信、Cloudflare、Resend、Umami 和广告服务会按各自政策处理完成服务所需的数据。',
          '本站不会出售个人信息，也不会主动把评论、邮箱或登录信息提供给无关第三方。',
          '你可以不登录、不评论或不订阅，也可以请求查询、修改或删除评论、账号关联、订阅及其他个人数据。',
        ],
        actions: [
          { href: 'https://adssettings.google.com/', label: 'Google 广告设置', external: true },
          { href: 'https://policies.google.com/technologies/partner-sites?hl=zh-CN', label: 'Google 合作伙伴数据说明', external: true },
          { href: '#contact', label: '提出数据请求' },
        ],
      },
    ],
  },
  {
    id: 'reference', title: '导航与联系', items: [
      {
        id: 'site-map', title: '全站导航', description: '按频道列出当前公开页面；低频入口收在折叠分组里，不再维护另一张站点地图。', icon: IconMap2,
        steps: [
          '顶部主导航只保留常用频道；这里同时列出主入口和公开的补充入口。',
          '需要登录或仅站长可见的页面不会出现在公开列表中。',
          '如果记得页面名称，可以展开对应频道后使用浏览器页内查找。',
        ],
        linkGroups: SITE_MAP_GROUPS,
      },
      {
        id: 'changelog', title: '更新记录', description: '查看已经交付的功能和内容建设。', icon: IconHistory,
        steps: ['更新记录按周整理，也可以切换到月度、季度和年度；同一周期内的多次更新会自动合并。', '“已做”代表已经进入代码或内容库；“计划”只表示后续方向。'],
        actions: [{ href: '/changelog', label: '查看更新记录' }],
      },
      {
        id: 'contact', title: '联系方式', description: '按问题类型选择评论、邮件、微信或 GitHub。', icon: IconMail,
        steps: [
          '具体文章或资源的公开补充，可以直接留在对应页面评论区。',
          '账号、隐私、数据删除和正式合作请发邮件至 tuaran666@gmail.com，便于确认身份并保留处理记录。',
          '资源领取、燃币调整和轻量交流可添加微信 atar24；开源代码问题可前往 github.com/TUARAN。',
          '反馈故障时请附页面网址、发生时间、浏览器或设备、操作步骤和截图；不要发送密码或登录 Cookie。',
        ],
        note: '描述“期望发生什么”和“实际发生什么”，通常能最快定位问题。',
        actions: [
          { href: 'mailto:tuaran666@gmail.com', label: '发送邮件', external: true },
          { href: 'https://github.com/TUARAN', label: '打开 GitHub', external: true },
          { href: '/services', label: '查看合作说明' },
        ],
      },
    ],
  },
]

function Sidebar() {
  return <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
    <nav aria-label="站点帮助目录" className="flex gap-3 overflow-x-auto border-b border-[var(--site-line)] pb-4 lg:block lg:max-h-[calc(100vh-var(--site-header-height)-3rem)] lg:space-y-6 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-4 lg:pr-6">
      {HELP_SECTIONS.map((section) => <div key={section.id} className="min-w-[190px] lg:min-w-0">
        <a href={`#${section.id}`} className="mb-2 block px-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--site-faint)] no-underline hover:text-[var(--site-ink)]">{section.title}</a>
        <div className="space-y-0.5">{section.items.map((item) => {
          const Icon = item.icon
          return <a key={item.id} href={`#${item.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[var(--site-muted)] no-underline transition hover:bg-[var(--site-panel)] hover:text-[var(--site-ink)]">
            <Icon size={17} stroke={1.65} aria-hidden="true" /><span>{item.title}</span>
          </a>
        })}</div>
      </div>)}
    </nav>
  </aside>
}

function DocumentationArticle({ item, index }) {
  const Icon = item.icon
  return <article id={item.id} className="scroll-mt-24 border-t border-[var(--site-line)] py-7 first:border-t-0 first:pt-0 md:py-9">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--site-green)_10%,var(--site-panel))] text-[var(--site-green)]"><Icon size={19} stroke={1.7} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</p>
        <h2 className="mt-1 text-[22px] font-semibold leading-8 text-[var(--site-ink)]">{item.title}</h2>
        <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[var(--site-muted)]">{item.description}</p>
      </div>
    </div>

    <ol className="mt-5 space-y-3 pl-12">{item.steps.map((step, stepIndex) => <li key={step} className="grid max-w-3xl grid-cols-[24px_minmax(0,1fr)] gap-2 text-[14px] leading-7 text-[var(--site-muted)]">
      <span className="font-mono text-[11px] text-[var(--site-faint)]">{String(stepIndex + 1).padStart(2, '0')}</span><span>{step}</span>
    </li>)}</ol>

    {item.note ? <p className="ml-12 mt-5 max-w-3xl border-l-2 border-[var(--site-line-strong)] bg-[color-mix(in_srgb,var(--site-panel)_70%,transparent)] px-4 py-3 text-[13px] leading-6 text-[var(--site-muted)]"><strong className="mr-2 font-semibold text-[var(--site-ink)]">注意</strong>{item.note}</p> : null}

    {item.demo === 'loading' ? <div className="ml-12 mt-5 grid max-w-3xl gap-3 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 sm:grid-cols-3">
      <div className="rounded-lg border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
        <p className="mb-4 text-[11px] font-medium text-[var(--site-faint)]">结构骨架</p>
        <div className="space-y-2" aria-label="骨架动效示例">
          <Skeleton className="h-4 w-3/5 rounded-full" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
        </div>
      </div>
      <div className="flex min-h-28 flex-col rounded-lg border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
        <p className="mb-4 text-[11px] font-medium text-[var(--site-faint)]">区块等待</p>
        <div className="flex flex-1 items-center gap-2 text-[13px] text-[var(--site-muted)]"><LoadingSpinner label="正在加载示例" />正在加载</div>
      </div>
      <div className="flex min-h-28 flex-col rounded-lg border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
        <p className="mb-4 text-[11px] font-medium text-[var(--site-faint)]">内联等待</p>
        <div className="flex flex-1 items-center text-[var(--site-accent)]"><LoadingDots label="正在加载更多示例" /></div>
      </div>
    </div> : null}

    {item.linkGroups?.length ? <div className="ml-12 mt-6 grid gap-3 sm:grid-cols-2">{item.linkGroups.map((group) => <details key={group.title} className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3 open:sm:col-span-2">
      <summary className="cursor-pointer text-[14px] font-semibold text-[var(--site-ink)]">{group.title}<span className="ml-2 text-[11px] font-normal text-[var(--site-faint)]">{group.links.length} 个入口</span></summary>
      <div className="mt-3 grid gap-x-5 gap-y-3 border-t border-[var(--site-line)] pt-3 sm:grid-cols-2">{group.links.map((link) => <Link key={`${group.title}-${link.href}`} href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noreferrer' : undefined} className="min-w-0 text-[13px] no-underline hover:text-[var(--site-accent)]">
        <span className="font-medium text-[var(--site-ink)]">{link.label}{link.external ? ' ↗' : ''}</span>{link.description ? <span className="mt-0.5 block text-[11px] leading-5 text-[var(--site-muted)]">{link.description}</span> : null}
      </Link>)}</div>
    </details>)}</div> : null}

    {item.actions?.length ? <div className="ml-12 mt-5 flex flex-wrap gap-x-5 gap-y-2">{item.actions.map((action) => <Link key={action.href} href={action.href} target={action.external ? '_blank' : undefined} rel={action.external ? 'noreferrer' : undefined} className="text-[12px] font-medium text-[var(--site-accent)] no-underline hover:underline">{action.label} {action.external ? '↗' : '→'}</Link>)}</div> : null}
  </article>
}

export default function HelpPage() {
  let articleIndex = 0
  const articleCount = HELP_SECTIONS.reduce((count, section) => count + section.items.length, 0)
  return <PageContainer className="py-8 md:py-12">
    <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
      <Sidebar />
      <div className="min-w-0">
        <header className="border-b border-[var(--site-line)] pb-7 md:pb-9">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--site-green)]"><IconRocket size={17} stroke={1.7} aria-hidden="true" />站点指南</div>
          <h1 className="mt-3 font-serif text-[34px] font-semibold leading-tight text-[var(--site-ink)] md:text-[42px]">站点帮助</h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[var(--site-muted)]">关于本站、使用方法、全站导航、内容规则、隐私政策和联系方式集中在当前页。使用左侧目录直接定位，不需要在多份相似说明之间来回查找。</p>
          <p className="mt-3 text-[12px] text-[var(--site-faint)]">共 {articleCount} 个主题 · 最后整理：2026 年 8 月 27 日</p>
        </header>
        <div className="mt-2">{HELP_SECTIONS.map((section) => <section key={section.id} id={section.id} className="scroll-mt-24 pt-9 md:pt-11">
          <div className="mb-5 flex items-center gap-3"><h2 className="shrink-0 text-[12px] font-semibold tracking-[0.08em] text-[var(--site-muted)]">{section.title}</h2><span className="h-px flex-1 bg-[var(--site-line)]" aria-hidden="true" /></div>
          <div>{section.items.map((item) => {
            const currentIndex = articleIndex
            articleIndex += 1
            return <DocumentationArticle key={item.id} item={item} index={currentIndex} />
          })}</div>
        </section>)}</div>
      </div>
    </div>
  </PageContainer>
}
