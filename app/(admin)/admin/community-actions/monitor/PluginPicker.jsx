'use client'

import Link from 'next/link'

// X 大互动智能体的监控与排班已移到 X 站后台，这里只保留外部入口。
export const PLUGIN_OPTIONS = [
  { id: 'ai-distributor', label: 'AI 分发大师' },
  { id: 'x', label: 'X 大互动智能体', href: 'https://x.2aran.com/x-workbench/ops', external: true },
]

export const ARCHIVED_PLUGIN_PLATFORMS = new Set(['xhs', 'juejin'])

export default function PluginPicker({ selected }) {
  return (
    <nav aria-label="选择插件" className="mb-5 flex flex-wrap gap-2">
      {PLUGIN_OPTIONS.map((item) => {
        const className = `rounded-full border px-4 py-2 text-sm ${selected === item.id ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'}`
        if (item.external) {
          return (
            <a key={item.id} href={item.href} className={className} aria-current={selected === item.id ? 'page' : undefined}>
              {item.label}
            </a>
          )
        }
        return (
          <Link
            key={item.id}
            href={`/admin/community-actions/monitor?platform=${item.id}`}
            aria-current={selected === item.id ? 'page' : undefined}
            className={className}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
