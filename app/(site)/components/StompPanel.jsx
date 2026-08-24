'use client'

import { IconArrowUp, IconBrandGithub } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { useSessionAccount } from './SessionProvider'
import UserAvatar from './UserAvatar'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE' }
  }
}

const ERROR_MESSAGES = {
  UNAUTHORIZED: '登录状态已失效，请重新登录。',
  EMPTY_MESSAGE: '写点内容再发布。',
  MESSAGE_TOO_LONG: '留言不能超过 280 字。',
  RATE_LIMITED: '发布得有点快，稍后再试。',
  INTERNAL_SERVER_ERROR: '暂时没有发布成功，请稍后重试。',
}

export default function StompPanel({ onPublished }) {
  const { user, loading: userLoading } = useSessionAccount()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const remaining = useMemo(() => 280 - message.length, [message])

  function login() {
    const returnTo = `${window.location.pathname}#community-feed-title`
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
  }

  async function submit(event) {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/stomp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setMessage('')
      onPublished?.(data?.item)
    } catch (cause) {
      setError(ERROR_MESSAGES[cause?.message] || '暂时没有发布成功，请稍后重试。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="community-composer" aria-labelledby="community-composer-title">
      <div className="community-composer-head">
        <div>
          <p className="community-kicker">SAY HELLO</p>
          <h3 id="community-composer-title">留下想法</h3>
        </div>
        {user ? <UserAvatar user={user} size="sm" /> : null}
      </div>

      {user ? (
        <form onSubmit={submit}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            maxLength={280}
            placeholder="分享近况、问题或合作想法…"
            aria-label="圈子留言"
          />
          <div className="community-composer-foot">
            <span>{remaining}</span>
            <button type="submit" disabled={submitting || !message.trim()}>
              {submitting ? '发布中…' : '发布'} <IconArrowUp size={15} aria-hidden="true" />
            </button>
          </div>
        </form>
      ) : (
        <div className="community-login-prompt">
          <p>登录后，可以在圈子里公开留言。</p>
          <button type="button" onClick={login} disabled={userLoading}>
            <IconBrandGithub size={17} aria-hidden="true" />
            {userLoading ? '正在检查…' : '使用 GitHub 登录'}
          </button>
        </div>
      )}

      {error ? <p className="community-composer-error" role="alert">{error}</p> : null}
    </section>
  )
}
