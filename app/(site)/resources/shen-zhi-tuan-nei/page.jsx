import Link from 'next/link'
import RanbiPaywall from '../../components/RanbiPaywall'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import SharePageButton from '../../components/SharePageButton'
import PageContainer from '../../components/PageContainer'
import { getResourceDocument, loadResourceMarkdown } from '../../../../lib/resourceDocuments'
import { buildResourceLongformArticle } from '../../../../lib/resourceMarkdown'

export const dynamic = 'force-static'

const doc = getResourceDocument('shen-zhi-tuan-nei')
const raw = loadResourceMarkdown('shen-zhi-tuan-nei')
const article = raw ? buildResourceLongformArticle(raw, { slug: 'shen-zhi-tuan-nei', title: '《置身团内》' }) : null

export const metadata = {
  title: doc.pageTitle,
  description:
    '《置身团内》文字版全文存档：一名自称美团到餐基层产品员工谈美团组织路径依赖、本地生活数据资产化与 AI 落地问题。原文发布于脉脉，经新浪科技 / 快科技转载（2026-06-23）。',
  keywords: [
    '《置身团内》',
    '置身团内',
    '《置身团内》原文',
    '《置身团内》全文',
    '美团',
    '美团到餐',
    '脉脉',
    '职场观察',
    '组织观察',
    '路径依赖',
    '涂阿燃',
    'tuaran',
  ],
  alternates: {
    canonical: '/resources/shen-zhi-tuan-nei',
  },
  openGraph: {
    title: doc.pageTitle,
    description: doc.summary,
    url: 'https://2aran.com/resources/shen-zhi-tuan-nei',
    type: 'article',
  },
  robots: {
    index: true,
    follow: true,
  },
}

function ShenZhiTuanNeiResourceContent() {
  const url = 'https://2aran.com/resources/shen-zhi-tuan-nei'

  return (
    <PageContainer className="py-12">
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.14em] text-[#888] dark:text-gray-500">资源库 · 职场资料</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
              {doc.title}文字版全文
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">
              {doc.subtitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#555] dark:text-gray-400">
              原文发布于脉脉，经新浪科技 / 快科技转载（2026-06-23）。本页为文字整理版，配套分析见
              <Link href={doc.researchHref} className="mx-1 underline underline-offset-4">
                《置身团内》调研
              </Link>
              。
            </p>
          </div>
          <SharePageButton
            title={doc.pageTitle}
            text={doc.summary}
            url={url}
          />
        </div>
      </header>

      <section className="mb-6 text-sm leading-relaxed text-[#555] dark:text-gray-400">
        <p>
          来源页：
          <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            新浪科技转载快科技《美团员工发长文〈置身团内〉谈公司困境》
          </a>
        </p>
      </section>

      {article ? (
        <article
          className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-h2:text-xl prose-h3:text-base prose-p:leading-relaxed prose-p:text-[#333] dark:prose-p:text-gray-300 prose-hr:border-[#eee] dark:prose-hr:border-gray-800"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[#ccc] bg-[#fafaf8] p-6 text-sm leading-relaxed text-[#666] dark:border-[#3a3a32] dark:bg-[#121410] dark:text-gray-300">
          <p>原文文件暂未就绪。</p>
        </div>
      )}
    </PageContainer>
  )
}

export default function ShenZhiTuanNeiResourcePage() {
  return (
    <>
      <ContentPvBeacon category="resource" slug="shen-zhi-tuan-nei" />
      <RanbiPaywall resourceKey="resource:shen-zhi-tuan-nei" unitLabel="资料">
        <ShenZhiTuanNeiResourceContent />
      </RanbiPaywall>
    </>
  )
}
