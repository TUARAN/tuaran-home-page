import Link from 'next/link'

import ContentProofCard from '../components/ContentProofCard'
import { getContentProofCredential } from '../../../lib/contentProofRegistry'
import ContentFingerprintPrototype from './ContentFingerprintPrototype'

const DETAIL_HREF = '/articles/research/topics/2aran-onchain-content-site'

export const dynamic = 'force-static'

export const metadata = {
  title: '万物上链｜2aran Content Ledger',
  description: '所有内容生产都应该有价值：让知识、作品与创造拥有可确权、可验证、可流通的数字凭证。',
  alternates: { canonical: '/onchain-blog' },
  openGraph: {
    title: '万物上链｜2aran Content Ledger',
    description: '让知识、作品与创造拥有可确权、可验证、可流通的数字凭证。',
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
  ['读取副本', '2aran.com 暂时不可用时，从 IPFS 或长期归档入口读取经过同一哈希验证的公开副本。'],
]

const ROADMAP = [
  {
    range: '现在',
    title: '方案与边界',
    status: '已完成',
    active: true,
    copy: '内容对象、证明格式、链上边界、隐私排除项与 90 天实施路线均已明确。',
  },
  {
    range: '第 1—2 周',
    title: '内容指纹原型',
    status: '已完成',
    active: true,
    copy: '完成规范化、SHA-256、站点签名和 proof JSON，保证 Node 与浏览器计算结果一致。',
  },
  {
    range: '第 3—4 周',
    title: '测试网批次存证',
    status: '工程就绪',
    active: true,
    copy: 'Merkle 批次、逐篇 Path、D1 证明索引与首笔 Base Sepolia EAS 存证已完成。',
  },
  {
    range: '第 5—6 周',
    title: '读者验证界面',
    status: '已完成',
    active: true,
    copy: '文章凭证卡、本地验证过程、版本时间线和区块浏览器入口已上线，全程无需钱包。',
  },
  {
    range: '第 7—10 周',
    title: '副本与主网小批量',
    status: '工程就绪',
    active: true,
    copy: 'IPFS pinning、双网关回读、发布钱包隔离、失败重试、幂等和主网成本记录已接入；活 pinning 与主网交易仍由隔离钱包和 Pinata 凭据执行。',
  },
  {
    range: '第 11—12 周',
    title: '开放验证器',
    status: '待实施',
    copy: '邀请读者测试，发布 Agent 可读说明，并开源一个可脱离 2aran.com 使用的验证器。',
  },
]

const BOUNDARIES = [
  '不发币，不做 NFT、DAO 或收益承诺。',
  '不要求普通读者连接钱包，钱包只服务于发布流程。',
  '评论、账号、燃币、草稿、后台和私密内容继续留在 D1 / R2。',
  '个人信息、客户资料、版权不明素材和可能需要删除的内容不进入永久存储。',
  '“已验证”只证明版本、时间和完整性，不证明文章观点或事实天然正确。',
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
    <main className="min-h-screen bg-[#f3f0e8] text-[#292620] dark:bg-[#0d1117] dark:text-[#eee9df]">
      <section
        className="relative isolate min-h-[680px] overflow-hidden border-b border-[#55452d] bg-[#05080c] text-white"
        style={{ backgroundImage: "url('/images/onchain-blog/everything-onchain-hero.webp')", backgroundPosition: 'center', backgroundSize: 'cover' }}
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,6,9,0.97)_0%,rgba(3,6,9,0.9)_35%,rgba(3,6,9,0.48)_64%,rgba(3,6,9,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-52 bg-gradient-to-t from-[#05080c] to-transparent" />
        <div className="mx-auto flex min-h-[680px] w-full max-w-[1180px] flex-col px-5 py-10 md:py-14">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <Link href="/" className="no-underline hover:text-white">TUARAN</Link>
            <span>/</span>
            <span>CONTENT LEDGER</span>
          </div>

          <div className="mt-auto pb-6 pt-24">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#d9b66c]/55 bg-black/35 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f0cd88] backdrop-blur-sm">
                  MERKLE BATCH READY · BASE SEPOLIA
                </span>
                <span className="font-mono text-[11px] tracking-[0.16em] text-white/50">2ARAN CONTENT LEDGER</span>
              </div>
              <h1 className="mt-7 font-serif text-[60px] font-semibold leading-[0.94] tracking-[-0.045em] text-white drop-shadow-2xl md:text-[92px]">
                万物上链
              </h1>
              <p className="mt-7 max-w-3xl font-serif text-2xl font-semibold leading-snug text-[#f2d59a] md:text-4xl">
                所有内容生产，都应该有价值。
              </p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/[0.72] md:text-lg">
                让文字、影像、代码与每一次创造拥有可确权、可验证、可流通的数字凭证。
                原创由此形成时间、版本、归属与价值的公共坐标，进入人与 AI 共同参与的新内容网络。
              </p>
            </div>

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

      <section id="reader-verification" className="scroll-mt-24 border-y border-[#d8d0c2] bg-[#eae4d8] dark:border-[#2a313b] dark:bg-[#101720]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start md:py-20">
          <SectionHeading label="Reader Experience" title="读者最终能做什么">
            验证过程应直接、可解释、无需钱包，并允许外部工具独立完成复核。
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

      <section className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
        <SectionHeading label="Implementation" title="90 天实施路线">
          方案与边界定义已经完成；每项工程能力通过对应验收条件后才进入上线状态。
        </SectionHeading>
        <div className="mt-8 overflow-hidden rounded-xl border border-[#d6cdbf] bg-[#faf8f2] dark:border-[#293441] dark:bg-[#121a23]">
          {ROADMAP.map((item, index) => (
            <article key={item.range} className="grid gap-3 border-b border-[#ded6ca] p-5 last:border-b-0 dark:border-[#293441] md:grid-cols-[110px_180px_1fr_86px] md:items-center">
              <p className="font-mono text-[11px] tracking-[0.08em] text-[#85755d] dark:text-[#b59969]">{item.range}</p>
              <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
              <p className="text-sm leading-6 text-[#625d54] dark:text-[#aaa49a]">{item.copy}</p>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${item.active ? 'bg-[#dce5d6] text-[#3d6036] dark:bg-[#1f3827] dark:text-[#a7d29f]' : 'bg-[#eee8dd] text-[#7b7060] dark:bg-[#242b34] dark:text-[#9ca6b2]'}`}>
                {item.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d8d0c2] bg-[#eae4d8] dark:border-[#2a313b] dark:bg-[#101720]">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <ContentFingerprintPrototype />
            <ContentProofCard credential={demoCredential} />
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8d0c2] bg-[#292722] text-[#f4eee4] dark:border-[#323b47] dark:bg-[#090d12]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] md:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#cdb17c]">Proposed Contract</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">工程落点</h2>
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

      <section className="border-t border-[#d8d0c2] bg-[#eae4d8] dark:border-[#2a313b] dark:bg-[#101720]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div>
            <p className="font-serif text-2xl font-semibold">详细技术方案包含技术选择、数据结构、验收条件与风险说明。</p>
            <p className="mt-2 text-sm text-[#665f55] dark:text-[#aaa49a]">更新日期：2026-09-16 · 当前状态：读者验证、IPFS 副本流水线与主网小批量发布控制已就绪。</p>
          </div>
          <Link href={DETAIL_HREF} className="shrink-0 rounded-full border border-[#9d835b] px-5 py-3 text-sm font-semibold text-[#5d4523] no-underline hover:bg-[#f8f3e9] dark:border-[#8d774f] dark:text-[#dbbd86] dark:hover:bg-white/[0.05]">
            打开完整计划与实现细节 →
          </Link>
        </div>
      </section>
    </main>
  )
}
