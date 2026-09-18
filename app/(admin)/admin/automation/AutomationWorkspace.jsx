import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/adminRoutes'

export default function AutomationWorkspace() {
  return (
    <WorkspaceHub
      {...getWorkspaceHubProps('/admin/automation')}
      planned={[
        { title: '统一任务日历', description: '按时间查看所有定时任务、依赖关系和下一次运行。' },
        { title: '异常告警', description: '汇总连续失败、超时、配额不足与人工待审状态。' },
        { title: '运行成本', description: '按任务和模型统计 Token、调用次数与估算费用。' },
      ]}
    />
  )
}
