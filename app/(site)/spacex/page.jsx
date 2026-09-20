import SpaceXTimelineClient from './SpaceXTimelineClient'
import { getSpacexTimeline } from '../../../lib/spacexTimeline'

export const revalidate = 10_800

export const metadata = {
  title: 'SpaceX 发射记录与视频时间线：Falcon 9、Starlink、Starship 数据档案',
  description: '查询 SpaceX 历史与近期发射记录、官方视频、助推器复用、Starlink、Falcon 9 和 Starship 里程碑，并按目录直达任务档案。',
  alternates: { canonical: '/spacex' },
  openGraph: {
    title: 'SpaceX 发射记录、官方视频与里程碑时间线',
    description: '按任务查看 SpaceX 发射数据、官方影像、助推器复用记录与 Starship、Starlink 里程碑。',
    url: '/spacex',
    type: 'website',
  },
}

export default async function SpaceXPage() {
  const timeline = await getSpacexTimeline()
  return <SpaceXTimelineClient {...timeline} />
}
