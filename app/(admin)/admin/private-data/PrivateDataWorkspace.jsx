import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/admin/adminRoutes'

const PLANNED = [
  { title: '备份与恢复', description: '生成加密导出、恢复包并检查数据完整性。' },
  { title: '访问与审计', description: '记录分享访问、文件下载、解锁失败和异常请求。' },
  { title: '生命周期', description: '管理分享过期、密钥轮换提醒、归档和永久删除队列。' },
]

export default function PrivateDataWorkspace() {
  return <WorkspaceHub {...getWorkspaceHubProps('/admin/private-data')} planned={PLANNED} />
}