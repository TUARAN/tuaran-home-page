import { HOME_SECTION_COUPLETS } from '../../../lib/home/homeSectionCouplets.mjs'

export default function HomeSectionCouplet({ section }) {
  const text = HOME_SECTION_COUPLETS[section]
  if (!text) return null

  return (
    <p className="home-section-couplet" lang="zh-CN">
      {text}
    </p>
  )
}
