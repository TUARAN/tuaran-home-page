/**
 * 2026 FIFA World Cup Data
 * 48 teams · 12 groups · 104 matches · 16 host cities
 * Host: USA 🇺🇸 · Canada 🇨🇦 · Mexico 🇲🇽
 * Dates: June 11 – July 19, 2026
 */

export const WC_INFO = {
  dates: '2026.06.11 – 07.19',
  teams: 48,
  matches: 104,
  hosts: ['美国', '加拿大', '墨西哥'],
  openingVenue: 'Estadio Banorte, 墨西哥城',
  finalVenue: 'MetLife Stadium, 纽约/新泽西',
  milestones: [
    { date: '6月11日', event: '开幕式 + 揭幕战', venue: '墨西哥城' },
    { date: '6月21日', event: '世界杯历史第1000场比赛', venue: '蒙特雷' },
    { date: '7月19日', event: '决赛', venue: '纽约/新泽西' },
  ],
}

export const GROUPS = [
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
]

// Only key matches shown (completed + upcoming highlights)
export const MATCHES = [
  // Round 1 - completed
  { id: 1, round: 1, date: '6/11', time: '15:00', home: '墨西哥', homeFlag: '🇲🇽', score: '2-0', away: '南非', awayFlag: '🇿🇦', group: 'A', venue: '墨西哥城', status: 'done' },
  { id: 2, round: 1, date: '6/12', time: '22:00', home: '韩国', homeFlag: '🇰🇷', score: '2-1', away: '捷克', awayFlag: '🇨🇿', group: 'A', venue: '瓜达拉哈拉', status: 'done' },
  { id: 3, round: 1, date: '6/12', time: '15:00', home: '加拿大', homeFlag: '🇨🇦', score: '1-1', away: '波黑', awayFlag: '🇧🇦', group: 'B', venue: '多伦多', status: 'done' },
  { id: 6, round: 1, date: '6/13', time: '18:00', home: '巴西', homeFlag: '🇧🇷', score: '1-1', away: '摩洛哥', awayFlag: '🇲🇦', group: 'C', venue: '纽约/新泽西', status: 'done' },
  { id: 4, round: 1, date: '6/13', time: '21:00', home: '美国', homeFlag: '🇺🇸', score: '4-1', away: '巴拉圭', awayFlag: '🇵🇾', group: 'D', venue: '洛杉矶', status: 'done' },
  { id: 9, round: 1, date: '6/14', time: '13:00', home: '德国', homeFlag: '🇩🇪', score: '7-1', away: '库拉索', awayFlag: '🇨🇼', group: 'E', venue: '休斯顿', status: 'done' },
  { id: 10, round: 1, date: '6/14', time: '16:00', home: '荷兰', homeFlag: '🇳🇱', score: '2-2', away: '日本', awayFlag: '🇯🇵', group: 'F', venue: '达拉斯', status: 'done' },
  { id: 12, round: 1, date: '6/15', time: '22:00', home: '瑞典', homeFlag: '🇸🇪', score: '5-1', away: '突尼斯', awayFlag: '🇹🇳', group: 'F', venue: '蒙特雷', status: 'done' },
  { id: 17, round: 1, date: '6/16', time: '15:00', home: '法国', homeFlag: '🇫🇷', score: '3-1', away: '塞内加尔', awayFlag: '🇸🇳', group: 'I', venue: '纽约/新泽西', status: 'done' },
  { id: 19, round: 1, date: '6/17', time: '21:00', home: '阿根廷', homeFlag: '🇦🇷', score: '3-0', away: '阿尔及利亚', awayFlag: '🇩🇿', group: 'J', venue: '堪萨斯城', status: 'done' },
  // Round 1 - upcoming today
  { id: 20, round: 1, date: '6/17', time: '00:00', home: '奥地利', homeFlag: '🇦🇹', score: null, away: '约旦', awayFlag: '🇯🇴', group: 'J', venue: '旧金山', status: 'live' },
  { id: 21, round: 1, date: '6/17', time: '13:00', home: '葡萄牙', homeFlag: '🇵🇹', score: null, away: '刚果(金)', awayFlag: '🇨🇩', group: 'K', venue: '休斯顿', status: 'upcoming' },
  { id: 22, round: 1, date: '6/17', time: '16:00', home: '英格兰', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: null, away: '克罗地亚', awayFlag: '🇭🇷', group: 'L', venue: '达拉斯', status: 'upcoming' },
  { id: 23, round: 1, date: '6/17', time: '19:00', home: '加纳', homeFlag: '🇬🇭', score: null, away: '巴拿马', awayFlag: '🇵🇦', group: 'L', venue: '多伦多', status: 'upcoming' },
  // Round 2 - highlights
  { id: 28, round: 2, date: '6/19', time: '21:00', home: '墨西哥', homeFlag: '🇲🇽', score: null, away: '韩国', awayFlag: '🇰🇷', group: 'A', venue: '瓜达拉哈拉', status: 'upcoming' },
  { id: 29, round: 2, date: '6/19', time: '15:00', home: '美国', homeFlag: '🇺🇸', score: null, away: '澳大利亚', awayFlag: '🇦🇺', group: 'D', venue: '西雅图', status: 'upcoming' },
  { id: 31, round: 2, date: '6/20', time: '21:00', home: '巴西', homeFlag: '🇧🇷', score: null, away: '海地', awayFlag: '🇭🇹', group: 'C', venue: '费城', status: 'upcoming' },
  { id: 33, round: 2, date: '6/20', time: '13:00', home: '荷兰', homeFlag: '🇳🇱', score: null, away: '瑞典', awayFlag: '🇸🇪', group: 'F', venue: '休斯顿', status: 'upcoming' },
  { id: 34, round: 2, date: '6/20', time: '16:00', home: '德国', homeFlag: '🇩🇪', score: null, away: '科特迪瓦', awayFlag: '🇨🇮', group: 'E', venue: '多伦多', status: 'upcoming' },
  { id: 41, round: 2, date: '6/22', time: '13:00', home: '阿根廷', homeFlag: '🇦🇷', score: null, away: '奥地利', awayFlag: '🇦🇹', group: 'J', venue: '达拉斯', status: 'upcoming' },
  { id: 46, round: 2, date: '6/23', time: '16:00', home: '英格兰', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: null, away: '加纳', awayFlag: '🇬🇭', group: 'L', venue: '波士顿', status: 'upcoming' },
  // Round 3 - highlights
  { id: 59, round: 3, date: '6/26', time: '22:00', home: '美国', homeFlag: '🇺🇸', score: null, away: '土耳其', awayFlag: '🇹🇷', group: 'D', venue: '洛杉矶', status: 'upcoming' },
  { id: 62, round: 3, date: '6/27', time: '23:00', home: '乌拉圭', homeFlag: '🇺🇾', score: null, away: '西班牙', awayFlag: '🇪🇸', group: 'H', venue: '瓜达拉哈拉', status: 'upcoming' },
  { id: 63, round: 3, date: '6/26', time: '15:00', home: '挪威', homeFlag: '🇳🇴', score: null, away: '法国', awayFlag: '🇫🇷', group: 'I', venue: '波士顿', status: 'upcoming' },
  { id: 69, round: 3, date: '6/27', time: '19:30', home: '哥伦比亚', homeFlag: '🇨🇴', score: null, away: '葡萄牙', awayFlag: '🇵🇹', group: 'K', venue: '迈阿密', status: 'upcoming' },
  // Knockout highlights
  { id: 73, round: 'R32', date: '6/28', time: '15:00', home: 'A2', homeFlag: '🏆', score: null, away: 'B2', awayFlag: '🏆', group: '1/16', venue: '洛杉矶', status: 'upcoming' },
  { id: 104, round: 'Final', date: '7/19', time: '15:00', home: '半决赛胜者', homeFlag: '🏆', score: null, away: '半决赛胜者', awayFlag: '🏆', group: '决赛', venue: '纽约/新泽西', status: 'upcoming' },
]

export const VENUES = [
  { city: '墨西哥城', country: '🇲🇽', name: 'Estadio Banorte', capacity: '83,000', note: '开幕式' },
  { city: '瓜达拉哈拉', country: '🇲🇽', name: 'Estadio Akron', capacity: '48,000', note: '' },
  { city: '蒙特雷', country: '🇲🇽', name: 'Estadio BBVA', capacity: '53,500', note: '第1000场' },
  { city: '多伦多', country: '🇨🇦', name: 'BMO Field', capacity: '45,000', note: '' },
  { city: '温哥华', country: '🇨🇦', name: 'BC Place', capacity: '54,000', note: '' },
  { city: '亚特兰大', country: '🇺🇸', name: 'Mercedes-Benz Stadium', capacity: '75,000', note: '' },
  { city: '波士顿', country: '🇺🇸', name: 'Gillette Stadium', capacity: '65,000', note: '' },
  { city: '达拉斯', country: '🇺🇸', name: 'AT&T Stadium', capacity: '94,000', note: '最大容量' },
  { city: '休斯顿', country: '🇺🇸', name: 'NRG Stadium', capacity: '72,000', note: '' },
  { city: '堪萨斯城', country: '🇺🇸', name: 'Arrowhead Stadium', capacity: '73,000', note: '' },
  { city: '洛杉矶', country: '🇺🇸', name: 'SoFi Stadium', capacity: '70,000', note: '' },
  { city: '迈阿密', country: '🇺🇸', name: 'Hard Rock Stadium', capacity: '65,000', note: '' },
  { city: '纽约/新泽西', country: '🇺🇸', name: 'MetLife Stadium', capacity: '82,500', note: '决赛' },
  { city: '费城', country: '🇺🇸', name: 'Lincoln Financial Field', capacity: '69,000', note: '' },
  { city: '旧金山', country: '🇺🇸', name: "Levi's Stadium", capacity: '71,000', note: '' },
  { city: '西雅图', country: '🇺🇸', name: 'Lumen Field', capacity: '69,000', note: '' },
]

export const NEWS = [
  {
    id: 1,
    date: '6/17',
    tag: '赛况',
    title: '阿根廷首战 3-0 完胜阿尔及利亚',
    desc: '梅西替补登场助攻一球，阿根廷在堪萨斯城展示夺冠决心。',
  },
  {
    id: 2,
    date: '6/16',
    tag: '焦点',
    title: '法国 3-1 击败塞内加尔，姆巴佩梅开二度',
    desc: '卫冕冠军在纽约大都会球场展现实力，姆巴佩状态火热。',
  },
  {
    id: 3,
    date: '6/14',
    tag: '历史',
    title: '德国 7-1 狂胜库拉索，创本届最大分差',
    desc: '休斯顿之夜，德国队火力全开，追平队史世界杯单场进球纪录。',
  },
  {
    id: 4,
    date: '6/13',
    tag: '东道主',
    title: '美国 4-1 大胜巴拉圭，主场开门红',
    desc: 'SoFi体育场座无虚席，美国队用一场酣畅淋漓的胜利回应了主场球迷的期待。',
  },
  {
    id: 5,
    date: '6/14',
    tag: '亚洲',
    title: '日本 2-2 逼平荷兰，蓝武士展现韧性',
    desc: '达拉斯之战，日本两度落后两度扳平，展现了亚洲足球的进步。',
  },
  {
    id: 6,
    date: '6/15',
    tag: '黑马',
    title: '瑞典 5-1 大胜突尼斯，北欧海盗强势开局',
    desc: '蒙特雷之战，瑞典用一场大胜宣告他们不是来凑数的。',
  },
]
