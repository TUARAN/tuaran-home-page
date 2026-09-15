import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getContentProofCredential, listContentProofCredentials } from '../../../../lib/contentProofRegistry'
import { isOlderVersion, shortDigest } from '../../../../lib/contentProofPresentation'
import ProofVerificationClient from './ProofVerificationClient'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return listContentProofCredentials().map((credential) => ({ contentKey: credential.contentKey }))
}
export async function generateMetadata({ params }) {
  const { contentKey } = await params
  const credential = getContentProofCredential(contentKey)
  if (!credential) return { title: '内容凭证未找到', robots: { index: false, follow: false } }
  return {
    title: `${credential.title}｜内容凭证`,
    description: `在浏览器本地验证 ${credential.title} 的内容指纹、发布签名与版本记录。`,
  }
}

export default async function ContentProofPage({ params }) {
  const { contentKey } = await params
  const credential = getContentProofCredential(contentKey)
  if (!credential) notFound()

  return (
    <main className="min-h-screen bg-[#f3f0e8] text-[#292620] dark:bg-[#0d1117] dark:text-[#eee9df]">
      <header className="border-b border-[#d8d0c2] bg-[#171a1d] text-[#f4eee4] dark:border-[#2a313b]">
        <div className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/50"><Link href="/onchain-blog" className="no-underline hover:text-white">2aran Content Ledger</Link><span>/</span><span>内容凭证</span></div>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.22em] text-[#d2ac70]">Reader verification</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">{credential.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">页面会在当前浏览器中完成核对，内容不会上传，也不会请求连接钱包或签名。</p>
          <code className="mt-5 block break-all text-[11px] text-white/40">{credential.contentKey}</code>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:py-14">
        <ProofVerificationClient credential={credential} />

        <section className="mt-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#876d44] dark:text-[#d2ac70]">Version timeline</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">版本时间线</h2>
          <div className="mt-6 border-l border-[#b9a98e] pl-6 dark:border-[#4a5663]">
            {[...credential.versions].reverse().map((version) => {
              const older = isOlderVersion(version.version, credential.currentVersion)
              return (
                <article key={version.version} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[#f3f0e8] bg-[#698269] ring-1 ring-[#698269] dark:border-[#0d1117]" />
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl font-semibold">v{version.version}</h3><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${older ? 'bg-[#e7e0d5] text-[#766b5c] dark:bg-[#242d37] dark:text-[#aab3bd]' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>{older ? '历史版本' : '当前版本'}</span></div>
                  <time className="mt-1 block text-xs text-[#81786c] dark:text-[#939eaa]" dateTime={version.publishedAt}>{new Date(version.publishedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</time>
                  <p className="mt-2 text-sm leading-6 text-[#625b51] dark:text-[#aeb6c0]">{version.note}</p>
                  <a href={version.proofUrl} className="mt-2 inline-block font-mono text-[11px] text-[#755b34] underline underline-offset-4 dark:text-[#d2ac70]">proof {shortDigest(version.proofUrl, 24, 10)}</a>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[#d5ccbd] bg-[#e9e1d3] p-6 dark:border-[#2f3b48] dark:bg-[#131b24]">
          <h2 className="font-serif text-2xl font-semibold">验证的边界</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#625b51] dark:text-[#aeb6c0]">通过表明这份内容与 TUARAN 发布的对应版本一致，且后续更改可被发现。它不代表文章中的观点、数字或引用已被区块链证明为真。</p>
        </section>
      </div>
    </main>
  )
}
