export const CZ_MEMOIR_BASE_PATH = '/resources/cz-memoirs'
export const CZ_MEMOIR_COVER = '/images/cz-memoirs/cover.jpg'

export const CZ_MEMOIR_CHAPTER_GROUPS = [
  {
    id: 'opening',
    period: '序',
    title: '从他人眼中的 CZ 开始',
    summary: '推荐语、献词、序言与前言，交代这本回忆录的叙述视角和核心主题。',
    chapters: [
      ['推荐语', '00-recommendations'],
      ['献词', '01-dedication'],
      ['序言：外面没有别人', '02-preface'],
      ['前言', '03-foreword'],
    ],
  },
  {
    id: 'early-years',
    period: '1977—2013',
    title: '从江苏到加拿大、麦吉尔与东京',
    summary: '农村童年、12 岁移民加拿大、计算机学习与跨国程序员经历，构成创业前的个人底色。',
    chapters: [
      ['早年岁月', '05-early-years'],
      ['温哥华，1989—1995', '06-vancouver'],
      ['麦吉尔岁月，1995—1999', '07-mcgill'],
      ['东京岁月', '08-tokyo-years'],
    ],
  },
  {
    id: 'crypto',
    period: '2013—2017',
    title: '进入比特币行业',
    summary: '从 2013 年第一次接触比特币，到比捷科技，再到设计并启动币安。',
    chapters: [
      ['初识比特币：2013', '09-bitcoin-2013'],
      ['比捷科技', '10-bijie-tech'],
      ['币安诞生', '11-binance-birth'],
    ],
  },
  {
    id: 'rise',
    period: '2017—2018',
    title: '币安上线与快速崛起',
    summary: '交易所上线、中国监管政策变化、迁往东京，以及币安成为行业头部平台的过程。',
    chapters: [
      ['币安上线', '04-binance-launch'],
      ['中国禁令', '12-china-ban'],
      ['东京', '13-tokyo'],
      ['世界第一', '14-number-one'],
      ['一周年庆典', '15-anniversary'],
    ],
  },
  {
    id: 'storms',
    period: '2019—2022',
    title: '加密寒冬与全球化挑战',
    summary: '市场周期、复杂用户事件、疫情年份与全球扩张，呈现高速增长背后的运营压力。',
    chapters: [
      ['2019 加密寒冬', '16-crypto-winter-2019'],
      ['2020', '17-year-2020'],
      ['棘手案例', '18-tricky-cases'],
      ['2021', '19-year-2021'],
      ['2022 年，漫游地球', '20-roaming-earth-2022'],
    ],
  },
  {
    id: 'us',
    period: '2023—2025',
    title: '美国司法部谈判、入狱与特赦',
    summary: '从司法部谈判、主动赴美，到服刑、支持加密政策转向和获得特赦。',
    chapters: [
      ['2023 年，司法部谈判', '21-doj-2023'],
      ['飞去美国', '22-flying-to-america'],
      ['美国的“支持加密”时代', '23-pro-crypto-era'],
      ['特赦', '24-pardon'],
    ],
  },
  {
    id: 'closing',
    period: '尾声与番外',
    title: '原则、结语与回忆录之后的争议',
    summary: '回看 CZ 的个人原则，并收录回忆录出版后引发的社交媒体争议时间线。',
    chapters: [
      ['结语', '25-epilogue'],
      ['附录：CZ 的原则', '26-cz-principles'],
      ['Twitter 风暴：回忆录引爆的 11 年恩怨', '27-twitter-feud'],
    ],
  },
]

export const CZ_MEMOIR_CHAPTERS = CZ_MEMOIR_CHAPTER_GROUPS.flatMap((group) =>
  group.chapters.map(([title, slug]) => ({ title, slug, groupId: group.id, period: group.period })),
)

export function getCzMemoirChapter(slug) {
  return CZ_MEMOIR_CHAPTERS.find((chapter) => chapter.slug === String(slug || '')) || null
}

export function czMemoirChapterPath(slug) {
  return `${CZ_MEMOIR_BASE_PATH}/${slug}`
}
