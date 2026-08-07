/**
 * 工程规范：把反复出现的后台与自动化约定抽象成可执行规则。
 * 展示在 /changelog 页，作为后续每次改后台、加自动化、加通知的对照基准。
 */

export const ENGINEERING_CONVENTIONS = [
  {
    title: '后台列表统一分页',
    body: '所有可能增长的后台列表必须分页：UI 复用 AdminPagination 组件，API 统一走 ?offset=&limit=，响应返回 { items, total, offset, limit }。当前页大小：内容列表 20、SEO 注册表 30、短链 / DeepSeek 任务 / 内容索引 50。禁止一次性全量渲染；搜索与筛选尽量下沉到服务端。',
  },
  {
    title: '通知类型统一',
    body: '消息中心统一存 comment_notifications，type 只使用约定枚举：comment_reply / content_like / content_comment / weekly_summary / automation_monitor。页面按「互动 / 自动化监控」分类展示；新增类型必须同步 app/api/notifications 的标题与跳转映射。',
  },
  {
    title: '自动化失败告警统一',
    body: '定时任务失败统一 POST /api/automation/alert 写入站长消息中心，按 workflow + runId 幂等去重；鉴权走 *_SECRET 回退链（AUTOMATION_ALERT_SECRET → WEEKLY_SUMMARY_SECRET → PUBLIC_OPINION_COLLECT_SECRET）。GitHub Actions 工作流必须带 if: failure() 的告警步骤。',
  },
  {
    title: '定时端点鉴权与幂等',
    body: '外部调度端点统一用 x-<name>-secret 请求头校验，优先专用 Secret，未配置时回退 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET。同一天可能被多次触发的任务（如早问候补跑）必须在端点做自然日幂等，重复触发只返回跳过，不重复执行副作用。',
  },
  {
    title: '后台卡片扁平化',
    body: '长列表和台账优先行式分隔布局，不堆大圆角白卡与留白；标题用 line-clamp-2 截断；看板类列限高 + 列内滚动，禁止一列内容把整页撑到数屏高。',
  },
  {
    title: '集成与 API Keys 统一登记',
    body: '外部服务凭证统一登记到 /admin/integrations：AES-GCM 加密落库（主密钥 INTEGRATION_KEYS_ENC_SECRET，回退 DEEPSEEK_KEYS_ENC_SECRET），界面只显示掩码。新增外部服务或 Webhook 端点必须同步 lib/integrationCatalog.js，环境变量探测只回传「已配置 / 未配置」。',
  },
  {
    title: 'D1 迁移与仓库忽略规则',
    body: '手工执行迁移 SQL 后必须同步 INSERT 进 d1_migrations，否则未来 migrations apply 会重放破坏性语句（如 DROP TABLE）。.gitignore 的目录规则只写根级（/logs），不要用裸目录名，避免误伤代码里的同名目录。',
  },
]
