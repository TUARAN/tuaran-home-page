import Link from 'next/link'

import ContentPvBeacon from '../../components/ContentPvBeacon'

export const dynamic = 'force-static'

const chapters = [
  { title: '第一章 · 作者介绍与购买须知', sections: ['作者介绍、小册介绍与购买须知'] },
  { title: '第二章 · 边缘智能体的全景', sections: ['为什么 2026 年 Agent 必须跑在边缘', '边缘运行时全景：Workers / Edge Functions / Durable Objects', 'Agent vs Workflow：本质区别与选择'] },
  { title: '第三章 · 5 分钟跑通第一个 Edge Agent', sections: ['Hello, Edge Agent — Workers AI 起手式', 'Agent 主循环：Perception → Plan → Action → Observe', '在边缘上做 Tool Use（函数调用）'] },
  { title: '第四章 · 状态、记忆与检索', sections: ['Durable Objects：每个会话一个小宇宙', 'KV / D1 / R2 在 Agent 里的角色分工', 'Vectorize 实战：RAG on the Edge'] },
  { title: '第五章 · 工程化与产品化', sections: ['流式响应：SSE 与 WebSocket 在 Workers', '多 Agent 协作：Workflows + 队列', '鉴权、计费、限流：把 Agent 包装成 SaaS', '可观测性、灰度与回滚'] },
  { title: '第六章 · 真实案例与下一步', sections: ['5 个真实案例拆解', '成本对比、风险与下一步学习路径'] },
]

const outcomes = [
  '判断 Workflow、Agent 与边缘运行时的适用边界',
  '用 Workers 与 Workers AI 搭建可流式扩展的 Agent',
  '组合 Durable Objects、Vectorize、D1 与 R2 状态层',
  '补齐鉴权、计费、限流、灰度和可观测性',
]

export const metadata = {
  title: '边缘智能体开发实战｜课程目录',
  description: '从 Agent 原型到 Cloudflare 边缘 SaaS 的 16 节工程化学习路线与课程目录。',
  keywords: ['AI Agent', 'Cloudflare Workers', 'Durable Objects', '边缘计算', '课程'],
  alternates: { canonical: '/resources/edge-agent-development' },
}

export default function EdgeAgentDevelopmentPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-9 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link href="/articles?tab=resources" className="hover:underline">资源库</Link><span>·</span><span>开发课程</span><span>·</span><ContentPvBeacon category="resource" slug="edge-agent-development" display /></div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Edge × Agent · 16 lessons</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">边缘智能体开发实战</h1>
        <p className="mt-3 text-lg text-slate-500 dark:text-slate-400">从 0 到 1 把 AI Agent 跑在 Cloudflare Workers 上</p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">面向已经会写 Web 应用、正在把大模型能力接进真实产品的开发者。重点不是模型训练或 Prompt 合集，而是状态、工具、流式响应、计费、限流、日志和成本控制。</p>
        <div className="mt-6 flex flex-wrap gap-3"><a href="https://github.com/TUARAN/publishlab" target="_blank" rel="noreferrer" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">查看课程源项目 ↗</a><span className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-500 dark:border-slate-700">约 276 分钟 · 6 章 16 节</span></div>
      </header>

      <section className="grid gap-4 py-8 sm:grid-cols-2">{outcomes.map((item, index) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"><span className="font-mono text-xs text-blue-600 dark:text-blue-400">0{index + 1}</span><p className="mt-2 text-sm leading-6">{item}</p></div>)}</section>

      <section className="pb-10"><h2 className="mb-5 text-2xl font-semibold">课程目录</h2><div className="space-y-4">{chapters.map((chapter) => <article key={chapter.title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><h3 className="font-semibold">{chapter.title}</h3><ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">{chapter.sections.map((section, index) => <li key={section} className="flex gap-3"><span className="font-mono text-xs text-slate-400">{String(index + 1).padStart(2, '0')}</span><span>{section}</span></li>)}</ol></article>)}</div></section>

      <aside className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><strong>内容说明：</strong>本站迁移的是公开课程目录和学习路线，不复制 PublishLab 小册正文。完整内容、代码和后续更新以原发布渠道及 GitHub 源项目为准。</aside>
    </main>
  )
}
