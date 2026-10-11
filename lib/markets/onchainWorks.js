import { TAPEOUT_XIANGQI_RELEASE } from './tapeoutXiangqi'

/**
 * 链上作品的唯一公开注册表。
 *
 * 新作品上线时只在这里追加条目，/onchain-blog 会自动形成合集。
 * release 记录的是某次可核验发布；作品入口可以升级，但已经发生的交易和哈希不会被改写。
 */
export const ONCHAIN_WORKS = Object.freeze([
  Object.freeze({
    slug: 'tapeout-xiangqi',
    sequence: '001',
    title: '链上中国象棋',
    subtitle: '一盘不依赖本站服务器也能打开的中国象棋',
    description: '棋盘、完整走子规则、本地 Minimax + Alpha-Beta AI 和对局记录被压进单个静态文件，并写入 BNB Chain 上的 TapeKit 容器。',
    status: 'live',
    statusLabel: '主网运行中',
    network: 'BNB Smart Chain',
    protocol: 'TapeOut / TapeKit',
    media: '/images/tapeout-xiangqi-launch.png',
    href: '/tapeout-xiangqi',
    liveHref: TAPEOUT_XIANGQI_RELEASE.publicUrl,
    release: Object.freeze({
      version: TAPEOUT_XIANGQI_RELEASE.latestUpgrade.version,
      releasedAt: TAPEOUT_XIANGQI_RELEASE.latestUpgrade.updatedAt,
      tapeId: TAPEOUT_XIANGQI_RELEASE.tapeId,
      container: TAPEOUT_XIANGQI_RELEASE.container,
      fileSize: TAPEOUT_XIANGQI_RELEASE.latestUpgrade.fileSize,
      sha256: TAPEOUT_XIANGQI_RELEASE.latestUpgrade.sha256,
      transactionHash: TAPEOUT_XIANGQI_RELEASE.latestUpgrade.transactionHash,
      explorerHref: `https://bscscan.com/tx/${TAPEOUT_XIANGQI_RELEASE.latestUpgrade.transactionHash}`,
      statusHref: TAPEOUT_XIANGQI_RELEASE.statusUrl,
    }),
    capabilities: Object.freeze(['无需钱包即可玩', '浏览器本地 AI', '单文件链上版本', '发布交易可核对']),
  }),
])

export const ONCHAIN_COLLECTION_STATS = Object.freeze({
  liveWorks: ONCHAIN_WORKS.filter((work) => work.status === 'live').length,
  networks: new Set(ONCHAIN_WORKS.map((work) => work.network)).size,
  latestReleaseAt: ONCHAIN_WORKS.at(0)?.release.releasedAt || '',
})
