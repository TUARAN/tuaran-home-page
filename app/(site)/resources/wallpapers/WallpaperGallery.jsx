'use client'

import { useEffect, useMemo, useState } from 'react'

import { useLocale } from '../../components/LocaleProvider'
import { pick } from '../../../../lib/i18n'

const CATEGORY_LABELS = {
  misc: { zh: '综合', en: 'Misc' },
  nature: { zh: '自然', en: 'Nature' },
  abstract: { zh: '抽象', en: 'Abstract' },
  minimal: { zh: '极简', en: 'Minimal' },
  city: { zh: '城市', en: 'City' },
  anime: { zh: '二次元', en: 'Anime' },
}

function categoryLabel(locale, key) {
  const entry = CATEGORY_LABELS[key]
  return entry ? pick(locale, entry.zh, entry.en) : key
}

function formatSize(bytes) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function WallpaperGallery() {
  const { locale } = useLocale()
  const [status, setStatus] = useState('loading')
  const [wallpapers, setWallpapers] = useState([])
  const [active, setActive] = useState('all')

  useEffect(() => {
    let alive = true
    fetch('/api/wallpapers', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return
        if (data?.status === 'ok') {
          setWallpapers(Array.isArray(data.wallpapers) ? data.wallpapers : [])
          setStatus('ok')
        } else {
          setStatus(data?.status === 'unavailable' ? 'unavailable' : 'error')
        }
      })
      .catch(() => {
        if (alive) setStatus('error')
      })
    return () => {
      alive = false
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set(wallpapers.map((w) => w.category || 'misc'))
    return ['all', ...Array.from(set)]
  }, [wallpapers])

  const visible = useMemo(() => {
    if (active === 'all') return wallpapers
    return wallpapers.filter((w) => (w.category || 'misc') === active)
  }, [wallpapers, active])

  function handleDownload(w) {
    // 埋点（失败不影响下载，直链交给浏览器）
    fetch('/api/wallpapers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: w.id }),
    }).catch(() => {})
    setWallpapers((list) =>
      list.map((item) => (item.id === w.id ? { ...item, downloads: item.downloads + 1 } : item))
    )
  }

  if (status === 'loading') {
    return (
      <p className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {pick(locale, '正在加载壁纸…', 'Loading wallpapers…')}
      </p>
    )
  }

  if (status === 'unavailable') {
    return (
      <p className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {pick(locale, '壁纸服务暂未就绪。', 'Wallpaper service is not ready yet.')}
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="py-16 text-center text-sm text-red-500">
        {pick(locale, '加载失败，请稍后重试。', 'Failed to load. Please try again later.')}
      </p>
    )
  }

  if (!wallpapers.length) {
    return (
      <p className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {pick(locale, '还没有上架壁纸。', 'No wallpapers published yet.')}
      </p>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isActive = active === cat
          const label = cat === 'all' ? pick(locale, '全部', 'All') : categoryLabel(locale, cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-300 text-neutral-600 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((w) => {
          const title = pick(locale, w.title, w.titleEn) || w.fileName
          return (
            <figure
              key={w.id}
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.url}
                  alt={title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {categoryLabel(locale, w.category)}
                    {w.width && w.height ? ` · ${w.width}×${w.height}` : ''}
                    {w.sizeBytes ? ` · ${formatSize(w.sizeBytes)}` : ''}
                  </p>
                </div>
                <a
                  href={w.url}
                  download={w.fileName || true}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => handleDownload(w)}
                  className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {pick(locale, '下载', 'Download')}
                </a>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
