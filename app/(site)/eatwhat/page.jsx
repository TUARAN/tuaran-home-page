import EatwhatClient from './EatwhatClient'

export const metadata = {
  title: '吃什么',
  description:
    '帮你决定爸爸妈妈这一顿吃什么；小茉莉那边按 1 岁宝宝的口感单独维护一套清单。',
  alternates: {
    canonical: '/eatwhat',
  },
}

export default function EatwhatPage() {
  return <EatwhatClient />
}
