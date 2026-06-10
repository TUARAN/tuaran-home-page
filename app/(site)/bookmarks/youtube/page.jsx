import BookmarksTocLayout from '../../components/BookmarksTocLayout'

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
      { label: '派系', url: 'https://www.youtube.com/watch?v=4o3qbZMkr-M' },
      { label: '2024 国庆前后股市波动：宏观调控与市场经济', url: 'https://www.youtube.com/watch?v=req-Y83RHWo' },
      { label: '王沪宁', url: 'https://www.youtube.com/watch?v=U2k0IGFl7rQ' },
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
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=wovUoN_mJ6k' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=ar0woNFQiFw' },
      { label: '视频 3', url: 'https://www.youtube.com/watch?v=9Mu9Cpy2rG0' },
    ],
  },
  {
    id: 'power',
    title: '权力',
    links: [
      { label: '短片 1', url: 'https://youtube.com/shorts/4zgMbRu852c' },
      { label: '短片 2', url: 'https://youtube.com/shorts/_exakl3wm3Q' },
    ],
  },
  {
    id: 'prc',
    title: 'PRC · 制度参考',
    links: [
      {
        label: '中共中央政治局常务委员会',
        url: 'https://zh.wikipedia.org/wiki/中国共产党中央政治局常务委员会',
      },
      { label: '中华人民共和国公务员', url: 'https://zh.wikipedia.org/wiki/中华人民共和国公务员' },
    ],
  },
  {
    id: 'domestic',
    title: '国内',
    links: [
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=ciluyyd01vg' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=EmU5qzREWxw' },
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
      { label: '第二次世界大战', url: 'https://zh.wikipedia.org/wiki/第二次世界大战' },
      { label: '二战影像', url: 'https://www.youtube.com/watch?v=yS9jPK9AauY' },
    ],
  },
  {
    id: 'film',
    title: '电影',
    links: [{ label: 'IMDb Top 250', url: 'https://www.imdb.com/chart/top/' }],
  },
  {
    id: 'art',
    title: '艺术',
    links: [{ label: '艺术', url: 'https://www.youtube.com/watch?v=fKqVUq1YrT0' }],
  },
  {
    id: 'religion',
    title: '宗教',
    links: [
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=VPwFhB7hEYk' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=eYxPCQWAiD4' },
      { label: '视频 3', url: 'https://www.youtube.com/watch?v=9EMx2kevK5U' },
    ],
  },
  {
    id: 'exam',
    title: '考试',
    note: '2010 中考，2013 高考——我来自这里。',
    links: [
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=WAmtH91S2GQ&t=2164s' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=KxuoeuHyEnc' },
      { label: '视频 3', url: 'https://www.youtube.com/watch?v=0WZPKZo5Yvg' },
    ],
  },
  {
    id: 'sanhe',
    title: '三和',
    links: [
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=u7XhF34Lwbs' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=48NkRFyGHMo' },
      { label: '视频 3', url: 'https://www.youtube.com/watch?v=-EaXSnphVQc' },
      { label: '纪录片（B 站）', url: 'https://www.bilibili.com/video/BV1RN411v7o1/' },
    ],
  },
  {
    id: 'gene',
    title: '基因',
    links: [
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=Uebv0UgyLLo' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=NV7FEUuH8cY' },
      { label: '视频 3', url: 'https://www.youtube.com/watch?v=yBbhoOdLQjg' },
    ],
  },
  {
    id: 'work',
    title: '工作',
    links: [
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=funujKaQa-M' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=5R3n5X-LSzQ' },
    ],
  },
  {
    id: 'ideal',
    title: '理想',
    links: [
      { label: '视频 1', url: 'https://www.youtube.com/watch?v=q0lIXtk6iuU' },
      { label: '视频 2', url: 'https://www.youtube.com/watch?v=u452JaSK24A' },
    ],
  },
  {
    id: 'housing',
    title: '房地产',
    links: [{ label: '房地产', url: 'https://www.youtube.com/watch?v=Pj0MaBIwVzQ' }],
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
    links: [{ label: '视频', url: 'https://www.youtube.com/watch?v=2dP47tZEEZM' }],
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
  )
}
