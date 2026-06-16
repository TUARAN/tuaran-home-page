import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const metadata = {
  title: '书籍出版 | tuaran',
  description: '书籍与电子小册出版进展页面。',
}

const publicationItems = [
  { title: '《程序员成长手记》', type: '技术图书', period: '2022-2023', status: '已出版' },
  { title: '《AI Bots 通关指南》', type: '电子小册', period: '2024', status: '已发布' },
  { title: '《5 小时吃透大模型》', type: '技术图书', period: '2024-2025', status: '已交稿 · 出版中' },
  { title: '《智能体实战（扣子 · n8n · Dify）》', type: '联合创作', period: '2025-2026', status: '撰写中' },
  { title: '《Seedance 2.0 电影级 AI 视频创作指南》', type: '联合创作', period: '2026 上半年', status: '已交稿 · 出版中' },
  { title: '《具身智能》', type: '技术图书', period: '2025 立项', status: '立项中' },
]

const coverStyles = {
  程序员成长手记: {
    subtitle: '工程成长与职业进阶',
    accent: 'from-[#3f2f1a] via-[#6c4a23] to-[#b87a2a]',
  },
  'AI Bots 通关指南': {
    subtitle: '从 0 到 1 的智能体实战',
    accent: 'from-[#132331] via-[#1f3d53] to-[#3f6f93]',
  },
}

export default function PublicationsPage() {
  const publishedBooks = publicationItems.filter((item) => item.status.includes('已出版') || item.status.includes('已发布'))
  const placeholderCovers = publishedBooks.map((item) => ({
    title: item.title.replace(/[《》]/g, ''),
    subtitle: coverStyles[item.title.replace(/[《》]/g, '')]?.subtitle || item.type,
    accent: coverStyles[item.title.replace(/[《》]/g, '')]?.accent || 'from-[#2a2f36] via-[#39424d] to-[#566273]',
  }))

  return (
    <PageContainer className="py-8">
      <section className="rounded-[24px] border border-[#dcded6] bg-[#f9faf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#858876] dark:text-[#8e9ab0]">
              Publications
            </p>
            <h1 className="home-section-title mb-2">书籍 / 电子册出版计划</h1>
            <p className="mb-0 text-[14px] leading-7 text-[#5d5d55] dark:text-gray-300">
              这里展示当前出版进度，也保留你的设计构思图作为阶段版本参考。
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#d1d3cb] bg-white/90 px-4 py-1.5 text-[12px] text-[#53554d] no-underline transition hover:border-[#b2b4a6] hover:text-[#252620] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300 dark:hover:border-[#3b4656] dark:hover:text-gray-100"
          >
            返回首页
          </Link>
        </div>

        <div className="mb-5 rounded-2xl border border-[#d9dad2] bg-white p-4 dark:border-[#2a3440] dark:bg-[#111923]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="mb-0 font-mono text-[11px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#9ca5b5]">
              已出版作品封面（占位）
            </p>
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">
              共 {placeholderCovers.length} 本 · 可横向滑动
            </span>
          </div>
          <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
            {placeholderCovers.map((book) => (
              <div
                key={book.title}
                className={`w-[min(56vw,230px)] shrink-0 snap-start rounded-xl border border-[#cbcdc0] bg-gradient-to-br ${book.accent} p-2.5 shadow-[0_10px_24px_rgba(54,45,28,0.22)] dark:border-[#334155]`}
              >
                <div className="flex aspect-[3/4] flex-col justify-between rounded-lg border border-white/18 bg-black/12 p-2.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/75">Book</span>
                  <div>
                    <h3 className="mb-1 font-serif text-[14px] font-semibold leading-[1.35] text-white">{book.title}</h3>
                    <p className="mb-0 text-[10px] leading-4 text-white/85">{book.subtitle}</p>
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.12em] text-white/65">TUARAN</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5 overflow-hidden rounded-2xl border border-[#d9dad2] bg-white dark:border-[#2a3440] dark:bg-[#111923]">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="bg-[#edeee8] text-[#3f4036] dark:bg-[#1a2430] dark:text-gray-200">
                <th className="px-4 py-3 font-semibold">书名 / 资料</th>
                <th className="px-4 py-3 font-semibold">分类</th>
                <th className="px-4 py-3 font-semibold">时间</th>
                <th className="px-4 py-3 font-semibold">状态</th>
              </tr>
            </thead>
            <tbody>
              {publicationItems.map((item) => (
                <tr key={item.title} className="border-t border-[#dedfd7] dark:border-[#2b3542]">
                  <td className="px-4 py-3 text-[#272722] dark:text-gray-100">{item.title}</td>
                  <td className="px-4 py-3 text-[#5d5d55] dark:text-gray-300">{item.type}</td>
                  <td className="px-4 py-3 text-[#5d5d55] dark:text-gray-300">{item.period}</td>
                  <td className="px-4 py-3 text-[#546850] dark:text-[#9fbf9b]">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>
    </PageContainer>
  )
}
