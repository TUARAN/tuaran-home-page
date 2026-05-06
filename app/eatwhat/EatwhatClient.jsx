'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

const TABS = [
  { id: 'adult', label: '爸爸妈妈' },
  { id: 'baby', label: '小茉莉' },
]

function getMealPeriod() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) {
    return { tag: '早餐时段', label: '早餐推荐', hint: '新的一天，从吃好第一顿开始。' }
  }
  if (hour >= 10 && hour < 14) {
    return { tag: '午餐时段', label: '午餐推荐', hint: '中午这一顿，选个稳妥的。' }
  }
  if (hour >= 14 && hour < 17) {
    return { tag: '下午时段', label: '下午加餐', hint: '先看看，晚点吃什么也能心里有数。' }
  }
  if (hour >= 17 && hour < 21) {
    return { tag: '晚餐时段', label: '晚餐推荐', hint: '忙完一天，晚饭可以认真一点。' }
  }
  return { tag: '夜间时段', label: '夜宵灵感', hint: '现在不一定马上吃，也可以先记住这道。' }
}

async function fetchAudience(audience) {
  const res = await fetch(`/api/dishes?audience=${audience}`, { cache: 'no-store' })
  if (res.status === 503) {
    return { unavailable: true, dishes: [] }
  }
  if (!res.ok) {
    return { error: true, dishes: [] }
  }
  const data = await res.json().catch(() => ({}))
  return { dishes: Array.isArray(data?.dishes) ? data.dishes : [] }
}

export default function EatwhatClient() {
  const slidesRef = useRef(null)
  const lastIndexRef = useRef(-1)

  const [activeTab, setActiveTab] = useState('adult')
  const [adultDishes, setAdultDishes] = useState([])
  const [babyDishes, setBabyDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [period, setPeriod] = useState(() => getMealPeriod())
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [adult, baby] = await Promise.all([fetchAudience('adult'), fetchAudience('baby')])
      if (cancelled) return
      if (adult.unavailable || baby.unavailable) {
        setUnavailable(true)
      }
      setAdultDishes(adult.dishes)
      setBabyDishes(baby.dishes)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 时段每分钟刷新一次，避免用户停在页面跨过整点后还显示旧时段。
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPeriod(getMealPeriod())
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const handlePick = useCallback(() => {
    if (adultDishes.length === 0) return
    let index = Math.floor(Math.random() * adultDishes.length)
    if (adultDishes.length > 1) {
      while (index === lastIndexRef.current) {
        index = Math.floor(Math.random() * adultDishes.length)
      }
    }
    lastIndexRef.current = index
    setPicked(adultDishes[index])
  }, [adultDishes])

  const switchTab = useCallback((tabId) => {
    setActiveTab(tabId)
    const slides = slidesRef.current
    if (!slides) return
    const index = TABS.findIndex((t) => t.id === tabId)
    if (index < 0) return
    slides.scrollTo({ left: slides.clientWidth * index, behavior: 'smooth' })
  }, [])

  // 用户横向滑动时同步 activeTab —— scroll-snap 是真理来源。
  const handleSlidesScroll = useCallback(() => {
    const slides = slidesRef.current
    if (!slides) return
    const index = Math.round(slides.scrollLeft / slides.clientWidth)
    const tab = TABS[index]
    if (tab && tab.id !== activeTab) {
      setActiveTab(tab.id)
    }
  }, [activeTab])

  return (
    <main
      className="min-h-[100dvh] bg-gradient-to-br from-[#fbfff8] via-[#f3fbf4] to-[#eef8ff] dark:from-[#0b1016] dark:via-[#0b141a] dark:to-[#0d1822]"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-3">
        <header className="flex items-center justify-between gap-3 py-3">
          <Link
            href="/xiaomoli-dad-todo"
            className="inline-flex h-9 items-center rounded-full border border-[#cfe6d8] bg-white/70 px-3 text-xs font-medium text-[#42957f] backdrop-blur dark:border-[#2a3f3a] dark:bg-[#121820]/70 dark:text-[#7fc7b0]"
          >
            ← 奶爸清单
          </Link>
          <span className="inline-flex h-9 items-center rounded-full border border-[#cfe6d8]/60 bg-white/60 px-3 text-[11px] font-semibold tracking-wide text-[#6f8d84] backdrop-blur dark:border-[#2a3f3a]/60 dark:bg-[#121820]/60 dark:text-gray-400">
            {period.tag}
          </span>
        </header>

        <nav className="mb-3 flex rounded-full border border-[#cfe6d8] bg-white/70 p-1 backdrop-blur dark:border-[#2a3f3a] dark:bg-[#121820]/70">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-gradient-to-br from-[#6fc3a3] to-[#77b9e4] text-white shadow-sm'
                    : 'text-[#6f8d84] dark:text-gray-400'
                }`}
                aria-pressed={isActive}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        {unavailable ? (
          <div className="mb-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            菜品需要部署环境（Cloudflare D1）才能读取。本地预览先看不到数据，部署到 Pages 后会自动加载。
          </div>
        ) : null}

        <div
          ref={slidesRef}
          onScroll={handleSlidesScroll}
          className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ touchAction: 'pan-x' }}
        >
          {/* 爸爸妈妈 —— 抽菜 */}
          <section className="flex w-full flex-none snap-start flex-col rounded-3xl border border-[#cfe6d8]/70 bg-white/80 p-4 shadow-[0_24px_60px_rgba(98,150,137,0.12)] backdrop-blur dark:border-[#2a3f3a]/70 dark:bg-[#121820]/85">
            <header className="mb-2">
              <h1 className="text-[2.4rem] font-extrabold leading-[0.95] tracking-tight text-[#2f7f6a] dark:text-[#7fc7b0]">
                吃什么？！
                <br />
                帮我决定
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#6f8d84] dark:text-gray-400">
                {loading ? '正在拉菜单…' : `共 ${adultDishes.length} 道菜，左右滑动切到「小茉莉吃什么」。`}
              </p>
            </header>

            <div className="my-auto flex flex-col gap-4 rounded-3xl border border-[#cfe6d8]/60 bg-white/95 p-5 shadow-inner dark:border-[#2a3f3a]/60 dark:bg-[#0d1822]/85">
              <span className="inline-flex h-7 self-start items-center rounded-full bg-[#edf8f1] px-3 text-[11px] font-bold tracking-wider text-[#42957f] dark:bg-[#1a2e26] dark:text-[#7fc7b0]">
                {period.label}
              </span>
              <h2 className="text-[2rem] font-bold leading-tight tracking-tight text-[#1f433b] dark:text-gray-100">
                {picked ? picked.name_zh : '点一下开始抽菜'}
              </h2>
              <div className="inline-flex h-11 self-start items-center rounded-2xl bg-white px-4 text-base font-semibold text-[#42957f] ring-1 ring-inset ring-[#b2dacb]/60 dark:bg-[#121820] dark:text-[#7fc7b0] dark:ring-[#2a3f3a]">
                {picked ? picked.rating_label : '等待推荐'}
              </div>
              <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-relaxed text-[#6f8d84] dark:bg-[#0a1218]/70 dark:text-gray-400">
                <strong className="text-[#1f433b] dark:text-gray-200">小教程：</strong>
                {picked ? picked.short_recipe : loading ? '加载菜单中…' : '菜单就绪，点一下开始抽菜。'}
              </p>
              <p className="text-sm leading-relaxed text-[#6f8d84] dark:text-gray-400">
                {picked ? '想换一道，就再点一次。' : period.hint}
              </p>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handlePick}
                disabled={loading || adultDishes.length === 0}
                className="block w-full rounded-3xl bg-gradient-to-br from-[#6fc3a3] to-[#77b9e4] py-4 text-lg font-bold text-white shadow-[0_16px_30px_rgba(95,179,170,0.24)] transition-transform active:scale-[0.985] disabled:opacity-50"
              >
                {loading ? '菜单加载中…' : adultDishes.length === 0 ? '暂时没有菜品' : '帮我决定吃什么'}
              </button>
            </div>
          </section>

          {/* 小茉莉 —— 宝宝清单 */}
          <section className="flex w-full flex-none snap-start flex-col rounded-3xl border border-[#cfe6d8]/70 bg-white/80 p-4 shadow-[0_24px_60px_rgba(98,150,137,0.12)] backdrop-blur dark:border-[#2a3f3a]/70 dark:bg-[#121820]/85">
            <header className="mb-3">
              <h2 className="text-[2.2rem] font-extrabold leading-[0.95] tracking-tight text-[#1f433b] dark:text-gray-100">
                小茉莉<span className="ml-2 text-[#42957f] dark:text-[#7fc7b0]">吃什么</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#6f8d84] dark:text-gray-400">
                适合 1 岁宝宝的日常吃饭建议，先从软、碎、清淡开始。
              </p>
            </header>

            <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
              {loading ? (
                <article className="rounded-3xl border border-[#cfe6d8]/60 bg-white/90 p-4 text-sm text-[#6f8d84] dark:border-[#2a3f3a]/60 dark:bg-[#0d1822]/85 dark:text-gray-400">
                  宝宝菜单加载中…
                </article>
              ) : babyDishes.length === 0 ? (
                <article className="rounded-3xl border border-[#cfe6d8]/60 bg-white/90 p-4 dark:border-[#2a3f3a]/60 dark:bg-[#0d1822]/85">
                  <h3 className="mb-1 text-base font-semibold text-[#1f433b] dark:text-gray-100">
                    暂时没有数据
                  </h3>
                  <p className="text-sm leading-relaxed text-[#6f8d84] dark:text-gray-400">
                    等菜单入库后，这里会自动显示。
                  </p>
                </article>
              ) : (
                babyDishes.map((dish) => (
                  <article
                    key={dish.id}
                    className="rounded-2xl border border-[#cfe6d8]/60 bg-white/95 p-4 dark:border-[#2a3f3a]/60 dark:bg-[#0d1822]/85"
                  >
                    <h3 className="mb-1 text-base font-semibold text-[#1f433b] dark:text-gray-100">
                      {dish.name_zh}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#6f8d84] dark:text-gray-400">
                      {dish.short_recipe}
                    </p>
                  </article>
                ))
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-[#e8dfbf]/70 bg-[#fffaf1]/90 px-4 py-3 text-sm leading-relaxed text-[#7c8375] dark:border-[#3a3528]/70 dark:bg-[#1a1812]/85 dark:text-gray-300">
              尽量少盐少糖，注意大小和软硬度，避免整颗坚果、整粒葡萄这类容易噎住的食物。
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-2 py-3 text-xs text-[#91a6a0] dark:text-gray-500">
          <span>{loading ? '菜单加载中' : `爸妈 ${adultDishes.length} · 宝宝 ${babyDishes.length}`}</span>
          <div className="inline-flex gap-1.5" aria-hidden="true">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <span
                  key={tab.id}
                  className={`h-2 w-2 rounded-full transition-transform ${
                    isActive ? 'scale-110 bg-[#42957f] dark:bg-[#7fc7b0]' : 'bg-[#91a6a0]/30 dark:bg-gray-700'
                  }`}
                />
              )
            })}
          </div>
        </footer>
      </div>
    </main>
  )
}
