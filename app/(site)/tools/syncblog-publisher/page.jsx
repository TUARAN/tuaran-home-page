import { redirect } from 'next/navigation'

/** 旧「AI 分发大师」介绍页 → 阿燃分发智能体 */
export default function SyncblogPublisherLegacyPage() {
  redirect('/tools/aran-distributor')
}