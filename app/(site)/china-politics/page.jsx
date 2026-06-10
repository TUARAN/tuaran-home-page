import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '中国政治体制 · 资料库',
  description:
    '中国政治体制结构梳理：中央核心权力机构、国务院组织、行政级别体系、历届三中全会要点与领导层沿革（1971–至今）。',
  keywords: ['涂阿燃', 'tuaran', '中国政治', '政治体制', '三中全会', '国务院', '行政级别', '资料库'],
  alternates: {
    canonical: '/china-politics',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// ============ 数据：一、组织 ============
const CENTRAL_ORGANS = {
  headers: ['名称', '性质', '职权'],
  rows: [
    ['中共中央政治局', '党最高领导机构之一', '中央委员会闭会期间行使中央权力，决定党和国家重大政策'],
    ['中央政治局常委会', '政治局核心，权力最集中', '实质上的最高决策机构'],
    ['中央委员会（“中央”）', '党全国代表大会选举产生', '党代会闭会期间行使最高权力'],
    ['全国人民代表大会', '国家最高权力机关（宪法规定）', '制定法律、修改宪法、选举国家领导人、监督国家机关'],
    ['国务院', '国家最高行政机关', '组织实施法律政策、管理行政事务，由总理领导'],
    ['中央军事委员会', '国家军事领导机构', '领导全国武装力量，由总书记 / 主席兼任'],
  ],
}

const STATE_COUNCIL_DEPTS = {
  headers: ['类型', '示例'],
  rows: [
    ['政策制定 / 行业管理', '国家发展改革委、财政部、工信部、教育部、公安部 等'],
    ['社会事务管理', '卫健委、人社部、民政部、退役军人事务部 等'],
    ['经济与生态', '自然资源部、生态环境部、农业农村部、商务部 等'],
    ['金融与监督', '中国人民银行、审计署'],
  ],
}

const STATE_COUNCIL_BUREAUS = {
  headers: ['主管部门', '部委管理的国家局'],
  rows: [
    ['发改委', '国家能源局、国家数据局、粮储局'],
    ['工信部', '烟草专卖局、国防科工局'],
    ['公安部', '移民管理局'],
    ['卫健委', '中医药局、疾控局'],
    ['应急管理部', '消防救援局、矿山安监局'],
    ['人民银行', '国家外汇管理局'],
    ['市监总局', '药品监督管理局'],
  ],
}

const STATE_COUNCIL_OTHER = [
  { label: '直属特设机构（1 个）', text: '国务院国有资产监督管理委员会（管理央企，正部级）' },
  {
    label: '直属机构（14 个，副部级为主）',
    text: '海关总署、税务总局、市场监管总局、国家体育总局、统计局、知识产权局、国际发展合作署、医保局 等',
  },
  {
    label: '直属事业单位（7 个）',
    text: '新华社、中央广播电视总台、中国科学院、中国工程院 等',
  },
]

const RANKS = {
  headers: ['等级', '官员级别 / 职务示例'],
  rows: [
    ['一级 · 正国级', '中共中央总书记、国家主席、政治局常委'],
    ['二级 · 副国级', '政治局委员、国务委员、人大副委员长 等'],
    ['三级 · 正部级', '部长、省长、个别央企一把手（如中投、中信、国铁）'],
    ['四级 · 副部级', '部委副职、副省长、省委副书记'],
    ['五级 · 正厅级', '地级市书记、厅局长、省直一把手'],
    ['六级 · 副厅级', '市委副书记、副市长'],
    ['七级 · 正处级', '县委书记、处长'],
    ['八级 · 副处级', '副县长、科室副主任'],
    ['九级 · 正科级', '镇党委书记、局长'],
    ['十级 · 副科级', '镇副镇长、基层副职'],
    ['十一级 · 科员', '非领导职务公务员'],
  ],
}

const PARTY_VS_NPC = {
  headers: ['项目', '党的全国代表大会', '全国人民代表大会'],
  rows: [
    ['性质', '党最高机关', '国家最高权力机关'],
    ['参会人员', '党员代表', '人大代表（可为群众 / 民主党派）'],
    ['职权', '选举中央领导、修改党章', '修宪、立法、选举国家领导、监督国家机构'],
    ['会议周期', '每五年一次', '每年一次'],
    ['常设机构', '中央委员会', '全国人大常委会'],
    ['名称标识', '“X 大”“X 届 X 中全会”', '“第 X 届全国人大 X 次会议”'],
  ],
}

// ============ 数据：二、历届三中全会 ============
const PLENARY = [
  {
    session: '十一届三中全会',
    date: '1978.12.18–22',
    keywords: ['拨乱反正', '改革开放起点'],
    content: '否定“两个凡是”，提出“实践是检验真理的唯一标准”，确立“以经济建设为中心”。',
    background: '改变文革路线，确立邓小平主导地位，被视为中国现代化的起步点。',
  },
  {
    session: '十二届三中全会',
    date: '1984.10.20',
    keywords: ['改革从农村走向城市'],
    content: '通过《中共中央关于经济体制改革的决定》，首次提出“有计划的商品经济”。',
    background: '改革政策延展至城市，深化对计划经济的修正。',
  },
  {
    session: '十三届三中全会',
    date: '1988.9.26–30',
    keywords: ['深化改革扫清障碍'],
    content: '提出价格、工资改革方案，整顿经济秩序。',
    background: '为“治理整顿”打基础，后续出现通货膨胀与经济动荡。',
  },
  {
    session: '十四届三中全会',
    date: '1993.11.11–14',
    keywords: ['市场经济框架'],
    content: '明确社会主义市场经济体制基本框架，提出现代企业制度。',
    background: '成为 90 年代改革“顶层设计”的标志性会议。',
  },
  {
    session: '十五届三中全会',
    date: '1998.10.12–14',
    keywords: ['新农村战略'],
    content: '提出“统分结合的双层经营体制”，建设社会主义新农村。',
    background: '强调农村现代化、农业基础与农民增收。',
  },
  {
    session: '十五届四中全会',
    date: '1999.9.19–22',
    keywords: ['国企改革'],
    content: '通过《关于国有企业改革和发展若干重大问题的决定》。',
    background: '明确“建立现代企业制度”是国企改革方向。',
  },
  {
    session: '十五届六中全会',
    date: '2001.9.24–26',
    keywords: ['作风建设'],
    content: '通过《关于加强和改进党的作风建设的决定》。',
    background: '“三个代表”成为执政理念，为十六大政治交接作准备。',
  },
  {
    session: '十五届七中全会',
    date: '2002（准备十六大）',
    keywords: ['过渡性会议'],
    content: '主要为召开十六大作准备。',
    background: '过渡性会议，未有重大决策内容披露。',
  },
  {
    session: '十六届三中全会',
    date: '2003.10.11–14',
    keywords: ['市场完善', '政府转型'],
    content: '明确非公经济地位，推进国企改革、政府职能转变、产权制度建设。',
    background: '开启新一轮“放权让利”，重塑政企关系。',
  },
  {
    session: '十七届三中全会',
    date: '2008.10.9–12',
    keywords: ['农业现代化'],
    content: '提出建设现代农业、农村制度建设、“两个毫不动摇”。',
    background: '非公经济与国企并重，推动乡村发展。',
  },
  {
    session: '十八届三中全会',
    date: '2013.11.9–12',
    keywords: ['国家治理现代化'],
    content: '通过《全面深化改革若干重大问题的决定》，从六大领域推进改革。',
    background: '被称为改革的“第二次总设计”，政治经济制度同步调整。',
  },
  {
    session: '十九届三中全会',
    date: '2018.2.26–28',
    keywords: ['党和国家机构改革'],
    content: '通过《中共中央关于深化党和国家机构改革的决定》。',
    background: '统一党政架构，成立国家监察委，优化中央治理结构。',
  },
  {
    session: '二十届三中全会',
    date: '2024.7.15–18',
    keywords: ['深化改革', '中国式现代化'],
    content: '审议通过《关于进一步全面深化改革、推进中国式现代化的决定》，提出 15 部分 60 条任务。',
    background: '强调七个“聚焦”方向，涵盖市场、民主、文化、绿色、治理、安全、执政能力现代化。',
  },
]

const SEVEN_FOCUS = [
  '构建高水平社会主义市场经济体制',
  '发展全过程人民民主',
  '建设社会主义文化强国',
  '提高人民生活品质',
  '建设美丽中国（生态优先）',
  '建设更高水平平安中国（国家安全）',
  '提高党的领导与长期执政能力',
]

const KEYWORDS = [
  {
    term: '“两个毫不动摇”',
    desc: '毫不动摇巩固和发展公有制经济 + 毫不动摇鼓励、支持、引导非公有制经济发展，体现经济体制的“混合性”方向。',
  },
  {
    term: '社会主义市场经济',
    desc: '政府主导与市场机制相结合的体制安排，是 90 年代以后改革的核心经济路线。',
  },
]

// ============ 数据：三、领导层沿革 ============
const LEADERS = [
  {
    period: '1972.2 — 1973.8',
    title: '九一三事件后 → 中共十大前',
    lines: [
      { k: '核心人物', v: '毛泽东（主席），董必武、朱德、周恩来、宋庆龄、康生' },
      { k: '关键词', v: '毛泽东继续掌权，林彪事件后震荡调整' },
    ],
  },
  {
    period: '1973.8 — 1975.1',
    title: '中共十届一中 → 二中之间',
    lines: [
      { k: '新增副主席', v: '王洪文、李德生、叶剑英' },
      { k: '特征', v: '文革政治余波，党内结构扩充' },
    ],
  },
  {
    period: '1975.1 — 1976.1',
    title: '四届全国人大一次会议后',
    lines: [{ k: '政务要点', v: '强化国企、经济调整；周恩来病重，董必武逝世' }],
  },
  {
    period: '1976.4 — 1977.7',
    title: '毛泽东病重 → 华国锋接班',
    lines: [{ k: '转折', v: '毛泽东逝世，粉碎“四人帮”，华国锋逐步掌控党政军' }],
  },
  {
    period: '1977.8 — 1978.12',
    title: '十一届一中 → 三中全会前',
    lines: [
      { k: '关键词', v: '华国锋主政，邓小平复出' },
      { k: '过渡期', v: '改革酝酿，权力结构尚不稳定' },
    ],
  },
  {
    period: '1978.12 — 1980.2',
    title: '十一届三中全会之后',
    lines: [
      { k: '历史转折', v: '改革开放起航' },
      { k: '结构调整', v: '邓小平实际掌权，陈云回归' },
    ],
  },
  {
    period: '1980.2 — 1981.6',
    title: '十一届五中 → 六中',
    lines: [
      { k: '换届准备', v: '胡耀邦升任总书记，华国锋被边缘化' },
      { k: '成员', v: '常委多达 13 人，含多位老帅' },
    ],
  },
  {
    period: '1981.6 — 1982.9',
    title: '六中全会 → 中共十二大前',
    lines: [
      { k: '领导', v: '党主席胡耀邦，军委主席邓小平' },
      { k: '关键词', v: '稳定推进体制改革，思想解放' },
    ],
  },
  {
    period: '1982.9 — 1983.6',
    title: '中共十二届一中 → 六届人大前',
    lines: [
      { k: '制度', v: '顾问委员会制度确立，邓小平成为实际领导核心' },
      { k: '常委', v: '胡、赵、李、陈为主要班底' },
    ],
  },
  {
    period: '1983.6 — 1985.9',
    title: '政协六届二次 → 十二届四中全会前',
    lines: [
      { k: '趋势', v: '党政统筹加强，军委仍由邓小平掌握' },
      { k: '活跃人物', v: '乔石、胡启立、姚依林、乌兰夫' },
    ],
  },
  {
    period: '1985.9 — 1987.1',
    title: '十二届五中 → 政治局扩大会议前',
    lines: [{ k: '关键词', v: '改革派与稳健派分歧加深' }],
  },
  {
    period: '1987.1 — 1987.10',
    title: '政治局扩大会议 → 十三大前',
    lines: [
      { k: '变动', v: '胡耀邦辞去总书记，赵紫阳代理' },
      { k: '格局', v: '邓小平仍掌军权，政治局过渡重组' },
    ],
  },
  {
    period: '1987.11 — 1989.6',
    title: '十三大后 → 1989 年中',
    lines: [
      { k: '总书记', v: '赵紫阳' },
      { k: '关键词', v: '经济体制改革与通货膨胀并存' },
    ],
  },
  {
    period: '1989.6 — 1992.10',
    title: '中共十四大前',
    lines: [
      { k: '总书记', v: '江泽民接任' },
      { k: '关键词', v: '“稳定”被置于首位，经济改革缓步推进' },
    ],
  },
  {
    period: '1992.10 — 1997.9',
    title: '十四大后 → 邓小平逝世前',
    lines: [
      { k: '关键词', v: '南巡讲话，确立市场经济，江朱体制成形' },
      { k: '核心人物', v: '江泽民、李鹏、朱镕基、李瑞环' },
    ],
  },
  {
    period: '1997.9 — 2002.11',
    title: '十五大后 → 十六大前',
    lines: [
      { k: '关键词', v: '“三个代表”提出，国企改制深化' },
      { k: '结构', v: '江泽民继续掌控军委，胡锦涛上升' },
    ],
  },
  {
    period: '2002.11 — 2007.10',
    title: '十六大后 → 十七大前',
    lines: [
      { k: '总书记', v: '胡锦涛接班，江泽民逐步退居幕后' },
      { k: '关键词', v: '集体领导、和谐社会、科学发展观' },
    ],
  },
  {
    period: '2007.10 — 2012.11',
    title: '十七大后 → 十八大前',
    lines: [
      { k: '权力格局', v: '胡温体制运行末期' },
      { k: '接班梯队', v: '习近平、李克强' },
    ],
  },
  {
    period: '2012.11 — 2017.10',
    title: '十八大后 → 十九大前',
    lines: [
      { k: '总书记', v: '习近平接班' },
      { k: '关键词', v: '全面从严治党、反腐、“四个全面”战略' },
    ],
  },
  {
    period: '2017.10 — 2022.10',
    title: '十九大后 → 二十大前',
    lines: [{ k: '关键词', v: '强化党中央权威、全面建成小康、脱贫攻坚、抗击疫情' }],
  },
  {
    period: '2022.10 — 2023.3',
    title: '二十大后 → 十四届人大前',
    lines: [
      { k: '总书记', v: '习近平连任，李强进入常委' },
      { k: '关键词', v: '高层换届完成，“中国式现代化”提上议程' },
    ],
  },
  {
    period: '2023.3 — 至今',
    title: '十四届人大后 → 当前',
    lines: [
      { k: '国家主席', v: '习近平' },
      { k: '国务院总理', v: '李强' },
      { k: '核心常委', v: '赵乐际、王沪宁、蔡奇、丁薛祥、李希、韩正' },
      { k: '关键词', v: '高质量发展、新质生产力、治理现代化' },
    ],
  },
]

const REFERENCES = [
  { label: '中共中央政治局常务委员会', href: 'https://zh.wikipedia.org/wiki/中国共产党中央政治局常务委员会' },
  { label: '党和国家领导人', href: 'https://zh.wikipedia.org/wiki/党和国家领导人' },
  { label: '中华人民共和国国务院', href: 'https://zh.wikipedia.org/wiki/中华人民共和国国务院' },
  { label: '中国共产党中央委员会', href: 'https://zh.wikipedia.org/wiki/中国共产党中央委员会' },
]

const SECTIONS = [
  {
    id: 'org',
    label: '一、组织',
    subs: [
      { id: 'org-central', label: '中央核心权力机构' },
      { id: 'org-statecouncil', label: '国务院机构结构' },
      { id: 'org-ranks', label: '行政级别体系' },
      { id: 'org-party-npc', label: '党政关系与代会比较' },
      { id: 'org-system', label: '制度特征与立场' },
    ],
  },
  {
    id: 'plenary',
    label: '二、历届三中全会',
    subs: [
      { id: 'plenary-list', label: '十一届—二十届要点' },
      { id: 'plenary-focus', label: '七个“聚焦”方向' },
    ],
  },
  {
    id: 'leaders',
    label: '三、领导层沿革',
    subs: [{ id: 'leaders-timeline', label: '时间轴（1971–至今）' }],
  },
]

// ============ 组件 ============
function Table({ data }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {data.headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap border border-[#eee] bg-[#f4f5f0] px-3 py-2 text-left font-semibold text-[#333] dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-100"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`align-top border border-[#eee] px-3 py-2 dark:border-gray-800 ${
                    j === 0
                      ? 'whitespace-nowrap font-medium text-[#444] dark:text-gray-200'
                      : 'text-[#666] dark:text-gray-300'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SubHeading({ id, children }) {
  return (
    <h3
      id={id}
      className="mt-8 scroll-mt-24 text-base font-bold text-[#444] dark:text-gray-200"
    >
      {children}
    </h3>
  )
}

export default function ChinaPoliticsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              中国政治体制
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
              资料库：梳理中国政治体制的三条线索——中央与国务院的组织结构、历届三中全会的改革主线、以及领导层 1971 年至今的沿革。以公开资料为据，偏结构性描述。
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回知识库
              </Link>
            </div>
          </div>
          <SharePageButton
            title="中国政治体制 · 资料库"
            text="中央与国务院组织结构、历届三中全会、领导层 1971 至今沿革。"
            url="/china-politics"
          />
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="hidden md:block md:w-52 shrink-0">
          <nav className="toc-scroll-panel">
            <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
              目录
            </div>
            <ul className="space-y-2 text-sm text-[#666] dark:text-gray-300">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="font-bold text-[#444] opacity-90 hover:opacity-100 underline underline-offset-4 dark:text-gray-200"
                  >
                    {s.label}
                  </a>
                  <ul className="mt-2 space-y-1.5 border-l border-[#eee] pl-3 text-xs text-[#666] dark:border-gray-800 dark:text-gray-400">
                    {s.subs.map((sub) => (
                      <li key={sub.id}>
                        <a href={`#${sub.id}`} className="opacity-80 hover:opacity-100 underline underline-offset-4">
                          {sub.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 space-y-12">
          {/* ===== 一、组织 ===== */}
          <section id="org" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#333] dark:text-gray-100">一、组织</h2>

            <SubHeading id="org-central">中央核心权力机构</SubHeading>
            <Table data={CENTRAL_ORGANS} />

            <SubHeading id="org-statecouncil">国务院机构结构（第十四届）</SubHeading>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-400">国务院组成部门：26 个，正部级。</p>
            <Table data={STATE_COUNCIL_DEPTS} />
            <div className="mt-4 space-y-3">
              {STATE_COUNCIL_OTHER.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#eee] bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="text-[13px] font-semibold text-[#4a4c42] dark:text-gray-300">{item.label}</div>
                  <p className="mt-1 text-sm text-[#666] dark:text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-[#666] dark:text-gray-400">部委管理的国家局：17 个。</p>
            <Table data={STATE_COUNCIL_BUREAUS} />

            <SubHeading id="org-ranks">行政级别体系</SubHeading>
            <Table data={RANKS} />

            <SubHeading id="org-party-npc">党政关系与代会比较</SubHeading>
            <Table data={PARTY_VS_NPC} />

            <SubHeading id="org-system">制度特征与立场</SubHeading>
            <div className="mt-3 space-y-4">
              <div className="rounded-lg border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="text-[13px] font-semibold text-[#4a4c42] dark:text-gray-300">制度特征</div>
                <ul className="mt-2 space-y-1.5 text-sm text-[#666] dark:text-gray-300">
                  <li>· 党的领导：中央政治局常委会是实质决策核心。</li>
                  <li>· 议行合一：人大立法权与国务院行政权统一协调，区别于三权分立模式。</li>
                  <li>· 民主集中制：重大事项集体决策，贯彻“三重一大”原则。</li>
                </ul>
              </div>
              <div className="rounded-lg border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="text-[13px] font-semibold text-[#4a4c42] dark:text-gray-300">
                  官方对“三权分立”的立场
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
                  官方多次明确表态：不照搬西方式宪政、三权分立、司法独立。其公开陈述的理由包括认为这一模式效率较低、易出现扯皮推诿，且不符合中国国情。此处为对官方立场的客观记述，不代表本站观点。
                </p>
              </div>
            </div>
          </section>

          {/* ===== 二、历届三中全会 ===== */}
          <section id="plenary" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#333] dark:text-gray-100">二、历届三中全会</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
              三中全会通常聚焦经济与改革议题，是观察改革主线的重要窗口。下列为十一届至二十届要点。
            </p>

            <h3 id="plenary-list" className="sr-only">
              十一届—二十届要点
            </h3>
            <div className="mt-4 space-y-3">
              {PLENARY.map((item) => (
                <div
                  key={item.session}
                  className="rounded-lg border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h4 className="text-base font-semibold text-[#333] dark:text-gray-100">{item.session}</h4>
                    <span className="font-mono text-xs text-[#999] dark:text-gray-500">{item.date}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center rounded-full border border-[#cbd9ee] bg-[#eff4fc] px-2 py-0.5 text-[11px] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
                    <span className="font-medium text-[#444] dark:text-gray-200">主要内容：</span>
                    {item.content}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#797c70] dark:text-gray-400">
                    <span className="font-medium">延伸解读：</span>
                    {item.background}
                  </p>
                </div>
              ))}
            </div>

            <SubHeading id="plenary-focus">七个“聚焦”改革方向</SubHeading>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-400">摘自二十届三中全会。</p>
            <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SEVEN_FOCUS.map((f, i) => (
                <li
                  key={f}
                  className="flex items-start gap-2 rounded-lg border border-[#eee] bg-white p-3 text-sm text-[#666] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <span className="mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[#cbd9ee] bg-[#eff4fc] text-[11px] font-bold text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]">
                    {i + 1}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 space-y-2">
              {KEYWORDS.map((kw) => (
                <p key={kw.term} className="text-sm leading-relaxed text-[#666] dark:text-gray-300">
                  <span className="font-semibold text-[#444] dark:text-gray-200">{kw.term}</span>
                  ：{kw.desc}
                </p>
              ))}
            </div>
          </section>

          {/* ===== 三、领导层沿革 ===== */}
          <section id="leaders" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#333] dark:text-gray-100">三、领导层沿革</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
              中共高层领导结构 1971 年至今的演变时间轴。
            </p>

            <ul id="leaders-timeline" className="mt-5 scroll-mt-24">
              {LEADERS.map((item) => (
                <li key={item.period} className="relative border-l border-[#d0d2c6] pl-5 pb-5 dark:border-gray-700">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-[#9a9e8a] bg-white dark:border-gray-500 dark:bg-gray-900" />
                  <div className="font-mono text-xs text-[#999] dark:text-gray-500">{item.period}</div>
                  <div className="mt-0.5 text-sm font-semibold text-[#333] dark:text-gray-100">{item.title}</div>
                  <ul className="mt-1.5 space-y-1 text-sm text-[#666] dark:text-gray-300">
                    {item.lines.map((ln, i) => (
                      <li key={i}>
                        <span className="font-medium text-[#4a4c42] dark:text-gray-400">{ln.k}：</span>
                        {ln.v}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {/* ===== 延伸参考 ===== */}
          <section className="border-t border-[#eee] pt-6 dark:border-gray-800">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              延伸参考
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {REFERENCES.map((ref) => (
                <li key={ref.href}>
                  <a
                    href={ref.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5a6b8a] underline underline-offset-4 hover:text-[#33405a] dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {ref.label}（维基百科）
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  )
}
