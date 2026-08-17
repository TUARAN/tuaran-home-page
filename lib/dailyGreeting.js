import { weightedTextLength } from './xDistribution.js'

export const DAILY_GREETING_ID = 'x-daily-greeting'
export const DAILY_GREETING_SETTING_KEY = 'automation.x_morning_greeting'
export const DAILY_GREETING_LAST_RUN_KEY = 'automation.x_morning_greeting.last_run'
export const DAILY_GREETING_MAX_WEIGHT = 280

export const GREETING_PERIODS = Object.freeze({
  morning: { id: 'morning', label: '早安', hour: 8 },
  noon: { id: 'noon', label: '午安', hour: 12 },
  evening: { id: 'evening', label: '晚安', hour: 22 },
})

export const GREETING_CONTENT_KINDS = Object.freeze({
  quote: '名言',
  story: '故事',
  reflection: '随想',
})

const MORNING_CONTENT = [
  ['quote', '《论语》说：“工欲善其事，必先利其器。”\n整理好手边的工具，再开始今天的事。'],
  ['story', '小故事：祖逖年轻时听见鸡鸣便起身练剑，后来留下“闻鸡起舞”的典故。\n行动常常比等待状态更可靠。'],
  ['reflection', '先喝一杯水，再打开消息列表。\n清醒的十分钟，胜过匆忙的一小时。'],
  ['quote', '《周易》说：“天行健，君子以自强不息。”\n今天也向前走一小步。'],
  ['story', '小故事：匡衡借邻家的灯光读书，“凿壁偷光”由此流传。\n条件有限，也能先用好眼前的一束光。'],
  ['reflection', '开工前，写下今天最重要的一件事。\n完成它，今天便有了清楚的重心。'],
  ['quote', '《礼记》说：“博学之，审问之，慎思之，明辨之，笃行之。”\n知道之后，还要落到行动。'],
  ['story', '小故事：孔子晚年反复研读《周易》，穿竹简的皮绳多次磨断，留下“韦编三绝”。\n熟读也能生出新意。'],
  ['reflection', '今天给自己留一点从容。\n慢下来分清轻重，反而更容易把事情做好。'],
  ['quote', '《荀子》说：“不积跬步，无以至千里。”\n先完成眼前这一小段。'],
  ['story', '小故事：王羲之长期临池学书，相传洗笔使池水尽黑。\n手艺是在一次次练习中长出来的。'],
  ['reflection', '把手机放远一点，把注意力留给真正重要的人和事。'],
  ['quote', '陶渊明写：“盛年不重来，一日难再晨。”\n珍惜清晨，也珍惜今天。'],
  ['story', '小故事：车胤用萤火照书，孙康借雪光读书，后人合称“囊萤映雪”。\n热爱会主动寻找办法。'],
  ['reflection', '先做五分钟。\n许多看起来很难的事，只缺一个足够小的开始。'],
  ['quote', '《道德经》说：“合抱之木，生于毫末；九层之台，起于累土。”\n大事从小处起步。'],
  ['story', '小故事：范仲淹少年求学时把粥冻成块，分着吃完继续读书。\n专注让简朴的日子也有方向。'],
  ['reflection', '今天不必事事满分。\n把关键处做好，给意外留一点余地。'],
  ['quote', '王勃写：“穷且益坚，不坠青云之志。”\n困难会改变路线，不必改变志向。'],
  ['story', '小故事：欧阳修说自己的文章多在“马上、枕上、厕上”构思。\n零碎时间也能积成完整作品。'],
  ['reflection', '抬头看看天，再开始赶路。\n生活不只在待办清单里。'],
  ['quote', '《孟子》说：“虽有智慧，不如乘势；虽有镃基，不如待时。”\n努力之外，也要看清时机。'],
  ['story', '小故事：曹冲让大象上船，以水痕计量，再用石头称出重量。\n换一个尺度，难题可能就有了入口。'],
  ['reflection', '把焦虑写成一个可以完成的动作，然后去做。'],
  ['quote', '刘禹锡写：“千淘万漉虽辛苦，吹尽狂沙始到金。”\n耐心筛选，留下真正重要的东西。'],
  ['story', '小故事：王戎看见路边李树果实累累，判断果子多半苦涩，因为若甜早被摘走。\n观察反常之处，也是一种思考。'],
  ['reflection', '新的一天，少一点自我催促，多一点稳定节奏。'],
  ['quote', '朱熹写：“问渠那得清如许？为有源头活水来。”\n持续输入，才有持续生长。'],
  ['story', '小故事：张衡观察天地、研究机械，制成候风地动仪，也写下《二京赋》。\n文理并不妨碍彼此照亮。'],
  ['reflection', '先整理桌面，再整理思路。\n一个清爽的起点，会减少许多无谓选择。'],
  ['quote', '李白写：“长风破浪会有时，直挂云帆济沧海。”\n愿今天有勇气，也有耐心。'],
  ['story', '小故事：司马迁遍游各地，访问故老、考察遗迹，为《史记》积累材料。\n好作品往往从扎实的见闻开始。'],
  ['reflection', '认真吃早餐，认真做第一件事。\n平常日子也值得被好好对待。'],
  ['quote', '《论语》说：“知之者不如好之者，好之者不如乐之者。”\n找到一点乐趣，路会走得更远。'],
]

const NOON_CONTENT = [
  ['quote', '苏轼写：“竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。”\n午间歇一歇，再从容出发。'],
  ['story', '小故事：孔子向两小儿请教太阳远近，坦然说自己不能判断。\n承认未知，是求知的一部分。'],
  ['reflection', '上午辛苦了。\n好好吃饭，让身体和注意力一起充电。'],
  ['quote', '《论语》说：“学而不思则罔，思而不学则殆。”\n午后留一点时间，把输入变成自己的理解。'],
  ['story', '小故事：庄子写庖丁解牛，熟练之后能顺着筋骨间隙运刀。\n真正的熟练，来自对规律的理解。'],
  ['reflection', '事情多的时候，先分清重要、紧急和可以不做。'],
  ['quote', '杜甫写：“读书破万卷，下笔如有神。”\n积累不会立刻显现，却会在需要时出现。'],
  ['story', '小故事：纪昌先练习盯住细小目标，再学习射箭。\n基本功看似缓慢，却能缩短后面的路。'],
  ['reflection', '午后的效率不必和清晨一样。\n换一种节奏，也能稳稳推进。'],
  ['quote', '《菜根谭》说：“风来疏竹，风过而竹不留声。”\n事情经过以后，也让心慢慢归位。'],
  ['story', '小故事：伯牙鼓琴，钟子期能听出高山与流水之意。\n真正的理解，让表达不再孤单。'],
  ['reflection', '离开屏幕几分钟，看看远处。\n眼睛需要休息，思路也需要留白。'],
  ['quote', '王维写：“行到水穷处，坐看云起时。”\n暂时无路时，不妨先观察变化。'],
  ['story', '小故事：甘罗十二岁出使赵国，以清楚的判断完成使命。\n年龄不是思考与担当的唯一尺度。'],
  ['reflection', '如果上午不顺利，午后仍然可以重新开始。'],
  ['quote', '《孙子兵法》说：“知彼知己，百战不殆。”\n推进之前，先把自己和问题看清楚。'],
  ['story', '小故事：蔺相如以国家大局为重，避让廉颇；廉颇明白后负荆请罪。\n承认错误，也是一种勇气。'],
  ['reflection', '午安。把饭吃慢一点，把呼吸放深一点。'],
  ['quote', '陆游写：“纸上得来终觉浅，绝知此事要躬行。”\n知道方法之后，亲手做一次。'],
  ['story', '小故事：鲁班被带齿的草叶划伤，观察形状后得到制作锯子的启发。\n问题有时也携带答案的线索。'],
  ['reflection', '把下午拆成两段，每段只守住一个目标。'],
  ['quote', '《大学》说：“苟日新，日日新，又日新。”\n小小修正，也是在更新自己。'],
  ['story', '小故事：苏轼看庐山，写下“横看成岭侧成峰”。\n换一个位置，结论可能就会不同。'],
  ['reflection', '不急着回应所有消息。\n先完成手上的事，再回到外界的声音。'],
  ['quote', '白居易写：“试玉要烧三日满，辨材须待七年期。”\n重要判断，需要时间验证。'],
  ['story', '小故事：吕蒙听从孙权劝学，后来让鲁肃感叹“士别三日，当刮目相待”。\n持续学习会改变别人对你的旧印象。'],
  ['reflection', '累了就休息十分钟。\n恢复精力，本来就是工作的一部分。'],
  ['quote', '《淮南子》说：“塞翁失马，焉知非福。”\n眼前得失，不一定是故事的结局。'],
  ['story', '小故事：卖油翁把油从钱孔倒入而不沾铜钱，只说“唯手熟尔”。\n稳定练习，会把复杂变成自然。'],
  ['reflection', '午后的好状态，从一杯水和一件明确的小事开始。'],
  ['quote', '韩愈写：“业精于勤，荒于嬉；行成于思，毁于随。”\n勤奋之外，也要保留思考。'],
  ['story', '小故事：宋濂借书抄录，即使严寒砚台结冰也按期归还。\n守信让求学得到更多帮助。'],
  ['reflection', '给今天留一点弹性。\n计划是方向，不是用来责备自己的尺子。'],
]

const EVENING_CONTENT = [
  ['quote', '陶渊明写：“采菊东篱下，悠然见南山。”\n愿你收起忙碌，重新看见身边的安静。'],
  ['story', '小故事：陶渊明不愿为五斗米折腰，辞官归田，写下真切自然的田园诗。\n选择怎样生活，也是在选择怎样表达。'],
  ['reflection', '今天已经走了很远。\n没有完成的事，留给明天清醒的自己。'],
  ['quote', '张九龄写：“海上生明月，天涯共此时。”\n愿远近的人，都有一个安稳夜晚。'],
  ['story', '小故事：李白见老妇磨铁杵，听说要磨成针，由此明白持久用功的意义。\n漫长的事，也由今天这一点组成。'],
  ['reflection', '关掉一些声音，让大脑慢慢结束今天的工作。'],
  ['quote', '苏轼写：“此心安处是吾乡。”\n愿你今晚身安心也安。'],
  ['story', '小故事：曾子妻子随口答应孩子杀猪，曾子坚持兑现。\n认真对待承诺，也是在教人如何信任。'],
  ['reflection', '回想今天一个值得感谢的瞬间，带着它入睡。'],
  ['quote', '《道德经》说：“知足不辱，知止不殆，可以长久。”\n忙碌有边界，休息也有价值。'],
  ['story', '小故事：愚公决定移山，日复一日开凿。\n有些目标靠的不是一时用力，而是代代相续的耐心。'],
  ['reflection', '晚安。把明天最重要的事写下一句，然后放心休息。'],
  ['quote', '孟浩然写：“野旷天低树，江清月近人。”\n愿夜色带来清静。'],
  ['story', '小故事：叶公常说喜欢龙，真龙来到窗前时却惊慌逃走。\n喜欢一种想象，和理解真实事物并不相同。'],
  ['reflection', '今天若有遗憾，记住它提供的线索，不必反复惩罚自己。'],
  ['quote', '《论语》说：“见贤思齐焉，见不贤而内自省也。”\n一天结束时，温和地复盘自己。'],
  ['story', '小故事：刻舟求剑的人在船上刻下记号，却忘了船在移动。\n方法若不随环境变化，就会失去作用。'],
  ['reflection', '洗个热水澡，读几页书，让今天缓缓落幕。'],
  ['quote', '李白写：“举杯邀明月，对影成三人。”\n独处也可以有诗意。'],
  ['story', '小故事：揠苗助长的人急着让禾苗长高，反而伤了根。\n成长有自己的节奏。'],
  ['reflection', '别把白天的所有问题带进梦里。\n睡眠会帮大脑重新整理它们。'],
  ['quote', '杜甫写：“随风潜入夜，润物细无声。”\n许多改变，正安静地发生。'],
  ['story', '小故事：三顾茅庐中，刘备多次拜访诸葛亮，终于请他出山。\n诚意往往体现在愿意花时间。'],
  ['reflection', '今天做成的小事，也值得被认真记住。'],
  ['quote', '辛弃疾写：“明月别枝惊鹊，清风半夜鸣蝉。”\n愿清风明月陪你休息。'],
  ['story', '小故事：司马光砸缸救出落水的伙伴。\n紧急时刻，抓住最重要的问题比遵循惯例更要紧。'],
  ['reflection', '把屏幕调暗，把脚步放慢。\n身体会听懂你准备休息的信号。'],
  ['quote', '《诗经》说：“高山仰止，景行行止。”\n心有所向，脚下便有方向。'],
  ['story', '小故事：孔融小时候把大梨让给兄长，故事后来成为谦让的启蒙寓言。\n体谅别人，从小事开始。'],
  ['reflection', '允许今天到此为止。\n休息不是中断生活，而是在为明天蓄力。'],
  ['quote', '苏轼写：“人有悲欢离合，月有阴晴圆缺，此事古难全。”\n愿你接纳今日的不圆满。'],
  ['story', '小故事：王安石反复修改“春风又绿江南岸”，最终用“绿”字让画面有了生机。\n好文字值得慢慢推敲。'],
  ['reflection', '愿今晚睡得踏实，明早醒来仍对生活有一点好奇。'],
]

function buildDefaults(period, greeting, items) {
  return items.map(([contentKind, content]) => ({
    period,
    contentKind,
    text: `${greeting}！今天是{date}。\n${content}`,
  }))
}

export const DAILY_GREETING_TEMPLATES = [
  ...buildDefaults('morning', '早安', MORNING_CONTENT),
  ...buildDefaults('noon', '午安', NOON_CONTENT),
  ...buildDefaults('evening', '晚安', EVENING_CONTENT),
]

export function normalizeGreetingPeriod(value, fallback = 'morning') {
  const period = String(value || '').trim().toLowerCase()
  return GREETING_PERIODS[period] ? period : fallback
}

export function greetingPeriodForDate(now = new Date(), timeZone = 'Asia/Shanghai') {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now))
  if (hour < 11) return 'morning'
  if (hour < 18) return 'noon'
  return 'evening'
}

export function greetingLastRunKey(period) {
  return `${DAILY_GREETING_LAST_RUN_KEY}.${normalizeGreetingPeriod(period)}`
}

export function isAutomationPaused(value) {
  return String(value || '').trim().toLowerCase() === 'paused'
}

export function greetingDateLabel({ now = new Date(), timeZone = 'Asia/Shanghai' } = {}) {
  const parts = new Intl.DateTimeFormat('zh-CN', { timeZone, month: 'numeric', day: 'numeric' }).formatToParts(now)
  const month = parts.find((part) => part.type === 'month')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''
  return `${month}月${day}号`
}

export function normalizeGreetingNewlines(text) {
  return String(text || '').replace(/\\n/g, '\n')
}

export function shanghaiDateKey(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(Number(timestamp) || Date.now()))
}

export function templatesForPeriod(templates = DAILY_GREETING_TEMPLATES, period = 'morning') {
  const normalized = normalizeGreetingPeriod(period)
  return (Array.isArray(templates) ? templates : DAILY_GREETING_TEMPLATES).filter((item) => {
    if (typeof item === 'string') return normalized === 'morning'
    return normalizeGreetingPeriod(item?.period) === normalized
  })
}

export function pickDailyGreetingTemplate(templates = DAILY_GREETING_TEMPLATES, { now = new Date(), period = 'morning' } = {}) {
  const normalizedPeriod = normalizeGreetingPeriod(period)
  const supplied = Array.isArray(templates) ? templates : DAILY_GREETING_TEMPLATES
  // 发布端从 D1 读取时传入的已经是指定时段的纯文本数组，无需再次按 period 过滤。
  const periodTemplates = supplied.every((item) => typeof item === 'string')
    ? supplied
    : templatesForPeriod(supplied, normalizedPeriod)
  const pool = periodTemplates
    .map((template) => typeof template === 'string' ? template : template?.text)
    .map((template) => String(template || '').trim())
    .filter(Boolean)
  const fallback = pool.length ? pool : templatesForPeriod(DAILY_GREETING_TEMPLATES, normalizedPeriod).map((item) => item.text)
  const key = `${shanghaiDateKey(now)}:${normalizedPeriod}`
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.codePointAt(0)) >>> 0
  return fallback[hash % fallback.length]
}

export function buildDailyGreeting({ now = new Date(), period = 'morning', template } = {}) {
  const text = template || pickDailyGreetingTemplate(DAILY_GREETING_TEMPLATES, { now, period })
  return normalizeGreetingNewlines(String(text).replaceAll('{date}', greetingDateLabel({ now })))
}

export function greetingWithinLimit(text, limit = DAILY_GREETING_MAX_WEIGHT) {
  return weightedTextLength(text) <= limit
}
