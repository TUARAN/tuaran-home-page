import LongCompassClient from '../../../(site)/long-compass/LongCompassClient'
import { AdminPage } from '../../components/ui'

export default function LongCompassAdmin() {
  return (
    <AdminPage
      title="长期罗盘"
      description="强私密个人内容库：数据库仅存密文，输入口令后只在浏览器本地解密。"
    >
      <LongCompassClient
        returnTo="/admin/long-compass"
        eyebrow="Admin · 强私密模型"
        description="口令不会发送到服务器；当前浏览器负责解密和展示。"
        embedded
      />
    </AdminPage>
  )
}
