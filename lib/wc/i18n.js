/**
 * 世界杯展示层汉化映射。
 *
 * 数据源 openfootball 是英文(队名/轮次/场馆),D1 里也存英文(保留为源)。
 * 这里只做「渲染时翻译」:英文 → 中文 + 国旗 emoji,不动采集和 D1。
 *
 * 队名/国旗与 lib/wc/skeleton.js 的分组中文保持一致。
 */

/* ━━━ 队名 → 中文 ━━━ */
export const TEAM_ZH = {
  Mexico: '墨西哥', 'South Africa': '南非', 'South Korea': '韩国', 'Czech Republic': '捷克',
  Canada: '加拿大', 'Bosnia & Herzegovina': '波黑', Qatar: '卡塔尔', Switzerland: '瑞士',
  Brazil: '巴西', Morocco: '摩洛哥', Haiti: '海地', Scotland: '苏格兰',
  USA: '美国', Paraguay: '巴拉圭', Australia: '澳大利亚', Turkey: '土耳其',
  Germany: '德国', 'Curaçao': '库拉索', 'Ivory Coast': '科特迪瓦', Ecuador: '厄瓜多尔',
  Netherlands: '荷兰', Japan: '日本', Sweden: '瑞典', Tunisia: '突尼斯',
  Belgium: '比利时', Egypt: '埃及', Iran: '伊朗', 'New Zealand': '新西兰',
  Spain: '西班牙', 'Cape Verde': '佛得角', 'Saudi Arabia': '沙特', Uruguay: '乌拉圭',
  France: '法国', Senegal: '塞内加尔', Iraq: '伊拉克', Norway: '挪威',
  Argentina: '阿根廷', Algeria: '阿尔及利亚', Austria: '奥地利', Jordan: '约旦',
  Portugal: '葡萄牙', 'DR Congo': '刚果(金)', Uzbekistan: '乌兹别克斯坦', Colombia: '哥伦比亚',
  England: '英格兰', Croatia: '克罗地亚', Ghana: '加纳', Panama: '巴拿马',
}

/* ━━━ 队名 → 国旗 emoji (D1 数据不带旗,展示时补) ━━━ */
export const TEAM_FLAG = {
  Mexico: '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Czech Republic': '🇨🇿',
  Canada: '🇨🇦', 'Bosnia & Herzegovina': '🇧🇦', Qatar: '🇶🇦', Switzerland: '🇨🇭',
  Brazil: '🇧🇷', Morocco: '🇲🇦', Haiti: '🇭🇹', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  USA: '🇺🇸', Paraguay: '🇵🇾', Australia: '🇦🇺', Turkey: '🇹🇷',
  Germany: '🇩🇪', 'Curaçao': '🇨🇼', 'Ivory Coast': '🇨🇮', Ecuador: '🇪🇨',
  Netherlands: '🇳🇱', Japan: '🇯🇵', Sweden: '🇸🇪', Tunisia: '🇹🇳',
  Belgium: '🇧🇪', Egypt: '🇪🇬', Iran: '🇮🇷', 'New Zealand': '🇳🇿',
  Spain: '🇪🇸', 'Cape Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', Uruguay: '🇺🇾',
  France: '🇫🇷', Senegal: '🇸🇳', Iraq: '🇮🇶', Norway: '🇳🇴',
  Argentina: '🇦🇷', Algeria: '🇩🇿', Austria: '🇦🇹', Jordan: '🇯🇴',
  Portugal: '🇵🇹', 'DR Congo': '🇨🇩', Uzbekistan: '🇺🇿', Colombia: '🇨🇴',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Croatia: '🇭🇷', Ghana: '🇬🇭', Panama: '🇵🇦',
}

/* ━━━ 轮次 → 中文 ━━━ */
export const ROUND_ZH = {
  'Round of 32': '32 强',
  'Round of 16': '16 强',
  'Quarter-final': '1/4 决赛',
  'Semi-final': '半决赛',
  'Match for third place': '三四名决赛',
  Final: '决赛',
}

/* ━━━ 场馆城市 → 中文 ━━━ */
export const VENUE_ZH = {
  Atlanta: '亚特兰大',
  'Boston (Foxborough)': '波士顿',
  'Dallas (Arlington)': '达拉斯',
  'Guadalajara (Zapopan)': '瓜达拉哈拉',
  Houston: '休斯顿',
  'Kansas City': '堪萨斯城',
  'Los Angeles (Inglewood)': '洛杉矶',
  'Mexico City': '墨西哥城',
  'Miami (Miami Gardens)': '迈阿密',
  'Monterrey (Guadalupe)': '蒙特雷',
  'New York/New Jersey (East Rutherford)': '纽约/新泽西',
  Philadelphia: '费城',
  'San Francisco Bay Area (Santa Clara)': '旧金山湾区',
  Seattle: '西雅图',
  Toronto: '多伦多',
  Vancouver: '温哥华',
}

/* ━━━ helpers ━━━ */

/** 队名汉化;淘汰赛占位符(1A/2B/3C.../W73/L101)转成中文说明,认不出原样返回 */
export function tTeam(name) {
  if (!name) return name
  if (TEAM_ZH[name]) return TEAM_ZH[name]
  let m
  if ((m = /^([12])([A-L])$/.exec(name))) return `${m[2]}组${m[1] === '1' ? '头名' : '次名'}`
  if ((m = /^3([A-L/]+)$/.exec(name))) return `小组第三(${m[1]})`
  if ((m = /^W(\d+)$/.exec(name))) return `M${m[1]}胜者`
  if ((m = /^L(\d+)$/.exec(name))) return `M${m[1]}负者`
  return name
}

/** 队名 → 国旗 emoji;占位符/未知返回空串 */
export function tFlag(name) {
  return TEAM_FLAG[name] || ''
}

/** 轮次汉化;"Matchday N" → "第 N 轮" */
export function tRound(round) {
  if (!round) return round
  if (ROUND_ZH[round]) return ROUND_ZH[round]
  const m = /^Matchday\s+(\d+)$/.exec(round)
  if (m) return `第 ${m[1]} 轮`
  return round
}

/** 场馆城市汉化 */
export function tVenue(city) {
  if (!city) return city
  return VENUE_ZH[city] || city
}
