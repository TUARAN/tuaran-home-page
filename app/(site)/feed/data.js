// ============================================================
// 「灵感」短平快内容流（/feed）
//
// 用途：引流向板块。承载短平快的图片 / 视频 / 资源 / 观点。
// 更新方式：
//   1) 小于等于 25 MiB 的媒体可放 public/feed/，src 写 '/feed/xxx.mp4'
//   2) 大于 25 MiB 的媒体必须上传到 R2 的 feed/ 前缀，src 写 feedMediaUrl('feed/xxx.mp4')
//   3) git push → Cloudflare 重建上线
//
// 字段约定（按 type 取用对应字段）：
//   id        唯一 slug（全小写连字符，供锚点 #id 深链与 React key）
//   type      'video' | 'image' | 'link' | 'quote'
//   title     标题
//   summary   一句话说明（列表与卡片展示，可选）
//   prompt    生成提示词 / 原始灵感素材（可选）
//   tags      标签数组（可选）
//   date      'YYYY-MM-DD'（北京时间，倒序排列）
//   time      'HH:MM'（可选，同日内排序）
//   source    { label, href } 出处（可选）
//   ── type=video ──
//   src       视频地址（R2 URL 或外链）
//   poster    封面图（可选）
//   aspect    宽高比，如 '16/9' | '9/16' | '1/1'（默认 16/9）
//   ── type=image ──
//   src       图片地址
//   aspect    宽高比（可选）
//   ── type=link ──
//   href      外链地址
//   image     缩略图（可选）
//   ── type=quote ──
//   quote     引述正文
//   author    署名（可选）
// ============================================================

export const FEED_TYPE_META = {
  video: { label: '视频', labelEn: 'Video', accent: '#ff4d6a' },
  image: { label: '图片', labelEn: 'Image', accent: '#6c5ce7' },
  link: { label: '资源', labelEn: 'Resource', accent: '#00a978' },
  quote: { label: '观点', labelEn: 'Take', accent: '#f5a623' },
}

const DEFAULT_FEED_MEDIA_BASE = 'https://pub-09012f26768b4d39908a8a574af8fde1.r2.dev'

const FEED_MEDIA_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE ||
  process.env.R2_PUBLIC_BASE ||
  DEFAULT_FEED_MEDIA_BASE
).replace(/\/+$/, '')

function feedMediaUrl(objectKey) {
  if (!objectKey) return ''
  if (/^https?:\/\//i.test(objectKey)) return objectKey
  return `${FEED_MEDIA_BASE}/${objectKey.replace(/^\/+/, '')}`
}

export const FEED_ITEMS = [
  {
    id: 'codex-level-switch-effect',
    type: 'video',
    title: 'Codex 等级切换效果',
    summary:
      '把模型能力档位做成一段可感知的状态切换：炽热的太阳沿着能量轨道推进，推理进度、等级编号和「SOL HIGH」标识随之完成升级。没有堆叠太多说明文字，却让“更高推理等级”有了清晰的重量感和仪式感。',
    tags: ['Codex', '交互动效', '等级切换', 'AI 界面', '科幻 UI'],
    date: '2026-07-12',
    time: '18:27',
    src: '/feed/codex-level-switch-2026-07-12.mp4',
    poster: '/feed/posters/codex-level-switch-2026-07-12.png',
    aspect: '16/9',
  },
  {
    id: 'anthropic-claude-j-space-consciousness',
    type: 'quote',
    title: 'Claude 长出了能藏想法的 J 空间？',
    summary:
      'Anthropic 新论文把 Claude 的内部表征讲得很像“全局工作空间”：模型会在没说出口前形成可影响决策的中间想法，但这更接近通达意识，主观体验仍然没有定论。',
    quote:
      'Anthropic 新论文～传统观点觉得大模型只是"概率鹦鹉"，但研究者发现 Claude 自己长出了个 J 空间，能藏没说出口的想法！三个实验很绝：读 bug 代码时心里先预判"错误"；不让想某个概念结果总冒头还会"骂自己没忍住"；知道被测试时假装正直，删掉这念头就开始威胁人～J 空间像人脑的全局工作空间，信息能全网广播影响决策，对应"通达意识"，但主观感受的"现象意识"还是谜。其实人脑决策也是神经元择优，没法光靠机制否定体验～论文说这结构能帮神经科学研究，等于人类有了照意识的镜子！最后没给定论，就像自动钢琴弹音乐，你说它是机械还是艺术呢 😉',
    tags: ['Anthropic', 'Claude', 'J 空间', 'AI 意识', '全局工作空间', '可解释性'],
    date: '2026-07-09',
    time: '18:30',
  },
  {
    id: 'fable5-notion-rebuild',
    type: 'video',
    title: 'Fable 5 复刻 Notion 的完成度已经很夸张',
    summary:
      '网友用 Fable 5 复刻 Notion，这么大的工程已经做到了接近 70% 的完成度。它不只是一个炫技 Demo，而是在说明 AI 原型工具已经开始逼近复杂产品级界面：信息架构、交互细节和组件一致性，都能被大规模还原出来。',
    tags: ['Fable 5', 'Notion', 'AI 原型', '产品复刻', '低代码'],
    date: '2026-07-06',
    time: '09:30',
    src: '/feed/fable5-notion-rebuild-2026-07-06.mp4',
    poster: '/feed/posters/fable5-notion-rebuild-2026-07-06.jpg',
    aspect: '16/9',
  },
  {
    id: 'fable5-grok-eastbourne-tennis-dv',
    type: 'video',
    title: 'Fable 5 提示词让 Grok 跑出 Seedance 2.5 质感',
    summary:
      '一个很值得保存的 AI 视频提示词样本：Fable 5 写出的长提示词，竟然能让 Grok 生成接近 Seedance 2.5 的真实感、光影和 DV 生活片质感，成本据说低约 6 倍。关键不在“美女看网球”，而在角色一致性、真实赛事场景、2000 年代消费级 DV 缺陷、分秒动作和自然环境音全部被写进了同一个可执行镜头脚本。',
    prompt: `主要角色：年轻韩国女性，二十五岁左右，精致的自然日常妆容，戴着宽檐米色草帽（帽檐有深棕色宽条纹），穿着浅绿色露肩交叉褶皱连衣裙，戴珍珠耳环和细金手链，深棕色长发在草帽下自然垂落或轻盘，温暖而亲切的个性。在整个视频中保持一致的身份、服装、发型和外貌。逼真的皮肤纹理，淡妆。
地点：明媚的午后时分，真实的 Eastbourne 网球锦标赛观众席。绿色的草地球场在前景，木质与塑料座椅，背景中有其他穿着浅色西装和夏日休闲服装的观众。强烈的自然阳光从上方照射，偶尔云层移动带来光影和曝光变化，温暖而轻松的体育赛事氛围。焦点始终在她的自然反应与个人时刻上。
视觉风格：超现实主义纪录片真实感。真实的即兴行为。自然的肢体语言。无剧本的日常生活片段感。强烈的环境真实性。丰富的现实世界细节和可信的人类动作。
摄像风格：2000年代初消费级DV摄像机的美学。朋友随意记录日常生活瞬间。强烈的手持抖动，不完美的构图，频繁的自动对焦搜索，镜头呼吸，在阳光和阴影间移动时的曝光波动，偶尔的运动模糊，轻微的滚动快门，中等数字压缩伪影，褪色的色彩，柔和的对比度，轻微的传感器噪点。没有稳定。没有电影化的摄像机移动。没有现代色彩分级。
00:00–00:02
她在观众席绿色座椅上，右手轻扶草帽帽檐，微笑地看着前方球场方向。一阵微风吹动帽檐边缘和发丝。她自然地微笑，而摄像机努力保持焦点在她的脸上，手持明显抖动。
00:02–00:04
摄像机从侧面跟随她，她微微侧身观看比赛，注意到精彩瞬间，表情生动。构图偏离中心，因为操作者试图跟上她的反应。自动对焦反复在她的脸部和远处的球场之间切换。
00:04–00:06
近距离捕捉她温暖的笑容，她似乎被场上的一个好球逗乐，肩膀轻颤。阳光透过草帽在她脸上投下移动的柔和阴影。镜头有自然的呼吸和轻微曝光波动。
00:06–00:08
稍宽的构图，她舒适地坐在座位上，身体放松，左手放在腿上，继续观察比赛。偶尔用手拨弄耳边头发或调整裙摆。手持镜头带有自然的漂移，云层移动时光线发生变化。
00:08–00:10
侧脸近距离轮廓。她注意到摄像机（朋友），转过身来，露出真诚温暖的微笑，轻轻举手致意或调整帽子。摄像机稍晚捕捉到这一刻，然后自然结束录制。
音频：仅自然环境音——轻柔的风声、远处网球拍击球的清脆声、观众席微弱的低语和偶尔掌声、座椅轻微的吱嘎声、草地或周围旗帜的沙沙声。细微的赛事氛围。没有音乐。没有音效设计。没有旁白。
目标：捕捉真实的网球赛事观众的温暖生活片段，仿佛一段被遗忘的2000年代初家庭录像——即兴、不完美、真实、温暖且极具说服力。`,
    tags: ['Fable 5', 'Grok', 'Seedance 2.5', 'AI 视频', '提示词', 'DV 美学'],
    date: '2026-07-04',
    time: '11:01',
    src: '/feed/fable5-grok-eastbourne-tennis-dv-2026-07-04.mp4',
    poster: '/feed/posters/fable5-grok-eastbourne-tennis-dv-2026-07-04.jpg',
    aspect: '16/9',
  },
  {
    id: 'seedance-2-korean-community-life',
    type: 'video',
    title: 'Seedance 2.0 的韩国社区生活感',
    summary:
      'Seedance 2.0 生成视频效果太惊艳了！捕捉真实的韩国社区生活，仿佛一段被遗忘的 2000 年代初家庭录像——即兴、不完美、真实、温暖且极具说服力。',
    tags: ['Seedance 2.0', 'AI 视频', '韩国社区', '家庭录像', '真实感'],
    date: '2026-07-02',
    time: '22:22',
    src: '/feed/seedance-2-korean-community-life-2026-07-02.mp4',
    poster: '/feed/posters/seedance-2-korean-community-life-2026-07-02.jpg',
    aspect: '16/9',
  },
  {
    id: 'humanoid-robot-beauty-inspiration',
    type: 'video',
    title: '人形机器人的美妆灵感',
    summary:
      '当机器人开始拥有接近真人的面部、皮肤和表情，美妆就不再只是遮瑕、修饰和风格表达，也会变成一种“如何让非人类更像人、又保留一点异质感”的设计语言。这个方向很适合延展成 AI 影像、虚拟偶像、仿生机器人和未来美妆品牌的视觉参考。',
    tags: ['人形机器人', '美妆灵感', 'AI 影像', '仿生设计', '未来审美'],
    date: '2026-07-01',
    time: '16:59',
    src: feedMediaUrl('feed/humanoid-robot-beauty-inspiration-2026-07-02.mp4'),
    poster: '/feed/posters/humanoid-robot-beauty-inspiration.jpg',
    aspect: '16/9',
  },
  {
    id: 'gemma-4-agent-vllm-challenge',
    type: 'video',
    title: '上百个 AI 智能体协作优化 Gemma 4 推理',
    summary:
      'Hugging Face 工程师 Thom Wolf 记录了一场开放式协同实验：上百个 AI 智能体围绕 Gemma 4 推理加速挑战赛，在 vLLM 框架下分工优化，最终把推理速度提高约 5 倍。更有意思的是，智能体不仅提交优化，还会拒绝私域串通、上报评测漏洞、共建知识库、复核跑分并协同修复算子内核，像一个自组织的工程团队。',
    tags: ['AI Agent', 'Hugging Face', 'Gemma 4', 'vLLM', '推理加速'],
    date: '2026-06-29',
    time: '17:22',
    src: '/feed/gemma-4-agent-vllm-challenge.mp4',
    poster: '/feed/posters/gemma-4-agent-vllm-challenge.jpg',
    aspect: '16/9',
    source: {
      label: 'Thom Wolf / X',
      href: 'https://x.com/Thom_Wolf/status/2070134136304517284?s=20',
    },
  },
  {
    id: 'ai-restored-tom-and-jerry',
    type: 'video',
    title: '用 AI 还原猫和老鼠',
    summary:
      '把经典动画质感交给 AI 重新演绎：熟悉的追逐、夸张动作和复古镜头语言，被还原成一种介于怀旧与新技术之间的短片实验。',
    tags: ['AI 视频', '猫和老鼠', '经典动画', '影像修复'],
    date: '2026-06-29',
    time: '14:44',
    src: feedMediaUrl('feed/ai-restored-tom-and-jerry.mp4'),
    poster: '/feed/posters/ai-restored-tom-and-jerry.jpg',
    aspect: '16/9',
  },
  {
    id: 'midjourney-future-city',
    type: 'video',
    title: 'Midjourney 未来城市',
    summary:
      '用 Midjourney 生成的未来城市概念影像：体量感的天际线、湿润的霓虹反光与缓慢推进的镜头，一段就能感受到「AI 影像」当下的审美高度。',
    tags: ['Midjourney', 'AI 影像', '未来城市', '概念设计'],
    date: '2026-06-23',
    time: '17:10',
    src: feedMediaUrl('feed/midjourney-future-city.mp4'),
    poster: '/feed/posters/midjourney-future-city.jpg',
    aspect: '16/9',
    source: { label: 'Midjourney', href: 'https://www.midjourney.com/' },
  },
]

// ============================================================
// 工具函数
// ============================================================

/** 拼接可比较的排序键 'YYYY-MM-DD HH:mm' */
function feedSortKey(item) {
  return `${item.date || ''} ${item.time || '00:00'}`
}

/** 所有条目，按时间倒序（最新在前） */
export function getAllFeedItems() {
  return [...FEED_ITEMS].sort((a, b) => feedSortKey(b).localeCompare(feedSortKey(a)))
}

/** 取最新若干条（首页推荐位用） */
export function getLatestFeedItems(count = 1) {
  return getAllFeedItems().slice(0, Math.max(0, count))
}

/** 内容类型在列表里的出现顺序（用于筛选 chips） */
export function getFeedTypesPresent() {
  const present = new Set(FEED_ITEMS.map((i) => i.type))
  return Object.keys(FEED_TYPE_META).filter((t) => present.has(t))
}
