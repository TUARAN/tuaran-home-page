export const SITE_PUBLIC_COMPONENT_GROUPS = [
  {
    id: 'site-shell',
    title: '站点骨架',
    titleEn: 'Site Shell',
    description: '负责全站一致的导航、内容宽度、页脚和页面级交互。',
    items: [
      { name: 'SiteHeader', role: '全站主导航、频道入口、语言与账户相关入口。', scope: '全站布局' },
      { name: 'PageContainer', role: '统一正文最大宽度、左右留白和响应式间距。', scope: '内容页面' },
      { name: 'SiteFooter', role: '统一站点说明、政策、联系与订阅入口。', scope: '全站布局' },
      { name: 'LayoutChromeControls', role: '承载返回顶部等跨页面辅助操作。', scope: '全站布局' },
    ],
  },
  {
    id: 'content-navigation',
    title: '内容与导航',
    titleEn: 'Content & Navigation',
    description: '让目录、专题、文章和站内跳转保持同一种阅读方式。',
    items: [
      { name: 'GroupedDirectoryPage', role: '统一分类目录版式；当前由工具库与多维页面共同使用。', scope: '目录页面' },
      { name: 'BookmarksTocLayout', role: '为长目录与收藏页提供目录栏和正文双栏结构。', scope: '索引页面' },
      { name: 'HoverPreviewLink', role: '在不离开当前上下文时预览站内链接内容。', scope: '站内链接' },
      { name: 'BackToTopButton', role: '为长页面提供快速回到顶部的固定入口。', scope: '长内容页' },
    ],
  },
  {
    id: 'content-actions',
    title: '内容操作',
    titleEn: 'Content Actions',
    description: '统一文章与专题页上的分享、讨论、反馈和阅读动作。',
    items: [
      { name: 'SharePageButton', role: '调用系统分享或复制链接，统一页面分享体验。', scope: '公开页面' },
      { name: 'ContentEngagement', role: '组合点赞、评论等内容互动入口。', scope: '内容详情' },
      { name: 'ArticleComments', role: '展示并提交围绕具体内容的讨论。', scope: '文章与专题' },
      { name: 'ImageLightbox', role: '放大查看内容图片，并保留键盘与触摸操作。', scope: '图片内容' },
    ],
  },
  {
    id: 'identity-access',
    title: '身份与权限',
    titleEn: 'Identity & Access',
    description: '统一登录状态、用户身份、燃币与私域内容访问反馈。',
    items: [
      { name: 'AuthProvider', role: '向站内组件提供当前用户与登录状态。', scope: '全站状态' },
      { name: 'UserAvatar', role: '统一显示用户头像与账户入口。', scope: '身份入口' },
      { name: 'RanbiBalance', role: '展示当前燃币余额及相关状态。', scope: '账户权益' },
      { name: 'RanbiGate', role: '为需要燃币或身份的内容提供一致的访问提示。', scope: '权限内容' },
    ],
  },
]
