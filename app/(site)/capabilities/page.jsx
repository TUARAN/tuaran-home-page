import SkillCenterExperience from '../skill-center/SkillCenterExperience'
import { PUBLISHED_SKILLS } from '../skill-center/skills'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Skill 目录',
  description: '发现、了解并安装可复用的智能体 Skill 与工作流。',
  keywords: ['Skill 目录', 'Skill', 'AI Agent', '智能体', '工作流'],
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

  return <SkillCenterExperience skills={skills} hubHref="/skill-center" />
}