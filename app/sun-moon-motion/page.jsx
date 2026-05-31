import SunMoonMotionClient from './SunMoonMotionClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '日月运行交互可视化专题',
  description:
    '个人专题专研用的日月运行交互可视化：用日心视角探索太阳中心、地球公转与自转、月球绕地运行与月相变化。',
  alternates: {
    canonical: '/sun-moon-motion',
  },
}

export default function SunMoonMotionPage() {
  return <SunMoonMotionClient />
}
