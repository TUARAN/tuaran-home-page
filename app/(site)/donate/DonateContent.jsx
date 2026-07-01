'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const copy = {
  zh: {
    title: '支持本站',
    intro:
      '如果这些文章、项目、资源和实验内容对你有帮助，欢迎支持本站的长期维护。支持会优先用于图床、视频、模型请求、存储、带宽和内容整理成本；如果需要补充燃币，也可以支持后私聊站长说明账号。',
    home: '返回首页',
    articles: '看看文章',
    lang: 'EN',
    pay: 'WeChat Pay',
    paragraphs: [
      '2aran.com 不是收费阅读站，也不是 UGC 平台。这里更像一个长期维护的个人内容与资源工作台：文章、调研、插件、资料、活动和评论讨论，都围绕具体主题展开。',
      '站点长期运行会产生真实成本：图片与文件存储、视频素材、Cloudflare R2、模型请求、数据采集、带宽和域名服务。支持不是强制门槛，而是让这些内容可以继续更新、继续开放。',
      '燃币主要用于留存、友好交流和资源权益。如果你因为活动、资源领取或内容解锁需要补充燃币，可以支持后私聊站长，说明账号和理由；理由充分，一切好说。',
    ],
    thanksTitle: '感谢支持',
    thanks:
      '你的支持会优先用于内容创作、网站维护、图床/视频/请求/存储/带宽成本，以及更多新项目的尝试。需要补充燃币时，请支持后私聊站长处理。',
    qrAlt: '微信收款码',
  },
  en: {
    title: 'Support This Site',
    intro:
      'If my articles, projects, resources, or experiments have been helpful, you can support the long-term maintenance of this site. Support helps cover image hosting, video, model requests, storage, bandwidth, and curation costs. If you need more Ranbi, message me after supporting the site.',
    home: 'Back Home',
    articles: 'Read Articles',
    lang: '中文',
    pay: 'WeChat Pay',
    paragraphs: [
      '2aran.com is not a paid-reading site or a UGC platform. It is a personal content and resource workspace: articles, research, plugins, references, activities, and comment discussions are organized around specific topics.',
      'Running the site has real costs: image and file hosting, video assets, Cloudflare R2, model requests, data collection, bandwidth, and domains. Support is not a mandatory gate; it helps keep the work updated and accessible.',
      'Ranbi is mainly for retention, friendly participation, and resource access. If you need more Ranbi for an activity or resource, message me after supporting the site with your account and reason.',
    ],
    thanksTitle: 'Thanks for Your Support',
    thanks:
      'Your support will primarily go toward content creation, site maintenance, image/video/request/storage/bandwidth costs, and new experiments. If you need more Ranbi, message me after supporting the site.',
    qrAlt: 'WeChat payment QR code',
  },
}

export default function DonateContent() {
  const [lang, setLang] = useState('zh')
  const t = copy[lang]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] pb-2 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">{t.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
              {t.intro}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                {t.home}
              </Link>
              <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                {t.articles}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang((current) => (current === 'zh' ? 'en' : 'zh'))}
              className="inline-flex w-[64px] items-center justify-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:bg-gray-100 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t.lang}
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[#e7e7e7] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-xs uppercase tracking-[0.16em] text-[#999] dark:text-gray-500">{t.pay}</div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#ededed] bg-[#f8f8f8] dark:border-gray-800 dark:bg-gray-950">
            <Image
              src="/donate-wechat.jpg"
              alt={t.qrAlt}
              width={1279}
              height={1743}
              sizes="(max-width: 768px) 100vw, 420px"
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#e7e7e7] bg-[#fcfcfc] p-6 dark:border-gray-800 dark:bg-gray-900/80">
          <div className="space-y-5 text-sm leading-7 text-[#666] dark:text-gray-300">
            {t.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-[#dedede] bg-white/70 p-4 dark:border-gray-700 dark:bg-gray-950/40">
            <div className="text-sm font-semibold text-[#333] dark:text-gray-100">{t.thanksTitle}</div>
            <p className="mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
              {t.thanks}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
