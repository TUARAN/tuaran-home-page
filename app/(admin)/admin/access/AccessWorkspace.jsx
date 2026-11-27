import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/admin/adminRoutes'

const PLANNED = [
  { title: '登录与会话', description: '查看活跃会话、登录设备、最近登录与强制退出。' },
  { title: '角色权限策略', description: '维护角色定义、权限矩阵、页面访问与 API 操作策略。' },
  { title: '安全审计', description: '记录登录、角色变更、授权撤销和管理员敏感操作。' },
]

export default function AccessWorkspace() {
  return <WorkspaceHub {...getWorkspaceHubProps('/admin/access')} planned={PLANNED} />
}