import WorkspaceHub from '../../components/WorkspaceHub'

export default function ProjectWorkspace() {
  return (
    <WorkspaceHub
      title="项目与工程"
      description="用项目组合看方向，让 AI 协同与工程工作台共同推进交付，并沉淀可持续复用的上下文资产。"
      eyebrow="从方向到沉淀"
      flow={['项目治理', 'AI 协同', '工程推进', '资产沉淀']}
      sections={[
        {
          title: '项目治理',
          description: '跨项目判断优先级、路线图与工作区归属。',
          items: [
            { href: '/admin/planning', title: '规划中心', description: '统一记录全部项目的过去、当前焦点、未来里程碑与执行任务。', icon: 'planning' },
            { href: '/admin/portfolio', title: '项目总览', description: 'AI 项目台账、整合路线图与 Codex 工作区治理。', icon: 'portfolio' },
          ],
        },
        {
          title: 'AI 协同',
          description: '把任务规划、模型选型、Agent 分派、自动化运行与调用审计接入项目交付。',
          items: [
            { href: '/admin/model-dispatch', title: '规划与分派', description: '任务拆解、模型选型、Agent 任务卡与执行 Prompt。', icon: 'modelDispatch', note: '原「Agent 协同测试」' },
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
