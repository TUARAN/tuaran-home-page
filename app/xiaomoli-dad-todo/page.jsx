import DadTodoClient from './DadTodoClient'

export const metadata = {
  title: '小茉莉的爸爸带娃清单',
  description:
    '好习惯，增强动线，让琐碎生活少点折磨。带娃待办与习惯动线清单；支持 GitHub 登录后在日历打卡。',
}

export default function XiaomoliDadTodoPage() {
  return <DadTodoClient />
}
