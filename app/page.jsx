import Link from 'next/link'
import Image from 'next/image'
import { articles } from './articles/articlesData'
import SettingsButton from './components/SettingsButton'
import StompPanel from './components/StompPanel'
import ProjectMatrixTabs from './components/ProjectMatrixTabs'
import HomeScrollSnap from './components/HomeScrollSnap'

const posts = [
  {
    date: '',
    title: '博主联盟：开发者博主联盟平台，链接创作与推广',
    href: 'https://blogger-alliance.cn',
    githubHref: 'https://github.com/TUARAN/blogger-alliance',
    showExternalIcon: true,
  },
  {
    date: '',
    title: '前端周刊：每周更新国外论坛的前端热门文章',
    href: 'https://frontendweekly.cn/',
    githubHref: 'https://github.com/TUARAN/frontend-weekly-digest-cn',
    showExternalIcon: true,
  },
]

function wrapTitle(title) {
  if (!title) return ''
  if (title.includes('《') || title.includes('》')) return title
  return `《${title}》`
}

function splitProjectTitle(title) {
  if (typeof title !== 'string') return { name: '', rest: '' }
  const colonIndex = title.indexOf('：')
  if (colonIndex === -1) return { name: title, rest: '' }
  return {
    name: title.slice(0, colonIndex),
    rest: title.slice(colonIndex),
  }
}

export const dynamic = 'force-static'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function getArticleLink(article) {
  return isExternalHref(article?.href) ? article.href : `/articles/${article.slug}`
}

export default function HomePage() {
  const featuredArticles = articles.slice(0, 3)
  const maintainedDomains = [
    {
      name: '🏠 WebHP',
      href: 'https://tuaran.me',
      domains: ['tuaran.me', '2aran.com'],
      category: '个人主页',
      focus: '个人网络日志、项目总览与长期创作内容沉淀。',
      status: '运营中',
    },
    {
      name: '🚀 MatrixLink',
      href: 'https://matrixlink.tech',
      domains: ['matrixlink.tech'],
      category: '公司官网',
      focus: '企业品牌展示与技术服务介绍',
      status: '运营中',
    },
    {
      name: '🤝 Blogger Alliance',
      href: 'https://blogger-alliance.cn',
      domains: ['blogger-alliance.cn', 'bzlm.net'],
      category: '社区平台',
      focus: '技术博主协作与内容联盟',
      status: '运营中',
    },
    {
      name: '🧭 Frontend Weekly',
      href: 'https://frontendweekly.cn',
      domains: ['frontendweekly.cn', 'qdzk.site'],
      category: '内容周刊',
      focus: '前端热点整理与海外文章翻译',
      status: '持续更新',
    },
    {
      name: '🤖 I Am Vibe Coder',
      href: 'https://iamvibecoder.cn',
      domains: ['iamvibecoder.cn'],
      category: 'AI 编程',
      focus: 'AI 编程实践与开发者实验场',
      status: '打磨中',
    },
    {
      name: '🧠 Open Claude Code',
      href: 'https://openclaudecode.site/',
      domains: ['openclaudecode.site'],
      category: '学习站',
      focus: '系统拆解 Claude Code 的 Agent 循环、工具系统与多智能体协作。',
      status: '运营中',
    },
    {
      name: '✍️ PublishLab',
      href: 'https://publishlab.cc',
      domains: ['publishlab.cc'],
      category: '创作实验室',
      focus: 'AI 写作、内容创作与数字出版',
      status: '打磨中',
    },
    {
      name: '⚡ Frontend 2 AI Agent',
      href: 'https://frontend2aiagent.com',
      domains: ['frontend2aiagent.com'],
      category: '转型平台',
      focus: '前端转向 AI Agent 工程的知识路径。',
      status: '打磨中',
    },
  ]
  const domainStrategyParagraphs = [
    '每个域名都对应一个清晰场景，是内容、流量与业务沉淀的长期入口。',
  ]
  const opcVibeProjects = [
    {
      name: 'Claude Code Unpacked',
      href: 'https://ccunpacked-zh.pages.dev/',
      category: 'AI Agent',
      focus: '用交互式页面和动画拆解 Claude Code 的 agent loop、工具系统与多 Agent 编排。',
      stack: 'Agent Loop · Visualization',
    },
    {
      name: 'webllm',
      href: 'https://83945df5.webllm-8rp.pages.dev',
      category: '实验项目',
      focus: '基于 WebGPU 的浏览器侧大模型实验。',
      stack: 'WebGPU · Browser LLM',
    },
    {
      name: '安东尼学AI',
      href: 'https://matrix-ai-pdfs.pages.dev/',
      category: '学习工具',
      focus: 'AI 学习资料整理与阅读入口，面向系统化学习与持续积累。',
      stack: 'AI Learning',
    },
    {
      name: 'banana-gallery',
      href: 'https://banana-gallery.pages.dev/',
      category: '创意工具',
      focus: '轻量化的图片与内容展示实验，用于验证视觉内容产品的交互形态。',
      stack: 'Gallery · Visual',
    },
    {
      name: '提示词工程',
      href: 'https://awesome-prompt-seven.vercel.app/',
      category: '效率工具',
      focus: '围绕提示词整理、沉淀与复用的轻量产品实验。',
      stack: 'Prompt · Workflow',
    },
    {
      name: '代码矿工',
      href: 'https://toolkit-hub.pages.dev/',
      category: '开发工具',
      focus: '面向开发者的工具集合与能力聚合入口。',
      stack: 'Dev Tools',
    },
  ]
  const identityGroups = [
    {
      label: '职业',
      tone: 'blue',
      items: ['程序员', '项目经理'],
    },
    {
      label: '创作',
      tone: 'purple',
      items: ['技术博主', '出版作者'],
    },
    {
      label: '家庭',
      tone: 'amber',
      items: ['茉莉奶爸'],
    },
    {
      label: '创业',
      tone: 'emerald',
      items: [{ label: '广州矩联科技创始人', href: 'https://matrixlink.tech/' }],
    },
  ]

  const identityItems = identityGroups.flatMap((group) =>
    group.items.map((item) => ({
      key: `${group.label}-${typeof item === 'string' ? item : item.label}`,
      label: typeof item === 'string' ? item : item.label,
      href: typeof item === 'string' ? undefined : item.href,
      tone: group.tone,
    }))
  )

  const getIdentityTagClassName = (tone) => {
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium'
    switch (tone) {
      case 'blue':
        return `${base} border-blue-200/70 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200`
      case 'purple':
        return `${base} border-purple-200/70 bg-purple-50/80 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200`
      case 'amber':
        return `${base} border-amber-200/70 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200`
      case 'emerald':
        return `${base} border-emerald-200/70 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200`
      default:
        return `${base} border-gray-200/70 bg-white/80 text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-200`
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <HomeScrollSnap />

      <section className="lg:min-h-[calc(100vh-72px)] lg:snap-start lg:flex lg:flex-col lg:justify-start">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#eee] dark:border-gray-800 pb-2 mb-8">