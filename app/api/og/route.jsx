import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }

function clean(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const cityImageUrl = new URL('/images/home/guangzhou-skyline-banner.jpg', request.url).toString()
  const title = clean(searchParams.get('title'), 72) || '涂阿燃的网络日志'
  const description = clean(searchParams.get('description'), 140)
  const category = clean(searchParams.get('category'), 18) || '文章'
  const date = clean(searchParams.get('date'), 20)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 68px 54px',
          position: 'relative',
          overflow: 'hidden',
          color: '#f6f0e2',
          background: '#09141d',
          fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cityImageUrl}
          width={1200}
          height={630}
          alt=""
          style={{
            position: 'absolute',
            left: -1,
            top: -1,
            width: 1202,
            height: 632,
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: '0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            background:
              'linear-gradient(90deg, rgba(3, 11, 18, 0.92) 0%, rgba(5, 16, 25, 0.84) 58%, rgba(6, 18, 27, 0.56) 100%)',
            zIndex: '1',
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
            zIndex: '2',
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
            zIndex: '2',
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
            zIndex: '2',
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
