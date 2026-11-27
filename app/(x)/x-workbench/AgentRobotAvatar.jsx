// 首页账号卡机器人头像：按 handle 选定造型，五个账号各有独立配色与头盔元素，
// 参考 Grokbot 的机器感。未识别的账号用灰壳兜底。全部内联 SVG，不引图片资产。

const BLUE_MINER = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#dbeafe" />
    <rect x="22.6" y="4" width="2.8" height="6" rx="1.2" fill="#1d4ed8" />
    <circle cx="24" cy="3.6" r="2.6" fill="#1d4ed8" />
    <path d="M10 23a14 14 0 0 1 28 0v3H10z" fill="#2563eb" />
    <rect x="19.5" y="16" width="9" height="5" rx="2" fill="#fef9c3" />
    <rect x="12" y="24" width="24" height="14" rx="6" fill="#eff6ff" />
    <rect x="16.5" y="28" width="5.5" height="5.5" rx="1.8" fill="#1e3a8a" />
    <rect x="26" y="28" width="5.5" height="5.5" rx="1.8" fill="#1e3a8a" />
    <rect x="20" y="34.5" width="8" height="2.2" rx="1.1" fill="#1d4ed8" />
  </svg>
)

const AMBER_CAPTAIN = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#fef3c7" />
    <path d="M12 19a12 12 0 0 1 24 0v1H12z" fill="#d97706" />
    <rect x="7" y="19.5" width="34" height="4" rx="2" fill="#92400e" />
    <circle cx="24" cy="13" r="3.2" fill="#fef3c7" stroke="#92400e" strokeWidth="1.4" />
    <rect x="13" y="25" width="22" height="14" rx="7" fill="#fffbeb" />
    <circle cx="19" cy="30.5" r="2.6" fill="#78350f" />
    <circle cx="29" cy="30.5" r="2.6" fill="#78350f" />
    <rect x="18" y="34" width="12" height="2.4" rx="1.2" fill="#92400e" />
    <rect x="21" y="36.8" width="6" height="2" rx="1" fill="#b45309" />
  </svg>
)

const GREEN_THIRTEEN = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#dcfce7" />
    <rect x="8" y="21" width="4" height="7" rx="1.6" fill="#166534" />
    <rect x="36" y="21" width="4" height="7" rx="1.6" fill="#166534" />
    <rect x="12" y="9" width="24" height="30" rx="6" fill="#f0fdf4" stroke="#15803d" strokeWidth="2" />
    <rect x="16" y="13.5" width="16" height="7" rx="2.4" fill="#15803d" />
    <text x="24" y="19.2" textAnchor="middle" fontSize="5.6" fontWeight="700" fill="#f0fdf4">13</text>
    <circle cx="19" cy="28.5" r="3" fill="#166534" />
    <circle cx="29" cy="28.5" r="3" fill="#166534" />
    <rect x="20" y="33.5" width="8" height="2.4" rx="1.2" fill="#15803d" />
  </svg>
)

const VIOLET_SCANNER = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#ede9fe" />
    <rect x="22.5" y="3.5" width="3" height="6" rx="1.2" fill="#7c3aed" />
    <rect x="20" y="8.5" width="8" height="3" rx="1.5" fill="#5b21b6" />
    <path d="M11 22a13 13 0 0 1 26 0v3H11z" fill="#7c3aed" />
    <rect x="14" y="26" width="20" height="7.5" rx="3.75" fill="#f5f3ff" />
    <circle cx="24" cy="29.75" r="3.1" fill="#4c1d95" />
    <circle cx="25.4" cy="28.6" r="1" fill="#c4b5fd" />
    <rect x="17.5" y="35.5" width="3" height="2" rx="1" fill="#6d28d9" />
    <rect x="22.5" y="35.5" width="3" height="2" rx="1" fill="#6d28d9" />
    <rect x="27.5" y="35.5" width="3" height="2" rx="1" fill="#6d28d9" />
  </svg>
)

const NIGHT_DIGGER = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#1e293b" />
    <path d="M10 23a14 14 0 0 1 28 0v3H10z" fill="#475569" />
    <circle cx="24" cy="14.5" r="7" fill="#fde047" opacity="0.3" />
    <circle cx="24" cy="14.5" r="4.2" fill="#fef08a" />
    <circle cx="24" cy="14.5" r="2.2" fill="#fffbeb" />
    <rect x="13" y="25.5" width="22" height="13" rx="6" fill="#334155" />
    <circle cx="19" cy="30.5" r="2.6" fill="#22d3ee" />
    <circle cx="29" cy="30.5" r="2.6" fill="#22d3ee" />
    <rect x="20" y="34.5" width="8" height="2" rx="1" fill="#64748b" />
  </svg>
)

const ROSE_LANTERN = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#fff1f2" />
    <rect x="22.4" y="5" width="3.2" height="5.5" rx="1.2" fill="#be123c" />
    <ellipse cx="24" cy="17" rx="6.5" ry="7.5" fill="#fda4af" />
    <ellipse cx="24" cy="17" rx="3.6" ry="4.2" fill="#fff7ed" opacity="0.9" />
    <path d="M11 24a13 13 0 0 1 26 0v3H11z" fill="#e11d48" />
    <rect x="13" y="26" width="22" height="13" rx="6.5" fill="#ffe4e6" />
    <circle cx="19.5" cy="31" r="2.7" fill="#9f1239" />
    <circle cx="28.5" cy="31" r="2.7" fill="#9f1239" />
    <rect x="20" y="35" width="8" height="2.2" rx="1.1" fill="#be123c" />
  </svg>
)

const GENERIC = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#e5e7eb" />
    <rect x="22.6" y="4" width="2.8" height="6" rx="1.2" fill="#4b5563" />
    <circle cx="24" cy="3.6" r="2.4" fill="#4b5563" />
    <path d="M11 22a13 13 0 0 1 26 0v3H11z" fill="#6b7280" />
    <rect x="13" y="25" width="22" height="13" rx="6" fill="#f3f4f6" />
    <rect x="17.5" y="29" width="4.5" height="4.5" rx="1.5" fill="#374151" />
    <rect x="26" y="29" width="4.5" height="4.5" rx="1.5" fill="#374151" />
    <rect x="20" y="34.5" width="8" height="2" rx="1" fill="#6b7280" />
  </svg>
)

const ROBOTS = {
  tarsixseveneig1: BLUE_MINER,
  tuaranx: AMBER_CAPTAIN,
  tuaran003: GREEN_THIRTEEN,
  drbenjamin81269: VIOLET_SCANNER,
  drbenjamin5102: NIGHT_DIGGER,
  mhcncheboklldif: ROSE_LANTERN,
}

export default function AgentRobotAvatar({ handle, className }) {
  const robot = ROBOTS[String(handle || '').replace(/^@+/, '').trim().toLowerCase()] || GENERIC
  return <span className={className} aria-hidden="true">{robot}</span>
}
