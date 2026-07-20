const NUMBER_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

const UNIT_LABELS = {
  people: '人',
  devices: '台设备',
  minutes: '分钟',
  posts: '条',
}

const CONFIDENCE_LABELS = {
  high: '高置信',
  reference: '参考',
  disputed: '存疑',
  'lead-only': '线索',
}

const GEOGRAPHY_LABELS = {
  global: '全球',
  us: '美国',
  uk: '英国',
  eu: '欧盟',
  japan: '日本',
  china: '中国',
  'supported-countries': '支持国家与地区',
}

const SEGMENT_LABELS = {
  all: '全部人群',
  'adults-18-plus': '18 岁以上成年人',
  'age-18-29': '18–29 岁',
  'age-30-49': '30–49 岁',
  'age-50-64': '50–64 岁',
  'age-65-plus': '65 岁以上',
  men: '男性',
  women: '女性',
  male: '男性',
  female: '女性',
  'income-under-30000': '年收入低于 3 万美元',
  'income-30000-69999': '年收入 3–6.9999 万美元',
  'income-70000-99999': '年收入 7–9.9999 万美元',
  'income-100000-plus': '年收入 10 万美元以上',
  'high-school-or-less': '高中及以下',
  'some-college': '部分大学教育',
  'college-graduate': '大学毕业及以上',
  'news-users': '新闻用户',
  'news-major-or-minor-reason': '将获取新闻视为主要或次要使用理由',
  'x-users': 'X 用户',
  'ad-audience': '广告受众',
}

export function formatMetricValue(row) {
  if (row.valueType === 'qualitative') return String(row.value)
  const suffix = row.unit === 'percent' ? '%' : UNIT_LABELS[row.unit] ? ` ${UNIT_LABELS[row.unit]}` : row.unit ? ` ${row.unit}` : ''
  if (row.valueType === 'range') {
    return `${NUMBER_FORMAT.format(row.valueMin)}–${NUMBER_FORMAT.format(row.valueMax)}${suffix}`
  }
  return `${NUMBER_FORMAT.format(row.value)}${suffix}`
}

export function formatPeriod(periodStart, periodEnd) {
  return periodStart === periodEnd ? periodStart : `${periodStart} — ${periodEnd}`
}

export function confidenceLabel(confidence) {
  return CONFIDENCE_LABELS[confidence] || confidence
}

export function geographyLabel(geography) {
  return GEOGRAPHY_LABELS[geography] || geography
}

export function segmentLabel(segment) {
  return SEGMENT_LABELS[segment] || segment.replaceAll('-', ' ')
}
