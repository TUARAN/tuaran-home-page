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
    title: '企业愿景与经营策略',
    text: '公司以研发 AGI 为终极目标，创立初衷并非逐利上市，依靠愿景驱动团队，无硬性 KPI、采用双轨宽松组织模式，维持团队稳定是唯一核心利益；坚持克制战略，开源是主动选择而非妥协，模型开源版本与自用版本完全一致，定价以服务器 10 个月回本为标准，只追求合理利润，主动放弃争抢 C 端流量、视频生成等非主线业务，C 端、B 端 API 仅作为研发副产品。',
  },
  {
    number: '02',
    title: '技术路线与研发重心',
    text: 'AI 发展遵循 CoT → Agent → 持续学习 → 模型自我迭代 → 具身智能的递进路径，持续学习是当下最核心待攻克难题，突破后能大幅加速模型自研；模型规模缩放存在明确收益，国内算力不足尚未触及缩放上限，Coding Agent 是现阶段优先落地方向，多模态、搜索仅作为辅助组件，世界模型、视频生成等不提升智能上限，暂不投入资源；高质量数据标注是和海外的主要技术差距，预计一年内补齐。',
  },
  {
    number: '03',
    title: '算力硬件与中美差距',
    text: '中美 AI 核心差距为算力资源，国内仅能训练几十 B 激活规模模型，海外可训练 800B 超大模型；公司优先将融资资金全部采购显卡，现有 2 万张等效英伟达 H 卡、1.6 万张华为 950 卡，华为卡折算算力仅为英伟达的四分之一，硬件存在两年代差；自研 TileLang 编译语言可脱离 CUDA 生态，国产芯片生态一年内可验证成熟，长期瓶颈仅为产能，预计五年内解决；缩小差距依靠模型侧优化算力效率、硬件侧国产芯片迭代双向发力。',
  },
  {
    number: '04',
    title: '行业格局与商业化规划',
    text: '国内基础大模型厂商数量过剩，行业后续会收敛至 3–4 家；人才紧缺只是短期现象，两三年会大量补齐；商业化以 B 端 API 为现金流保底，业务可支撑公司盈利乃至上市，公司不做全产业链垂直整合，开放基座模型交由合作伙伴开发垂类应用；全球 AI 长期竞争核心是成本、落地时间、产品体验，国内在成本与本土化产品上具备结构性优势。',
  },
  {
    number: '05',
    title: '发展时间规划',
    text: '短期 1 年内国产算力生态落地、基础模型追平海外、启动 150B–250B 大模型训练；中期 1–3 年攻克持续学习技术、国产芯片产能逐步释放；长期 3–5 年算力产能瓶颈消除，实现模型自主迭代，最终落地具身智能，完成 AGI 完整闭环。',
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
            核心总结
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {summaryItems.map((item) => (
              <article
                key={item.number}
                className={`rounded-2xl border border-[#e1e4df] bg-[#fafbf9] p-5 dark:border-gray-800 dark:bg-gray-900/60 ${
                  item.number === '05' ? 'md:col-span-2' : ''
                }`}
              >
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
