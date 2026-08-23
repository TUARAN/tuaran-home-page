import WorkspaceHub from '../../components/WorkspaceHub'

export default function AccessWorkspace() {
  return (
    <WorkspaceHub
      title="用户与权限"
      description="统一管理账号身份、外部授权、燃币权益与菜单可见性。"
      eyebrow="身份与权益"
      flow={['识别身份', '分配角色', '授予权益', '持续审计']}
      sections={[
        {
          title: '账号与授权',
          description: '查看正式账号、游客身份和外部客户端授权关系。',
          items: [
            { href: '/admin/users', title: '账号与身份', description: '管理正式账号、游客身份、角色、封禁状态和账号备注。', icon: 'users', note: 'member / trusted / blocked' },
            { href: '/admin/access/grants', title: '授权管理', description: '管理用户与 MCP OAuth 客户端之间的授权和撤销关系。', icon: 'integrations', note: '只管理批准记录，不展示明文 Token' },
          ],
        },
        {
          title: '权益与可见性',
          description: '将账户权益与界面入口分开管理，避免把菜单展示误认为页面鉴权。',
          items: [
            { href: '/admin/points', title: '燃币与权益', description: '管理全站规则、资源定价、手动调整、账户流水和解锁记录。', icon: 'ranbi' },
            { href: '/admin/nav', title: '菜单可见性', description: '决定菜单入口对访客、登录用户或站长是否显示，不改变页面自身鉴权。', icon: 'nav' },
          ],
        },
      ]}
      planned={[
        { title: '登录与会话', description: '查看活跃会话、登录设备、最近登录与强制退出。' },
        { title: '角色权限策略', description: '维护角色定义、权限矩阵、页面访问与 API 操作策略。' },
        { title: '安全审计', description: '记录登录、角色变更、授权撤销和管理员敏感操作。' },
      ]}
    />
  )
}
