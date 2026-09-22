import Link from 'next/link'

import ArticleComments from '../components/ArticleComments'
import ContentProofCard from '../components/ContentProofCard'
import { getContentProofCredential } from '../../../lib/contentProofRegistry'
import ContentFingerprintPrototype from './ContentFingerprintPrototype'
import ReaderTestInvite from './ReaderTestInvite'

const DETAIL_HREF = '/articles/research/topics/2aran-onchain-content-site'
const WHITEPAPER_HREF = '/onchain-blog/whitepaper'
const WHITEPAPER_DOWNLOAD = '/resources/cnt-whitepaper/CNT-content-token-economy-whitepaper.md'

export const dynamic = 'force-static'

export const metadata = {
  title: '万物上链｜2aran Content Ledger',
  description: '公开内容已有指纹、站点签名和测试网批次记录。读者无需钱包，即可在浏览器或离线脚本中核对版本、时间和完整性。',
  alternates: { canonical: '/onchain-blog' },
  openGraph: {
    title: '万物上链｜2aran Content Ledger',
    description: '核对公开内容的指纹、签名与批次记录。无需钱包。',
    url: '/onchain-blog',
    type: 'website',
  },
}

const LAYERS = [
  ['01', '阅读层', '2aran.com', '搜索、SEO、RSS、评论、登录和阅读交互继续由 2aran.com 提供。'],
  ['02', '内容层', '稳定指纹', '用 contentKey 标识内容，对规范化正文、元数据和资源清单计算哈希。'],
  ['03', '证明层', 'L2 / EAS', '多篇文章组成 Merkle 批次，只把 Root、批次和发布身份写入低成本链。'],
  ['04', '归档层', 'IPFS / Arweave', '公开文章按价值分级保存副本；永久归档只用于人工确认的精选终版。'],
]

const READER_ACTIONS = [
  ['核对内容', '浏览器重新计算当前正文和元数据哈希，确认它与发布记录一致。'],
  ['查看版本', '沿版本时间线查看首次发布、修订、撤回及前后证明关系。'],
  ['独立验证', '使用 Merkle Path、链上 Root、chainId 和交易记录，无需依赖 2aran.com 即可复核。'],
  ['读取副本', '已发布的站点副本按同一哈希回读；完成 pinning 的条目另有 IPFS CID。'],
]

const CAPABILITIES = [
  {
    title: '读者核对',
    status: '已上线',
    live: true,
    copy: '文章凭证卡、本页即时核对、凭证详情页、离线 CLI 与 Agent 协议均已开放。全程无需钱包。',
  },
  {
    title: '测试网存证',
    status: '已写入',
    live: true,
    copy: '首批公开内容的 Merkle Root 已登记在 Base Sepolia EAS，逐篇 Path 可独立复核。',
  },
  {
    title: '副本与主网',
    status: '发布侧执行',
    live: false,
    copy: 'IPFS pinning、幂等存证和主网开关已接入；活 pinning 与主网交易仍由隔离钱包和 Pinata 凭据执行。',
  },
]

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: '万物上链｜2aran Content Ledger',
      url: 'https://2aran.com/onchain-blog',
      description: '公开内容的指纹、站点签名与批次存证。读者无需钱包即可核对版本、时间和完整性。',
    },
    {
      '@type': 'SoftwareApplication',
      name: '2aran Content Proof Verifier',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Node.js',
      url: 'https://github.com/TUARAN/tuaran-home-page/tree/main/tools/content-proof-verifier',
      description: '离线验证 2aran 内容凭证的开源 CLI，运行时不访问 2aran.com。',
      author: { '@type': 'Person', name: 'TUARAN', url: 'https://2aran.com' },
    },
  ],
}

const BOUNDARIES = [
  '不要求普通读者连接钱包，钱包只服务于发布流程。',
  '评论、账号、燃币、草稿、后台和私密内容继续留在 D1 / R2。',
  '个人信息、客户资料、版权不明素材和可能需要删除的内容不进入永久存储。',
  '“已验证”只证明版本、时间和完整性，不证明文章观点或事实天然正确。',
]

const TOKEN_ALLOCATION = [
  ['社区生态挖矿池', '50%', '5 亿', '10 年双因子衰减，池满即停'],
  ['优质创作者激励池', '15%', '1.5 亿', '按月度内容质量投票释放'],
  ['生态流动性储备', '10%', '1 亿', '上线锁仓，2 年线性解锁'],
  ['DAO 生态财库', '10%', '1 亿', '多签托管，提案通过后动用'],
  ['早期贡献 & 团队', '10%', '1 亿', '1 年悬崖 + 4 年线性解锁'],
  ['早期私募额度', '5%', '0.5 亿', '6 个月线性解锁'],
]

const CONTENT_LINEAGE = [
  ['12 + 3', '合成 123', '材料早已在路上', 'e90576c7a6500c494c469fbb91fcec3932a8a4c7bf5c484be77692e216c7c399'],
  ['123', '哈希已有', '整段重复，这是引用', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'],
  ['123 + 4', '新哈希', '组合落账，这一步可记', '18ec36d229e478529640195045f6cf42ba55e3162f3518bcff2992e78a2a96af'],
]

function SectionHeading({ label, title, children }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a6b3e] dark:text-[#d2ac70]">{label}</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#26231e] dark:text-[#f2ede4]">{title}</h2>
      {children ? <p className="mt-3 text-sm leading-7 text-[#625d54] dark:text-[#b7b0a5]">{children}</p> : null}
    </div>
  )
}

export default function OnchainBlogPage() {
  const demoCredential = getContentProofCredential('research:topics:content-proof-demo')
  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[#292620] dark:text-[#eee9df]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replaceAll('<', '\\u003c') }} />
      <section
        className="relative isolate min-h-[680px] overflow-hidden border-b border-[#55452d] bg-[#05080c] text-white"
        style={{ backgroundImage: "url('/images/onchain-blog/everything-onchain-hero.webp')", backgroundPosition: '72% 48%', backgroundSize: 'cover' }}
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,6,9,0.94)_0%,rgba(3,6,9,0.8)_24%,rgba(3,6,9,0.42)_56%,rgba(3,6,9,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-52 bg-gradient-to-t from-[#05080c] to-transparent" />
        <div className="flex min-h-[680px] w-full flex-col px-6 py-10 sm:px-10 md:px-12 md:py-14 lg:px-16 xl:px-20">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <Link href="/" className="no-underline hover:text-white">TUARAN</Link>
            <span>/</span>
            <span>CONTENT LEDGER</span>
          </div>

          <div className="mt-auto max-w-2xl pb-6 pt-24">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#d9b66c]/55 bg-black/35 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f0cd88] backdrop-blur-sm">
                无需钱包 · BASE SEPOLIA 已存证
              </span>
              <span className="font-mono text-[11px] tracking-[0.16em] text-white/50">2ARAN CONTENT LEDGER</span>
            </div>
            <h1 className="mt-7 font-serif text-[60px] font-semibold leading-[0.94] tracking-[-0.045em] text-white drop-shadow-2xl md:text-[92px]">
              万物上链
            </h1>
            <p className="mt-7 font-serif text-2xl font-semibold leading-snug text-[#f2d59a] md:text-4xl">
              所有内容的生产与消费，都应该有价值。
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/[0.72] md:text-lg">
              公开文章已有内容指纹、站点签名和测试网批次记录。读者可在浏览器或离线脚本中核对版本、时间和完整性。
              <Link href={WHITEPAPER_HREF} className="ml-1 font-semibold text-[#f2d59a] no-underline hover:text-[#f8e4b8]">
                白皮书
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="said-123" className="scroll-mt-24 border-b border-[#d8d0c2] bg-[var(--page-bg)] dark:border-[#2a313b]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-start md:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a6b3e] dark:text-[#d2ac70]">Origin</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#26231e] dark:text-[#f2ede4]">一个人说 123</h2>
            <div className="mt-6 space-y-5 text-sm leading-8 text-[#514c44] dark:text-[#b9b2a7] md:text-[15px]">
              <p>别人凭什么判断，这句话是他说的。</p>
              <p>
                通常会去查重。查重率 100%，这段已经存在，他在引用。他说 123+4，几乎找不到整段重复。这段内容就是他的吗？
              </p>
              <p>
                每一份完整内容对应一个哈希。123 有自己的哈希，123+4 另有哈希。哈希对得上，同一份内容已经公开过。哈希对不上，先记录：这个版本、这个时间、这个人。
              </p>
              <p>
                不必因为只多了一个 4，就去质疑原创太少。没有谁凭空产生 123。123 来自 12+3，或 122+1。大家都朝着一个方向演化：把所有内容组合都演进完。
              </p>
              <p>
                真正独特的想法极少。关键是他能否恰当地表达，把已有材料有机地组合，把某件事往前推进一步。理论就是这样演进的。
              </p>
              <p>
                哈希认出有没有这一份。认出之后，这一次组合才可以记成贡献。CNT 把创作、互动、确权、流通、治理写成同一套结算规则。
              </p>
            </div>
            <Link href="#whitepaper" className="mt-8 inline-flex rounded-full bg-[#2f4b3a] px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-[#3a5c47] dark:bg-[#d5b475] dark:text-[#171109] dark:hover:bg-[#e0c48a]">
              CNT 白皮书
            </Link>
          </div>
          <div className="rounded-2xl border border-[#d6cdbf] bg-[#faf8f2] p-5 dark:border-[#293441] dark:bg-[#121a23]">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9b7a48] dark:text-[#cfad73]">Hash lineage</p>
            <ol className="mt-4 space-y-3">
              {CONTENT_LINEAGE.map(([formula, status, note, hash], index) => (
                <li key={formula} className="rounded-xl border border-[#e4ddd0] bg-white/70 px-4 py-3 dark:border-[#303a46] dark:bg-[#0f161e]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-[#9b7a48] dark:text-[#cfad73]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="font-mono text-[11px] text-[#8a6b3e] dark:text-[#d2ac70]">{status}</span>
                  </div>
                  <strong className="mt-2 block font-serif text-2xl text-[#26231e] dark:text-[#f2ede4]">{formula}</strong>
                  <p className="mt-1 text-sm leading-6 text-[#625d54] dark:text-[#aaa49a]">{note}</p>
                  <code className="mt-2 block break-all font-mono text-[11px] leading-5 text-[#806842] dark:text-[#d2ac70]">SHA-256 {hash}</code>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="whitepaper" className="scroll-mt-24 border-b border-[#d8d0c2] bg-[#171a1d] text-[#f4eee4] dark:border-[#2a313b]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start md:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#d2ac70]">Whitepaper</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">CNT内容生态代币经济白皮书</h2>
            <p className="mt-4 text-sm leading-7 text-[#c1b8aa]">
              新组合一旦有哈希、能落账，这次表达就可以进入贡献结算。CNT 最大总量 10 亿枚，合约硬封顶。行为挖矿按贡献分每周结算，四层反女巫抬高刷量成本，销毁、分红和 DAO 把持币、使用和治理收进同一闭环。附录给出 24 个智能合约模块与依赖关系。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={WHITEPAPER_HREF} className="rounded-full bg-[#e0bb74] px-5 py-2.5 text-sm font-semibold text-[#171109] no-underline hover:bg-[#f1d397]">
                阅读全文
              </Link>
              <a
                href={WHITEPAPER_DOWNLOAD}
                download="CNT内容生态代币经济白皮书.md"
                className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10"
              >
                下载正式完整版
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/25">
            <div className="grid grid-cols-[1.4fr_0.5fr_0.6fr] gap-px bg-white/10 font-mono text-[10px] uppercase tracking-[0.08em] text-white/45">
              <div className="bg-[#171a1d] px-4 py-3">代币池</div>
              <div className="bg-[#171a1d] px-4 py-3">占比</div>
              <div className="bg-[#171a1d] px-4 py-3">数量</div>
            </div>
            {TOKEN_ALLOCATION.map(([pool, share, amount, rule]) => (
              <article key={pool} className="grid grid-cols-[1.4fr_0.5fr_0.6fr] items-baseline border-t border-white/10 px-4 py-3">
                <div>
                  <h3 className="font-serif text-base font-semibold">{pool}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/45">{rule}</p>
                </div>
                <p className="font-mono text-sm text-[#f2d59a]">{share}</p>
                <p className="text-sm text-white/75">{amount}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reader-verification" className="scroll-mt-24 border-b border-[#d8d0c2] bg-[var(--site-panel)] dark:border-[#2a313b]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start md:py-20">
          <SectionHeading label="How to verify" title="读者现在可以核对">
            验证在当前浏览器本地完成，不上传正文，也不请求连接钱包。开源脚本可以脱离 2aran.com 做同一组检查。
          </SectionHeading>
          <div className="grid gap-px overflow-hidden rounded-xl border border-[#cfc4b2] bg-[#cfc4b2] dark:border-[#303a46] dark:bg-[#303a46] sm:grid-cols-2">
            {READER_ACTIONS.map(([title, copy]) => (
              <article key={title} className="bg-[#f8f5ed] p-5 dark:bg-[#141d27]">
                <h3 className="font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#625d54] dark:text-[#aaa49a]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ReaderTestInvite />

      <section id="live-check" className="scroll-mt-24 border-y border-[#d8d0c2] bg-[var(--site-panel)] dark:border-[#2a313b]">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <ContentFingerprintPrototype />
            <ContentProofCard credential={demoCredential} />
          </div>
        </div>
      </section>

      <section className="border-b border-[#d8d0c2] bg-[#171a1d] text-[#f4eee4] dark:border-[#2a313b]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center md:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#d2ac70]">Testnet Batch</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">十几份创造，一条公共价值坐标</h2>
            <p className="mt-4 text-sm leading-7 text-[#c1b8aa]">
              每篇公开调研先形成独立内容凭证，再汇入 Merkle Tree。Base Sepolia 上只登记批次 Root；任意作品都可以携带自己的 Path，证明它属于这次公开发布。
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/25 p-5">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-xs sm:gap-4">
              <div className="space-y-2">
                {['调研 #01', '文章 #02', '作品 #…'].map((item) => <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-white/65">{item}</div>)}
              </div>
              <span className="text-[#d2ac70]">→</span>
              <div className="rounded-xl border border-[#d2ac70]/35 bg-[#d2ac70]/10 px-3 py-6">
                <span className="block font-mono text-[10px] text-[#d2ac70]">MERKLE TREE</span>
                <strong className="mt-2 block font-serif text-xl">逐层汇聚</strong>
              </div>
              <span className="text-[#d2ac70]">→</span>
              <div className="rounded-xl border border-[#79b7cc]/35 bg-[#79b7cc]/10 px-3 py-6">
                <span className="block font-mono text-[10px] text-[#8cc8dd]">BASE SEPOLIA · EAS</span>
                <strong className="mt-2 block font-serif text-xl">唯一 Root</strong>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-white/45">
              <span>SHA-256 DOMAIN SEPARATION</span><span>INDEPENDENT PATH VERIFICATION</span><span>D1 INDEX</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
        <SectionHeading label="Architecture" title="四层结构，各做一件事">
          上链只处理需要公开验证的最小信息；动态产品能力继续留在适合更新、删除和治理的系统中。
        </SectionHeading>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {LAYERS.map(([index, title, value, copy]) => (
            <article key={index} className="rounded-xl border border-[#d6cdbf] bg-[#faf8f2] p-5 dark:border-[#293441] dark:bg-[#121a23]">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs text-[#95846a] dark:text-[#b89c6d]">{index}</span>
                <span className="rounded-full bg-[#eee7da] px-2.5 py-1 font-mono text-[10px] text-[#715b39] dark:bg-[#242119] dark:text-[#d2b67f]">{value}</span>
              </div>
              <h3 className="mt-8 font-serif text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#625d54] dark:text-[#aaa49a]">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pb-14 md:pb-20">
        <SectionHeading label="Now live" title="当前能力">
          读者侧验证已经开放。主网交易和 IPFS 活 pinning 仍由隔离发布钱包执行，不在构建机上自动发出。
        </SectionHeading>
        <div className="mt-8 overflow-hidden rounded-xl border border-[#d6cdbf] bg-[#faf8f2] dark:border-[#293441] dark:bg-[#121a23]">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="grid gap-3 border-b border-[#ded6ca] p-5 last:border-b-0 dark:border-[#293441] md:grid-cols-[180px_1fr_96px] md:items-center">
              <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
              <p className="text-sm leading-6 text-[#625d54] dark:text-[#aaa49a]">{item.copy}</p>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${item.live ? 'bg-[#dce5d6] text-[#3d6036] dark:bg-[#1f3827] dark:text-[#a7d29f]' : 'bg-[#eee8dd] text-[#7b7060] dark:bg-[#242b34] dark:text-[#9ca6b2]'}`}>
                {item.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d8d0c2] bg-[#292722] text-[#f4eee4] dark:border-[#323b47] dark:bg-[#090d12]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] md:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#cdb17c]">Interfaces</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">现有接口</h2>
            <p className="mt-4 text-sm leading-7 text-[#c5bdb0]">
              内容证明沿用 contentKey，不增加第二套内容 ID。存证失败不阻塞文章发布；凭证状态先记为“等待存证”，任务成功后更新为“发布记录已验证”。
            </p>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-white/15 bg-black/25 p-5 font-mono text-xs leading-7 text-[#e3d8c5]"><code>{`lib/contentProof.js
  canonicalizeContent(entry)
  hashContent(entry)
  buildAssetManifest(entry)
  verifyContentProof(entry, proof)

lib/contentMerkle.js
  signed proofs → Merkle root + per-item paths

lib/contentReplica.js
  replica payload → pin → dual-gateway SHA-256 readback

scripts/anchor-content-proof-batch.mjs
  isolated publisher wallet → retry / idempotent EAS attest → cost ledger

tools/content-proof-verifier/cli.mjs
  local replica + pinned public key + optional batch → JSON report

/.well-known/content-proof.json  /verify.txt  /schemas/content-proof/v1

D1: content_proofs + content_replicas + cost events
  content_key / version / content_hash / cid
  chain_id / tx_hash / merkle_root / cost_wei`}</code></pre>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] md:py-20">
        <SectionHeading label="Boundaries" title="永久记录之前，先保留退出能力">
          链上证明会放大隐私、版权、纠错和撤回成本，因此公开范围必须比普通网页更严格。
        </SectionHeading>
        <ul className="grid gap-3">
          {BOUNDARIES.map((item, index) => (
            <li key={item} className="flex gap-4 rounded-lg border border-[#d6cdbf] bg-[#faf8f2] px-4 py-3 text-sm leading-7 text-[#514c44] dark:border-[#293441] dark:bg-[#121a23] dark:text-[#b9b2a7]">
              <span className="font-mono text-xs text-[#9b7a48] dark:text-[#cfad73]">{String(index + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-[#d8d0c2] bg-[var(--site-panel)] dark:border-[#2a313b]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div>
            <p className="font-serif text-2xl font-semibold">技术选择、数据结构和风险边界写在完整说明里。</p>
            <p className="mt-2 text-sm text-[#665f55] dark:text-[#aaa49a]">更新日期：2026-09-21 · 读者现在可用浏览器或离线脚本核对示例凭证。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={WHITEPAPER_HREF} className="shrink-0 rounded-full bg-[#e0bb74] px-5 py-3 text-sm font-semibold text-[#171109] no-underline hover:bg-[#f1d397]">
              打开白皮书 →
            </Link>
            <Link href={DETAIL_HREF} className="shrink-0 rounded-full border border-[#9d835b] px-5 py-3 text-sm font-semibold text-[#5d4523] no-underline hover:bg-[#f8f3e9] dark:border-[#8d774f] dark:text-[#dbbd86] dark:hover:bg-white/[0.05]">
              打开技术方案 →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pb-16">
        <div id="comments" className="scroll-mt-24 rounded-2xl border border-[#d6cdbf] bg-[#faf8f2] px-5 py-6 dark:border-[#293441] dark:bg-[#121a23]">
          <h2 className="font-serif text-2xl font-semibold">核对反馈</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#625d54] dark:text-[#aaa49a]">写下你核对了哪几项、是否通过、卡在哪一步。</p>
          <ArticleComments articleKey="resource:onchain-blog" />
        </div>
      </section>
    </main>
  )
}
