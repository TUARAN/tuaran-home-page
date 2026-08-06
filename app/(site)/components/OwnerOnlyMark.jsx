import { IconLock } from '@tabler/icons-react'

/**
 * 站长（owner）专属可见元素的统一标记。
 * 只负责视觉标记，不判断权限；需要权限判断时配合 useSessionAccount 使用。
 */
export default function OwnerOnlyMark({ label = '仅站长可见', title, className = '' }) {
  return (
    <span
      className={`owner-only-mark ${className}`}
      title={title || '此元素仅站长本人可见，普通访客不会看到'}
    >
      <IconLock size={11} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  )
}
