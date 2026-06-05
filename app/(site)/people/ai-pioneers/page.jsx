import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export const metadata = {
  title: '人工智能先驱 · 人物调研',
  description:
    '涂阿燃（tuaran）的人物调研：深度学习先驱群像 —— 李飞飞、杨立昆、本吉奥、辛顿、苏茨克维、克里泽夫斯基。',
  keywords: ['涂阿燃', 'tuaran', '人工智能', '人物调研', '深度学习', '辛顿', '李飞飞'],
  alternates: {
    canonical: '/people/ai-pioneers',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AiPioneersPage() {
  redirect('/articles/research/people/ai-pioneers')
}
