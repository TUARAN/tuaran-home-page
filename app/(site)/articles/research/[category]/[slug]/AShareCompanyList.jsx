'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const API_PATH = '/api/a-shares/companies'

function pagesAround(current, total) {
  const pages = new Set([1, total])
  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page >= 1 && page <= total) pages.add(page)
  }
  return [...pages].sort((a, b) => a - b)
}

export default function AShareCompanyList({ introHtml, footerHtml, initialPage }) {
  const [data, setData] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(null)
  const failedPageRef = useRef(null)
  const listHeadingRef = useRef(null)
  const pages = useMemo(() => pagesAround(data.page, data.totalPages), [data.page, data.totalPages])

  async function loadPage(page, { updateUrl = true, scroll = true } = {}) {
    const nextPage = Math.min(Math.max(page, 1), data.totalPages)

    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    setError('')
    failedPageRef.current = null

    try {
      const response = await fetch(`${API_PATH}?page=${nextPage}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const nextData = await response.json()
      setData(nextData)

      if (updateUrl) {
        const url = new URL(window.location.href)
        if (nextData.page === 1) url.searchParams.delete('page')
        else url.searchParams.set('page', String(nextData.page))
        window.history.pushState({ aSharePage: nextData.page }, '', `${url.pathname}${url.search}${url.hash}`)
      }
      if (scroll) listHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        failedPageRef.current = nextPage
        setError('名单加载失败，请稍后重试。')
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const fromUrl = Number.parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10)
    if (Number.isFinite(fromUrl) && fromUrl > 1) loadPage(fromUrl, { updateUrl: false, scroll: false })

    function handlePopState() {
      const page = Number.parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10)
      loadPage(Number.isFinite(page) ? page : 1, { updateUrl: false, scroll: false })
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      requestRef.current?.abort()
    }
    // 首次挂载时读取 URL；后续页码变化由按钮和 popstate 处理。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firstNumber = (data.page - 1) * data.pageSize + 1
  const lastNumber = Math.min(data.page * data.pageSize, data.total)

  return (
    <div className="prose-tuaran">
      <div dangerouslySetInnerHTML={{ __html: introHtml }} />

      <section aria-labelledby="a-share-list-heading" aria-busy={loading}>
        <div ref={listHeadingRef} className="scroll-mt-24" />
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="a-share-list-heading" className="mb-0">公司名单</h2>
          <p className="mb-0 text-sm text-[#777] dark:text-gray-400">
            第 {firstNumber}–{lastNumber} 家，共 {data.total} 家
          </p>
        </div>

        <div className={loading ? 'opacity-55 transition-opacity' : 'transition-opacity'}>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="text-right">序号</th>
                  <th className="text-right">证券代码</th>
                  <th>证券简称</th>
                  <th>交易所</th>
                  <th>板块</th>
                </tr>
              </thead>
              <tbody>
                {data.companies.map((company, index) => (
                  <tr key={company.code}>
                    <td className="text-right tabular-nums">{firstNumber + index}</td>
                    <td className="text-right font-mono tabular-nums">{company.code}</td>
                    <td>{company.name}</td>
                    <td>{company.exchangeName}</td>
                    <td>{company.boardName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            {error}{' '}
            <button type="button" className="underline" onClick={() => loadPage(failedPageRef.current || data.page)}>
              重试
            </button>
          </p>
        ) : null}

        <nav className="not-prose mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="公司名单分页">
          <button
            type="button"
            disabled={data.page === 1 || loading}
            onClick={() => loadPage(data.page - 1)}
            className="rounded-md border border-[#d1d3cb] px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#343b46]"
          >
            上一页
          </button>
          {pages.map((page, index) => {
            const previous = pages[index - 1]
            return (
              <span key={page} className="contents">
                {previous && page - previous > 1 ? <span className="px-1 text-[#999]">…</span> : null}
                <button
                  type="button"
                  disabled={loading}
                  aria-current={page === data.page ? 'page' : undefined}
                  aria-label={`第 ${page} 页`}
                  onClick={() => loadPage(page)}
                  className={[
                    'min-w-9 rounded-md border px-2.5 py-1.5 text-sm disabled:cursor-not-allowed',
                    page === data.page
                      ? 'border-[#8a5a14] bg-[#8a5a14] text-white dark:border-[#9ba475] dark:bg-[#9ba475] dark:text-[#171a1f]'
                      : 'border-[#d1d3cb] hover:bg-[#f1f2ec] dark:border-[#343b46] dark:hover:bg-[#1a2230]',
                  ].join(' ')}
                >
                  {page}
                </button>
              </span>
            )
          })}
          <button
            type="button"
            disabled={data.page === data.totalPages || loading}
            onClick={() => loadPage(data.page + 1)}
            className="rounded-md border border-[#d1d3cb] px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#343b46]"
          >
            下一页
          </button>
        </nav>
        <p className="mt-2 text-center text-xs text-[#888] dark:text-gray-500">
          第 {data.page} / {data.totalPages} 页
        </p>
      </section>

      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  )
}
