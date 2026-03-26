'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SettingsButton from '../components/SettingsButton'

const copy = {
  zh: {
    title: '请我喝杯咖啡',
    intro:
      '如果这些文章、项目、周刊和实验内容对你有帮助，欢迎请我喝杯咖啡，支持我继续写作、做产品和长期更新。',
    home: '返回首页',
    articles: '看看文章',
    lang: 'EN',
    pay: 'WeChat Pay',
    paragraphs: [
      '这些年我一直在持续写技术文章、做网站、折腾产品，也在认真维护自己的内容和项目矩阵。很多东西看起来只是一个页面、一篇文章、一个小工具，但背后往往是长期投入的时间、精力和耐心。',
      '如果你觉得这些内容对你有启发，或者某个项目刚好帮到了你，欢迎用“请我喝杯咖啡”的方式支持一下。这会让我更有动力，把这些事情继续认真做下去。',
      '每一份支持，我都会心怀感激。无论是捐助、留言、转发，还是单纯来看看，这些都是真实的鼓励。谢谢你愿意为我的创作和产品实验投下一点点信任。',
    ],
    thanksTitle: '感谢支持',
    thanks:
      '你的支持会优先用于内容创作、网站维护、域名与服务成本，以及更多新项目的尝试。谢谢你请我喝杯咖啡。',
    qrAlt: '微信收款码',
  },
  en: {
    title: 'Buy Me a Coffee',
    intro:
      'If my articles, projects, weekly posts, or experiments have been helpful to you, you can buy me a coffee and support my writing, product building, and long-term updates.',
    home: 'Back Home',
    articles: 'Read Articles',
    lang: '中文',
    pay: 'WeChat Pay',
    paragraphs: [
      'Over the years, I have kept writing technical articles, building websites, and experimenting with products while steadily maintaining my content and project ecosystem. Many things may look small on the surface, but each page, article, or tool usually takes real time, energy, and patience.',
      'If any of this work has inspired you or if one of the projects has genuinely helped you, you are welcome to support it by buying me a coffee. That kind of support gives me more momentum to keep doing this seriously and consistently.',
      'Every bit of support means a lot to me. Whether it is a donation, a message, a share, or simply stopping by, I appreciate it. Thank you for placing a little trust in my writing and product experiments.',
    ],
    thanksTitle: 'Thanks for Your Support',
    thanks:
      'Your support will primarily go toward content creation, website maintenance, domain and service costs, and more experiments on new projects. Thank you for buying me a coffee.',
    qrAlt: 'WeChat payment QR code',
  },
}

export default function DonateContent() {
  const [lang, setLang] = useState('zh')
  const t = copy[lang]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] pb-2 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">{t.title}</h1>
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
            <SettingsButton />
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
