import DadTodoClient from './DadTodoClient'

export const metadata = {
  title: '小茉莉的爸爸带娃清单',
  description:
    '爸爸带娃待办：备餐备菜与日常习惯动线清单，好习惯让琐碎生活少点折磨。',
  robots: { index: true, follow: true },
}

export const dynamic = 'force-static'

export default function XiaomoliDadTodoPage() {
  return <DadTodoClient />
}
