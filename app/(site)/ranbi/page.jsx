import PageContainer from '../components/PageContainer'
import RanbiBalance from '../components/RanbiBalance'
import { POINT_RULES } from '../../../lib/points'

export const dynamic = 'force-static'

export const metadata = {
  title: '获取燃币 · 这是什么，怎么赚怎么用',
  description:
    '燃币是 2aran.com 的站内阅读货币：游客自动获得 50，注册得 100，签到/评论可继续赚；调研每篇 5 燃币、资料每个 10 燃币，自动扣费、解锁后永久可读。',
  keywords: ['燃币', '获取燃币', '涂阿燃', 'tuaran', '积分', '阅读货币', '签到', '解锁'],
  alternates: { canonical: '/ranbi' },
}

const R = POINT_RULES
const commentMaxPerDay = Math.floor(R.commentDailyCap / R.comment)

const EARN_ROWS = [
  ['游客自动发放', `+${R.guestSeed}`, '首次访问自动到账，无需任何操作', '一次性'],
  ['注册 / 绑定登录', `+${R.register}`, '用 GitHub / Google 绑定账号即得', '一次性'],
  ['每日签到', `+${R.checkin}`, '登录后在余额处点「签到」', '每天'],
  ['有效评论', `+${R.comment}`, `每条有效评论，单日最多 +${R.commentDailyCap}（约 ${commentMaxPerDay} 条）`, '每天'],
]

const SPEND_ROWS = [
  ['调研文章', `${R.researchDefaultCost} / 篇`, '公司 / 事项 / 人物调研，打开即自动结算'],
  ['资料 / 资源主题页', `${R.resourceDefaultCost} / 个`, '古典名篇、儒释道、政经资料、历史、书目等'],
]

const DIMENSIONS = [
  ['身份', '游客也有燃币（按匿名身份发放）；绑定登录后转为正式账号，额度更高、可签到可评论赚币。'],
  ['获取', `自动发放 + 主动赚取两条线：游客 ${R.guestSeed}、注册 ${R.register} 是底子，签到 +${R.checkin}/天、评论 +${R.comment}/条 是细水长流。`],
  ['消耗', `按内容价值分档：调研 ${R.researchDefaultCost}、资料 ${R.resourceDefaultCost}。打开内容即自动扣费，不用点按钮，底部给个轻提示。`],
  ['权益', '解锁一次，永久可读——同一篇反复打开、刷新都不再扣费；绑定账号后，游客期间解锁过的内容继续免费。'],
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
          获取燃币
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
          燃币是本站的「阅读货币」。它不能充值、不能提现，只用来解锁站内深度内容——
          调研与资料。设计它，是为了让认真读的人留下来，而不是把内容当作一次性流量。
        </p>
        <div className="mt-5">
          <RanbiBalance />
        </div>
      </header>

      {/* 它是什么 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">一、它是什么</h2>
        <p className="text-[14px] leading-7 text-[var(--site-muted)]">
          一句话：<span className="font-medium text-[var(--site-ink)]">燃币 = 站内通用的内容解锁额度</span>。
          每个访客一来就有，能读不少东西；读得多、或想读更深的内容，就需要把额度赚回来或注册拿更多。
          它<strong className="text-[var(--site-ink)]">不涉及任何真实货币</strong>，纯粹是阅读与互动的激励刻度。
        </p>
      </section>

      {/* 怎么赚 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">二、怎么获得（赚）</h2>
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
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">三、怎么消耗（用）</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--site-panel)]">
                <Th>内容</Th>
                <Th className="whitespace-nowrap">单价</Th>
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
          打开内容时<strong className="text-[var(--site-ink)]">自动扣费</strong>，不需要点任何按钮，底部弹一个几秒后消失的轻提示；
          <strong className="text-[var(--site-ink)]">解锁后永久可读</strong>，反复打开、刷新都不再扣。余额不够时才会拦截，并引导你注册补齐。
        </p>
      </section>

      {/* 四个维度 */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-[20px] text-[var(--site-ink)]">四、燃币的四个维度</h2>
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
          <li>· 调研 {R.researchDefaultCost} / 篇，资料 {R.resourceDefaultCost} / 个，自动扣费、永久解锁。</li>
          <li>· 不涉及真实货币，纯站内阅读激励。</li>
        </ul>
      </section>
    </PageContainer>
  )
}
