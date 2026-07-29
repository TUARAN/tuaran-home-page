import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '内容说明与更正政策',
  description: '2aran.com 的作者责任、资料使用、工具协作、专业审阅与内容更正说明。',
  keywords: ['内容说明', '作者责任', '更正政策', 'AI 工具', '2aran.com', '涂阿燃'],
  alternates: { canonical: '/editorial' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const sections = [
  {
    title: '作者与责任',
    paragraphs: [
      '本站署名为 TUARAN 或涂阿燃的内容，由我提出问题、选择材料、组织结构、形成判断并最终确认。我对发布结果负责，搜索工具、代码工具和大模型不作为共同作者。',
      '观点、分析、实践、指南、事实核验、公司观察和资料整理是不同的内容形态。页面会尽量使用符合实际工作的标签，不把所有长文统称为研究。',
    ],
  },
  {
    title: '工具如何参与',
    paragraphs: [
      '资料处理可能使用搜索、转录、代码、数据处理和大模型工具，作用限于查找线索、整理材料、列出待核查点和文字校对。相关记录保留在内部元数据中，便于回溯。',
      '合成图片、模型输出或自动化数据处理会影响理解时，页面会单独说明。普通整理与校对不改变作者署名和最终责任。',
    ],
  },
  {
    title: '事实、观点与来源',
    paragraphs: [
      '可以核验的日期、价格、政策、版本和数字优先引用官方资料或一手来源。没有公开证据的判断会尽量写成观察、推断或尚未确认，不把外部猜测写成既定事实。',
      '引用第三方材料时保留来源链接。资料库、古典文本、外部收藏和转载内容不冒充原创，相关页面会说明出处与整理范围。',
    ],
  },
  {
    title: '健康、金融与法律内容',
    paragraphs: [
      '健康、金融、法律和未成年人相关内容用于信息整理和个人决策参考，不替代医生诊断、持牌投资建议或正式法律意见。',
      '只有确实经过具名专业人士审阅的页面才会标注“专业审阅”。没有该标记，代表内容只经过作者核验，不应被理解为专业背书。',
    ],
  },
  {
    title: '更正与修订',
    paragraphs: [
      '发现事实错误、失效链接或重要遗漏后，我会直接修订；如果改动影响主要结论，会在正文保留修订说明。',
      '读者可以通过联系页或对应页面评论提交更正。请附上具体段落、原始来源和建议修改方式，方便复核。',
    ],
  },
]

export default function EditorialPage() {
  return (
    <PageContainer width="narrow" className="py-12">
      <header className="border-b border-[var(--site-line)] pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
          Editorial Policy
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight text-[var(--site-ink)] md:text-[44px]">
          内容说明与更正政策
        </h1>
        <p className="mt-4 text-[15px] leading-8 text-[var(--site-muted)]">
          这里说明本站的内容由谁负责、工具如何参与，以及出现错误后如何修订。最后更新：2026 年 7 月 14 日。
        </p>
      </header>

      <div className="divide-y divide-[var(--site-line)]">
        {sections.map((section) => (
          <section key={section.title} className="py-8">
            <h2 className="font-serif text-[25px] text-[var(--site-ink)]">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[15px] leading-8 text-[var(--site-muted)]">{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5">
        <h2 className="font-serif text-[24px] text-[var(--site-ink)]">提交更正</h2>
        <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
          如果你发现内容有误，请提供页面链接、具体段落和可核验来源。
        </p>
        <Link href="/contact" className="mt-4 inline-flex rounded-full bg-[var(--site-ink)] px-4 py-2 text-sm font-medium text-white no-underline transition hover:opacity-90 dark:text-[#0d0e0d]">
          联系站长
        </Link>
      </section>
    </PageContainer>
  )
}
