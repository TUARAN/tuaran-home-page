import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '《张居正：一个改革者的成事与代价》· 写作出版工程',
  description:
    '《张居正：一个改革者的成事与代价》写作出版工程：主线、人物关系、关键事件、12 章目录、20 篇连载、写作方法、出版路径与 12 个月节奏。',
  keywords: [
    '涂阿燃',
    'tuaran',
    '张居正',
    '万历新政',
    '历史写作',
    '写作出版',
    '考成法',
    '一条鞭法',
    '改革',
    '人物传记',
    'Markdown 写作',
  ],
  alternates: {
    canonical: '/zhang-juzheng-book',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const KPI = [
  { label: '项目主张', value: '用输出倒逼输入', note: '以"写一本书"反推系统性研读' },
  { label: '目标体量', value: '12 章 / 18 万字', note: '附录 + 时间线 + 关系图 + 金句卡' },
  { label: '连载篇数', value: '20 篇', note: '先连载、再合稿、最后成书' },
  { label: '工程母稿', value: 'Markdown', note: '统一 chapter 模板，方便多形态输出' },
  { label: '目标周期', value: '12 个月', note: '调研 3 月 + 连载 6 月 + 成稿 3 月' },
  { label: '出版形态', value: '纸书 + 电子书 + 网页连载', note: '同一母稿三轨发布' },
]

const THESIS_BULLETS = [
  '张居正用十年时间证明：一个人可以靠制度和权力让衰弱帝国短暂恢复元气。',
  '也用自己的结局证明：如果改革绑定在一个人身上、没有变成可继承的制度，成功越大，反噬越重。',
  '所以这本书的副标题是"成事与代价"——既写他做成了什么，也写他为成事付出了什么。',
]

const NARRATIVE_ARC = [
  { phase: '起势', years: '1525-1567', focus: '早慧、入仕、入阁，找到政治舞台', keywords: '天才、命名、被赏识、被压一压' },
  { phase: '得势', years: '1567-1572', focus: '万历幼主、李太后、冯保、高拱出局，形成权力结构', keywords: '机会、盟友、入口、污点' },
  { phase: '用势', years: '1572-1582', focus: '考成法、清丈、一条鞭、军事边防、财政整顿', keywords: '台账、追责、清丈、白银' },
  { phase: '失势', years: '1582-1584', focus: '夺情、震主、怨气累积、病逝、清算、身后评价回摆', keywords: '名节、皇权、清算、族祸' },
  { phase: '回摆', years: '1622 之后', focus: '平反、改革被重新评价', keywords: '功在社稷、过在身家' },
]

const TIMELINE = [
  { time: '1525', age: 1, event: '生于湖北江陵，幼名白圭', emperor: '嘉靖（1521-1567）' },
  { time: '1536', age: 12, event: '童试中秀才，文名渐起', emperor: '嘉靖' },
  { time: '1537', age: 13, event: '湖广巡抚顾璘见之，改名"居正"，称"国器"', emperor: '嘉靖' },
  { time: '1547', age: 23, event: '中进士，授翰林院庶吉士', emperor: '嘉靖' },
  { time: '1554-1557', age: '30-33', event: '请假回乡修养，观察严嵩与徐阶的中枢博弈', emperor: '嘉靖' },
  { time: '1567', age: 43, event: '隆庆即位，张居正入阁，参与改革设计', emperor: '隆庆（1567-1572）' },
  { time: '1568', age: 44, event: '上《陈六事疏》：省议论、振纪纲、重诏令、核名实、固邦本、饬武备', emperor: '隆庆' },
  { time: '1572', age: 48, event: '隆庆崩、万历即位、高拱出局、张居正任内阁首辅', emperor: '万历（1572-1620）' },
  { time: '1573', age: 49, event: '推行考成法：底册、月稽、岁考、追责', emperor: '万历' },
  { time: '1577', age: 53, event: '父亲张文明去世，"夺情"留任，引发廷杖大狱', emperor: '万历' },
  { time: '1578', age: 54, event: '全国清丈土地开始', emperor: '万历' },
  { time: '1581', age: 57, event: '一条鞭法在全国推行', emperor: '万历' },
  { time: '1582', age: 58, event: '病逝，赠太师，谥"文忠"', emperor: '万历' },
  { time: '1583', age: '—', event: '冯保失势、张家被弹劾', emperor: '万历' },
  { time: '1584', age: '—', event: '抄家、长子张敬修自缢、族人多人死伤', emperor: '万历' },
  { time: '1622', age: '—', event: '天启朝下诏平反、复官、复荫', emperor: '天启（1620-1627）' },
]

const RELATION_GROUPS = [
  {
    label: '权力三角',
    rows: [
      { name: '李太后', role: '政治靠山、万历母亲', value: '提供幼主期最高信任', risk: '太后退场后保护力下降' },
      { name: '冯保', role: '内廷盟友、司礼监掌印', value: '打通内外廷、共抗高拱', risk: '宦官盟友是清算突破口' },
      { name: '万历帝', role: '学生、皇帝、最终清算者', value: '改革的制度合法性来源', risk: '成长后对被管束反弹' },
    ],
  },
  {
    label: '文官关系',
    rows: [
      { name: '徐阶', role: '前辈、中枢政治样板', value: '张居正学习中枢技术', risk: '清流形象与现实手段的张力' },
      { name: '高拱', role: '朋友→竞争者', value: '前期合作推动隆庆改革', risk: '逐高拱成为张居正的政治原罪' },
      { name: '吴中行 / 赵用贤 / 邹元标', role: '夺情反对派', value: '士大夫名节代表', risk: '廷杖未死者，皆成死后清算燃料' },
    ],
  },
  {
    label: '武将 / 实干官僚',
    rows: [
      { name: '戚继光', role: '蓟镇总兵、守北边', value: '改革需要能打仗的将才', risk: '靠山倒后被边缘化' },
      { name: '李成梁', role: '辽东名将', value: '边防秩序与边市控制', risk: '武将私军化的长期隐患' },
      { name: '潘季驯', role: '治河名臣', value: '技术官僚是改革执行接口', risk: '技术问题政治化' },
    ],
  },
  {
    label: '家族关系',
    rows: [
      { name: '张文明', role: '父亲', value: '——', risk: '其去世引发夺情事件' },
      { name: '张敬修', role: '长子', value: '——', risk: '抄家时自缢，全书情感落点' },
      { name: '张氏家族', role: '清算承受者', value: '——', risk: '权力成功无法保护家人' },
    ],
  },
]

const KEY_EVENTS = [
  {
    title: '顾璘改名与少年成名',
    when: '1537',
    angle: '不要写成神童爽文，要写"早慧者如何被期待塑形"。"居正"二字本身就是命运叙事。',
    lesson: '被高手识别很重要；但天才如果过早顺遂，未必能承担大事。被压一压，是人才成长的一部分。',
  },
  {
    title: '《陈六事疏》：改革者的战略说明书',
    when: '1568',
    angle: '他在拿到首辅位置之前，就已经准备好一份完整的国家诊断报告。',
    lesson: '真正能成事的人，在拿到权力前就已经准备好一份"如果我有权我会做什么"的清单。',
  },
  {
    title: '逐高拱：权力入口的污点与必要性',
    when: '1572',
    angle: '从改革角度看必要、从道德角度看带污点、从政治结构看绑定了"幼主-太后-内廷"的脆弱基座。',
    lesson: '上位方式会影响后续所有评价。可以靠非常手段拿权，但必须为这种方式支付长期信用成本。',
  },
  {
    title: '考成法：张居正最值得现代人学习的制度设计',
    when: '1573',
    angle: '厉害之处在于把官僚系统从"说了算"改成"做没做、何时做、谁负责"——考核只是手段，真正变化的是问责口径。',
    lesson: '没台账就没执行、没截止时间就没责任、没追责目标就是口号；但考核过强也会压缩弹性与反馈。',
  },
  {
    title: '夺情事件：改革者的道德破口',
    when: '1577',
    angle: '改革关键期不能离开 vs 士大夫名节不可破——三种视角同时给出，不要简化为对错。',
    lesson: '做事的人最容易犯的错，是把"事情重要"当成突破规则的理由。短期赢了，长期失去最关键的道德信用。',
  },
  {
    title: '清丈土地 + 一条鞭法',
    when: '1578-1581',
    angle: '清丈解决税基、一条鞭解决征收复杂性、折银符合白银流通趋势；但改革触动地主、豪强、地方官的隐匿利益。',
    lesson: '所有改革最后都会落到"谁多交、谁少拿、谁失去灰色空间"。看不懂利益，就看不懂改革阻力。',
  },
  {
    title: '管教万历：成功老师与失败老板',
    when: '1572-1582',
    angle: '张居正以为自己在塑造好皇帝；万历感受到的可能是羞辱、压抑和被控制。',
    lesson: '管理一个未来会拥有最终权力的人，不能只靠严厉。你今天教育他，明天他可能清算你。',
  },
  {
    title: '死后清算：为什么"人亡政息"',
    when: '1582-1584',
    angle: '不能只写"万历忘恩负义"，要写六层结构原因：皇权重申、内廷失援、积怨集中、利益反扑、缺继任设计、官场需要泄愤出口。',
    lesson: '如果一套系统只能靠一个强人维持，本质上是高压下的暂时稳定，制度化并未完成。',
  },
]

const BOOK_OUTLINE = [
  {
    part: '第一部：一个改革者的形成',
    chapters: [
      { n: 1, title: '江陵少年：被命名的人生', theme: '天才如何进入国家机器' },
      { n: 2, title: '翰林院里的等待', theme: '真正的政治能力来自长期观察' },
      { n: 3, title: '从清谈到方案：《陈六事疏》', theme: '上位前先有方案' },
    ],
  },
  {
    part: '第二部：权力是改革的入口',
    chapters: [
      { n: 4, title: '隆庆朝的机会', theme: '改革需要外部环境稳定' },
      { n: 5, title: '高拱出局：权力入口的代价', theme: '权力不是白拿的' },
      { n: 6, title: '帝国项目经理：考成法', theme: '把国家机器变成可追踪系统' },
    ],
  },
  {
    part: '第三部：十年当国',
    chapters: [
      { n: 7, title: '财政重启：清丈土地与一条鞭法', theme: '改革本质是利益重分配' },
      { n: 8, title: '边防与用人：戚继光、李成梁、潘季驯', theme: '改革不只是政策，更是用人' },
      { n: 9, title: '夺情：事情、名节与规则', theme: '大事与名节的不可调和' },
    ],
  },
  {
    part: '第四部：成功的反噬',
    chapters: [
      { n: 10, title: '他为什么伤害了万历', theme: '塑造权力者的风险' },
      { n: 11, title: '死后清算：一个强人系统的崩塌', theme: '人亡政息' },
      { n: 12, title: '功在社稷，过在身家', theme: '如何评价一个复杂人物' },
    ],
  },
]

const SERIAL_PLAN = [
  '为什么今天还要写张居正？',
  '江陵少年张白圭',
  '顾璘为什么看出他是"国器"',
  '翰林院：权力旁观者的训练',
  '《陈六事疏》：张居正的国家诊断书',
  '高拱、徐阶与中枢政治',
  '万历登基：幼主时代的机会',
  '张居正、冯保、李太后的三角联盟',
  '考成法：大明版项目管理系统',
  '清丈土地：让国家重新看见税基',
  '一条鞭法：财政改革为什么难',
  '戚继光为什么需要张居正',
  '夺情：改革者的道德破口',
  '张居正如何教育万历',
  '万历为什么后来恨他',
  '张居正之死',
  '抄家、族祸与官场泄愤',
  '为什么张居正"人亡政息"',
  '张居正的书怎么读',
  '今天我们能从张居正身上学什么',
]

const WORKS = [
  { name: '《张太岳集》/《张文忠公全集》', form: '奏疏、书牍、诗文、行实', use: '研究政治思想与真实语气的核心' },
  { name: '《书经直解》', form: '经筵讲义 / 儒家经典解释', use: '看他如何教育万历、如何讲政治伦理' },
  { name: '《帝鉴图说》', form: '给皇帝看的历史图鉴与训诫', use: '看他如何用历史故事塑造君主' },
  { name: '《陈六事疏》', form: '改革纲领单篇', use: '可作为全书关键文本逐句解读' },
]

const METHODOLOGY = [
  {
    layer: '故事入口',
    style: '当年明月式',
    pros: '好读、适合大众、传播力强',
    risks: '容易戏说，需要史实边界',
    use: '每章开头的场景与对白',
  },
  {
    layer: '制度骨架',
    style: '《大明王朝1566》式',
    pros: '有思想深度，能讲清"为什么"',
    risks: '太重、读者可能觉得累',
    use: '中段事件复盘、关系网络拆解',
  },
  {
    layer: '方法出口',
    style: '管理学 / 创业者视角',
    pros: '可转成成长方法论，提高复读率',
    risks: '过度现代化类比，需明确"类比不是等同"',
    use: '每章末"今天能学什么"小节',
  },
]

const CHAPTER_TEMPLATE = `# 章节标题

## 开场场景
（一段当下感强的画面，把读者拉进时代）

## 事件复盘
（基于史料的事件还原，标注分歧与争议）

## 人物关系
（这一事件中的关键人物及其动机）

## 史料与争议
（不同史源的差异、现代研究的看法）

## 我的判断
（作者立场，明确而克制）

## 今天能学什么
（不超过 5 条可迁移的方法论）

## 本章金句
（1-3 句可单独传播的结论）`

const ATOMIC_NOTES = [
  { type: '人物卡', fields: ['身份', '与张居正关系', '共同利益', '潜在冲突', '关键事件', '写作判断', '可学习点'] },
  { type: '事件卡', fields: ['时间', '背景', '张居正的选择', '反对者的理由', '结果', '短期收益', '长期代价', '我的评论'] },
  { type: '原文卡', fields: ['原文摘录', '出处', '现代翻译', '使用场景', '对应章节'] },
]

const FACT_CHECKLIST = [
  '张居正出生日期、籍贯、幼名、字、号',
  '顾璘改名与"国器"说的最早出处',
  '嘉靖二十六年进士与翰林任职细节',
  '《陈六事疏》原文与六事的具体内容',
  '高拱出局的史料分歧与各家说法',
  '考成法的具体制度流程（底册、月稽、岁考）',
  '夺情事件参与人物与廷杖结果数据',
  '清丈土地与一条鞭法的时间差与覆盖范围',
  '戚继光、李成梁、潘季驯与张居正的关系证据',
  '万历与张居正心理裂痕的史料依据',
  '张居正死因的正史与现代推测边界',
  '抄家与张敬修自缢、族人死亡数量的来源',
  '天启、崇祯时期平反过程的诏书原文',
  '《张太岳集》《书经直解》《帝鉴图说》版本与内容',
]

const TWELVE_MONTH = [
  { month: 'M1', phase: '调研', deliverable: '通读《明史·张居正传》《万历十五年》《张居正大传》《中国历代政治得失》；做 30 张人物卡 + 50 张事件卡' },
  { month: 'M2', phase: '调研', deliverable: '《张太岳集》核心奏疏精读；建立 timeline.csv 与 relationship-map.md' },
  { month: 'M3', phase: '调研→样章', deliverable: '完成 3 篇试读：考成法、三角联盟、夺情；公开发布看反馈' },
  { month: 'M4', phase: '连载', deliverable: '正式开始 20 篇连载（每月 4 篇），同步打磨写作语调' },
  { month: 'M5', phase: '连载', deliverable: '完成连载第 5-8 篇；建立读者邮件列表 / 微信群' },
  { month: 'M6', phase: '连载', deliverable: '完成连载第 9-12 篇；同步整理金句卡与配图' },
  { month: 'M7', phase: '连载', deliverable: '完成连载第 13-16 篇；接触 2-3 家出版社或工作室探口风' },
  { month: 'M8', phase: '连载', deliverable: '完成连载第 17-20 篇；确定主标题、副标题、装帧方向' },
  { month: 'M9', phase: '合稿', deliverable: '将连载篇章合并为 12 章母稿，补全过渡与缺口章节' },
  { month: 'M10', phase: '合稿', deliverable: '内部审读：找 3-5 位历史 / 编辑 / 管理读者交叉评审；按反馈改稿' },
  { month: 'M11', phase: '出版', deliverable: '与出版方签约，进入编辑、校对、设计、申请书号流程' },
  { month: 'M12', phase: '出版', deliverable: '同步上线：纸书预售 + 电子书上架 + 网页连载完整版 + 课程脚本草案' },
]

const PUBLISH_PATHS = [
  {
    path: '传统出版（首选）',
    desc: '与有"明史 / 历史人物 / 财经管理"线的出版社合作，申请书号、走 ISBN，进入新华、京东、当当渠道',
    fit: '适合想要长期"名片型"作品、希望进入图书馆和官方阅读榜单的写作者',
    risk: '周期长（6-12 个月）、印张和定价受控、版税通常 6%-10%',
    candidates: '中信出版集团、广西师大出版社（理想国）、上海三联、社科文献、人民东方、湛庐文化、磨铁',
  },
  {
    path: '自费出版 + 电子书',
    desc: '通过出版服务商办理书号与印刷、自主定价与营销；电子书上微信读书、得到、京东读书',
    fit: '适合想要快速面世、保留版税与定价权、并以私域为主要分发渠道的写作者',
    risk: '需自付编辑、设计、印刷和书号成本；铺货能力依赖个人渠道',
    candidates: '出版服务公司（如纸间留白、知识出版社合作）',
  },
  {
    path: '网页连载先行',
    desc: '在 2aran.com 上做完整连载 + PDF / EPUB 下载，再用读者反馈反推合稿与出版选择',
    fit: '所有情况都应该并行做：低成本、可持续、能形成 GEO 资产',
    risk: '需要长期内容运营，初期阅读量低',
    candidates: '本站 /articles + 公众号 + 知乎专栏 + 掘金（节选）',
  },
]

const PROGRESS_BOARD = [
  { item: '主线判断', status: '✅ 已确认', note: '"成事与代价"双线主线、四段叙事' },
  { item: '12 章目录', status: '✅ 已完成', note: '4 部 12 章 + 附录定稿' },
  { item: '关键事件清单（8 个）', status: '✅ 已完成', note: '每个事件配独立"角度 + 学习点"' },
  { item: 'timeline.csv', status: '🟡 草稿', note: '15 条初稿，需扩展到 30+ 条' },
  { item: 'relationship-map.md', status: '🟡 草稿', note: '权力三角 / 文官 / 武将 / 家族四组已列' },
  { item: '试读章 1：考成法', status: '⬜ 未开始', note: 'M3 交付' },
  { item: '试读章 2：三角联盟', status: '⬜ 未开始', note: 'M3 交付' },
  { item: '试读章 3：夺情', status: '⬜ 未开始', note: 'M3 交付' },
  { item: '20 篇连载', status: '⬜ 未开始', note: 'M4-M8 交付' },
  { item: '出版社接洽', status: '⬜ 未开始', note: 'M7 启动' },
  { item: '终稿合并', status: '⬜ 未开始', note: 'M9-M10' },
  { item: '出版上市', status: '⬜ 未开始', note: 'M11-M12' },
]

const RISKS = [
  {
    risk: '史实硬伤',
    detail: '人物传记最怕被历史专家挑出细节错。',
    mitigation: '关键事件至少交叉两种正史来源；现代研究优先用署名学者论文；附录列出"已知争议点"清单',
  },
  {
    risk: '过度现代化类比',
    detail: '把考成法说成"项目管理系统"、把一条鞭法说成"商业模式重构"可能滑向戏说。',
    mitigation: '每个现代类比后附"类比边界"小节，明确不能等同的部分',
  },
  {
    risk: '人物简化',
    detail: '写成"翻案"或"定罪"都会丢失张居正最有价值的"矛盾"。',
    mitigation: '每个性格面都用"正面 / 负面 / 写法"三栏并列；避免单向度结论',
  },
  {
    risk: '执行节奏失控',
    detail: '12 个月里同时做调研、连载、改稿、出版，很容易某一段掉链。',
    mitigation: '只把"M1-M3 调研"和"M9-M10 合稿"作为强约束；连载允许节奏微调；每月最后一周复盘',
  },
  {
    risk: '出版谈判被动',
    detail: '没有粉丝盘 / 数据 / 案例时，跟出版社谈判会很被动。',
    mitigation: '连载阶段就同步积累读者邮件列表、文章阅读量、转化案例，签约时用数据谈条件',
  },
  {
    risk: '版权与改编风险',
    detail: '后续如做课程、有声书、影视改编，权属约定不清会留下隐患。',
    mitigation: '出版合同里明确电子书、有声、课程、影视的分项授权与版税；保留母稿著作权',
  },
]

const ACTION_NEXT = [
  '本周：在仓库里建好 12 章母稿目录骨架（zhang-juzheng-book/01..12 .md 空文件 + 章节模板）。',
  '本周：写完试读章 1《考成法：张居正如何把大明变成项目管理系统》草稿。',
  '本月内：完成 timeline.csv（30+ 条）与 relationship-map.md（4 组关系完整版）。',
  '下个月：试读章 2《三角联盟》、试读章 3《夺情》发布；启动读者邮件列表。',
  'M4 开始：正式连载，每月 4 篇，节奏卡稳。',
  'M7 同步：开始接触 2-3 家候选出版方，按"出版路径"三轨方案落地。',
]

function StatusBadge({ status }) {
  const tone = status.startsWith('✅')
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : status.startsWith('🟡')
    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-[1px] text-[11px] ${tone}`}>{status}</span>
  )
}

export default function ZhangJuzhengBookPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#888] dark:text-gray-400">
          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-[1px]">
            专题 · 写作创作
          </span>
          <span>·</span>
          <time dateTime="2026-05-30">2026-05-30 立项</time>
          <span>·</span>
          <span>预计 12 个月</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100 mt-3">
          《张居正：一个改革者的成事与代价》
        </h1>
        <p className="text-sm text-[#666] dark:text-gray-300 mt-3 leading-relaxed">
          以"写一本张居正的书并发布出版"为长期工程目标，沿主线 → 人物 → 事件 → 写作 → 出版的顺序，把一个改革者的成事与代价拆成可读、可写、可出版的结构。
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
          <Link href="/articles?tab=writing" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            ← 返回写作创作
          </Link>
          <Link href="/history/ming-qing" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            相关：明清史时间线
          </Link>
          <Link href="/articles/research/topics/isbn-ban-hao-publishing-number-system" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            相关：ISBN / 书号体系
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="hidden md:block md:w-52 shrink-0">
          <nav className="toc-scroll-panel sticky top-20">
            <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
              目录
            </div>
            <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
              {[
                ['#why', '一、为什么要写'],
                ['#thesis', '二、一句话主线'],
                ['#arc', '三、人物弧线'],
                ['#timeline', '四、关键时间线'],
                ['#relations', '五、人物关系网络'],
                ['#events', '六、关键事件评论'],
                ['#outline', '七、全书目录'],
                ['#serial', '八、20 篇连载计划'],
                ['#works', '九、张居正著作'],
                ['#methodology', '十、写作风格与方法'],
                ['#engineering', '十一、Markdown 工程'],
                ['#facts', '十二、史实核验清单'],
                ['#schedule', '十三、12 个月节奏'],
                ['#publish', '十四、出版路径'],
                ['#progress', '十五、进度看板'],
                ['#risks', '十六、风险与对策'],
                ['#next', '十七、下一步行动'],
                ['#sources', '十八、信息来源'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="opacity-80 hover:opacity-100 underline underline-offset-4">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {/* KPI 卡 */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
            {KPI.map((k) => (
              <div
                key={k.label}
                className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="text-xs text-[#999] dark:text-gray-400">{k.label}</div>
                <div className="text-lg font-bold text-[#222] dark:text-gray-100 mt-1">{k.value}</div>
                <div className="text-xs text-[#888] dark:text-gray-400 mt-1">{k.note}</div>
              </div>
            ))}
          </section>

          {/* 一、为什么要写 */}
          <section id="why" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">一、为什么要写：用输出倒逼输入</h2>
            <div className="mt-3 text-sm text-[#666] dark:text-gray-300 leading-relaxed space-y-3">
              <p>
                "读懂张居正"这件事如果停留在"看几本书"，注意力会被工作和生活稀释，半年后只剩模糊印象。但如果给自己定下"写一本张居正的书并发布出版"这个公开承诺，输入就被强制变成系统化的：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><b>读完后必须有判断</b>——写下来才知道自己懂没懂；</li>
                <li><b>必须有结构</b>——目录倒逼读书顺序与边界；</li>
                <li><b>必须可校验</b>——出版要核对史实，读不细就过不去；</li>
                <li><b>必须可解释</b>——给陌生读者讲清楚，比给自己讲清楚难十倍；</li>
                <li><b>必须可分发</b>——选择题目、装帧、定价、渠道，反过来逼你想清楚"这本书对谁有用"。</li>
              </ul>
              <p>
                所以核心是用一本书的标准强迫自己彻底搞懂一个人。书是副产品，理解力才是真正想要的东西。
              </p>
            </div>
          </section>

          {/* 二、一句话主线 */}
          <section id="thesis" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">二、一句话主线</h2>
            <blockquote className="mt-4 border-l-4 border-indigo-400 pl-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/30 text-[#444] dark:text-gray-200 text-sm leading-relaxed">
              张居正用十年时间证明：一个人可以靠制度和权力让衰弱帝国短暂恢复元气；也用自己的结局证明：如果改革绑定在一个人身上、没有变成可继承的制度，成功越大，反噬越重。
            </blockquote>
            <ul className="mt-4 text-sm text-[#666] dark:text-gray-300 space-y-2 list-disc list-inside">
              {THESIS_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>

          {/* 三、人物弧线 */}
          <section id="arc" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">三、人物弧线：起势 → 得势 → 用势 → 失势 → 回摆</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-[#fafafa] dark:bg-gray-800/40 text-xs text-[#888] dark:text-gray-400">
                  <tr>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">阶段</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">时间</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">核心叙事</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">写作重点</th>
                  </tr>
                </thead>
                <tbody>
                  {NARRATIVE_ARC.map((r) => (
                    <tr key={r.phase} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 font-bold text-[#444] dark:text-gray-200">{r.phase}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{r.years}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{r.focus}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{r.keywords}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 四、时间线 */}
          <section id="timeline" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">四、关键时间线（v0.1，待扩到 30+ 条）</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-[#fafafa] dark:bg-gray-800/40 text-xs text-[#888] dark:text-gray-400">
                  <tr>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">时间</th>
                    <th className="text-right font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">年龄</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">事件</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">在位皇帝</th>
                  </tr>
                </thead>
                <tbody>
                  {TIMELINE.map((r) => (
                    <tr key={r.time + String(r.age)} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 font-bold text-[#444] dark:text-gray-200">{r.time}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 text-right whitespace-nowrap">{r.age}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{r.event}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{r.emperor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 五、人物关系 */}
          <section id="relations" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">五、人物关系网络</h2>
            {RELATION_GROUPS.map((g) => (
              <div key={g.label} className="mt-5">
                <h3 className="text-[#444] text-base font-bold dark:text-gray-200">{g.label}</h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                    <thead className="bg-[#fafafa] dark:bg-gray-800/40 text-xs text-[#888] dark:text-gray-400">
                      <tr>
                        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">人物</th>
                        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">身份 / 与张居正关系</th>
                        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">作用</th>
                        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">风险</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r.name} className="align-top">
                          <td className="p-2 border-b border-[#eee] dark:border-gray-800 font-bold text-[#444] dark:text-gray-200 whitespace-nowrap">{r.name}</td>
                          <td className="p-2 border-b border-[#eee] dark:border-gray-800">{r.role}</td>
                          <td className="p-2 border-b border-[#eee] dark:border-gray-800">{r.value}</td>
                          <td className="p-2 border-b border-[#eee] dark:border-gray-800">{r.risk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          {/* 六、关键事件 */}
          <section id="events" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">六、关键事件评论（每件事都要有"怎么看 + 学什么"）</h2>
            <div className="mt-4 space-y-4">
              {KEY_EVENTS.map((e) => (
                <div key={e.title} className="border border-[#eee] dark:border-gray-800 p-4 bg-[#fafafa]/50 dark:bg-gray-800/20">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[#444] text-base font-bold dark:text-gray-200">{e.title}</h3>
                    <span className="text-xs text-[#999] dark:text-gray-400 whitespace-nowrap">{e.when}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#666] dark:text-gray-300"><b>角度：</b>{e.angle}</p>
                  <p className="mt-1 text-sm text-[#666] dark:text-gray-300"><b>学习点：</b>{e.lesson}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 七、全书目录 */}
          <section id="outline" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">七、全书目录（4 部 12 章 + 附录）</h2>
            <div className="mt-4 space-y-5">
              {BOOK_OUTLINE.map((p) => (
                <div key={p.part}>
                  <h3 className="text-[#444] text-base font-bold dark:text-gray-200">{p.part}</h3>
                  <ul className="mt-2 space-y-2">
                    {p.chapters.map((c) => (
                      <li key={c.n} className="text-sm text-[#666] dark:text-gray-300 flex gap-3">
                        <span className="w-8 shrink-0 text-[#999] dark:text-gray-400 font-mono text-xs">第{c.n}章</span>
                        <span className="flex-1">
                          <b className="text-[#444] dark:text-gray-200">{c.title}</b>
                          <span className="text-[#888] dark:text-gray-400 ml-2 text-xs">— {c.theme}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="mt-2 text-xs text-[#888] dark:text-gray-400 border-t border-[#eee] dark:border-gray-800 pt-3">
                <b>附录</b>：张居正年表 · 关系图 · 万历新政关键词 · 著作导读 · "从张居正学组织管理的 20 条"
              </div>
            </div>
          </section>

          {/* 八、20 篇连载 */}
          <section id="serial" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">八、20 篇连载计划（成书前的公开试水）</h2>
            <p className="mt-2 text-xs text-[#888] dark:text-gray-400">先在 2aran.com + 公众号 + 知乎专栏发布，看反馈调整全书口吻。</p>
            <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#666] dark:text-gray-300 list-decimal list-inside">
              {SERIAL_PLAN.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </section>

          {/* 九、著作 */}
          <section id="works" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">九、张居正著作：怎么读、怎么写进书里</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-[#fafafa] dark:bg-gray-800/40 text-xs text-[#888] dark:text-gray-400">
                  <tr>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">著作</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">内容形态</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">写作用法</th>
                  </tr>
                </thead>
                <tbody>
                  {WORKS.map((w) => (
                    <tr key={w.name} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 font-bold text-[#444] dark:text-gray-200">{w.name}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{w.form}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{w.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#888] dark:text-gray-400">
              最值得做的写法：<b>每章开头放一句张居正原文，再用现代语言解释它背后的政治判断。</b>
            </p>
          </section>

          {/* 十、方法 */}
          <section id="methodology" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十、写作风格：故事入口 + 制度骨架 + 方法出口</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-[#fafafa] dark:bg-gray-800/40 text-xs text-[#888] dark:text-gray-400">
                  <tr>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">层级</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">风格</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">优势</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">风险</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">用在哪</th>
                  </tr>
                </thead>
                <tbody>
                  {METHODOLOGY.map((m) => (
                    <tr key={m.layer} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 font-bold text-[#444] dark:text-gray-200 whitespace-nowrap">{m.layer}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{m.style}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{m.pros}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{m.risks}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{m.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 十一、Markdown 工程 */}
          <section id="engineering" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十一、Markdown 写作工程：母稿 + 模板 + 卡片</h2>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">
              所有正文都以 Markdown 为母稿，方便后续一次成稿、多形态输出（纸书 / 电子书 / 网页连载 / PPT / 短视频脚本）。
            </p>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">仓库结构</h3>
                <pre className="text-xs bg-[#f5f5f5] dark:bg-gray-800 p-3 overflow-x-auto rounded border border-[#eee] dark:border-gray-700 text-[#444] dark:text-gray-200">{`zhang-juzheng-book/
├── 00-preface.md
├── 01-jiangling-boy.md
├── 02-hanlin-training.md
├── 03-chen-liu-shi-shu.md
├── 04-power-entry.md
├── 05-kao-cheng-fa.md
├── 06-tax-reform.md
├── 07-duo-qing.md
├── 08-wanli.md
├── 09-purge.md
├── 10-legacy.md
└── assets/
    ├── timeline.csv
    ├── relationship-map.md
    └── quote-cards.md`}</pre>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">每章模板</h3>
                <pre className="text-xs bg-[#f5f5f5] dark:bg-gray-800 p-3 overflow-x-auto rounded border border-[#eee] dark:border-gray-700 text-[#444] dark:text-gray-200">{CHAPTER_TEMPLATE}</pre>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">三类素材卡（贯穿全书使用）</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {ATOMIC_NOTES.map((n) => (
                  <div key={n.type} className="border border-[#eee] dark:border-gray-800 p-3 bg-[#fafafa]/50 dark:bg-gray-800/20">
                    <div className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">{n.type}</div>
                    <ul className="text-xs text-[#666] dark:text-gray-300 space-y-1 list-disc list-inside">
                      {n.fields.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 十二、史实核验 */}
          <section id="facts" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十二、必须核验的史实清单</h2>
            <p className="mt-2 text-xs text-[#888] dark:text-gray-400">每条至少两种正史 / 学者论文交叉验证后才能写入正文。</p>
            <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#666] dark:text-gray-300 list-decimal list-inside">
              {FACT_CHECKLIST.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ol>
          </section>

          {/* 十三、12 个月节奏 */}
          <section id="schedule" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十三、12 个月执行节奏</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-[#fafafa] dark:bg-gray-800/40 text-xs text-[#888] dark:text-gray-400">
                  <tr>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">月份</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">阶段</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">交付物</th>
                  </tr>
                </thead>
                <tbody>
                  {TWELVE_MONTH.map((m) => (
                    <tr key={m.month} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 font-bold text-[#444] dark:text-gray-200 whitespace-nowrap">{m.month}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{m.phase}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{m.deliverable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#888] dark:text-gray-400">
              强约束：M1-M3 调研、M9-M10 合稿；其他阶段允许节奏微调；每月最后一周复盘。
            </p>
          </section>

          {/* 十四、出版路径 */}
          <section id="publish" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十四、出版路径：三轨并行</h2>
            <div className="mt-4 space-y-4">
              {PUBLISH_PATHS.map((p) => (
                <div key={p.path} className="border border-[#eee] dark:border-gray-800 p-4 bg-[#fafafa]/50 dark:bg-gray-800/20">
                  <h3 className="text-[#444] text-base font-bold dark:text-gray-200">{p.path}</h3>
                  <p className="mt-2 text-sm text-[#666] dark:text-gray-300"><b>形式：</b>{p.desc}</p>
                  <p className="mt-1 text-sm text-[#666] dark:text-gray-300"><b>适合：</b>{p.fit}</p>
                  <p className="mt-1 text-sm text-[#666] dark:text-gray-300"><b>风险：</b>{p.risk}</p>
                  <p className="mt-1 text-sm text-[#666] dark:text-gray-300"><b>候选：</b>{p.candidates}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 十五、进度看板 */}
          <section id="progress" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十五、进度看板</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-[#fafafa] dark:bg-gray-800/40 text-xs text-[#888] dark:text-gray-400">
                  <tr>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">事项</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">状态</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {PROGRESS_BOARD.map((p) => (
                    <tr key={p.item} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 font-bold text-[#444] dark:text-gray-200">{p.item}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap"><StatusBadge status={p.status} /></td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 十六、风险 */}
          <section id="risks" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十六、风险与对策</h2>
            <div className="mt-4 space-y-3">
              {RISKS.map((r) => (
                <div key={r.risk} className="border border-[#eee] dark:border-gray-800 p-4 bg-[#fafafa]/50 dark:bg-gray-800/20">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[#444] text-sm font-bold dark:text-gray-200">{r.risk}</h3>
                  </div>
                  <p className="mt-1 text-sm text-[#666] dark:text-gray-300">{r.detail}</p>
                  <p className="mt-1 text-sm text-[#666] dark:text-gray-300"><b>对策：</b>{r.mitigation}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 十七、下一步 */}
          <section id="next" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十七、下一步行动</h2>
            <ol className="mt-3 space-y-2 text-sm text-[#666] dark:text-gray-300 list-decimal list-inside">
              {ACTION_NEXT.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </section>

          {/* 十八、来源 */}
          <section id="sources" className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6 scroll-mt-24">
            <h2 className="text-[#444] text-lg font-bold dark:text-gray-200">十八、信息来源</h2>
            <ul className="mt-3 text-sm text-[#666] dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>《明史·张居正传》《明史·神宗本纪》《明史·食货志》</li>
              <li>《明实录》：嘉靖、隆庆、万历相关记录</li>
              <li>张居正：《张太岳集》《张文忠公全集》《书经直解》《帝鉴图说》</li>
              <li>朱东润：《张居正大传》</li>
              <li>黄仁宇：《万历十五年》</li>
              <li>钱穆：《中国历代政治得失》</li>
              <li>陈国平：《张居正改革中的考成法考论》</li>
              <li>光明网《400 年后再看张居正的改革》</li>
              <li>人民周刊网《围绕张居正守制与夺情的论战》</li>
              <li>中国文化研究院《张居正被清算之谜》</li>
              <li>站内：<Link href="/history/ming-qing" className="underline underline-offset-4">明清史时间线</Link></li>
              <li>站内：<Link href="/articles/research/topics/isbn-ban-hao-publishing-number-system" className="underline underline-offset-4">ISBN / 书号体系</Link></li>
            </ul>
          </section>

          <footer className="mt-10 text-xs text-[#888] dark:text-gray-400">
            <p>立项时间 2026-05-30。</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
