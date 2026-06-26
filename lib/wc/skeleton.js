/**
 * 2026 世界杯静态骨架数据 (fallback)
 *
 * 只有远程数据源调用失败时才使用。
 * 注意: 不含比分/进球者,只含"哪些队伍、什么时间、在哪个场馆打"。
 *
 * 来源: 2025-12 FIFA 世界杯分组抽签结果。
 */

export const WC_SKELETON = {
  info: {
    dates: '2026.06.11 – 07.19',
    teams: 48,
    matches: 104,
    hosts: ['美国', '加拿大', '墨西哥'],
    openingVenue: 'Estadio Banorte, 墨西哥城',
    finalVenue: 'MetLife Stadium, 纽约/新泽西',
  },
  groups: [
    { id: 'A', teams: ['墨西哥', '南非', '韩国', '捷克'], flags: ['🇲🇽', '🇿🇦', '🇰🇷', '🇨🇿'] },
    { id: 'B', teams: ['加拿大', '波黑', '卡塔尔', '瑞士'], flags: ['🇨🇦', '🇧🇦', '🇶🇦', '🇨🇭'] },
    { id: 'C', teams: ['巴西', '摩洛哥', '海地', '苏格兰'], flags: ['🇧🇷', '🇲🇦', '🇭🇹', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'] },
    { id: 'D', teams: ['美国', '巴拉圭', '澳大利亚', '土耳其'], flags: ['🇺🇸', '🇵🇾', '🇦🇺', '🇹🇷'] },
    { id: 'E', teams: ['德国', '库拉索', '科特迪瓦', '厄瓜多尔'], flags: ['🇩🇪', '🇨🇼', '🇨🇮', '🇪🇨'] },
    { id: 'F', teams: ['荷兰', '日本', '瑞典', '突尼斯'], flags: ['🇳🇱', '🇯🇵', '🇸🇪', '🇹🇳'] },
    { id: 'G', teams: ['比利时', '埃及', '伊朗', '新西兰'], flags: ['🇧🇪', '🇪🇬', '🇮🇷', '🇳🇿'] },
    { id: 'H', teams: ['西班牙', '佛得角', '沙特', '乌拉圭'], flags: ['🇪🇸', '🇨🇻', '🇸🇦', '🇺🇾'] },
    { id: 'I', teams: ['法国', '塞内加尔', '伊拉克', '挪威'], flags: ['🇫🇷', '🇸🇳', '🇮🇶', '🇳🇴'] },
    { id: 'J', teams: ['阿根廷', '阿尔及利亚', '奥地利', '约旦'], flags: ['🇦🇷', '🇩🇿', '🇦🇹', '🇯🇴'] },
    { id: 'K', teams: ['葡萄牙', '刚果(金)', '乌兹别克斯坦', '哥伦比亚'], flags: ['🇵🇹', '🇨🇩', '🇺🇿', '🇨🇴'] },
    { id: 'L', teams: ['英格兰', '克罗地亚', '加纳', '巴拿马'], flags: ['🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇭🇷', '🇬🇭', '🇵🇦'] },
  ],
  venues: [
    { city: '墨西哥城', country: '🇲🇽', name: 'Estadio Banorte', capacity: '83,000', note: '开幕式' },
    { city: '瓜达拉哈拉', country: '🇲🇽', name: 'Estadio Akron', capacity: '48,000' },
    { city: '蒙特雷', country: '🇲🇽', name: 'Estadio BBVA', capacity: '53,500' },
    { city: '多伦多', country: '🇨🇦', name: 'BMO Field', capacity: '45,000' },
    { city: '温哥华', country: '🇨🇦', name: 'BC Place', capacity: '54,000' },
    { city: '亚特兰大', country: '🇺🇸', name: 'Mercedes-Benz Stadium', capacity: '75,000' },
    { city: '波士顿', country: '🇺🇸', name: 'Gillette Stadium', capacity: '65,000' },
    { city: '达拉斯', country: '🇺🇸', name: 'AT&T Stadium', capacity: '94,000', note: '最大容量' },
    { city: '休斯顿', country: '🇺🇸', name: 'NRG Stadium', capacity: '72,000' },
    { city: '堪萨斯城', country: '🇺🇸', name: 'Arrowhead Stadium', capacity: '73,000' },
    { city: '洛杉矶', country: '🇺🇸', name: 'SoFi Stadium', capacity: '70,000' },
    { city: '迈阿密', country: '🇺🇸', name: 'Hard Rock Stadium', capacity: '65,000' },
    { city: '纽约/新泽西', country: '🇺🇸', name: 'MetLife Stadium', capacity: '82,500', note: '决赛' },
    { city: '费城', country: '🇺🇸', name: 'Lincoln Financial Field', capacity: '69,000' },
    { city: '旧金山', country: '🇺🇸', name: "Levi's Stadium", capacity: '71,000' },
    { city: '西雅图', country: '🇺🇸', name: 'Lumen Field', capacity: '69,000' },
  ],
  milestones: [
    { date: '6月11日', event: '开幕式 + 揭幕战', venue: '墨西哥城' },
    { date: '6月21日', event: '世界杯历史第1000场比赛', venue: '蒙特雷' },
    { date: '7月19日', event: '决赛', venue: '纽约/新泽西' },
  ],
}
