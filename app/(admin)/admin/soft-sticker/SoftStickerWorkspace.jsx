'use client'

import { useState } from 'react'
import { IconBarbell, IconFlower } from '@tabler/icons-react'

import SelfRegulationClient from '../self-regulation/SelfRegulationClient'
import SoftStickerClient from './SoftStickerClient'

const TABS = [
  { id: 'records', label: '体验记录', description: '时间线、筛选表格与画像看板', icon: IconFlower },
  { id: 'self-regulation', label: '锻炼与自控', description: '回忆录、触发因素与行动复盘', icon: IconBarbell },
]

export default function SoftStickerWorkspace({ initialTab = 'records' }) {
  const [activeTab, setActiveTab] = useState(initialTab === 'self-regulation' ? 'self-regulation' : 'records')

  function selectTab(tab) {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    if (tab === 'records') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  return (
    <>
      <div className="admin-page mx-auto w-full px-4 pt-5 sm:px-5 md:px-6">
        <div className="grid gap-2 rounded-xl border border-[#dedfd6] bg-[#f5f4ee] p-1.5 dark:border-[#26303c] dark:bg-[#111821] sm:grid-cols-2" role="tablist" aria-label="SoftSticker 私密空间">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${active ? 'bg-white text-[#24251f] shadow-sm dark:bg-[#202a36] dark:text-white' : 'text-[#74766c] hover:bg-white/60 hover:text-[#35372f] dark:text-gray-500 dark:hover:bg-[#18212c] dark:hover:text-gray-300'}`}
              >
                <Icon size={19} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-5 opacity-75">{tab.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div hidden={activeTab !== 'records'} aria-hidden={activeTab !== 'records'}>
        <SoftStickerClient />
      </div>
      <div hidden={activeTab !== 'self-regulation'} aria-hidden={activeTab !== 'self-regulation'}>
        <SelfRegulationClient />
      </div>
    </>
  )
}
