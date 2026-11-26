// Claude 中转市场全景数据 · 公开信息汇总快照
// 核验时间 2026-11-26；中转站倍率、赠额与存活状态变动极快，使用前以各站实时页面为准。
// 本文件只收录公开可查信息，不构成任何推荐；「相对官方」为站方或比价站披露口径的折算（1x = 官方价 = 10 折）。

export const CHECKED_AT = '2026-11-26'

export const OFFICIAL_ANCHORS = [
  { name: 'Anthropic 官方 API', billing: '按量', price: 'Sonnet 5：$2/$10 · Opus 5.5：$4/$20（$/M 输入/输出）', note: '缓存读 0.1x · Batch −50%' },
  { name: 'Claude 订阅', billing: '包月', price: 'Pro $20 / Max $100 / Ultra $200', note: '含 Claude Code；Max 5x、Ultra 10x 周用量 + API credits' },
  { name: 'AWS Bedrock', billing: '按量', price: '与官方同价，regional 端点 +10%', note: '可开票，企业合规常用' },
  { name: 'Google Vertex AI', billing: '按量', price: '与官方同价，regional 端点 +10%', note: 'Claude 全系在售' },
  { name: 'Azure Foundry', billing: '按量', price: 'Claude 在售，Foundry 结算', note: '企业采购通道' },
  { name: 'OpenRouter（聚合对照）', billing: '按量', price: '官方透传价，购 credit 另收 5.5%', note: '500 万+ 用户，月处理 70T tokens' },
]

export const PLATFORM_CATEGORIES = {
  official: { label: '官方/云渠道', short: '官方', desc: '价格基准与合规兜底。' },
  gateway: { label: '合规聚合网关', short: '聚合', desc: '明示上游、官方牌价或透明折扣，可靠性最高的第三方一档。' },
  direct: { label: '官转/官方 key 直连', short: '官转', desc: '宣称官方密钥或云渠道透传，倍率 0.7x–3.8x；高于 1x 的部分买的是支付与接入便利。' },
  pool: { label: '号池/共享低价档', short: '号池', desc: '多账号轮询、共享市场、动态倍率，价格 0.1x–0.8x，限流与断供风险高。' },
  reverse: { label: '逆向/高危', short: '逆向', desc: '订阅权益或 IDE 套餐逆向，高级参数残缺，随时封堵，只适合测试流量。' },
  monthly: { label: '包月/订阅制中转', short: '包月', desc: '固定月费换每日额度，注意周限条款对性价比的影响。' },
  free: { label: '免费公益站', short: '公益', desc: '注册赠额 + 每日签到续命，只用于无关敏感数据的实验。' },
  rental: { label: '合租/镜像/代充', short: '合租', desc: '网页镜像与账号拼车，无需自配网络但有封号、隐私与功能阉割问题。' },
  tool: { label: '验真/检测工具', short: '工具', desc: '黑盒检测中转站模型真伪与计量，充值前先过一遍。' },
  dead: { label: '风险样本（已死/跑路）', short: '风险', desc: '留作反例：余额是站点的负债，跑路与删号随时可能发生。' },
}

// 折叠到独立区域的分类（默认收起）
export const COLLAPSED_CATEGORIES = ['free', 'dead']

export const RELAY_PLATFORMS = [
  // 官方/云
  { id: 'anthropic-api', name: 'Anthropic 官方 API', url: 'https://platform.claude.com', cat: 'official', channel: '官方直连', billing: '按量', price: 'Sonnet 5 $2/$10 · Opus 5.5 $4/$20 · Haiku $1/$5（$/M）；缓存读 0.1x、Batch −50%', discount: '基准', risk: '低', status: '在营' },
  { id: 'claude-subscription', name: 'Claude 订阅 Pro/Max/Ultra', url: 'https://claude.com/pricing', cat: 'official', channel: '官方订阅（含 Claude Code）', billing: '包月', price: '$20 / $100 / $200 每月；Max 5x、Ultra 10x 周用量并含 API credits', discount: '基准', risk: '低', status: '在营' },
  { id: 'aws-bedrock', name: 'AWS Bedrock', url: 'https://aws.amazon.com/bedrock', cat: 'official', channel: '云厂商授权转售', billing: '按量', price: '与官方同价，regional 端点 +10%；CCU 结算可选；可开票', discount: '基准', risk: '低', status: '在营' },
  { id: 'google-vertex', name: 'Google Vertex AI', url: 'https://cloud.google.com/vertex', cat: 'official', channel: '云厂商授权转售', billing: '按量', price: '与官方同价，regional 端点 +10%', discount: '基准', risk: '低', status: '在营' },
  { id: 'azure-foundry', name: 'Azure Foundry', url: 'https://azure.microsoft.com', cat: 'official', channel: '云厂商授权转售', billing: '按量', price: 'Claude 在售，Foundry 结算', discount: '基准', risk: '低', status: '在营' },
  // 聚合网关
  { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai', cat: 'gateway', channel: '多供应商明示路由', billing: '按量', price: '官方透传价；购 credit 另收 5.5%（Business 8%）；Batch 半价；月访问 21.3M 全网第一', discount: '1x + 手续费', risk: '低', status: '在营' },
  { id: 'aihubmix', name: 'AIHubMix', url: 'https://aihubmix.com', cat: 'gateway', channel: '聚合（官方 + Azure 双端点）', billing: '按量', price: '官方牌价 1x，充值免手续费（等价省 5.5%）；10% 长期折扣可谈', discount: '1x', risk: '低', status: '在营' },
  { id: 'zenmux', name: 'ZenMux', url: 'https://zenmux.ai', cat: 'gateway', channel: '聚合 + 智能路由', billing: '按量+订阅', price: '1x 牌价 + 5% 充值费；异常输出自动赔付；宣称仅官方/授权渠道', discount: '1x', risk: '低', status: '在营' },
  { id: 'easyrouter', name: 'EasyRouter', url: 'https://easyrouter.io', cat: 'gateway', channel: '聚合（40+ 模型）', billing: '按量', price: '全场 Token 8.5 折；99.9% SLA', discount: '0.85x', risk: '低', status: '在营' },
  { id: 'ofoxai', name: 'OfoxAI', url: 'https://ofox.ai', cat: 'gateway', channel: '聚合（100+ 模型，香港直连）', billing: '按量', price: '信用点制；99.9% SLA；三协议原生；附免费模型验真工具', discount: '未明示', risk: '中', status: '在营' },
  { id: 'bai', name: 'B.AI', url: 'https://b.ai', cat: 'gateway', channel: 'API 代理转售（链上匿名支付）', billing: '按量', price: '官方牌价 + 0–10% 加价；USDT/邮箱/卡均可；月访问 1.3M', discount: '约 1.1x', risk: '中', status: '在营' },
  { id: 'coderplan', name: 'CoderPlan', url: 'https://coderplan.ai', cat: 'gateway', channel: '聚合（23 个 Anthropic 条目）', billing: '按量', price: '¥1=$1；Sonnet 5.5 ¥2/¥10（≈官方价）；缓存读 ¥0.1；仅 Stripe 国际卡', discount: '1x', risk: '中', status: '在营' },
  { id: 'ferryapi', name: 'FerryAPI', url: 'https://ferryapi.io', cat: 'gateway', channel: '聚合（9 厂商，提供商账户池）', billing: '按量', price: '注册送 $5；邀请返利 1:1', discount: '未明示', risk: '中', status: '在营' },
  { id: 'unorouter', name: 'UnoRouter', url: '', cat: 'gateway', channel: '聚合 + 月订阅', billing: '按量+订阅', price: '$1 起充，Claude 约官方 3.8 折；$20 月订阅得 $40 额度', discount: '≈0.38x', risk: '中', status: '在营' },
  // 官转/官方 key 直连
  { id: 'closeai', name: 'CloseAI', url: 'https://closeai-asia.com', cat: 'direct', channel: '官方原生 API（官转）', billing: '按量×套餐倍率', price: '商务 1.5x、研发 1.25x（累计¥5000）、大客户 1.1x（累计¥10000）；增值税票/对公/DPA', discount: '1.1–1.5x', risk: '低', status: '在营' },
  { id: 'ohmygpt', name: 'OhMyGPT', url: 'https://ohmygpt.com', cat: 'direct', channel: '中转密钥制', billing: '按量', price: '默认 1.1x：Opus 5.5 ¥5.5/¥27.5', discount: '1.1x', risk: '中', status: '在营' },
  { id: 'neko-code', name: 'Neko Code', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '1.2x（Opus ¥4.8/¥24）', discount: '1.2x', risk: '中', status: '在营' },
  { id: 'yunwu', name: 'Yunwu 云雾', url: '', cat: 'direct', channel: '官方为主', billing: '按量', price: '官方 Claude 1.2x；另有免费子站送每日额度', discount: '1.2x', risk: '中', status: '在营' },
  { id: '4router', name: '4Router', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '官方 1.5x；Sale 分组约 1.2x', discount: '1.2–1.5x', risk: '中', status: '在营' },
  { id: '78code', name: '78 Code', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '官方 1.5x', discount: '1.5x', risk: '中', status: '在营' },
  { id: 'micu', name: 'Micu', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '1.5x（Opus ¥6/¥30）；起充 ¥1、可退款', discount: '1.5x', risk: '中', status: '在营' },
  { id: 'sssaicode', name: 'SSSAiCode', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '官方 1.5x；宣传「¥0.5/$ 等价」折扣档', discount: '1.5x', risk: '中', status: '在营' },
  { id: 'cctq', name: 'CCTQ', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '官方 1.5x；有 ClaudeCode-MAX 分组', discount: '1.5x', risk: '中', status: '在营' },
  { id: 'bytecat', name: 'ByteCat', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '官方 1.5x', discount: '1.5x', risk: '中', status: '在营' },
  { id: 'apinebula', name: 'APINebula', url: '', cat: 'direct', channel: '官方渠道', billing: '按量', price: '官方 1.7x', discount: '1.7x', risk: '中', status: '在营' },
  { id: 'cubence', name: 'Cubence', url: '', cat: 'direct', channel: '官方渠道', billing: '按量+月套餐', price: '官方 1.75x（Opus ¥7/¥35 档）；套餐有周限', discount: '1.75x', risk: '中', status: '在营' },
  { id: 'corecode', name: 'CoreCode', url: 'https://corecode.live', cat: 'direct', channel: '官方账号自建号池（满血）', billing: '按量', price: '¥1=$1，CC 分组 1.9x ≈ 官方 2.8 折：Opus 5.5 ¥7.6/¥38；缓存读 ¥0.19；注册送 $3', discount: '≈0.28x', risk: '中', status: '在营' },
  { id: 'yescode', name: 'YesCode', url: 'https://co.yes.vg', cat: 'direct', channel: '官方渠道', billing: '按量+包月', price: '按量 1.4x；包月 $19.9（满额$210）/ $44.9（满额$430）；每月免 1M tokens；平均延迟 38ms；SOC 2 Type II', discount: '1.4x', risk: '中', status: '在营' },
  { id: 'packycode', name: 'PackyCode', url: 'https://packyapi.com', cat: 'direct', channel: '官方直连 + AWS 渠道 + 逆向（Gemini）', billing: '按量', price: '官方 CC 分组 2.5x（Sonnet ¥7.5/¥37.5）；AWS-Q 分组约 5 折；注册送 $1', discount: '0.5–2.5x', risk: '中', status: '在营' },
  { id: 'ikuncode', name: 'IKunCode', url: 'https://api.ikuncode.cc', cat: 'direct', channel: '官方分组 + 逆向分组（cc-kiro，站方建议避开）', billing: '按量×分组倍率', price: '官方分组 2.3x；历史分组 0.4x–1.5x；累计充值降倍率；模型广场公开 42 款单价', discount: '0.4–2.3x', risk: '中', status: '在营' },
  { id: 'kunavo', name: 'Kunavo', url: 'https://kunavo.com', cat: 'direct', channel: '宣称官方渠道（未明示）', billing: '按量', price: '全站 Claude 7 折：Opus 5.5 $2.8/$14；缓存读 2.5–10%；充值赠 10–25%；2026 新站', discount: '0.7x', risk: '中', status: '在营' },
  { id: 'teamorouter', name: 'TeamoRouter', url: 'https://teamorouter.com', cat: 'direct', channel: '智能路由多上游（未明示）', billing: '按量', price: 'Claude 约官方 2.8–3 折：Opus 5.5 $1.144/$5.72；缓存同折；$5 起充，余额不过期', discount: '≈0.28x', risk: '中', status: '在营' },
  { id: 'dmxapi', name: 'DMXAPI', url: 'https://dmxapi.cn', cat: 'direct', channel: '多分站多线（口径不一）', billing: '按量', price: '.cn 人民币站、.com 按 ¥5/$1、ssvip 按 ¥7.3/$1；可开 6% 税票', discount: '口径不一', risk: '中', status: '在营' },
  { id: 'apikl', name: 'API 快连', url: 'https://apikl.ai', cat: 'direct', channel: '分组明码标价（渠道写在分组名）', billing: '按量', price: 'Claude-Max 组 0.8x；Claude Code（AWS 官方渠道）3.8x；缓存读 0.1x/写 1.25x；可开票', discount: '0.8–3.8x', risk: '中', status: '在营' },
  { id: 'anyaigc', name: 'AnyAIGC', url: 'https://anyaigc.ai', cat: 'direct', channel: '分组明码（AWS Bedrock/Azure/Vertex/Kiro 等）', billing: '按量', price: 'Claude-Code-1 组约 2.4 折（Sonnet 5.5 $0.476/$2.38）；Anthropic-Claude-1 为 1.49x；汇率 6.718 结算', discount: '0.24–1.49x', risk: '中', status: '在营' },
  { id: 'uniapi', name: 'UniAPI', url: 'https://uniapi.ai', cat: 'direct', channel: '分组明码（Default/稳定/Bridge）', billing: '按量', price: '1:7.3 汇率；Default 0.88x、稳定组 1.0x、Bridge 0.28x（含逆向）；用户 Tier 充值分档再打折', discount: '0.28–1.0x', risk: '中', status: '在营' },
  { id: 'lmuai', name: '灵眸AI', url: 'https://api.lmuai.ai', cat: 'direct', channel: 'AWS 渠道 / Claude Max 号池（分组可选）', billing: '按量+月套餐', price: 'Opus 5.5 AWS 渠道 ¥4.8/¥24（≈1.7 折）；月套餐 ¥99 起；可开票；第三方检测中位分 91', discount: '≈0.17x', risk: '中', status: '在营' },
  { id: 'calclink', name: '算链 CalcLink', url: '', cat: 'direct', channel: '五档明示：AWS 原生/官转号池/云厂商号池/CCMax/逆向', billing: '按量×档位倍率', price: 'AWS 原生子账号 0.81–0.91；AWS 号池 0.56–0.75；CCMax 0.41–0.70；对公/电汇/USDT，有协议与 SLA', discount: '0.41–0.91x', risk: '中', status: '在营' },
  { id: 'ddshub', name: 'DDS Hub 呆呆兽', url: 'https://www.ddshub.cc', cat: 'direct', channel: '宣称企业级静态 IP 池防封', billing: '按量', price: '官方同价 2 折；1:1 充值；额度永久；宣称不存用户数据与 Key', discount: '≈0.2x', risk: '高', status: '在营' },
  { id: 'lingyaai', name: '灵芽 API', url: 'https://api.lingyaai.cn', cat: 'direct', channel: 'Claude 专用中转', billing: '按量', price: 'Claude Code 接入模板；价格未公开', discount: '未披露', risk: '中', status: '在营' },
  { id: 'apiyi', name: 'API易', url: 'https://apiyi.com', cat: 'direct', channel: '中转密钥制', billing: '按量', price: 'Claude Code 模板接入；国内可用', discount: '未披露', risk: '中', status: '在营' },
  { id: 'laozhang', name: '老张API', url: '', cat: 'direct', channel: '预付余额×分组倍率', billing: '按量', price: '$2/$10 基准倍率制；宣称不保存请求正文；可开票', discount: '未披露', risk: '中', status: '在营' },
  // 号池/共享低价
  { id: 'privnode', name: 'Privnode', url: '', cat: 'pool', channel: '编程中转号池（未承诺全官方 key）', billing: '按量+包月', price: '折算区间：Sonnet 0.4–0.7x、Opus 0.5–0.8x、Haiku 0.3–0.6x', discount: '0.3–0.8x', risk: '高', status: '在营' },
  { id: 'tokendos', name: 'TokenDos', url: 'https://www.tokendos.com', cat: 'pool', channel: '共享市场（聚合闲置 API key）', billing: '按量', price: 'Sonnet 5 $0.022/$0.11 每 M（≈官方 1 折）；缓存读 0.1x；2026-06 上线新站', discount: '≈0.1x', risk: '高', status: '在营' },
  { id: 'catrouter', name: 'CatRouter', url: 'https://catrouter.com', cat: 'pool', channel: '未披露', billing: '按量', price: 'Claude 约官方 1.8 折；实付 $1 到账 ¥6.68、每官方 $1 用量扣 ¥1.2；最低储值 $10', discount: '≈0.18x', risk: '高', status: '在营' },
  { id: 'yomi', name: 'Yomi API', url: '', cat: 'pool', channel: '未披露', billing: '按量', price: '$0.01 起充，Claude 约官方 1.8 折', discount: '≈0.18x', risk: '高', status: '在营' },
  { id: 'wokeyai', name: 'WoKeyAI', url: '', cat: 'pool', channel: '未披露', billing: '按量', price: '$1 起充，约官方 1.8 折，价格实时浮动', discount: '≈0.18x', risk: '高', status: '在营' },
  { id: 'haoai', name: 'HaoAI', url: '', cat: 'pool', channel: '未披露', billing: '按量', price: '$1 起充，约官方 2.3 折', discount: '≈0.23x', risk: '高', status: '在营' },
  { id: 'derouter', name: 'derouter.ai', url: 'https://derouter.ai', cat: 'pool', channel: '未披露', billing: '按量', price: '综合约官方 1.5 折', discount: '≈0.15x', risk: '高', status: '在营' },
  { id: 'foxcode', name: 'FoxCode', url: '', cat: 'pool', channel: '官方 Max + Ultra 号池', billing: '按量（充值赠额夸张）', price: '充 ¥468 得 $8000；Ultra 渠道输入 ¥2.34/M、官方 Max 渠道 ¥7.02/M', discount: '≈0.1–0.3x', risk: '高', status: '在营' },
  { id: 'aicoding', name: 'AICoding', url: 'https://aicoding.sh', cat: 'pool', channel: '账号池动态调度（宣称防封号）', billing: '按量+套餐', price: '注册送 $5；第三方流量统计 2026-09 归零', discount: '未披露', risk: '高', status: '疑似停摆' },
  { id: 'linkagi', name: 'LinkAGI', url: 'https://api.linktoagi.com', cat: 'pool', channel: '人民币计价号池（多档）', billing: '按量', price: 'GPT-5.6 三档号池 Luna ¥0.15/M 输入起；多协议兼容；免费诊断与成本计算工具', discount: '低价（口径未全公开）', risk: '高', status: '在营' },
  { id: '4stoken', name: '4SToken', url: '', cat: 'pool', channel: '未披露', billing: '未披露', price: '推广内容密集出现但无公开定价页，各比价站未收录', discount: '未披露', risk: '高', status: '信息不透明' },
  // 逆向/高危
  { id: 'gptgod', name: 'GPTGod', url: 'https://gptgod.cloud', cat: 'reverse', channel: '逆向 + 共享账号池', billing: '按量', price: '汇率约 ¥0.6/$（≈官方 8.3%）；447 模型但缺最新旗舰；无 SLA、无数据协议、多次突发宕机', discount: '≈0.08x', risk: '高', status: '在营' },
  { id: 'sidrune', name: 'Sidrune AI', url: '', cat: 'reverse', channel: 'INJECT 路线（注入系统提示）', billing: '按量', price: '0.18x（仅限 Claude Code）/ 0.22x（任意客户端）', discount: '≈0.18x', risk: '高', status: '在营' },
  { id: 'timicc', name: 'TimiCC', url: '', cat: 'reverse', channel: 'Kiro-Claude 渠道逆向', billing: '按量', price: '0.5x（Sonnet ¥1.5/¥7.5）', discount: '0.5x', risk: '高', status: '在营' },
  { id: 'yiyezhiqiu-paid', name: '一叶知秋（付费逆向线）', url: '', cat: 'reverse', channel: '逆向', billing: '按量', price: '¥1=$1，逆向 0.35x', discount: '0.35x', risk: '高', status: '在营' },
  { id: 'right-code', name: 'Right Code', url: '', cat: 'reverse', channel: '官方 2.0x + 逆向分组', billing: '按量+月套餐', price: '官方 2.0x；逆向活动充 ¥20 得 $100；月度套餐额度滚存', discount: '0.2–2.0x', risk: '高', status: '在营' },
  // 包月/订阅制
  { id: '88code', name: '88Code', url: 'https://88code.org', cat: 'monthly', channel: '宣称 Claude Max20 号池', billing: '包月+按量', price: 'PLUS ¥198（日$40）/ PRO ¥398（日$120）/ MAX ¥698（日$200）；PAYGO ¥66≈$165 额度；限 4 并发', discount: '折算约 2–3 折', risk: '中', status: '在营' },
  { id: 'aigocode', name: 'AIGoCode', url: 'https://www.aigocode.com', cat: 'monthly', channel: '订阅套餐 + 灵活额度', billing: '包月（4 周）', price: 'Standard ¥399（周额度$110）/ Premium ¥899（$260）/ Professional ¥1799（$530）/ 企业 ¥9999；灵活额度 ¥50=$50 永久', discount: '折算约 3–5 折', risk: '中', status: '在营' },
  { id: 'aicodemirror', name: 'AICodeMirror', url: 'https://aicodemirror.com', cat: 'monthly', channel: '镜像级/共享平台（宣称）', billing: '包月+按量', price: 'PRO ¥259 / MAX ¥559 / ULTRA ¥1259；PAYGO 起步约 ¥0.16/M；注册送 ¥8、首充 8 折；可开发票/合同', discount: '未披露', risk: '中', status: '在营' },
  { id: 'duckcoding-paid', name: 'DuckCoding（付费线）', url: 'https://duckcoding.com', cat: 'monthly', channel: '官方直连为主（含 CC-AWS 分组）', billing: '按量+包月', price: 'CC 忙时 1.5x、闲时 1.3x；累计充值 500/2000 再降；可开增值税专票', discount: '1.3–1.5x', risk: '中', status: '在营' },
  { id: 'lmuai-monthly', name: '灵眸AI 月套餐', url: 'https://api.lmuai.ai', cat: 'monthly', channel: '分组可选', billing: '包月', price: '¥99 起，折算约 ¥3.80/¥19.00（Opus 5.5）', discount: '≈1.6 折', risk: '中', status: '在营' },
  // 免费公益站（含 Claude）
  { id: 'anyrouter', name: 'AnyRouter', url: 'https://anyrouter.top', cat: 'free', channel: '签到型', billing: '免费', price: '注册赠 $50–100，每日签到 $25（月 $800+）；Linux.do 信任 ≥2 可注册；签到最稳', discount: '免费', risk: '高', status: '在营' },
  { id: 'agentrouter', name: 'AgentRouter', url: 'https://agentrouter.org', cat: 'free', channel: '签到型（实为商业站可充值）', billing: '免费+充值', price: '注册赠 $100 + 邀请 $50，签到 $25/天；GitHub 满 5 年或 Linux.do 注册；30+ 模型源双协议', discount: '免费', risk: '高', status: '在营' },
  { id: 'duckcoding-free', name: 'DuckCoding（免费线）', url: 'https://free.duckcoding.com', cat: 'free', channel: '签到型', billing: '免费', price: '注册赠 ¥200，签到 ¥40/天（月 ¥1400+）；Claude Sonnet；人民币结算', discount: '免费', risk: '高', status: '在营' },
  { id: 'gogogo', name: 'GoGoGo', url: 'https://api.chengtx.vip', cat: 'free', channel: '签到型', billing: '免费', price: '注册赠 $100，签到 $20–50/天（月 $1600+）；需 Linux.do 账号；Gemini 为主', discount: '免费', risk: '高', status: '在营' },
  { id: 'kfc-api', name: 'KFC', url: 'https://kfc-api.sxxe.net', cat: 'free', channel: '签到型', billing: '免费', price: '注册赠 $50，签到 $2–5/天；Claude/GPT', discount: '免费', risk: '高', status: '在营' },
  { id: 'elysiver', name: 'elysiver', url: 'https://elysiver.h-e.top', cat: 'free', channel: '签到型', billing: '免费', price: '注册赠 $1，签到 $2–5/天；Claude', discount: '免费', risk: '高', status: '在营' },
  { id: 'huan666', name: 'Huan666 (Huan API)', url: 'https://ai.huan666.de', cat: 'free', channel: '签到型', billing: '免费', price: '注册赠 $10，签到 $1–2/天；Grok/Kimi/Claude 等 17 模型；Linux.do ≥2', discount: '免费', risk: '高', status: '在营' },
  { id: 'docode', name: 'DoCode', url: 'https://docode.cc', cat: 'free', channel: '注册赠 + 每日抽奖', billing: '免费', price: '注册 50 站内刀 + 邀请码 +250；sonnet-5、opus4.6、GPT pro 等；站内刀≠美元', discount: '免费', risk: '高', status: '在营' },
  { id: 'wjapi', name: '万家灯火', url: 'https://wjapi.vip', cat: 'free', channel: '注册赠 + QQ 群签到', billing: '免费', price: '注册赠 50 站内刀 + GPT 订阅 1 月；签到随机 ¥0.1–1；多模型', discount: '免费', risk: '高', status: '在营' },
  { id: 'primerelay', name: 'Prime Relay', url: 'https://primerelay.online', cat: 'free', channel: '签到型（需进 QQ 群）', billing: '免费', price: '注册赠 $20，每日签到；Claude/GPT/DeepSeek/Grok/Gemini', discount: '免费', risk: '高', status: '在营' },
  { id: 'kktoken', name: 'KKtoken AI', url: 'https://kktoken.cc', cat: 'free', channel: '签到型（仅 GitHub 注册）', billing: '免费', price: '注册赠 $75 + 邀请 $25 + 首签 $20，签到 $20/天', discount: '免费', risk: '高', status: '在营' },
  { id: 'justdowork', name: 'JustDoWork', url: 'https://api.justwoker.icu', cat: 'free', channel: '签到型（GitHub 满 365 天）', billing: '免费', price: '注册约 $70，签到约 $22/天', discount: '免费', risk: '高', status: '在营' },
  { id: 'matrix-relay', name: 'Matrix', url: 'https://matrix.mzsjai.com', cat: 'free', channel: '邀请赠积分', billing: '免费', price: '邀请码注册得 600 积分 + 实名 2000 积分；Anthropic/Google/DeepSeek 等多源', discount: '免费', risk: '高', status: '在营' },
  { id: 'nofx', name: 'NOFX', url: 'https://nofx.one', cat: 'free', channel: '签到积分制', billing: '免费', price: '邮箱 magic link / GitHub；邀请 10 积分 + 首签 5，5 积分/天', discount: '免费', risk: '高', status: '在营' },
  { id: 'vsllm', name: '维云模型开放平台', url: 'https://vsllm.cc', cat: 'free', channel: '每日任务制', billing: '免费', price: '每日任务得额度；Claude/GPT/GLM/DeepSeek 等 69 模型', discount: '免费', risk: '高', status: '在营' },
  { id: 'cmapi', name: 'CM-API 公益站', url: 'https://api.chengmo.cc.cd', cat: 'free', channel: '签到型', billing: '免费', price: '每日签到；Claude/GPT/GLM/DeepSeek 等 35–46 模型；Linux.do OAuth 需 ≥1', discount: '免费', risk: '高', status: '在营' },
  { id: 'zerocat', name: 'ZeroCat', url: 'https://zero.cat', cat: 'free', channel: '签到型', billing: '免费', price: '每日签到；Claude/GPT/GLM/DeepSeek/xAI/Gemini 40 模型', discount: '免费', risk: '高', status: '在营' },
  { id: 'kemeng', name: '可萌中转站', url: 'https://api456.me', cat: 'free', channel: '签到型', billing: '免费', price: '每日签到；Claude/GPT/GLM/Gemini/qwen 29–42 模型', discount: '免费', risk: '高', status: '在营' },
  { id: 'factory-pub', name: 'Factory.pub', url: 'https://factory.pub', cat: 'free', channel: '签到型', billing: '免费', price: '每日签到；Claude/GPT/GLM/DeepSeek 26 模型', discount: '免费', risk: '高', status: '在营' },
  { id: 'kuaipao', name: '快跑API', url: 'https://kuaipao.ai', cat: 'free', channel: '签到 + 注册赠', billing: '免费', price: '注册赠 $10（回帖/客服再领 $10）；每日签到；100–130+ 模型', discount: '免费', risk: '高', status: '在营' },
  { id: 'pmapi', name: 'PM-API', url: 'https://pmcat.top', cat: 'free', channel: '免签到（Linux.do ≥1）', billing: '免费', price: '完全免费；Claude/GPT/GLM/DeepSeek 75 模型', discount: '免费', risk: '高', status: '在营' },
  { id: 'star-api', name: 'Star API', url: '', cat: 'free', channel: '加群领取（QQ 群）', billing: '免费', price: '加群找群主领 $5；Claude 0.28x、GPT 0.16x', discount: '免费+低价', risk: '高', status: '在营' },
  { id: 'qianxing', name: '乾行AI', url: '', cat: 'free', channel: '签到 + 加群', billing: '免费', price: '注册 $2 + 群内 $5，每日签到；Claude/ChatGPT/Gemini（约 0.1x）', discount: '免费', risk: '高', status: '在营' },
  { id: 'hubway', name: 'HUBWAY', url: '', cat: 'free', channel: '注册赠 + 进群', billing: '免费+充值', price: '注册 $5 + 群内 $10；Claude/GPT 限时 0.4x；充值 1:10', discount: '免费', risk: '高', status: '在营' },
  { id: 'tokenshub', name: 'TokensHub', url: '', cat: 'free', channel: '注册赠（加群找管理员）', billing: '免费', price: '$20 Pro 3 日体验卡；Claude/ChatGPT Max/Pro/Plus', discount: '免费', risk: '高', status: '在营' },
  { id: 'happy-code', name: 'Happy Code', url: 'https://happycodeai.com', cat: 'free', channel: '注册赠（OIDC + QQ 群领包）', billing: '免费', price: '注册赠 $100', discount: '免费', risk: '高', status: '在营' },
  { id: 'cunai', name: 'CUN.ai', url: 'https://cun.ai', cat: 'free', channel: '注册赠 + 签到 + CDK（商业站）', billing: '免费+充值', price: '注册赠 $8.8（需邮箱激活）+ 兑换码 ~$7–10；Claude/ChatGPT/Gemini 6 折套餐', discount: '免费+折扣', risk: '高', status: '在营' },
  { id: 'gateai', name: 'GateAI', url: '', cat: 'free', channel: '注册 + 回帖 + 进群', billing: '免费', price: '注册 $2 + 回帖 $2 + 进群 $2，共 $6', discount: '免费', risk: '高', status: '在营' },
  { id: 'tutuintel', name: '兔兔智能', url: '', cat: 'free', channel: 'Linux.do OAuth 注册赠', billing: '免费', price: '实测控制台 $10；有流中断/DNS 问题反馈，先跑最小请求', discount: '免费', risk: '高', status: '在营' },
  { id: 'pqh', name: 'PQH', url: '', cat: 'free', channel: '注册 + 评论 + 进群', billing: '免费', price: '评论 ID 赠 $2 + 进群 $3', discount: '免费', risk: '高', status: '在营' },
  { id: 'torchai', name: 'TorchAI', url: '', cat: 'free', channel: '回帖赠 + 充值加赠', billing: '免费+充值', price: '回帖按楼层赠 $3–6；教师/医护/学生专项额度更高', discount: '免费', risk: '高', status: '在营' },
  { id: 'yiyezhiqiu-free', name: '一叶知秋API（公益线）', url: '', cat: 'free', channel: '注册 + 回帖赠', billing: '免费', price: '历史活动注册回帖赠 $10', discount: '免费', risk: '高', status: '在营' },
  { id: 'fengwind', name: 'Fengwind API', url: '', cat: 'free', channel: '签到 + 兑换码（Linux.do 登录）', billing: '免费', price: '关注签到/兑换码活动；上游变化快，额度勿囤', discount: '免费', risk: '高', status: '在营' },
  { id: 'gsccrelay', name: 'GSCC Relay', url: 'https://gsccrelay.space', cat: 'free', channel: '社区发 Key（免注册）', billing: '免费', price: '社区公告取 Key；Claude', discount: '免费', risk: '高', status: '在营' },
  { id: 'hybgzs', name: '黑与白NEXT', url: 'https://cdk.hybgzs.com', cat: 'free', channel: 'CDK 兑换（Linux.do CDK）', billing: '免费', price: 'CDK 额度兑换；Claude', discount: '免费', risk: '高', status: '在营' },
  { id: 'wzw', name: 'WZW', url: 'https://wzw.de5.net', cat: 'free', channel: 'Linux.do 一键登录', billing: '免费', price: 'Claude', discount: '免费', risk: '高', status: '在营' },
  { id: 'bohe', name: '薄荷', url: 'https://x666.me', cat: 'free', channel: '免费', billing: '免费', price: 'Claude', discount: '免费', risk: '高', status: '在营' },
  { id: 'runanytime', name: '随时跑路', url: 'https://runanytime.hxi.me', cat: 'free', channel: '免费', billing: '免费', price: 'Claude Opus；站名即风险提示', discount: '免费', risk: '高', status: '在营' },
  { id: 'b4u', name: 'B4U', url: 'https://b4u.qzz.io', cat: 'free', channel: '免费', billing: '免费', price: 'Claude Sonnet', discount: '免费', risk: '高', status: '在营' },
  { id: 'coco-api', name: 'COCO API', url: '', cat: 'free', channel: '签到型', billing: '免费', price: '注册送 ¥0.5；Claude 全系/GPT/Gemini 等 432 模型', discount: '免费', risk: '高', status: '在营' },
  { id: '773', name: '773 公益站', url: '', cat: 'free', channel: '限量 CDK（Linux.do 1 级 + 20 积分 + 50 LDC）', billing: '免费（有门槛）', price: '注册页显示 $2000 但号池/库存不稳定，勿为其充值', discount: '免费（名不符实）', risk: '高', status: '风险' },
  { id: 'lucky-relay', name: 'lucky 公益站', url: 'https://luckyg.131518.xyz', cat: 'free', channel: '签到 + 注册码（需购买）', billing: '免费（有门槛）', price: '注册 $10；签到临时额度当天有效；DeepSeek/Grok/GPT 系为主', discount: '免费', risk: '高', status: '在营' },
  // 合租/镜像/代充
  { id: 'nfvideo', name: '银河录像局', url: 'https://nf.video', cat: 'rental', channel: '镜像 + 拼车（ICP 备案 + 经营许可）', billing: '包月/天卡', price: 'Claude Pro 镜像天卡 ¥14（每 6h 15 次）、月卡 ¥130；Claude Code 拼车 Pro ¥299 / Max ¥599 / Ultra ¥999 每月', discount: 'Pro 官价约 ¥145 → 镜像 ¥130', risk: '中', status: '在营' },
  { id: 'xingji', name: '星际放映厅', url: '', cat: 'rental', channel: '独立账号/代充（浙江 ICP 备案）', billing: '包月', price: 'Claude Pro 独立账号 ¥230/月、¥675/3 个月；现号秒发；可开发票', discount: '未披露', risk: '中', status: '在营' },
  { id: 'universalbus', name: '环球巴士', url: 'https://universalbus.cn', cat: 'rental', channel: '代充 + 合租（2019 年老牌）', billing: '包月', price: 'Claude 代充约 ¥198–239/月；「翻车必赔」担保；支付宝', discount: '未披露', risk: '中', status: '在营' },
  { id: 'accountboy', name: '账号星球 AccountBoy', url: '', cat: 'rental', channel: '官方代充（只要 Organization ID）', billing: '包月', price: 'Claude Pro ¥188–249/月；Max 5x ¥899/月、Max 20x ¥1880/月；可开正规发票；无法避免官方风控', discount: 'Pro ¥188 vs 官价约 ¥145', risk: '中', status: '在营' },
  { id: 'wildcard', name: 'WildCard 野卡', url: '', cat: 'rental', channel: '虚拟卡/订阅代购（前行业头部）', billing: '—', price: '已停运——虚拟卡与代购赛道结构性风险的标志性案例', discount: '—', risk: '—', status: '已停运' },
  // 检测工具
  { id: 'cctest', name: 'CCTest', url: 'https://cctest.ai', cat: 'tool', channel: '黑盒检测平台', billing: '按次', price: '约 $0.3/次；11 轮专业测试；检测倍率异常与消费合理性；不存 Key', discount: '—', risk: '低', status: '在营' },
  { id: 'ofox-verify', name: 'Ofox 模型验真', url: 'https://ofox.ai/verify', cat: 'tool', channel: '在线验真（OfoxAI 团队）', billing: '免费', price: '15 秒验证中转站模型真伪；45.83% 端点模型替换数据出自该团队研究', discount: '—', risk: '低', status: '在营' },
  { id: 'llmtest', name: 'LLM 大模型照妖镜', url: 'https://llmtest.cn', cat: 'tool', channel: '纯前端免费检测', billing: '免费', price: '多维交叉验证；80%+ 高可信、50–79% 存疑、<50% 高风险；零日志', discount: '—', risk: '低', status: '在营' },
  { id: 'iffs', name: 'Claude 照妖镜', url: 'https://iffs.cn', cat: 'tool', channel: 'Claude 专项检测', billing: '免费', price: '7 维度测试；评分 ≥70 满血、≥90 官方 API 级', discount: '—', risk: '低', status: '在营' },
  // 风险样本
  { id: 'closed-batch', name: 'CHY / ZhouMo / Ciallo / zifeiyu / TOM&JERRY / 南梁', url: '', cat: 'dead', channel: '公益站（批量关停）', billing: '—', price: '2026-08 前后已明确关闭注册', discount: '—', risk: '—', status: '已关停' },
  { id: 'yiapi', name: 'YiAPI', url: '', cat: 'dead', channel: '中转站', billing: '充值制', price: '用户曝光充值后删号/失联，站方未澄清', discount: '—', risk: '—', status: '高风险' },
  { id: 'krill', name: 'Krill 中转站', url: '', cat: 'dead', channel: '中转站', billing: '充值制', price: '2026-08 虚开发票跑路事件', discount: '—', risk: '—', status: '已跑路' },
  { id: 'ark-xiaojimao', name: 'Ark API / 小鸡毛', url: '', cat: 'dead', channel: '付费邀请码/LDC 门槛', billing: '—', price: '需先购买邀请码或支付 LDC 才能开始', discount: '—', risk: '—', status: '门槛风险' },
  { id: 'unity2', name: 'Unity2.Ai', url: '', cat: 'dead', channel: '聚合网关', billing: '按量', price: '曾入聚合清单，2026-09 版已因停服移除', discount: '—', risk: '—', status: '已停服' },
]

export const RISK_META = {
  low: { label: '低', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  mid: { label: '中', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  high: { label: '高', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  none: { label: '—', cls: 'border-slate-400/30 bg-slate-500/10 text-slate-600 dark:text-slate-300' },
}

export function riskLevel(risk) {
  if (!risk || risk === '—') return 'none'
  if (risk.startsWith('低')) return 'low'
  if (risk.startsWith('高')) return 'high'
  return 'mid'
}

// 官方价格锚点（$/M），供换算器预置
export const PRICING_PRESETS = [
  { id: 'opus', label: 'Opus 5.5', input: 4, output: 20 },
  { id: 'sonnet', label: 'Sonnet 5', input: 2, output: 10 },
  { id: 'haiku', label: 'Haiku 4.5', input: 1, output: 5 },
]

export const MARKET_RATE = 7.2

export const SCENARIO_PLAYBOOK = [
  ['企业生产 / 对客核心接口', 'Anthropic 官方或 AWS Bedrock：正式合同、SLA、发票。中转站省下的单价，通常会以故障成本还回去。'],
  ['重度个人 Claude Code', '官转直连站（1.2x–2x，如 Neko、CloseAI、CoreCode、YesCode）+ 缓存 + effortLevel=medium + /compact 管理，等效成本可到官方直连的 10–20%。选站先看缓存命中稳定性，再看倍率。'],
  ['多模型横评 / 出海团队', 'OpenRouter（模型最全、计费透明，注意 5.5% 手续费）或 AIHubMix（1x 牌价但充值免手续费）。'],
  ['MVP / 非核心功能', '低价号池档（0.4x–0.8x，如 Privnode、IKunCode 历史分组），业务侧自带重试与降级。'],
  ['零成本尝鲜', '签到型公益站：AnyRouter（注册赠 $50–100、签到 $25/天）、DuckCoding 免费线（注册 ¥200、签到 ¥40/天）。月白嫖 $800+ 可行，只用于无关敏感数据的实验。'],
  ['不想碰 API', '合租/镜像：银河录像局 Claude Pro 镜像 ¥14 天卡 / ¥130 月卡；Claude Code 拼车 ¥299–999/月。镜像站跑不了 Claude Code CLI，拼车本质是共享账号，有封号与隐私风险。'],
]

export const TOP_CHECKS = [
  ['换算后的 ¥/百万 token', '唯一的比价口径。美元标价、充值汇率、赠送比例单独看都会误导，先乘出统一单位再比较。'],
  ['内部倍率是否 1x', '小额充值后跑一组固定的回归 prompt，对比 usage 计数与额度消耗速度；消耗异常快就是隐藏倍率。'],
  ['是否支持 Prompt Caching', '官方 API 接口才有缓存，逆向接口普遍没有。缓存读价 0.05–0.1x 占了重度使用的大头。'],
  ['服务器位置', '境内还是境外直接影响 Claude Code 首 token 延迟；香港/日本 CN2 线路体感更稳。'],
  ['能否小额充值', '不确定的站先充最小额验证；任何站都不值得一次充几百。'],
]

export const VERIFY_MOVES = [
  ['看价格直觉', '低于官方 5 折还号称同款顶配模型，默认有问题。正规渠道要覆盖真实的模型调用成本。'],
  ['试高级参数', 'seed、logprobs、n、严格 JSON、长上下文召回：官方密钥全支持；逆向链路几乎必然缺斤短两。'],
  ['故意报错看错误结构', '正规渠道返回规整 JSON（type/code/request_id）；逆向或野生渠道会混进网页版文案甚至 HTML。'],
  ['回源探测', '在请求里放一张自控图片链接，看来拉取的身份（UA/IP）：官方、云厂商还是无身份标识的逆向程序，一眼可辨。'],
]

export const SAFETY_RULES = [
  '按月小额充值，把余额当成随时可能归零的钱。',
  '生产与涉密流量不走任何第三方中转：请求数据明文经过对方服务器。',
  '免费站不登录常用账号、不填常用邮箱密码，不把未验证站点写进日常配置。',
  '合租/代充不交账号密码（正规代充只要 Organization ID）；成品号可能是已被风控标记的账号。',
  '同时接入两家以上渠道，按用量与稳定性动态调配；「长期固定低价」的承诺值得打问号。',
]

export const SOURCES = [
  { label: 'awesome-claude-api 聚合清单（GitHub）', url: 'https://github.com/peter123023/awesome-claude-api', note: '20+ 渠道档案与 2026-08/09 月访问量快照' },
  { label: 'claudeers · Free-API 签到站清单', url: 'https://claudeers.com/free-api', note: '签到型与注册赠额型免费站，核验 2026-11-07' },
  { label: '80aj · Claude Code 公益站横评', url: 'https://www.80aj.com/2025/12/24/claude-code-free-sites-review', note: '20+ 免费站赠额与签到额度' },
  { label: 'helpaio 独立比价', url: 'https://helpaio.com', note: '官方渠道 1.2x–2.5x 梯队，2026-11-18 更新' },
  { label: 'Anthropic 官方定价', url: 'https://platform.claude.com/docs/en/about-claude/pricing', note: 'API 每百万 token 价格与缓存计价' },
  { label: 'OpenRouter 定价', url: 'https://openrouter.ai', note: '官方透传价与 5.5% 充值手续费' },
  { label: 'CCTest 检测平台', url: 'https://cctest.ai', note: '11 轮黑盒检测，单次约 $0.3' },
  { label: 'Ofox 模型验真', url: 'https://ofox.ai/verify', note: '15 秒验真；45.83% 端点模型替换的抽检数据' },
  { label: 'LLM 大模型照妖镜', url: 'https://llmtest.cn', note: '免费纯前端多维交叉验证' },
  { label: 'Claudeers · Claude 合租攻略', url: 'https://claudeers.com/claude-pro-hezu', note: '镜像与拼车平台价格快照' },
]
