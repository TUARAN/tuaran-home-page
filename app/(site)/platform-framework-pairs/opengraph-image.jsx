import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Cloudflare 收购 VoidZero vs Vercel 收购 Next：双巨头割据前端、AI 原生 Web 时代产业深度研判'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '64px 72px',
          background:
            'linear-gradient(135deg, #fbf3e3 0%, #f7ecd2 50%, #fbf3e3 100%)',
          fontFamily: '"PingFang SC", "Noto Sans SC", sans-serif',
          color: '#221f19',
          position: 'relative',
        }}
      >
        {/* 顶部 brand bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: '#8a5a14',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <span>2aran.com · Featured Research</span>
          <span
            style={{
              backgroundColor: '#f4d4cf',
              color: '#8b3a36',
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: 18,
              letterSpacing: '0.16em',
            }}
          >
            2026-06-04 · 已确认
          </span>
        </div>

        {/* 主标题块 */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            marginTop: 24,
            paddingLeft: 28,
            borderLeft: '6px solid #b7791f',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.25,
              color: '#1a1813',
              letterSpacing: '-0.01em',
            }}
          >
            Cloudflare 收购 VoidZero
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.25,
              color: '#1a1813',
              letterSpacing: '-0.01em',
              marginTop: 4,
            }}
          >
            vs Vercel 收购 Next
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#5d503f',
              marginTop: 22,
              lineHeight: 1.4,
            }}
          >
            双巨头割据前端 · AI 原生 Web 时代产业深度研判
          </div>
        </div>

        {/* 底部 footer：时间线 + meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: '1px dashed #cbb796',
            fontSize: 20,
            color: '#8f8069',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {[
              { color: '#b7791f', label: '2016' },
              { color: '#b7791f', label: '2020' },
              { color: '#b7791f', label: '2024' },
              { color: '#a05a3c', label: '2026-06' },
            ].map((s, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: s.color,
                  }}
                />
                <span
                  style={{
                    color: i === 3 ? '#a05a3c' : '#8a5a14',
                    fontWeight: i === 3 ? 700 : 500,
                  }}
                >
                  {s.label}
                </span>
                {i < 3 ? (
                  <span style={{ color: '#cbb796', fontSize: 18 }}>—</span>
                ) : null}
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 600, color: '#5d503f' }}>10 节框架 + 10 组配对</div>
        </div>
      </div>
    ),
    size
  )
}
