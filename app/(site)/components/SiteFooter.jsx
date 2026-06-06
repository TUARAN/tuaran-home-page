'use client'

import Link from 'next/link'

import { useSessionAccount } from './SessionProvider'
import { getFooterLinks } from '../../../lib/siteNav'

export default function SiteFooter({ className = '' }) {
  const account = useSessionAccount()
  const links = getFooterLinks(account, account?.navOverrides)

  return (
    <footer
      className={[
        'border-t border-[#e8dfd0] pt-4 text-xs text-[#999] dark:border-gray-800',
        className,
      ].join(' ')}
    >
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
        <span>© 2025—2026 网络日志</span>
        {links.map((link) => (
          <span key={link.href} className="contents">
            <span className="text-[#ddd] dark:text-gray-700" aria-hidden="true">
              ·
            </span>
            {link.external ? (
              <a
                href={link.href}
                className="opacity-80 transition-colors hover:text-[#666] hover:opacity-100 dark:hover:text-gray-300"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="opacity-80 transition-colors hover:text-[#666] hover:opacity-100 dark:hover:text-gray-300"
              >
                {link.label}
              </Link>
            )}
          </span>
        ))}
        <span className="text-[#ddd] dark:text-gray-700" aria-hidden="true">
          ·
        </span>
        <a
          href="https://github.com/TUARAN/tuaran-home-page/actions/workflows/ci.yml"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded border border-[#ddd3c2] px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#6f6557] opacity-80 transition-opacity hover:opacity-100 dark:border-gray-700 dark:text-gray-300"
          title="GitHub Actions 构建状态：点击查看最近一次 lint+build 是否通过"
        >
          CI Status
        </a>
      </p>
    </footer>
  )
}
