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
  { question: '《牛来》为什么能通过电影审查？', answer: '国家电影局公开信息确认影片完成备案并取得公映许可证。内容审查依据法定内容要求，数字母版技术环节检查载体、DCP结构、画面、声音、字幕和加密等符合性；建模精细程度和艺术水准不属于公映许可对作品质量的背书。' },
  { question: '《牛来》的备案号和龙标编号是什么？', answer: '国家电影局公示的剧本备案编号为影动备字〔2021〕第104号，公映许可证号为电审动字〔2024〕第33号，第一出品单位为大连璟园文化影视传媒有限公司。' },
  { question: '电影公映许可证是否公开可查？', answer: '可以。国家电影局网站设有电影备案立项公示和电影公映许可证公示，可按片名、备案号、公映号或第一出品单位核验。' },
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
      dateModified: '2026-08-18',
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

          <h2>备案和公映许可证都能公开核验</h2>
          <p>
            国家电影局的
            <a href="https://www.chinafilm.gov.cn/xxgk/gsxx/dybalx/202112/t20211213_615696.html" target="_blank" rel="noreferrer">2021 年 10 月电影备案立项公示</a>
            列出《牛来》的备案编号影动备字〔2021〕第104号、备案单位大连璟园文化影视传媒有限公司，并标明“同意拍摄”。国家电影局随后公布的
            <a href="https://www.chinafilm.gov.cn/xxgk/gsxx/dygyxkz/202604/t20260403_982702.html" target="_blank" rel="noreferrer">电影公映许可证名单</a>
            确认《牛来》的公映号为电审动字〔2024〕第33号，第一出品单位与备案信息一致。备案和公映许可均有官方公开记录，不需要依赖网传龙标截图判断真伪。
          </p>
          <p>
            <a href="https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2023/art_650c3a9a9dc348c8ac10287998a3c03e.html" target="_blank" rel="noreferrer">《中华人民共和国电影产业促进法》</a>
            第十七条、十八条规定，完成片应报国务院电影主管部门或省级电影主管部门审查，受理后原则上三十日内作出决定；审查应组织不少于五名专家评审。法律只规定主管部门和专家评审机制，公开许可证名单通常不会披露每位评审人员姓名，因此现有记录无法支持“某位审批人员特殊放行”的指控。
          </p>

          <h2>内容审查和数字母版检测查的不是同一件事</h2>
          <p>
            国家电影局公开的
            <a href="https://www.chinafilm.gov.cn/bsfw/bsxz/201910/t20191008_23978.html" target="_blank" rel="noreferrer">《电影片送审须知》</a>
            将送审实务列为影片初审、领取《电影片公映许可证》片头、影片终审等环节。省级审查通过后，制片方提交审查决定书、意见表和规定格式的影片文件领取片头；带片头的最终发行版、数字电影母版、终审信息表及其他材料继续送交终审，合格后发放《电影片公映许可证》。领取龙标片头和取得最终公映许可证属于前后衔接的手续，不能把一张片头画面理解为全部审查材料。
          </p>
          <p>
            国家电影局于 2025 年发布的
            <a href="https://www.chinafilm.gov.cn/xxgk/kjybz/202508/t20250804_925493.html" target="_blank" rel="noreferrer">DY/Z 11—2025《数字电影送审母版制作要求与流程规范》</a>
            进一步公开了当前数字母版的载体、DCP结构、画面、声音、字幕、KDM与符合性检测要求。该文件晚于《牛来》2024年的公映号，不能反推《牛来》当时逐项采用了这份2025年规范；它可以说明母版技术检测有公开、可复核的客观项目。建模是否精细、角色动作是否自然、镜头是否有美感，仍属于创作质量和市场评价。
          </p>

          <h2>进口译制片适用另一套公开规则</h2>
          <p>
            <a href="https://xzfg.moj.gov.cn/front/law/detail?LawID=584" target="_blank" rel="noreferrer">《电影管理条例》</a>
            第三十条至第三十三条规定，电影进口业务由指定的电影进口经营单位经营；进口供公映的电影需在进口前报审，先办理临时进口，审查合格并取得《电影片公映许可证》和进口批准文件后再办理正式进口，同时还需取得著作权人的使用许可。进口、内容审查、公映许可、版权授权和后续译制是相互衔接的环节，不能用国产片的属地送审材料清单替代进口片规则。
          </p>
          <p>
            历信科技的
            <a href="https://www.dcpmk.com/news/film-submission-guide" target="_blank" rel="noreferrer">电影送审流程指南</a>
            与
            <a href="https://www.dcpmk.com/news/dcp-compliance-checklist" target="_blank" rel="noreferrer">DCP符合性检测清单</a>
            可作为制作服务商整理的行业实践参考，其中涉及的材料、周期和技术参数仍应以办理时有效的国家电影局办事须知、标准文件及受理窗口要求为准。例如其“2024年起必须使用官方检测软件”的表述，目前能直接核验的官方依据是2025年发布的DY/Z 11—2025，不能混写为2024年的既定规则。
          </p>

          <h2>补贴与洗钱传言缺少证据</h2>
          <p>
            辽宁省于 2025 年 7 月 5 日发布的
            <a href="https://www.ln.gov.cn/web/qmzx/lnsqmzxxtpsnxd/lnzxd/bm/2025070709375626984/index.shtml" target="_blank" rel="noreferrer">《辽宁省推动电影产业高质量发展若干措施》</a>
            明确：在辽宁备案立项或转立项到辽宁、取得《电影片公映许可证》并在院线上映的优秀中小成本影片，每部奖励最高 100 万元。奖励仍需经过申报、评审和公示，“最高 100 万元”是政策上限，不能推导出所有符合基础条件的影片都会获得该金额。截至 2026 年 8 月 17 日，公开渠道暂未发现《牛来》的申报或获奖公示。
          </p>
          <p>
            洗钱判断需要资金来源、关联交易、虚增成本和资金回流等证据链。网络讨论目前没有给出这类材料。可以讨论影片的制作水平、院线准入和公共审美，也应给未经证实的指控保留清晰边界。
          </p>

          <h2>资料来源与使用说明</h2>
          <ul>
            <li>事件梳理依据用户提供的澎湃新闻·澎湃有戏工作室报道文本，报道数据截至 2026 年 8 月中旬。</li>
            <li>备案、公映许可、审查程序、数字母版规范和进口规则优先引用国家电影局、市场监管总局与国家行政法规库公开文件。</li>
            <li>历信科技两篇材料作为行业流程参考，不替代法律、行政法规、电影行业标准及主管部门办事须知。</li>
            <li>票房数字快速变化，页面保留报道时点与口径，不将早期数据写成最终票房。</li>
            <li>原片保持 1920×864 画面和原始码率，以单个 MP4 提供完整 86 分 51 秒时间轴；播放器不会主动预载整部影片。</li>
            <li>资源由大智提供；报道版权归原媒体，影片版权归相应权利人所有。</li>
          </ul>
        </article>

        <ArticleFooterCta />
      </PageContainer>

      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
