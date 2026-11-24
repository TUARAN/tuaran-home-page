'use client'

import { useState } from 'react'

import HomeCoverPattern from './HomeCoverPattern'

/** 首页列表缩略图：有真实封面就用，加载失败回落到图案。 */
export default function HomeListCover({ item }) {
  const [failed, setFailed] = useState(false)
  const src = item.cover?.src

  if (!src || failed) {
    return <HomeCoverPattern id={item.id} section={item.section} />
  }

  return (
    // 封面来自文章后台与静态归档，来源不固定，原生图片免维护域名白名单。
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
