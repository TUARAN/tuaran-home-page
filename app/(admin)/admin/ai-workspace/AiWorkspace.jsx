import WorkspaceHub from '../../components/WorkspaceHub'

export default function AiWorkspace() {
  return (
    <WorkspaceHub
      title="AI 协同工作台"
      description="将任务规划、模型选型、Agent 分派与调用审计收在同一个 AI 执行闭环中。"
      eyebrow="AI 任务闭环"
      flow={['录入需求', '规划与分派', '执行调用', '审计与复盘']}
      sections={[
        {
          title: '规划与执行',
          description: '先定义任务和模型职责边界，再把结果交付给具体 Agent。',
          items: [
            { href: '/admin/model-dispatch', title: '规划与分派', description: '任务拆解、模型选型、Agent 任务卡与执行 Prompt。', icon: 'modelDispatch', note: '原「Agent 协同测试」' },
            { href: '/admin/deepseek-tasks', title: '调用记录与审计', description: '审阅 API 调用、Token 消耗、失败原因与后续处理状态。', icon: 'deepseekTasks', note: '原「LLM API 任务管理」' },
          ],
        },
      ]}
    />
  )
}
