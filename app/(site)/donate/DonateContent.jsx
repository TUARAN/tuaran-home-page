'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const copy = {
  zh: {
    title: '支持本站',
    intro:
      '如果这些文章、项目和资源对你有帮助，欢迎通过捐助或赞助支持站长。支持完全自愿，将用于内容创作、存储、带宽和网站维护。',
    home: '返回首页',
    articles: '看看文章',
    ranbi: '免费获取燃币',
    contact: '联系站长',
    lang: 'EN',
    pay: 'WeChat Pay',
    paragraphs: [
      '捐助和赞助用于支持内容更新与资源维护，包括图片与文件存储、视频、模型请求、数据采集、带宽和域名服务。',
      '燃币不支持充值，也不通过捐助或赞助兑换。免费获取方式和补充规则统一见“燃币说明”。',
      '燃币不足时可以直接联系站长，说明账号和用途，申请免费补充；不需要先捐助或赞助。获取燃币、使用资源与是否支持站长无关。',
    ],
    thanksTitle: '感谢支持',
    thanks:
      '感谢你帮助分担内容创作与网站维护成本。是否捐助或赞助，由你自行决定。',
    qrAlt: '微信收款码',
  },
  en: {
    title: 'Support This Site',
    intro:
      'If my articles, projects, or resources have helped you, you are welcome to donate or sponsor the site. Support is entirely voluntary and helps cover content creation, storage, bandwidth, and maintenance.',
    home: 'Back Home',
    articles: 'Read Articles',
    ranbi: 'Get Free Ranbi',
    contact: 'Contact the Owner',
    lang: '中文',
    pay: 'WeChat Pay',
    paragraphs: [
      'Donations and sponsorships help cover content updates, file and image hosting, video, model requests, data collection, bandwidth, and domains.',
      'Ranbi cannot be purchased or exchanged for donations or sponsorships. See the Ranbi guide for free earning methods and balance assistance.',
      'If you need more Ranbi, contact the owner directly with your account and intended use to request a free adjustment. Donations and sponsorships are not required to obtain Ranbi or use resources.',
    ],
    thanksTitle: 'Thanks for Your Support',
    thanks:
      'Thank you for helping cover content creation and site maintenance. Whether to donate or sponsor is entirely your choice.',
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
              <Link href="/ranbi#earn" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                {t.ranbi}
              </Link>
              <Link href="/help#contact" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                {t.contact}
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
