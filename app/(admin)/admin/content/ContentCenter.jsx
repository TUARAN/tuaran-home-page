import WorkspaceHub from '../../components/WorkspaceHub'

export default function ContentCenter() {
  return (
    <WorkspaceHub
      title="内容中心"
      description="从创作、入库到发布后的反馈，按同一条内容生命周期组织。"
      eyebrow="内容生命周期"
      flow={['内容管理', '数据与反馈', '持续校正']}
      sections={[
        {
          title: '创作与发布',
          description: '在同一工作台完成创作、登记、发布与全站内容状态管理。',
          items: [
            { href: '/admin/articles', title: '内容管理', description: '撰写与发布文章，统一查看文章、调研和资源的上线状态。', icon: 'articles', note: '正文创作 + 全站内容目录' },
            { href: '/admin/recommendations', title: '推荐管理', description: '配置首页推荐来源、内容权重、换一批策略与人工置顶。', icon: 'analytics', note: '规则保存后无需重新构建' },
            { href: '/admin/quotes', title: '名言管理', description: '维护目录页随机展示的短名言、作者、出处与启用状态。', icon: 'researchStyle', note: '100 条公版原典种子' },
          ],
        },
        {
          title: '规范与运营',
          description: '发布前校正表达，发布后根据真实阅读与订阅行为继续调整。',
          items: [
            { href: '/admin/content-taxonomy', title: '分类管理', description: '维护分类定义，查看主题分布与待治理内容，持续校正分类边界。', icon: 'researchStyle', note: '稳定 ID + 主题定义 + 分类审计' },
            { href: '/admin/content-weekly', title: '数据与反馈', description: '阅读、点赞、月统计与评论跟进。', icon: 'analytics' },
            { href: '/admin/engagement-bots', title: '路过互动', description: '管理人设、每日随机点赞、DeepSeek 评论与运行记录。前台身份显示为「路过」。', icon: 'ops', note: '每天 10:23' },
            { href: '/admin/rss-feeds', title: 'RSS 与分发', description: '维护公开 RSS 订阅墙，并查看 RSS 请求记录。', icon: 'rss' },
          ],
        },
      ]}
    />
  )
}
