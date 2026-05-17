import { ImageResponse } from 'next/og'

// 不加 runtime = 'edge'：让 build 时静态生成 PNG，避免每次 social crawler 抓取都跑 worker
export const alt = '涂阿燃（tuaran）的网络日志'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, #f8f5f0 0%, #f0ebe0 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 84px',
          fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
          color: '#221f19',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 24,
            color: '#8f8069',
            fontFamily: 'monospace',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: '#b7791f',
              borderRadius: '50%',
            }}
          />
          tuaran.me
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 108,
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              color: '#111',
            }}
          >
            涂阿燃 · 网络日志
          </div>
          <div
            style={{
              fontSize: 38,
              color: '#5d554a',
              lineHeight: 1.5,
              maxWidth: 900,
            }}
          >
            选一件值得投入二十年的事，每日复利，高频迭代。
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: '#9a8f7a',
            fontFamily: 'monospace',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 1,
                background: '#d8cfbf',
              }}
            />
            This time · with LLM
          </div>
          <div>掘金安东尼 · 安东尼 404</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
