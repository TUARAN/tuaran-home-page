/**
 * 活动页归档注册表。
 *
 * 新活动结束后：
 * 1. 将公开页面迁到 archivePath，并让 originalPath 永久跳转；
 * 2. 撤下首页、导航、工具箱、Sitemap 等活动入口；
 * 3. 停止写入型任务，把保留资产与撤下入口登记到这里。
 *
 * 后台 /admin/archives 会自动展示这里的全部记录。
 */
export const ACTIVITY_ARCHIVES = [
  {
    id: 'agent-world-cup-2026',
    slug: 'agent-world-cup',
    title: 'Agent 世界杯 2026',
    type: '活动专题',
    status: 'archived',
    originalPath: '/agent-world-cup',
    archivePath: '/archives/agent-world-cup',
    startedAt: '2026-06-11',
    endedAt: '2026-07-19',
    archivedAt: '2026-07-21',
    summary: '2026 FIFA 世界杯赛程、分组、积分榜、排行榜与竞猜活动页面。',
    preservedAssets: ['归档展示页', '历史赛程与榜单读取接口', 'D1 历史比赛及竞猜记录', '旧地址永久跳转'],
    retiredSurfaces: ['首页活动热条', '主导航入口', '工具箱活动卡片', '公开 Sitemap', '每 3 小时采集任务', '竞猜写入'],
    notes: '归档页只读展示最后一次采集结果，不再自动刷新；历史竞猜记录保留但不可新增或修改。',
  },
]

export function getActivityArchive(slug) {
  return ACTIVITY_ARCHIVES.find((item) => item.slug === slug) || null
}

export function getActivityArchiveStats() {
  return {
    total: ACTIVITY_ARCHIVES.length,
    archived: ACTIVITY_ARCHIVES.filter((item) => item.status === 'archived').length,
    preservedAssets: ACTIVITY_ARCHIVES.reduce((sum, item) => sum + item.preservedAssets.length, 0),
  }
}
