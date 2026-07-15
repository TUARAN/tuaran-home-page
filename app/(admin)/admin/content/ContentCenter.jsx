import WorkspaceHub from '../../components/WorkspaceHub'

export default function ContentCenter() {
  return (
    <WorkspaceHub
      title="内容中心"
      description="从创作、入库到发布后的反馈，按同一条内容生命周期组织。"
      eyebrow="内容生命周期"
      flow={['写作与编辑', '内容库与发布', '数据与反馈', '持续校正']}
      sections={[
        {
          title: '创作与发布',
          description: '正文创作与全站目录是两种职责，在同一工作台中顺序衔接。',
          items: [
            { href: '/admin/articles', title: '写作与编辑', description: '撰写在线文章、保存草稿、预览并发布。', icon: 'articles', note: '仅管理 article_posts 正文' },
            { href: '/admin/content-index', title: '内容库与发布', description: '统一查看文章、调研与资源；同步构建期内容或登记无需构建的条目。', icon: 'articles', note: '管理 content_index 元数据与上线状态' },
            { href: '/admin/recommendations', title: '推荐管理', description: '配置首页推荐来源、内容权重、换一批策略与人工置顶。', icon: 'analytics', note: '规则保存后无需重新构建' },
          ],
        },
        {
          title: '规范与运营',
          description: '发布前校正表达，发布后根据真实阅读与订阅行为继续调整。',
          items: [
            { href: '/admin/research-style', title: '写作规范', description: '调研表达规则、禁用措辞与存量内容复核。', icon: 'researchStyle' },
            { href: '/admin/content-weekly', title: '数据与反馈', description: '阅读、点赞、月统计与评论跟进。', icon: 'analytics' },
            { href: '/admin/rss-feeds', title: 'RSS 与分发', description: '维护公开 RSS 订阅墙，并查看 RSS 请求记录。', icon: 'rss' },
          ],
        },
      ]}
    />
  )
}
