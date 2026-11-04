import Link from 'next/link'

import PageContainer from '../components/PageContainer'
import WeChatContact from '../components/WeChatContact'
import { ContactDialogButton } from '../components/ContactCards'
import { getContactChannel } from '../../../lib/site/contactChannels'

const email = getContactChannel('email')
const wechat = getContactChannel('wechat')

export const dynamic = 'force-static'

const title = '内容说明 · 作者、核对与更正'
const description = '2aran.com 的内容由涂阿燃（TUARAN）定题、选材并确认。这里说明选题范围、人工核对、修订路径、AI 协助，以及金融与健康内容的边界。'

export const metadata = {
  title,
  description,
  keywords: ['内容说明', '涂阿燃', 'TUARAN', '更正', 'AI 协助', '2aran.com'],
  alternates: { canonical: '/editorial' },
  openGraph: {
    title,
    description,
    url: '/editorial',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const sections = [
  {
    id: 'author',
    title: '作者',
    paragraphs: [
      '署名为 TUARAN 或涂阿燃的内容，由涂阿燃提出问题、选择材料、组织结构、形成判断，并在发布前确认。辅助工具不作为共同作者。',
    ],
  },
  {
    id: 'topics',
    title: '选题',
    paragraphs: [
      '主线是 AI 智能体、前端与云工程、开源实践和已出版作品。市场、金融、健康、历史和生活记录继续更新，放在「更多观察」，目录、搜索和订阅里都能找到。',
      '观点、分析、实践、指南、事实核验和资料整理使用与工作方式相符的标签。',
    ],
  },
  {
    id: 'review',
    title: '核对',
    paragraphs: [
      '可核验的日期、价格、政策、版本和数字，优先引用官方资料或一手来源。推断和尚未确认的信息会标明。发布前由作者通读。',
    ],
  },
  {
    id: 'corrections',
    title: '修订与更正',
    paragraphs: [
      '事实错误、失效链接或重要遗漏会直接改在页面上。影响主要结论的修改会留下修订说明。',
      `提交更正时请附页面网址、具体段落、可核验来源和建议修改方式。邮件 ${email.value}，或微信 ${wechat.value}。`,
    ],
  },
  {
    id: 'assistance',
    title: 'AI 协助',
    paragraphs: [
      '搜索、转录、代码、数据处理和大模型可以用来查找线索、整理材料、列出待核查点和校对文字。判断、取舍和最终文本由作者确认。',
      '需要向读者展示协助方时，文章信息区会标明协助，并链回这里。',
    ],
  },
  {
    id: 'boundaries',
    title: '金融、健康与法律边界',
    paragraphs: [
      '金融、市场和加密资产内容不构成投资建议、买卖推荐或收益承诺。健康、用药和育儿医疗内容不构成诊断、治疗或用药建议。法律相关内容不构成正式法律意见。',
    ],
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: 'https://2aran.com/editorial',
  author: {
    '@type': 'Person',
    name: '涂阿燃',
    alternateName: 'TUARAN',
    url: 'https://2aran.com/about',
  },
}

export default function EditorialPage() {
  return (
    <PageContainer width="narrow" className="py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-muted)]">Editorial</p>
      <h1 className="mb-3 text-[28px] font-semibold leading-tight text-[var(--site-ink)]">内容说明</h1>
      <p className="mb-4 text-[15px] leading-7 text-[var(--site-muted)]">{description}</p>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <WeChatContact />
        <Link href="/about" className="text-[13px] text-[var(--site-muted)] underline-offset-4 hover:underline">关于涂阿燃</Link>
        <ContactDialogButton className="bg-transparent p-0 text-[13px] text-[var(--site-muted)] underline-offset-4 hover:underline">
          其他联系方式
        </ContactDialogButton>
      </div>
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="mb-2 text-[18px] font-semibold text-[var(--site-ink)]">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-2 text-[15px] leading-7 text-[var(--site-muted)]">{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
