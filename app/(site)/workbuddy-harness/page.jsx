import WorkBuddyHarnessClient from './WorkBuddyHarnessClient'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/workbuddy-harness'

export const metadata = {
  title: 'WorkBuddy Harness：给 AI Agent 补上一套“运行制度”',
  description:
    '从技术博主视角拆解 WorkBuddy Harness：九维 Agent 基础设施、HookRunner、记忆、安全、评测与多 Agent 编排，以及它真正解决的问题和当前边界。',
  keywords: ['WorkBuddy Harness', 'AI Agent', 'Harness Engineering', 'Hook Runner', 'Agent 评测', '多 Agent'],
  alternates: { canonical: '/workbuddy-harness' },
  openGraph: {
    type: 'article',
    siteName: '2aran.com',
    title: 'WorkBuddy Harness：给 AI Agent 补上一套“运行制度”',
    description: '模型负责思考，Harness 负责让它有记忆、守规矩、能协作、可评测。',
    url: PAGE_URL,
    publishedTime: '2026-07-16T00:00:00.000Z',
    authors: ['涂阿燃 / Tuaran'],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WorkBuddy Harness：给 AI Agent 补上一套“运行制度”',
    description: '九维基础设施、运行引擎、评测闭环与工程边界，一页讲清。',
  },
}

export default function WorkBuddyHarnessPage() {
  return <WorkBuddyHarnessClient />
}
