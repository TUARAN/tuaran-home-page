'use client'

import { useEffect, useState } from 'react'

import LongCompassClient from '../../../(site)/long-compass/LongCompassClient'
import ShareAdminClient from '../share/ShareConsole'

const TABS = [
  {
    id: 'long-compass',
    label: '长期罗盘',
    desc: '强私密内容库：资产、复盘、行动框架。服务端只持有密文，需要口令解锁。',
  },
  {
    id: 'encrypted-share',
    label: '加密分享',
    desc: '分发内容库：后台明文管理，公开访问者只拿密文链接，凭密码在浏览器解锁。',
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
    <>
      <section className="mx-auto w-full max-w-[1120px] px-4 pt-7 md:px-6 md:pt-9">
        <div className="border-b border-[#d9dbd1] pb-4 dark:border-[#263140]">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
            Private Content Hub
          </p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold text-[#15140f] dark:text-gray-100">
                私域与分享
              </h1>
              <p className="mt-2 max-w-[52rem] text-[13.5px] leading-7 text-[#56564e] dark:text-gray-400">
                长期罗盘用于强私密长期记录，密文存储、浏览器本地解密；加密分享用于对外分发，后台站长可查看明文，公开链接只返回密文信封。
              </p>
            </div>
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
          </div>
          <p className="mt-3 text-xs leading-6 text-[#66675d] dark:text-[#9aa6b6]">
            {TABS.find((tab) => tab.id === activeTab)?.desc}
          </p>
        </div>
      </section>

      <div role="tabpanel" aria-label={TABS.find((tab) => tab.id === activeTab)?.label}>
        {activeTab === 'long-compass' ? (
          <LongCompassClient
            returnTo="/admin/long-compass"
            eyebrow="Admin · 强私密模型"
            description="长期罗盘：密文存储，本页输入口令后只在浏览器本地解密。"
          />
        ) : (
          <ShareAdminClient />
        )}
      </div>
    </>
  )
}
