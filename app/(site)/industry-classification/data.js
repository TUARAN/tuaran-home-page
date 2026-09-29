export const CLASSIFICATION_SYSTEMS = [
  {
    id: 'china',
    shortName: '中国',
    name: 'GB/T 4754—2017',
    version: '含 2019 年第 1 号修改单',
    purpose: '国家统计、规划、财政、税收、市场管理与信息交换',
    principle: '经济活动同质性；主要活动优先按增加值份额确定。',
    color: '#b64b3d',
    levels: [
      { name: '门类', code: '字母', count: 20 },
      { name: '大类', code: '2 位', count: 97 },
      { name: '中类', code: '3 位', count: 473 },
      { name: '小类', code: '4 位', count: 1382 },
    ],
    note: '中国现行国民经济行业分类的基础标准。原始 2017 版有 1380 个小类，2019 年修改后为 1382 个。',
    source: 'https://www.stats.gov.cn/zs/tjws/tjbz/202301/t20230101_1903769.html',
    sourceLabel: '国家统计局',
  },
  {
    id: 'isic',
    shortName: '联合国',
    name: 'ISIC Rev.5',
    version: '国际标准行业分类第 5 版',
    purpose: '跨国家、跨地区的经济活动统计与比较',
    principle: '综合投入、生产过程与技术、产出特征和产出用途。',
    color: '#2f6d68',
    levels: [
      { name: 'Section', code: '字母', count: 22 },
      { name: 'Division', code: '2 位', count: 87 },
      { name: 'Group', code: '3 位', count: 258 },
      { name: 'Class', code: '4 位', count: 463 },
    ],
    note: '全球经济活动分类的参考框架。国家标准通常保留可比性，再按本国经济结构增加细分。',
    source: 'https://unstats.un.org/UNSDWebsite/statcom/session_55/documents/BG-4e-ISIC5-Introuction-E.pdf',
    sourceLabel: '联合国统计司',
  },
  {
    id: 'nace',
    shortName: '欧盟',
    name: 'NACE Rev.2.1',
    version: '2025 年起用于欧洲统计',
    purpose: '欧盟成员国经济活动统计与统一报送',
    principle: '与 ISIC Rev.5 的上层结构协调，在欧洲需要的领域增加细节。',
    color: '#315d8a',
    levels: [
      { name: 'Section', code: '字母', count: 22 },
      { name: 'Division', code: '2 位', count: 87 },
      { name: 'Group', code: '3 位', count: 287 },
      { name: 'Class', code: '4 位', count: 651 },
    ],
    note: '与 ISIC 共用国际骨架，在 Group 和 Class 层级保留更多欧洲统计细节。',
    source: 'https://ec.europa.eu/eurostat/web/nace',
    sourceLabel: 'Eurostat',
  },
  {
    id: 'naics',
    shortName: '北美',
    name: 'NAICS 2022',
    version: '美国、加拿大、墨西哥协调体系',
    purpose: '北美生产单位与经济活动统计',
    principle: '重点观察生产过程相似性；六位代码允许各国保留本国细分。',
    color: '#8a6238',
    levels: [
      { name: 'Sector', code: '2 位', count: 20 },
      { name: 'Subsector', code: '3 位', count: 96 },
      { name: 'Industry Group', code: '4 位', count: 308 },
      { name: 'NAICS Industry', code: '5 位', count: 689 },
      { name: 'U.S. Industry', code: '6 位', count: 1012 },
    ],
    note: '前五位用于三国协调；第六位可形成美国、加拿大或墨西哥自己的详细行业。',
    source: 'https://www.census.gov/naics/reference_files_tools/2022_NAICS_Manual.pdf',
    sourceLabel: 'U.S. Census Bureau',
  },
  {
    id: 'gics',
    shortName: '资本市场',
    name: 'GICS',
    version: 'MSCI × S&P DJI',
    purpose: '上市公司、证券和投资组合的行业分析',
    principle: '综合收入、盈利和市场认知，把一家公司放入单一证券行业层级。',
    color: '#755982',
    levels: [
      { name: 'Sector', code: '2 位', count: 11 },
      { name: 'Industry Group', code: '4 位', count: 25 },
      { name: 'Industry', code: '6 位', count: 74 },
      { name: 'Sub-Industry', code: '8 位', count: 163 },
    ],
    note: '服务投资研究，不属于政府统计标准，因此不能直接与国民经济行业门类相加或替换。',
    source: 'https://www.msci.com/downloads/web/msci-com/indexes/index-resources/gics/MSCI_Global_Industry_Classification_Standard_%28GICS%C2%AE%29_Methodology_20240801.pdf',
    sourceLabel: 'MSCI',
  },
]

export const CHINA_SECTORS = [
  { code: 'A', name: '农、林、牧、渔业', band: '第一产业', bandLabel: '第一产业为主', summary: '利用动植物和自然资源开展种植、养殖、采集及相关生产；其中专业及辅助性活动划入第三产业。', examples: ['农业', '林业', '畜牧业', '渔业'], keywords: ['种植', '养殖', '农场', '水产'] },
  { code: 'B', name: '采矿业', band: '第二产业', bandLabel: '第二产业为主', summary: '从自然界开采矿产资源，并进行必要的洗选；其中开采专业及辅助性活动划入第三产业。', examples: ['煤炭开采', '石油和天然气开采', '金属矿采选'], keywords: ['矿山', '油气', '煤炭', '采选'] },
  { code: 'C', name: '制造业', band: '第二产业', bandLabel: '第二产业为主', summary: '对原材料、零部件进行物理或化学变化，形成新产品；其中金属制品、机械和设备修理业划入第三产业。', examples: ['食品制造', '汽车制造', '电子设备制造'], keywords: ['工厂', '生产', '加工', '设备', '汽车', '芯片'] },
  { code: 'D', name: '电力、热力、燃气及水生产和供应业', band: '第二产业', summary: '生产并向用户供应电力、热力、燃气和水。', examples: ['发电', '热力供应', '燃气供应', '自来水'], keywords: ['能源', '电网', '供暖', '供水'] },
  { code: 'E', name: '建筑业', band: '第二产业', summary: '房屋、土木工程和建筑安装、装饰等施工活动。', examples: ['房屋建筑', '土木工程', '建筑安装'], keywords: ['施工', '工程', '装修', '基建'] },
  { code: 'F', name: '批发和零售业', band: '第三产业', summary: '取得商品所有权后进行批量或面向消费者的销售。', examples: ['批发', '商超零售', '互联网零售'], keywords: ['贸易', '电商', '商店', '销售', '零售'] },
  { code: 'G', name: '交通运输、仓储和邮政业', band: '第三产业', summary: '运输旅客或货物，以及仓储、装卸和邮政服务。', examples: ['铁路运输', '道路运输', '物流仓储', '快递'], keywords: ['物流', '快递', '货运', '航空', '仓库'] },
  { code: 'H', name: '住宿和餐饮业', band: '第三产业', summary: '提供短期住宿、正餐、快餐及饮料服务。', examples: ['酒店', '民宿', '餐馆', '咖啡馆'], keywords: ['住宿', '餐饮', '饭店', '酒店'] },
  { code: 'I', name: '信息传输、软件和信息技术服务业', band: '第三产业', summary: '通信、互联网、软件开发和信息技术服务。', examples: ['电信', '互联网平台', '软件开发', '数据服务'], keywords: ['AI', '软件', '互联网', '云计算', '信息技术', '平台'] },
  { code: 'J', name: '金融业', band: '第三产业', summary: '货币金融、资本市场、保险及其他金融活动。', examples: ['银行', '证券', '保险', '基金'], keywords: ['投资', '支付', '信贷', '金融科技'] },
  { code: 'K', name: '房地产业', band: '第三产业', summary: '房地产开发经营、租赁经营、物业管理和中介服务。', examples: ['房地产开发', '物业管理', '房产中介'], keywords: ['房屋', '楼盘', '物业', '房产'] },
  { code: 'L', name: '租赁和商务服务业', band: '第三产业', summary: '资产租赁，以及企业管理、咨询、广告、会展等商务服务。', examples: ['设备租赁', '企业管理', '咨询', '广告'], keywords: ['猎头', '旅行社', '会展', '咨询', '租赁'] },
  { code: 'M', name: '科学研究和技术服务业', band: '第三产业', summary: '研究试验、专业技术、科技推广与应用服务。', examples: ['研发实验', '工程勘察', '检测认证', '技术推广'], keywords: ['科研', '实验室', '检测', '设计', '技术服务'] },
  { code: 'N', name: '水利、环境和公共设施管理业', band: '第三产业', summary: '水利、生态保护、环境治理和市政公共设施管理。', examples: ['水利管理', '污染治理', '城市公园'], keywords: ['环保', '污水', '生态', '市政', '景区'] },
  { code: 'O', name: '居民服务、修理和其他服务业', band: '第三产业', summary: '直接面向居民的生活服务，以及设备和消费品修理。', examples: ['家政', '洗染', '美容', '维修'], keywords: ['家政', '理发', '维修', '洗衣', '婚庆'] },
  { code: 'P', name: '教育', band: '第三产业', summary: '各级各类学校教育、培训及教育辅助活动。', examples: ['学前教育', '学校教育', '职业培训'], keywords: ['学校', '培训', '课程', '教育'] },
  { code: 'Q', name: '卫生和社会工作', band: '第三产业', summary: '医疗卫生、照护、社会救助和社会工作。', examples: ['医院', '基层医疗', '养老服务', '社会救助'], keywords: ['医疗', '诊所', '养老', '护理', '健康'] },
  { code: 'R', name: '文化、体育和娱乐业', band: '第三产业', summary: '文化创作传播、体育活动和娱乐服务。', examples: ['出版影视', '文艺创作', '体育', '娱乐'], keywords: ['媒体', '游戏', '演出', '博物馆', '健身'] },
  { code: 'S', name: '公共管理、社会保障和社会组织', band: '第三产业', summary: '国家机构、社会保障以及社会组织开展的活动。', examples: ['国家机构', '社会保障', '社会团体'], keywords: ['政府', '协会', '基金会', '公共管理'] },
  { code: 'T', name: '国际组织', band: '第三产业', summary: '依据国际条约或协议设立并在中国境内开展活动的组织。', examples: ['政府间国际组织'], keywords: ['联合国', '国际机构', '国际组织'] },
]

export const DEFINITION_CARDS = [
  { title: '行业', text: '从事相同性质经济活动的所有单位的集合。行业可以指门类，也可以指最细的小类。' },
  { title: '主要活动', text: '一个单位从事多种对外经济活动时，增加值份额最大的一种活动。无法计算时可参考营业收入或从业人员。' },
  { title: '次要活动', text: '单位对外提供货物或服务，但没有成为主要活动的其他经济活动。' },
  { title: '辅助活动', text: '只为本单位内部运行提供支持、不直接对外提供货物或服务的活动，一般不单独决定行业。' },
]

export const SOURCE_LINKS = [
  ['中国现行行业分类与数量', 'https://www.stats.gov.cn/zs/tjws/tjbz/202301/t20230101_1903769.html', '国家统计局'],
  ['GB/T 4754—2017 标准状态', 'https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=A703F0E23DD165A5A1318679F312D158', '国家标准全文公开系统'],
  ['三次产业划分说明', 'https://www.stats.gov.cn/zs/flfg/tjf/202409/t20240910_1956373.html', '国家统计局'],
  ['ISIC Rev.5', 'https://unstats.un.org/unsd/classifications/Econ/isic', '联合国统计司'],
  ['NACE Rev.2.1', 'https://ec.europa.eu/eurostat/web/nace', 'Eurostat'],
  ['NAICS 2022', 'https://www.census.gov/naics/', 'U.S. Census Bureau'],
  ['GICS 方法', 'https://www.msci.com/indexes/index-resources/gics', 'MSCI'],
]

export function findChinaSectors(query, band = '全部') {
  const normalized = String(query || '').trim().toLowerCase()
  return CHINA_SECTORS.filter((sector) => {
    if (band !== '全部' && sector.band !== band) return false
    if (!normalized) return true
    return [sector.code, sector.name, sector.summary, ...sector.examples, ...sector.keywords]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  })
}

export function getPrimaryActivity(activities) {
  const normalized = activities
    .map((activity, index) => ({
      id: activity.id || `activity-${index + 1}`,
      name: String(activity.name || '').trim(),
      value: Number(activity.value) || 0,
    }))
    .filter((activity) => activity.name && activity.value >= 0)
    .sort((a, b) => b.value - a.value)

  const total = normalized.reduce((sum, activity) => sum + activity.value, 0)
  if (!normalized.length || total <= 0) return { primary: null, ranked: [], total: 0 }

  return {
    primary: normalized[0],
    ranked: normalized.map((activity) => ({ ...activity, share: activity.value / total })),
    total,
  }
}
