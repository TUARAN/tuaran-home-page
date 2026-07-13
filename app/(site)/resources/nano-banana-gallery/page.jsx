import Link from 'next/link'

import { NANO_BANANA_CASES, NANO_BANANA_GALLERY_META } from '../../../../lib/nanoBananaCases'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import NanoBananaGallery from './NanoBananaGallery'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'nano-banana-gallery'

export const metadata = {
  title: 'Awesome Nano Banana Images｜AI 图片案例与提示词库',
  description: '收录 141 个 Nano Banana 与 Nano Banana Pro 图片生成、图像编辑案例，支持搜索、查看输入输出对比与一键复制提示词。',
  keywords: ['Nano Banana', 'Nano Banana Pro', 'AI 图片', '提示词', '图像编辑', 'Gemini', '案例库'],
  alternates: {
    canonical: `/resources/${RESOURCE_SLUG}`,
  },
  openGraph: {
    title: 'Awesome Nano Banana Images｜AI 图片案例与提示词库',
    description: '141 个 Nano Banana 图片案例，附输入输出对比与可复制提示词。',
    url: `https://2aran.com/resources/${RESOURCE_SLUG}`,
    type: 'website',
  },
}

export default function NanoBananaGalleryPage() {
  const nanoCount = NANO_BANANA_CASES.filter((item) => item.edition === 'nano').length
  const proCount = NANO_BANANA_CASES.filter((item) => item.edition === 'pro').length

  return (
    <>
      <PageContainer width="wide" className="py-8 md:py-10">
        <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
        <header className="mb-8 border-b border-[#e6e6df] pb-7 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#999]">
            <Link href="/articles?tab=resources" className="transition hover:text-[#333] dark:hover:text-gray-200">
              内容 · 资源
            </Link>
            <span>／</span>
            <span>AI 视觉案例</span>
            <span>／</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
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

      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
