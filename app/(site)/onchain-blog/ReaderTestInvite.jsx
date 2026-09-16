import { CONTENT_PROOF_CLAIMS } from '../../../lib/contentProofClaims'

const GITHUB_VERIFIER = 'https://github.com/TUARAN/tuaran-home-page/tree/main/tools/content-proof-verifier'

export default function ReaderTestInvite() {
  return (
    <section id="open-verifier" className="scroll-mt-24 border-y border-[#d8d0c2] bg-[#faf8f2] dark:border-[#2a313b] dark:bg-[#121a23]">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start md:py-20">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a6b3e] dark:text-[#d2ac70]">Open verifier</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#26231e] dark:text-[#f2ede4]">邀请核对这份示例凭证</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#625d54] dark:text-[#b7b0a5]">
            用浏览器或本地脚本走一遍同一组检查。通过后，你应能说出验证了哪几项、跳过了哪几项。留言时请写清结果，无需连接钱包。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/proofs/research:topics:content-proof-demo" className="rounded-full bg-[#2f4b3a] px-4 py-2.5 text-sm font-semibold text-white no-underline dark:bg-[#d5b475] dark:text-[#171109]">打开示例凭证</a>
            <a href={GITHUB_VERIFIER} className="rounded-full border border-[#9d835b] px-4 py-2.5 text-sm font-semibold text-[#654c29] no-underline dark:text-[#dbbd86]">离线验证器</a>
            <a href="/verify.txt" className="rounded-full border border-[#9d835b] px-4 py-2.5 text-sm font-semibold text-[#654c29] no-underline dark:text-[#dbbd86]">Agent 说明</a>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-[#d6cdbf] bg-white/70 p-5 dark:border-[#293441] dark:bg-[#0f161e]">
            <h3 className="font-serif text-xl font-semibold">通过时核对到了</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-[#625d54] dark:text-[#aaa49a]">
              {CONTENT_PROOF_CLAIMS.verifies.map((claim) => (
                <li key={claim.id}>
                  <strong className="block text-[#403a32] dark:text-[#e6dfd3]">{claim.label}</strong>
                  {claim.detail}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-xl border border-[#d6cdbf] bg-white/70 p-5 dark:border-[#293441] dark:bg-[#0f161e]">
            <h3 className="font-serif text-xl font-semibold">通过时仍未证明</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-[#625d54] dark:text-[#aaa49a]">
              {CONTENT_PROOF_CLAIMS.doesNotVerify.map((claim) => (
                <li key={claim.id}>
                  <strong className="block text-[#403a32] dark:text-[#e6dfd3]">{claim.label}</strong>
                  {claim.detail}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
