import Image from 'next/image'
import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import SharePageButton from '../../components/SharePageButton'
import {
  CZ_MEMOIR_CHAPTER_GROUPS,
  CZ_MEMOIR_COVER,
  czMemoirChapterPath,
} from '../../../../lib/czMemoirs'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'cz-memoirs'
const RESOURCE_PATH = `/resources/${RESOURCE_SLUG}`
const RESOURCE_URL = `https://2aran.com${RESOURCE_PATH}`
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
        url: `https://2aran.com${CZ_MEMOIR_COVER}`,
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
    images: [`https://2aran.com${CZ_MEMOIR_COVER}`],
  },
}

const chapterGroups = CZ_MEMOIR_CHAPTER_GROUPS

const quickFacts = [
  ['作者', '赵长鹏（CZ）'],
  ['中文书名', '《币安人生》'],
  ['内容形态', '简体中文 Web 文档'],
  ['章节规模', '正文、附录与番外共 28 篇'],
  ['站内阅读', '静态预渲染 · 完整正文与配图'],
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
    answer: '点击页面中的“开始站内阅读”或任一章节，即可直接在 2aran.com 阅读完整正文，不会跳转到其他阅读站。',
  },
  {
    question: '站内阅读包含哪些功能？',
    answer:
      '桌面端提供全书目录和篇内目录，移动端提供可展开的章节选择；阅读时可调整字号、查看进度，并使用上一篇和下一篇连续阅读。',
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
      isBasedOn: REPOSITORY_URL,
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
            url: `${RESOURCE_URL}/${slug}`,
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
      image: `https://2aran.com${CZ_MEMOIR_COVER}`,
      url: RESOURCE_URL,
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
    <Link href={czMemoirChapterPath(slug)} className={className}>
      {children}
    </Link>
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
                开始站内阅读 →
              </ReaderLink>
              <a href="#chapters" className="rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-medium transition hover:border-amber-400 dark:border-slate-700 dark:bg-slate-950/40">
                查看完整目录
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

          <div className="mx-auto w-full max-w-[260px]">
            <div className="overflow-hidden rounded-md bg-slate-900 shadow-2xl shadow-amber-900/20 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-amber-900/30">
              <Image
                src={CZ_MEMOIR_COVER}
                alt="赵长鹏自传《币安人生》封面"
                width="1200"
                height="1600"
                priority
                sizes="(min-width: 1024px) 260px, 70vw"
                className="aspect-[3/4] h-auto w-full object-cover"
              />
            </div>
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              全文与配图已归档到本站
            </p>
          </div>
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
            按人生阶段重新组织章节。点击标题直接进入站内阅读器，可连续翻阅上一篇与下一篇。
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
                      <span aria-hidden="true" className="text-slate-300 group-hover:text-amber-500">→</span>
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
            原项目使用 VitePress、Python、OpenCC 与 Poppler 完成文本提取和繁简转换。当前站点已将 28 篇正文与全部配图纳入 Next.js 构建，生成可独立访问的静态阅读页面。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-100">
              查看 GitHub 仓库 ↗
            </a>
          </div>
        </article>

        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100 sm:p-8">
          <h2 className="text-lg font-semibold">内容与版本说明</h2>
          <p className="mt-3">
            28 篇正文与配图已完整进入本站版本控制和静态部署，不依赖外部阅读站。《币安人生》原著作者为赵长鹏；Web 项目对繁体中文内容进行简体转换与页面化整理。后续勘误可从 GitHub 源项目同步。
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
