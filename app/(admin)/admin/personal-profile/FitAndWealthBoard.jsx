import {
  IconArrowRight,
  IconBan,
  IconCheck,
  IconCoin,
  IconDiamond,
  IconScale,
} from '@tabler/icons-react'

import { StatusPill } from '../../components/ui'
import { FIT_AND_WEALTH } from '../../../../lib/personalGrowthProfile'

const OFFER_TONES = {
  '主收口': {
    pill: 'success',
    card: 'border-[#cfd8c4] bg-[linear-gradient(180deg,#f7f8f1_0%,#ffffff_42%)] dark:border-[#31402f] dark:bg-[linear-gradient(180deg,#162018_0%,#0f161f_48%)]',
    number: 'text-[#7f8863]/20 dark:text-white/10',
  },
  '副收口': {
    pill: 'warning',
    card: 'border-[#e4d7b8] bg-[linear-gradient(180deg,#f8f3e6_0%,#ffffff_42%)] dark:border-[#3d3728] dark:bg-[linear-gradient(180deg,#1c1a14_0%,#0f161f_48%)]',
    number: 'text-[#9a7b3c]/20 dark:text-white/10',
  },
  '杠杆': {
    pill: 'info',
    card: 'border-[#d5d7e4] bg-[linear-gradient(180deg,#f3f3f8_0%,#ffffff_42%)] dark:border-[#2d3548] dark:bg-[linear-gradient(180deg,#161821_0%,#0f161f_48%)]',
    number: 'text-[#5d6a8c]/20 dark:text-white/10',
  },
}

function EdgeFormula() {
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {FIT_AND_WEALTH.edge.parts.map((part, index) => (
          <div key={part.id} className="flex min-w-0 flex-1 items-stretch gap-2">
            <article className="min-w-0 flex-1 rounded-xl border border-white/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-black/20">
              <p className="font-mono text-[10px] tracking-[0.16em] text-[#9a7b3c] dark:text-[#d4b36a]">0{index + 1}</p>
              <h3 className="mt-1 font-serif text-lg font-semibold text-[#2a2c24] dark:text-gray-100">{part.label}</h3>
              <p className="mt-1 text-xs leading-6 text-[#6d7066] dark:text-gray-400">{part.note}</p>
            </article>
            {index < FIT_AND_WEALTH.edge.parts.length - 1 ? (
              <span className="hidden shrink-0 items-center font-serif text-xl text-[#b7a277] lg:flex dark:text-[#8d7a4e]" aria-hidden="true">×</span>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-[#6a6d62] dark:text-gray-400">
        <IconArrowRight size={14} className="mt-1 shrink-0 text-[#9a7b3c]" aria-hidden="true" />
        <span>优先服务：{FIT_AND_WEALTH.edge.result}</span>
      </p>
    </div>
  )
}

function LayerRail() {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {FIT_AND_WEALTH.layers.map((layer, index) => (
        <article key={layer.id} className="rounded-xl border border-[#e4e0d2] bg-[#fbfaf5] p-4 dark:border-[#2f3844] dark:bg-[#10171f]">
          <div className="flex items-center justify-between gap-3">
            <StatusPill tone={index === 0 ? 'info' : index === 1 ? 'warning' : 'success'} size="sm">{layer.label}</StatusPill>
            <span className="font-mono text-[11px] text-[#b1b3a8]">0{index + 1}</span>
          </div>
          <h3 className="mt-3 font-serif text-lg font-semibold text-[#2b2d25] dark:text-gray-100">{layer.title}</h3>
          <p className="mt-2 text-xs leading-6 text-[#74776b] dark:text-gray-400">{layer.asset}</p>
          <p className="mt-3 border-t border-dashed border-[#e0dccf] pt-3 text-xs leading-6 text-[#5f6258] dark:border-[#343f4c] dark:text-gray-300">{layer.capture}</p>
        </article>
      ))}
    </div>
  )
}

function OfferGrid() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {FIT_AND_WEALTH.offers.map((offer, index) => {
        const tone = OFFER_TONES[offer.rank]
        return (
          <article key={offer.id} className={`relative overflow-hidden rounded-xl border p-4 ${tone.card}`}>
            <span className={`pointer-events-none absolute -right-1 -top-3 font-serif text-7xl font-semibold leading-none ${tone.number}`} aria-hidden="true">
              0{index + 1}
            </span>
            <StatusPill tone={tone.pill} size="sm">{offer.rank}</StatusPill>
            <h3 className="relative mt-3 font-serif text-xl font-semibold text-[#262820] dark:text-gray-100">{offer.title}</h3>
            <p className="relative mt-2 text-sm leading-7 text-[#5c5f55] dark:text-gray-300">{offer.summary}</p>
            <p className="relative mt-4 border-t border-dashed border-[#d8d0b8] pt-3 text-xs leading-6 text-[#7a6a45] dark:border-[#3a4033] dark:text-[#cbb890]">
              怎么收：{offer.capture}
            </p>
          </article>
        )
      })}
    </div>
  )
}

function PairList({ title, items, tone }) {
  const isFit = tone === 'fit'
  return (
    <section className={`rounded-xl border p-4 ${isFit ? 'border-[#d5ddc8] bg-[#f6f7f1] dark:border-[#2d3b2e] dark:bg-[#121a15]' : 'border-[#ead9d4] bg-[#faf5f3] dark:border-[#3b2f32] dark:bg-[#1a1416]'}`}>
      <div className="flex items-center gap-2">
        {isFit ? <IconCheck size={16} className="text-emerald-700 dark:text-emerald-400" aria-hidden="true" /> : <IconBan size={16} className="text-rose-700 dark:text-rose-300" aria-hidden="true" />}
        <h3 className="text-sm font-semibold text-[#2c2e26] dark:text-gray-100">{title}</h3>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.title} className="rounded-lg bg-white/70 px-3 py-2.5 dark:bg-black/20">
            <p className="text-sm font-medium text-[#33362d] dark:text-gray-100">{item.title}</p>
            <p className="mt-1 text-xs leading-6 text-[#6f7267] dark:text-gray-400">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function FitAndWealthBoard() {
  const experiment = FIT_AND_WEALTH.experiment

  return (
    <section id="fit-and-wealth" className="overflow-hidden rounded-2xl border border-[#ddd4bc] bg-white dark:border-[#2f3840] dark:bg-[#0f161f]">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#efe6d2_0%,#e8eee3_52%,#e7e3d4_100%)] dark:bg-[linear-gradient(135deg,#1c1a14_0%,#141b18_52%,#191612_100%)]">
        <p className="pointer-events-none absolute -right-4 -top-8 hidden font-serif text-[9rem] leading-none text-[#9a7b3c]/10 lg:block dark:text-white/5" aria-hidden="true">值</p>
        <div className="relative p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="warning"><IconDiamond size={13} />{FIT_AND_WEALTH.kicker}</StatusPill>
            <span className="font-mono text-[11px] text-[#7d7768] dark:text-gray-400">记录于 {FIT_AND_WEALTH.recordedAt}</span>
          </div>
          <h2 className="mt-4 max-w-3xl font-serif text-[1.45rem] font-semibold leading-snug tracking-[-0.02em] text-[#241f16] dark:text-gray-100 md:text-3xl md:leading-tight">
            {FIT_AND_WEALTH.title}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#534e42] dark:text-gray-300">{FIT_AND_WEALTH.thesis}</p>
          <EdgeFormula />
        </div>
      </div>

      <div className="space-y-5 border-t border-[#eadfca] p-4 md:p-6 dark:border-[#2c3744]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <IconCoin size={16} className="text-[#9a7b3c]" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#2c2e26] dark:text-gray-100">财富三层，不要摊成七摊</h3>
          </div>
          <LayerRail />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#2c2e26] dark:text-gray-100">三个收口</h3>
          <OfferGrid />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <PairList title="适合服务" items={FIT_AND_WEALTH.audiences} tone="fit" />
          <PairList title="主动避开" items={FIT_AND_WEALTH.avoid} tone="avoid" />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <IconScale size={16} className="text-[#7f8863]" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#2c2e26] dark:text-gray-100">把性格从负债变成资产</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {FIT_AND_WEALTH.operatingRules.map((rule, index) => (
              <article key={rule.title} className="rounded-xl border border-[#e4e2d8] bg-[#fafaf6] px-3.5 py-3 dark:border-[#27323e] dark:bg-[#0d141c]">
                <p className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] text-[#9a7b3c]">0{index + 1}</span>
                  <span className="text-sm font-semibold text-[#33362d] dark:text-gray-100">{rule.title}</span>
                </p>
                <p className="mt-1.5 text-xs leading-6 text-[#6f7267] dark:text-gray-400">{rule.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#d8cbae] bg-[#2a281f] px-5 py-5 text-[#f4efe3] dark:border-[#3a3428] dark:bg-[#16140f] md:px-6">
        <p className="font-mono text-[11px] tracking-[0.18em] text-[#d4b36a]">{experiment.title}</p>
        <p className="mt-2 font-serif text-xl font-semibold tracking-[-0.02em]">{experiment.statement}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#d8d1c2]">{experiment.example}</p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {experiment.phases.map((item, index) => (
            <article key={item.phase} className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-3">
              <p className="font-mono text-[10px] text-[#d4b36a]">0{index + 1} · {item.phase}</p>
              <p className="mt-1.5 text-sm text-[#f4efe3]">{item.title}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-6 text-[#c4bba8]">{experiment.failRule}</p>
      </div>

      <p className="border-t border-[#eadfca] bg-[#f7f3ea] px-5 py-3 text-xs leading-6 text-[#7a7466] dark:border-[#2c3744] dark:bg-black/20 dark:text-gray-500">
        {FIT_AND_WEALTH.disclaimer}
      </p>
    </section>
  )
}
