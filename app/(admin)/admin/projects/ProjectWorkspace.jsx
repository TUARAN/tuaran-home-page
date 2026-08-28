import WorkspaceHub from '../../components/WorkspaceHub'

export default function ProjectWorkspace() {
  return (
    <WorkspaceHub
      title="项目与工程"
      description="由规划中心统筹项目全局，再由工程工作台推进开发、发布与架构沉淀。"
      eyebrow="从方向到沉淀"
      flow={['全局规划', 'AI 参与拆解', '工程推进', '资产沉淀']}
      sections={[
        {
          title: '项目治理',
          description: '从规划中心判断跨项目优先级、路线图与工作区归属。',
          items: [
            { href: '/admin/planning', title: '规划中心', description: '按执行状态筛选项目事项，并在同一页面使用 AI 规划与 Agent 分派。', icon: 'planning' },
            { href: '/admin/portfolio', title: '项目总览', description: 'AI 项目台账、整合路线图与 Codex 工作区治理。', icon: 'portfolio' },
          ],
        },
        {
          title: '站点工程',
          description: '本站的研发推进与技术架构放在同一个工程语境中。',
          items: [
            { href: '/admin/site-dev', title: '开发发布', description: '同步 GitHub / npm、处理 Issue 待办并跟进发布状态。', icon: 'siteDev' },
            { href: '/admin/subsites', title: '二级站管理', description: '维护子域站点资料、部署项目与归属、账号、燃币和服务依赖关系。', icon: 'portfolio' },
            { href: '/admin/integrations', title: '集成密钥', description: '统一登记外部服务凭证、Webhook 与定时任务端点。', icon: 'integrations' },
            { href: '/admin/cloudflare-personal-site-map', title: '站点架构', description: '查看 Cloudflare 架构、public/admin/API 边界与演进方向。', icon: 'database' },
          ],
        },
        {
          title: '工程上下文',
          description: '把项目背景、关键决策和长期记忆沉淀为可持续读取的工程资产。',
          items: [
            { href: '/admin/context-memory', title: '上下文库', description: '管理加密记忆快照、版本时间线与本地解密内容。', icon: 'memory' },
          ],
        },
      ]}
    />
  )
}
