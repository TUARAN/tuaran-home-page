import { ImageResponse } from 'next/og'
import { getAllFeedItems } from '../data'
import { avatarAbsoluteUrl } from '../../../../../lib/avatar'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = 'https://2aran.com'

const TYPE_ACCENT = {
  video: '#ff4d6a',
  image: '#6c5ce7',
  link: '#00a978',
  quote: '#f5a623',
}

const TYPE_LABEL = {
  video: 'Video · 视频',
  image: 'Image · 图片',
  link: 'Resource · 资源',
  quote: 'Take · 观点',
}

function truncate(text, max) {
  if (!text) return ''
  const t = String(text).replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

export async function generateStaticParams() {
  return getAllFeedItems().map((item) => ({ id: item.id }))
}

export default async function FeedItemOgImage({ params }) {
  const { id } = await params
  const items = getAllFeedItems()
  const item = items.find((i) => i.id === id)

  const accent = TYPE_ACCENT[item?.type] || '#7352a2'
  const typeLabel = TYPE_LABEL[item?.type] || '灵感'
  const title = truncate(item?.title || '灵感', 48)
  const summary = truncate(item?.summary || item?.quote || '', 80)
  const avatarUrl = avatarAbsoluteUrl(SITE_URL)

  // 确定主图 URL（用于图片/视频/链接类型作为背景）
  let mediaUrl = null
  if (item?.type === 'image' && item?.src) {
    mediaUrl = item.src.startsWith('http') ? item.src : `${SITE_URL}${item.src}`
  } else if (item?.type === 'video' && item?.poster) {
    mediaUrl = item.poster.startsWith('http') ? item.poster : `${SITE_URL}${item.poster}`
  } else if (item?.type === 'link' && item?.image) {
    mediaUrl = item.image.startsWith('http') ? item.image : `${SITE_URL}${item.image}`
  }

  // 有图的类型：左半部图片 + 右半部文字
  if (mediaUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: '#f0f1ee',
            fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
          }}
        >
          {/* 左侧图片区，占 55% */}
          <div style={{ width: '55%', height: '100%', position: 'relative', display: 'flex' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              alt=""
            />
            {/* 右侧渐变遮罩，使图文融合 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '120px',
                height: '100%',
                background: 'linear-gradient(to right, transparent, #f0f1ee)',
              }}
            />
          </div>

          {/* 右侧文字区 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '52px 52px 52px 32px',
            }}
          >
            {/* 顶部类型标签 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 18,
                color: accent,
                fontFamily: 'monospace',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: accent,
                  flexShrink: 0,
                }}
              />
              {typeLabel}
            </div>

            {/* 标题 + 摘要 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  fontSize: title.length > 20 ? 34 : 42,
                  fontWeight: 700,
                  lineHeight: 1.22,
                  color: '#1a1813',
                  borderLeft: `5px solid ${accent}`,
                  paddingLeft: 20,
                }}
              >
                {title}
              </div>
              {summary ? (
                <div
                  style={{
                    fontSize: 20,
                    color: '#51514a',
                    lineHeight: 1.55,
                    paddingLeft: 25,
                  }}
                >
                  {summary}
                </div>
              ) : null}
            </div>

            {/* 底部品牌栏 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 17,
                color: '#85887a',
                fontFamily: 'monospace',
                letterSpacing: '0.16em',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                width={36}
                height={36}
                alt=""
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '2px solid #c8c9bf',
                  objectFit: 'cover',
                }}
              />
              <span>2aran.com · 灵感</span>
            </div>
          </div>
        </div>
      ),
      { ...size }
    )
  }

  // 无图（quote / 无封面 video）：全文字布局
  const quoteText = truncate(item?.quote || item?.summary || '', 100)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, #f0f1ee 0%, #e6e7e0 100%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 80px',
          fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
          color: '#15140f',
          position: 'relative',
        }}
      >
        {/* 背景装饰：accent 色光晕 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 90% 10%, ${accent}22, transparent 45%)`,
          }}
        />

        {/* 顶部类型标签 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 20,
            color: accent,
            fontFamily: 'monospace',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              background: accent,
            }}
          />
          2aran.com · {typeLabel}
        </div>

        {/* 中部引述文字 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            zIndex: 1,
          }}
        >
          {item?.type === 'quote' ? (
            <div
              style={{
                fontSize: quoteText.length > 40 ? 36 : 48,
                fontWeight: 600,
                lineHeight: 1.4,
                color: '#1a1813',
                borderLeft: `6px solid ${accent}`,
                paddingLeft: 32,
                fontStyle: 'italic',
              }}
            >
              {quoteText}
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: title.length > 24 ? 40 : 52,
                  fontWeight: 700,
                  lineHeight: 1.22,
                  color: '#1a1813',
                  borderLeft: `6px solid ${accent}`,
                  paddingLeft: 32,
                }}
              >
                {title}
              </div>
              {summary ? (
                <div
                  style={{
                    fontSize: 24,
                    color: '#51514a',
                    lineHeight: 1.55,
                    paddingLeft: 38,
                  }}
                >
                  {summary}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* 底部：头像 + 品牌 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 19,
            color: '#85887a',
            fontFamily: 'monospace',
            letterSpacing: '0.16em',
            zIndex: 1,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            width={44}
            height={44}
            alt=""
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '3px solid #c8c9bf',
              objectFit: 'cover',
            }}
          />
          <span>涂阿燃 · 灵感 · 2aran.com</span>
          {item?.author ? (
            <>
              <div style={{ width: 24, height: 1, background: '#c8c9bf' }} />
              <span>{item.author}</span>
            </>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  )
}
