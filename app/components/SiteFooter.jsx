import Link from 'next/link'

const footerLinks = [
  { href: '/about', label: '关于我' },
  { href: '/services', label: '商务合作' },
  { href: '/messages', label: '留言板' },
  { href: '/rss.xml', label: 'RSS', external: true },
  { href: '/donate', label: 'Buy Me a Coffee' },
  { href: '/traffic', label: '流量统计' },
]

export default function SiteFooter({ className = '' }) {
  return (
    <footer
      className={[
        'border-t border-[#e8dfd0] pt-4 text-xs text-[#999] dark:border-gray-800',
        className,
      ].join(' ')}
    >
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
        <span>© 2025—2026 网络日志</span>
        {footerLinks.map((link) => (
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
          className="inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
          title="GitHub Actions 构建状态：点击查看最近一次 lint+build 是否通过"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://github.com/TUARAN/tuaran-home-page/actions/workflows/ci.yml/badge.svg?branch=main"
            alt="CI status"
            width={92}
            height={20}
            loading="lazy"
            decoding="async"
          />
        </a>
      </p>
    </footer>
  )
}
