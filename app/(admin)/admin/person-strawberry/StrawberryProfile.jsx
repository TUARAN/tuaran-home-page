import {
  IconAlertTriangle,
  IconBan,
  IconCoinYuan,
  IconFileSearch,
  IconIdBadge2,
  IconLock,
  IconMessageCircle,
  IconReceipt2,
  IconShieldLock,
  IconTimeline,
  IconUserQuestion,
} from '@tabler/icons-react'

import { AdminPage, Section, StatCard, StatusPill } from '../../components/ui'

const PROFILE = [
  ['代称', '草莓'],
  ['年龄段', '00 后（自述）'],
  ['学习方向', '会计相关；本科、读研及延博进度存在不同版本'],
  ['生活状态', '自述生活费较低、社交少、经常无聊并有赚钱需求'],
  ['沟通特点', '短句较多，常主动询问近况；亲密话题与日常冷淡交替出现'],
  ['个人目标', '曾提到做老板、写标书赚钱、购买人体工学椅'],
  ['家庭信息', '曾自述父母离婚；没有独立来源核实'],
]

const TIMELINE = [
  { date: '早期自述', title: '身份与经历信息', detail: '自述为河北高校会计方向学生，曾讲述高中恋爱和家庭情况。所有信息都来自聊天，未作现实身份核验。' },
  { date: '2024 年初', title: '因亲密聊天重新添加', detail: '恢复联系后不久出现购买耳机的需求，并声称记录了一笔约 980 元的欠款。真实性与口径未核验。' },
  { date: '2024.04—05', title: '拉黑后重新添加，联系意愿下降', detail: '再次恢复联系，但到 5 月已明显减少主动联系冲动。' },
  { date: '2024.06.06', title: '虚构到访引发热情回应', detail: '以“已到附近”为由测试反应，对方表现惊喜；当时笔记估算累计转账约 2,800 元。' },
  { date: '2024.09.04', title: '孤独感驱动再次恢复联系', detail: '拉黑后又添加，但记录者同时认为互动价值已经下降。' },
  { date: '2024.11—2025.01', title: '开启三个月亲密付', detail: '每月额度 300 元，三个月共计 900 元；2025 年 1 月停止。' },
  { date: '2025.02.20', title: '再次添加并发送红包', detail: '恢复联系后转账 50 元。' },
  { date: '2025.08.21', title: '双方互删', detail: '关系在这一阶段中断。' },
  { date: '2025.12.30', title: '再次出现越界性话题', detail: '聊天涉及把第三人带入性情境。第三人没有表达同意，不应继续推进或保存相关私密材料。', risk: true },
  { date: '2026.05.21', title: '沉寂后再次转账', detail: '转账 200 元；对方称硕士毕业后继续读博，并计划写标书赚钱、购买人体工学椅。学业说法与早期资料存在冲突。' },
]

const LEDGER = [
  ['贴身衣物', 50, '普通记录'],
  ['原味衣物', 170, '私密交换'],
  ['睡衣', 137, '普通记录'],
  ['私密用品 A', 232.47, '用途自述'],
  ['床垫', 109.4, '普通记录'],
  ['生活费', 100, '红包 / 转账'],
  ['情侣手机壳', 80, '普通记录'],
  ['红包 1', 100, '未细分用途'],
  ['红包 2', 100, '未细分用途'],
  ['私密用品 B', 130, '用途自述'],
  ['2023.05.22 红包', 100, '红包'],
  ['美甲装备、湿纸巾', 200, '原笔记为 200+，按 200 计'],
  ['耳机', 109, '购买需求'],
  ['草莓慕斯蛋糕', 50, '红包'],
  ['羊汤', 50, '红包'],
  ['私密用品 C', 270, '称被家人发现后丢弃'],
  ['农历新年红包', 200, '红包'],
  ['重新添加红包', 100, '恢复联系后'],
  ['期货盈利红包', 200, '红包'],
  ['久未联系更新状态', 230, '红包'],
  ['私密用品 D', 249, '后称物品损坏或丢弃；记录者存疑'],
  ['虚构到访红包', 200, '称已到学校附近'],
  ['餐费红包', 100, '小号恢复联系后'],
  ['见面约定红包', 200, '承诺与实际交付不一致'],
  ['衣物与视频红包', 100, '私密交换'],
  ['红包与鞋', 323, '88×2 + 147'],
]

const LEDGER_TOTAL = LEDGER.reduce((sum, item) => sum + item[1], 0)
const LATER_PAYMENTS = 900 + 50 + 200

const PATTERNS = [
  { title: '间歇性强化', detail: '长时间冷淡、突然恢复亲密聊天、提出消费需求，再次沉寂。不可预测的回应容易让人持续投入。' },
  { title: '金钱与亲密绑定', detail: '红包、礼物和亲密话题多次出现在同一互动周期，容易把付款误认为关系进展。' },
  { title: '信息无法交叉验证', detail: '学业阶段、物品去向、欠款和承诺存在不同说法；目前不足以直接断言欺骗，但应降低可信度。' },
  { title: '拉黑—重加循环', detail: '中断主要依靠情绪化删除，孤独或欲望出现后又恢复联系，边界没有转化为稳定规则。' },
]

function money(value) {
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Timeline() {
  return (
    <ol className="space-y-0">
      {TIMELINE.map((item, index) => (
        <li key={`${item.date}-${item.title}`} className="relative grid gap-2 pb-6 pl-8 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-5 md:pl-10">
          {index < TIMELINE.length - 1 ? <span className="absolute left-[9px] top-5 h-full w-px bg-[#dadccf] dark:bg-[#2b3643]" aria-hidden="true" /> : null}
          <span className={`absolute left-0 top-1.5 h-[19px] w-[19px] rounded-full border-4 border-white dark:border-[#10161f] ${item.risk ? 'bg-rose-500' : 'bg-[#8a916e]'}`} aria-hidden="true" />
          <p className="font-mono text-[11px] font-semibold text-[#777a6e] dark:text-gray-400">{item.date}</p>
          <article className={`rounded-xl border p-4 ${item.risk ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/70 dark:bg-rose-950/20' : 'border-[#e1e2da] bg-white dark:border-[#26303c] dark:bg-[#10161f]'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[#2f3129] dark:text-gray-100">{item.title}</h3>
              {item.risk ? <StatusPill tone="danger" size="sm">隐私 / 同意风险</StatusPill> : null}
            </div>
            <p className="mt-2 text-xs leading-6 text-[#66695e] dark:text-gray-400">{item.detail}</p>
          </article>
        </li>
      ))}
    </ol>
  )
}

function LedgerTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e1e2da] dark:border-[#26303c]">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-[#f3f3ed] text-[#67695f] dark:bg-[#151e28] dark:text-gray-400">
          <tr><th className="px-4 py-3 font-medium">项目</th><th className="px-4 py-3 text-right font-medium">金额</th><th className="px-4 py-3 font-medium">记录口径</th></tr>
        </thead>
        <tbody className="divide-y divide-[#ecece5] bg-white dark:divide-[#222d39] dark:bg-[#10161f]">
          {LEDGER.map(([label, amount, note]) => (
            <tr key={`${label}-${amount}`}>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-[#42443b] dark:text-gray-200">{label}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-[#34362f] dark:text-gray-200">¥{money(amount)}</td>
              <td className="min-w-[240px] px-4 py-3 leading-5 text-[#777a6e] dark:text-gray-500">{note}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-[#f7f6f1] font-semibold dark:bg-[#151e28]">
          <tr><td className="px-4 py-3">逐项小计</td><td className="px-4 py-3 text-right font-mono tabular-nums">¥{money(LEDGER_TOTAL)}</td><td className="px-4 py-3 text-[#777a6e] dark:text-gray-400">26 项直接求和</td></tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function StrawberryProfile() {
  return (
    <AdminPage
      title="草莓专题"
      description="用代称记录一段长期私人关系：区分对方自述、可核对账目和个人推断，避免把搜索私人身份当成关系确认。"
      actions={<StatusPill tone="neutral"><IconLock size={13} />仅站长可见 · 已脱敏</StatusPill>}
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#dadccf] bg-[#f4f3eb] p-5 dark:border-[#2a3542] dark:bg-[#121a23] md:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a916e] dark:text-[#b1ba91]">人物专题 · private</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#1c1d18] dark:text-gray-100">草莓</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#56594f] dark:text-gray-300">关系的主要结构是：孤独或欲望触发恢复联系，亲密互动与转账交织，随后因失望或警惕中断。真正可行动的信息来自支付流水、明确承诺和实际交付；聊天中的身份、学业与生活说法均保留为“对方自述”。</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100"><IconAlertTriangle size={18} />记录边界</div>
              <p className="mt-2 text-xs leading-6 text-amber-800/80 dark:text-amber-200/80">不记录真实姓名、具体院校或可定位地点；不保存、转发第三人的脸照或私密照片；不继续搜索普通人的现实身份和行踪。</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="关系跨度" value="2024—2026" sub="此前经历仅为自述" icon="planning" />
          <StatCard label="账目行数" value={LEDGER.length} sub="逐项记录" icon="audit" />
          <StatCard label="表内小计" value={`¥${money(LEDGER_TOTAL)}`} sub="原总计少算 1,144 元" icon="ranbi" tone="warning" />
          <StatCard label="含后续款项上界" value={`¥${money(LEDGER_TOTAL + LATER_PAYMENTS)}`} sub="若 900 + 50 + 200 均未重复" icon="analytics" tone="danger" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Section title="人物画像：只保留自述" description="信息没有独立核验，不作为现实身份判断。" actions={<IconIdBadge2 size={18} className="text-[#8a916e]" />}>
            <dl className="divide-y divide-[#ecece5] dark:divide-[#222d39]">
              {PROFILE.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
                  <dt className="text-xs font-medium text-[#777a6e] dark:text-gray-500">{label}</dt>
                  <dd className="text-sm leading-6 text-[#41433b] dark:text-gray-300">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="关系模式" description="描述互动结构，不给对方作人格或临床诊断。" actions={<IconMessageCircle size={18} className="text-[#8a916e]" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              {PATTERNS.map((item, index) => (
                <article key={item.title} className="rounded-xl border border-[#e1e2da] bg-[#fafaf6] p-4 dark:border-[#26303c] dark:bg-[#0d141c]">
                  <p className="font-mono text-[10px] text-[#989a8f]">0{index + 1}</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#36382f] dark:text-gray-100">{item.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[#707368] dark:text-gray-400">{item.detail}</p>
                </article>
              ))}
            </div>
          </Section>
        </div>

        <Section title="联系时间线" description="时间、转账与状态变化优先；聊天说法标记为自述。" actions={<IconTimeline size={18} className="text-[#8a916e]" />}>
          <Timeline />
        </Section>

        <Section title="资金账目" description="原表写总计 ¥2,745.87；26项逐项求和实际为 ¥3,889.87，相差 ¥1,144.00。后续亲密付与红包可能和表内项目重复，暂不强行合并。" actions={<IconReceipt2 size={18} className="text-[#8a916e]" />}>
          <LedgerTable />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[#e1e2da] p-3.5 dark:border-[#26303c]"><p className="text-xs text-[#777a6e]">表内逐项小计</p><p className="mt-1 font-mono text-lg font-semibold">¥{money(LEDGER_TOTAL)}</p></div>
            <div className="rounded-lg border border-[#e1e2da] p-3.5 dark:border-[#26303c]"><p className="text-xs text-[#777a6e]">表外明确提及</p><p className="mt-1 font-mono text-lg font-semibold">¥{money(LATER_PAYMENTS)}</p><p className="mt-1 text-[11px] text-[#929489]">亲密付 900 + 红包 50 + 转账 200</p></div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/70 dark:bg-amber-950/20"><p className="text-xs text-amber-800 dark:text-amber-200">不重复时的可能上界</p><p className="mt-1 font-mono text-lg font-semibold text-amber-900 dark:text-amber-100">¥{money(LEDGER_TOTAL + LATER_PAYMENTS)}</p><p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">需用支付平台流水去重</p></div>
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="检索结论" description="搜索引擎不是私人关系的核验工具。" actions={<IconFileSearch size={18} className="text-[#8a916e]" />}>
            <div className="space-y-3 text-sm leading-7 text-[#5f6257] dark:text-gray-300">
              <p>围绕代称、院校与地域组合搜索，没有找到可以可靠对应到现实身份的公开记录。这不构成“身份为假”的证据，也不应继续扩大检索范围。</p>
              <p>普通人是否能被搜索到，取决于其是否进入公开记录系统。搜索结果不能替代直接沟通、支付流水、可验证承诺和双方约定。</p>
              <p className="rounded-lg border border-[#e1e2da] bg-[#f8f8f3] p-3 text-xs leading-6 dark:border-[#26303c] dark:bg-[#0d141c]">停止使用真实姓名、同学信息、具体学校和照片做交叉定位；这条边界同时保护对方、无关第三人和记录者自己。</p>
            </div>
          </Section>

          <Section title="下一步边界" description="把“警惕”改写成可以执行的规则。" actions={<IconShieldLock size={18} className="text-emerald-600" />}>
            <ul className="space-y-3">
              {[
                [IconBan, '90 天不转账', '不以红包、礼物或亲密付换取回应、照片、承诺或关系进展。'],
                [IconCoinYuan, '只认支付流水', '按日期、金额和平台去重；聊天中的“累计”“欠款”不直接计入。'],
                [IconUserQuestion, '自述保持待核验', '学业、物品去向和未来计划不急于判断真假，只据此决定是否付款。'],
                [IconShieldLock, '删除第三人私密材料', '若仍持有室友或其他第三人的私密照片，应删除且不传播。'],
              ].map(([Icon, title, detail]) => (
                <li key={title} className="flex gap-3 rounded-lg border border-[#e1e2da] p-3.5 dark:border-[#26303c]">
                  <Icon size={18} className="mt-0.5 shrink-0 text-[#8a916e]" aria-hidden="true" />
                  <div><h3 className="text-sm font-semibold text-[#34362f] dark:text-gray-100">{title}</h3><p className="mt-1 text-xs leading-6 text-[#74776c] dark:text-gray-400">{detail}</p></div>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </AdminPage>
  )
}
