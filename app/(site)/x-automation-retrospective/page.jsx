import PageContainer from '../components/PageContainer'
import ContentPvBeacon from '../components/ContentPvBeacon'
import RichPageJsonLd from '../components/RichPageJsonLd'
import XAutomationRetrospectiveClient from './XAutomationRetrospectiveClient'
import { createRichPageMetadata } from '../../../lib/richPageSeo'
import { X_AUTOMATION_SUMMARY } from '../../../lib/xAutomationRetrospective'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('x-automation-retrospective')

export default function XAutomationRetrospectivePage() {
  return (
    <PageContainer className="py-8 md:py-10">
      <ContentPvBeacon category="rich-page" slug="x-automation-retrospective" />
      <RichPageJsonLd pageId="x-automation-retrospective" />

      <header className="border-b border-[var(--site-line)] pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--site-faint)]">
          X Automation · 自动发推回溯
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[var(--site-ink)] md:text-3xl">
          51 天，从一条早安到五条短帖，再到暂停
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[var(--site-muted)]">
          2026 年 8 月 4 日上线 X 每日自动发布，经历模板化、LLM 实时生成、多类型扩张、
          十条矩阵收束、表情包配图与 9 月 18 日去模板化改造；9 月 23 日暂停。
          可按概览、时间线、排期演变与运行数据四个视图交互查看。
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['起点', X_AUTOMATION_SUMMARY.startDate],
            ['暂停', X_AUTOMATION_SUMMARY.endDate],
            ['运行', `${X_AUTOMATION_SUMMARY.runDays} 天`],
            ['估算发帖', X_AUTOMATION_SUMMARY.estimatedTotalPosts],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_72%,transparent)] px-3 py-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">{label}</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--site-ink)]">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <XAutomationRetrospectiveClient />
    </PageContainer>
  )
}
