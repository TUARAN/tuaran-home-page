import WorkspaceHub from '../../components/WorkspaceHub'

export default function PrivateDataWorkspace() {
  return (
    <WorkspaceHub
      title="私密数据"
      description="按安全模型管理个人密文、密码保护分享和私有媒体资产。"
      eyebrow="先确认安全边界"
      flow={['选择存储模型', '本地加密或私有存储', '受控访问', '归档与撤销']}
      sections={[
        {
          title: '个人密文',
          description: '口令只在浏览器内使用，服务器保存无法直接读取的密文。',
          items: [
            { href: '/admin/long-compass', title: '长期罗盘', description: '强私密个人内容库，在浏览器本地输入口令后解密。', icon: 'compass', note: '客户端解密 · 服务端密文' },
            { href: '/admin/soft-sticker', title: 'SoftSticker', description: '在体验记录与锻炼自控两个 Tab 间切换，分别查看画像看板和行为复盘。', icon: 'flower', note: '双 Tab · 独立口令' },
            { href: '/admin/person-strawberry', title: '草莓专题', description: '按自述可信度、联系时间线和资金账目复盘一段长期私人关系。', icon: 'personProfile', note: 'owner-only · 身份线索已脱敏' },
            { href: '/admin/information', title: '信息保险库', description: '加密保存账号、密码、密保答案和其他敏感资料。', icon: 'information', note: 'AES-GCM · 口令不上传' },
          ],
        },
        {
          title: '加密分发',
          description: '用于需要交付给他人的受控内容，不与个人密文混用。',
          items: [
            { href: '/admin/share', title: '密码保护分享', description: '创建密码保护链接、设置有效期并管理现有分享。', icon: 'share', note: '公开端只返回密文' },
          ],
        },
        {
          title: '私有资产',
          description: '文件只存入私有 R2，通过 owner-only 接口预览与下载。',
          items: [
            { href: '/admin/nsfw', title: '私有媒体库', description: '管理受限图片与视频的上传、预览、归档和删除。', icon: 'nsfw', note: '私有 R2 · 不生成公开 URL' },
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
