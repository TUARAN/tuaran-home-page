import WorkspaceHub from '../../components/WorkspaceHub'

export default function SystemOperations() {
  return (
    <WorkspaceHub
      title="系统运维"
      description="观测数据健康与自动化运行，把站点的运行态信息放在一个运维入口。"
      eyebrow="运行态检查"
      flow={['检查数据健康', '检查自动化', '处理异常或复盘']}
      sections={[
        {
          title: '数据与自动化',
          description: '两者分别管理数据健康与任务健康，但都属于站点日常运维。',
          items: [
            { href: '/admin/db', title: '数据健康', description: '只读查看 D1 表结构、行数、迁移状态与核心业务指标。', icon: 'database' },
            { href: '/admin/ops', title: '自动化运行', description: '统一登记云端与本地自动化，追踪运行、产物、风险与审核。', icon: 'ops' },
          ],
        },
      ]}
    />
  )
}
