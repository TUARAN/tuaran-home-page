'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

const MOMENTS = [
  {
    id: 'moment-agent-loop',
    mood: '👨‍💻',
    moodLabel: '正在 Coding',
    relativeTime: '2 小时前',
    text:
      '把首页继续往“轻一点、活一点”推了一步。最近越来越确定，个人站不该只是作品陈列柜，更像一块持续发热的桌面，能看到代码、生活和判断同时发生。',
    image: {
      src: '/banner/IMG_9693.jpg',
      alt: '桌面与电脑屏幕',
    },
  },
  {
    id: 'moment-snippet',
    mood: '☕',
    moodLabel: '摸鱼思考中',
    relativeTime: '昨天',
    text:
      '这两天在反复想一件事：工程化不是把一切都做重，而是把真正会重复出现的问题压成稳定结构。剩下那些还不确定、还在生长的部分，应该允许它先以碎片的形式存在。',
    code: [
      'const note = {',
      "  mode: 'build in public',",
      "  bias: 'ship before polish',",
      '}',
    ].join('\n'),
  },
]

function MomentBody({ text }) {
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = text.length > 140
  const displayText = shouldCollapse && !expanded ? `${text.slice(0, 140)}...` : text

  return (
    <div className="space-y-2">
      <p className="mb-0 text-[13px] leading-[1.8] text-[#5b564d] dark:text-gray-300">
        {displayText}
      </p>
      {shouldCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8c7f67] transition-colors hover:text-[#5d513f] dark:text-[#93a0b3] dark:hover:text-white"
        >
          {expanded ? '收起' : '展开'}
        </button>
      ) : null}
    </div>
  )
}

export default function LatestMoments() {
  const [activeImage, setActiveImage] = useState(null)

  const items = useMemo(() => MOMENTS.slice(0, 2), [])

  return (
    <>
      <section className="mb-5 border-b border-[#e8dfd0] pb-5 dark:border-gray-800">
        <div className="mb-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9b8c72] dark:text-[#8e9ab0]">
            Moments
          </p>
          <h3 className="mb-0 font-serif text-[18px] font-semibold tracking-[0.03em] text-[#221f1a] dark:text-gray-100">
            最新动态
          </h3>
        </div>

        <div className="relative pl-5">
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-[8px] top-1 w-px bg-[linear-gradient(180deg,rgba(203,192,170,0.95),rgba(203,192,170,0.15))] dark:bg-[linear-gradient(180deg,rgba(78,89,105,0.95),rgba(78,89,105,0.18))]"
          />

          <div className="space-y-4">
            {items.map((moment) => (
              <article
                key={moment.id}
                className="relative rounded-[20px] border border-[#e7dece] bg-white px-4 py-3 shadow-[0_14px_36px_rgba(112,96,68,0.05)] dark:border-[#232c36] dark:bg-[#121821]"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-[-17px] top-4 h-3 w-3 rounded-full border border-[#d6c7ae] bg-[#f9f5ed] shadow-[0_0_0_4px_rgba(245,241,232,1)] dark:border-[#49566a] dark:bg-[#19212b] dark:shadow-[0_0_0_4px_rgba(16,21,29,1)]"
                />

                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-0 text-[12px] leading-6 text-[#6a6256] dark:text-gray-300">
                      <span className="mr-1.5 text-[15px]" aria-hidden="true">{moment.mood}</span>
                      <span>{moment.moodLabel}</span>
                    </p>
                    <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9f9279] dark:text-[#8793a6]">
                      {moment.relativeTime}
                    </p>
                  </div>
                </div>

                <MomentBody text={moment.text} />

                {moment.code ? (
                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-[#ece4d8] bg-[#faf7f1] px-3 py-2 text-[12px] leading-6 text-[#5a5449] dark:border-[#2b3440] dark:bg-[#0d1218] dark:text-gray-300">
                    <code>{moment.code}</code>
                  </pre>
                ) : null}

                {moment.image ? (
                  <button
                    type="button"
                    onClick={() => setActiveImage(moment.image)}
                    className="mt-3 block w-full overflow-hidden rounded-2xl border border-[#ece4d8] bg-[#faf7f1] transition-transform hover:-translate-y-0.5 dark:border-[#2b3440] dark:bg-[#0d1218]"
                  >
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={moment.image.src}
                        alt={moment.image.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 280px"
                      />
                    </div>
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeImage ? (
        <div
          className="fixed inset-0 z-50 bg-[rgba(9,12,16,0.82)] p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveImage(null)}
        >
          <div className="flex h-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-4xl">
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="rounded-full border border-[#d8dce2] bg-white/92 px-3 py-1 text-sm text-[#222] dark:border-[#2c3642] dark:bg-[#121821] dark:text-gray-100"
                >
                  关闭
                </button>
              </div>
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={activeImage.src}
                    alt={activeImage.alt}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
