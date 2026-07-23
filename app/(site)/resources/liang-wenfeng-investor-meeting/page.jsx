import Link from 'next/link'

import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'liang-wenfeng-investor-meeting'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const PDF_URL = `/resources/${RESOURCE_SLUG}/liang-wenfeng-investor-meeting-transcript.pdf`
const title = '梁文锋投资者交流会：录音文字稿'
const description =
  '一份约 3 小时 44 分钟投资者交流录音的 42 页文字稿，集中讨论 DeepSeek 的愿景、开源与商业化、AGI 路线、算力和国产芯片。'

export const metadata = {
  title,
  description,
  keywords: ['梁文锋', 'DeepSeek', '投资者交流会', '录音文字稿', 'AGI', '开源', '国产芯片'],
  alternates: { canonical: `/resources/${RESOURCE_SLUG}` },
  openGraph: {
    title,
    description,
    url: RESOURCE_URL,
    type: 'article',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

const summaryItems = [
  {
    number: '01',
    title: '愿景、开源与克制',
    text: '交流把“愿景驱动”视为组织核心，也把开源、合理定价和不追求短期利益最大化归为一种长期战略。',
  },
  {
    number: '02',
    title: 'AGI 是主线',
    text: 'C 端用户和 B 端收入被视为通往 AGI 过程中的阶段性产出；讨论重点落在更强模型、推理、主动提问与持续学习。',
  },
  {
    number: '03',
    title: '主要瓶颈是算力',
    text: '交流认为中美 AI 的核心差距更多来自算力资源而非人才，并看好国产 AI 芯片替代机会，同时指出当前产能仍是约束。',
  },
]

export default function LiangWenfengInvestorMeetingPage() {
  return (
    <>
      <PageContainer width="standard" className="py-8 md:py-10">
        <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />

        <header className="overflow-hidden rounded-3xl border border-[#d9ded9] bg-[linear-gradient(145deg,#f7f8f5_0%,#f2f0e9_55%,#edf2f0_100%)] p-6 dark:border-gray-800 dark:bg-[linear-gradient(145deg,#151815_0%,#1c1b17_55%,#151d1b_100%)] md:p-9">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[#6f786f] dark:text-gray-400">
            <Link href="/articles?tab=resources" className="hover:text-[#26352d] dark:hover:text-white">
              内容 · 资源
            </Link>
            <span>／</span>
            <span>AI 与商业</span>
            <span>／</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7d725f] dark:text-[#b8aa91]">
                Transcript · PDF
              </p>
              <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-[#202821] dark:text-white md:text-5xl">
                梁文锋投资者交流会
                <span className="mt-2 block text-[#687168] dark:text-gray-300">录音文字稿</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#586258] dark:text-gray-300 md:text-base">
                约 3 小时 44 分钟录音整理成的 42 页文字稿。页面保留原 PDF 在线阅读，也可以下载到本地慢慢看。
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">页数</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">42</dd>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">录音时长</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">3h44m</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={PDF_URL}
              download="梁文锋投资者交流会-录音文字稿.pdf"
              className="inline-flex items-center justify-center rounded-lg bg-[#26352d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#18221c] dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
            >
              下载 PDF
            </a>
            <a
              href={PDF_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-[#c7cec7] bg-white/60 px-4 py-2.5 text-sm font-medium text-[#48544c] transition hover:border-[#89968d] dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300"
            >
              新窗口打开
            </a>
            <SharePageButton
              title={title}
              text="梁文锋投资者交流会录音文字稿：集中讨论 DeepSeek 的愿景、开源与商业化、AGI 路线、算力和国产芯片。"
              url={RESOURCE_URL}
              size="md"
              idleLabel="分享页面"
            />
          </div>
        </header>

        <aside className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200">
          <strong>文字稿说明：</strong>
          原 PDF 标注录音日期为 5 月 20 日、整理日期为 2026 年 7 月 16 日。内容由语音识别自动转写并经 AI 整理，未区分说话人，个别专有名词和数字可能有误，请以原录音为准。
        </aside>

        <section className="mt-9" aria-labelledby="summary-heading">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
            Quick Summary
          </p>
          <h2 id="summary-heading" className="mt-2 font-serif text-2xl font-semibold text-[#2b332d] dark:text-gray-100">
            简单总结
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {summaryItems.map((item) => (
              <article key={item.number} className="rounded-2xl border border-[#e1e4df] bg-[#fafbf9] p-5 dark:border-gray-800 dark:bg-gray-900/60">
                <span className="font-mono text-xs text-[#8b7551] dark:text-amber-400">{item.number}</span>
                <h3 className="mt-2 text-base font-semibold text-[#303a33] dark:text-gray-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#697169] dark:text-gray-400">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="pdf-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
                Original Document
              </p>
              <h2 id="pdf-heading" className="mt-2 font-serif text-2xl font-semibold text-[#2b332d] dark:text-gray-100">
                在线阅读
              </h2>
            </div>
            <a href={PDF_URL} download="梁文锋投资者交流会-录音文字稿.pdf" className="text-sm underline underline-offset-4 text-[#526057] hover:text-black dark:text-gray-400 dark:hover:text-white">
              无法预览？下载 PDF
            </a>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#d9ded9] bg-[#eceeea] shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <iframe
              src={`${PDF_URL}#view=FitH`}
              title="梁文锋投资者交流会录音文字稿 PDF"
              className="h-[72vh] min-h-[620px] w-full bg-white md:h-[900px]"
              loading="lazy"
            />
          </div>
        </section>
      </PageContainer>

      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
