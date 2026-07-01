import PageContainer from '../components/PageContainer'
import RanbiBalance from '../components/RanbiBalance'
import RanbiUnlocksPanel from './RanbiUnlocksPanel'
import { POINT_POLICY, POINT_RULES } from '../../../lib/points'

export const dynamic = 'force-static'

export const metadata = {
  title: '燃币说明 · 留存、交流与资源权益',
  description:
    '燃币是 2aran.com 的站内留存与友好交流机制：用于资源领取、活动参与和内容权益，不是为了收费。游客有试用额度，注册、签到、评论、活动和支持本站都可补充燃币。',
  keywords: ['燃币', '获取燃币', '涂阿燃', 'tuaran', '积分', '资源权益', '签到', '交流'],
  alternates: { canonical: '/ranbi' },
}

const R = POINT_RULES
const POLICY = POINT_POLICY
const commentMaxPerDay = Math.floor(R.commentDailyCap / R.comment)

const EARN_ROWS = POLICY.earnMethods.filter((row) => row.status === 'live').map((row) => [
  row.label,
  row.delta == null ? '按需' : `+${row.delta}`,
  row.id === 'comment'
    ? `${row.description} 当前约 ${commentMaxPerDay} 条封顶。`
    : row.description,
  row.frequency,
])

const SPEND_ROWS = POLICY.spendScenarios.filter((row) => row.status === 'live' && row.cost != null).map((row) => [
  row.label,
  `${row.cost} / ${row.unit}`,
  row.description,
])

const RESERVED_ROWS = POLICY.spendScenarios.filter((row) => row.status === 'reserved').map((row) => [
  row.label,
  row.cost == null ? '待定' : `${row.cost} / ${row.unit}`,
  row.description,
])

const DIMENSIONS = [
  ['身份', '游客也有燃币（按匿名身份发放）；绑定登录后转为正式账号，额度更高、可签到可评论赚币。'],
  ['获取', `自动发放 + 主动赚取两条线：游客 ${R.guestSeed}、注册 ${R.register} 是底子，签到 +${R.checkin}/天、评论 +${R.comment}/条 是细水长流。`],
  ['使用', `按资源维护成本分档：调研 ${R.researchDefaultCost}、资料 ${R.resourceDefaultCost}。打开内容会自动使用燃币，不用点按钮，底部给个轻提示。`],
  ['权益', '解锁一次，永久可读——同一篇反复打开、刷新都不再重复使用燃币；绑定账号后，游客期间解锁过的内容继续免费。'],
]

function Th({ children, className = '' }) {
  return <th className={`p-3 text-left font-semibold text-[var(--site-ink)] ${className}`}>{children}</th>
}

function Td({ children, className = '' }) {
  return <td className={`p-3 align-top text-[var(--site-muted)] ${className}`}>{children}</td>
}

export default function RanbiPage() {
  return (
    <PageContainer width="narrow" className="py-12">
      <header className="mb-8 border-b border-[var(--site-line)] pb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fbf3df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a5b1e] dark:bg-amber-950/30 dark:text-amber-200">
          🔥 Ranbi · 燃币
        </div>
        <h1 className="font-serif text-[32px] leading-tight tracking-wide text-[var(--site-ink)] md:text-[38px]">
          燃币说明
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
          燃币是本站的「留存与友好交流机制」。它不是为了把阅读变成收费，也不是 UGC 平台的积分排名；
          它主要用来记录资源领取、活动参与和内容权益。设计它，是为了让认真读、认真评论、愿意支持本站的人更容易留下来。
        </p>
        <p className="mt-2 text-[12px] leading-6 text-[var(--site-muted)]">
          规则结构参考{' '}
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

      {/* 它是什么 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">一、它是什么</h2>
        <p className="text-[14px] leading-7 text-[var(--site-muted)]">
          一句话：<span className="font-medium text-[var(--site-ink)]">燃币 = 站内资源权益与参与记录</span>。
          每个访客一来就有试用额度；读得多、聊得多、参与活动或支持本站，都可以继续补充。
          它不做提现，也不做自动充值；如果确实因为图床、视频、模型请求、存储和带宽成本需要支持，
          可以通过「支持本站」后私聊站长补充燃币。
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
          打开内容时会<strong className="text-[var(--site-ink)]">自动使用燃币</strong>，不需要点任何按钮，底部弹一个几秒后消失的轻提示；
          <strong className="text-[var(--site-ink)]">解锁后永久可读</strong>，反复打开、刷新都不再重复使用。余额不够时才会拦截，并引导你注册、签到、评论或联系站长补齐。
        </p>
      </section>

      {/* 预留使用项 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">四、下一步预留</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--site-panel)]">
                <Th>场景</Th>
                <Th className="whitespace-nowrap">建议额度</Th>
                <Th>说明</Th>
              </tr>
            </thead>
            <tbody>
              {RESERVED_ROWS.map(([name, price, desc]) => (
                <tr key={name} className="border-t border-[var(--site-line)]">
                  <Td className="font-medium text-[var(--site-ink)]">{name}</Td>
                  <Td className="whitespace-nowrap font-mono font-semibold text-[#7a5b1e] dark:text-amber-300">{price}</Td>
                  <Td>{desc}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-[var(--site-muted)]">
          这些只是在规则层预留，未上线前不会实际使用燃币。未来若开放社区推荐、留言置顶或邀请码，会先接审核、风控和权益明细。
        </p>
      </section>

      {/* 四个维度 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">五、燃币的四个维度</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map(([label, text], i) => (
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
          <li>· 游客自动 <strong>{R.guestSeed}</strong> 燃币 → 够读约 {Math.floor(R.guestSeed / R.researchDefaultCost)} 篇调研 / {Math.floor(R.guestSeed / R.resourceDefaultCost)} 个资料。</li>
          <li>· 注册 / 绑定一次性 <strong>{R.register}</strong> 燃币，之后每天签到 +{R.checkin}、评论 +{R.comment}。</li>
          <li>· 调研 {R.researchDefaultCost} / 篇，资料 {R.resourceDefaultCost} / 个，自动使用、永久解锁。</li>
          <li>· 评论奖励每日最多 +{R.commentDailyCap}，流水可查、重复操作不重复记账。</li>
          <li>· 支持本站可用于图床、视频、请求、存储和带宽成本；需要补充燃币可私聊站长。</li>
        </ul>
      </section>
    </PageContainer>
  )
}
