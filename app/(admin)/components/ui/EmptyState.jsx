import { IconInbox } from '@tabler/icons-react'

/** 空态：图标 + 标题 + 可选说明 / 操作。 */
export default function EmptyState({ icon: Icon = IconInbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <Icon size={28} stroke={1.4} className="text-[#b6b8ab] dark:text-[#4a5668]" aria-hidden="true" />
      <p className="text-[14px] font-medium text-[#3f4039] dark:text-gray-200">{title}</p>
      {description ? (
        <p className="max-w-[28rem] text-[12.5px] leading-6 text-[#7a7c70] dark:text-gray-500">{description}</p>
      ) : null}
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  )
}
