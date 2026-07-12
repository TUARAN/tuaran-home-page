import WorkspaceHub from '../../components/WorkspaceHub'

export default function ProjectWorkspace() {
  return (
    <WorkspaceHub
      title="项目与工程"
      description="用项目组合看方向，用工程工作台推进本站与相关项目的交付。"
      eyebrow="从方向到交付"
      flow={['项目治理', '工程推进', '架构校验']}
      sections={[
        {
          title: '项目治理',
          description: '跨项目判断优先级、路线图与工作区归属。',
          items: [
            { href: '/admin/portfolio', title: '项目总览', description: 'AI 项目台账、整合路线图与 Codex 工作区治理。', icon: 'portfolio' },
          ],
        },
        {
          title: '站点工程',
          description: '本站的研发推进与技术架构放在同一个工程语境中。',
          items: [
            { href: '/admin/site-dev', title: '开发与发布', description: '同步 GitHub / npm、处理 Issue 待办并跟进发布状态。', icon: 'siteDev' },
            { href: '/admin/cloudflare-personal-site-map', title: '站点架构', description: '查看 Cloudflare 架构、public/admin/API 边界与演进方向。', icon: 'database' },
          ],
        },
      ]}
    />
  )
}
