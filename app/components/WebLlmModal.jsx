import Link from 'next/link'

export default function WebLlmModal() {
  return (
    <Link
      href="/web-llm"
      className="web-llm-nav web-llm-float no-underline hover:no-underline"
      aria-label="打开大模型问答页面"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="web-llm-nav-icon shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v2.2" />
        <path d="M8.2 8.2h7.6a2.8 2.8 0 0 1 2.8 2.8v4.6a2.8 2.8 0 0 1-2.8 2.8H8.2a2.8 2.8 0 0 1-2.8-2.8V11a2.8 2.8 0 0 1 2.8-2.8Z" />
        <path d="M9.5 12.7h.01" />
        <path d="M14.5 12.7h.01" />
        <path d="M9 16h6" />
        <path d="M7 8.7 5.4 7.5" />
        <path d="M17 8.7l1.6-1.2" />
      </svg>
      <span className="web-llm-nav-label">大模型问答</span>
    </Link>
  )
}
