'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconCopy,
  IconGripVertical,
  IconRefresh,
  IconSearch,
  IconSparkles,
  IconX,
} from '@tabler/icons-react'

import { RANK_CATEGORIES, RANK_ITEMS, RANK_TIERS } from '../../../lib/rankData'
import styles from './RankSite.module.css'

const STORAGE_KEY = 'rank-2aran-ai-tierlist-v1'

function readSavedRanks() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.fromEntries(RANK_ITEMS.map((item) => [item.id, saved[item.id] || item.tier]))
  } catch {
    return Object.fromEntries(RANK_ITEMS.map((item) => [item.id, item.tier]))
  }
}

function ProductCard({ item, tierId, onMove, onSelect, onDragStart }) {
  const tierIndex = RANK_TIERS.findIndex((tier) => tier.id === tierId)

  return (
    <article
      className={styles.card}
      draggable
      onDragStart={(event) => onDragStart(event, item.id)}
      onClick={() => onSelect(item)}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(item)
        }
      }}
      aria-label={`${item.name}，当前位于${RANK_TIERS[tierIndex]?.label}档`}
    >
      <span className={styles.dragHandle} aria-hidden="true"><IconGripVertical size={15} /></span>
      <span className={styles.productMark} style={{ '--mark': item.accent }}>{item.mark}</span>
      <span className={styles.productName}>{item.name}</span>
      <span className={styles.mobileMove}>
        <button
          type="button"
          disabled={tierIndex === 0}
          onClick={(event) => { event.stopPropagation(); onMove(item.id, RANK_TIERS[tierIndex - 1]?.id) }}
          aria-label={`将 ${item.name} 上移一档`}
        ><IconArrowUp size={14} /></button>
        <button
          type="button"
          disabled={tierIndex === RANK_TIERS.length - 1}
          onClick={(event) => { event.stopPropagation(); onMove(item.id, RANK_TIERS[tierIndex + 1]?.id) }}
          aria-label={`将 ${item.name} 下移一档`}
        ><IconArrowDown size={14} /></button>
      </span>
    </article>
  )
}

export default function RankBoard() {
  const [ranks, setRanks] = useState(() => Object.fromEntries(RANK_ITEMS.map((item) => [item.id, item.tier])))
  const [category, setCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setRanks(readSavedRanks())
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ranks))
  }, [ranks, ready])

  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return RANK_ITEMS.filter((item) => (
      (category === '全部' || item.category === category)
      && (!keyword || `${item.name} ${item.category}`.toLowerCase().includes(keyword))
    ))
  }, [category, query])

  const moveItem = (itemId, tierId) => {
    if (!tierId) return
    setRanks((current) => ({ ...current, [itemId]: tierId }))
  }

  const handleDrop = (event, tierId) => {
    event.preventDefault()
    const itemId = event.dataTransfer.getData('text/plain')
    if (RANK_ITEMS.some((item) => item.id === itemId)) moveItem(itemId, tierId)
    setDragOver(null)
  }

  const resetRanks = () => {
    setRanks(Object.fromEntries(RANK_ITEMS.map((item) => [item.id, item.tier])))
    setCopied(false)
  }

  const copyRanks = async () => {
    const text = RANK_TIERS.map((tier) => {
      const names = RANK_ITEMS.filter((item) => ranks[item.id] === tier.id).map((item) => item.name)
      return `${tier.label}：${names.join('、') || '—'}`
    }).join('\n')
    await navigator.clipboard.writeText(`从夯到拉 · 我的 AI 排行榜\n\n${text}\n\nrank.2aran.com`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className={styles.site}>
      <div className={styles.noise} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="从夯到拉首页">
          <span className={styles.brandStamp}>夯</span>
          <span><strong>从夯到拉</strong><small>RANK.2ARAN.COM</small></span>
        </Link>
        <div className={styles.headerMeta}>
          <span><i /> 2026.08 体验版</span>
          <a href="https://2aran.com/sites">2ARAN 站点网络 ↗</a>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.eyebrow}><IconSparkles size={15} /> AI PRODUCT TIER LIST</div>
        <h1>谁夯，谁拉？<br /><em>拖出来见真章。</em></h1>
        <p>基于真实使用体验的 AI 产品分级榜。你可以拖动卡片，改成自己的版本。</p>
        <div className={styles.legend} aria-label="榜单摘要">
          <span><b>{RANK_ITEMS.length}</b> 个产品</span>
          <span><b>{RANK_TIERS.length}</b> 档评价</span>
          <span><b>本机</b> 自动保存</span>
        </div>
      </section>

      <section className={styles.workspace} aria-label="AI 产品排行榜">
        <div className={styles.toolbar}>
          <div className={styles.categoryTabs} aria-label="按产品场景筛选">
            {RANK_CATEGORIES.map((item) => (
              <button key={item} type="button" className={category === item ? styles.activeTab : ''} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className={styles.toolbarActions}>
            <label className={styles.search}>
              <IconSearch size={16} aria-hidden="true" />
              <span className="sr-only">搜索产品</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜产品" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><IconX size={14} /></button>}
            </label>
            <button type="button" className={styles.actionButton} onClick={resetRanks}><IconRefresh size={16} /> 重置</button>
            <button type="button" className={styles.primaryButton} onClick={copyRanks}>
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}{copied ? '已复制' : '复制榜单'}
            </button>
          </div>
        </div>

        <div className={styles.board}>
          {RANK_TIERS.map((tier, index) => {
            const items = visibleItems.filter((item) => ranks[item.id] === tier.id)
            return (
              <section
                key={tier.id}
                className={`${styles.tierRow} ${dragOver === tier.id ? styles.dragTarget : ''}`}
                style={{ '--tier': tier.color }}
                onDragOver={(event) => { event.preventDefault(); setDragOver(tier.id) }}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(null) }}
                onDrop={(event) => handleDrop(event, tier.id)}
              >
                <div className={styles.tierLabel}>
                  <span className={styles.tierNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{tier.label}</strong>
                  <small>{tier.note}</small>
                </div>
                <div className={styles.tierItems}>
                  {items.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      tierId={tier.id}
                      onMove={moveItem}
                      onSelect={setSelected}
                      onDragStart={(event, itemId) => {
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', itemId)
                      }}
                    />
                  ))}
                  {items.length === 0 && <span className={styles.emptyTier}>{query || category !== '全部' ? '筛选下暂无产品' : '拖到这里'}</span>}
                </div>
              </section>
            )
          })}
        </div>
        <p className={styles.boardHint}><IconGripVertical size={14} /> 电脑端直接拖拽；手机端点卡片箭头换档。点击产品可查看评价。</p>
      </section>

      <footer className={styles.footer}>
        <p>排名来自 TUARAN 的阶段性个人体验，会随产品更新。它是一份可讨论的主观榜单，不是采购结论。</p>
        <span>MADE WITH OPINIONS · © 2026 TUARAN</span>
      </footer>

      {selected && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelected(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="rank-detail-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => setSelected(null)} aria-label="关闭详情"><IconX size={18} /></button>
            <span className={styles.modalMark} style={{ '--mark': selected.accent }}>{selected.mark}</span>
            <p className={styles.modalCategory}>{selected.category} · 当前 {RANK_TIERS.find((tier) => tier.id === ranks[selected.id])?.label}档</p>
            <h2 id="rank-detail-title">{selected.name}</h2>
            <p>{selected.summary}</p>
            <div className={styles.modalTiers}>
              {RANK_TIERS.map((tier) => (
                <button key={tier.id} type="button" className={ranks[selected.id] === tier.id ? styles.modalTierActive : ''} onClick={() => moveItem(selected.id, tier.id)}>
                  {tier.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
