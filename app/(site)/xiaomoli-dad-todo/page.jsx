import DadTodoClient from './DadTodoClient'

export const metadata = {
  title: '小茉莉的爸爸带娃清单',
  description:
    '好习惯，增强动线，让琐碎生活少点折磨。登录后按日勾选同一套清单，数据存服务器。',
  alternates: {
    canonical: '/xiaomoli-dad-todo',
  },
}

export default function XiaomoliDadTodoPage() {
  return <DadTodoClient />
}
