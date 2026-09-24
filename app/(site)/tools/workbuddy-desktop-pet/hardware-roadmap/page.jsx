import HardwareRoadmap from './HardwareRoadmap'

export const dynamic = 'force-static'

const pageUrl = 'https://2aran.com/tools/workbuddy-desktop-pet/hardware-roadmap'
const title = '鹿鹿精灵硬件化路线图｜CoreS3-SE 原型设计与执行'
const description = '从购买 M5Stack CoreS3-SE 到完成 USB 联调、WorkBuddy 闭环和硬件接入审核材料，一页管理鹿鹿精灵的设计与执行。'

export const metadata = {
  title,
  description,
  alternates: { canonical: '/tools/workbuddy-desktop-pet/hardware-roadmap' },
  openGraph: { title, description, url: pageUrl, type: 'website' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  name: title,
  description,
  url: pageUrl,
  inLanguage: 'zh-CN',
  author: { '@type': 'Person', name: 'TUARAN', url: 'https://2aran.com' },
}

export default function LuluHardwareRoadmapPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <HardwareRoadmap />
    </>
  )
}
