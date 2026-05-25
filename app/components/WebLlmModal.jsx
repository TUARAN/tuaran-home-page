import Link from 'next/link'

export default function WebLlmModal() {
  return (
    <Link
      href="/voice-tasks"
      className="web-llm-nav web-llm-float no-underline hover:no-underline"
      aria-label="打开语音记事"
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
        <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </svg>
      <span className="web-llm-nav-label">语音记事</span>
    </Link>
  )
}
