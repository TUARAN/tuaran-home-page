import SkillCenterExperience from './SkillCenterExperience'
import { PUBLISHED_SKILLS } from './skills'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Skill 中心',
  description: '发现、了解并安装可复用的智能体任务能力与工作流。',
  keywords: ['涂阿燃', 'tuaran', 'Skill', 'AI Agent', '智能体', '工作流'],
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

  return <SkillCenterExperience skills={skills} />
}
