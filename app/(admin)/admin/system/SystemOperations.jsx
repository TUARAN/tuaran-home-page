import WorkspaceHub from '../../components/WorkspaceHub'

export default function SystemOperations() {
  return (
    <WorkspaceHub
      title="系统运维"
      description="观测站点数据健康，也维护可控、可复盘的系统实验。"
      eyebrow="运行态检查"
      flow={['确认范围', '检查或实验', '记录与复盘']}
      sections={[
        {
          title: '数据健康',
          description: '查看数据库结构、迁移状态与核心业务指标。',
          items: [
            { href: '/admin/db', title: '数据健康', description: '只读查看 D1 表结构、行数、迁移状态与核心业务指标。', icon: 'database' },
          ],
        },
        {
          title: '系统实验',
          description: '只在自有或明确授权样本上学习，先静态、后动态，保留过程记录。',
          items: [
            {
              href: '/admin/reverse-lab',
              title: '逆向测试',
              description: '逆向学习路线、浏览器基础实验、知识测试与克制的通用工具箱。',
              note: '本地进度 · 不上传样本 · 不在站点执行二进制',
              icon: 'reverseLab',
            },
          ],
        },
      ]}
    />
  )
}
