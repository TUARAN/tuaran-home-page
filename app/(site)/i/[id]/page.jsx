import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getD1 } from '../../../../lib/d1'
import {
  getHostedImageById,
  hostedImageSharePath,
  hostedImageShareUrl,
  hostedImageTitle,
  rowToHostedImage,
} from '../../../../lib/hostedImages'
import ImageShareActions from './ImageShareActions'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function formatSize(bytes) {
  const n = Number(bytes || 0)
  if (!n) return ''
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(Number(ts)))
  } catch {
    return ''
  }
}

async function readHostedImage(id) {
  let db
  try {
    db = getD1()
  } catch {
    return { status: 'unavailable', row: null }
  }

  try {
    const row = await getHostedImageById(db, id)
    return { status: row ? 'ok' : 'missing', row }
  } catch (error) {
    const message = String(error?.message || error)
    return { status: message.includes('no such table') ? 'unavailable' : 'error', row: null }
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await readHostedImage(id)
  if (!result.row) {
    return {
      title: '图片不存在 · 2aran 图床',
      robots: { index: false, follow: true },
    }
  }

  const title = hostedImageTitle(result.row)
  const image = rowToHostedImage(result.row)
  const shareUrl = hostedImageShareUrl(id)
  const description = '这张图片由 2aran 图床托管。'

  return {
    title: `${title} · 2aran 图床`,
    description,
    alternates: {
      canonical: hostedImageSharePath(id),
    },
    openGraph: {
      title: `${title} · 2aran 图床`,
      description,
      url: shareUrl,
      type: 'article',
      images: [
        {
          url: image.url,
          width: image.width || 1200,
          height: image.height || 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · 2aran 图床`,
      description,
      images: [image.url],
    },
  }
}

export default async function HostedImageSharePage({ params }) {
  const { id } = await params
  const result = await readHostedImage(id)

  if (result.status === 'missing') {
    notFound()
  }

  if (result.status !== 'ok') {
    return (
      <main className="min-h-screen bg-[#f2efe7] px-4 py-12 text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100 sm:px-6">
        <section className="mx-auto max-w-[760px] border-t border-[#d8d1c4] pt-8 dark:border-[#27313d]">
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
            2aran Image Hosting
          </p>
          <h1 className="mb-3 font-serif text-[34px] font-bold leading-tight text-[#15130e] dark:text-white">
            图床服务暂不可用
          </h1>
          <p className="mb-6 text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
            当前运行环境还没有可用的图床数据表或 D1 绑定。
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md bg-[#25221b] px-4 text-[13px] font-semibold text-white no-underline transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
            >
              回到 2aran
            </Link>
            <Link
              href="/tools/image-hosting"
              className="inline-flex h-10 items-center rounded-md border border-[#d8d1c4] bg-white/70 px-4 text-[13px] font-semibold text-[#28241d] no-underline transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
            >
              使用图床
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const image = rowToHostedImage(result.row)
  const title = hostedImageTitle(result.row)
  const meta = [
    formatSize(image.sizeBytes),
    image.width && image.height ? `${image.width}×${image.height}` : '',
    formatTime(image.createdAt),
  ].filter(Boolean)
  const shareText = `我用 2aran 图床分享了一张图片：${title}`

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1180px] px-4 pb-5 pt-9 sm:px-6 lg:px-8">
        <div className="grid gap-4 border-b border-[#d8d1c4] pb-5 dark:border-[#27313d] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
              2aran Image Hosting
            </p>
            <h1 className="mb-3 font-serif text-[34px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[42px]">
              {title}
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              图片由 2aran 图床托管。你可以查看原图、复制链接，或回到网站上传自己的图片。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px] text-[#7a766b] dark:text-[#9da7b5]">
            {meta.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#ded8ca] bg-white/55 px-2.5 py-1 dark:border-[#303947] dark:bg-[#101721]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8">
        <div className="overflow-hidden rounded-lg border border-[#ded8ca] bg-white dark:border-[#252e38] dark:bg-[#101720]">
          <a href={image.url} target="_blank" rel="noreferrer" className="no-external-arrow block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={title}
              className="max-h-[76vh] min-h-[260px] w-full object-contain"
            />
          </a>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-[#ded8ca] bg-white/[0.68] p-4 dark:border-[#252e38] dark:bg-[#101720]/[0.78]">
            <h2 className="mb-3 text-[15px] font-bold">分享这张图</h2>
            <ImageShareActions
              title={`${title} · 2aran 图床`}
              shareText={shareText}
              sharePath={image.sharePath}
              imageUrl={image.url}
            />
          </div>

          <div className="rounded-lg border border-[#ded8ca] bg-white/[0.68] p-4 dark:border-[#252e38] dark:bg-[#101720]/[0.78]">
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6422] dark:text-[#d4ae66]">
              Powered by 2aran
            </p>
            <p className="mb-0 text-[13px] leading-6 text-[#68645a] dark:text-[#aab4c2]">
              2aran 图床面向登录用户开放，上传后自动生成可传播的图片页，用来分享截图、资料图和临时素材。
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}
