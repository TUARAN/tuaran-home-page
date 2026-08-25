import {
  IconAlertTriangle,
  IconArrowRight,
  IconBarbell,
  IconBrain,
  IconCar,
  IconCheck,
  IconClock,
  IconHeartHandshake,
  IconLock,
  IconRefresh,
  IconShieldCheck,
} from '@tabler/icons-react'

import { AdminPage, Section, StatCard, StatusPill } from '../../components/ui'

const TIMELINE = [
  {
    date: '2022.08.17',
    title: '屏幕刺激与情绪摩擦叠加',
    type: '色情内容 / 自慰',
    summary: '调休并在线办公，屏幕刺激后完成一次自慰；随后因家务反馈产生明显负面情绪。',
    signal: '空闲、独处、屏幕可得性和被否定感同时出现。',
  },
  {
    date: '2022.08（周末）',
    title: '无安排时反复切换游戏与色情内容',
    type: '色情内容 / 自慰',
    summary: '伴侣外出时独自在家，游戏间隙持续观看色情内容，最终完成一次自慰。',
    signal: '周末缺少结构，是早期记录中最稳定的触发条件之一。',
  },
  {
    date: '2022.08.25—08.27',
    title: '下载—浏览—删除—重装循环',
    type: '色情内容 / 自慰',
    summary: '连续数日反复使用 Telegram 等渠道搜索刺激内容，事后删除，随后又重新安装。',
    signal: '控制策略主要依靠事后卸载，未处理空闲和入口可得性。',
  },
  {
    date: '2022.08.30',
    title: '伴侣亲密行为需要单独复盘同意',
    type: '伴侣性生活',
    summary: '记录提到对方没有动作、全程沉默。仅凭文字不能判断当时意愿，但沉默不能代替明确同意。',
    signal: '今后的亲密行为必须确认对方自由、清楚且持续地愿意。',
    risk: true,
  },
  {
    date: '2022（日期未标）',
    title: '关系外接触与身体恢复感受',
    type: '关系 / 性健康',
    summary: '记录了一次关系外性接触，并描述此后约两周状态不佳。',
    signal: '需要按关系约定、安全措施和真实症状分别处理，不能归因于所谓“精力耗尽”。',
    risk: true,
  },
  {
    date: '2025.02.24—02.25',
    title: '第一次连续戒断尝试很快中断',
    type: '控制尝试',
    summary: '第一天长时间观看色情内容但没有自慰；第二天发生自慰并出现强烈懊恼。',
    signal: '只用“有没有射精”判定成败，忽略了色情内容占用时间这一核心行为。',
  },
  {
    date: '2025.04.25',
    title: '开始采用“上瘾—痛苦”解释框架',
    type: '自我叙事',
    summary: '把承认上瘾、直面痛苦和在痛苦中坚持作为改变纲领。',
    signal: '承认困难有价值，但把全部性欲解释成成瘾会放大羞耻。',
  },
  {
    date: '2025.06.12',
    title: '首次整理半年频率与场景',
    type: '阶段总结',
    summary: '原统计显示1—5月大多每月5—6个节点，常见于午休、车内、卫生间或洗澡时。',
    signal: '统计混入梦遗等不同事件；频率本身不能替代功能损害评估。',
  },
  {
    date: '2025.10.31',
    title: '梦遗后的持续唤起与驾驶风险',
    type: '梦遗 / 色情内容 / 伴侣性生活',
    summary: '梦遗后仍持续燥热，记录出现驾驶过程中寻找色情内容，随后与伴侣发生性生活。',
    signal: '梦遗是非自主事件；驾驶时使用色情内容属于需要立即清零的安全风险。',
    risk: true,
  },
]

const TRIGGERS = [
  { title: '无聊与空档', detail: '独自在家、午休、周末无安排、洗澡和停车等待。' },
  { title: '压力与否定感', detail: '工作重复、家事、照顾压力、生病、争执和受到批评。' },
  { title: '低摩擦入口', detail: '手机、Telegram、短视频和私密空间使刺激随手可得。' },
  { title: '羞耻反弹', detail: '事后自我辱骂、删除软件、发誓永久禁止，随后再次恢复。' },
]

const FOUR_WEEK_PLAN = [
  {
    week: '第 1 周',
    title: '先守住三条边界',
    tasks: ['驾驶时不搜索或观看色情内容', '工作场所不观看、不实施性行为', '亲密行为只在明确、持续同意下进行'],
  },
  {
    week: '第 2 周',
    title: '替换高风险空档',
    tasks: ['午休固定快走 20 分钟', '手机不带入卫生间', '周末提前安排一段户外活动'],
  },
  {
    week: '第 3 周',
    title: '建立锻炼底盘',
    tasks: ['两次 20—30 分钟全身力量训练', '三次中等强度步行或慢跑', '只记录是否出现，不追求完美强度'],
  },
  {
    week: '第 4 周',
    title: '按影响复盘',
    tasks: ['记录色情内容使用分钟数', '标注工作、安全、关系和睡眠影响', '保留有效环境调整，删除无效惩罚'],
  },
]

function TimelineItem({ item, last }) {
  return (
    <li className="relative grid gap-3 pb-6 pl-8 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6 md:pl-10">
      {!last ? <span className="absolute left-[9px] top-5 h-full w-px bg-[#d9dccf] dark:bg-[#2a3543]" aria-hidden="true" /> : null}
      <span className={`absolute left-0 top-1.5 h-[19px] w-[19px] rounded-full border-4 border-white dark:border-[#10161f] ${item.risk ? 'bg-rose-500' : 'bg-[#7f8863]'}`} aria-hidden="true" />
      <div>
        <p className="font-mono text-[11px] font-semibold text-[#72756a] dark:text-gray-400">{item.date}</p>
        <p className="mt-1 text-[11px] text-[#96988d] dark:text-gray-500">{item.type}</p>
      </div>
      <article className={`rounded-xl border p-4 ${item.risk ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/70 dark:bg-rose-950/20' : 'border-[#e0e1d8] bg-white dark:border-[#252e39] dark:bg-[#10161f]'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-[#25261f] dark:text-gray-100">{item.title}</h3>
          {item.risk ? <StatusPill tone="danger" size="sm">风险节点</StatusPill> : null}
        </div>
        <p className="mt-2 text-sm leading-7 text-[#56584f] dark:text-gray-300">{item.summary}</p>
        <p className="mt-3 border-l-2 border-[#a3aa8d] pl-3 text-xs leading-6 text-[#77796e] dark:border-[#6f7b58] dark:text-gray-400">{item.signal}</p>
      </article>
    </li>
  )
}

function PlanCard({ item, index }) {
  return (
    <article className="rounded-xl border border-[#e0e1d8] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f8863] dark:text-[#aab48d]">{item.week}</span>
        <span className="font-mono text-xs text-[#a2a498]">0{index + 1}</span>
      </div>
      <h3 className="mt-2 font-serif text-lg font-semibold text-[#25261f] dark:text-gray-100">{item.title}</h3>
      <ul className="mt-3 space-y-2">
        {item.tasks.map((task) => (
          <li key={task} className="flex items-start gap-2 text-sm leading-6 text-[#5c5f54] dark:text-gray-300">
            <IconCheck size={15} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{task}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function SelfRegulationReview() {
  return (
    <AdminPage
      title="锻炼与自控"
      description="把欲望、色情内容、梦遗、伴侣性生活与锻炼分开记录；按触发、影响和风险复盘，不再用单一“破戒天数”评价自己。"
      actions={<StatusPill tone="neutral"><IconLock size={13} />仅站长可见</StatusPill>}
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[#d9dccf] bg-[#f4f3eb] p-5 dark:border-[#293542] dark:bg-[#121a23] md:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)] xl:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f8863] dark:text-[#aab48d]">新的篇章</p>
              <h2 className="mt-3 max-w-3xl font-serif text-2xl font-semibold leading-tight text-[#191a15] dark:text-gray-100 md:text-3xl">锻炼、锻炼、锻炼</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#55584e] dark:text-gray-300">当前证据更接近“色情内容成为压力和空闲的快捷出口”，还不足以只凭次数判断成瘾。行动重点放在驾驶、工作场所、同意与关系边界，再用稳定锻炼替换高风险空档。</p>
            </div>
            <div className="rounded-xl border border-[#d9dccf] bg-white/80 p-4 dark:border-[#2b3744] dark:bg-[#0d141d]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#303229] dark:text-gray-100"><IconRefresh size={17} />核心循环</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs leading-6 text-[#676a5f] dark:text-gray-400">
                {['压力 / 无聊', '搜索刺激', '释放', '短暂缓解', '羞耻与发誓'].map((label, index) => (
                  <span key={label} className="contents">
                    <span className="rounded-full border border-[#d9dccf] bg-white px-2.5 py-1 dark:border-[#303c49] dark:bg-[#151e28]">{label}</span>
                    {index < 4 ? <IconArrowRight size={13} className="text-[#9a9c90]" aria-hidden="true" /> : null}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="记录跨度" value="3+ 年" sub="2022—2025" icon="planning" />
          <StatCard label="整理节点" value={TIMELINE.length} sub="不同事件类型分开" icon="audit" />
          <StatCard label="明确风险节点" value={TIMELINE.filter((item) => item.risk).length} sub="驾驶、同意、性健康" icon="wellbeing" tone="danger" />
          <StatCard label="当前主线" value="4 周" sub="先边界，后习惯" icon="todo" tone="success" />
        </div>

        <Section title="整理后的时间线" description="保留关键事实和当时语境；显式内容与姓名不在页面重复展开。">
          <ol>
            {TIMELINE.map((item, index) => <TimelineItem key={`${item.date}-${item.title}`} item={item} last={index === TIMELINE.length - 1} />)}
          </ol>
        </Section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="稳定触发因素" description="多次跨年份重复出现，比单次频率更值得追踪。" actions={<IconBrain size={18} className="text-[#7f8863]" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              {TRIGGERS.map((item, index) => (
                <article key={item.title} className="rounded-lg border border-[#e5e6de] bg-[#fafaf6] p-3.5 dark:border-[#26313e] dark:bg-[#0d141c]">
                  <p className="font-mono text-[10px] text-[#989a8e]">0{index + 1}</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#33352d] dark:text-gray-100">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-6 text-[#717469] dark:text-gray-400">{item.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="优先级高于次数的边界" description="这些项目直接关系到安全、他人权利和长期关系。" actions={<IconShieldCheck size={18} className="text-emerald-600" />}>
            <div className="space-y-3">
              <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900/70 dark:bg-rose-950/20"><IconCar size={19} className="mt-0.5 shrink-0 text-rose-600" /><div><h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">驾驶安全</h3><p className="mt-1 text-xs leading-6 text-rose-800/80 dark:text-rose-200/80">车辆移动期间不搜索、不观看，也不把“红灯时看一下”视为例外。</p></div></div>
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/70 dark:bg-amber-950/20"><IconClock size={19} className="mt-0.5 shrink-0 text-amber-600" /><div><h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">工作边界</h3><p className="mt-1 text-xs leading-6 text-amber-800/80 dark:text-amber-200/80">公司卫生间、车库和午休时段不再作为色情内容或性行为场景。</p></div></div>
              <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3.5 dark:border-blue-900/70 dark:bg-blue-950/20"><IconHeartHandshake size={19} className="mt-0.5 shrink-0 text-blue-600" /><div><h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">同意与关系</h3><p className="mt-1 text-xs leading-6 text-blue-800/80 dark:text-blue-200/80">沉默或不动不等于同意；关系外接触另行处理约定、坦诚和检测。</p></div></div>
            </div>
          </Section>
        </div>

        <Section title="四周行动" description="目标是恢复选择权并建立生活结构，不追求“永不产生性欲”。" actions={<IconBarbell size={19} className="text-[#7f8863]" />}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {FOUR_WEEK_PLAN.map((item, index) => <PlanCard key={item.week} item={item} index={index} />)}
          </div>
        </Section>

        <Section title="以后怎样记录" description="把一次记录写成可分析的数据，避免只留下羞辱性的结论。">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['发生之前', '时间、地点、情绪、睡眠、压力事件和触发入口。'],
              ['实际行为', '色情内容使用分钟数；自慰、梦遗和伴侣性生活分别标注。'],
              ['真实影响', '是否影响驾驶、工作、关系、睡眠、金钱或身体；下一次只调整一个环境变量。'],
            ].map(([title, detail]) => (
              <article key={title} className="rounded-xl border border-dashed border-[#cfd2c5] p-4 dark:border-[#33404e]">
                <h3 className="text-sm font-semibold text-[#34362f] dark:text-gray-100">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#74776c] dark:text-gray-400">{detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex gap-3 rounded-lg border border-[#e0e1d8] bg-[#f8f8f3] p-3.5 text-xs leading-6 text-[#66695f] dark:border-[#26313e] dark:bg-[#0d141c] dark:text-gray-400">
            <IconAlertTriangle size={17} className="mt-1 shrink-0 text-amber-600" aria-hidden="true" />
            <p>页面用于个人复盘，不提供诊断。若控制失败持续数月并明显损害工作、关系或健康，或出现持续疼痛、尿路症状、异常分泌物等情况，应分别寻求心理健康或医疗专业帮助。</p>
          </div>
        </Section>
      </div>
    </AdminPage>
  )
}
