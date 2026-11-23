/**
 * 「付费解锁」角标。由 D1 gated_resources.price_fen > 0 自动派生，
 * 不写文章 frontmatter、不占用 tags、不新增数据库列。
 * 只做展示标记，是否真的需要付费仍由 RanbiPaywall / 支付接口判定。
 */
export default function PaidUnlockBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d8bd86] bg-[#fbf3de] px-2 py-[2px] text-[10px] font-semibold leading-none text-[#7a5b1e] dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 ${className}`}
      aria-label="付费解锁内容"
    >
      <span aria-hidden="true">◆</span>
      付费解锁
    </span>
  )
}
