import WorkspaceHub from '../../components/WorkspaceHub'

export default function SystemOperations() {
  return (
    <WorkspaceHub
      title="系统运维"
      description="观测站点数据健康，把运行态信息收在一个运维入口。"
      eyebrow="运行态检查"
      flow={['检查数据健康', '定位异常', '处理或复盘']}
      sections={[
        {
          title: '数据健康',
          description: '查看数据库结构、迁移状态与核心业务指标。',
          items: [
            { href: '/admin/db', title: '数据健康', description: '只读查看 D1 表结构、行数、迁移状态与核心业务指标。', icon: 'database' },
          ],
        },
      ]}
    />
  )
}
