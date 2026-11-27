import SkillCenterExperience from '../skill-center/SkillCenterExperience'
import { PUBLISHED_SKILLS } from '../skill-center/skills'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Agent 能力集',
  description: '发现、了解并安装可复用的智能体 Skill 与工作流。',
  keywords: ['Agent 能力集', 'Skill', 'AI Agent', '智能体', '工作流'],
  alternates: { canonical: '/capabilities' },
}

export default function CapabilitiesPage() {
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
    <SkillCenterExperience
      skills={skills}
      homeHref="/capabilities"
      brandLabel="Agent 能力集"
      hubHref="/skill-center"
      promoEyebrow="Agent Capabilities"
      promoText="浏览可安装的 Skill；MCP、Prompt 与 WorkBuddy 见智能体应用中心。"
      promoLinkHref="/skill-center#mcp"
      promoLinkLabel="智能体应用中心"
    />
  )
}