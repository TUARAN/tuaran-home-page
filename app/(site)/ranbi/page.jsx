import PageContainer from '../components/PageContainer'
import RanbiBalance from '../components/RanbiBalance'
import RanbiUnlocksPanel from './RanbiUnlocksPanel'
import { getD1 } from '../../../lib/d1'
import { getPointPolicy, getPointRules } from '../../../lib/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '燃币说明 · 获取与使用资源权益',
  description:
    '查看燃币余额、获取方式、资源使用额度、解锁记录与永久权益。游客有试用额度，登录后可通过注册、签到、评论、活动和站长调整获得燃币。',
  keywords: ['燃币', '获取燃币', '涂阿燃', 'tuaran', '积分', '资源权益', '签到', '交流'],
  alternates: { canonical: '/ranbi' },
}

function Th({ children, className = '' }) {
  return <th className={`p-3 text-left font-semibold text-[var(--site-ink)] ${className}`}>{children}</th>
}

function Td({ children, className = '' }) {
  return <td className={`p-3 align-top text-[var(--site-muted)] ${className}`}>{children}</td>
}

export default async function RanbiPage() {
  let db = null
  try {
    db = getD1()
  } catch {}
  const R = await getPointRules(db)
  const POLICY = getPointPolicy(R)
  const commentMaxPerDay = R.comment > 0 ? Math.floor(R.commentDailyCap / R.comment) : 0
  const EARN_ROWS = POLICY.earnMethods.filter((row) => row.status === 'live').map((row) => [
    row.label,
    row.delta == null ? '按需' : `+${row.delta}`,
    row.id === 'comment' ? `${row.description} 当前约 ${commentMaxPerDay} 条封顶。` : row.description,
    row.frequency,
  ])
  const SPEND_ROWS = POLICY.spendScenarios.filter((row) => row.status === 'live' && row.cost != null).map((row) => [
    row.label,
    `${row.cost} / ${row.unit}`,
    row.description,
  ])
  return (
    <PageContainer width="narrow" className="py-12">
      <header className="mb-8 border-b border-[var(--site-line)] pb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fbf3df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a5b1e] dark:bg-amber-950/30 dark:text-amber-200">
          🔥 Ranbi · 燃币
        </div>
        <h1 className="font-serif text-[32px] leading-tight tracking-wide text-[var(--site-ink)] md:text-[38px]">
          获取和使用资源权益
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
          燃币用于解锁站内内容、领取工具包并保存资源权益。游客可以直接使用试用额度；登录后可查看余额和记录，
          通过注册、签到、有效评论、活动或站长调整继续获得燃币。
        </p>
        <p className="mt-2 text-[12px] leading-6 text-[var(--site-muted)]">
          获取、使用、余额明细和反滥用规则参考{' '}
          <a
            href={POLICY.reference.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#7a5b1e] underline underline-offset-2 dark:text-amber-300"
          >
            {POLICY.reference.label}
          </a>
          ：把获取、使用、余额明细和反滥用放在同一页讲清楚。
        </p>
        <div className="mt-5">
          <RanbiBalance />
        </div>
      </header>

      <RanbiUnlocksPanel />

      {/* 读者权益 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">一、你能获得什么</h2>
        <p className="text-[14px] leading-7 text-[var(--site-muted)]">
          <span className="font-medium text-[var(--site-ink)]">燃币对应站内资源权益与参与记录。</span>
          每个访客都有试用额度；登录后，已解锁内容、已领取工具和余额流水会保留在账号中。
          内容或工具只结算一次，之后可以长期打开。燃币不可提现，也没有自动充值入口。
        </p>
      </section>

      {/* 怎么赚 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">二、怎么获得</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--site-panel)]">
                <Th>方式</Th>
                <Th className="whitespace-nowrap">燃币</Th>
                <Th>说明</Th>
                <Th className="whitespace-nowrap">频率</Th>
              </tr>
            </thead>
            <tbody>
              {EARN_ROWS.map(([name, amount, desc, freq]) => (
                <tr key={name} className="border-t border-[var(--site-line)]">
                  <Td className="font-medium text-[var(--site-ink)]">{name}</Td>
                  <Td className="whitespace-nowrap font-mono font-semibold text-[#00a978]">{amount}</Td>
                  <Td>{desc}</Td>
                  <Td className="whitespace-nowrap">{freq}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 怎么用 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">三、怎么使用</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--site-panel)]">
                <Th>内容</Th>
                <Th className="whitespace-nowrap">使用额度</Th>
                <Th>说明</Th>
              </tr>
            </thead>
            <tbody>
              {SPEND_ROWS.map(([name, price, desc]) => (
                <tr key={name} className="border-t border-[var(--site-line)]">
                  <Td className="font-medium text-[var(--site-ink)]">{name}</Td>
                  <Td className="whitespace-nowrap font-mono font-semibold text-[#7a5b1e] dark:text-amber-300">{price} 燃币</Td>
                  <Td>{desc}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-[var(--site-muted)]">
          进入有燃币门槛的内容时，余额足够会<strong className="text-[var(--site-ink)]">自动解锁并使用燃币</strong>；
          <strong className="text-[var(--site-ink)]">解锁后永久可读</strong>，反复打开、刷新都不再重复使用。工具包和安装包则在点击“领取”时才结算；壁纸、音乐等免费资源只记录领取/打开，不使用燃币。
        </p>
      </section>

      {/* 权益记录 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">四、权益如何保存</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['游客试用', `当前浏览器按匿名身份获得 ${R.guestSeed} 燃币，可以先体验内容解锁或工具领取。`],
            ['登录归档', '登录时会把当前浏览器中的游客余额、评论和已解锁权益归入账号。'],
            ['永久解锁', '同一内容或工具只结算一次，刷新、再次打开和从领取记录返回都不会重复使用燃币。'],
            ['记录可查', '个人资料会显示余额、已解锁资源和领取记录；异常流水可以联系站长复核。'],
          ].map(([label, text], i) => (
            <div key={label} className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a5b1e] dark:text-amber-300">
                {String(i + 1).padStart(2, '0')} · {label}
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-[var(--site-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 速查 */}
      <section className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <h2 className="mb-2 text-[15px] font-semibold text-[#7a5b1e] dark:text-amber-200">一眼速查</h2>
        <ul className="space-y-1.5 text-[13px] leading-6 text-[#8a7a55] dark:text-amber-300/80">
          <li>· 游客自动 <strong>{R.guestSeed}</strong> 燃币 → 够读约 {Math.floor(R.guestSeed / R.resourceDefaultCost)} 篇内容，或领取 {Math.floor(R.guestSeed / R.toolDefaultCost)} 个工具包。</li>
          <li>· 注册 / 绑定一次性 <strong>{R.register}</strong> 燃币，之后每天签到 +{R.checkin}、评论 +{R.comment}。</li>
          <li>· 调研、资料、资源内容统一 {R.resourceDefaultCost} / 篇；工具包 / 安装包 {R.toolDefaultCost} / 项，进入内容或领取时自动扣减，解锁后永久有效。</li>
          <li>· 壁纸、音乐等免费资源不消耗燃币，但领取/打开会进入“我的领取记录”。</li>
          <li>· 评论奖励每日最多 +{R.commentDailyCap}，流水可查、重复操作不重复记账。</li>
          <li>· 余额或领取记录异常时，可附资源名称和页面链接联系站长复核。</li>
        </ul>
      </section>
    </PageContainer>
  )
}
