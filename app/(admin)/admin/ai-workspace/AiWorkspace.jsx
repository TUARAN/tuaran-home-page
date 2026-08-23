import WorkspaceHub from '../../components/WorkspaceHub'

export default function AiWorkspace() {
  return (
    <WorkspaceHub
      title="AI 执行工作台"
      description="承接规划中心输出的任务，统一跟进自动化运行与调用审计。"
      eyebrow="AI 执行闭环"
      flow={['规划中心输出', '自动化执行', '调用审计', '结果复盘']}
      items={[
        { href: '/admin/ops', title: '自动化台账', description: '统一登记云端与本地自动化，追踪运行、产物、风险与审核。', icon: 'ops' },
        { href: '/admin/deepseek-tasks', title: '模型管理', description: '管理模型服务、密钥与调用记录，审阅 Token 消耗和失败原因。', icon: 'deepseekTasks' },
      ]}
    />
  )
}
