/**
 * Grokbot（@grokbot）关注列表治理 playbook。
 * 公开页渲染用；执行前以当次对话里写明的规则为准。
 */

export const GROKBOT_PLAYBOOK_VERSION = '2026-11-27'

export const grokbotLayers = [
  {
    level: 'L0',
    name: '权限与红线',
    scope: '谁能动、能动什么',
    deliverable: '绑定 X 后的操作边界说明',
    gate: '未书面确认不取关、不代发、不批量扩面',
  },
  {
    level: 'L1',
    name: '策略目标',
    scope: '这批清理要达成什么',
    deliverable: '目标句 + 本轮批次上限',
    gate: '目标与站点账号人格一致（运营号 / 个人号分开写）',
  },
  {
    level: 'L2',
    name: '分类规则',
    scope: '取关、保留、灰区',
    deliverable: '规则编号表（UF / RT / GZ）',
    gate: '保留规则优先于取关规则；冲突进灰区',
  },
  {
    level: 'L3',
    name: '批次执行',
    scope: '筛选 → 名单 → 确认 → 执行',
    deliverable: '候选表（账号、理由、规则编号）',
    gate: '站长逐批签字后再让 Grokbot 执行',
  },
  {
    level: 'L4',
    name: '质量闭环',
    scope: '抽检、误伤、记录',
    deliverable: '复盘表 + 日历执行记录',
    gate: '误伤超阈值暂停下一批',
  },
]

export const grokbotUnfollowRules = [
  {
    id: 'UF-01',
    tier: '硬取关',
    signal: '未回关',
    threshold: '单向关注满 90 天，且窗口内无双向公开互动（回复/提及/引用）',
    action: '列入取关候选',
    evidence: 'Grokbot 引 handle + 最近互动日期',
    exception: '命中任一保留规则则不出候选',
  },
  {
    id: 'UF-02',
    tier: '硬取关',
    signal: '长期不活跃',
    threshold: '对方 ≥180 天无公开帖，且非保留名单',
    action: '列入取关候选',
    evidence: '最近推文时间或「无公开活动」说明',
    exception: '曾因高价值讨论被站长标记保留',
  },
  {
    id: 'UF-03',
    tier: '硬取关',
    signal: '辱骂 / 骚扰',
    threshold: '针对本人的侮辱、威胁、人身攻击（不含纯观点分歧）',
    action: '优先列入取关候选',
    evidence: '原文摘录或帖子链接',
    exception: '已道歉且后续无复发 → 转灰区人工判',
  },
  {
    id: 'UF-04',
    tier: '硬取关',
    signal: '僵尸营销',
    threshold: '批量模板帖、鱼塘号特征、昵称头像引流模式',
    action: '列入取关候选',
    evidence: '重复话术样例',
    exception: '实名合作方误报 → 加白名单',
  },
  {
    id: 'UF-05',
    tier: '软取关',
    signal: '低质量单向关注',
    threshold: '关注后从未互动，且粉丝/关注比极端异常',
    action: '低优先级候选，放每批末尾',
    evidence: '关注时间与互动计数',
    exception: '新关注 14 天内不处理',
  },
]

export const grokbotRetainRules = [
  {
    id: 'RT-01',
    tier: '强制保留',
    signal: '建设性批评',
    threshold: '批评具体、可核对，非辱骂',
    action: '永不因「未回关」单独取关',
    evidence: '引文 + 你的回复记录',
    exception: '后续转为 UF-03 辱骂 → 重新评估',
  },
  {
    id: 'RT-02',
    tier: '强制保留',
    signal: '互动前十',
    threshold: '落在大互动日历某自然日 top10',
    action: '本周期保留',
    evidence: '日历日期 + 互动次数',
    exception: '明确垃圾互动（刷量）→ 灰区',
  },
  {
    id: 'RT-03',
    tier: '强制保留',
    signal: '互关且活跃',
    threshold: '互关，近 30 天有双向公开互动',
    action: '保留',
    evidence: '互动类型拆分',
    exception: '互关但仅广告互粉 → UF-04',
  },
  {
    id: 'RT-04',
    tier: '强制保留',
    signal: '站长白名单',
    threshold: '合作方、同事、家人等显式点名',
    action: '保留至人工改名单',
    evidence: '白名单表 / 对话里 @ 列表',
    exception: '账号被盗或转卖 → 人工剔除',
  },
  {
    id: 'RT-05',
    tier: '建议保留',
    signal: '认证与高相关领域',
    threshold: '蓝V / 机构 / 本领域常读作者',
    action: '默认保留，除非命中 UF-03',
    evidence: '认证状态 + 近帖主题',
    exception: '长期无关广告号 → UF-02',
  },
]

export const grokbotGrayRules = [
  {
    id: 'GZ-01',
    cue: '潜水老粉',
    condition: '长期不活跃，但历史上有过高价值对话',
    resolution: '人工二选一：保留观察期 60 天，或取关并私信说明',
    owner: '站长',
  },
  {
    id: 'GZ-02',
    cue: '观点冲突',
    condition: '立场对立但未辱骂',
    resolution: '默认保留；若噪音过高可静音而非取关',
    owner: '站长',
  },
  {
    id: 'GZ-03',
    cue: '规则冲突',
    condition: '同时命中 UF 与 RT',
    resolution: 'RT 优先；仍无法判定则整批不上线，改规则措辞',
    owner: '站长 + Grokbot 复述冲突点',
  },
  {
    id: 'GZ-04',
    cue: '证据不足',
    condition: 'Grokbot 无法给出链接或时间戳',
    resolution: '不进入执行名单，补采后再筛',
    owner: 'Grokbot 补证据',
  },
]

export const grokbotBatchPhases = [
  { phase: 'P1', step: '写规则', grokbot: '复述 L1 目标 + 挂载 UF/RT/GZ 表', human: '改措辞直到无歧义', output: '规则包' },
  { phase: 'P2', step: '粗筛', grokbot: '按规则拉候选（仅 following）', human: '—', output: '候选长名单' },
  { phase: 'P3', step: '核对', grokbot: '每人一条理由 + 规则编号', human: '划掉保留、标注灰区', output: '确认名单' },
  { phase: 'P4', step: '执行', grokbot: '仅对确认名单取关', human: '逐批在线或限时窗口', output: '执行回执' },
  { phase: 'P5', step: '发帖', grokbot: '可生成说明帖草稿', human: '确认前不代发', output: '草稿（可选）' },
  { phase: 'P6', step: '复盘', grokbot: '汇总取关数、误报申诉', human: '填 QC 表、写日历记录', output: '复盘行' },
]

export const grokbotQualityChecks = [
  {
    id: 'QC-01',
    item: '名单门禁',
    metric: '执行前人工过目率',
    pass: '100% 确认名单已导出并人工保存',
    fail: '整批作废，禁止 Grokbot 代点',
    record: '截图或导出 CSV 时间戳',
  },
  {
    id: 'QC-02',
    item: '理由可审计',
    metric: '候选是否含规则编号 + 证据',
    pass: '≥95% 行有编号；灰区 100% 有说明',
    fail: '退回 P2 补证据',
    record: '名单附加「理由」列',
  },
  {
    id: 'QC-03',
    item: '误伤抽检',
    metric: '执行后 24h 抽检',
    pass: '抽检 ≥min(10,5%) 无 RT 类误伤',
    fail: '暂停扩大批次；回滚误取关',
    record: '抽检表 + 回关记录',
  },
  {
    id: 'QC-04',
    item: '批次节奏',
    metric: '单批取关人数',
    pass: '首场景 ≤50，熟练后 ≤200，周增幅 ≤30%',
    fail: '拆批或隔周再开',
    record: '批次日志',
  },
  {
    id: 'QC-05',
    item: '日历留痕',
    metric: '大互动日历 Grokbot 执行记录',
    pass: '日期、批次数、取关数、备注',
    fail: '补记后再开新批',
    record: '/calendar 对应账号行',
  },
  {
    id: 'QC-06',
    item: '对外一致性',
    metric: '说明帖与实际规则',
    pass: '发帖口径与 UF/RT 表一致',
    fail: '删帖或更正说明',
    record: '帖子链接',
  },
]

export const grokbotPromptSnippets = [
  {
    scene: '开批前',
    text: '按附件规则表（UF/RT/GZ）筛我 following 的取关候选。保留规则优先。每人给 handle、规则编号、一句理由、证据。先不要取关，输出表格。',
  },
  {
    scene: '保留强调',
    text: 'RT-01：即使有批评也要保留。RT-02：大互动日历互动前十本周期不取关。白名单：@…（逐条列出）。',
  },
  {
    scene: '确认执行',
    text: '仅对上表我划掉「保留」后的 handle 执行取关，本批上限 N 个。执行完给回执：成功数、失败数、失败原因。',
  },
  {
    scene: '日更汇总',
    text: '绑定 X 后，按北京时间自然日汇总与我双向互动最多的 10 位朋友（与日历口径一致），输出 handle + 次数，不写长文。',
  },
]