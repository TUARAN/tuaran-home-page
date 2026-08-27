import WorkspaceHub from '../../components/WorkspaceHub'

export default function PrivateDataWorkspace() {
  return (
    <WorkspaceHub
      title="私密数据"
      description="按安全模型管理个人密文、私密分析、密码保护分享和私有媒体资产。"
      eyebrow="先确认安全边界"
      flow={['选择存储模型', '本地加密或私有存储', '受控访问', '归档与撤销']}
      sections={[
        {
          title: '个人密文',
          description: '口令只在浏览器内使用，服务器保存无法直接读取的密文。',
          items: [
            { href: '/admin/information', title: '信息金库', description: '加密保存账号、密码、密保答案和其他敏感资料。', icon: 'information', note: 'AES-GCM · 口令不上传' },
            { href: '/admin/soft-sticker', title: '软贴空间', description: '集中查看从 Notion 备份整理出的体验记录、自控复盘、关系专题和长期档案。', icon: 'flower', note: '统一口令 · 四 Tab' },
          ],
        },
        {
          title: '加密分发',
          description: '用于需要交付给他人的受控内容，不与个人密文混用。',
          items: [
            { href: '/admin/share', title: '加密分享', description: '创建密码保护链接、设置有效期并管理现有分享。', icon: 'share', note: '公开端只返回密文' },
          ],
        },
        {
          title: '私密分析',
          description: '保存只供站长研判的数据快照与分析结果，不在主站公开展示。',
          items: [
            { href: '/admin/stock-analysis', title: '交易分析', description: '浏览分钟级交易快照，查看资金费率、量价背离、关键点位与横向风险分析。', icon: 'analytics', note: 'Owner-only · 不进入公开导航' },
          ],
        },
        {
          title: '私有资产',
          description: '文件只存入私有 R2，通过 owner-only 接口预览与下载。',
          items: [
            { href: '/admin/nsfw', title: '私密媒体', description: '管理受限图片与视频的上传、预览、归档和删除。', icon: 'nsfw', note: '私有 R2 · 不生成公开 URL' },
          ],
        },
      ]}
      planned={[
        { title: '备份与恢复', description: '生成加密导出、恢复包并检查数据完整性。' },
        { title: '访问与审计', description: '记录分享访问、文件下载、解锁失败和异常请求。' },
        { title: '生命周期', description: '管理分享过期、密钥轮换提醒、归档和永久删除队列。' },
      ]}
    />
  )
}
