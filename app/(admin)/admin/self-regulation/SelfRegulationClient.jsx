import { IconAlertCircle, IconLock } from '@tabler/icons-react'

import { AdminPage, Section } from '../../components/ui'
import SelfRegulationReview from './SelfRegulationReview'

export default function SelfRegulationClient({ document, error }) {
  if (document) return <SelfRegulationReview memoir={document} />

  return (
    <AdminPage
      title="锻炼与自控"
      description="此区域已随 SoftSticker 的统一口令解锁。"
      actions={<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"><IconLock size={13} />统一口令已验证</span>}
    >
      <Section title="回忆录暂不可用" description="统一门禁已经通过，但正文未能从私密文档库读取。">
        <div className="flex max-w-2xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-100">
          <IconAlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{error || '回忆录尚未写入私密文档库。'}</p>
        </div>
      </Section>
    </AdminPage>
  )
}
