import Link from 'next/link'
import RanbiPaywall from '../components/RanbiPaywall'

import SharePageButton from '../components/SharePageButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '儒释道 · 神仙体系调研',
  description:
    '把儒释道三教的人物 / 神祇体系拉成一张结构图：佛教按果位分五层，道教按神格分十级，儒家则是文庙从祀的圣贤道统。',
  keywords: ['涂阿燃', 'tuaran', '儒释道', '佛教', '道教', '儒家', '神仙体系', '资料库'],
  alternates: {
    canonical: '/ru-shi-dao',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// 三教各用一种配色：释=暖金、道=青蓝、儒=松绿（沿用站内调研标签配色）
const ACCENT = {
  amber: 'border-[#c9cbb8] bg-[#ebede3] text-[#8a5a14] dark:border-[#26281c] dark:bg-[#1c1d15] dark:text-[#9ba475]',
  blue: 'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  green: 'border-[#d6e6dd] bg-[#eef6f1] text-[#386b54] dark:border-[#243d33] dark:bg-[#13201a] dark:text-[#9dcab1]',
}

const BUDDHISM_TIERS = [
  {
    id: 'bud-1',
    no: '1',
    title: '佛',
    sub: '最高层 · 觉行圆满',
    desc: '佛教果位的顶层。竖三世佛按「时间」排列，横三世佛按「空间」（三大世界）排列。',
    groups: [
      {
        label: '竖三世佛（按时间）',
        note: '过去 — 现在 — 未来',
        items: [
          { name: '燃灯佛', detail: '过去佛' },
          { name: '释迦牟尼佛', detail: '现在佛' },
          { name: '弥勒佛', detail: '未来佛' },
        ],
      },
      {
        label: '横三世佛 · 东方三圣',
        note: '东方净琉璃世界',
        items: [
          { name: '药师佛', detail: '主尊' },
          { name: '日光遍照菩萨', detail: '左胁侍' },
          { name: '月光遍照菩萨', detail: '右胁侍' },
        ],
      },
      {
        label: '横三世佛 · 中央三圣（华严三圣）',
        note: '中央娑婆世界',
        items: [
          { name: '释迦牟尼佛', detail: '主尊' },
          { name: '文殊菩萨', detail: '左胁侍' },
          { name: '普贤菩萨', detail: '右胁侍' },
        ],
      },
      {
        label: '横三世佛 · 西方三圣',
        note: '西方极乐世界',
        items: [
          { name: '阿弥陀佛', detail: '主尊' },
          { name: '观音菩萨', detail: '左胁侍' },
          { name: '大势至菩萨', detail: '右胁侍' },
        ],
      },
    ],
  },
  {
    id: 'bud-2',
    no: '2',
    title: '菩萨',
    sub: '大乘理想化人物 · 自觉觉他',
    desc: '已近佛境，却倒驾慈航、留在世间度化众生。',
    groups: [
      {
        label: '八大菩萨（常见说法）',
        note: '不同经典所列略有出入',
        items: ['观音菩萨', '文殊菩萨', '普贤菩萨', '地藏菩萨', '大势至菩萨', '灵吉菩萨', '日光菩萨', '月光菩萨'],
      },
    ],
  },
  {
    id: 'bud-3',
    no: '3',
    title: '阿罗汉',
    sub: '小乘修行者 · 自觉解脱',
    desc: '声闻乘修行的最高果位，断尽烦恼、了脱生死。',
    groups: [
      {
        label: '十八罗汉',
        note: '名号各家不一，本页取常见一种说法',
        items: [
          '降龙罗汉', '伏虎罗汉', '笑狮罗汉', '坐鹿罗汉', '骑象罗汉', '欢喜罗汉',
          '开心罗汉', '探手罗汉', '托塔罗汉', '举钵罗汉', '过江罗汉', '芭蕉罗汉',
          '长眉罗汉', '看门罗汉', '静坐罗汉', '沉思罗汉', '挖耳罗汉', '布袋罗汉',
        ],
      },
    ],
  },
  {
    id: 'bud-4',
    no: '4',
    title: '护法神',
    sub: '守护佛法',
    desc: '护持佛法、守卫道场与修行者的神祇，多由古印度天神演化而来。',
    groups: [
      {
        label: '四大天王（四大金刚）',
        items: [
          { name: '持国天王', detail: '东方' },
          { name: '增长天王', detail: '南方' },
          { name: '广目天王', detail: '西方' },
          { name: '多闻天王', detail: '北方' },
        ],
      },
      {
        label: '天龙八部',
        items: ['天众', '龙众', '夜叉', '乾闼婆', '阿修罗', '迦楼罗', '紧那罗', '摩睺罗伽'],
      },
      {
        label: '释迦十大弟子',
        items: [
          { name: '舍利弗', detail: '智慧第一' },
          { name: '目犍连', detail: '神通第一' },
          { name: '摩诃迦叶', detail: '头陀第一' },
          { name: '阿那律', detail: '天眼第一' },
          { name: '须菩提', detail: '解空第一' },
          { name: '富楼那', detail: '说法第一' },
          { name: '迦旃延', detail: '论议第一' },
          { name: '优波离', detail: '持戒第一' },
          { name: '罗睺罗', detail: '密行第一' },
          { name: '阿难陀', detail: '多闻第一' },
        ],
      },
      {
        label: '二十诸天',
        note: '护持佛法的二十位天神',
        items: [
          '大梵天', '帝释天', '多闻天王', '持国天王', '增长天王', '广目天王',
          '密迹金刚', '大自在天', '散脂大将', '大辩才天', '大功德天', '韦驮天',
          '坚牢地神', '菩提树神', '鬼子母', '摩利支天', '日宫天子', '月宫天子',
          '娑竭罗龙王', '阎摩罗王',
        ],
      },
      {
        label: '十八伽蓝（寺院守护神）',
        note: '守护伽蓝（寺院）的护法神，名号说法不一',
        items: [
          '美音', '梵音', '天鼓', '叹妙', '叹美', '摩妙', '雷音', '师子', '妙叹',
          '梵响', '人音', '佛奴', '颂德', '广目', '妙眼', '彻听', '彻视', '遍观',
        ],
      },
    ],
  },
  {
    id: 'bud-5',
    no: '5',
    title: '冥界',
    sub: '冥界神明 · 地狱审判',
    desc: '佛教的地狱审判系统，传入中国后与道教、民间信仰深度融合。',
    groups: [
      {
        label: '十殿阎王',
        note: '各掌一殿，依次审判亡魂',
        items: [
          '一殿秦广王', '二殿楚江王', '三殿宋帝王', '四殿五官王', '五殿阎罗王',
          '六殿卞城王', '七殿泰山王', '八殿都市王', '九殿平等王', '十殿转轮王',
        ],
      },
    ],
  },
]

const TAOISM_TIERS = [
  {
    id: 'tao-1',
    no: '1',
    title: '三清',
    sub: '最高层',
    desc: '道教最高神，是「道」的人格化与三种化身。',
    groups: [
      {
        label: '三清',
        items: [
          { name: '元始天尊', detail: '玉清' },
          { name: '灵宝天尊', detail: '上清' },
          { name: '道德天尊', detail: '太清 · 太上老君' },
        ],
      },
    ],
  },
  {
    id: 'tao-2',
    no: '2',
    title: '四御',
    sub: '宇宙治理核心',
    desc: '三清之下的统治神祇，分掌天、地、人、冥。',
    groups: [
      {
        label: '四御',
        items: [
          { name: '玉皇大帝', detail: '昊天金阙至尊' },
          { name: '北极紫微大帝', detail: '掌星辰' },
          { name: '勾陈上宫天皇大帝', detail: '主社稷兵戈' },
          { name: '后土皇地祇', detail: '地母神' },
        ],
      },
    ],
  },
  {
    id: 'tao-3',
    no: '3',
    title: '星辰诸神',
    sub: '天文神',
    desc: '把日月星辰人格化为神。',
    groups: [
      {
        label: '星君',
        items: [
          '二十八星宿',
          { name: '南斗六星', detail: '主生' },
          { name: '北斗七星', detail: '主死' },
          '太阳星君',
          '太阴星君',
          '紫微星君',
          { name: '太白星君', detail: '即金星' },
        ],
      },
    ],
  },
  {
    id: 'tao-4',
    no: '4',
    title: '三官大帝',
    sub: '天 / 地 / 水三界',
    groups: [
      {
        label: '三官',
        items: [
          { name: '天官大帝', detail: '赐福' },
          { name: '地官大帝', detail: '赦罪' },
          { name: '水官大帝', detail: '解厄' },
        ],
      },
    ],
  },
  {
    id: 'tao-5',
    no: '5',
    title: '地祇与冥界',
    sub: '掌生死',
    desc: '管辖大地、山岳与亡魂的神祇。',
    groups: [
      {
        label: '地祇与冥界',
        items: [
          { name: '东岳大帝', detail: '泰山神 · 掌生死' },
          { name: '五方五岳大帝', detail: '泰 / 华 / 衡 / 恒 / 嵩' },
          { name: '城隍神', detail: '主管生死簿' },
          { name: '土地神', detail: '基层守护' },
          { name: '十殿阎王', detail: '借自佛教' },
        ],
      },
    ],
  },
  {
    id: 'tao-6',
    no: '6',
    title: '尊神与真君',
    sub: '重要神祇',
    groups: [
      {
        label: '尊神真君',
        items: [
          { name: '真武大帝', detail: '玄天上帝 · 镇北方' },
          { name: '文昌帝君', detail: '掌文运科举' },
          { name: '关圣帝君', detail: '关羽 · 武财神 / 忠义' },
          { name: '东王公', detail: '与西王母并称' },
          { name: '西王母', detail: '昆仑仙境 · 长生' },
          { name: '妈祖', detail: '天上圣母 · 海神' },
        ],
      },
    ],
  },
  {
    id: 'tao-7',
    no: '7',
    title: '护法雷部',
    sub: '司雷罚、斩妖',
    groups: [
      {
        label: '雷部与自然神',
        items: [
          { name: '雷祖', detail: '雷霆之主' },
          '五雷将军',
          { name: '祝融', detail: '火神' },
          { name: '共工', detail: '水神' },
          '风伯',
          '雨师',
        ],
      },
    ],
  },
  {
    id: 'tao-8',
    no: '8',
    title: '仙人体系',
    sub: '得道者',
    groups: [
      {
        label: '八仙',
        items: ['吕洞宾', '张果老', '铁拐李', '汉钟离', '曹国舅', '蓝采和', '韩湘子', '何仙姑'],
      },
      {
        label: '四大天师',
        items: ['张道陵', '许逊', '萨守坚', '张继先'],
      },
    ],
  },
  {
    id: 'tao-9',
    no: '9',
    title: '诸天与天界',
    sub: '天界层次',
    groups: [
      {
        label: '天界结构',
        items: [
          '三十六天',
          '三十六洞天',
          '七十二福地',
          { name: '三界', detail: '玉清 / 上清 / 太清' },
          '天庭官职体系',
        ],
      },
    ],
  },
  {
    id: 'tao-10',
    no: '10',
    title: '民间信仰融合',
    sub: '民俗神',
    desc: '道教在民间不断吸纳历史人物与生活神，形成庞杂的民俗神谱。',
    groups: [
      {
        label: '财神',
        items: [
          { name: '文财神', detail: '比干 · 范蠡' },
          { name: '武财神', detail: '关帝 · 赵公明' },
        ],
      },
      {
        label: '家宅与生活神',
        items: [
          { name: '灶神', detail: '上天言好事' },
          { name: '门神', detail: '秦琼 · 尉迟恭' },
          { name: '医神', detail: '华佗 · 孙思邈' },
        ],
      },
    ],
  },
]

const CONFUCIAN_TIERS = [
  {
    id: 'ru-1',
    no: '1',
    title: '至圣',
    sub: '道统之首',
    groups: [
      {
        label: '大成至圣先师',
        items: [{ name: '孔子', detail: '儒家创始人' }],
      },
    ],
  },
  {
    id: 'ru-2',
    no: '2',
    title: '四配',
    sub: '配享孔子',
    desc: '紧随孔子配享文庙的四位圣人。',
    groups: [
      {
        label: '四配',
        items: [
          { name: '颜回', detail: '复圣' },
          { name: '曾参', detail: '宗圣' },
          { name: '孔伋', detail: '述圣 · 子思' },
          { name: '孟子', detail: '亚圣' },
        ],
      },
    ],
  },
  {
    id: 'ru-3',
    no: '3',
    title: '十二哲',
    sub: '孔门贤哲',
    groups: [
      {
        label: '十二哲',
        note: '多为孔门弟子，末位朱熹为后世增入',
        items: ['闵子骞', '冉伯牛', '冉雍', '宰我', '子贡', '冉有', '子路', '子游', '子夏', '有若', '子张', '朱熹'],
      },
    ],
  },
  {
    id: 'ru-4',
    no: '4',
    title: '先贤先儒',
    sub: '历代大儒',
    desc: '历代有功于儒学者，按贡献配享孔庙，构成不断延展的「道统」序列。',
    groups: [
      {
        label: '代表人物（先贤先儒）',
        items: ['董仲舒', '韩愈', '周敦颐', '程颢', '程颐', '张载', '邵雍', '王阳明'],
      },
    ],
  },
]

const RELIGIONS = [
  {
    id: 'buddhism',
    name: '释 · 佛教',
    accent: 'amber',
    summary:
      '按修证果位分层：佛（觉行圆满）→ 菩萨（自觉觉他）→ 阿罗汉（自觉解脱）→ 护法神（护持佛法）→ 冥界（地狱审判）。',
    tiers: BUDDHISM_TIERS,
  },
  {
    id: 'taoism',
    name: '道 · 道教',
    accent: 'blue',
    summary:
      '按神格与职能分级：三清（道之化身）→ 四御（宇宙治理）→ 星辰 / 三官 / 地祇冥界 / 尊神真君 / 雷部 / 仙人 / 诸天，最后融入大量民俗神。',
    tiers: TAOISM_TIERS,
  },
  {
    id: 'confucianism',
    name: '儒 · 儒家',
    accent: 'green',
    summary: '以「道统」代替「神谱」：至圣孔子 → 四配 → 十二哲 → 历代先贤先儒，依对儒学的贡献配享文庙。',
    note: '儒家本质是入世的伦理—政治哲学，并无「神仙体系」。与佛道并置时，其结构性对应物是文庙（孔庙）从祀的「圣贤道统」——历代官方供奉、配享孔庙的先圣先贤序列。',
    tiers: CONFUCIAN_TIERS,
  },
]

function Item({ item }) {
  const isObj = typeof item === 'object' && item !== null
  const name = isObj ? item.name : item
  const detail = isObj ? item.detail : null
  return (
    <span className="inline-flex items-center rounded-full border border-[#d4d7cb] bg-[#f4f5f0] px-2.5 py-1 text-[13px] text-[#3c3d34] dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
      {name}
      {detail ? <span className="ml-1 text-[11px] text-[#858876] dark:text-gray-500">{detail}</span> : null}
    </span>
  )
}

function Group({ group }) {
  return (
    <div className="mt-3">
      {group.label ? (
        <div className="text-[13px] font-semibold text-[#4a4c42] dark:text-gray-300">{group.label}</div>
      ) : null}
      {group.note ? (
        <p className="mt-0.5 text-xs text-[#797c70] dark:text-gray-500">{group.note}</p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {group.items.map((it, idx) => (
          <Item key={idx} item={it} />
        ))}
      </div>
    </div>
  )
}

function Tier({ tier, accent }) {
  return (
    <div
      id={tier.id}
      className="scroll-mt-24 rounded-xl border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span
          className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border px-1.5 text-xs font-bold ${ACCENT[accent]}`}
        >
          {tier.no}
        </span>
        <h3 className="text-base font-semibold text-[#333] dark:text-gray-100">{tier.title}</h3>
        {tier.sub ? <span className="text-xs text-[#999] dark:text-gray-500">{tier.sub}</span> : null}
      </div>
      {tier.desc ? <p className="mt-2 text-sm text-[#666] dark:text-gray-400">{tier.desc}</p> : null}
      {tier.groups.map((g, idx) => (
        <Group key={idx} group={g} />
      ))}
    </div>
  )
}

function RuShiDaoContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              儒释道 · 神仙体系
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
              资料库：把儒释道三教的「人物 / 神祇体系」拉成一张结构图——佛教按果位分五层，道教按神格分十级，儒家则是文庙从祀的圣贤道统。三教各成系统，又长期相互融合。
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回知识库
              </Link>
            </div>
          </div>
          <SharePageButton
            title="儒释道 · 神仙体系调研"
            text="佛教五层果位、道教十级神格、儒家文庙道统——三教神仙体系结构图。"
            url="/ru-shi-dao"
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
              {RELIGIONS.map((r) => (
                <li key={r.id}>
                  <a
                    href={`#${r.id}`}
                    className="font-bold text-[#444] opacity-90 hover:opacity-100 underline underline-offset-4 dark:text-gray-200"
                  >
                    {r.name}
                  </a>
                  <ul className="mt-2 space-y-1.5 border-l border-[#eee] pl-3 text-xs text-[#666] dark:border-gray-800 dark:text-gray-400">
                    {r.tiers.map((t) => (
                      <li key={t.id}>
                        <a href={`#${t.id}`} className="opacity-80 hover:opacity-100 underline underline-offset-4">
                          {t.no}. {t.title}
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
          <p className="rounded-lg border border-[#dee0db] bg-[#f4f5f0] px-4 py-3 text-xs leading-relaxed text-[#797c70] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            说明：本页是面向「建立整体认知」的通俗梳理，非教义考据。三教神谱本身是长期演变、相互附会的产物，各宗派与典籍说法多有出入（如十八罗汉名号、二十诸天、八仙排序），本页均取较常见的一种说法。
          </p>

          {RELIGIONS.map((r) => (
            <section key={r.id} id={r.id} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-[#333] dark:text-gray-100">{r.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">{r.summary}</p>
              {r.note ? (
                <p
                  className={`mt-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${ACCENT[r.accent]}`}
                >
                  {r.note}
                </p>
              ) : null}
              <div className="mt-4 space-y-4">
                {r.tiers.map((t) => (
                  <Tier key={t.id} tier={t} accent={r.accent} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}

export default function RuShiDaoPage() {
  return (
    <RanbiPaywall resourceKey="resource:ru-shi-dao" unitLabel="资料">
      <RuShiDaoContent />
    </RanbiPaywall>
  )
}
