export const SECURITY_SELF_CHECK_UPDATED_AT = '2026-08-27'

export const SECURITY_SELF_CHECK_SUMMARY = {
  title: '涉密自检',
  scope: '当前跟踪文件、Git 历史、公开静态资产、后台与自动化配置',
  credentialFinding: '未发现已确认的生产 API Key、密码、Cookie 或 .env 明文',
  conclusion: '策略元数据按站长意愿公开；第三方个人信息、历史产物与旧记忆密文已经完成清理，仓库具备公开条件。',
}

export const ACCEPTED_PUBLIC_METADATA = [
  {
    group: '个人定位与内容策略',
    level: '已接受公开',
    items: [
      'user-positioning：非精英路径中年技术人的自我定位与叙事提醒',
      'content-strategy-first-person-pivot：从 AI 协助调研转向第一人称叙事',
      'automation-strategy：自动化优先云端，LLM 步骤采用统一模型',
      'feedback-research-tone：调研避免把推测写成事实',
      'feedback-ai-cliche-phrases：写作禁语与 AI 腔治理规则',
      'feedback-examples-are-not-axes：不把随口举例机械排成对立坐标',
    ],
    decision: '这些内容属于站长可主动公开的方法、偏好和内容策略，不因“内部”二字自动构成秘密。',
  },
  {
    group: '工程与架构主题',
    level: '已接受公开',
    items: [
      'architecture、content-layer-refactor-plan、content-information-architecture',
      'digital-human-deploy、a-share-company-research-automation',
      'performance-optimization-report、site-review-2026-05-17',
      'site-tools-shortener、web-llm-1to1-port、web-llm-integration-notes、web-llm-port-handoff',
      'deepseek-key-management：清单仅暴露主题、版本时间、密文路径、哈希与大小，未发现 Key 明文',
      'wrangler-proxy-workaround：本机代理会影响 Wrangler 连接，需要清空代理变量',
    ],
    decision: '架构名称、服务名称、客户端 ID、数据库 ID 和存储桶名称通常不是凭据；公开后会增加系统画像信息，但可以作为有意识的开放工程取舍。',
  },
  {
    group: '功能与运营记录',
    level: '已接受公开',
    items: [
      '中英双语、页面宽度、墨水屏配色和调研模板约定',
      '壁纸、评论与燃币、RSS、内容索引等功能及迁移状态',
      'X 互助圈二维码更换周期、Agent World Cup 数据源与上线步骤',
      'OpenClaw 核验规则及研究文章多版本标签约定',
    ],
    decision: '这些记录主要描述产品实现和维护流程；站长确认可以公开后，不再作为阻止仓库公开的理由。',
  },
]

export const PUBLICATION_BLOCKERS = [
  {
    level: '已处理',
    title: '第三方个人信息',
    evidence: '调研文章曾出现看起来属于真实用户的完整 139 邮箱手机号。',
    rationale: '这不是站长自己的公开策略，公开授权也不由站长单方面决定；应匿名化后再公开。',
    action: '当前树已替换为掩码；公开前同时从 Git 历史替换原号码。',
  },
  {
    level: '已处理',
    title: '加密记忆可被离线猜测口令',
    evidence: '旧快照曾使用 9 字符口令；旧密文已从所有分支历史移除，并使用 256 位随机密钥重新生成单版本快照。',
    rationale: '算法和参数公开本身符合现代密码学原则，但任何人取得密文后都能无限离线尝试口令；风险取决于口令强度，而不是主题是否敏感。',
    action: '已轮换为 44 字符高熵密钥；生成脚本现在拒绝使用少于 24 字符的口令。旧密钥仅保留在本机备份中。',
  },
  {
    level: '已复核',
    title: 'Git 历史与 Actions 历史一起公开',
    evidence: 'Gitleaks 初扫 2681 个提交得到 81 个候选；净化全部远端分支后复扫 2022 个提交，仅剩 4 个已核实的测试占位值或浏览器存储键。',
    rationale: '切换 Public 会一次性公开所有可达提交以及 Actions 日志；当前未发现明文凭据不等于能够证明历史中从未出现过凭据。',
    action: '已从所有分支删除 .vercel/output、旧记忆快照和旧密码校验路由，并完成全部 refs 的 Gitleaks 复扫。',
  },
]

export const OPTIONAL_PRIVACY_ITEMS = [
  {
    title: '本机绝对路径与项目清单',
    decision: '属于个人隐私和工作画像，不是访问凭据。若站长接受公开，可保留。',
  },
  {
    title: '局域网 IP 与 Ollama 端口',
    decision: '192.168.x.x 不能从公网直接路由，主要暴露家庭网络拓扑。建议泛化，但不是单独阻止公开的硬条件。',
  },
  {
    title: '邮箱、二维码和 Cloudflare 标识符',
    decision: '邮箱和二维码本已用于公开站点；OAuth Client ID、D1 UUID、桶名不是 Secret。保留前只需确认骚扰和系统画像风险。',
  },
]

export const PUBLICATION_DECISION = [
  '站长已明确接受个人策略、工程架构和运营方法公开，它们不再构成保持 Private 的理由。',
  '第三方个人信息已脱敏；旧弱口令密文、历史构建产物与密码校验材料已从全部分支历史移除。',
  '专业扫描剩余候选均已核实为测试占位值或普通存储键，当前判断为可以将主仓库公开。',
]
