import SpaceXTimelineClient from './SpaceXTimelineClient'
import { getSpacexTimeline } from '../../../lib/spacexTimeline'

export const revalidate = 10_800

export const metadata = {
  title: 'SpaceX 时间线：马斯克观点、官方表述与发射任务',
  description: '按时间查看马斯克的航天观点、SpaceX 官方表述，以及近期与即将进行的 SpaceX 发射任务。',
  alternates: { canonical: '/spacex' },
  openGraph: {
    title: 'SpaceX 时间线',
    description: '马斯克观点、SpaceX 官方表述与可核验发射任务。',
    url: '/spacex',
    type: 'website',
  },
}

export default async function SpaceXPage() {
  const timeline = await getSpacexTimeline()
  return <SpaceXTimelineClient {...timeline} />
}
