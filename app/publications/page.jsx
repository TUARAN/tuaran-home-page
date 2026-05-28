import Image from 'next/image'
import Link from 'next/link'

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

export default function PublicationsPage() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-8">
      <section className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0]">
              Publications
            </p>
            <h1 className="home-section-title mb-2">书籍 / 电子册出版计划</h1>
            <p className="mb-0 text-[14px] leading-7 text-[#6b6255] dark:text-gray-300">
              这里展示当前出版进度，也保留你的设计构思图作为阶段版本参考。
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#ddd8cb] bg-white/90 px-4 py-1.5 text-[12px] text-[#5f5a4d] no-underline transition hover:border-[#c8bca6] hover:text-[#2f2920] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300 dark:hover:border-[#3b4656] dark:hover:text-gray-100"
          >
            返回首页
          </Link>
        </div>

        <div className="mb-5 overflow-hidden rounded-2xl border border-[#e6dfd2] bg-white dark:border-[#2a3440] dark:bg-[#111923]">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="bg-[#f5f1e8] text-[#4f4536] dark:bg-[#1a2430] dark:text-gray-200">
                <th className="px-4 py-3 font-semibold">书名 / 专题</th>
                <th className="px-4 py-3 font-semibold">分类</th>
                <th className="px-4 py-3 font-semibold">时间</th>
                <th className="px-4 py-3 font-semibold">状态</th>
              </tr>
            </thead>
            <tbody>
              {publicationItems.map((item) => (
                <tr key={item.title} className="border-t border-[#ece4d7] dark:border-[#2b3542]">
                  <td className="px-4 py-3 text-[#2f2a22] dark:text-gray-100">{item.title}</td>
                  <td className="px-4 py-3 text-[#6b6255] dark:text-gray-300">{item.type}</td>
                  <td className="px-4 py-3 text-[#6b6255] dark:text-gray-300">{item.period}</td>
                  <td className="px-4 py-3 text-[#5a7550] dark:text-[#a7d39b]">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>
    </div>
  )
}
