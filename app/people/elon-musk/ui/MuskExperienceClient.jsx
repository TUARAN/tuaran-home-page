'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

const SECTIONS = [
  { id: 'overview', label: '序言/概览' },
  { id: 'profile', label: '个人资料' },
  { id: 'early', label: '早年' },
  { id: 'career', label: '商业经历' },
  { id: 'timeline', label: '时间线' },
  { id: 'map', label: '版图' },
  { id: 'principles', label: '方法论' },
  { id: 'politics', label: '政治参与' },
  { id: 'personal', label: '个人生活' },
  { id: 'views', label: '观点' },
  { id: 'controversies', label: '争议' },
  { id: 'culture', label: '流行文化' },
  { id: 'reading', label: '参考/外链' },
]

const TIMELINE = [
  { year: '1971', tag: '早年', title: '出生于南非比勒陀利亚', detail: '成长背景与后续迁移路径，常被用来解释其风险偏好与“必须赢”的叙事（公开资料）。' },
  { year: '1989', tag: '早年', title: '前往加拿大求学与工作', detail: '先在加拿大落脚，再进入北美创业生态（公开资料）。' },
  { year: '1995', tag: '互联网', title: 'Zip2 创业', detail: '与合伙人把“本地信息/商家目录”做成面向媒体/报业的产品，并在随后完成并购退出（公开资料）。' },
  { year: '1999', tag: '互联网', title: 'X.com → PayPal 路线', detail: '从在线金融服务切入，经历合并与产品路线切换，最终在 eBay 收购中完成关键退出（公开资料）。' },
  { year: '2002', tag: '航天', title: 'SpaceX 成立', detail: '以可复用火箭为核心方向，追求成本曲线的结构性变化，并通过高频测试迭代推进工程目标（公开资料）。' },
  { year: '2004', tag: '汽车', title: '特斯拉早期参与', detail: '长期深度参与电动车产品与制造系统：从产品定义到产线节拍与交付能力（公开资料）。' },
  { year: '2006', tag: '能源', title: '能源相关布局（SolarCity / 储能）', detail: '从家庭能源到电网侧储能，逻辑是“能源系统 + 制造”的长期复利（公开资料）。' },
  { year: '2015', tag: 'AI', title: 'OpenAI（早期参与）', detail: '曾参与早期倡议/资助；后续与组织路线和治理选择出现分歧（公开资料）。' },
  { year: '2016', tag: '脑机', title: 'Neuralink', detail: '高不确定性、长周期研发，核心挑战集中在工程可行性、临床与合规路径（公开资料）。' },
  { year: '2016', tag: '基建', title: 'The Boring Company', detail: '以“工程提速/成本下降”为目标的隧道与交通尝试，争议点也常集中在可扩展性与场景适配（公开资料）。' },
  { year: '2022', tag: '媒体', title: '收购 Twitter → X', detail: '在产品、商业化、治理与内容政策上进入高对抗、强外部性周期（公开资料）。' },
  { year: '2023', tag: 'AI', title: 'xAI 与 Grok', detail: '以“更贴近实时信息与平台分发”的路线对抗主流大模型产品，伴随较强舆论波动（公开资料）。' },
]

const PROFILE = [
  { label: '出生', value: '1971（南非）' },
  { label: '长期身份', value: '创业者 / CEO / 产品与工程强介入' },
  { label: '代表组织', value: 'SpaceX / Tesla / X' },
  { label: '典型议题', value: '可复用航天、制造系统、电动化、平台治理、AI' },
]

const EARLY_LIFE = [
  {
    title: '成长与迁移路径（南非 → 加拿大 → 美国）',
    bullets: ['早年在南非成长，成年前后迁移到北美', '先在加拿大求学与打工，再进入美国创业生态'],
    detail:
      '对他的“世界观”讨论里，迁移经历经常被提及：既包含对风险的容忍度，也包含对技术/资本叙事的敏感度。',
  },
  {
    title: '计算机兴趣与早期作品',
    bullets: ['公开访谈与传记常提到其少年时期对编程/游戏的兴趣', '早期作品更多作为“叙事素材”被反复引用'],
    detail:
      '我更建议把这类材料当作“动机与性格线索”，而不是能力的严格证明：真正决定后续的是组织、资本与工程系统的综合能力。',
  },
  {
    title: '教育（概览）',
    bullets: ['在北美完成本科学业（公开资料）', '曾短暂进入研究生阶段后选择从商（公开资料）'],
    detail:
      '这里的关键不是学历本身，而是：他在关键节点上倾向于用“机会成本”做决策，并愿意承受非线性的失败代价。',
  },
]

const CAREER = [
  {
    title: 'Zip2（1995–1999）：把互联网产品卖给传统机构',
    parts: [
      {
        label: '可核验要点',
        bullets: ['面向媒体/本地信息服务的早期互联网产品', '以企业客户为主，最终通过并购方式退出（公开资料）'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: [
          '不要只看“写代码很拼”，更要看：如何把产品嵌入当时的分发渠道与客户预算。',
          '早期创业的关键是“卖得出去”：定位、定价、交付与续约机制。',
        ],
      },
      {
        label: '观察指标',
        bullets: ['客户是谁（媒体/企业/政府）', '合同与续费结构', '交付周期与支持成本'],
      },
    ],
    detail: '它是一个典型的“能卖出去的 B2B 产品”案例：不靠酷炫概念，靠解决明确的客户需求与落地交付。',
  },
  {
    title: 'X.com / PayPal（1999–2002）：金融产品与组织路线的摩擦',
    parts: [
      {
        label: '可核验要点',
        bullets: ['在线金融服务切入，后经历合并与路线调整', 'PayPal 成为核心产品并在收购中完成退出（公开资料）'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: [
          '它更像“产品路线选择 + 组织协作成本”的教科书：技术偏好、产品偏好与管理风格会直接改变公司命运。',
          '理解他为何长期执着于“支付/金融/超级 App”叙事：这段经历埋下了路径依赖。',
        ],
      },
      {
        label: '观察指标',
        bullets: ['活跃用户增长 vs 风控与欺诈', '系统稳定性与结算能力', '组织分歧如何被治理'],
      },
    ],
    detail: '这段经历常被简化成“做成了 PayPal”，但更值得学的是：当公司处于高风险赛道时，内部路线之争会比外部竞争更致命。',
  },
  {
    title: 'SpaceX（2002–）：用工程节拍压缩成本曲线',
    parts: [
      {
        label: '可核验要点',
        bullets: ['目标是显著降低进入太空成本，路径之一是可复用', '通过密集测试与迭代推进工程目标（公开资料）'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: [
          '把它当作“工程组织”而不是“传奇故事”：节拍、测试、复盘、指标才是主角。',
          '理解“可复用”为什么是商业拐点：它改变的是长期成本结构与发射频率上限。',
        ],
      },
      {
        label: '观察指标',
        bullets: ['发射频率与成功率趋势', '迭代周期（从问题发现到修复）', '制造节拍与供应链约束'],
      },
    ],
    detail: '如果只从“火箭成功/失败”理解 SpaceX，会漏掉组织能力：它把不确定性当作可管理的工程变量，而不是命运。',
  },
  {
    title: 'Tesla（2004–）：制造系统即护城河',
    parts: [
      {
        label: '可核验要点',
        bullets: ['电动车产品是表层，核心难点在制造、供应链、交付与质量', '规模化阶段的组织能力决定长期胜负（公开资料）'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: [
          '从“车型发布会”切换到“产线与交付”视角：0→1 之后真正的战争在 1→N。',
          '把“降本”拆成可执行项：BOM、良率、节拍、返修、供应链替代方案。',
        ],
      },
      {
        label: '观察指标',
        bullets: ['交付与产能爬坡节奏', '毛利与单位成本变化', '质量与召回/返修信号（若有）'],
      },
    ],
    detail: '读特斯拉时，我会把“制造稳定性/成本曲线”当作第一优先级事实线索，其次才是叙事。',
  },
  {
    title: '能源（Solar/储能）：把“电”当作系统工程',
    parts: [
      {
        label: '可核验要点',
        bullets: ['能源业务与电动车在电池与制造层面存在协同空间（公开资料）', '储能与电网侧机会属于长期工程问题'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: ['不要只看“概念”，看电池成本、供应链与部署效率', '更像基础设施生意：回款周期、安装交付、政策与并网'],
      },
      {
        label: '观察指标',
        bullets: ['装机与交付节奏', '单位成本与安装效率', '政策/补贴变化对需求的影响'],
      },
    ],
    detail: '能源线经常被热点淹没，但它是理解“长期复利与系统工程”的关键入口。',
  },
  {
    title: 'OpenAI（早期参与）→ xAI：AI 的组织路线与竞争策略',
    parts: [
      {
        label: '可核验要点',
        bullets: ['曾参与 OpenAI 早期倡议/资助，后不再在组织中扮演同样角色（公开资料）', '后续创建 xAI 并推出 Grok 系列产品（公开资料）'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: [
          '把“观点”拆成三层：技术路线、产品策略、治理与合规。它们经常被混在一起吵。',
          '观察他如何把 AI 绑定到平台与分发（如果有）：这会影响产品形态与风险结构。',
        ],
      },
      {
        label: '观察指标',
        bullets: ['模型能力迭代节奏（公开评测/产品更新）', '数据/分发是否构成护城河', '安全与合规策略的可解释性'],
      },
    ],
    detail: '这条线最容易陷入立场争吵；更有效的读法是：他在不同阶段如何选择“开放/封闭、速度/安全、产品/研究”的组合。',
  },
  {
    title: 'Neuralink：长周期、高合规的不确定性研发',
    parts: [
      {
        label: '可核验要点',
        bullets: ['目标是脑机接口相关技术与产品化（公开资料）', '研发周期长、监管与临床路径复杂'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: ['把它当作“科学 × 工程 × 合规”的组合题', '关注里程碑与证据质量，而不是只看愿景'],
      },
      {
        label: '观察指标',
        bullets: ['阶段性里程碑是否可验证', '安全/伦理/合规进展披露', '团队与合作机构变化'],
      },
    ],
    detail: '这是“愿景很大但证据链很长”的典型：它不适合用短期情绪做判断。',
  },
  {
    title: 'The Boring Company：工程试错与场景争议',
    parts: [
      {
        label: '可核验要点',
        bullets: ['以隧道施工与交通方案为核心方向（公开资料）', '争议常集中在可扩展性、经济性与城市适配'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: ['把它当作“工程创新的边界测试”：哪些约束是物理/成本决定的？', '看落地项目的交付质量，而不是只看概念图'],
      },
      {
        label: '观察指标',
        bullets: ['单位里程成本与工期（若披露）', '安全与运营复杂度', '项目扩展与复制能力'],
      },
    ],
    detail: '它是一个“争议很大但有学习价值”的案例：你能在这里练习把愿景拆成约束与可验证里程碑。',
  },
  {
    title: 'X（2022–）：平台治理与商业化的高压实验',
    parts: [
      {
        label: '可核验要点',
        bullets: ['收购后产品与策略变化频繁，外部争议更集中', '治理、信任与商业化之间张力长期存在（公开资料）'],
      },
      {
        label: '怎么读（可迁移）',
        bullets: [
          '把“平台”当作一个社会系统：规则改变会通过用户、媒体、广告商、监管放大。',
          '重点看机制：推荐/审核/申诉/风控/付费体系如何互相牵制。',
        ],
      },
      {
        label: '观察指标',
        bullets: ['产品迭代频率与回滚', '商业化结构（广告/订阅/支付）', '外部信任信号（广告商、监管、用户迁移）'],
      },
    ],
    detail: '这段经历最适合用来学习“二阶效应”：在大平台上，技术决策会变成社会议题，社会议题也会反过来限制产品空间。',
  },
]

const POLITICS = [
  {
    title: '政治表达与公众影响力',
    bullets: ['通过社交媒体表达立场、评价政策与人物', '影响力与争议往往伴随：支持者与反对者都极端化'],
    detail:
      '你可以把它当作“注意力杠杆”的示范：企业家一旦变成公共舆论节点，就很难再只用商业逻辑被评价。',
  },
  {
    title: '平台治理与政治外部性',
    bullets: ['平台内容政策与推荐机制会改变公共讨论的结构', '商业化（广告/订阅）与治理目标可能互相拉扯'],
    detail:
      '这部分我更建议用“机制视角”而不是“阵营视角”去读：规则如何设定？谁承担错误成本？如何复盘与纠错？',
  },
]

const PERSONAL = [
  {
    title: '家庭与私人生活（只做低细节概览）',
    bullets: ['婚恋与家庭经历经常被媒体关注', '子女数量、伴侣关系等细节随时间变化且易失真'],
    detail:
      '我倾向于避免在这里堆细节：一方面难验证，另一方面对“学习他的方法论”帮助不大。需要的话以维基等可追溯来源为准。',
  },
  {
    title: '健康/特质与自我叙述',
    bullets: ['他在公开节目中谈及自己的一些神经多样性特征', '这常被用来解释其沟通风格与决策偏好'],
    detail:
      '建议把这类信息当作“理解沟通风格”的辅助线索，而不是把争议一股脑归因到人格或标签。',
  },
]

const VIEWS = [
  {
    title: '技术乐观主义 + 风险叙事（常见母题）',
    parts: [
      {
        label: '常见主题',
        bullets: ['多行星文明、可持续能源、AI 风险等议题反复出现', '叙事常用“紧迫性/危机感/窗口期”组织'],
      },
      {
        label: '怎么读',
        bullets: ['把“动员叙事”和“事实主张”拆开', '优先追踪可验证的行动与里程碑，而不是只追踪句子'],
      },
    ],
    detail:
      '这种叙事的优势是能聚集资源与人才；代价是容易压扁复杂性。对学习者来说，关键是别把“鼓舞人心”误读成“必然实现”。',
  },
  {
    title: '对 AI 的态度（经常同时包含推动与警惕）',
    parts: [
      {
        label: '可观察的两面',
        bullets: ['一方面推动 AI 产品化与竞争；另一方面强调安全与监管的必要性', '对“开放/封闭、速度/安全、研究/产品”的取舍会随阶段变化'],
      },
      {
        label: '怎么读',
        bullets: ['把 AI 放进系统：他在构建的是模型公司、平台能力，还是舆论/政治工具？', '对比“说法”与“组织动作”（投资、收购、产品策略）是否一致'],
      },
    ],
    detail: '如果你只跟着争吵走，会很累；更有效的方式是盯住：他如何用组织与产品把立场落地，以及落地之后出现了哪些外部性。',
  },
]

const CONTROVERSIES = [
  {
    title: '言论风格：高频输出带来的高频误伤',
    parts: [
      {
        label: '常见现象',
        bullets: ['表达方式强烈，容易把讨论推向对抗', '对外界而言，他本人常被当作“立场符号”'],
      },
      {
        label: '怎么读',
        bullets: ['不要把某条帖子的情绪当作事实', '尽量回到原始上下文：他在回应什么？是否有后续修正？'],
      },
      {
        label: '对组织的风险',
        bullets: ['品牌风险反向绑架组织决策', '人才、广告、监管的反馈回路变得更极端'],
      },
    ],
    detail: '对创业者最有用的不是站队，而是学习“创始人 = 品牌”的结构性成本：它会放大一切优点，也会放大一切错误。',
  },
  {
    title: '公司治理与监管：沟通方式可能触发系统性风险',
    parts: [
      {
        label: '常见摩擦点',
        bullets: ['资本市场沟通与合规边界的摩擦', '管理风格与治理结构的长期张力'],
      },
      {
        label: '怎么验证',
        bullets: ['优先看监管披露、法院文件、公司公告等可追溯来源', '二手媒体只当作线索，不当作定论'],
      },
      {
        label: '可迁移教训',
        bullets: ['对外沟通要可复盘', '治理结构要能兜底“强个性决策”带来的波动'],
      },
    ],
    detail: '争议本身往往复杂；但对团队有价值的部分是：哪些表达与决策会让风险从“公司内部问题”升级成“系统性事件”。',
  },
  {
    title: '平台治理：信任、广告与内容政策的三角拉扯',
    parts: [
      {
        label: '结构性矛盾',
        bullets: ['“更自由”与“更安全”之间存在冲突', '商业化压力会持续影响治理与产品策略'],
      },
      {
        label: '怎么读',
        bullets: ['盯住机制变化：推荐、审核、申诉、付费、反滥用', '用二阶效应评估：谁会离开？谁会加码？监管如何反应？'],
      },
    ],
    detail: '这部分没有简单答案，但它是理解现代平台最好的训练场：规则不是“对/错”，而是“代价由谁承担”。',
  },
]

const CULTURE = [
  {
    title: '影视与综艺客串（作为公众符号）',
    bullets: ['在部分影视/综艺作品中以“现实科技企业家”形象出现', '这种曝光强化了“硅谷钢铁侠”式的公众叙事'],
    detail:
      '对学习者而言，这部分的价值在于理解“形象如何反哺融资与招聘”，而不在于把客串当作成就本身。',
  },
]

const ORG_MAP = [
  {
    key: 'spacex',
    name: 'SpaceX',
    theme: 'from-indigo-500/20 to-cyan-400/10',
    bullets: ['可复用与发射频率', '工程-测试-迭代飞轮', '供应链与制造节拍'],
  },
  {
    key: 'tesla',
    name: 'Tesla',
    theme: 'from-emerald-500/20 to-lime-400/10',
    bullets: ['制造系统即产品', '电池/能量系统', '成本曲线与规模效应'],
  },
  {
    key: 'x',
    name: 'X',
    theme: 'from-fuchsia-500/20 to-purple-400/10',
    bullets: ['注意力与传播机制', '平台治理与信任', '产品迭代与商业化压力'],
  },
  {
    key: 'others',
    name: 'Others',
    theme: 'from-amber-500/20 to-orange-400/10',
    bullets: ['Neuralink：长周期研发', 'Boring：工程试错', '能源：储能与电网侧机会'],
  },
]

const PRINCIPLES = [
  {
    title: '第一性原理（把问题还原成可计算的约束）',
    desc: '把“看起来很难”拆解成材料、能量、制造、测试、时间这类硬约束，然后找可工程化的突破口。',
  },
  {
    title: '缩短反馈回路（更快地犯更便宜的错）',
    desc: '频繁试验、快速迭代，把不确定性尽快变成数据或工程结论。',
  },
  {
    title: '规模化是第二次创业',
    desc: '0→1 是产品与原型，1→N 则是供应链、制造、质量、交付与组织协同。',
  },
  {
    title: '叙事与执行两条腿',
    desc: '叙事影响融资、人才与公众预期；执行决定兑现与长期护城河。',
  },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(Boolean(media.matches))
    onChange()
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

function useScrollSpy(sectionIds, rootMargin = '-35% 0px -55% 0px') {
  const [activeId, setActiveId] = useState(sectionIds[0] || '')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => (a.boundingClientRect.top > b.boundingClientRect.top ? 1 : -1))
        setActiveId(visible[0].target.id)
      },
      { root: null, threshold: [0.01, 0.1, 0.25], rootMargin }
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootMargin, sectionIds])

  return activeId
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function InfoBlock({ title, bullets, detail, parts }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {parts && parts.length > 0 ? (
        <div className="mt-3 space-y-3">
          {parts.map((p) => (
            <div key={`${title}-${p.label}`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">{p.label}</div>
              {p.bullets && p.bullets.length > 0 ? (
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {p.bullets.map((b) => (
                    <li key={`${title}-${p.label}-${b}`}>• {b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : bullets && bullets.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {bullets.map((b) => (
            <li key={`${title}-${b}`}>• {b}</li>
          ))}
        </ul>
      ) : null}
      {detail ? <div className="mt-2 text-sm text-slate-700 leading-relaxed">{detail}</div> : null}
    </div>
  )
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full border border-slate-300 bg-slate-900 px-3 py-1 text-[11px] text-white'
          : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 hover:text-slate-900'
      }
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

export default function MuskExperienceClient() {
  const reducedMotion = useReducedMotion()
  const activeId = useScrollSpy(SECTIONS.map((s) => s.id))

  const [timelineTag, setTimelineTag] = useState('全部')
  const tags = useMemo(() => ['全部', ...Array.from(new Set(TIMELINE.map((t) => t.tag)))], [])

  const filteredTimeline = useMemo(() => {
    if (timelineTag === '全部') return TIMELINE
    return TIMELINE.filter((t) => t.tag === timelineTag)
  }, [timelineTag])

  const [openIndex, setOpenIndex] = useState(0)

  const mainRef = useRef(null)
  useEffect(() => {
    // Ensure hash navigation works nicely even with sticky nav.
    if (typeof window === 'undefined') return
    if (!window.location.hash) return
    const id = window.location.hash.slice(1)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [reducedMotion])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-bleed background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            reducedMotion
              ? 'absolute inset-0 bg-[#f8fafc]'
              : 'absolute inset-0 bg-[#f8fafc] [background:radial-gradient(1200px_circle_at_10%_10%,rgba(59,130,246,0.22),transparent_45%),radial-gradient(900px_circle_at_90%_20%,rgba(34,197,94,0.16),transparent_50%),radial-gradient(900px_circle_at_60%_80%,rgba(236,72,153,0.12),transparent_55%)]'
          }
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(248,250,252,0.35),rgba(248,250,252,0.95))]" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(2,6,23,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <header className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px] md:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] text-slate-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              人物志 · 单页
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
              我所了解到的马斯克
            </h1>
            <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-700 leading-relaxed">
              这是一页式的个人笔记：用“早年 → 商业 → 观点 → 争议”的结构来整理信息，再把可以迁移的部分抽成方法论。
              我会尽量区分“公开资料可核验的事实”和“我的个人判断”。
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#overview"
                className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-semibold no-underline hover:no-underline"
              >
                开始阅读
              </a>
              <a
                href="https://x.com/elonmusk"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 no-underline hover:no-underline hover:text-slate-900 shadow-sm"
              >
                X 主页
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <Stat label="重点" value="工程 × 组织" />
            <Stat label="定位" value="结构化笔记" />
            <Stat label="说明" value="尽量核验来源" />
          </div>
        </header>

        {/* Layout */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]" ref={mainRef}>
          {/* Side nav */}
          <aside className="hidden lg:block">
            <nav className="sticky top-6 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
              <div className="text-[11px] font-semibold tracking-wider text-slate-600">目录</div>
              <div className="mt-3 space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={
                      activeId === s.id
                        ? 'block rounded-md bg-slate-900 px-3 py-2 text-sm text-white no-underline hover:no-underline'
                        : 'block rounded-md px-3 py-2 text-sm text-slate-700 hover:text-slate-900 no-underline hover:no-underline'
                    }
                  >
                    {s.label}
                  </a>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <Link
                  href="/bookmarks/people"
                  className="block rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 no-underline hover:no-underline hover:text-slate-900"
                >
                  ← 返回人物志
                </Link>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <main className="space-y-8">
            <section id="overview" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">序言 / 概览</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">我关注的视角</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>工程：成本曲线、测试与迭代</li>
                    <li>产品：从原型到规模化交付</li>
                    <li>组织：节拍、指标、权责结构</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">可迁移的方法</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>把抽象目标变成硬约束</li>
                    <li>把大问题切成短反馈闭环</li>
                    <li>让组织对指标负责</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">需要警惕</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>强个性决策的波动</li>
                    <li>公众舆论与治理结构冲突</li>
                    <li>叙事过强时的预期管理</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="profile" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">个人资料（概览）</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {PROFILE.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                说明：个人细节（如家庭成员数量、实时头衔等）变化快且容易被二手信息污染；本页只保留对理解其商业与方法论有帮助的低细节摘要。
              </div>
            </section>

            <section id="early" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">早年</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {EARLY_LIFE.map((b) => (
                  <InfoBlock key={b.title} title={b.title} bullets={b.bullets} detail={b.detail} />
                ))}
              </div>
            </section>

            <section id="career" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">商业经历（结构化摘要）</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {CAREER.map((b) => (
                  <InfoBlock key={b.title} title={b.title} bullets={b.bullets} detail={b.detail} />
                ))}
              </div>
            </section>

            <section id="timeline" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-0">时间线</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Chip key={t} active={timelineTag === t} onClick={() => setTimelineTag(t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {filteredTimeline.map((item, idx) => {
                  const isOpen = openIndex === idx
                  return (
                    <div key={`${item.year}-${item.title}`} className="rounded-xl border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                        className="w-full text-left px-4 py-3"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 shrink-0 text-sm font-semibold text-slate-900">{item.year}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                            <div className="mt-0.5 text-[11px] text-slate-500">{item.tag}</div>
                          </div>
                          <div className="text-slate-500 text-sm">{isOpen ? '−' : '+'}</div>
                        </div>
                      </button>
                      {isOpen ? (
                        <div className="px-4 pb-4 text-sm text-slate-700 leading-relaxed">{item.detail}</div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>

            <section id="map" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">公司/项目版图</h2>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                下面是一个“学习地图”：不追求详尽八卦，而是把每个组织拆成你可以复用的观察维度。
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {ORG_MAP.map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${card.theme} p-4`}
                  >
                    <div className="text-base font-semibold text-slate-900">{card.name}</div>
                    <ul className="mt-3 space-y-1 text-sm text-slate-700">
                      {card.bullets.map((b) => (
                        <li key={`${card.key}-${b}`}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section id="principles" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">方法论（可迁移）</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {PRINCIPLES.map((p) => (
                  <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                    <div className="mt-2 text-sm text-slate-700 leading-relaxed">{p.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <section id="politics" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">政治参与（机制视角）</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {POLITICS.map((b) => (
                  <InfoBlock key={b.title} title={b.title} bullets={b.bullets} detail={b.detail} />
                ))}
              </div>
            </section>

            <section id="personal" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">个人生活</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {PERSONAL.map((b) => (
                  <InfoBlock key={b.title} title={b.title} bullets={b.bullets} detail={b.detail} />
                ))}
              </div>
            </section>

            <section id="views" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">观点（如何读）</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {VIEWS.map((b) => (
                  <InfoBlock key={b.title} title={b.title} bullets={b.bullets} detail={b.detail} />
                ))}
              </div>
            </section>

            <section id="controversies" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">争议（保持清醒）</h2>
              <div className="mt-3 text-sm text-slate-700 leading-relaxed">
                这部分不做价值裁判，只提供“争议类型 + 如何验证 + 如何避免把情绪当事实”。如果你要把他的某些做法迁移到自己团队，建议先问：
                <ul className="mt-3 space-y-1">
                  <li>• 我们的组织是否承受得起高波动的决策风格？</li>
                  <li>• 我们是否有足够的治理与合规机制去兜底？</li>
                  <li>• 我们是靠叙事融资，还是靠可持续交付？</li>
                </ul>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4">
                {CONTROVERSIES.map((b) => (
                  <InfoBlock key={b.title} title={b.title} bullets={b.bullets} detail={b.detail} />
                ))}
              </div>
            </section>

            <section id="culture" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">流行文化</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {CULTURE.map((b) => (
                  <InfoBlock key={b.title} title={b.title} bullets={b.bullets} detail={b.detail} />
                ))}
              </div>
            </section>

            <section id="reading" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 border-b-0 pb-0 mb-2">参考 / 外链（从一手信息开始）</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <a
                  className="rounded-xl border border-slate-200 bg-white p-4 no-underline hover:no-underline"
                  href="https://www.spacex.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-sm font-semibold text-slate-900">SpaceX 官网</div>
                  <div className="mt-1 text-xs text-slate-500 break-all">spacex.com</div>
                </a>
                <a
                  className="rounded-xl border border-slate-200 bg-white p-4 no-underline hover:no-underline"
                  href="https://www.tesla.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-sm font-semibold text-slate-900">Tesla 官网</div>
                  <div className="mt-1 text-xs text-slate-500 break-all">tesla.com</div>
                </a>
                <a
                  className="rounded-xl border border-slate-200 bg-white p-4 no-underline hover:no-underline"
                  href="https://x.com/elonmusk"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-sm font-semibold text-slate-900">Elon Musk（X）</div>
                  <div className="mt-1 text-xs text-slate-500 break-all">x.com/elonmusk</div>
                </a>
                <a
                  className="rounded-xl border border-slate-200 bg-white p-4 no-underline hover:no-underline"
                  href="https://en.wikipedia.org/wiki/Elon_Musk"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-sm font-semibold text-slate-900">Wikipedia（概览）</div>
                  <div className="mt-1 text-xs text-slate-500 break-all">en.wikipedia.org/wiki/Elon_Musk</div>
                </a>
                <a
                  className="rounded-xl border border-slate-200 bg-white p-4 no-underline hover:no-underline"
                  href="https://zh.wikipedia.org/wiki/%E5%9F%83%E9%9A%86%C2%B7%E9%A9%AC%E6%96%AF%E5%85%8B"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-sm font-semibold text-slate-900">维基百科（中文）</div>
                  <div className="mt-1 text-xs text-slate-500 break-all">zh.wikipedia.org/wiki/埃隆·马斯克</div>
                </a>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                提醒：本页是结构化笔记，不等同于对任何具体言论/事件的背书。需要精确细节时，以可追溯来源为准。
              </div>
            </section>

            <div className="pb-10" />
          </main>
        </div>
      </div>
    </div>
  )
}
