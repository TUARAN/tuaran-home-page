import SpaceXTimelineClient from './SpaceXTimelineClient'
import { getSpacexTimeline } from '../../../lib/spacexTimeline'

export const revalidate = 10_800

export const metadata = {
  title: 'SpaceX：航天体系、愿景与新闻事件线',
  description: '可视化理解 SpaceX 的运载、卫星网络、载人航天与深空运输体系，并追踪官方进展和近期发射任务。',
  alternates: { canonical: '/spacex' },
  openGraph: {
    title: 'SpaceX：从地球轨道到多行星文明',
    description: '可视化理解 SpaceX 航天体系、长期愿景与可核验新闻事件线。',
    url: '/spacex',
    type: 'website',
  },
}

export default async function SpaceXPage() {
  const timeline = await getSpacexTimeline()
  return <SpaceXTimelineClient {...timeline} />
}
