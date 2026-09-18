'use client'

import { useState } from 'react'

import { AdminButton, AdminPage } from '../../components/ui'
import DeepSeekKeysPanel from './DeepSeekKeysPanel'
import OllamaProvidersPanel from './OllamaProvidersPanel'

const PAGE_TAB_CLASS = 'h-9 rounded-md px-4 text-[13px] font-medium transition'

export default function DeepSeekTasksClient() {
  const [tab, setTab] = useState('keys')

  return (
    <AdminPage
      title="模型服务"
      description="管理 DeepSeek 密钥与 NAS Ollama 服务。调用记录已移到日志记录。"
      actions={
        <>
          <AdminButton href="/admin/model-dispatch">AI 规划台</AdminButton>
          <AdminButton href="/admin/logs?tab=calls">调用记录</AdminButton>
        </>
      }
    >
      <div
        role="tablist"
        aria-label="模型服务"
        className="mb-4 grid max-w-md grid-cols-2 overflow-hidden rounded-lg border border-[#d5d7cd] bg-[#f7f8f2] p-1 dark:border-[#2a3544] dark:bg-[#0d131b]"
      >
        {[
          { id: 'keys', label: 'DeepSeek 密钥' },
          { id: 'ollama', label: 'NAS · Ollama' },
        ].map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${PAGE_TAB_CLASS} ${active ? 'bg-[#2f3027] text-white shadow-sm dark:bg-gray-100 dark:text-[#111]' : 'text-[#626459] hover:bg-white dark:text-[#9aa6b6] dark:hover:bg-[#151c25]'}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'keys' ? <DeepSeekKeysPanel /> : <OllamaProvidersPanel />}
    </AdminPage>
  )
}
