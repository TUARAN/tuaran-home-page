'use client'
import Link from 'next/link'
export const PLUGIN_OPTIONS = [
  { id: 'ai-distributor', label: 'AI 分发大师' }, { id: 'x', label: 'X 高频互动助手' },
  { id: 'xhs', label: '小红书助手 · 已归档' }, { id: 'juejin', label: '掘金助手 · 已归档' },
]
export default function PluginPicker({ selected }) {
  return <nav aria-label="选择插件" className="mb-5 flex flex-wrap gap-2">{PLUGIN_OPTIONS.map(item => <Link key={item.id} href={`/admin/community-actions/monitor?platform=${item.id}`} aria-current={selected === item.id ? 'page' : undefined} className={`rounded-full border px-4 py-2 text-sm ${selected === item.id ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'}`}>{item.label}</Link>)}</nav>
}
