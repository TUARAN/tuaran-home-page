'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'

import {
  CONTACT_PAGE_PATH,
  contactDetail,
  contactLabel,
  getContactChannel,
  listContactChannels,
} from '../../../lib/site/contactChannels'
import { pick } from '../../../lib/site/i18n'
import { useLocale } from './LocaleProvider'

function CopyWechatButton({ wechatId }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(wechatId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 font-mono text-[12px] text-[var(--site-ink)] transition hover:border-[var(--site-line-strong)]"
      aria-label={`复制微信号 ${wechatId}`}
    >
      <span>{wechatId}</span>
      <span className="rounded-full bg-[var(--site-ink)] px-2 py-0.5 text-[11px] font-semibold text-[var(--page-bg)]">
        {copied ? '已复制' : '复制'}
      </span>
    </button>
  )
}

function ChannelCard({ channel, locale }) {
  const body = (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">
        {contactLabel(channel, locale)}
      </p>
      <p className="mt-1 break-all font-mono text-[14px] font-semibold text-[var(--site-ink)]">{channel.value}</p>
      <p className="mt-1 text-[13px] leading-6 text-[var(--site-muted)]">{contactDetail(channel, locale)}</p>
    </>
  )
  const className = 'block rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 no-underline transition hover:border-[var(--site-line-strong)]'

  if (!channel.href) return <article className={className}>{body}</article>

  return (
    <a
      href={channel.href}
      className={className}
      {...(channel.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {body}
    </a>
  )
}

export function ContactCards({ showPageLink = false }) {
  const { locale } = useLocale()
  const wechat = getContactChannel('wechat')
  const directs = listContactChannels('direct').filter((item) => item.id !== 'wechat')
  const socials = listContactChannels('social')

  return (
    <div className="space-y-4">
      <article className="grid items-center gap-4 rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_92%,transparent)] p-4 sm:grid-cols-[minmax(0,1fr)_168px] sm:p-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-faint)]">
            {pick(locale, '优先', 'Start here')}
          </p>
          <h2 className="mt-1 text-[22px] font-semibold leading-8 text-[var(--site-ink)]">
            {contactLabel(wechat, locale)}
            {' '}
            <span className="font-mono">{wechat.value}</span>
          </h2>
          <p className="mt-2 text-[14px] leading-7 text-[var(--site-muted)]">{contactDetail(wechat, locale)}</p>
          <div className="mt-3">
            <CopyWechatButton wechatId={wechat.value} />
          </div>
        </div>
        <Image
          src={wechat.qr}
          alt={wechat.qrAlt}
          width={168}
          height={168}
          unoptimized
          className="mx-auto h-[168px] w-[168px] rounded-xl border border-[var(--site-line)] bg-white object-contain p-1.5"
        />
      </article>

      <div className="grid gap-3 sm:grid-cols-2">
        {directs.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} locale={locale} />
        ))}
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">
          {pick(locale, '其他平台', 'Other profiles')}
        </p>
        <div className="flex flex-wrap gap-2">
          {socials.map((channel) => (
            <a
              key={channel.id}
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 text-[13px] font-medium text-[var(--site-ink)] no-underline transition hover:border-[var(--site-line-strong)]"
            >
              {contactLabel(channel, locale)}
            </a>
          ))}
        </div>
      </div>

      {showPageLink ? (
        <p className="text-[13px] leading-6 text-[var(--site-muted)]">
          <Link href={CONTACT_PAGE_PATH} className="font-semibold text-[var(--site-ink)] underline-offset-4 hover:underline">
            {pick(locale, '打开联系页', 'Open the contact page')}
          </Link>
        </p>
      ) : null}
    </div>
  )
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'

export function ContactDialogButton({ className = '', children, label }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const closeRef = useRef(null)
  const panelRef = useRef(null)
  const { locale } = useLocale()

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const panel = panelRef.current
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll(FOCUSABLE)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className={`cursor-pointer font-[inherit] ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {children ?? label}
      </button>
      {open ? createPortal(
        <div
          className="fixed inset-0 z-[140] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[min(92vh,820px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:max-w-xl sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--site-line)] px-4 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">Contact</p>
                <h2 id={titleId} className="mt-0.5 text-[18px] font-semibold text-[var(--site-ink)]">
                  {pick(locale, '联系', 'Contact')}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-line)] text-[18px] text-[var(--site-ink)]"
                aria-label={pick(locale, '关闭', 'Close')}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="overflow-y-auto px-4 py-4">
              <ContactCards showPageLink />
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  )
}
