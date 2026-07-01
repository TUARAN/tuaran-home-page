const PARAMS = 'auto=format&fit=crop&w=1200&q=80'

function unsplash(id, crop = 'crop=entropy&cs=tinysrgb') {
  const cropParam = crop ? `&${crop}` : ''
  const origin = `https://images.unsplash.com/${id}?${PARAMS}${cropParam}`
  return `https://wsrv.nl/?url=${encodeURIComponent(origin)}`
}

// 通用「氛围」池：风景 / 艺术 / 思考 / 城市
// 这四个池作为底层素材，给 thesis / writing 等非纯科技主题文章直接抽，
// 也用来稀释科技类 pool 的重复感（getResearchImages 里会按类型混入）。

const LANDSCAPE_POOL = [
  { src: unsplash('photo-1506905925346-21bda4d32df4'), alt: '群山倒影于平静湖面', credit: 'Unsplash' },
  { src: unsplash('photo-1470071459604-3b5ec3a7fe05'), alt: '云雾缭绕的山脊', credit: 'Unsplash' },
  { src: unsplash('photo-1501785888041-af3ef285b470'), alt: '高山湖泊与远山', credit: 'Unsplash' },
  { src: unsplash('photo-1469474968028-56623f02e42e'), alt: '林间小径斜光', credit: 'Unsplash' },
  { src: unsplash('photo-1472214103451-9374bd1c798e'), alt: '连绵绿丘与孤树', credit: 'Unsplash' },
  { src: unsplash('photo-1418065460487-3e41a6c84dc5'), alt: '日落时的远山剪影', credit: 'Unsplash' },
  { src: unsplash('photo-1447752875215-b2761acb3c5d'), alt: '高耸森林的仰望视角', credit: 'Unsplash' },
  { src: unsplash('photo-1426604966848-d7adac402bff'), alt: '雪山与平原的辽阔感', credit: 'Unsplash' },
  { src: unsplash('photo-1414609245224-afa02bfb3fda'), alt: '海岸落日的余晖', credit: 'Unsplash' },
  { src: unsplash('photo-1505118380757-91f5f5632de0'), alt: '海岸礁石与浪花', credit: 'Unsplash' },
]

const ART_POOL = [
  { src: unsplash('photo-1547891654-e66ed7ebb968'), alt: '抽象色彩与笔触', credit: 'Unsplash' },
  { src: unsplash('photo-1531913764164-f85c52e6e654'), alt: '几何抽象画面', credit: 'Unsplash' },
  { src: unsplash('photo-1513151233558-d860c5398176'), alt: '极简建筑结构', credit: 'Unsplash' },
  { src: unsplash('photo-1579783901586-d88db74b4fe4'), alt: '纹理质感特写', credit: 'Unsplash' },
  { src: unsplash('photo-1488229297570-58520851e868'), alt: '现代画廊空间', credit: 'Unsplash' },
  { src: unsplash('photo-1496318447583-f524534e9ce1'), alt: '光影斜射的几何走廊', credit: 'Unsplash' },
  { src: unsplash('photo-1567095761054-7a02e69e5c43'), alt: '色块组合的视觉构图', credit: 'Unsplash' },
  { src: unsplash('photo-1549490349-8643362247b5'), alt: '雕塑与光影', credit: 'Unsplash' },
]

const REFLECTION_POOL = [
  { src: unsplash('photo-1488998427799-e3362cec87c3'), alt: '雨天窗前的书与咖啡', credit: 'Unsplash' },
  { src: unsplash('photo-1499209974431-9dddcece7f88'), alt: '雨水滑落玻璃窗', credit: 'Unsplash' },
  { src: unsplash('photo-1474073705359-5da2a8270c64'), alt: '陈年书架的纵深', credit: 'Unsplash' },
  { src: unsplash('photo-1532012197267-da84d127e765'), alt: '摊开的书页与笔', credit: 'Unsplash' },
  { src: unsplash('photo-1493612276216-ee3925520721'), alt: '棋盘上的对峙', credit: 'Unsplash' },
  { src: unsplash('photo-1490578474895-699cd4e2cf59'), alt: '原野中的孤独树', credit: 'Unsplash' },
  { src: unsplash('photo-1518795744065-0066f95cb2da'), alt: '远眺山海的剪影', credit: 'Unsplash' },
  { src: unsplash('photo-1481627834876-b7833e8f5570'), alt: '茶与书的静物', credit: 'Unsplash' },
  { src: unsplash('photo-1542273917363-3b1817f69a2d'), alt: '秋林中的小径', credit: 'Unsplash' },
  { src: unsplash('photo-1505765050516-f72dcac9c60e'), alt: '沙漠中的脚印', credit: 'Unsplash' },
]

const URBAN_POOL = [
  { src: unsplash('photo-1480714378408-67cf0d13bc1b'), alt: '城市夜景的天际线', credit: 'Unsplash' },
  { src: unsplash('photo-1449824913935-59a10b8d2000'), alt: '俯瞰城市街区', credit: 'Unsplash' },
  { src: unsplash('photo-1502920917128-1aa500764cbd'), alt: '东京霓虹街头', credit: 'Unsplash' },
  { src: unsplash('photo-1487958449943-2429e8be8625'), alt: '现代建筑的几何立面', credit: 'Unsplash' },
  { src: unsplash('photo-1496588152823-86ff7695e68f'), alt: '玻璃幕墙的反射', credit: 'Unsplash' },
  { src: unsplash('photo-1444723121867-7a241cacace9'), alt: '地铁站台的瞬间', credit: 'Unsplash' },
  { src: unsplash('photo-1517760444937-f6397edcbbcd'), alt: '城市清晨的薄雾', credit: 'Unsplash' },
  { src: unsplash('photo-1465447142348-e9952c393450'), alt: '城市夜雨与车灯', credit: 'Unsplash' },
]

// 2026-06 追加的「编辑 / 氛围」混合池：现代办公、工程、协作、城市与自然，
// 全部经 wsrv 验活。作为新素材直接抽，也混入下方 tech / product / market / industry 等
// 高复用池，稀释老图的重复感。
const EDITORIAL_POOL = [
  { src: unsplash('photo-1550751827-4bd374c3f58b'), alt: '深色调的科技质感画面', credit: 'Unsplash' },
  { src: unsplash('photo-1518186285589-2f7649de83e0'), alt: '屏幕上的代码微距', credit: 'Unsplash' },
  { src: unsplash('photo-1526628953301-3e589a6a8b74'), alt: '夜间工作台的光影', credit: 'Unsplash' },
  { src: unsplash('photo-1454165804606-c3d57bc86b40'), alt: '笔记本上的数据分析', credit: 'Unsplash' },
  { src: unsplash('photo-1553877522-43269d4ea984'), alt: '数据可视化界面', credit: 'Unsplash' },
  { src: unsplash('photo-1552581234-26160f608093'), alt: '团队围坐讨论', credit: 'Unsplash' },
  { src: unsplash('photo-1543286386-713bdd548da4'), alt: '键盘与工作细节', credit: 'Unsplash' },
  { src: unsplash('photo-1531973576160-7125cd663d86'), alt: '专注编码的侧影', credit: 'Unsplash' },
  { src: unsplash('photo-1497215728101-856f4ea42174'), alt: '明亮的现代办公空间', credit: 'Unsplash' },
  { src: unsplash('photo-1522071820081-009f0129c71c'), alt: '创意团队工作场景', credit: 'Unsplash' },
  { src: unsplash('photo-1531482615713-2afd69097998'), alt: '设计与草图工作台', credit: 'Unsplash' },
  { src: unsplash('photo-1483058712412-4245e9b90334'), alt: '笔记本与工作台俯拍', credit: 'Unsplash' },
  { src: unsplash('photo-1519085360753-af0119f7cbe7'), alt: '深色背景的代码流', credit: 'Unsplash' },
  { src: unsplash('photo-1454779132693-e5cd0a216ed3'), alt: '摩天楼的仰视线条', credit: 'Unsplash' },
  { src: unsplash('photo-1517048676732-d65bc937f952'), alt: '会议室里的协作', credit: 'Unsplash' },
  { src: unsplash('photo-1522202176988-66273c2fd55f'), alt: '并肩工作的两人', credit: 'Unsplash' },
  { src: unsplash('photo-1600880292203-757bb62b4baf'), alt: '办公桌前的讨论', credit: 'Unsplash' },
  { src: unsplash('photo-1504384764586-bb4cdc1707b0'), alt: '俯瞰城市街区', credit: 'Unsplash' },
  { src: unsplash('photo-1519681393784-d120267933ba'), alt: '夜色下的山谷星空', credit: 'Unsplash' },
]

const IMAGE_POOL = {
  developer_ecosystem: [
    { src: unsplash('photo-1515879218367-8466d910aaa4'), alt: '桌面上的代码编辑器和开发环境', credit: 'Unsplash' },
    { src: unsplash('photo-1555066931-4365d14bab8c'), alt: '开发者在笔记本电脑上编程', credit: 'Unsplash' },
    { src: unsplash('photo-1498050108023-c5249f4df085'), alt: '工作台上的网页开发界面', credit: 'Unsplash' },
    { src: unsplash('photo-1504384308090-c894fdcc538d'), alt: '现代工作站', credit: 'Unsplash' },
    { src: unsplash('photo-1542831371-29b0f74f9713'), alt: '夜色中的多屏开发环境', credit: 'Unsplash' },
    { src: unsplash('photo-1517694712202-14dd9538aa97'), alt: '键盘与代码特写', credit: 'Unsplash' },
    { src: unsplash('photo-1581091226825-a6a2a5aee158'), alt: '专注调试的双手', credit: 'Unsplash' },
    { src: unsplash('photo-1518770660439-4636190af475'), alt: '电路板与构件', credit: 'Unsplash' },
  ],
  content_community: [
    { src: unsplash('photo-1499750310107-5fef28a66643'), alt: '创作者桌面与笔记本电脑', credit: 'Unsplash' },
    { src: unsplash('photo-1516321318423-f06f85e504b3'), alt: '线上社区与数字传播场景', credit: 'Unsplash' },
    { src: unsplash('photo-1455390582262-044cdead277a'), alt: '写作笔记与内容创作桌面', credit: 'Unsplash' },
    { src: unsplash('photo-1486312338219-ce68d2c6f44d'), alt: '直播或对谈场景', credit: 'Unsplash' },
    { src: unsplash('photo-1432888622747-4eb9a8efeb07'), alt: '咖啡桌前的写作时刻', credit: 'Unsplash' },
    { src: unsplash('photo-1531403009284-440f080d1e12'), alt: '社交媒体仪表板', credit: 'Unsplash' },
    { src: unsplash('photo-1521737711867-e3b97375f902'), alt: '观众与讲者的连接', credit: 'Unsplash' },
    { src: unsplash('photo-1542435503-956c469947f6'), alt: '内容编辑工作流', credit: 'Unsplash' },
  ],
  enterprise_software: [
    { src: unsplash('photo-1497366754035-f200968a6e72'), alt: '企业办公区与协作空间', credit: 'Unsplash' },
    { src: unsplash('photo-1552664730-d307ca884978'), alt: '团队围绕白板讨论业务系统', credit: 'Unsplash' },
    { src: unsplash('photo-1551288049-bebda4e38f71'), alt: '数据看板和企业软件分析界面', credit: 'Unsplash' },
    { src: unsplash('photo-1497366811353-6870744d04b2'), alt: '会议室中的商业讨论', credit: 'Unsplash' },
    { src: unsplash('photo-1582213782179-e0d53f98f2ca'), alt: '玻璃会议室的协作', credit: 'Unsplash' },
    { src: unsplash('photo-1573164574572-cb89e39749b4'), alt: '企业架构图', credit: 'Unsplash' },
    { src: unsplash('photo-1542744173-8e7e53415bb0'), alt: '团队战略复盘', credit: 'Unsplash' },
    { src: unsplash('photo-1542626991-cbc4e32524cc'), alt: '远程会议屏幕', credit: 'Unsplash' },
  ],
  cloud_communications: [
    { src: unsplash('photo-1516321497487-e288fb19713f'), alt: '云端通信与网络服务工作场景', credit: 'Unsplash' },
    { src: unsplash('photo-1451187580459-43490279c0fa'), alt: '全球网络连接的地球夜景', credit: 'Unsplash' },
    { src: unsplash('photo-1558494949-ef010cbdcc31'), alt: '数据中心机柜与云基础设施', credit: 'Unsplash' },
    { src: unsplash('photo-1545987796-200677ee1011'), alt: '密集光纤接线', credit: 'Unsplash' },
    { src: unsplash('photo-1573164713988-8665fc963095'), alt: '机房散热阵列', credit: 'Unsplash' },
    { src: unsplash('photo-1551808525-51a94da548ce'), alt: '通讯卫星轨道概念图', credit: 'Unsplash' },
    { src: unsplash('photo-1483356055170-1d8d72bdcc4d'), alt: '电信塔与黄昏天空', credit: 'Unsplash' },
    { src: unsplash('photo-1614332287897-cdc485fa562d'), alt: '5G 时代的城市连接', credit: 'Unsplash' },
  ],
  new_energy: [
    { src: unsplash('photo-1509391366360-2e959784a276'), alt: '太阳能电池板阵列', credit: 'Unsplash' },
    { src: unsplash('photo-1466611653911-95081537e5b7'), alt: '风力发电机与新能源场景', credit: 'Unsplash' },
    { src: unsplash('photo-1593941707882-a5bba14938c7'), alt: '新能源汽车充电接口', credit: 'Unsplash' },
    { src: unsplash('photo-1497435334941-8c899ee9e8e9'), alt: '光伏屋顶', credit: 'Unsplash' },
    { src: unsplash('photo-1532601224476-15c79f2f7a51'), alt: '夕阳下的风电机组', credit: 'Unsplash' },
    { src: unsplash('photo-1473341304170-971dccb5ac1e'), alt: '电动车线条特写', credit: 'Unsplash' },
    { src: unsplash('photo-1466692476868-aef1dfb1e735'), alt: '草地上的风电场远景', credit: 'Unsplash' },
    { src: unsplash('photo-1611365892117-bce8c8b9e64c'), alt: '储能电池模组', credit: 'Unsplash' },
  ],
  devtools: [
    { src: unsplash('photo-1504639725590-34d0984388bd'), alt: '终端命令行和开发工具界面', credit: 'Unsplash' },
    { src: unsplash('photo-1461749280684-dccba630e2f6'), alt: '代码仓库和软件工程工作流', credit: 'Unsplash' },
    { src: unsplash('photo-1518773553398-650c184e0bb3'), alt: '电子芯片与底层技术工具', credit: 'Unsplash' },
    { src: unsplash('photo-1551033406-611cf9a28f67'), alt: 'IDE 多分屏', credit: 'Unsplash' },
    { src: unsplash('photo-1546900703-cf06143d1239'), alt: '调试日志输出', credit: 'Unsplash' },
    { src: unsplash('photo-1485827404703-89b55fcc595e'), alt: 'CLI 工具特写', credit: 'Unsplash' },
    { src: unsplash('photo-1623282033815-40b05d96c903'), alt: '工程仪表盘', credit: 'Unsplash' },
    { src: unsplash('photo-1517694712202-14dd9538aa97'), alt: '机械键盘细节', credit: 'Unsplash' },
  ],
  industry: [
    { src: unsplash('photo-1486406146926-c627a92ad1ab'), alt: '城市商务楼宇与产业研究场景', credit: 'Unsplash' },
    { src: unsplash('photo-1504384308090-c894fdcc538d'), alt: '现代办公与行业分析工作台', credit: 'Unsplash' },
    { src: unsplash('photo-1497366811353-6870744d04b2'), alt: '会议室中的商业讨论', credit: 'Unsplash' },
    { src: unsplash('photo-1573164574572-cb89e39749b4'), alt: '行业结构图', credit: 'Unsplash' },
    { src: unsplash('photo-1568992687947-868a62a9f521'), alt: '工厂自动化产线', credit: 'Unsplash' },
    { src: unsplash('photo-1519642918688-7e43b19245d8'), alt: '集装箱与物流', credit: 'Unsplash' },
    { src: unsplash('photo-1444723121867-7a241cacace9'), alt: '商务街区人流', credit: 'Unsplash' },
    { src: unsplash('photo-1573497019418-b400bb3ab074'), alt: '行业研究文档', credit: 'Unsplash' },
  ],
  tech: [
    { src: unsplash('photo-1518770660439-4636190af475'), alt: '电路板与前沿技术研究', credit: 'Unsplash' },
    { src: unsplash('photo-1519389950473-47ba0277781c'), alt: '团队围绕技术设备协作', credit: 'Unsplash' },
    { src: unsplash('photo-1558494949-ef010cbdcc31'), alt: '服务器机房与基础设施', credit: 'Unsplash' },
    { src: unsplash('photo-1620712943543-bcc4688e7485'), alt: 'AI 神经网络可视化', credit: 'Unsplash' },
    { src: unsplash('photo-1526374965328-7f61d4dc18c5'), alt: '抽象数据流光带', credit: 'Unsplash' },
    { src: unsplash('photo-1517694712202-14dd9538aa97'), alt: '黑色键盘与冷光', credit: 'Unsplash' },
    { src: unsplash('photo-1531297484001-80022131f5a1'), alt: '芯片与电路特写', credit: 'Unsplash' },
    { src: unsplash('photo-1581091226825-a6a2a5aee158'), alt: '深夜专注的工程师', credit: 'Unsplash' },
    { src: unsplash('photo-1591696205602-2f950c417cb9'), alt: '机器人手臂', credit: 'Unsplash' },
    // 给 tech 大池混入一些非工程图，缓解 23 篇文章共享的视觉疲劳
    LANDSCAPE_POOL[0],
    REFLECTION_POOL[2],
    ART_POOL[2],
  ],
  product: [
    { src: unsplash('photo-1559028012-481c04fa702d'), alt: '产品设计草图和用户体验原型', credit: 'Unsplash' },
    { src: unsplash('photo-1517245386807-bb43f82c33c4'), alt: '产品团队讨论路线图', credit: 'Unsplash' },
    { src: unsplash('photo-1460925895917-afdab827c52f'), alt: '产品数据分析仪表盘', credit: 'Unsplash' },
    { src: unsplash('photo-1586717791821-3f44a563fa4c'), alt: '原型纸面草稿', credit: 'Unsplash' },
    { src: unsplash('photo-1559136555-9303baea8ebd'), alt: 'UI 组件库', credit: 'Unsplash' },
    { src: unsplash('photo-1542744173-8e7e53415bb0'), alt: '产品评审会议', credit: 'Unsplash' },
    { src: unsplash('photo-1499951360447-b19be8fe80f5'), alt: '便利贴上的需求', credit: 'Unsplash' },
    { src: unsplash('photo-1551434678-e076c223a692'), alt: '设计师协作', credit: 'Unsplash' },
  ],
  market: [
    { src: unsplash('photo-1551288049-bebda4e38f71'), alt: '市场数据与增长分析图表', credit: 'Unsplash' },
    { src: unsplash('photo-1520607162513-77705c0f0d4a'), alt: '商业街区与市场研究场景', credit: 'Unsplash' },
    { src: unsplash('photo-1521791136064-7986c2920216'), alt: '商务合作与市场拓展', credit: 'Unsplash' },
    { src: unsplash('photo-1611974789855-9c2a0a7236a3'), alt: '股票走势图', credit: 'Unsplash' },
    { src: unsplash('photo-1559526324-4b87b5e36e44'), alt: '货架商品对比', credit: 'Unsplash' },
    { src: unsplash('photo-1565008447742-97f6f38c985c'), alt: '市场调研访谈', credit: 'Unsplash' },
    { src: unsplash('photo-1542223616-740d5dff7f56'), alt: '消费者画像', credit: 'Unsplash' },
    { src: unsplash('photo-1556761175-5973dc0f32e7'), alt: '财经数据看板', credit: 'Unsplash' },
  ],
  // thesis = 观点 / 随笔。把风景 / 艺术 / 思考类素材直接合并进来，
  // 让这类长文每篇都自带「非工程图」的呼吸感。
  thesis: [
    { src: unsplash('photo-1455390582262-044cdead277a'), alt: '观点写作与研究笔记', credit: 'Unsplash' },
    { src: unsplash('photo-1499750310107-5fef28a66643'), alt: '个人研究和思考写作桌面', credit: 'Unsplash' },
    ...REFLECTION_POOL,
    ...LANDSCAPE_POOL.slice(0, 6),
    ...ART_POOL.slice(0, 4),
  ],
  writing: [
    { src: unsplash('photo-1455390582262-044cdead277a'), alt: '写作桌面与钢笔', credit: 'Unsplash' },
    { src: unsplash('photo-1486312338219-ce68d2c6f44d'), alt: '写作时刻的光线', credit: 'Unsplash' },
    ...REFLECTION_POOL.slice(0, 8),
    ...LANDSCAPE_POOL.slice(2, 6),
  ],
  // 直接暴露给文章 slug 覆盖，参见下方 SLUG_POOL_KEYS
  landscape: LANDSCAPE_POOL,
  art: ART_POOL,
  reflection: REFLECTION_POOL,
  urban: URBAN_POOL,
  editorial: EDITORIAL_POOL,
}

// 把「编辑 / 氛围」池按主题混入高复用池，缓解老图重复感（不改各池原有主图）。
IMAGE_POOL.tech.push(...EDITORIAL_POOL.slice(0, 4))
IMAGE_POOL.developer_ecosystem.push(...EDITORIAL_POOL.slice(1, 4))
IMAGE_POOL.devtools.push(...EDITORIAL_POOL.slice(0, 3))
IMAGE_POOL.product.push(...EDITORIAL_POOL.slice(9, 13))
IMAGE_POOL.industry.push(...EDITORIAL_POOL.slice(14, 18))
IMAGE_POOL.market.push(...EDITORIAL_POOL.slice(3, 6))
IMAGE_POOL.content_community.push(...EDITORIAL_POOL.slice(5, 8))

// 特定 slug 显式指定素材池——优先级最高，覆盖 company_type / topic_type 推断。
// 用于：题材偏「氛围」的文章想跳出默认科技配图。
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
  if (entry.peopleType) return entry.peopleType
  return entry.category === 'companies' ? 'enterprise_software' : 'industry'
}

export function getResearchImages(entry) {
  const key = imageKeyFor(entry)
  const pool = IMAGE_POOL[key] || IMAGE_POOL.industry
  const count = entry.encrypted ? 1 : Math.min(3, Math.max(1, 1 + (hash(entry.slug) % 3)))
  return rotate(pool, `${entry.category}:${entry.slug}`).slice(0, count)
}
