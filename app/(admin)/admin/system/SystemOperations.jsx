import WorkspaceHub from '../../components/WorkspaceHub'

export default function SystemOperations() {
  return (
    <WorkspaceHub
      title="系统运维"
      description="统一处理站点运行、配置治理、访问工具与资产生命周期。"
      eyebrow="从观测到治理"
      flow={['检查运行状态', '调整站点策略', '记录与归档']}
      sections={[
        {
          title: '运行与配置',
          description: '先确认数据健康，再调整站点级功能与外部能力。',
          items: [
            { href: '/admin/db', title: '数据健康', description: '只读查看 D1 表结构、行数、迁移状态与核心业务指标。', icon: 'database' },
            { href: '/admin/settings', title: '站点配置', description: '管理第三方脚本、广告与站点级功能开关。', icon: 'settings' },
          ],
        },
        {
          title: '站点治理',
          description: '维护页面发现能力、分享入口与内容资产生命周期。',
          items: [
            { href: '/admin/seo', title: 'SEO 管理', description: '维护 SEO 策略、页面覆盖、Sitemap 与演进治理。', icon: 'seo' },
            { href: '/admin/short-links', title: '短链管理', description: '管理全站分享短链映射、搜索与点击统计。', icon: 'share' },
            { href: '/admin/archives', title: '存档管理', description: '处理活动页面下线、归档入口与保留资产台账。', icon: 'archive' },
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
