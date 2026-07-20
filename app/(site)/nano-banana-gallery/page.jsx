import Link from 'next/link'

import { NANO_BANANA_CASES, NANO_BANANA_GALLERY_META } from '../../../lib/nanoBananaCases'
import { createRichPageMetadata } from '../../../lib/richPageSeo'
import ContentEngagement from '../components/ContentEngagement'
import ContentPvBeacon from '../components/ContentPvBeacon'
import PageContainer from '../components/PageContainer'
import RichPageJsonLd from '../components/RichPageJsonLd'
import NanoBananaGallery from './NanoBananaGallery'

export const dynamic = 'force-static'

const PAGE_SLUG = 'nano-banana-gallery'

export const metadata = createRichPageMetadata('nano-banana-gallery')

export default function NanoBananaGalleryPage() {
  const nanoCount = NANO_BANANA_CASES.filter((item) => item.edition === 'nano').length
  const proCount = NANO_BANANA_CASES.filter((item) => item.edition === 'pro').length

  return (
    <>
      <RichPageJsonLd pageId="nano-banana-gallery" />
      <PageContainer width="wide" className="py-8 md:py-10">
        <ContentPvBeacon category="rich-page" slug={PAGE_SLUG} />
        <header className="mb-8 border-b border-[#e6e6df] pb-7 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#999]">
            <Link href="/rich-pages" className="transition hover:text-[#333] dark:hover:text-gray-200">
              多维页面
            </Link>
            <span>／</span>
            <span>AI 视觉案例</span>
            <span>／</span>
            <ContentPvBeacon category="rich-page" slug={PAGE_SLUG} display />
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-3 text-4xl" aria-hidden="true">🍌</p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#23231f] dark:text-gray-100 md:text-5xl">
                Awesome Nano Banana Images
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#666] dark:text-gray-300 md:text-base">
                一份可搜索的 Nano Banana 图像生成与编辑案例库。浏览输入 / 输出对比，找到合适的视觉玩法，然后一键复制提示词继续创作。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <div className="rounded-xl border border-[#e2e2da] px-4 py-3 text-center dark:border-gray-800">
                <strong className="block text-xl text-[#252520] dark:text-white">{nanoCount}</strong>
                <span className="text-[11px] text-[#999]">Nano 案例</span>
              </div>
              <div className="rounded-xl border border-[#e2e2da] px-4 py-3 text-center dark:border-gray-800">
                <strong className="block text-xl text-[#252520] dark:text-white">{proCount}</strong>
                <span className="text-[11px] text-[#999]">Pro 案例</span>
              </div>
              <a
                href={NANO_BANANA_GALLERY_META.sourceRepo}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#252520] px-4 py-3 text-sm text-white transition hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
              >
                GitHub 源项目 ↗
              </a>
            </div>
          </div>
        </header>

        <NanoBananaGallery cases={NANO_BANANA_CASES} />

        <p className="mt-10 border-t border-[#e6e6df] pt-5 text-xs leading-6 text-[#999] dark:border-gray-800 dark:text-gray-500">
          案例与提示词来自开源项目 Awesome-Nano-Banana-images；图片版权归原作者所有。本站画廊固定引用源项目版本{' '}
          <a
            href={`${NANO_BANANA_GALLERY_META.sourceRepo}/commit/${NANO_BANANA_GALLERY_META.sourceCommit}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-[#555]"
          >
            {NANO_BANANA_GALLERY_META.sourceCommit.slice(0, 7)}
          </a>
          。
        </p>
      </PageContainer>

      <ContentEngagement contentKey={`rich-page:${PAGE_SLUG}`} width="standard" />
    </>
  )
}
