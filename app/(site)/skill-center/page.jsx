import AgentApplicationCenterExperience from './AgentApplicationCenterExperience'
import { PUBLISHED_SKILLS } from './skills'
import { MCP_CENTER_SERVICES, MCP_SECURITY_ITEMS } from '../agent-centers/mcpServices'
import { PROMPT_CENTER_TEMPLATES } from '../agent-centers/promptTemplates'
import { WORKBUDDY_MARKETPLACE_ARTIFACTS } from '../../../lib/workbuddy/workbuddyMarketplaceArtifacts'

export const dynamic = 'force-static'

export const metadata = {
  title: '智能应用中心',
  description: 'Skill、MCP、Prompt 与 WorkBuddy 能力包的统一入口，按分区浏览与配置。',
  keywords: ['智能应用中心', 'Skill', 'MCP', 'Prompt', 'WorkBuddy', 'AI Agent'],
  alternates: { canonical: '/skill-center' },
}

export default function SkillCenterPage() {
  const skills = PUBLISHED_SKILLS.map((skill) => ({
    id: skill.id,
    name: skill.name,
    title: skill.title,
    category: skill.category,
    status: skill.status,
    desc: skill.desc,
    installable: Boolean(skill.codex),
    outputCount: skill.outputs?.length || 1,
  }))

  return (
    <AgentApplicationCenterExperience
      skills={skills}
      mcpServices={MCP_CENTER_SERVICES}
      prompts={PROMPT_CENTER_TEMPLATES}
      workbuddyArtifacts={WORKBUDDY_MARKETPLACE_ARTIFACTS}
      securityItems={MCP_SECURITY_ITEMS}
    />
  )
}