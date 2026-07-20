const DIRECTION_BY_PILLAR = {
  blog: { id: 'direction:blog', title: '个人门户', vision: '个人门户、知识资产与共享内容基础设施。' },
  alliance: { id: 'direction:alliance', title: '博主联盟', vision: '创作者增长、品牌协作与商业闭环。' },
  weekly: { id: 'direction:weekly', title: '前端周刊', vision: '技术趋势、专题内容与学习资源。' },
  agent: { id: 'direction:agent', title: 'AI Agent', vision: '自动化执行、Agent runtime 与智能工作流。' },
}

function timestampFromRange(range) {
  const match = String(range || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : 0
}

export function buildPlanningImportPreview(projects, changelog) {
  const directions = []
  const profiles = []
  const milestones = []
  const events = []
  const directionIds = new Set()

  for (const project of projects) {
    const direction = DIRECTION_BY_PILLAR[project.pillar]
    if (!direction) continue

    if (!directionIds.has(direction.id)) {
      directions.push({ ...direction })
      directionIds.add(direction.id)
    }

    profiles.push({
      id: `profile:${project.id}`,
      projectId: project.id,
      directionId: direction.id,
      summary: project.role || '',
    })

    const next = String(project.next || '').trim()
    if (next) {
      milestones.push({
        id: `milestone:portfolio-next:${project.id}`,
        directionId: direction.id,
        projectId: project.id,
        title: next,
        description: '',
        status: 'planned',
        targetAt: null,
        sourceKey: `portfolio-next:${project.id}`,
      })
    }
  }

  for (const entry of changelog) {
    const sourceKey = `changelog:${entry.version}`
    events.push({
      id: `event:${sourceKey}`,
      entityType: 'project',
      entityId: 'tuaran-home-page',
      eventType: 'note',
      title: entry.title,
      sourceKey,
      occurredAt: timestampFromRange(entry.range),
      details: {
        version: entry.version,
        range: entry.range,
        summary: entry.summary,
        done: entry.done ?? entry.items ?? [],
        planned: entry.planned ?? [],
      },
    })
  }

  return {
    directions,
    profiles,
    milestones,
    events,
    counts: {
      directions: directions.length,
      profiles: profiles.length,
      milestones: milestones.length,
      events: events.length,
    },
  }
}
