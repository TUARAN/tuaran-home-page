import AdminPageGate from '../../components/AdminPageGate'
import { AdminButton, AdminPage, DataTable, Section, StatCard, StatusPill } from '../../components/ui'
import {
  AUTOPILOT_BUCKETS,
  AUTOPILOT_OPEN_ISSUES,
  AUTOPILOT_PERFORMANCE_FINDINGS,
  AUTOPILOT_SCAN_PLAN,
  AUTOPILOT_SCAN_SNAPSHOT_AT,
  AUTOPILOT_SECURITY_FINDINGS,
  AUTOPILOT_SEVERITIES,
  sortAutopilotFindings,
  summarizeAutopilotScanBoard,
} from '../../../../lib/admin/autopilotScanBoard'

export const metadata = {
  title: '巡检看板',
  description: '汇总 Autopilot 安全与性能巡检的最新发现、搁置项和重复旧单。',
  robots: { index: false, follow: false },
}

const TYPE_LABEL = { security: '安全', performance: '性能' }

function SeverityPill({ severity }) {
  const item = AUTOPILOT_SEVERITIES[severity] || AUTOPILOT_SEVERITIES.info
  return <StatusPill tone={item.tone} size="sm">{item.label}</StatusPill>
}

function BucketPill({ bucket }) {
  const item = AUTOPILOT_BUCKETS[bucket] || AUTOPILOT_BUCKETS.hygiene
  return <StatusPill tone={item.tone} size="sm">{item.label}</StatusPill>
}

function IssueLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-[#2f4f2f] underline-offset-2 hover:underline dark:text-emerald-300">
      {children}
    </a>
  )
}

const FINDING_COLUMNS = [
  { key: 'severity', header: '级别', width: '4.5rem', render: (row) => <SeverityPill severity={row.severity} /> },
  { key: 'title', header: '发现', tdClassName: 'min-w-[16rem] whitespace-normal' },
  { key: 'bucket', header: '分桶', width: '6.5rem', render: (row) => <BucketPill bucket={row.bucket} /> },
  { key: 'note', header: '说明', tdClassName: 'min-w-[18rem] whitespace-normal text-[#62645b] dark:text-gray-400' },
]

export default function AutopilotScanBoardPage() {
  const summary = summarizeAutopilotScanBoard()
  const securityRows = sortAutopilotFindings(AUTOPILOT_SECURITY_FINDINGS)
  const performanceRows = sortAutopilotFindings(AUTOPILOT_PERFORMANCE_FINDINGS)
  const superseded = AUTOPILOT_OPEN_ISSUES.filter((item) => !item.latest)

  return (
    <AdminPageGate
      label="巡检看板"
      returnTo="/admin/autopilot-scans"
      description="Autopilot 安全与性能巡检的去重快照，仅站长本人可见。"
    >
      <AdminPage
        title="巡检看板"
        description={`把每周重复的安全、性能巡检收成 ${AUTOPILOT_SCAN_SNAPSHOT_AT} 的静态快照。最新单保留发现，重复旧单标成可关闭；兼容升级只登记，不在这里改版本。`}
        actions={(
          <>
            <AdminButton href={summary.latestSecurity.url} size="sm" target="_blank" rel="noreferrer">{`安全 #${summary.latestSecurity.number}`}</AdminButton>
            <AdminButton href={summary.latestPerformance.url} size="sm" target="_blank" rel="noreferrer">{`性能 #${summary.latestPerformance.number}`}</AdminButton>
          </>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="未关安全单" value={summary.openSecurity} sub={`最新 #${summary.latestSecurity.number} · ${summary.latestSecurity.date}`} icon="audit" tone="danger" />
          <StatCard label="未关性能单" value={summary.openPerformance} sub={`最新 #${summary.latestPerformance.number} · ${summary.latestPerformance.date}`} icon="audit" tone="warning" />
          <StatCard label="无痛可做" value={summary.safe} sub="兼容依赖升级，只登记" icon="information" tone="success" />
          <StatCard label="搁置（破坏性）" value={summary.defer} sub="响应头、大版本、超大文件" icon="audit" tone="warning" />
          <StatCard label="已由最新单覆盖" value={summary.superseded} sub="建议关闭的重复巡检 Issue" icon="ops" tone="neutral" />
        </div>

        <Section
          className="mt-5"
          title="处理安排"
          description={`按最新两张单执行。旧单关闭后，后续只维护 #${summary.latestSecurity.number} 与 #${summary.latestPerformance.number}，直到下一轮扫描替换它们。`}
        >
          <ol className="list-decimal space-y-2 pl-5 text-[13px] leading-6 text-[#454740] dark:text-gray-300">
            {AUTOPILOT_SCAN_PLAN.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </Section>

        <Section
          className="mt-5"
          title="安全发现"
          description={`#${summary.latestSecurity.number} · ${summary.latestSecurity.date} · ${securityRows.length} 项。待修勾选是其中的 high/medium。无痛可做表示下一步跑 npm audit fix，锁文件保持不动。`}
          actions={<AdminButton href={summary.latestSecurity.url} size="sm" target="_blank" rel="noreferrer">{`打开 #${summary.latestSecurity.number}`}</AdminButton>}
        >
          <DataTable columns={FINDING_COLUMNS} rows={securityRows} rowKey={(row) => row.id} />
        </Section>

        <Section
          className="mt-5"
          title="性能发现"
          description={`#${summary.latestPerformance.number} · ${summary.latestPerformance.date} · ${performanceRows.length} 项。待修勾选只有两条超大文件，记为搁置。其余 low/info 不进待办。`}
          actions={<AdminButton href={summary.latestPerformance.url} size="sm" target="_blank" rel="noreferrer">{`打开 #${summary.latestPerformance.number}`}</AdminButton>}
        >
          <DataTable columns={FINDING_COLUMNS} rows={performanceRows} rowKey={(row) => row.id} />
        </Section>

        <Section
          className="mt-5"
          title="已由最新单覆盖"
          description={`这些 Issue 仍开着，内容和最新单重复。安全旧单由 #${summary.latestSecurity.number} 覆盖，性能旧单由 #${summary.latestPerformance.number} 覆盖。`}
        >
          <DataTable
            columns={[
              {
                key: 'number',
                header: 'Issue',
                width: '5rem',
                render: (row) => <IssueLink href={row.url}>#{row.number}</IssueLink>,
              },
              { key: 'type', header: '类型', width: '4.5rem', render: (row) => TYPE_LABEL[row.type] },
              { key: 'date', header: '巡检日', width: '7rem' },
              { key: 'pendingCount', header: '原待处理', width: '6rem', render: (row) => `${row.pendingCount} 项` },
              {
                key: 'coveredBy',
                header: '覆盖关系',
                render: (row) => (row.type === 'security' ? `关闭，改看 #${summary.latestSecurity.number}` : `关闭，改看 #${summary.latestPerformance.number}`),
              },
            ]}
            rows={superseded}
            rowKey={(row) => String(row.number)}
          />
        </Section>
      </AdminPage>
    </AdminPageGate>
  )
}
