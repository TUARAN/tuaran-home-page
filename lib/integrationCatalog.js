/**
 * 集成与 API Keys 目录：登记本站用到的全部外部服务与定时端点。
 * 纯数据模块（Edge 运行时可用），后台「集成与 API Keys」按此目录展示。
 *
 * 每个服务列出其依赖的环境变量名；envStatus 由端点运行时探测，
 * 只返回「已配置 / 未配置」，绝不返回明文。
 */

export const INTEGRATION_SERVICES = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    provider: 'DeepSeek（api.deepseek.com）',
    purpose: 'LLM 调用：内容起草、自动化分诊、联网检索（Responses API）。',
    envRefs: ['DEEPSEEK_API_KEY', 'DEEPSEEK_BASE_URL', 'DEEPSEEK_MODEL'],
    managedIn: '/admin/deepseek-tasks',
    note: '密钥可加密登记在「模型管理」页，本页只登记台账与兜底环境变量。',
  },
  {
    id: 'github',
    label: 'GitHub',
    provider: 'GitHub REST API',
    purpose: 'A 股与加密调研草稿发布、本站开发同步、Autopilot 巡检写回。',
    envRefs: ['GITHUB_TOKEN', 'GITHUB_SYNC_TOKEN', 'A_SHARE_PUBLISH_TOKEN', 'CRYPTO_PUBLISH_TOKEN'],
    managedIn: '/admin/site-dev',
    note: '建议使用 fine-grained PAT，按仓库授 Contents 读写。',
  },
  {
    id: 'x',
    label: 'X（Twitter）',
    provider: 'X API v2 · OAuth 1.0a',
    purpose: '每日早安、午安、晚安问候与内容分发发帖。',
    envRefs: ['X_API_KEY', 'X_API_KEY_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET'],
    managedIn: '/admin/ops',
    note: '四件套需成组配置，缺一不可发帖。',
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare',
    provider: 'Cloudflare Pages / D1 / R2',
    purpose: '站点托管、数据库、对象存储与 Pages Secrets。',
    envRefs: [
      'A_SHARE_COLLECT_SECRET',
      'CRYPTO_RESEARCH_SECRET',
      'MORNING_GREETING_SECRET',
      'PUBLIC_OPINION_COLLECT_SECRET',
      'WEEKLY_SUMMARY_SECRET',
      'AUTOMATION_ALERT_SECRET',
      'PV_CLEANUP_SECRET',
      'DEEPSEEK_KEYS_ENC_SECRET',
      'INTEGRATION_KEYS_ENC_SECRET',
    ],
    note: '定时端点鉴权 Secret 统一走 *_SECRET 回退链，未配置专用值时兼容复用。',
  },
  {
    id: 'coingecko',
    label: 'CoinGecko',
    provider: 'CoinGecko API',
    purpose: '加密调研币种池、市值排名、价格、成交额与供给快照。',
    envRefs: ['COINGECKO_DEMO_API_KEY', 'COINGECKO_PRO_API_KEY'],
    managedIn: '/admin/crypto-research',
    note: '默认尝试公共 Demo 端点；配置 Demo Key 可提高稳定性，Pro Key 会自动切换 Pro 端点。',
  },
  {
    id: 'buttondown',
    label: 'Buttondown',
    provider: 'Buttondown API',
    purpose: 'Newsletter 订阅与推送。',
    envRefs: ['NEWSLETTER_BUTTONDOWN_API_KEY', 'BUTTONDOWN_API_KEY', 'BUTTONDOWN_API_URL'],
    note: '',
  },
  {
    id: 'resend',
    label: 'Resend',
    provider: 'Resend Email API',
    purpose: '站内邮件：验证码、通知。',
    envRefs: ['RESEND_API_KEY'],
    note: '',
  },
  {
    id: 'replicate',
    label: 'Replicate',
    provider: 'Replicate（SadTalker 视频生成）',
    purpose: '数字人口播视频生成。',
    envRefs: ['REPLICATE_API_TOKEN', 'DIGITAL_HUMAN_SIGNING_SECRET'],
    managedIn: '/admin/voice-tasks',
    note: '',
  },
  {
    id: 'sadtalker',
    label: 'SadTalker 自托管',
    provider: '自托管 SadTalker 服务',
    purpose: '数字人口播视频生成（自托管 provider）。',
    envRefs: ['SADTALKER_API_BASE_URL', 'SADTALKER_API_TOKEN'],
    note: '',
  },
  {
    id: 'wechat',
    label: '微信',
    provider: '微信开放平台',
    purpose: '微信登录（OAuth）。',
    envRefs: ['WECHAT_APP_SECRET'],
    note: '',
  },
  {
    id: 'oauth-github',
    label: 'GitHub OAuth',
    provider: 'GitHub OAuth App',
    purpose: '站长登录鉴权。',
    envRefs: ['GITHUB_SECRET', 'NEXTAUTH_SECRET'],
    note: '',
  },
  {
    id: 'oauth-google',
    label: 'Google OAuth',
    provider: 'Google OAuth',
    purpose: '账号登录鉴权。',
    envRefs: ['GOOGLE_SECRET'],
    note: '',
  },
  {
    id: 'email-code',
    label: '邮件验证码',
    provider: '站内签名',
    purpose: '邮件验证码签名与登录会话。',
    envRefs: ['EMAIL_CODE_SECRET', 'RESEND_API_KEY'],
    note: '',
  },
  {
    id: 'voice-task',
    label: '数字人任务 API',
    provider: '站内自建',
    purpose: '数字人任务管理接口鉴权。',
    envRefs: ['VOICE_TASK_API_TOKEN'],
    note: '',
  },
  {
    id: 'local-llm-sync',
    label: 'Mac 模型调用同步',
    provider: '本站 D1 台账',
    purpose: '将 Mac → NAS Qwen 的调用摘要、Token、耗时和状态同步到模型管理。',
    envRefs: ['LOCAL_LLM_SYNC_SECRET'],
    managedIn: '/admin/deepseek-tasks',
    note: '本机与 Cloudflare Pages 使用同一随机 Secret；Access Secret 和本地 SQLite 原始记录不上传，线上仅保存长度受限的输入与结果摘要。',
  },
  {
    id: 'research-encrypt',
    label: '调研加密',
    provider: '站内加密',
    purpose: '加密调研内容解密口令。',
    envRefs: ['RESEARCH_ENCRYPTION_PASSWORD'],
    note: '',
  },
  {
    id: 'public-quotes',
    label: '腾讯行情 / 巨潮资讯',
    provider: '公开数据接口',
    purpose: 'A 股公司池同步与行情核验（无密钥）。',
    envRefs: [],
    note: '公开接口，无需凭据。',
  },
]

/** 定时 / Webhook 端点：GitHub Actions 外部调度触发的站内端点与鉴权链。 */
export const INTEGRATION_WEBHOOKS = [
  {
    id: 'local-llm-sync',
    path: 'POST /api/admin/deepseek-tasks/local-sync',
    purpose: 'Mac 本地 NAS Qwen 调用完成后，将脱敏台账同步到 D1。',
    secretEnv: 'LOCAL_LLM_SYNC_SECRET',
    workflow: 'Mac 本地 ollama-nas.sh',
  },
  {
    id: 'a-share-research',
    path: 'POST /api/cron/a-share-research',
    purpose: 'A 股公司观察每日选题、DeepSeek 起草，以及待复核满 3 天后的自动发布。',
    secretEnv: 'A_SHARE_COLLECT_SECRET（回退 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET）',
    workflow: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/a-share-research.yml',
  },
  {
    id: 'crypto-research',
    path: 'POST /api/cron/crypto-research',
    purpose: '按市值每日选择一个加密资产、DeepSeek 联网起草，并在复核窗口后自动发布。',
    secretEnv: 'CRYPTO_RESEARCH_SECRET（回退 A_SHARE_COLLECT_SECRET / PUBLIC_OPINION_COLLECT_SECRET）',
    workflow: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/crypto-research.yml',
  },
  {
    id: 'engagement-bot',
    path: 'POST /api/cron/engagement-bot',
    purpose: '每天 10:23（北京时间）执行一次路过读者随机点赞与 DeepSeek 短评。',
    secretEnv: 'ENGAGEMENT_BOT_SECRET（回退 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET）',
    workflow: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/engagement-bot.yml',
  },
  {
    id: 'morning-greeting',
    path: 'POST /api/distribution/x/greeting',
    purpose: 'X 每日三条问候、三条朋友图文、三条文化短故事与三条美区英文帖发布。',
    secretEnv: 'MORNING_GREETING_SECRET',
    workflow: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/morning-greeting.yml',
  },
  {
    id: 'public-opinion',
    path: 'POST /api/public-opinion/collect',
    purpose: '舆情采集（每小时）。',
    secretEnv: 'PUBLIC_OPINION_COLLECT_SECRET',
    workflow: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/public-opinion-collect.yml',
  },
  {
    id: 'weekly-summary',
    path: 'POST /api/notifications/weekly-summary',
    purpose: '每周站点数据总结写入消息中心。',
    secretEnv: 'WEEKLY_SUMMARY_SECRET',
    workflow: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/weekly-summary-notification.yml',
  },
  {
    id: 'pv-cleanup',
    path: 'POST /api/maintenance/research-pv-hits',
    purpose: '阅读历史过期清理。',
    secretEnv: 'PV_CLEANUP_SECRET（回退链同前）',
    workflow: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/research-pv-cleanup.yml',
  },
  {
    id: 'automation-alert',
    path: 'POST /api/automation/alert',
    purpose: '自动化失败告警写入站长消息中心。',
    secretEnv: 'AUTOMATION_ALERT_SECRET（回退链同前）',
    workflow: 'GitHub Actions 失败步骤直接调用',
  },
]

/** 探测环境变量是否已配置（只返回布尔，不返回明文；env 显式传入优先）。 */
export function probeEnvStatus(env) {
  const names = new Set()
  for (const service of INTEGRATION_SERVICES) {
    for (const ref of service.envRefs || []) names.add(ref)
  }
  for (const webhook of INTEGRATION_WEBHOOKS) {
    const refs = String(webhook.secretEnv || '')
      .split(/[（，,]/)
      .map((part) => part.trim())
      .filter((part) => /^[A-Z][A-Z0-9_]*$/.test(part))
    for (const ref of refs) names.add(ref)
  }
  const fallbackEnv = typeof process !== 'undefined' ? process.env : {}
  const status = {}
  for (const name of names) {
    status[name] = Boolean(String(env?.[name] || fallbackEnv[name] || '').trim())
  }
  return status
}
