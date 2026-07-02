import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Dad Stack · 一个工程师爸爸的育儿线',
  description:
    '涂阿燃（tuaran）的「Dad Stack」：把 AI、工程和当爸爸这件事放在一起——循证育儿调研、家庭小工具与日常记录，AI × 工程 × 父亲的第一人称内容线。',
  keywords: [
    '涂阿燃',
    'tuaran',
    'Dad Stack',
    '奶爸',
    '父职',
    '循证育儿',
    '一岁半',
    'AI 育儿',
    '家庭工具',
  ],
  alternates: { canonical: '/dad-stack' },
}

// 循证育儿调研：站内已发布、可公开的内容（据实列出，不注水）
const researchPieces = [
  {
    href: '/articles/research/topics/father-parenting-18-month-toddler-evidence-based',
    title: '父亲如何科学育儿一岁半幼儿',
    desc: '发展里程碑、依恋与「发球—回球」、睡眠/活动/屏幕、情绪与发脾气、管教、喂养——把权威机构的共识和我的落地研判分开。',
    tag: '循证调研',
  },
  {
    href: '/articles/research/topics/husband-toddler-meltdown-spouse-stress',
    title: '孩子哭闹、妻子也烦躁时，丈夫怎么办',
    desc: '情绪共调节、亲职倦怠、心理负荷、夫妻冲突外溢、伴侣支持的缓冲效应——丈夫在当场和事后具体能做什么。',
    tag: '循证调研',
  },
]

// 家庭相关的站内工具 / 记录（仅列公开可访问的）
const familyLinks = [
  {
    href: '/eatwhat',
    label: '吃什么',
    desc: '一家人今天吃点什么的小工具，少做一个决定。',
  },
  {
    href: '/diary',
    label: '主编札记',
    desc: '阶段性想法与生活片段，不少是带娃的日常。',
  },
]

const beliefs = [
  '父职研究绝大多数是相关性证据，不是因果保证——这条线给框架与边界，不替任何一个孩子下处方。',
  '能被 AI 一键生成的东西都是 commodity；真正稀缺的是第一人称、带细节、属于这个具体家庭的经验。',
  '工程和家庭不是要平衡的两端，是同一个人的两条主线——这条线就写它们怎么互相影响。',
]

export default function DadStackPage() {
  return (
    <PageContainer className="py-10 md:py-12">
      <header className="mb-10 border-b border-[#dee0db] pb-8 dark:border-gray-800">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#767869] dark:text-[#8e9ab0]">
          Dad Stack · AI × 工程 × 父亲
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-[2rem] font-semibold leading-tight tracking-wide text-[#15140f] dark:text-gray-100 md:text-[2.55rem]">
          一个工程师爸爸的育儿线
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#51514a] dark:text-gray-300">
          我是涂阿燃，一个用代码养家的前端 / AI Agent 工程师，也是一岁半孩子的爸爸。这条线把我「当爸爸」这件事单独拎出来——循证育儿调研、家庭小工具、日常记录都收在这里。它还很早，会慢慢长。
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
            Evidence-Based Parenting
          </p>
          <h2 className="font-serif text-[1.45rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
            循证育儿调研
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-7 text-[#76786c] dark:text-[#7f8aa0]">
            带着「要有科学依据」的要求查文献，把权威机构与同行评议研究整理成爸爸能用的判断框架。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {researchPieces.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-[#dee0db] bg-white p-5 no-underline transition hover:-translate-y-0.5 hover:border-[#c2c4b7] dark:border-[#252d36] dark:bg-[#121821] dark:hover:border-[#33404d]"
            >
              <span className="mb-3 inline-flex rounded-full border border-[#d8d9ce] bg-[#f4f5f1] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#54554d] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#c6ceda]">
                {item.tag}
              </span>
              <h3 className="mb-2 text-[17px] font-semibold leading-snug text-[#15140f] dark:text-gray-100">
                {item.title}
                <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </h3>
              <p className="mb-0 text-[13.5px] leading-7 text-[#51514a] dark:text-gray-300">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
          Tools & Notes
        </p>
        <h2 className="mb-4 font-serif text-[1.35rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
          家庭工具与记录
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {familyLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[#dee0db] bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-[#c2c4b7] dark:border-[#252d36] dark:bg-[#121821] dark:hover:border-[#33404d]"
            >
              <div className="mb-1 text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{item.label} →</div>
              <p className="mb-0 text-[13px] leading-6 text-[#5d5d54] dark:text-[#9aa6b8]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#dee0db] bg-[#f9faf7] p-5 dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
          Why This Line
        </p>
        <h2 className="mb-4 font-serif text-[1.35rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
          为什么单独做这条线
        </h2>
        <ul className="space-y-3">
          {beliefs.map((item) => (
            <li key={item} className="flex gap-2 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b7791f] dark:bg-[#9ba475]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  )
}
