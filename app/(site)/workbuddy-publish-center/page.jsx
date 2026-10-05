import AgentCenterHero from '../components/AgentCenterHero'
import PageContainer from '../components/PageContainer'
import { WORKBUDDY_MARKETPLACE_ARTIFACTS } from '../../../lib/workbuddyMarketplaceArtifacts'
import WorkBuddyCatalog from './WorkBuddyCatalog'

export const dynamic = 'force-static'

export const metadata = {
  title: 'WorkBuddy 能力包',
  description: '下载适用于 WorkBuddy 的 Skill 与 MCP 能力包，并查看各包的用途、来源和适用状态。',
  keywords: ['WorkBuddy', 'Skill', 'MCP', '能力包', '下载'],
  alternates: { canonical: '/workbuddy-publish-center' },
}

export default function WorkBuddyPublishCenterPage() {
  return (
    <PageContainer className="py-6 md:py-10">
      <AgentCenterHero
        current="/workbuddy-publish-center"
        eyebrow="WorkBuddy · 能力包"
        title="把需要的能力，装进 WorkBuddy"
        description="浏览可下载的 Skill 与 MCP 能力包。先看用途和适用状态，再进入来源页面了解详情或下载 ZIP。"
        shareText="WorkBuddy Skill 与 MCP 能力包。"
        count={WORKBUDDY_MARKETPLACE_ARTIFACTS.length}
        countLabel="个能力包"
        actionLabel="浏览能力包"
        steps={['按 Skill 或 MCP 筛选', '查看来源与适用状态', '下载 ZIP 并在本地验证']}
      />
      <WorkBuddyCatalog artifacts={WORKBUDDY_MARKETPLACE_ARTIFACTS} />
    </PageContainer>
  )
}
