/**
 * 资源权益目录。
 *
 * 这里是「人能看懂的资源定义」：同一个 resourceKey 在用户侧呈现为领取/打开什么，
 * 在站长侧呈现为交付方式、存储对象与运营口径。燃币价格仍由 points/gated_resources
 * 决定，目录不承担账本职责。
 */

const CATALOG = [
  {
    resourceKey: 'resource:codex-model-switcher',
    kind: 'tool',
    access: 'free',
    delivery: 'download',
    title: 'Codex 模型切换器',
    href: '/resources/codex-model-switcher',
    userDescription: '免费下载通用 macOS 应用或完整 Codex 安装 Skill。',
    adminDescription: 'Universal macOS App ZIP + self-contained Codex Skill ZIP；从 MEDIA R2 受控输出。',
    files: {
      'macos-universal': {
        objectKey: 'downloads/codex-model-switcher-macos-universal-v1.1.0.zip',
        fileName: 'codex-model-switcher-macos-universal-v1.1.0.zip',
      },
      'skill-zip': {
        objectKey: 'downloads/install-codex-model-switcher-skill-v1.0.0.zip',
        fileName: 'install-codex-model-switcher-skill-v1.0.0.zip',
      },
    },
  },
  {
    resourceKey: 'resource:x-tweet-to-pdf-extension',
    kind: 'tool',
    delivery: 'download',
    title: 'X 推文转 PDF',
    href: '/resources/x-tweet-to-pdf-extension',
    userDescription: '领取 Chrome / Edge 工具包后，可永久下载并查看安装说明。',
    adminDescription: 'Chrome MV3 ZIP；领取时写 download 事件，文件从 MEDIA R2 受控输出。',
    files: {
      'extension-zip': {
        objectKey: 'downloads/x-tweet-to-pdf-extension-v0.1.0.zip',
        fileName: 'x-tweet-to-pdf-extension-v0.1.0.zip',
      },
    },
  },
  {
    resourceKey: 'resource:x-mutual-cleaner-extension',
    kind: 'tool',
    delivery: 'download',
    title: 'X 互关清理助手',
    href: '/resources/x-mutual-cleaner-extension',
    userDescription: '领取 Chrome 工具包后，可永久下载并查看使用说明。',
    adminDescription: 'Chrome MV3 ZIP；领取时写 download 事件，文件从 MEDIA R2 受控输出。',
    files: {
      'extension-zip': {
        objectKey: 'downloads/x-mutual-cleaner-extension-v0.1.12.zip',
        fileName: 'x-mutual-cleaner-extension-v0.1.12.zip',
      },
    },
  },
  {
    resourceKey: 'resource:2aran-desktop',
    kind: 'tool',
    delivery: 'download',
    title: '2aran 桌面应用',
    href: '/resources/2aran-desktop',
    userDescription: '领取后可下载对应系统的测试版安装包，之后可重复下载。',
    adminDescription: 'Windows / macOS 安装包；按文件写 download 事件，从 MEDIA R2 受控输出。',
    files: {
      'macos-arm64': {
        objectKey: 'downloads/2aran-desktop-macos-arm64-v0.1.0.dmg',
        fileName: '2aran-desktop-macos-arm64-v0.1.0.dmg',
      },
      'macos-x64': {
        objectKey: 'downloads/2aran-desktop-macos-x64-v0.1.0.dmg',
        fileName: '2aran-desktop-macos-x64-v0.1.0.dmg',
      },
      'windows-x64': {
        objectKey: 'downloads/2aran-desktop-windows-v0.1.0.exe',
        fileName: '2aran-desktop-windows-v0.1.0.exe',
      },
    },
  },
  {
    resourceKey: 'resource:ai-music',
    kind: 'asset',
    delivery: 'external',
    title: 'GPT 不解释｜AI 音乐',
    href: '/resources/ai-music',
    userDescription: '免费跳转网易云音乐播放；本站只保留作品卡片和打开记录。',
    adminDescription: '外部音乐平台跳转；写 external_open 事件，不存储、不代理音频文件。',
    externalUrl: 'https://music.163.com/#/song?id=3404858039',
  },
  {
    resourceKey: 'resource:wallpapers',
    kind: 'asset',
    delivery: 'download',
    title: '壁纸下载',
    href: '/resources/wallpapers',
    userDescription: '免费领取原图；每次下载会记入你的领取记录。',
    adminDescription: '壁纸元数据来自 wallpapers；按单张写 download 事件，从 MEDIA R2 输出原图。',
    dynamicFile: 'wallpaper',
  },
  {
    resourceKey: 'resource:organic-pv-value-2025-2026',
    kind: 'asset',
    delivery: 'download',
    title: '自然流量 PV 价值综合调研表（2025—2026）',
    href: '/articles/research/topics/organic-pv-value-2025-2026',
    userDescription: '免费下载分平台、分行业的自然流量 PV 价值区间估算表。',
    adminDescription: '行业分析配套 XLSX；免费领取并记录下载事件，从 MEDIA R2 受控输出。',
    files: {
      'research-workbook': {
        objectKey: 'downloads/organic-pv-value-research-2025-2026.xlsx',
        fileName: '自然流量PV价值综合调研表（2025-2026年）.xlsx',
      },
    },
  },
]

const BY_KEY = new Map(CATALOG.map((item) => [item.resourceKey, item]))

export function getResourceCatalogItem(resourceKey) {
  return BY_KEY.get(String(resourceKey || '').trim()) || null
}

export function listResourceCatalogForAdmin() {
  return CATALOG.map(({ files, externalUrl, ...item }) => ({
    ...item,
    fileKeys: files ? Object.keys(files) : [],
    hasExternalTarget: !!externalUrl,
  }))
}

export function getResourceDelivery(resourceKey, fileKey = '') {
  const item = getResourceCatalogItem(resourceKey)
  if (!item) return null
  if (item.delivery === 'external') {
    return item.externalUrl ? { ...item, fileKey: '', externalUrl: item.externalUrl } : null
  }
  if (item.dynamicFile) return { ...item, fileKey: String(fileKey || '').trim(), dynamicFile: item.dynamicFile }
  const key = String(fileKey || '').trim()
  const file = item.files?.[key]
  return file ? { ...item, fileKey: key, ...file } : null
}

export function resourceUserLabel(item) {
  if (!item) return '资源'
  if (item.kind === 'tool') return '工具包'
  if (item.delivery === 'external') return '外部作品'
  return '资源'
}
