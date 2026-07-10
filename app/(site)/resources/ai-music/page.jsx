import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'ai-music'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const TRACK_URL = 'https://music.163.com/#/song?id=3404858039'
const title = 'GPT 不解释｜AI 音乐'
const description = 'tuaran 的 AI 音乐单曲《GPT 不解释》。在网易云音乐播放，也可以分享这张站内音乐卡片。'

export const metadata = {
  title,
  description,
  keywords: ['AI 音乐', 'GPT 不解释', 'tuaran', '网易云音乐', '音乐分享'],
  alternates: {
    canonical: `/resources/${RESOURCE_SLUG}`,
  },
  openGraph: {
    title,
    description,
    url: RESOURCE_URL,
    type: 'music.song',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

export default function AiMusicResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />

      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/articles?tab=resources&resource_type=ai-music" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            资源库 · AI 音乐
          </Link>
          <span aria-hidden="true">·</span>
          <span>可分享音乐卡片</span>
        </div>
        <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          AI 音乐
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#555] dark:text-gray-300">
          收集值得留存的 AI 音乐作品。每首歌都有一张独立的站内卡片，方便播放、转发和继续补充背景信息。
        </p>
      </header>

      <article className="mt-8">
        <section className="overflow-hidden rounded-[28px] border border-[#ddd1e9] bg-[linear-gradient(135deg,#fdf8ff_0%,#f1e6ff_52%,#e7f3ff_100%)] p-5 shadow-[0_18px_46px_rgba(96,64,128,0.12)] dark:border-[#3a2c4c] dark:bg-[linear-gradient(135deg,#17111f_0%,#251834_52%,#122333_100%)] md:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-[#20122f] text-3xl text-white shadow-[0_8px_22px_rgba(52,24,81,0.26)]" aria-hidden="true">
                ♫
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a5c94] dark:text-[#c9aedb]">AI Music · 01</p>
                <h2 className="mt-1 truncate text-2xl font-semibold text-[#281637] dark:text-white">GPT 不解释</h2>
                <p className="mt-1 text-sm text-[#65546f] dark:text-[#c5b7cc]">tuaran · 单曲 · 02:18</p>
              </div>
            </div>
            <a
              href={TRACK_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#3b2358] px-5 py-3 text-sm font-medium text-white no-underline transition hover:bg-[#2b1941] hover:text-white"
            >
              去网易云音乐播放
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#d9cbe6] pt-5 dark:border-[#4a385b]">
            <SharePageButton title={title} text={description} url={RESOURCE_URL} size="md" idleLabel="分享这张音乐卡片" />
            <ArticleActionsDropdown label="更多">
              <DistributeContentButton
                title={title}
                summary={description}
                url={`/resources/${RESOURCE_SLUG}`}
                category="resource"
                slug={RESOURCE_SLUG}
                tags={['AI 音乐', 'GPT 不解释', 'tuaran']}
                kindLabel="资源"
              />
            </ArticleActionsDropdown>
          </div>
        </section>

        <p className="mt-5 text-sm leading-7 text-[#6b6472] dark:text-gray-300">
          音频版权与播放由网易云音乐页面承载；本站只收录作品信息和可分享的跳转卡片。
        </p>
      </article>

      <ArticleFooterCta />
    </PageContainer>
  )
}
