'use client'

import { useEffect, useState } from 'react'

import { hashContent, verifyContentProof } from '../../../lib/contentProof'

const ORIGINAL_BODY = '第一行\r\n第二行  \r\n'
const ENTRY = {
  author: 'TUARAN',
  body: ORIGINAL_BODY,
  contentKey: 'research:topics:content-proof-demo',
  date: '2026-09-14',
  language: 'zh-CN',
  summary: '同一份内容在 Node 与浏览器中得到相同指纹。',
  tags: ['内容存证', 'SHA-256'],
  title: '可验证内容示例',
  version: 1,
}

export default function ContentFingerprintPrototype() {
  const [body, setBody] = useState(ORIGINAL_BODY)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/proofs/content-proof-demo-v1.json').then((response) => response.json()),
      fetch('/.well-known/content-proof-key.json').then((response) => response.json()),
    ]).then(async ([proof, publicKey]) => {
      const entry = { ...ENTRY, body }
      const verification = await verifyContentProof(entry, proof, publicKey)
      const localHash = await hashContent(entry)
      if (!cancelled) setResult({ ...verification, localHash, proof })
    }).catch((caught) => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : '验证器加载失败')
    })
    return () => { cancelled = true }
  }, [body])

  const status = result?.valid ? '内容完整性已验证' : result ? '当前内容与凭证不一致' : '正在本地计算…'

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a6b3e] dark:text-[#d2ac70]">Live check</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">在浏览器里改一个字，立即重新验证</h2>
        <p className="mt-3 text-sm leading-7 text-[#625d54] dark:text-[#b7b0a5]">
          当前页面直接使用 Web Crypto 计算规范化正文的 SHA-256，并用公开 P-256 公钥核对 proof JSON 的站点签名。计算过程不上传正文，也不需要钱包。
        </p>
        <div className={`mt-5 w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${result?.valid ? 'bg-[#dce5d6] text-[#31542d] dark:bg-[#1f3827] dark:text-[#a7d29f]' : 'bg-[#f0dfd8] text-[#8b3d2f] dark:bg-[#402620] dark:text-[#efb1a4]'}`}>
          {error || status}
        </div>
      </div>

      <div className="rounded-xl border border-[#d6cdbf] bg-[#faf8f2] p-5 dark:border-[#293441] dark:bg-[#121a23]">
        <label htmlFor="proof-demo-body" className="text-sm font-semibold">示例正文</label>
        <textarea
          id="proof-demo-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-2 min-h-28 w-full resize-y rounded-lg border border-[#cfc5b6] bg-white px-3 py-2 font-mono text-sm leading-6 text-[#292620] outline-none focus:border-[#8a6b3e] dark:border-[#34404d] dark:bg-[#0d141c] dark:text-[#eee9df]"
        />
        <div className="mt-4 space-y-3 font-mono text-[11px] leading-5 text-[#696157] dark:text-[#aeb7c2]">
          <p><span className="block text-[#947446] dark:text-[#d2ac70]">浏览器计算 SHA-256</span><span className="break-all">{result?.localHash || '—'}</span></p>
          <p><span className="block text-[#947446] dark:text-[#d2ac70]">proof JSON SHA-256</span><span className="break-all">{result?.proof.contentHash.value || '—'}</span></p>
          <div className="flex flex-wrap gap-2 pt-1 font-sans text-xs">
            <span>{result?.contentHashMatches ? '✓ 内容哈希' : '× 内容哈希'}</span>
            <span>{result?.proofIdMatches ? '✓ Proof ID' : '× Proof ID'}</span>
            <span>{result?.signatureValid ? '✓ 站点签名' : '× 站点签名'}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
          <button type="button" onClick={() => setBody(ORIGINAL_BODY)} className="rounded-full border border-[#9d835b] px-3 py-1.5 text-[#654c29] dark:text-[#dbbd86]">恢复原文</button>
          <a href="/proofs/content-proof-demo-v1.json" className="rounded-full border border-[#9d835b] px-3 py-1.5 text-[#654c29] no-underline dark:text-[#dbbd86]">查看 proof JSON</a>
          <a href="/.well-known/content-proof-key.json" className="rounded-full border border-[#9d835b] px-3 py-1.5 text-[#654c29] no-underline dark:text-[#dbbd86]">查看站点公钥</a>
        </div>
      </div>
    </div>
  )
}
