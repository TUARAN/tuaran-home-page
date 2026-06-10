// 癌症概览数据
// 数据口径：
//  - 发病/死亡：GLOBOCAN 2022（IARC / WHO），全球年新发与年死亡人数（成人 + 儿童合计）
//  - 5 年相对生存率：以 US SEER 2014–2020 全分期合计为锚；中国 / 全球普遍较低，详情已在文案中提示
//  - 性别比、年龄分布：基于 GLOBOCAN / SEER 公开汇总的近似形状（10 岁档百分比，总和 100）
//  - 风险因子权重：示意性权重（基于 Lancet Oncology 综述、IARC 风险因素分类的相对重要性），不是 PAF 精确值
//  - 数据是教育用途的近似值，不应作为临床决策依据
//
// 颜色取自 https://2aran.com 站点色板（暖琥珀 + 灰蓝），便于视觉分组

// 中国 NCC 口径：取自《中国肿瘤登记年报》/ NCC 2024 公布的 2022 年中国本土估算
// （Zheng RS et al., J Natl Cancer Cent / Chin J Cancer Res 系列）。
// 中国 5 年生存率取自 CONCORD-3 / CHANCES / NCC 公开数据，部分癌种显著低于 SEER。
export const CANCERS = [
  {
    id: 'lung',
    nameZh: '肺癌',
    nameEn: 'Lung',
    incidence: 2_480_000,
    mortality: 1_820_000,
    survival5y: 25,
    cn: { incidence: 1_060_000, mortality: 733_000, survival5y: 20 },
    genderRatio: { male: 63, female: 37 },
    ageDistribution: [0, 0, 1, 2, 5, 12, 22, 28, 20, 10],
    primaryFactor: '吸烟',
    riskFactors: [
      { name: '吸烟（含二手烟）', weight: 70, category: 'lifestyle' },
      { name: '空气污染 / PM2.5 / 厨房油烟', weight: 12, category: 'environment' },
      { name: '职业暴露（石棉、氡、铬、镍）', weight: 8, category: 'occupation' },
      { name: '家族史 / 遗传易感', weight: 6, category: 'genetic' },
      { name: '慢性肺病（COPD / 肺结核史）', weight: 4, category: 'other' },
    ],
    warnings: ['持续 3 周以上咳嗽 / 痰中带血', '胸痛 / 反复同部位肺部感染', '不明原因体重下降 / 杵状指'],
    screening: '高危人群（55+ 且重度吸烟史）每年一次低剂量螺旋 CT（LDCT）',
    color: '#86707a',
  },
  {
    id: 'breast',
    nameZh: '乳腺癌',
    nameEn: 'Breast',
    incidence: 2_300_000,
    mortality: 666_000,
    survival5y: 91,
    cn: { incidence: 357_000, mortality: 75_000, survival5y: 82 },
    genderRatio: { male: 1, female: 99 },
    ageDistribution: [0, 0, 1, 3, 10, 20, 24, 22, 14, 6],
    primaryFactor: '雌激素累积暴露',
    riskFactors: [
      { name: '年龄 / 雌激素累积暴露（初潮早、绝经晚）', weight: 35, category: 'hormone' },
      { name: '家族史 / BRCA1·BRCA2', weight: 20, category: 'genetic' },
      { name: '生育史（晚生育 / 未育 / 未哺乳）', weight: 15, category: 'hormone' },
      { name: '激素替代治疗（HRT）', weight: 10, category: 'hormone' },
      { name: '肥胖（绝经后） / 缺乏运动', weight: 10, category: 'lifestyle' },
      { name: '酒精（每日 >10g 即有剂量反应）', weight: 10, category: 'lifestyle' },
    ],
    warnings: ['乳房无痛性肿块', '乳头溢液 / 皮肤橘皮样改变', '腋窝淋巴结肿大'],
    screening: '40+ 每 1–2 年乳腺钼靶 + 超声；高危人群（BRCA / 家族史）从 30 岁起加 MRI',
    color: '#a88e96',
  },
  {
    id: 'colorectal',
    nameZh: '结直肠癌',
    nameEn: 'Colorectal',
    incidence: 1_930_000,
    mortality: 904_000,
    survival5y: 65,
    cn: { incidence: 517_000, mortality: 240_000, survival5y: 57 },
    genderRatio: { male: 55, female: 45 },
    ageDistribution: [0, 0, 1, 2, 5, 11, 20, 26, 22, 13],
    primaryFactor: '饮食 + 缺乏运动',
    riskFactors: [
      { name: '红肉 / 加工肉 / 高脂低纤维饮食', weight: 25, category: 'diet' },
      { name: '肥胖 / 缺乏运动', weight: 18, category: 'lifestyle' },
      { name: '吸烟 + 长期饮酒', weight: 15, category: 'lifestyle' },
      { name: '家族史 / 林奇综合征 / FAP', weight: 18, category: 'genetic' },
      { name: '炎症性肠病（克罗恩 / 溃结）史', weight: 12, category: 'other' },
      { name: '糖尿病 / 胰岛素抵抗', weight: 12, category: 'other' },
    ],
    warnings: ['排便习惯改变 ≥ 4 周', '便血 / 黑便 / 黏液便', '不明原因贫血 / 体重下降'],
    screening: '45+ 每 10 年肠镜（或每年 FIT 粪便潜血）；高危人群从 40 岁起',
    color: '#7c917c',
  },
  {
    id: 'prostate',
    nameZh: '前列腺癌',
    nameEn: 'Prostate',
    incidence: 1_470_000,
    mortality: 397_000,
    survival5y: 97,
    cn: { incidence: 134_000, mortality: 47_000, survival5y: 67 },
    genderRatio: { male: 100, female: 0 },
    ageDistribution: [0, 0, 0, 0, 1, 4, 14, 28, 32, 21],
    primaryFactor: '年龄 + 遗传',
    riskFactors: [
      { name: '年龄（>50 岁急剧上升）', weight: 35, category: 'other' },
      { name: '家族史 / BRCA2 / 林奇综合征', weight: 25, category: 'genetic' },
      { name: '非洲裔 / 黑人人种', weight: 15, category: 'genetic' },
      { name: '高脂饮食 / 红肉 / 乳制品（争议）', weight: 10, category: 'diet' },
      { name: '肥胖（与侵袭性正相关）', weight: 8, category: 'lifestyle' },
      { name: '激素 / 雄激素长期高水平', weight: 7, category: 'hormone' },
    ],
    warnings: ['排尿困难 / 夜尿增多 / 尿流变细', '血尿 / 血精', '骨痛（晚期骨转移信号）'],
    screening: '50+ 每 2–4 年 PSA + 直肠指检；高危人群（家族史 / 黑人）从 45 岁起',
    color: '#6b85a6',
  },
  {
    id: 'stomach',
    nameZh: '胃癌',
    nameEn: 'Stomach',
    incidence: 969_000,
    mortality: 660_000,
    survival5y: 36,
    cn: { incidence: 359_000, mortality: 260_000, survival5y: 36 },
    genderRatio: { male: 66, female: 34 },
    ageDistribution: [0, 0, 1, 2, 5, 12, 22, 26, 20, 12],
    primaryFactor: '幽门螺杆菌 + 高盐饮食',
    riskFactors: [
      { name: '幽门螺杆菌（H. pylori）感染', weight: 35, category: 'virus' },
      { name: '高盐 / 腌制 / 烟熏食物（亚硝胺）', weight: 20, category: 'diet' },
      { name: '吸烟', weight: 12, category: 'lifestyle' },
      { name: '慢性萎缩性胃炎 / 肠化生', weight: 15, category: 'other' },
      { name: '家族史 / 遗传性弥漫型', weight: 10, category: 'genetic' },
      { name: '缺乏新鲜果蔬 / 维生素 C', weight: 8, category: 'diet' },
    ],
    warnings: ['上腹隐痛 / 饱胀 / 食欲下降 ≥ 4 周', '吞咽不适 / 呕血 / 黑便', '不明原因消瘦'],
    screening: '40+ 高发地区每 2 年胃镜 + Hp 检测；有家族史者更早',
    color: '#76745f',
  },
  {
    id: 'liver',
    nameZh: '肝癌',
    nameEn: 'Liver',
    incidence: 866_000,
    mortality: 759_000,
    survival5y: 21,
    cn: { incidence: 367_000, mortality: 316_000, survival5y: 14 },
    genderRatio: { male: 70, female: 30 },
    ageDistribution: [0, 0, 1, 3, 8, 16, 25, 25, 16, 6],
    primaryFactor: '乙肝 + 肝硬化',
    riskFactors: [
      { name: '慢性乙肝 / 丙肝感染', weight: 40, category: 'virus' },
      { name: '肝硬化（任何病因）', weight: 18, category: 'other' },
      { name: '长期重度饮酒', weight: 12, category: 'lifestyle' },
      { name: '黄曲霉毒素（霉变粮食）', weight: 8, category: 'environment' },
      { name: '非酒精脂肪肝 / 代谢综合征', weight: 12, category: 'lifestyle' },
      { name: '糖尿病 / 肥胖', weight: 10, category: 'other' },
    ],
    warnings: ['右上腹隐痛 / 肝区不适', '黄疸 / 腹水 / 易疲劳', '不明原因消瘦'],
    screening: '乙肝携带 / 肝硬化人群每 6 月超声 + AFP',
    color: '#5a5c3f',
  },
  {
    id: 'esophageal',
    nameZh: '食管癌',
    nameEn: 'Esophageal',
    incidence: 511_000,
    mortality: 445_000,
    survival5y: 20,
    cn: { incidence: 224_000, mortality: 187_000, survival5y: 31 },
    genderRatio: { male: 71, female: 29 },
    ageDistribution: [0, 0, 0, 1, 3, 10, 22, 30, 24, 10],
    primaryFactor: '烫食 + 烟酒',
    riskFactors: [
      { name: '吸烟 + 重度饮酒（协同作用）', weight: 30, category: 'lifestyle' },
      { name: '过烫食物 / 腌制食物（亚硝胺）', weight: 20, category: 'diet' },
      { name: '胃食管反流（GERD） / Barrett 食管', weight: 18, category: 'other' },
      { name: '肥胖（腺癌相关）', weight: 10, category: 'lifestyle' },
      { name: 'HPV 感染（部分鳞癌）', weight: 8, category: 'virus' },
      { name: '缺乏新鲜果蔬 / 微量元素', weight: 14, category: 'diet' },
    ],
    warnings: ['吞咽哽噎感（先固体后流食）', '胸骨后烧灼或疼痛', '反酸 / 不明原因消瘦'],
    screening: '40+ 高发地区（华北、潮汕）每 2 年胃镜',
    color: '#6e6550',
  },
  {
    id: 'pancreatic',
    nameZh: '胰腺癌',
    nameEn: 'Pancreatic',
    incidence: 511_000,
    mortality: 467_000,
    survival5y: 12,
    cn: { incidence: 118_000, mortality: 106_000, survival5y: 8 },
    genderRatio: { male: 55, female: 45 },
    ageDistribution: [0, 0, 0, 1, 3, 9, 20, 30, 25, 12],
    primaryFactor: '吸烟 + 糖尿病 / 慢性胰腺炎',
    riskFactors: [
      { name: '吸烟', weight: 25, category: 'lifestyle' },
      { name: '慢性胰腺炎 / 反复发作', weight: 18, category: 'other' },
      { name: '糖尿病（尤其新发 50+ 糖尿病）', weight: 15, category: 'other' },
      { name: '肥胖 / 缺乏运动', weight: 12, category: 'lifestyle' },
      { name: '家族史 / BRCA2 / 林奇 / 遗传性胰腺炎', weight: 15, category: 'genetic' },
      { name: '红肉 / 加工肉 / 高脂饮食', weight: 15, category: 'diet' },
    ],
    warnings: ['持续上腹 / 背部隐痛 ≥ 4 周', '黄疸（无痛性）+ 灰白便', '50+ 突发糖尿病 + 消瘦'],
    screening: '一般人群无有效筛查；BRCA / 林奇 / 家族史人群从 50 岁起 MRI + EUS',
    color: '#5b564a',
  },
  {
    id: 'cervical',
    nameZh: '宫颈癌',
    nameEn: 'Cervical',
    incidence: 660_000,
    mortality: 348_000,
    survival5y: 67,
    cn: { incidence: 151_000, mortality: 56_000, survival5y: 60 },
    genderRatio: { male: 0, female: 100 },
    ageDistribution: [0, 0, 3, 12, 22, 24, 18, 11, 7, 3],
    primaryFactor: 'HPV 感染',
    riskFactors: [
      { name: '高危型 HPV 持续感染（16/18 等）', weight: 60, category: 'virus' },
      { name: '多性伴侣 / 早性行为', weight: 12, category: 'lifestyle' },
      { name: '吸烟', weight: 8, category: 'lifestyle' },
      { name: '免疫缺陷 / HIV', weight: 8, category: 'other' },
      { name: '长期口服避孕药（>5 年）', weight: 6, category: 'hormone' },
      { name: '多次生育', weight: 6, category: 'other' },
    ],
    warnings: ['非经期 / 性交后出血', '异常分泌物（脓性 / 血性）', '绝经后再次出血'],
    screening: '25+ 每 3 年 HPV + TCT；接种 HPV 疫苗（9–45 岁，越早越好）',
    color: '#a68f9d',
  },
  {
    id: 'oral',
    nameZh: '口腔与口咽癌',
    nameEn: 'Oral & Oropharyngeal',
    incidence: 390_000,
    mortality: 189_000,
    survival5y: 68,
    cn: { incidence: 38_000, mortality: 19_000, survival5y: 56 },
    genderRatio: { male: 68, female: 32 },
    ageDistribution: [0, 0, 1, 3, 7, 14, 22, 24, 18, 11],
    primaryFactor: '烟 + 槟榔 + 酒',
    riskFactors: [
      { name: '吸烟（含旱烟、嚼烟）', weight: 28, category: 'lifestyle' },
      { name: '嚼槟榔（致癌物 1 类）', weight: 22, category: 'lifestyle' },
      { name: '重度饮酒（与烟协同放大）', weight: 18, category: 'lifestyle' },
      { name: 'HPV 感染（口咽癌主因）', weight: 15, category: 'virus' },
      { name: '不良口腔卫生 / 长期慢性刺激', weight: 10, category: 'other' },
      { name: '日晒（唇癌） / 营养不良', weight: 7, category: 'environment' },
    ],
    warnings: ['口腔白斑 / 红斑 / 溃疡 ≥ 2 周不愈', '颈部淋巴结无痛肿大', '吞咽 / 咀嚼疼痛 / 张口受限'],
    screening: '口腔自查 + 每年口腔科检查；嚼槟榔 / 重度吸烟者每 6 月一次',
    color: '#847262',
  },
]

export const CATEGORY_LABELS = {
  lifestyle: '生活方式',
  diet: '饮食',
  virus: '感染',
  genetic: '遗传',
  hormone: '激素',
  occupation: '职业暴露',
  environment: '环境',
  other: '其他',
}

export const CATEGORY_COLORS = {
  lifestyle: '#847262',
  diet: '#76745f',
  virus: '#86707a',
  genetic: '#6b85a6',
  hormone: '#a68f9d',
  occupation: '#5b564a',
  environment: '#7c917c',
  other: '#797b70',
}

export const AGE_BUCKETS = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80+', '']
// 注：data 数组有 10 个值对应 0-9 ... 80-89 / 90+，最后一项归入 80+
export const AGE_BUCKETS_DISPLAY = ['0–9', '10s', '20s', '30s', '40s', '50s', '60s', '70s', '80s', '90+']

// 总览数据
export const GLOBAL_TOTAL = {
  incidence: 19_976_000,
  mortality: 9_743_000,
  source: 'GLOBOCAN 2022 (IARC / WHO)',
}

// 中国总计（NCC 2024 公布的 2022 年估算）
export const CN_TOTAL = {
  incidence: 4_824_000,
  mortality: 2_574_000,
  source: '中国肿瘤登记年报 / NCC 2024（2022 年估算）',
}

export const REGIONS = {
  global: {
    id: 'global',
    label: '全球',
    sublabel: 'GLOBOCAN 2022',
    survivalNote: 'US SEER',
  },
  cn: {
    id: 'cn',
    label: '中国',
    sublabel: 'NCC 2024 · 2022 年估算',
    survivalNote: '中国 CONCORD-3 / NCC',
  },
}

// 取出选定 region 的数据
export function cancerView(c, region = 'global') {
  if (region === 'cn' && c.cn) {
    return {
      ...c,
      incidence: c.cn.incidence,
      mortality: c.cn.mortality,
      survival5y: c.cn.survival5y,
    }
  }
  return c
}
