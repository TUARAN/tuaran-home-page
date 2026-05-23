const PARAMS = 'auto=format&fit=crop&w=1200&q=80'

function unsplash(id, crop = '') {
  const cropParam = crop ? `&${crop}` : ''
  return `https://images.unsplash.com/${id}?${PARAMS}${cropParam}`
}

const IMAGE_POOL = {
  developer_ecosystem: [
    {
      src: unsplash('photo-1515879218367-8466d910aaa4', 'crop=entropy&cs=tinysrgb'),
      alt: '桌面上的代码编辑器和开发环境',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1555066931-4365d14bab8c', 'crop=entropy&cs=tinysrgb'),
      alt: '开发者在笔记本电脑上编程',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1498050108023-c5249f4df085', 'crop=entropy&cs=tinysrgb'),
      alt: '工作台上的网页开发界面',
      credit: 'Unsplash',
    },
  ],
  content_community: [
    {
      src: unsplash('photo-1499750310107-5fef28a66643', 'crop=entropy&cs=tinysrgb'),
      alt: '创作者桌面与笔记本电脑',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1516321318423-f06f85e504b3', 'crop=entropy&cs=tinysrgb'),
      alt: '线上社区与数字传播场景',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1455390582262-044cdead277a', 'crop=entropy&cs=tinysrgb'),
      alt: '写作笔记与内容创作桌面',
      credit: 'Unsplash',
    },
  ],
  enterprise_software: [
    {
      src: unsplash('photo-1497366754035-f200968a6e72', 'crop=entropy&cs=tinysrgb'),
      alt: '企业办公区与协作空间',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1552664730-d307ca884978', 'crop=entropy&cs=tinysrgb'),
      alt: '团队围绕白板讨论业务系统',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1551288049-bebda4e38f71', 'crop=entropy&cs=tinysrgb'),
      alt: '数据看板和企业软件分析界面',
      credit: 'Unsplash',
    },
  ],
  cloud_communications: [
    {
      src: unsplash('photo-1516321497487-e288fb19713f', 'crop=entropy&cs=tinysrgb'),
      alt: '云端通信与网络服务工作场景',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1451187580459-43490279c0fa', 'crop=entropy&cs=tinysrgb'),
      alt: '全球网络连接的地球夜景',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1558494949-ef010cbdcc31', 'crop=entropy&cs=tinysrgb'),
      alt: '数据中心机柜与云基础设施',
      credit: 'Unsplash',
    },
  ],
  new_energy: [
    {
      src: unsplash('photo-1509391366360-2e959784a276', 'crop=entropy&cs=tinysrgb'),
      alt: '太阳能电池板阵列',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1466611653911-95081537e5b7', 'crop=entropy&cs=tinysrgb'),
      alt: '风力发电机与新能源场景',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1593941707882-a5bba14938c7', 'crop=entropy&cs=tinysrgb'),
      alt: '新能源汽车充电接口',
      credit: 'Unsplash',
    },
  ],
  devtools: [
    {
      src: unsplash('photo-1504639725590-34d0984388bd', 'crop=entropy&cs=tinysrgb'),
      alt: '终端命令行和开发工具界面',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1461749280684-dccba630e2f6', 'crop=entropy&cs=tinysrgb'),
      alt: '代码仓库和软件工程工作流',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1518773553398-650c184e0bb3', 'crop=entropy&cs=tinysrgb'),
      alt: '电子芯片与底层技术工具',
      credit: 'Unsplash',
    },
  ],
  industry: [
    {
      src: unsplash('photo-1486406146926-c627a92ad1ab', 'crop=entropy&cs=tinysrgb'),
      alt: '城市商务楼宇与产业研究场景',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1504384308090-c894fdcc538d', 'crop=entropy&cs=tinysrgb'),
      alt: '现代办公与行业分析工作台',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1497366811353-6870744d04b2', 'crop=entropy&cs=tinysrgb'),
      alt: '会议室中的商业讨论',
      credit: 'Unsplash',
    },
  ],
  tech: [
    {
      src: unsplash('photo-1518770660439-4636190af475', 'crop=entropy&cs=tinysrgb'),
      alt: '电路板与前沿技术研究',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1519389950473-47ba0277781c', 'crop=entropy&cs=tinysrgb'),
      alt: '团队围绕技术设备协作',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1558494949-ef010cbdcc31', 'crop=entropy&cs=tinysrgb'),
      alt: '服务器机房与基础设施',
      credit: 'Unsplash',
    },
  ],
  product: [
    {
      src: unsplash('photo-1559028012-481c04fa702d', 'crop=entropy&cs=tinysrgb'),
      alt: '产品设计草图和用户体验原型',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1517245386807-bb43f82c33c4', 'crop=entropy&cs=tinysrgb'),
      alt: '产品团队讨论路线图',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1460925895917-afdab827c52f', 'crop=entropy&cs=tinysrgb'),
      alt: '产品数据分析仪表盘',
      credit: 'Unsplash',
    },
  ],
  market: [
    {
      src: unsplash('photo-1551288049-bebda4e38f71', 'crop=entropy&cs=tinysrgb'),
      alt: '市场数据与增长分析图表',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1520607162513-77705c0f0d4a', 'crop=entropy&cs=tinysrgb'),
      alt: '商业街区与市场研究场景',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1521791136064-7986c2920216', 'crop=entropy&cs=tinysrgb'),
      alt: '商务合作与市场拓展',
      credit: 'Unsplash',
    },
  ],
  thesis: [
    {
      src: unsplash('photo-1455390582262-044cdead277a', 'crop=entropy&cs=tinysrgb'),
      alt: '观点写作与研究笔记',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1499750310107-5fef28a66643', 'crop=entropy&cs=tinysrgb'),
      alt: '个人研究和思考写作桌面',
      credit: 'Unsplash',
    },
    {
      src: unsplash('photo-1519389950473-47ba0277781c', 'crop=entropy&cs=tinysrgb'),
      alt: '围绕技术观点的团队讨论',
      credit: 'Unsplash',
    },
  ],
}

const SLUG_POOL_KEYS = {
  'china-dishwasher-under-2k': 'market',
  'rank-comparison-soe-civil-ming': 'industry',
  '6g-network-frontier-technologies': 'cloud_communications',
  'dify-docx-image-handling': 'product',
  'qwen3-5-edge-deployment': 'tech',
  'qwen3-6-qwen3-7-ecosystem': 'tech',
  'cross-origin-window-messaging': 'devtools',
  'codex-project-status-management': 'product',
  'multi-platform-account-posting-pricing': 'market',
}

function hash(input) {
  let value = 0
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0
  }
  return value
}

function rotate(items, seed) {
  if (!items.length) return []
  const start = hash(seed) % items.length
  return [...items.slice(start), ...items.slice(0, start)]
}

function imageKeyFor(entry) {
  if (SLUG_POOL_KEYS[entry.slug]) return SLUG_POOL_KEYS[entry.slug]
  if (entry.companyType) return entry.companyType
  if (entry.topicType) return entry.topicType
  return entry.category === 'companies' ? 'enterprise_software' : 'industry'
}

export function getResearchImages(entry) {
  const key = imageKeyFor(entry)
  const pool = IMAGE_POOL[key] || IMAGE_POOL.industry
  const count = entry.encrypted ? 1 : Math.min(3, Math.max(1, 1 + (hash(entry.slug) % 3)))
  return rotate(pool, `${entry.category}:${entry.slug}`).slice(0, count)
}
