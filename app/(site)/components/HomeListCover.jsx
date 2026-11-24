'use client'

import { useState } from 'react'

import HomeCoverPattern from './HomeCoverPattern'

/**
 * 列表缩略图：有真实配图就用，没有或加载失败时回落到图案。
 * `/articles` 内容目录行在用；图案按 `section:id` 确定，服务端渲染与 hydration 一致。
 */
export default function HomeListCover({ id, section, src, alt = '' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <HomeCoverPattern id={id} section={section} />
  }

  return (
    // 配图来自调研登记与文章后台，来源不固定，原生图片免维护域名白名单。
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  )
}
