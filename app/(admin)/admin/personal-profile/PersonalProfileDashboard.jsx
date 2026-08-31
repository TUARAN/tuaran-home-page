import Image from 'next/image'
import {
  IconArrowRight,
  IconBrain,
  IconCheck,
  IconFilePencil,
  IconLeaf,
  IconLock,
  IconRefresh,
  IconSparkles,
  IconTargetArrow,
} from '@tabler/icons-react'

import { AdminPage, Section, StatCard, StatusPill } from '../../components/ui'
import {
  CREATION_VALUE_LOOP,
  GROWTH_DIRECTIONS,
  NINETY_DAY_PLAN,
  PERSONAL_GROWTH_PROFILE,
  WEEKLY_REVIEW,
} from '../../../../lib/personalGrowthProfile'

function DirectionCard({ item, index }) {
  return (
    <article className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#283340] dark:bg-[#0f161f]">
      <div className="flex items-center justify-between gap-3">
        <StatusPill tone={index === 0 ? 'info' : index === 1 ? 'warning' : 'success'} size="sm">{item.horizon}</StatusPill>
        <span className="font-mono text-xs text-[#a1a397]">0{index + 1}</span>
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold text-[#272920] dark:text-gray-100">{item.title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#5e6156] dark:text-gray-300">{item.outcome}</p>
      <ul className="mt-4 space-y-2.5">
        {item.practices.map((practice) => (
          <li key={practice} className="flex items-start gap-2 text-xs leading-6 text-[#686b60] dark:text-gray-400">
            <IconCheck size={15} className="mt-1 shrink-0 text-[#7f8863]" aria-hidden="true" />
            <span>{practice}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-dashed border-[#dcded4] pt-3 text-xs leading-6 text-[#85877d] dark:border-[#303b48] dark:text-gray-500">
        观察信号：{item.signal}
      </p>
    </article>
  )
}

export default function PersonalProfileDashboard() {
  return (
    <AdminPage
      title="个人画像"
      description="把人格偏好当作一组待验证的自我观察，持续连接到行动、作品与价值回收。"
      actions={<StatusPill tone="neutral"><IconLock size={13} />仅站长可见</StatusPill>}
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[#d8dacd] bg-[linear-gradient(135deg,#f3f0df_0%,#edf1e7_48%,#e9e7f2_100%)] dark:border-[#2c3744] dark:bg-[linear-gradient(135deg,#172018_0%,#121b1c_48%,#191725_100%)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="success"><IconLeaf size={13} />{PERSONAL_GROWTH_PROFILE.type}</StatusPill>
                <span className="font-mono text-[11px] text-[#797b70] dark:text-gray-400">记录于 {PERSONAL_GROWTH_PROFILE.recordedAt}</span>
              </div>
              <h2 className="mt-4 max-w-3xl font-serif text-2xl font-semibold tracking-[-0.02em] text-[#1e261d] dark:text-gray-100 md:text-3xl">
                {PERSONAL_GROWTH_PROFILE.title} 🌿
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4f584d] dark:text-gray-300">{PERSONAL_GROWTH_PROFILE.summary}</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62655b] dark:text-gray-400">{PERSONAL_GROWTH_PROFILE.friction}</p>
              <div className="mt-5 rounded-xl border border-white/70 bg-white/60 p-4 dark:border-white/10 dark:bg-black/15">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#33402f] dark:text-[#d9e2d3]"><IconSparkles size={17} />成长提醒</p>
                <p className="mt-2 text-sm leading-7 text-[#596154] dark:text-gray-300">{PERSONAL_GROWTH_PROFILE.reminder}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {PERSONAL_GROWTH_PROFILE.tags.map((tag) => <span key={tag} className="rounded-full border border-[#cfd4c8] bg-white/60 px-2.5 py-1 text-[11px] text-[#686d62] dark:border-[#3a4651] dark:bg-black/10 dark:text-gray-400">#{tag}</span>)}
              </div>
            </div>
            <div className="relative min-h-[22rem] border-t border-white/70 bg-[#d9ddce] dark:border-white/10 dark:bg-[#111820] lg:min-h-0 lg:border-l lg:border-t-0">
              <Image src="/images/admin/infp-t-profile.png" alt="INFP-T 敏感的理想主义者画像参考图" fill sizes="(min-width: 1024px) 320px, 100vw" className="object-cover object-top" priority />
            </div>
          </div>
          <p className="border-t border-[#d5d8cb] bg-white/45 px-5 py-3 text-xs leading-6 text-[#72766b] dark:border-[#2c3744] dark:bg-black/10 dark:text-gray-400">
            {PERSONAL_GROWTH_PROFILE.disclaimer}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="核心优势" value="共情 × 想象" sub="理解隐性需要，提供有温度的解释" icon="personProfile" tone="success" />
          <StatCard label="主要摩擦" value="内耗 × 迟滞" sub="揣摩、避冲突、高标准" icon="audit" tone="warning" />
          <StatCard label="当前策略" value="小步交付" sub="30 分钟下一步，70 分首版" icon="todo" tone="info" />
          <StatCard label="迭代周期" value="90 天" sub="观察、系列、价值验证" icon="planning" />
        </div>

        <Section title="成长的大方向" description="先稳住内在底盘，再训练交付能力，最后让长期价值形成复利。" actions={<IconTargetArrow size={19} className="text-[#7f8863]" />}>
          <div className="grid gap-3 lg:grid-cols-3">
            {GROWTH_DIRECTIONS.map((item, index) => <DirectionCard key={item.id} item={item} index={index} />)}
          </div>
        </Section>

        <Section title="创作价值闭环" description="敏感负责发现问题，验证与交付负责把洞察变成别人可以使用的价值。" actions={<IconRefresh size={18} className="text-[#7f8863]" />}>
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {CREATION_VALUE_LOOP.map((item, index) => (
              <article key={item.step} className="relative min-w-0 rounded-xl border border-[#e2e3db] bg-[#fafaf6] p-3.5 dark:border-[#27323e] dark:bg-[#0d141c]">
                  <p className="font-mono text-[10px] text-[#999b90]">0{index + 1}</p>
                  <h3 className="mt-1.5 text-sm font-semibold text-[#33362d] dark:text-gray-100">{item.step}</h3>
                  <p className="mt-2 text-xs leading-6 text-[#707369] dark:text-gray-400">{item.detail}</p>
                  {index < CREATION_VALUE_LOOP.length - 1 ? <IconArrowRight size={15} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white text-[#a6a99e] xl:block dark:bg-[#0d141c]" aria-hidden="true" /> : null}
              </article>
            ))}
          </div>
          <div className="mt-4 rounded-lg border-l-4 border-[#8c956f] bg-[#f3f5ed] px-4 py-3 text-sm leading-7 text-[#575d50] dark:bg-[#151e18] dark:text-gray-300">
            你的差异化可以落在“工程师的结构化能力 + 创作者的解释力 + 高敏感的共情力”。优先服务那些问题复杂、情绪成本高、又需要可执行方案的人群。
          </div>
        </Section>

        <Section title="90 天演进路线" description="每 30 天只改变一个主要变量，并用可观察结果决定下一轮。">
          <div className="grid gap-3 lg:grid-cols-3">
            {NINETY_DAY_PLAN.map((item, index) => (
              <article key={item.phase} className="rounded-xl border border-[#e0e1d8] p-4 dark:border-[#283340]">
                <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7f8863] font-mono text-xs text-white">{index + 1}</span><p className="font-mono text-[11px] font-semibold text-[#7d806f] dark:text-gray-400">{item.phase}</p></div>
                <h3 className="mt-3 font-serif text-lg font-semibold text-[#2b2e25] dark:text-gray-100">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#74776b] dark:text-gray-400">{item.focus}</p>
                <ul className="mt-3 space-y-2">
                  {item.actions.map((action) => <li key={action} className="flex items-start gap-2 text-xs leading-6 text-[#5f6258] dark:text-gray-300"><IconCheck size={14} className="mt-1 shrink-0 text-emerald-600" />{action}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
          <Section title="每周复盘" description="固定在周末用 15 分钟回答，答案控制在事实和下一步。" actions={<IconFilePencil size={18} className="text-[#7f8863]" />}>
            <ol className="space-y-2.5">
              {WEEKLY_REVIEW.map((question, index) => <li key={question} className="flex items-start gap-3 rounded-lg bg-[#fafaf6] px-3.5 py-3 text-sm leading-6 text-[#55594e] dark:bg-[#0d141c] dark:text-gray-300"><span className="font-mono text-[11px] text-[#9b9d91]">0{index + 1}</span><span>{question}</span></li>)}
            </ol>
          </Section>
          <Section title="判断是否在创造价值" description="关注真实使用与交换，弱化单一流量带来的情绪波动。" actions={<IconBrain size={18} className="text-[#7f8863]" />}>
            <div className="space-y-3">
              {[
                ['使用价值', '有人保存、照做、复用或因作品减少决策成本。'],
                ['关系价值', '吸引同频读者、同行与潜在合作方持续交流。'],
                ['资产价值', '内容沉淀为专题、工具、数据、方法或可组合的产品。'],
                ['交换价值', '获得订阅、转介绍、咨询、合作、销售或赞助。'],
              ].map(([title, detail]) => <article key={title} className="rounded-lg border border-dashed border-[#d5d7ce] p-3.5 dark:border-[#33404d]"><h3 className="text-sm font-semibold text-[#34372e] dark:text-gray-100">{title}</h3><p className="mt-1.5 text-xs leading-6 text-[#74776d] dark:text-gray-400">{detail}</p></article>)}
            </div>
          </Section>
        </div>
      </div>
    </AdminPage>
  )
}
