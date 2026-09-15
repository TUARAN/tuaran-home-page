import Link from 'next/link'

import { contentProofHref } from '../../../lib/contentProofRegistry'

const STATUS = {
  signed: { label: '站点签名已验证', dot: 'bg-emerald-500' },
  batched: { label: '批次已验证', dot: 'bg-sky-500' },
  confirmed: { label: '发布记录已验证', dot: 'bg-emerald-500' },
  pending: { label: '等待存证', dot: 'bg-amber-500' },
}

export default function ContentProofCard({ credential, contentKey = '', publishedAt = '', title = '', className = '' }) {
  if (!credential) {
    return (
      <aside className={`flex flex-col gap-3 rounded-xl border border-dashed border-[#c8baa3] bg-[#f8f4eb] px-4 py-3 dark:border-[#344150] dark:bg-[#111820] sm:flex-row sm:items-center sm:justify-between ${className}`} aria-label={`${title || contentKey}的内容凭证`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#403a32] dark:text-[#d9dfe5]">内容凭证·等待生成</p>
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-[#887c6c] dark:text-[#8793a0]">{contentKey}{publishedAt ? ` · ${publishedAt}` : ''}</p>
        </div>
        <Link href="/onchain-blog#reader-verification" className="shrink-0 text-xs font-semibold text-[#66502d] underline decoration-dotted underline-offset-4 dark:text-[#d2ac70]">
          了解验证方式 →
        </Link>
      </aside>
    )
  }
  const status = STATUS[credential.status] || STATUS.pending
  const current = credential.versions.find((item) => item.version === credential.currentVersion) || credential.versions[0]

  return (
    <aside className={`rounded-2xl border border-[#c8baa3] bg-[#fbf8f1] p-5 shadow-[0_12px_34px_rgba(58,45,24,0.08)] dark:border-[#344150] dark:bg-[#121a23] ${className}`} aria-label="内容凭证">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8b7047] dark:text-[#d2ac70]">Content credential</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} aria-hidden="true" />
            <h3 className="font-serif text-xl font-semibold text-[#29251f] dark:text-[#f1ebe1]">{status.label}</h3>
          </div>
        </div>
        <span className="rounded-full border border-[#d4c8b5] px-2.5 py-1 font-mono text-[10px] text-[#6f604b] dark:border-[#3d4a58] dark:text-[#b8c2cd]">v{credential.currentVersion}</span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-[#ded5c6] py-4 text-xs dark:border-[#2d3946]">
        <div><dt className="text-[#8a8175] dark:text-[#8995a2]">发布时间</dt><dd className="mt-1 font-medium text-[#403a32] dark:text-[#d9dfe5]">{new Date(current.publishedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</dd></div>
        <div><dt className="text-[#8a8175] dark:text-[#8995a2]">记录网络</dt><dd className="mt-1 font-medium text-[#403a32] dark:text-[#d9dfe5]">{credential.network.name} · {credential.network.chainId}</dd></div>
      </dl>
      <p className="mt-4 text-xs leading-6 text-[#6b6358] dark:text-[#a8b0ba]">
        验证只读取公开记录并在浏览器本地计算，无需连接钱包。
      </p>
      <Link href={contentProofHref(credential.contentKey)} className="mt-4 inline-flex rounded-full bg-[#2f4b3a] px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[#203a2a] dark:bg-[#d5b475] dark:text-[#171109] dark:hover:bg-[#e6c98f]">
        查看验证过程 →
      </Link>
    </aside>
  )
}
