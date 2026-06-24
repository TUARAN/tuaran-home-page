import Link from 'next/link'
import RanbiPaywall from '../../components/RanbiPaywall'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import SharePageButton from '../../components/SharePageButton'
import PageContainer from '../../components/PageContainer'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/resources/shen-zhi-tuan-nei'
const SOURCE_URL = 'https://finance.sina.com.cn/tech/discovery/2026-06-23/doc-iniekeev9770960.shtml'
const ORIGINAL_IMAGE_SRC = '/resources/shen-zhi-tuan-nei/original-sina-2026-06-23.jpg'

export const metadata = {
  title: '《置身团内》图片版原文：美团到餐基层产品长文存档',
  description:
    '《置身团内》图片版原文存档：一名自称美团到餐基层产品员工谈美团组织路径依赖、数据资产化与 AI 落地问题。图片来源为新浪科技转载快科技页面。',
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
    title: '《置身团内》图片版原文：美团到餐基层产品长文存档',
    description:
      '新浪科技 / 快科技页面中的《置身团内》长图原文，配套调研见站内职场观察。',
    url: PAGE_URL,
    type: 'article',
    images: [ORIGINAL_IMAGE_SRC],
  },
  robots: {
    index: true,
    follow: true,
  },
}

function ShenZhiTuanNeiResourceContent() {
  return (
    <PageContainer width="narrow" className="py-12">
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.14em] text-[#888] dark:text-gray-500">资料库 · 职场</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
              《置身团内》图片版原文
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">
              美团到餐基层产品员工长文 · 新浪科技 / 快科技图片版存档
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#555] dark:text-gray-400">
              这页保留新浪科技转载快科技页面中的《置身团内》长图原文。文字版未做 OCR 发布；配套分析见
              <Link
                href="/articles/research/topics/shen-zhi-tuan-nei-meituan-workplace-observation"
                className="mx-1 underline underline-offset-4"
              >
                《置身团内》调研
              </Link>
              。
            </p>
          </div>
          <SharePageButton
            title="《置身团内》图片版原文"
            text="《置身团内》图片版原文存档：美团到餐基层产品员工谈组织路径依赖、数据资产化与 AI 落地。"
            url={PAGE_URL}
          />
        </div>
      </header>

      <section className="mb-6 text-sm leading-relaxed text-[#555] dark:text-gray-400">
        <p>
          来源页：
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            新浪科技转载快科技《美团员工发长文〈置身团内〉谈公司困境》
          </a>
        </p>
        <p className="mt-2">
          图片尺寸来自原站长图。本站仅作资料索引与阅读备份，正文判断请回到原图与配套调研交叉查看。
        </p>
      </section>

      <figure className="overflow-hidden border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950">
        <img
          src={ORIGINAL_IMAGE_SRC}
          alt="《置身团内：一个到餐基层产品看到的美团困境》图片版原文"
          className="block h-auto w-full"
          loading="eager"
        />
      </figure>
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
