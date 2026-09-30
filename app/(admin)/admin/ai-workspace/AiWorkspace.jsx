import WorkspaceHub from '../../components/WorkspaceHub'

export default function AiWorkspace() {
  return (
    <WorkspaceHub
      title="AI 执行工作台"
      description="承接规划中心输出的任务，统一跟进自动化运行与调用审计。"
      eyebrow="AI 执行闭环"
      flow={['规划中心输出', '自动化执行', '调用审计', '结果复盘']}
      items={[
        { href: '/admin/ops', title: '任务中心', description: '统一登记云端与本地自动化，并查看运行和模型调用记录。', icon: 'ops' },
        { href: '/admin/settings?tab=models', title: '模型服务', description: '管理模型服务与密钥；调用记录在任务中心查看。', icon: 'deepseekTasks' },
      ]}
    />
  )
}
