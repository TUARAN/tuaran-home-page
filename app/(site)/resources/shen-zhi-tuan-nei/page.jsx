import Link from 'next/link'
import RanbiPaywall from '../../components/RanbiPaywall'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import SharePageButton from '../../components/SharePageButton'
import PageContainer from '../../components/PageContainer'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/resources/shen-zhi-tuan-nei'
const SOURCE_URL = 'https://finance.sina.com.cn/tech/discovery/2026-06-23/doc-iniekeev9770960.shtml'

export const metadata = {
  title: '《置身团内》文字版全文：美团到餐基层产品长文存档',
  description:
    '《置身团内》文字版全文存档：一名自称美团到餐基层产品员工谈美团组织路径依赖、数据资产化与 AI 落地问题。原文发布于脉脉，经新浪科技 / 快科技转载（2026-06-23）。',
  keywords: [
    '《置身团内》',
    '置身团内',
    '《置身团内》原文',
    '《置身团内》全文',
    '美团',
    '美团到餐',
    '脉脉',
    '职场观察',
    '组织观察',
    '路径依赖',
    '涂阿燃',
    'tuaran',
  ],
  alternates: {
    canonical: '/resources/shen-zhi-tuan-nei',
  },
  openGraph: {
    title: '《置身团内》文字版全文：美团到餐基层产品长文存档',
    description:
      '《置身团内》文字版存档：美团到餐基层产品员工谈组织路径依赖、数据资产化与 AI 落地。',
    url: PAGE_URL,
    type: 'article',
  },
  robots: {
    index: true,
    follow: true,
  },
}

function ShenZhiTuanNeiResourceContent() {
  return (
    <PageContainer width="narrow" className="py-12">
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.14em] text-[#888] dark:text-gray-500">资料库 · 职场</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
              《置身团内》文字版全文
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">
              美团到餐基层产品员工长文 · 脉脉匿名帖 / 新浪科技转载存档
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#555] dark:text-gray-400">
              原文发布于脉脉，经新浪科技 / 快科技转载（2026-06-23）。本页为 OCR 文字整理版，配套分析见
              <Link
                href="/articles/research/topics/shen-zhi-tuan-nei-meituan-workplace-observation"
                className="mx-1 underline underline-offset-4"
              >
                《置身团内》调研
              </Link>
              。
            </p>
          </div>
          <SharePageButton
            title="《置身团内》文字版全文"
            text="《置身团内》文字版存档：美团到餐基层产品员工谈组织路径依赖、数据资产化与 AI 落地。"
            url={PAGE_URL}
          />
        </div>
      </header>

      <section className="mb-6 text-sm leading-relaxed text-[#555] dark:text-gray-400">
        <p>
          来源页：
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            新浪科技转载快科技《美团员工发长文〈置身团内〉谈公司困境》
          </a>
        </p>
      </section>

      <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-h2:text-xl prose-h3:text-base prose-p:leading-relaxed prose-p:text-[#333] dark:prose-p:text-gray-300 prose-hr:border-[#eee] dark:prose-hr:border-gray-800">

        <p>从个人到整个基层产品，我想聊聊美团。聊聊一款 super mini 级别的《置身团内》。</p>

        <p>地主要发现的这一点，一条一条捡起来——大厂里面主要都是鼓励创新，而在自己地位岌岌可危的时候，基层发现的却截然不同：总是能摸清了组织内部稳定性的一套逻辑，但怎么也推不动。</p>

        <p>我们不想对所谓&ldquo;从上到下&rdquo;过多评价，但我有一个关键发现：在一个联盟结构中向管理层和公司运作整个流程，每个工号都被赋予了一个&ldquo;权重&rdquo;，而这是一套中等逻辑的结构，只是在跨层级时才能达到真正的目的。</p>

        <hr />

        <h2>几个值得聊的问题</h2>

        <h3>一、参照的 PM 形式上是产品，实际上更像台管理员</h3>

        <p>在组织内部，产品上下关系清晰，但不是真正的直线汇报，更多是向下索要资源，而整个 core-team 核心团队最终拥有决策权。产品公司会对内部用量有目的地调整，单个 PM 没有关于整个产品的真实决策权力，不是向上说话，而是靠近上层的那套体系才能整合资源。</p>

        <p>从我的观察来看，最近很多情况是：那种反人类的产品路径，通过内部流程进行层层补充，形成了一整套逻辑自洽的&ldquo;成功路径&rdquo;，而路径依赖真的是一套套向下传递的。</p>

        <h3>二、所谓&ldquo;数据是组织生命线&rdquo;，把控着整条分发链</h3>

        <p>美团对外一直强调用户数量和 AI 改变，但对内角度，只有少数 PM 能看到全貌数据，来整套框架中关于运营的底层数据，普通员工看不到，也影响不了。</p>

        <p>用户实际的想法呢？美团内部的 PM 总是在管理 SKU，另外一个大平台是联合平台在做整合——搜索里面就是一整套给整体运营提供支持的机制，但是最终调整与决策都被上面收走了。</p>

        <p>有人可能会问：那这么多年到底干了什么？</p>

        <p>问题在于：如果没有成功把控关键数据，你就看不到全貌；而光有数据，没有决策权，你也改变不了什么。</p>

        <h3>三、AI 的落地，做了一个更好看的表面</h3>

        <p>AI 包括在 Coupons、美团等各百亿级别的平台上，目前的落地方式仅仅是提升 LTV 的数量，然后整体把控 AI 层面，做了一个&ldquo;更好看&rdquo;的架构——仅仅是框架，没有能真正到达用户的能力。</p>

        <p>一个到餐层面的人，容易看到层级优化的好处，但每个层级都需要向上汇报，每个人都需要跑出自己对位的节奏。接受了这个框架，才是这里的生存方式。</p>

        <hr />

        <h2>如果美团把这次内部矛盾当作一次发现</h2>

        <p>关键就在于：从 2015 年美团整体发展开始，对于平台内部整体而言，层级越重，调整越慢；层级越大，越用不好整套体系。</p>

        <p>与此同时，内容和媒体运营在整套美团内部一直是一套&ldquo;二等&rdquo;关系——从来不参与真正的交叉业务决策，始终是独立个体，交叉之后也往往难以产生真实结果。</p>

        <p>各业务之间形式上有交叉，你就会发现一种很特别的状态：每条线都在单独做增长，没有人真正打通。</p>

        <hr />

        <h2>这些年在干什么</h2>

        <p>之后的事，他们都在做一件事情：让上面看到这个平台，让上面看到你们这个团队在增长，有 10 倍的核心能力，已经积累超大的用户量。</p>

        <p>如果真的上下打通，各层级之间真正有交叉，你就会发现这个到餐基层产品的连接，到底有多复杂，又有多脆弱。</p>

        <p>管理层的所谓&ldquo;决心&rdquo;，总是在流程层面呈现，而非真正落到资源的分配上来。</p>

        <hr />

        <h2>结语</h2>

        <p>节气和时候是开放的，但截止的时候也是有的。时候与资源之间，因为这个来了，又走了。</p>

        <p>能不能在 Nokia 倒下之前，就想清楚了？</p>

        <hr />

        <p className="text-xs text-[#999] dark:text-gray-500">
          原文发布于脉脉，转载自新浪科技 / 快科技页面（2026-06-23）。本文为图片版 OCR 文字整理，部分表述保留原帖风格，少量识别不清的字句已作合理推断补全，不代表原作者观点。
        </p>

      </article>
    </PageContainer>
  )
}

export default function ShenZhiTuanNeiResourcePage() {
  return (
    <>
      <ContentPvBeacon category="resource" slug="shen-zhi-tuan-nei" />
      <RanbiPaywall resourceKey="resource:shen-zhi-tuan-nei" unitLabel="资料">
        <ShenZhiTuanNeiResourceContent />
      </RanbiPaywall>
    </>
  )
}
