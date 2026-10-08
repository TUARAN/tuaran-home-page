import Link from 'next/link'
import PageContainer from '../../components/PageContainer'
import { getD1 } from '../../../../lib/d1'
import { loadRanbiPublicLedger } from '../../../../lib/ranbiPublicLedger'
import { RANBI_TOTAL_SUPPLY } from '../../../../lib/points'
import RanbiLedgerTransfers from './RanbiLedgerTransfers'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '燃币公开账本',
  description: '查看燃币固定总量、储备池、流通、销毁和每一笔转账。快照哈希可供任何人复核。',
  alternates: { canonical: '/ranbi/ledger' },
}

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function formatAmount(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0))
}

export default async function RanbiLedgerPage({ searchParams }) {
  const params = await searchParams
  const ledger = await loadRanbiPublicLedger(dbOrNull(), {
    page: params?.page,
    before: params?.before,
    limit: 40,
  })
  const snapshot = ledger?.snapshot

  return (
    <PageContainer width="narrow" className="py-12">
      <header className="mb-8 border-b border-[var(--site-line)] pb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fbf3df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a5b1e] dark:bg-amber-950/30 dark:text-amber-200">
          Ranbi Ledger · 公开账本
        </div>
        <h1 className="font-serif text-[32px] leading-tight tracking-wide text-[var(--site-ink)] md:text-[38px]">
          燃币公开账本
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
          固定总量 {formatAmount(RANBI_TOTAL_SUPPLY)} 枚。储备池、读者持有和销毁账户的余额公开在这里，每一笔转账都可以逐条查看。
          登录名、邮箱和游客编号不出现在账本上；同一位读者始终使用同一个公开编号。
        </p>
        <p className="mt-3 text-[13px] leading-6">
          <Link href="/ranbi" className="underline underline-offset-2">返回燃币说明</Link>
          {ledger ? (
            <>
              <span className="mx-2 text-[var(--site-muted)]">·</span>
              <Link href="/api/ranbi/ledger?scope=all" className="underline underline-offset-2">下载完整 JSON</Link>
            </>
          ) : null}
        </p>
      </header>

      {snapshot ? (
        <>
          <section className="mb-10">
            <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">总额核对</h2>
            <p className="mb-4 text-[14px] leading-7 text-[var(--site-muted)]">
              五个储备池余额、读者持有合计、销毁余额相加，应等于 {formatAmount(snapshot.totalSupply)}。
              当前合计 {formatAmount(snapshot.accounted)}，{snapshot.consistent ? '账目一致。' : '账目尚未对齐，站长需要复核。'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['固定总量', snapshot.totalSupply],
                ['读者持有', snapshot.circulating],
                ['累计销毁', snapshot.burned],
                ['转账笔数', snapshot.transferCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--site-muted)]">{label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-[var(--site-ink)]">{formatAmount(value)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--site-line)]">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="bg-blue-500/[0.06] text-[11px] uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    <th className="px-4 py-3">账户</th>
                    <th className="px-4 py-3">编号</th>
                    <th className="px-4 py-3 text-right">余额</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.accounts.map((account) => (
                    <tr key={account.accountId} className="border-t border-[var(--site-line)]">
                      <td className="px-4 py-3 font-medium text-[var(--site-ink)]">{account.label}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--site-muted)]">{account.accountId}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatAmount(account.balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-[var(--site-line)]">
                    <td className="px-4 py-3 font-medium text-[var(--site-ink)]">读者持有合计</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--site-muted)]">{formatAmount(snapshot.identities)} 个编号</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatAmount(snapshot.circulating)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">快照哈希</h2>
            <p className="mb-3 text-[14px] leading-7 text-[var(--site-muted)]">
              快照哈希覆盖储备池余额、读者持有、销毁余额和全部转账摘要，不包含这份页面的生成时间。
              下载 JSON 后，可以用同一套字段重算哈希。这个哈希可以写入 Base 上已有的内容证明，用来固定某一时刻公布的账。
              发放、兑换和余额查询仍在站内完成，读者不需要连接钱包。
            </p>
            <p className="break-all rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3 font-mono text-[12px] leading-6 text-[var(--site-ink)]">
              {ledger.snapshotHash}
            </p>
            <p className="mt-2 font-mono text-[12px] text-[var(--site-muted)]">转账摘要 {snapshot.transfersHash}</p>
          </section>

          <RanbiLedgerTransfers
            initial={{
              transfers: ledger.transfers,
              page: ledger.page,
              pageSize: ledger.pageSize,
              totalPages: ledger.totalPages,
              total: snapshot.transferCount,
            }}
          />
        </>
      ) : (
        <p className="text-[14px] leading-7 text-[var(--site-muted)]">公开账本暂时读不到。储备池完成初始化后会显示总额和转账。</p>
      )}
    </PageContainer>
  )
}
