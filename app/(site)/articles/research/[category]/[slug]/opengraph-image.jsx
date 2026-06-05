import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CATEGORY_META, RESEARCH_CATEGORIES } from '../../../../../../lib/research/categories'
import { getResearchEntry } from '../../../../../../lib/research/loader'

// 不指定 runtime，让 build 时静态生成 PNG —— social crawler 抓取时不跑函数
export const alt = '涂阿燃 · 调研'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 头像以 base64 嵌入，免去运行时 fetch
const AVATAR_DATA_URL = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'tuaranme.png'))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
})()

function truncate(text, max) {
  if (!text) return ''
  const t = String(text).replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

export default async function ResearchOgImage({ params }) {
  const { category, slug } = await params
  const entry = RESEARCH_CATEGORIES.includes(category)
    ? getResearchEntry(category, slug)
    : null

  const title = truncate(entry?.title || '调研', 56)
  const summary = truncate(entry?.tldr || entry?.summary || '', 90)
  const categoryLabel = CATEGORY_META[entry?.category]?.label || '调研'
  const dateStr = entry?.date || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #fbf3e3 0%, #f4ead3 55%, #fbf3e3 100%)',
          padding: '64px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
          color: '#221f19',
          position: 'relative',
        }}
      >
        {/* 角落径向高光 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 6% 6%, rgba(183,121,31,0.16), transparent 38%), radial-gradient(circle at 96% 96%, rgba(107,133,166,0.12), transparent 40%)',
            opacity: 0.85,
          }}
        />

        {/* Top brand bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: '#8a5a14',
            fontFamily: 'monospace',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: '#b7791f',
                borderRadius: '50%',
              }}
            />
            <span>2aran.com · {categoryLabel}</span>
          </div>
          {dateStr ? <span>{dateStr}</span> : null}
        </div>

        {/* Middle: avatar + title + summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 48,
            zIndex: 1,
          }}
        >
          {AVATAR_DATA_URL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={AVATAR_DATA_URL}
              width={220}
              height={220}
              alt=""
              style={{
                width: 220,
                height: 220,
                borderRadius: '50%',
                border: '6px solid #fff',
                boxShadow: '0 10px 32px rgba(63,53,39,0.22)',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : null}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: 22,
              borderLeft: '5px solid #b7791f',
              paddingLeft: 28,
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.22,
                color: '#1a1813',
                letterSpacing: '-0.005em',
              }}
            >
              {title}
            </div>
            {summary ? (
              <div
                style={{
                  fontSize: 22,
                  color: '#5d503f',
                  lineHeight: 1.5,
                }}
              >
                {summary}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom: site identity */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 20,
            color: '#9a8f7a',
            fontFamily: 'monospace',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 1, background: '#d8cfbf' }} />
            <span>涂阿燃 · 网络日志</span>
          </div>
          <span>掘金安东尼</span>
        </div>
      </div>
    ),
    size
  )
}
