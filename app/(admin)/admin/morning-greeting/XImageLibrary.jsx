'use client'

import { useState } from 'react'

import XImagePool from './XImagePool'
import { OriginalPreviewDialog, THUMB_GRID_CLASS, ThumbTile } from './XImageThumbs'
import { X_MEME_ASSETS } from '../../../../lib/xMemeAssets'
import { Section } from '../../components/ui'

const TABS = [
  { id: 'memes', label: '表情包模板', description: '35 张原创表情包按早安、午安、交友、蓝 V 交流和互关串门匹配。按日期与时段轮换，重试保留已选图片。' },
  { id: 'pool', label: '图片资源池', description: '每条先随机选择图文或纯文本（各 50%）。图文从同主题固定模板池选取，不再在线生成新图；上传失败重试复用原图和文案。' },
]

export default function XImageLibrary() {
  const [tab, setTab] = useState('memes')
  const [poolReady, setPoolReady] = useState(false)
  const [preview, setPreview] = useState(null)
  const active = TABS.find((item) => item.id === tab) || TABS[0]

  function openTab(id) {
    setTab(id)
    if (id === 'pool') setPoolReady(true)
  }

  return (
    <Section title="配图素材" description={active.description}>
      <div
        role="tablist"
        aria-label="配图素材分类"
        className="mb-4 grid grid-cols-2 overflow-hidden rounded-lg border border-[#d5d7cd] bg-[#f7f8f2] p-1 dark:border-[#2a3544] dark:bg-[#0d131b]"
      >
        {TABS.map((item) => {
          const selected = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`x-image-library-${item.id}`}
              id={`x-image-library-tab-${item.id}`}
              className={`h-9 rounded-md px-2 text-[13px] font-medium transition ${selected ? 'bg-[#2f3027] text-white shadow-sm dark:bg-gray-100 dark:text-[#111]' : 'text-[#626459] hover:bg-white dark:text-[#9aa6b6] dark:hover:bg-[#151c25]'}`}
              onClick={() => openTab(item.id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'memes' ? (
        <div
          id="x-image-library-memes"
          role="tabpanel"
          aria-labelledby="x-image-library-tab-memes"
        >
          <div className={THUMB_GRID_CLASS}>
            {X_MEME_ASSETS.map((meme) => (
              <ThumbTile
                key={meme.id}
                item={{ id: meme.id, label: meme.label, thumb: meme.thumb, original: meme.path }}
                onViewOriginal={setPreview}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div
        id="x-image-library-pool"
        role="tabpanel"
        aria-labelledby="x-image-library-tab-pool"
        hidden={tab !== 'pool'}
      >
        {poolReady ? <XImagePool /> : null}
      </div>

      <OriginalPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </Section>
  )
}
