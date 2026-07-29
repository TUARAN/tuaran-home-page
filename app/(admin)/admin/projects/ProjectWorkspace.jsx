import WorkspaceHub from '../../components/WorkspaceHub'

export default function ProjectWorkspace() {
  return (
    <WorkspaceHub
      title="项目与工程"
      description="由规划中心统筹项目全局，让 AI 参与大小任务的拆解与分派，再由工程工作台推进交付。"
      eyebrow="从方向到沉淀"
      flow={['全局规划', 'AI 参与拆解', '工程推进', '资产沉淀']}
      sections={[
        {
          title: '项目治理',
          description: '从规划中心判断跨项目优先级、路线图与工作区归属。',
          items: [
            { href: '/admin/planning', title: '规划中心', description: '统筹全部项目的过去、当前焦点与未来，并让 AI 参与大小任务的规划与分派。', icon: 'planning' },
            { href: '/admin/portfolio', title: '项目总览', description: 'AI 项目台账、整合路线图与 Codex 工作区治理。', icon: 'portfolio' },
          ],
        },
        {
          title: '执行与审计',
          description: '承接规划中心的任务输出，追踪自动化运行、模型调用与执行结果。',
          items: [
            { href: '/admin/ops', title: '自动化运行', description: '统一登记云端与本地自动化，追踪运行、产物、风险与审核。', icon: 'ops' },
            { href: '/admin/deepseek-tasks', title: '调用记录与审计', description: '审阅 API 调用、Token 消耗、失败原因与后续处理状态。', icon: 'deepseekTasks', note: '原「LLM API 任务管理」' },
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
        {
          title: '工程上下文',
          description: '把项目背景、关键决策和长期记忆沉淀为可持续读取的工程资产。',
          items: [
            { href: '/admin/context-memory', title: '上下文记忆', description: '管理加密记忆快照、版本时间线与本地解密内容。', icon: 'memory' },
          ],
        },
      ]}
    />
  )
}
