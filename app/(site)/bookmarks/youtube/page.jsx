import BookmarksTocLayout from '../../components/BookmarksTocLayout'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import RanbiPaywall from '../../components/RanbiPaywall'

export const dynamic = 'force-static'

export const metadata = {
  title: 'YouTube 收藏',
  description: '按主题整理的 YouTube / B 站 / 纪录片与延伸资料收藏。',
  alternates: {
    canonical: '/bookmarks/youtube',
  },
}

const EPIGRAPHS = [
  '学而优则仕。',
  '如果年轻一代都是不假思索，把历史抛在身后，那当有一天它突然出现在我们面前的时候，我们甚至无法分辨出它的脸。',
]

const COLLECTIONS = [
  {
    id: 'politics-economy',
    title: '政治与经济',
    links: [
      {
        label: '福建帮：中共党内派系',
        url: 'https://www.youtube.com/watch?v=4o3qbZMkr-M',
        summary: '以福建系人事网络为线索，观察中共高层派系、地方履历和未来接班格局。',
      },
      {
        label: 'A 股暴涨真相',
        url: 'https://www.youtube.com/watch?v=req-Y83RHWo',
        summary: '从政策刺激、市场预期和实体收益角度解释 2024 年国庆前后的股市波动。',
      },
      {
        label: '王沪宁纪录片',
        url: 'https://www.youtube.com/watch?v=U2k0IGFl7rQ',
        summary: '梳理王沪宁从学者到三朝意识形态设计者的路径，以及新威权主义思想的影响。',
      },
    ],
    commentary: [
      '中国经济的问题不在于金融。作者前两期视频明确说到：中国的统治深谙「利出一孔」，明白这一点，就应清楚中国政府不可能让直接融资做大。',
      '中国的矛盾是统治者与被统治者的矛盾，是统治力量与民众发展诉求之间的矛盾——这绝非什么金融改革就能解决。如果直接融资可以放开，那何必在养老金问题上简单粗暴地延迟退休、对现有分配丝毫不动？',
      '其次，金融刺激就算有，也没什么作用。市场缺的不是资金也不是信心，而是收益。明明投进去都是亏，非说是信心问题；明明老百姓没钱，非说是有钱不消费。',
      '再说储蓄率，那个储蓄率没什么用：储蓄金额高，但高的不是普通老百姓。到这个时候还想走偏门延续经济盛景，纯属痴心妄想。全是亏损的国企，加上内卷到奄奄一息的民企，股市还想怎样？',
    ],
  },
  {
    id: 'leadership-2027',
    title: '2027 换届',
    links: [
      {
        label: '2027 年谁来做总书记',
        url: 'https://www.youtube.com/watch?v=wovUoN_mJ6k',
        summary: '围绕李强、丁薛祥、陈吉宁等人选推演 2027 年权力安排的可能性。',
      },
      {
        label: '陈吉宁纪录片',
        url: 'https://www.youtube.com/watch?v=ar0woNFQiFw',
        summary: '从陈吉宁的技术官僚背景和地方履历出发，分析其在未来政治排序中的位置。',
      },
      {
        label: '利出一孔与贫穷结构',
        url: 'https://www.youtube.com/watch?v=9Mu9Cpy2rG0',
        summary: '借“利出一孔”解释集权财政、资源分配和普通人财富积累受限之间的关系。',
      },
    ],
  },
  {
    id: 'prc',
    title: 'PRC · 制度参考',
    links: [
      {
        label: '中共中央政治局常务委员会',
        url: 'https://zh.wikipedia.org/wiki/中国共产党中央政治局常务委员会',
        summary: '用于快速查阅中共最高领导机构的组成、沿革和职权背景。',
      },
      {
        label: '中华人民共和国公务员',
        url: 'https://zh.wikipedia.org/wiki/中华人民共和国公务员',
        summary: '补充理解中国行政体系、干部身份和公务员制度的基础资料。',
      },
    ],
  },
  {
    id: 'domestic',
    title: '国内',
    links: [
      {
        label: '中国从哪里来：地理视角',
        url: 'https://www.youtube.com/watch?v=ciluyyd01vg',
        summary: '星球研究所以地理视角解释中国版图、气候、河流和文明空间的形成。',
      },
      {
        label: '中国山河的起源',
        url: 'https://www.youtube.com/watch?v=EmU5qzREWxw',
        summary: '从山脉、河流和地貌演化切入，回看中国自然景观背后的地质与时间尺度。',
      },
    ],
  },
  {
    id: 'wwii',
    title: '二战',
    note: '历史视野与影像。',
    films: [
      { title: '辛德勒名单', by: '斯皮尔伯格' },
      { title: '万湖会议', by: '屠杀政策的制定' },
      { title: '拯救大兵瑞恩', by: '斯皮尔伯格' },
      { title: '珍珠港', by: '战争 · 爱情' },
      { title: '帝国的毁灭', by: '' },
      { title: '我们的父辈', by: '' },
      { title: '奥本海默', by: '诺兰' },
    ],
    links: [
      {
        label: '第二次世界大战',
        url: 'https://zh.wikipedia.org/wiki/第二次世界大战',
        summary: '二战的时间线、参战方、主要战场和战后秩序的百科入口。',
      },
      {
        label: '纳粹德国如何走向败亡',
        url: 'https://www.youtube.com/watch?v=yS9jPK9AauY',
        summary: '以纳粹德国的战争扩张和失败过程为主线，梳理欧洲战场的关键转折。',
      },
    ],
  },
  {
    id: 'film',
    title: '电影',
    links: [
      {
        label: 'IMDb Top 250',
        url: 'https://www.imdb.com/chart/top/',
        summary: '影史高分电影榜单，可作为补片、比较导演作品和建立观影清单的入口。',
      },
    ],
  },
  {
    id: 'art',
    title: '艺术',
    links: [
      {
        label: '世上最贵的 10 幅名画',
        url: 'https://www.youtube.com/watch?v=fKqVUq1YrT0',
        summary: '通过名画价格和收藏故事，了解艺术市场、作品稀缺性和经典绘画的传播。',
      },
    ],
  },
  {
    id: 'religion',
    title: '宗教',
    links: [
      {
        label: '速览主要宗教与文化传统',
        url: 'https://www.youtube.com/watch?v=VPwFhB7hEYk',
        summary: '快速串联佛教、道教、犹太教、基督教、伊斯兰教和婆罗门文化的基本脉络。',
      },
      {
        label: '信仰冲突与终极答案',
        url: 'https://www.youtube.com/watch?v=eYxPCQWAiD4',
        summary: '借《普罗米修斯》讨论人在多元信仰和价值冲突中如何寻找意义与答案。',
      },
      {
        label: '基督教历史起源',
        url: 'https://www.youtube.com/watch?v=9EMx2kevK5U',
        summary: '宗教史系列第一集，整理基督教从犹太传统、耶稣运动到制度化传播的起点。',
      },
    ],
  },
  {
    id: 'exam',
    title: '考试',
    note: '2010 中考，2013 高考——我来自这里。',
    links: [
      {
        label: '《高考》：毛坦厂的日与夜',
        url: 'https://www.youtube.com/watch?v=WAmtH91S2GQ&t=2164s',
        summary: 'CCTV 纪录片聚焦毛坦厂中学，呈现高考工厂、家庭期待和县域教育竞争。',
      },
      {
        label: '农村初中纪录片：中考分流',
        url: 'https://www.youtube.com/watch?v=KxuoeuHyEnc',
        summary: '通过农村初中学生的升学处境，观察中考如何提前改变教育路径和阶层流动。',
      },
      {
        label: '纪录片《高三》',
        url: 'https://www.youtube.com/watch?v=0WZPKZo5Yvg',
        summary: '记录 2005 年高三教室、学生状态和备考生活，是理解应试教育日常的影像样本。',
      },
    ],
  },
  {
    id: 'sanhe',
    title: '三和',
    links: [
      {
        label: '纪录片《出路》',
        url: 'https://www.youtube.com/watch?v=48NkRFyGHMo',
        summary: '从教育和贫困的关系切入，呈现不同家庭背景下年轻人的选择空间与现实限制。',
      },
      {
        label: '一席：黄盈盈谈“小姐研究”',
        url: 'https://www.youtube.com/watch?v=-EaXSnphVQc',
        summary: '以社会学研究视角讨论性工作、底层女性处境和城市边缘劳动的复杂性。',
      },
      {
        label: '三和纪录片（B 站）',
        url: 'https://www.bilibili.com/video/BV1RN411v7o1/',
        summary: '围绕深圳三和青年、临时工和低欲望生活方式，补充观察城市劳动力边缘生态。',
      },
    ],
  },
  {
    id: 'gene',
    title: '基因',
    links: [
      {
        label: '圆桌派：基因',
        url: 'https://www.youtube.com/watch?v=Uebv0UgyLLo',
        summary: '以圆桌讨论方式聊基因科学、遗传观念和普通人对生命代码的理解误区。',
      },
      {
        label: '圆桌派：多样',
        url: 'https://www.youtube.com/watch?v=NV7FEUuH8cY',
        summary: '延续基因话题，讨论生命多样性、科学伦理和人类社会如何理解差异。',
      },
      {
        label: '圆桌派：出身',
        url: 'https://www.youtube.com/watch?v=yBbhoOdLQjg',
        summary: '讨论家世、成长环境和社会资源对个人命运的影响，与“基因”形成互文。',
      },
    ],
  },
  {
    id: 'work',
    title: '工作',
    links: [
      {
        label: '圆桌派：不想上班怎么破',
        url: 'https://www.youtube.com/watch?v=funujKaQa-M',
        summary: '围绕工作倦怠、职业意义和现代雇佣生活的压力，展开轻松但现实的讨论。',
      },
      {
        label: '圆桌派：租房',
        url: 'https://www.youtube.com/watch?v=5R3n5X-LSzQ',
        summary: '从租房生活谈城市漂泊、工作流动性和年轻人在大城市的临时感。',
      },
    ],
  },
  {
    id: 'ideal',
    title: '理想',
    links: [
      {
        label: '阶层认知与贫困设计',
        url: 'https://www.youtube.com/watch?v=q0lIXtk6iuU',
        summary: '讨论阶层、贫困惯性和个人认知边界，适合作为理想与现实张力的观察材料。',
      },
      {
        label: '停止胡思乱想',
        url: 'https://www.youtube.com/watch?v=u452JaSK24A',
        summary: '面向敏感、想太多的人，讨论如何处理内耗、焦虑和自我消耗。',
      },
    ],
  },
  {
    id: 'housing',
    title: '房地产',
    links: [
      {
        label: '2024 不买房，五年后房价如何',
        url: 'https://www.youtube.com/watch?v=Pj0MaBIwVzQ',
        summary: '借《十三邀》和王石相关观点，讨论房地产周期、买房决策和长期资产预期。',
      },
    ],
  },
  {
    id: 'geography',
    title: '地理与西部',
    note: '待补充链接的主题清单。',
    extras: ['地貌：喀斯特地形、丹霞地貌', '西部：巡游轨迹', '新疆：建设兵团、独库公路'],
  },
  {
    id: 'misc',
    title: '其他',
    links: [
      {
        label: '马云、支付宝与阿里巴巴变局',
        url: 'https://www.youtube.com/watch?v=2dP47tZEEZM',
        summary: '从马云隐退、支付宝控制权变化和阿里巴巴兴衰，观察平台公司与监管关系。',
      },
    ],
  },
]

function platformOf(url) {
  if (url.includes('/shorts/')) return 'YT Shorts'
  if (url.includes('bilibili.com')) return 'Bilibili'
  if (url.includes('imdb.com')) return 'IMDb'
  if (url.includes('wikipedia.org')) return '维基百科'
  if (url.includes('youtu')) return 'YouTube'
  return '链接'
}

const tocItems = COLLECTIONS.map((c) => ({ id: c.id, title: c.title }))

export default function YoutubeBookmarksPage() {
  return (
    <>
      <ContentPvBeacon category="resource" slug="bookmarks-youtube" />
      <RanbiPaywall resourceKey="resource:bookmarks-youtube" unitLabel="资源">
        <BookmarksTocLayout
          title="YouTube 收藏"
          description="按主题整理的 YouTube / B 站 / 纪录片与延伸资料收藏。"
          tocItems={tocItems}
          footer={<p>这里收集值得回看的影像与资料，按主题归类，持续整理。</p>}
        >
      <div className="space-y-8">
        <div className="border-l-2 border-[#c2c6b8] pl-4 text-sm italic leading-relaxed text-[#777] dark:border-gray-700 dark:text-gray-400">
          {EPIGRAPHS.map((line) => (
            <p key={line} className="m-0 mt-2 first:mt-0">
              {line}
            </p>
          ))}
        </div>

        {COLLECTIONS.map((c) => (
          <section
            key={c.id}
            id={c.id}
            className="scroll-mt-24 border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="text-base font-semibold text-[#333] dark:text-gray-100">{c.title}</h2>
            {c.note ? <p className="mt-1 text-sm text-[#888] dark:text-gray-400">{c.note}</p> : null}

            {c.films ? (
              <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {c.films.map((f) => (
                  <li key={f.title} className="text-sm text-[#666] dark:text-gray-300">
                    《{f.title}》
                    {f.by ? <span className="ml-1 text-xs text-[#858876] dark:text-gray-500">{f.by}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {c.links ? (
              <ul className="mt-3 space-y-1.5">
                {c.links.map((link) => (
                  <li key={link.url}>
                    <div className="space-y-1">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="no-external-arrow group inline-flex items-baseline gap-2 text-sm text-[#444] no-underline hover:text-[#111] dark:text-gray-300 dark:hover:text-white"
                      >
                        <span className="shrink-0 rounded border border-[#d4d7cb] bg-[#f4f5f0] px-1.5 py-0.5 text-[10px] text-[#858876] dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-500">
                          {platformOf(link.url)}
                        </span>
                        <span className="underline decoration-[#ddd] underline-offset-4 group-hover:decoration-[#999]">
                          {link.label}
                        </span>
                      </a>
                      {link.summary ? (
                        <p className="m-0 pl-[72px] text-xs leading-relaxed text-[#777] dark:text-gray-400 sm:text-sm">
                          {link.summary}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {c.extras ? (
              <ul className="mt-3 space-y-1 text-sm text-[#666] dark:text-gray-300">
                {c.extras.map((e) => (
                  <li key={e}>· {e}</li>
                ))}
              </ul>
            ) : null}

            {c.commentary ? (
              <div className="mt-4 border-l-2 border-[#b7791f] bg-[#ebede3] px-4 py-3 dark:border-[#9ba475] dark:bg-[#1c1d15]">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a5a14] dark:text-[#9ba475]">
                  评论 · 引自视频作者
                </div>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-[#333431] dark:text-gray-200">
                  {c.commentary.map((para, idx) => (
                    <p key={idx} className="m-0">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </div>
        </BookmarksTocLayout>
      </RanbiPaywall>
      <ContentEngagement contentKey="resource:bookmarks-youtube" width="standard" />
    </>
  )
}
