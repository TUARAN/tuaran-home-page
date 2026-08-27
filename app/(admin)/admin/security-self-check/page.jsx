import AdminPageGate from '../../components/AdminPageGate'
import { AdminPage, Section, StatCard, StatusPill } from '../../components/ui'
import {
  ACCEPTED_PUBLIC_METADATA,
  OPTIONAL_PRIVACY_ITEMS,
  PUBLICATION_BLOCKERS,
  PUBLICATION_DECISION,
  SECURITY_SELF_CHECK_SUMMARY,
  SECURITY_SELF_CHECK_UPDATED_AT,
} from '../../../../lib/securitySelfCheck'

export const metadata = {
  title: '涉密自检',
  description: '记录仓库公开前的秘密、隐私、架构信息与历史风险检查。',
  robots: { index: false, follow: false },
}

function ItemList({ items }) {
  return (
    <ul className="space-y-2 text-[13px] leading-6 text-[#454740] dark:text-gray-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a9172]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function SecuritySelfCheckPage() {
  return (
    <AdminPageGate
      label="涉密自检"
      returnTo="/admin/security-self-check"
      description="仓库公开前的秘密、隐私、架构信息与历史风险检查，仅站长本人可见。"
    >
      <AdminPage title={SECURITY_SELF_CHECK_SUMMARY.title} description={SECURITY_SELF_CHECK_SUMMARY.conclusion}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="检查日期" value={SECURITY_SELF_CHECK_UPDATED_AT} sub="本次为只读人工审计快照" icon="audit" tone="info" />
          <StatCard label="确认明文凭据" value="0" sub="未发现生产 Key、密码、Cookie 或 .env 明文" icon="information" tone="success" />
          <StatCard label="已接受公开" value={ACCEPTED_PUBLIC_METADATA.length} sub="策略、架构与运营元数据三组" icon="seo" tone="success" />
          <StatCard label="公开前事项" value={PUBLICATION_BLOCKERS.length} sub="处理、确认或复核后再作决定" icon="audit" tone="warning" />
        </div>

        <Section
          className="mt-5"
          title="审计口径"
          description={`范围：${SECURITY_SELF_CHECK_SUMMARY.scope}`}
        >
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            {SECURITY_SELF_CHECK_SUMMARY.credentialFinding}。这里的“涉密”是公开前的安全与隐私自检，不代表国家秘密认定，也不把所有内部资料自动视为秘密。
          </div>
        </Section>

        <Section
          className="mt-5"
          title="站长确认可公开的元数据"
          description="策略公开是一项主动取舍。以下条目保留记录，但不再单独作为仓库必须私有的理由。"
        >
          <div className="grid gap-4 xl:grid-cols-3">
            {ACCEPTED_PUBLIC_METADATA.map((entry) => (
              <article key={entry.group} className="rounded-xl border border-[#dde0d5] p-4 dark:border-[#293544]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-[16px] font-semibold text-[#15140f] dark:text-gray-100">{entry.group}</h3>
                  <StatusPill tone="success" size="sm">{entry.level}</StatusPill>
                </div>
                <div className="mt-3"><ItemList items={entry.items} /></div>
                <p className="mt-4 border-t border-[#e5e7df] pt-3 text-[12.5px] leading-6 text-[#686a61] dark:border-[#293544] dark:text-gray-400">
                  {entry.decision}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          className="mt-5"
          title="公开前仍有合理性的暂缓项"
          description="重点不在策略是否见光，而在第三方权利、密码学暴露面和无法撤回的历史公开。"
        >
          <div className="space-y-3">
            {PUBLICATION_BLOCKERS.map((item) => (
              <article key={item.title} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="warning" size="sm">{item.level}</StatusPill>
                  <h3 className="font-semibold text-[#2b2c28] dark:text-gray-100">{item.title}</h3>
                </div>
                <dl className="mt-3 grid gap-2 text-[13px] leading-6 md:grid-cols-[5rem_minmax(0,1fr)]">
                  <dt className="font-medium text-[#777966] dark:text-gray-500">依据</dt><dd>{item.evidence}</dd>
                  <dt className="font-medium text-[#777966] dark:text-gray-500">合理性</dt><dd>{item.rationale}</dd>
                  <dt className="font-medium text-[#777966] dark:text-gray-500">动作</dt><dd>{item.action}</dd>
                </dl>
              </article>
            ))}
          </div>
        </Section>

        <Section
          className="mt-5"
          title="可由站长接受的隐私取舍"
          description="这些信息有暴露成本，但不是凭据，也不必被夸大为硬性秘密。"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {OPTIONAL_PRIVACY_ITEMS.map((item) => (
              <article key={item.title} className="rounded-xl border border-[#dde0d5] p-4 dark:border-[#293544]">
                <h3 className="font-semibold text-[#2b2c28] dark:text-gray-100">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#62645b] dark:text-gray-400">{item.decision}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section className="mt-5" title="当前判断" description="公开与否应由可验证风险决定，不由“内部资料”这个标签决定。">
          <ItemList items={PUBLICATION_DECISION} />
        </Section>
      </AdminPage>
    </AdminPageGate>
  )
}
