import DadTodoClient from './DadTodoClient'

export const metadata = {
  title: '小茉莉的爸爸带娃清单',
  description:
    '好习惯，增强动线，让琐碎生活少点折磨。GitHub 登录后待办勾选与习惯打卡均写入服务器。',
}

export default function XiaomoliDadTodoPage() {
  return <DadTodoClient />
}
