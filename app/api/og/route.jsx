import { ImageResponse } from 'next/og'
import { RESEARCH_ENTRY_META } from '../../../lib/research/catalog'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }
const SKYLINE = [116, 174, 132, 226, 156, 288, 188, 242, 148, 328, 204, 266, 176, 220]
const RESEARCH_CATEGORY_LABELS = {
  companies: '公司',
  topics: '主题',
  people: '人物',
}

function clean(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const key = clean(searchParams.get('key'), 180)
  const keyedEntry = key && Object.prototype.hasOwnProperty.call(RESEARCH_ENTRY_META, key)
    ? RESEARCH_ENTRY_META[key]
    : null
  const title = clean(keyedEntry?.title || searchParams.get('title'), 72) || '涂阿燃的网络日志'
  const description = clean(keyedEntry?.summary || searchParams.get('description'), 140)
  const category = clean(
    (keyedEntry && RESEARCH_CATEGORY_LABELS[keyedEntry.category]) || searchParams.get('category'),
    18,
  ) || '文章'
  const date = clean(keyedEntry?.date || searchParams.get('date'), 20)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 68px 54px',
          position: 'relative',
          overflow: 'hidden',
          color: '#f6f0e2',
          background: '#07141f',
          fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -220,
            width: 650,
            height: 650,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(52, 137, 159, 0.42) 0%, rgba(52, 137, 159, 0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 38,
            bottom: 0,
            width: 760,
            height: 340,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            gap: 10,
            opacity: 0.2,
          }}
        >
          {SKYLINE.map((height, index) => (
            <div
              key={`${height}-${index}`}
              style={{
                display: 'flex',
                width: index % 3 === 0 ? 44 : 30,
                height,
                borderTop: '2px solid rgba(226, 177, 92, 0.72)',
                background: 'linear-gradient(180deg, rgba(169, 211, 220, 0.54), rgba(82, 137, 151, 0.08))',
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: 220,
            background: 'linear-gradient(180deg, rgba(7, 18, 28, 0), rgba(4, 12, 19, 0.76))',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            fontSize: 21,
            letterSpacing: '0.12em',
            color: '#e2b15c',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 34, height: 3, background: '#e2b15c' }} />
            <span>2ARAN.COM · {category}</span>
          </div>
          {date ? <span style={{ color: '#a9bdc3', letterSpacing: '0.06em' }}>{date}</span> : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            position: 'relative',
            maxWidth: 1030,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 42 ? 48 : 56,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              textShadow: '0 3px 22px rgba(0, 0, 0, 0.2)',
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                display: 'flex',
                maxWidth: 990,
                fontSize: 25,
                lineHeight: 1.5,
                color: '#bdd0d4',
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            paddingTop: 20,
            borderTop: '1px solid rgba(196, 215, 218, 0.22)',
            fontSize: 19,
            color: '#d4dde0',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600, color: '#f6f0e2' }}>
            涂阿燃的网络日志
          </span>
          <span style={{ color: '#e2b15c' }}>技术 · 产品 · AI 工程</span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
      },
    },
  )
}
