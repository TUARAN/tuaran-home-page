import Image from 'next/image'
import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'cz-memoirs'
const RESOURCE_PATH = `/resources/${RESOURCE_SLUG}`
const RESOURCE_URL = `https://2aran.com${RESOURCE_PATH}`
const READER_URL = 'https://cz.fate.red'
const REPOSITORY_URL = 'https://github.com/TUARAN/cz_memoirs'
const TITLE = '赵长鹏自传《币安人生》在线阅读｜CZ 回忆录简体中文版'
const DESCRIPTION =
  '赵长鹏（CZ）自传《币安人生》简体中文在线阅读入口与完整章节目录：从江苏农村、加拿大求学、东京程序员到创立币安，并经历监管风暴、美国司法部谈判、入狱与特赦。'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    '赵长鹏自传',
    '币安人生',
    'CZ 回忆录',
    '赵长鹏回忆录',
    '币安创始人',
    '币安历史',
    '加密货币创业',
    '简体中文版',
    '在线阅读',
  ],
  alternates: { canonical: RESOURCE_PATH },
  openGraph: {
    type: 'book',
    locale: 'zh_CN',
    siteName: '2aran.com',
    title: '《币安人生》：赵长鹏（CZ）自传简体中文版',
    description: DESCRIPTION,
    url: RESOURCE_URL,
    images: [
      {
        url: `${READER_URL}/images/cover.jpg`,
        width: 1200,
        height: 1600,
        alt: '赵长鹏自传《币安人生》封面',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '赵长鹏自传《币安人生》在线阅读',
    description: '从江苏农村到创立币安，再到监管风暴、入狱与特赦：CZ 回忆录简体中文版章节导航。',
    images: [`${READER_URL}/images/cover.jpg`],
  },
}

const chapterGroups = [
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

const quickFacts = [
  ['作者', '赵长鹏（CZ）'],
  ['中文书名', '《币安人生》'],
  ['内容形态', '简体中文 Web 文档'],
  ['章节规模', '正文、附录与番外共 28 篇'],
  ['项目技术', 'VitePress · Cloudflare Pages'],
  ['开源仓库', 'TUARAN/cz_memoirs'],
]

const faqs = [
  {
    question: '《币安人生》讲了什么？',
    answer:
      '这是赵长鹏的个人回忆录，覆盖他的江苏童年、加拿大求学和程序员经历、进入比特币行业、2017 年创立币安，以及此后的监管压力、美国司法部谈判、服刑与特赦。',
  },
  {
    question: '在哪里可以在线阅读简体中文版？',
    answer: '点击页面中的“开始在线阅读”或任一章节，即可前往 cz.fate.red 的对应正文页面。',
  },
  {
    question: '这个站内专题和独立阅读站是什么关系？',
    answer:
      '2aran.com 提供导读、人生阶段梳理和完整章节导航；cz.fate.red 承载正文阅读；GitHub 仓库保存可复用、可追踪更新的项目源码。',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${RESOURCE_URL}#page`,
      name: TITLE,
      description: DESCRIPTION,
      url: RESOURCE_URL,
      inLanguage: 'zh-CN',
      datePublished: '2026-09-15',
      dateModified: '2026-09-15',
      isBasedOn: [READER_URL, REPOSITORY_URL],
      about: { '@id': `${RESOURCE_URL}#book` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: chapterGroups.reduce((count, group) => count + group.chapters.length, 0),
        itemListElement: chapterGroups.flatMap((group) =>
          group.chapters.map(([name, slug], index) => ({
            '@type': 'ListItem',
            position:
              chapterGroups
                .slice(0, chapterGroups.indexOf(group))
                .reduce((count, item) => count + item.chapters.length, 0) +
              index +
              1,
            name,
            url: `${READER_URL}/chapters/${slug}`,
          })),
        ),
      },
    },
    {
      '@type': 'Book',
      '@id': `${RESOURCE_URL}#book`,
      name: '币安人生',
      alternateName: ['CZ 回忆录', '赵长鹏自传'],
      author: { '@type': 'Person', name: '赵长鹏', alternateName: 'CZ' },
      inLanguage: 'zh-CN',
      image: `${READER_URL}/images/cover.jpg`,
      url: READER_URL,
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
}

function ReaderLink({ slug, children, className = '' }) {
  return (
    <a
      href={`${READER_URL}/chapters/${slug}`}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}

export default function CzMemoirsResourcePage() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-8 text-slate-950 dark:text-slate-100 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/articles?group=resource" className="underline decoration-slate-300 underline-offset-4 hover:text-amber-600">
          资源库
        </Link>
        <span aria-hidden="true">·</span>
        <span>人物回忆录</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-09-15">2026-09-15</time>
        <span aria-hidden="true">·</span>
        <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
      </div>

      <header className="mt-5 overflow-hidden rounded-[2rem] border border-amber-200/80 bg-[#fffaf0] shadow-sm dark:border-amber-900/70 dark:bg-[#15120c]">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_260px] lg:items-center lg:p-12">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400">
              Changpeng Zhao · Memoir
            </p>
            <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold leading-[1.16] tracking-tight sm:text-6xl">
              赵长鹏自传
              <span className="mt-2 block text-amber-700 dark:text-amber-400">《币安人生》在线阅读</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              幸运、韧性与保护用户的回忆录。沿着 28 篇正文、附录与番外，读完 CZ 从江苏农村到加拿大、从程序员到币安创始人，再到监管风暴、入狱与特赦的人生轨迹。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ReaderLink
                slug="00-recommendations"
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
              >
                开始在线阅读 ↗
              </ReaderLink>
              <a href="#chapters" className="rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-amber-400 dark:border-slate-700 dark:bg-slate-950/40">
                查看完整目录
              </a>
              <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className="rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-amber-400 dark:border-slate-700 dark:bg-slate-950/40">
                GitHub 源码 ↗
              </a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <SharePageButton title={TITLE} text={DESCRIPTION} url={RESOURCE_URL} />
              <ArticleActionsDropdown label="更多">
                <DistributeContentButton
                  title={TITLE}
                  summary={DESCRIPTION}
                  url={RESOURCE_PATH}
                  category="resource"
                  slug={RESOURCE_SLUG}
                  tags={['赵长鹏', '币安人生', 'CZ', '回忆录']}
                  kindLabel="资源"
                />
              </ArticleActionsDropdown>
            </div>
          </div>

          <a href={READER_URL} target="_blank" rel="noreferrer" className="group mx-auto block w-full max-w-[260px]">
            <div className="overflow-hidden rounded-md bg-slate-900 shadow-2xl shadow-amber-900/20 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-amber-900/30">
              <Image
                src={`${READER_URL}/images/cover.jpg`}
                alt="赵长鹏自传《币安人生》封面"
                width="1200"
                height="1600"
                priority
                sizes="(min-width: 1024px) 260px, 70vw"
                className="aspect-[3/4] h-auto w-full object-cover"
              />
            </div>
            <p className="mt-3 text-center text-xs text-slate-500 group-hover:text-amber-700 dark:text-slate-400 dark:group-hover:text-amber-400">
              打开独立阅读站 ↗
            </p>
          </a>
        </div>
      </header>

      <section aria-labelledby="overview-title" className="grid gap-8 py-12 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">Reading guide</p>
          <h2 id="overview-title" className="mt-2 font-serif text-3xl font-semibold">这本回忆录写了什么</h2>
          <div className="mt-5 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            <p>
              故事从赵长鹏的家庭与移民经历展开。他在加拿大完成学业，随后在东京、纽约等地从事交易系统开发。2013 年接触比特币后，他进入加密货币行业，并在 2017 年创立币安。
            </p>
            <p>
              后半部集中记录币安的全球扩张、市场寒冬、复杂用户事件与监管冲突。美国司法部谈判、赴美、服刑和特赦构成最具争议的一段，也让“保护用户”这一自述主线接受现实检验。
            </p>
            <p>
              适合关心币安历史、加密货币创业、交易平台治理，以及创始人如何叙述风险、责任与个人选择的读者。
            </p>
          </div>
        </div>

        <dl className="grid content-start gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-1">
          {quickFacts.map(([label, value]) => (
            <div key={label} className="bg-white p-4 dark:bg-slate-950">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="chapters" aria-labelledby="chapters-title" className="scroll-mt-24 border-t border-slate-200 py-12 dark:border-slate-800">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">28 chapters</p>
          <h2 id="chapters-title" className="mt-2 font-serif text-3xl font-semibold">《币安人生》完整章节目录</h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            按人生阶段重新组织章节。点击标题会在新窗口打开独立阅读站的对应正文。
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {chapterGroups.map((group, groupIndex) => (
            <article key={group.id} className="grid gap-5 rounded-2xl border border-slate-200 p-5 transition hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-800 sm:p-6 lg:grid-cols-[220px_1fr]">
              <div>
                <p className="font-mono text-xs text-amber-700 dark:text-amber-400">
                  {String(groupIndex + 1).padStart(2, '0')} · {group.period}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-7">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{group.summary}</p>
              </div>
              <ol className="grid content-start gap-2 sm:grid-cols-2">
                {group.chapters.map(([name, slug], chapterIndex) => (
                  <li key={slug}>
                    <ReaderLink
                      slug={slug}
                      className="group flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm transition hover:bg-amber-50 hover:text-amber-800 dark:bg-slate-900 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
                    >
                      <span className="font-mono text-[11px] text-slate-400 group-hover:text-amber-600">
                        {String(chapterIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-medium">{name}</span>
                      <span aria-hidden="true" className="text-slate-300 group-hover:text-amber-500">↗</span>
                    </ReaderLink>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="project-title" className="grid gap-5 border-t border-slate-200 py-12 dark:border-slate-800 md:grid-cols-2">
        <article className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-400">Open source</p>
          <h2 id="project-title" className="mt-3 font-serif text-2xl font-semibold">简体中文 Web 阅读项目</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            项目使用 VitePress 生成静态文档，通过 Python、OpenCC 与 Poppler 完成文本提取和繁简转换，部署在 Cloudflare Pages。源码公开，内容更新可以在 GitHub 留下版本记录。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100">
              查看 GitHub 仓库 ↗
            </a>
            <a href={READER_URL} target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium hover:border-amber-400 hover:text-amber-300">
              打开阅读站 ↗
            </a>
          </div>
        </article>

        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100 sm:p-8">
          <h2 className="text-lg font-semibold">内容与版本说明</h2>
          <p className="mt-3">
            站内专题提供导读与章节导航，不复制正文。完整文本、勘误和后续更新以独立阅读站及 GitHub 项目为准。《币安人生》原著作者为赵长鹏；Web 项目对繁体中文内容进行简体转换与页面化整理。
          </p>
        </aside>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-slate-200 py-12 dark:border-slate-800">
        <h2 id="faq-title" className="font-serif text-3xl font-semibold">常见问题</h2>
        <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {faqs.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.question}
                <span aria-hidden="true" className="text-amber-600 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <ArticleFooterCta />
    </main>
  )
}
