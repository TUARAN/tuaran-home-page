import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import NiuLaiInteractive, { NiuLaiVideoPlayer } from './NiuLaiInteractive'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'niu-lai-movie'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const title = '《牛来》电影为什么爆火？原片资源、票房逆袭与龙标审批流程'
const description = '《牛来》动画电影原片在线资源页：提供原画质播放，并梳理影片爆火经过、两人制作团队、票房逆袭、龙标与公映许可证审批流程，核对洗钱、补贴等网络传言。'

export const metadata = {
  title,
  description,
  keywords: ['牛来', '牛来电影', '牛来原片', '牛来原片资源', '牛来完整版', '牛来为什么爆火', '牛来龙标', '电影审批', '信雨萌', '孙丽芳'],
  alternates: { canonical: `/resources/${RESOURCE_SLUG}` },
  openGraph: { title, description, url: RESOURCE_URL, type: 'article' },
  twitter: { card: 'summary_large_image', title, description },
}

const facts = [
  ['86 分钟', '院线动画片长'],
  ['2 人', '核心制作成员'],
  ['2021', '剧本备案年份'],
  ['2024', '取得公映许可'],
]

const faq = [
  { question: '《牛来》为什么能通过电影审查？', answer: '公开信息显示，影片完成剧本备案、内容审查、技术审查并取得公映许可证。制作画面的审美水平通常不属于内容合规或放映技术审查的否决条件。' },
  { question: '《牛来》的龙标编号是什么？', answer: '公开报道所列公映许可证号为电审动字〔2024〕第33号，剧本备案编号为影动备字〔2021〕第104号。' },
  { question: '《牛来》涉及洗钱或套取补贴吗？', answer: '截至2026年8月17日，没有公开证据证明影片涉及洗钱，也暂未查到该片申报或获得辽宁电影奖励的公开记录。' },
]

export default function NiuLaiMoviePage() {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      datePublished: '2026-08-17',
      dateModified: '2026-08-17',
      mainEntityOfPage: RESOURCE_URL,
      author: { '@type': 'Person', name: 'TUARAN', url: 'https://2aran.com/about' },
      about: { '@type': 'Movie', name: '牛来', genre: '动画', duration: 'PT86M', countryOfOrigin: '中国大陆' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ]

  return (
    <>
      <PageContainer width="standard" className="py-6 md:py-9">
        <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
        {structuredData.map((data, index) => (
          <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
        ))}

        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--site-muted)]">
            <Link href="/articles?tab=resources" className="underline underline-offset-4 opacity-80 hover:opacity-100">资源库</Link>
            <span aria-hidden="true">·</span>
            <span>电影与公共文化</span>
            <span aria-hidden="true">·</span>
            <time dateTime="2026-08-17">2026-08-17</time>
            <span aria-hidden="true">·</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <div className="mb-7 mt-5">
            <NiuLaiVideoPlayer />
          </div>

          <div className="border-b border-[#dedbd2] pb-8 dark:border-gray-800">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a7440] dark:text-amber-300">Film Resource · Fact Check</p>
            <h1 className="mt-3 max-w-5xl font-serif text-3xl font-semibold leading-tight tracking-tight text-[var(--site-ink)] md:text-5xl">{title}</h1>
            <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--site-muted)]">
              一部几乎没有宣发的低成本动画，在上映十天后靠观众玩梗、短视频扩散和猎奇打卡冲上热搜。最受关注的问题很直接：这样的画面为什么能进入院线？答案藏在电影准入规则里。
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {facts.map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-[#dedbd2] bg-[#faf9f5] px-4 py-3 dark:border-gray-800 dark:bg-gray-950/45">
                  <dd className="font-serif text-xl font-semibold text-[var(--site-ink)]">{value}</dd>
                  <dt className="mt-1 text-xs text-[var(--site-muted)]">{label}</dt>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <SharePageButton title={title} text={description} url={RESOURCE_URL} size="md" idleLabel="分享资源" />
              <ArticleActionsDropdown label="更多">
                <DistributeContentButton title={title} summary={description} url={`/resources/${RESOURCE_SLUG}`} category="resource" slug={RESOURCE_SLUG} tags={['牛来', '动画电影', '电影审查']} kindLabel="资源" />
              </ArticleActionsDropdown>
              <span className="text-xs text-[var(--site-muted)]">原片资源由大智提供，感谢分享。</span>
            </div>
          </div>
        </header>

        <NiuLaiInteractive />

        <article className="prose-tuaran mt-9">
          <h2>《牛来》是怎么突然火起来的？</h2>
          <p>
            《牛来》于 2026 年 8 月 5 日公映。公开报道显示，影片前十天累计票房只有 7711 元，观影人次不足三百。8 月 14 日后，低精度建模、动作卡顿、重复场景和穿模画面在社交平台集中传播，观众把院线观影变成猎奇打卡，影院随后增加排片。
          </p>
          <p>
            截至 8 月 15 日的报道口径，累计票房已经超过 21 万元，上座率升至 8.4%。这组数字只反映爆火早期的截面，后续票房应以灯塔专业版或猫眼专业版的实时数据为准。
          </p>

          <h2>两个人怎样做出 86 分钟动画？</h2>
          <p>
            导演信雨萌承担建模、动画、剪辑、制片和配音等工作，编剧孙丽芳同时参与配音。出品方大连璟园文化影视传媒有限公司规模较小，公开报道所述参保人数为一人。有限的人力和制作条件能够解释成片质感，也让影片成为一种罕见的院线样本。
          </p>

          <h2>龙标审查的是合规，观众评价的是质量</h2>
          <p>
            电影审查要确认内容、手续与放映技术是否符合要求。技术环节关注坏帧、音画不同步、长时间黑屏和解码故障等可放映性问题。建模是否精细、动作是否自然、场景是否丰富，最终由市场、影院和观众作出评价。
          </p>
          <p>
            《牛来》公开备案编号为影动备字〔2021〕第104号，公映许可证号为电审动字〔2024〕第33号。现有资料能够说明流程已经走完，无法证明某位审批人员为影片质量背书，也无法支持“背后有人操作”的结论。
          </p>

          <h2>补贴与洗钱传言缺少证据</h2>
          <p>
            辽宁省 2023 年发布的电影产业措施包含项目奖励，但奖励存在条件、评审和公示流程。“最高 100 万元”是政策上限，不能直接推导出每部取得公映许可证的影片都能获得该金额。截至 2026 年 8 月 17 日，公开渠道暂未发现《牛来》的申报或获奖公示。
          </p>
          <p>
            洗钱判断需要资金来源、关联交易、虚增成本和资金回流等证据链。网络讨论目前没有给出这类材料。可以讨论影片的制作水平、院线准入和公共审美，也应给未经证实的指控保留清晰边界。
          </p>

          <h2>资料来源与使用说明</h2>
          <ul>
            <li>事件梳理依据用户提供的澎湃新闻·澎湃有戏工作室报道文本，报道数据截至 2026 年 8 月中旬。</li>
            <li>票房数字快速变化，页面保留报道时点与口径，不将早期数据写成最终票房。</li>
            <li>原片保持 1920×864 画面和原始码率，以 22 个无损切片连续播放；播放器不会主动预载整部影片。</li>
            <li>资源由大智提供；报道版权归原媒体，影片版权归相应权利人所有。</li>
          </ul>
        </article>

        <ArticleFooterCta />
      </PageContainer>

      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
