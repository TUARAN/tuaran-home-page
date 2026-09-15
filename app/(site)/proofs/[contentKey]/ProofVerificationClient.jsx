'use client'

import { useEffect, useState } from 'react'

import { hashContent, verifyContentProof } from '../../../../lib/contentProof'
import { verifyMerkleMembership } from '../../../../lib/contentMerkle'
import { describeProofStatus, shortDigest } from '../../../../lib/contentProofPresentation'

const STATUS_STYLE = {
  error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200',
  loading: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  signed: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
}

function CheckRow({ done, pending, title, copy, value }) {
  const mark = pending ? '…' : done ? '✓' : '×'
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-3 border-b border-[#ddd5c8] py-5 last:border-0 dark:border-[#2c3744]">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-bold ${pending ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : done ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>{mark}</span>
      <div><h3 className="font-serif text-lg font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#6a6359] dark:text-[#aeb6c0]">{copy}</p>{value ? <code className="mt-2 block break-all text-[11px] leading-5 text-[#806842] dark:text-[#d2ac70]">{value}</code> : null}</div>
    </li>
  )
}

export default function ProofVerificationClient({ credential }) {
  const [state, setState] = useState({ batch: null, error: '', localHash: '', proof: null, verification: null })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(credential.proofUrl).then((response) => {
        if (!response.ok) throw new Error(`Proof HTTP ${response.status}`)
        return response.json()
      }),
      fetch(credential.publicKeyUrl).then((response) => {
        if (!response.ok) throw new Error(`Public key HTTP ${response.status}`)
        return response.json()
      }),
      credential.batchUrl ? fetch(credential.batchUrl).then((response) => {
        if (!response.ok) throw new Error(`Batch HTTP ${response.status}`)
        return response.json()
      }) : null,
    ]).then(async ([proof, publicKey, batchRecord]) => {
      const [verification, localHash] = await Promise.all([
        verifyContentProof(credential.entry, proof, publicKey),
        hashContent(credential.entry),
      ])
      const member = batchRecord?.members?.find((item) => item.proofId === proof.proofId) || null
      const membershipValid = member ? await verifyMerkleMembership(member, batchRecord.merkleRoot) : false
      const batch = batchRecord ? { ...batchRecord, membershipValid } : null
      if (!cancelled) setState({ batch, error: '', localHash, proof, verification })
    }).catch((error) => {
      if (!cancelled) setState((current) => ({ ...current, error: error instanceof Error ? error.message : '验证器加载失败' }))
    })
    return () => { cancelled = true }
  }, [credential])

  const summary = state.error
    ? { level: 'error', label: '验证器加载失败', detail: state.error }
    : describeProofStatus({ proof: state.proof, verification: state.verification, batch: state.batch })
  const statusStyle = STATUS_STYLE[summary.level] || STATUS_STYLE.signed

  return (
    <>
      <section className={`rounded-2xl border p-5 sm:p-7 ${statusStyle}`} aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">Local verification result</p><h2 className="mt-2 font-serif text-2xl font-semibold">{summary.label}</h2><p className="mt-2 max-w-2xl text-sm leading-7 opacity-80">{summary.detail}</p></div>
          <span className="rounded-full border border-current/25 px-3 py-1 text-xs font-semibold">无需钱包</span>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-2xl border border-[#d5ccbd] bg-[#fbf9f4] p-5 dark:border-[#2f3b48] dark:bg-[#121a23] sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#876d44] dark:text-[#d2ac70]">Verification process</p>
          <ol className="mt-3">
            <CheckRow done={state.verification?.contentHashMatches} pending={!state.verification} title="1. 重算当前内容指纹" copy="使用规范化后的 UTF-8 内容在当前浏览器中计算 SHA-256。" value={state.localHash} />
            <CheckRow done={state.verification?.proofIdMatches} pending={!state.verification} title="2. 核对 Proof ID" copy="重算未签名凭证载荷，确认凭证本身没有被改写。" value={state.proof?.proofId} />
            <CheckRow done={state.verification?.signatureValid} pending={!state.verification} title="3. 验证站点签名" copy="用 2aran.com 公开的 P-256 公钥验证发布身份。" value={state.proof?.siteSignature?.keyId} />
            <CheckRow done={state.batch?.membershipValid && state.batch?.anchor?.chainId === credential.network.chainId && Boolean(state.batch?.anchor?.transactionHash)} pending={!state.batch} title="4. 核对 Merkle 批次与链上记录" copy="使用逐篇 Merkle Path 重算 Root，再核对 chainId、EAS attestation 与 Base Sepolia 交易。" value={state.batch?.merkleRoot} />
          </ol>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#d5ccbd] bg-[#eee7da] p-5 dark:border-[#2f3b48] dark:bg-[#171f29]">
            <p className="text-xs text-[#766b5c] dark:text-[#98a4b1]">内容指纹</p><code className="mt-2 block break-all text-xs leading-6 text-[#4c4030] dark:text-[#e1c58f]">{shortDigest(state.localHash, 14, 12)}</code>
            <p className="mt-4 text-xs text-[#766b5c] dark:text-[#98a4b1]">凭证版本</p><p className="mt-1 font-semibold">v{credential.currentVersion}</p>
          </div>
          <div className="rounded-2xl border border-[#d5ccbd] bg-[#fbf9f4] p-5 dark:border-[#2f3b48] dark:bg-[#121a23]">
            <p className="font-semibold">{credential.network.name}</p><p className="mt-1 text-xs text-[#766b5c] dark:text-[#98a4b1]">chainId {credential.network.chainId}{state.batch?.anchor?.transactionHash ? ` · ${shortDigest(state.batch.anchor.transactionHash)}` : ' · 交易待发布'}</p>
            <a href={state.batch?.anchor?.explorerUrl || credential.network.explorerUrl} target="_blank" rel="noreferrer" className="no-external-arrow mt-4 inline-flex text-sm font-semibold text-[#66502d] underline underline-offset-4 dark:text-[#d2ac70]">打开区块浏览器 ↗</a>
          </div>
          <a href={credential.proofUrl} className="block rounded-full border border-[#9d835b] px-4 py-2.5 text-center text-sm font-semibold text-[#654c29] no-underline dark:text-[#dbbd86]">查看 proof JSON</a>
        </aside>
      </section>
    </>
  )
}
