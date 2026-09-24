import Image from 'next/image'
import Link from 'next/link'

import ArticleComments from '../components/ArticleComments'
import ContentProofCard from '../components/ContentProofCard'
import { getContentProofCredential } from '../../../lib/contentProofRegistry'
import { ONCHAIN_COLLECTION_STATS, ONCHAIN_WORKS } from '../../../lib/onchainWorks'
import ContentFingerprintPrototype from './ContentFingerprintPrototype'
import ReaderTestInvite from './ReaderTestInvite'

const DETAIL_HREF = '/articles/research/topics/2aran-onchain-content-site'
const WHITEPAPER_HREF = '/onchain-blog/whitepaper'
const TAPEOUT_WHITEPAPER = 'https://tapeout.net/whitepaper'

export const dynamic = 'force-static'

export const metadata = {
  title: '链上作品｜TUARAN Onchain Works',
  description: 'TUARAN 持续发布的链上作品合集。首件作品是已运行在 BNB Chain TapeKit 容器中的中国象棋，并公开版本哈希、容器与交易记录。',
  alternates: { canonical: '/onchain-blog' },
  openGraph: {
    title: '链上作品｜TUARAN Onchain Works',
    description: '打开作品，也核对作品。中国象棋已经上链，后续作品会持续收入同一份公开合集。',
    url: '/onchain-blog',
    type: 'website',
  },
}
const TAPEOUT_LESSONS = [
  ['从最小单元开始', 'TapeOut 从 NAND 与 LATCH 出发；内容从正文、资源清单和版本元数据出发。先定义能被核对的最小单元。'],
  ['组合要留下来源', '电路可以把已有电路当作黑盒继续组合；作品也应记录素材、代码、引用与前一版本，形成可追溯的依赖关系。'],
  ['发布要形成成品', '画布里的草稿不等于“流片”。内容完成上链发布后，应同时拥有可读取的成品、版本哈希和链上交易。'],
  ['使用比凭证更重要', 'TapeOut 的电路能被直接调用。链上内容也应能读、能玩或能下载，而不只留下一个哈希。'],
]

const PUBLISHING_ROUTES = [
  ['01', '可运行作品', 'BNB Chain · TapeKit', '把精简后的 HTML、CSS 与 JavaScript 写入容器。读者从公开网关直接打开；适合游戏、互动页和单文件工具。'],
  ['02', '版本凭证', 'Base Sepolia · EAS', '给文章和资源生成规范化哈希，再把多个凭证汇入 Merkle Root。它证明某个版本在某时已发布，不负责托管正文。'],
  ['03', '长期副本', 'IPFS / Arweave', '为人工确认的终版保存内容副本。永久存储只用于版权、隐私和撤回风险已经评估过的公开作品。'],
]

const RELEASE_FIELDS = [
  ['作品入口', '读者能实际打开、阅读、游玩或下载的地址。'],
  ['版本哈希', '对完整发布包计算 SHA-256；只要内容改变，哈希就改变。'],
  ['链上位置', '明确网络、协议、容器或合约，避免只写一句“已经上链”。'],
  ['发布交易', '每次更新都保留 TxID、时间、文件大小和对应版本。'],
  ['来源清单', '记录原创代码、引用、素材授权、依赖和前一版本。'],
  ['更新规则', '入口可以升级；旧交易与旧哈希继续作为历史版本存在。'],
]

const BOUNDARIES = [
  '链上记录能证明版本、时间和发布账户，不能自动证明观点正确、作品原创或版权无争议。',
  '私密资料、个人信息、客户数据、版权不明素材和可能需要彻底删除的内容不进入永久存储。',
  '动态账号、评论、草稿、后台与访问控制继续留在常规数据库，不为“上链”牺牲必要的修改和删除能力。',
  '主网发布由隔离钱包人工确认；页面不会索取私钥、助记词、钱包备份或验证码。',
]

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'TUARAN 链上作品',
  url: 'https://2aran.com/onchain-blog',
  description: '可直接使用并可核对发布记录的链上作品合集。',
  hasPart: ONCHAIN_WORKS.map((work) => ({
    '@type': 'CreativeWork',
    name: work.title,
    url: `https://2aran.com${work.href}`,
    sameAs: work.liveHref,
    dateModified: work.release.releasedAt,
  })),
}

function Label({ children }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#b99559]">{children}</p>
}

function SectionHeading({ label, title, children, light = false }) {
  return (
    <div className="max-w-3xl">
      <Label>{label}</Label>
      <h2 className={`mt-3 font-serif text-3xl font-semibold leading-tight md:text-4xl ${light ? 'text-white' : 'text-[#26231e] dark:text-[#f2ede4]'}`}>{title}</h2>
      {children ? <p className={`mt-4 text-sm leading-7 md:text-base ${light ? 'text-white/60' : 'text-[#625d54] dark:text-[#b7b0a5]'}`}>{children}</p> : null}
    </div>
  )
}

function ReleaseValue({ label, children, mono = false }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</dt>
      <dd className={`mt-1 break-all text-sm text-white/75 ${mono ? 'font-mono text-xs leading-5' : ''}`}>{children}</dd>
    </div>
  )
}

export default function OnchainBlogPage() {
  const demoCredential = getContentProofCredential('research:topics:content-proof-demo')

  return (
    <main className="min-h-screen bg-[#f1eee7] text-[#292620] dark:bg-[#080d12] dark:text-[#eee9df]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replaceAll('<', '\\u003c') }} />

      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#05080c] text-white">
        <div className="absolute inset-0 -z-20 bg-[url('/images/onchain-blog/everything-onchain-hero.webp')] bg-cover bg-[72%_48%] opacity-65" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,6,9,0.98)_0%,rgba(3,6,9,0.9)_42%,rgba(3,6,9,0.35)_100%)]" />
        <div className="mx-auto flex min-h-[700px] w-full max-w-[1280px] flex-col px-5 py-8 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
            <div className="flex items-center gap-2"><Link href="/" className="no-underline hover:text-white">TUARAN</Link><span>/</span><span>ONCHAIN WORKS</span></div>
            <a href={TAPEOUT_WHITEPAPER} target="_blank" rel="noopener noreferrer" className="no-underline hover:text-[#f2d59a]">TapeOut 白皮书 ↗</a>
          </div>

          <div className="my-auto max-w-3xl py-20">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">{ONCHAIN_COLLECTION_STATS.liveWorks} 件主网作品</span>
              <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white/60">持续上链</span>
            </div>
            <h1 className="mt-7 font-serif text-[58px] font-semibold leading-[0.92] tracking-[-0.05em] sm:text-[82px] lg:text-[108px]">链上作品</h1>
            <p className="mt-7 max-w-2xl font-serif text-2xl font-semibold leading-snug text-[#f2d59a] md:text-4xl">把作品交给链，也把核对方法交给读者。</p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">中国象棋已经运行在 BNB Chain 的 TapeKit 容器里。后续每一件上链作品都会收入这里，并公开入口、版本哈希、链上位置和发布交易。</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#works" className="rounded-full bg-[#e6c17a] px-6 py-3 text-sm font-semibold text-[#171109] no-underline hover:bg-[#f4d89c]">查看链上作品</a>
              <Link href="/tapeout-xiangqi" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-white/10">中国象棋发布记录</Link>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              ['COLLECTION', `${ONCHAIN_COLLECTION_STATS.liveWorks.toString().padStart(2, '0')} LIVE`, '每件作品都有独立发布记录'],
              ['FIRST WORK', '122.6.TAPE', '链上中国象棋'],
              ['POLICY', 'OPEN TO VERIFY', '入口、哈希、容器、交易同时公开'],
            ].map(([label, value, copy]) => (
              <div key={label} className="bg-black/45 p-4 backdrop-blur-sm">
                <p className="font-mono text-[10px] tracking-[0.18em] text-white/35">{label}</p>
                <strong className="mt-2 block font-mono text-sm text-[#f2d59a]">{value}</strong>
                <p className="mt-1 text-xs text-white/45">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="works" className="scroll-mt-24 border-b border-[#d8d0c2] dark:border-white/10">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:py-24">
          <SectionHeading label="Onchain collection" title="已经上链的作品">作品必须先能被使用，再谈它留下了什么证明。合集只收入拥有公开入口与可核验发布记录的成品。</SectionHeading>
          <div className="mt-10 space-y-6">
            {ONCHAIN_WORKS.map((work) => (
              <article key={work.slug} className="overflow-hidden rounded-[28px] border border-[#cfc5b5] bg-[#111820] shadow-[0_24px_70px_rgba(41,32,19,0.12)] dark:border-white/10">
                <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="relative min-h-[360px] overflow-hidden lg:min-h-[560px]">
                    <Image src={work.media} alt={`${work.title}发布画面`} fill sizes="(min-width: 1024px) 630px, 100vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07101c] via-transparent to-black/20" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                      <div className="flex flex-wrap gap-2">{work.capabilities.map((item) => <span key={item} className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs text-white/70 backdrop-blur">{item}</span>)}</div>
                    </div>
                  </div>
                  <div className="flex flex-col p-6 text-white sm:p-9">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-xs text-cyan-200/60">WORK #{work.sequence}</span>
                      <span className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200 ring-1 ring-inset ring-emerald-200/20">{work.statusLabel}</span>
                    </div>
                    <h2 className="mt-8 font-serif text-4xl font-semibold tracking-[-0.03em]">{work.title}</h2>
                    <p className="mt-3 text-lg text-cyan-100/80">{work.subtitle}</p>
                    <p className="mt-5 text-sm leading-7 text-white/55">{work.description}</p>
                    <dl className="mt-8 grid gap-5 border-y border-white/10 py-6 sm:grid-cols-2">
                      <ReleaseValue label="网络">{work.network}</ReleaseValue>
                      <ReleaseValue label="协议">{work.protocol}</ReleaseValue>
                      <ReleaseValue label="TapeID">{work.release.tapeId}</ReleaseValue>
                      <ReleaseValue label="当前版本">{work.release.version}</ReleaseValue>
                      <ReleaseValue label="容器" mono>{work.release.container}</ReleaseValue>
                      <ReleaseValue label="SHA-256" mono>{work.release.sha256}</ReleaseValue>
                    </dl>
                    <div className="mt-auto flex flex-wrap gap-3 pt-8">
                      <a href={work.liveHref} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 no-underline hover:bg-cyan-200">打开链上作品 ↗</a>
                      <Link href={work.href} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-white/10">查看发布记录</Link>
                      <a href={work.release.explorerHref} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/15 px-5 py-3 text-sm text-white/65 no-underline hover:bg-white/10">核对交易 ↗</a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-[#baa98c] px-6 py-7 dark:border-white/15">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b7a48]">Next release</p>
            <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div><h3 className="font-serif text-2xl font-semibold">下一件作品完成上链后，会出现在这里。</h3><p className="mt-2 text-sm leading-6 text-[#625d54] dark:text-white/50">不预填虚构项目，不把计划写成成果；主网入口和核验材料齐全后才进入合集。</p></div>
              <span className="shrink-0 font-mono text-xs text-[#9b7a48]">WORK #002 · RESERVED</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#111820] text-white">
        <div className="mx-auto grid w-full max-w-[1180px] gap-12 px-5 py-16 lg:grid-cols-[0.78fr_1.22fr] md:py-24">
          <SectionHeading label="Borrow the method" title="仿照 TapeOut，内容上链要学什么" light>TapeOut 白皮书最值得借鉴的不是“永久”这句口号，而是从元件、组合、流片到调用的完整路径。内容发布也需要同样清楚的对象和动作。</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {TAPEOUT_LESSONS.map(([title, copy], index) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <span className="font-mono text-xs text-[#d2ac70]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-6 font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/55">{copy}</p>
              </article>
            ))}
          </div>
          <div className="lg:col-start-2">
            <a href={TAPEOUT_WHITEPAPER} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#e6c17a] underline decoration-[#e6c17a]/40 underline-offset-4">阅读 TapeOut 官方白皮书 ↗</a>
            <p className="mt-3 text-xs leading-6 text-white/35">TapeOut 对 NAND、LATCH、电路 NFT、浏览器画布和链上调用的描述属于项目方说明；本页借用其产品结构，不把内容作品等同于链上电路。</p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d8d0c2] dark:border-white/10">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:py-24">
          <SectionHeading label="Three routes" title="“内容上链”拆成三件事">同一句“上链”可能指完整作品、版本凭证或长期副本。三条路线解决的问题不同，也可以组合使用。</SectionHeading>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PUBLISHING_ROUTES.map(([index, title, value, copy]) => (
              <article key={index} className="rounded-2xl border border-[#d2c5b1] bg-white/40 p-6 dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-center justify-between gap-3"><span className="font-mono text-xs text-[#9b7a48] dark:text-[#d2ac70]">{index}</span><span className="rounded-full bg-black/[0.06] px-3 py-1 font-mono text-[10px] dark:bg-white/[0.06]">{value}</span></div>
                <h3 className="mt-12 font-serif text-2xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#625d54] dark:text-white/55">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#d8d0c2] bg-[#e8e2d6] dark:border-white/10 dark:bg-[#0c1218]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] md:py-24">
          <SectionHeading label="Release contract" title="以后每件作品都按同一格式发布">合集的价值来自一致性。读者不必猜“上链”具体上了什么，也不必从宣传文字里寻找合约和版本。</SectionHeading>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-[#cfc4b2] bg-[#cfc4b2] dark:border-white/10 dark:bg-white/10 sm:grid-cols-2">
            {RELEASE_FIELDS.map(([title, copy], index) => (
              <article key={title} className="bg-[#f7f3eb] p-5 dark:bg-[#111820]">
                <span className="font-mono text-xs text-[#9b7a48]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#625d54] dark:text-white/50">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reader-verification" className="scroll-mt-24 border-b border-[#d8d0c2] dark:border-white/10">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:py-24">
          <SectionHeading label="Content ledger" title="文章凭证，读者现在可以核对">可运行作品之外，公开文章继续使用 2aran Content Ledger。浏览器会重新计算当前正文和元数据哈希；读者无需连接钱包，也可用开源脚本独立核对。</SectionHeading>
          <ReaderTestInvite />
          <div id="live-check" className="mt-8 grid scroll-mt-24 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <ContentFingerprintPrototype />
            <ContentProofCard credential={demoCredential} />
          </div>
          <p className="mt-6 text-xs leading-6 text-[#756e63] dark:text-white/40">核对示例凭证会使用 Merkle Path、链上 Root、chainId 和交易记录；IPFS pinning 与主网发布只由隔离钱包和独立凭据执行。</p>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#171a1d] text-white">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center md:py-24">
          <SectionHeading label="Separate proposal" title="CNT 白皮书保留为独立方案" light>CNT 讨论创作、互动、确权、流通与治理的代币经济。它不等于 TapeKit 作品发布，也不是进入链上作品合集的前提。</SectionHeading>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <p className="font-serif text-2xl font-semibold">内容生态代币经济 · v1.0</p>
            <p className="mt-3 text-sm leading-7 text-white/50">白皮书保留总量、贡献结算、反女巫、销毁、分红和 DAO 的完整设计。主页面只给出清晰入口，不再用代币分配表解释作品为什么上链。</p>
            <Link href={WHITEPAPER_HREF} className="mt-6 inline-flex rounded-full bg-[#e6c17a] px-5 py-3 text-sm font-semibold text-[#171109] no-underline hover:bg-[#f4d89c]">阅读 CNT 白皮书</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d8d0c2] dark:border-white/10">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] md:py-24">
          <SectionHeading label="Boundaries" title="永久记录之前，先保留退出能力">作品上链扩大了可验证性，也同步放大隐私、版权、纠错与撤回成本。</SectionHeading>
          <ul className="grid gap-3">
            {BOUNDARIES.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-xl border border-[#d6cdbf] bg-white/45 px-5 py-4 text-sm leading-7 text-[#514c44] dark:border-white/10 dark:bg-white/[0.025] dark:text-white/55">
                <span className="font-mono text-xs text-[#9b7a48]">{String(index + 1).padStart(2, '0')}</span><span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-[#d8d0c2] bg-[#e8e2d6] dark:border-white/10 dark:bg-[#0c1218]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div><p className="font-serif text-2xl font-semibold">中国象棋是第一件，合集会继续生长。</p><p className="mt-2 text-sm text-[#665f55] dark:text-white/45">每次主网上线后补齐入口、哈希、链上位置和交易，再公开加入合集。</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/tapeout-xiangqi" className="rounded-full bg-[#232b31] px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-[#34414a]">查看首件作品</Link><Link href={DETAIL_HREF} className="rounded-full border border-[#9d835b] px-5 py-3 text-sm font-semibold text-[#5d4523] no-underline hover:bg-white/50 dark:text-[#dbbd86] dark:hover:bg-white/[0.05]">内容存证技术方案</Link></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-16">
        <div id="comments" className="scroll-mt-24 rounded-2xl border border-[#d6cdbf] bg-white/45 px-5 py-6 dark:border-white/10 dark:bg-white/[0.025]">
          <h2 className="font-serif text-2xl font-semibold">作品与核对反馈</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#625d54] dark:text-white/50">可以写下你打开了哪件作品、核对了哪些记录，或希望下一件上链作品解决什么问题。</p>
          <ArticleComments articleKey="resource:onchain-blog" />
        </div>
      </section>
    </main>
  )
}
