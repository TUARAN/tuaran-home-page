'use client'

import { useEffect, useState } from 'react'

const ORDER = ['postNormalPrompt', 'postPremiumPrompt', 'postXPrompt']

function excerpt(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

export default function PromptVoteLedger() {
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/community-actions/prompt-votes')
      .then((response) => response.json())
      .then((body) => {
        if (!cancelled) setPayload(body && body.ok ? body : { ok: false })
      })
      .catch(() => {
        if (!cancelled) setPayload({ ok: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!payload) {
    return <p className="m-0 text-[13px] leading-6 text-[var(--site-muted)]">正在读取已发帖的赞和踩。</p>
  }
  if (!payload.ok) {
    return <p className="m-0 text-[13px] leading-6 text-[var(--site-muted)]">赞和踩暂时读不出来。修改记录仍在下面。</p>
  }

  const groups = payload.groups || {}
  return (
    <div className="grid gap-3">
      {ORDER.map((key) => {
        const group = groups[key] || { label: key, good: 0, bad: 0, items: [] }
        return (
          <section key={key} className="rounded-xl border border-[var(--site-line)] px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-[14px] text-[var(--site-ink)]">{group.label}</strong>
              <span className="text-[12px] text-[var(--site-muted)]">赞 {group.good || 0} · 踩 {group.bad || 0}</span>
            </div>
            {group.items?.length ? (
              <ul className="m-0 mt-2 grid list-none gap-2 p-0">
                {group.items.map((item) => (
                  <li key={`${item.updatedAt}-${item.content}`} className="text-[13px] leading-6 text-[var(--site-ink)]">
                    <span className="mr-2 text-[var(--site-muted)]">{item.kind === 'bad' ? '踩' : '赞'}</span>
                    {excerpt(item.content)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 mt-2 text-[13px] leading-6 text-[var(--site-muted)]">还没有记录。</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
