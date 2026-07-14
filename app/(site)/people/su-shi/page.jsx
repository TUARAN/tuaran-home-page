import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export const metadata = {
  title: '苏轼 · 人物',
  description: '涂阿燃（tuaran）的人物文章：以时间线梳理苏轼的仕途、流放、心境与作品。',
  keywords: ['涂阿燃', 'tuaran', '苏轼', '苏东坡', '人物', '宋代'],
  alternates: {
    canonical: '/people/su-shi',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SuShiPage() {
  redirect('/articles/research/people/su-shi')
}
