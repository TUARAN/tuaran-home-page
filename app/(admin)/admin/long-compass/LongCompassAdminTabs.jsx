'use client'

import { useEffect, useState } from 'react'

import LongCompassClient from '../../../(site)/long-compass/LongCompassClient'
import ShareAdminClient from '../share/ShareConsole'
import { AdminPage } from '../../components/ui'

const TABS = [
  {
    id: 'long-compass',
    label: '长期罗盘',
    desc: '强私密内容库：数据库仅存密文，浏览器本地解锁。',
  },
  {
    id: 'encrypted-share',
    label: '密码保护分享',
    desc: '对外分发：后台保留明文副本，公开端只返回密文。',
  },
]

export default function LongCompassAdminTabs() {
  const [activeTab, setActiveTab] = useState('long-compass')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (TABS.some((tab) => tab.id === hash)) setActiveTab(hash)
  }, [])

  function selectTab(tabId) {
    setActiveTab(tabId)
    window.history.replaceState(null, '', `#${tabId}`)
  }

  return (
    <AdminPage
      title="私域与分享"
      description={TABS.find((tab) => tab.id === activeTab)?.desc}
      actions={
        <div
          role="tablist"
          aria-label="私域与分享切换"
          className="grid shrink-0 grid-cols-2 overflow-hidden rounded-lg border border-[#d5d7cd] bg-[#f7f8f2] p-1 dark:border-[#2a3544] dark:bg-[#0d131b]"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tab.id)}
                className={`min-w-[112px] rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-[#2f3027] text-white shadow-sm dark:bg-gray-100 dark:text-[#111]'
                    : 'text-[#626459] hover:bg-white dark:text-[#9aa6b6] dark:hover:bg-[#151c25]'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      }
    >
      <div role="tabpanel" aria-label={TABS.find((tab) => tab.id === activeTab)?.label}>
        {activeTab === 'long-compass' ? (
          <LongCompassClient
            returnTo="/admin/long-compass"
            eyebrow="Admin · 强私密模型"
            description="长期罗盘：密文存储，本页输入口令后只在浏览器本地解密。"
            embedded
          />
        ) : (
          <ShareAdminClient embedded />
        )}
      </div>
    </AdminPage>
  )
}
