/**
 * AI 项目管理台 · 项目台账 seed 数据
 *
 * 数据流：
 *  - 线上正本在 D1 的 portfolio_projects 表（migrations/0020_portfolio_projects.sql 由本文件生成 seed）。
 *  - /admin/portfolio 的 ProjectPortfolioConsole 优先读 /api/admin/portfolio（D1）；
 *    D1 不可用（本地 next dev / binding 缺失）时回退到这里的快照。
 *  - 商业字段（revenue_monthly / hours_monthly / biz_status）只存在 D1 里，
 *    由站长在管理台里维护；seed 回退态下显示为「待标注」且不可编辑。
 *
 * 快照口径：2026-06 项目治理决策，与 ProjectPortfolioConsole 的 decisions 表对应。
 */

export const PORTFOLIO_SNAPSHOT = {
  at: '2026-06',
  label: '2026 年 6 月',
}

export const BIZ_STATUS_LABELS = {
  unset: '待标注',
  earning: '在挣钱',
  burning: '烧时间',
  hobby: '纯爱好',
}

export const VALID_BIZ_STATUSES = Object.keys(BIZ_STATUS_LABELS)

export const PORTFOLIO_SEED_PROJECTS = [
  { id: 'tuaran-home-page', name: 'tuaran-home-page', pillar: 'blog', action: 'keep', role: '个人门户与调研知识库', path: '/Users/tuaran/Documents/github/tuaran-home-page', next: '继续作为所有项目的展示入口，承载调研记录和项目索引。', links: ['blogger-alliance', 'frontend-weekly-digest-cn', 'md'] },
  { id: 'blogger-alliance', name: 'blogger-alliance', pillar: 'alliance', action: 'core', role: '核心产品：博主联盟', path: '/Users/tuaran/Documents/github/blogger-alliance', next: '作为创作者增长和品牌协作主产品，吸收周边增长工具。', links: ['matrix-alliance', 'MatrixLinkTech', 'fans-tracker', 'github-follow', 'auto-sync-blog', 'muti-ip', 'md'] },
  { id: 'frontend-weekly-digest-cn', name: 'frontend-weekly-digest-cn', pillar: 'weekly', action: 'core', role: '核心产品：前端周刊', path: '/Users/tuaran/Documents/github/frontend-weekly-digest-cn', next: '作为技术内容主阵地，吸收 AI 学习、WebLLM 和前端实践专题。', links: ['AI-Learning-Library', 'webllm', 'edge-llm-workbench', 'awsome-prompt', 'Awesome-Nano-Banana-images', 'md'] },
  { id: 'accomplish', name: 'accomplish', pillar: 'agent', action: 'keep', role: '桌面 AI coworker', path: '/Users/tuaran/Documents/github/accomplish', next: '独立主线，未来给内容和项目治理提供 agent 能力。', links: ['moltbot', 'md', 'tuaran-home-page'] },
  { id: 'moltbot', name: 'moltbot', pillar: 'agent', action: 'keep', role: 'AI gateway / OpenClaw runtime', path: '/Users/tuaran/Documents/github/moltbot', next: '保留独立，作为消息、多渠道和 agent runtime 试验线。', links: ['accomplish'] },
  { id: 'md', name: 'md', pillar: 'blog', action: 'infra', role: '内容生产和多平台分发底座', path: '/Users/tuaran/Documents/github/md', next: '不要并入单一产品，作为博客、博主联盟、前端周刊共享基础设施。', links: ['tuaran-home-page', 'blogger-alliance', 'frontend-weekly-digest-cn'] },
  { id: 'matrix-alliance', name: 'matrix-alliance', pillar: 'alliance', action: 'merge', role: '创作者矩阵方法论和平台原型', path: '/Users/tuaran/Documents/github/matrix-alliance', next: '优先内容和概念整合进博主联盟，代码暂不强迁。', links: ['blogger-alliance'] },
  { id: 'MatrixLinkTech', name: 'MatrixLinkTech', pillar: 'alliance', action: 'merge', role: '品牌/业务展示站', path: '/Users/tuaran/Documents/github/MatrixLinkTech', next: '整合为博主联盟背后的服务品牌或公司介绍页。', links: ['blogger-alliance'] },
  { id: 'fans-tracker', name: 'fans-tracker', pillar: 'alliance', action: 'merge', role: '粉丝与账号数据追踪', path: '/Users/tuaran/Documents/github/fans-tracker', next: '并入博主联盟数据分析能力。', links: ['blogger-alliance'] },
  { id: 'github-follow', name: 'github-follow', pillar: 'alliance', action: 'merge', role: '技术创作者发现工具', path: '/Users/tuaran/Documents/github/github-follow', next: '作为博主联盟创作者发现和推荐模块。', links: ['blogger-alliance'] },
  { id: 'auto-sync-blog', name: 'auto-sync-blog', pillar: 'alliance', action: 'merge', role: '博客自动同步工具', path: '/Users/tuaran/Documents/github/auto-sync-blog', next: '并入内容分发工具链，和 md 打通。', links: ['blogger-alliance', 'md'] },
  { id: 'muti-ip', name: 'muti-ip', pillar: 'alliance', action: 'merge', role: 'blogger-eye-platform 运行/采集工具', path: '/Users/tuaran/Documents/github/muti-ip', next: '先改名或记录远端名，再归入博主联盟数据采集线。', links: ['blogger-alliance'] },
  { id: 'AI-Learning-Library', name: 'AI-Learning-Library', pillar: 'weekly', action: 'merge', role: 'AI 学习资源库', path: '/Users/tuaran/Documents/github/AI-Learning-Library', next: '抽取部分内容成为前端周刊 AI 学习专题，不整体硬并。', links: ['frontend-weekly-digest-cn'] },
  { id: 'webllm', name: 'webllm', pillar: 'weekly', action: 'merge', role: 'WebLLM / WebGPU LLM 参考', path: '/Users/tuaran/Documents/github/webllm', next: '沉淀为前端周刊 Web 端 AI 专题案例。', links: ['frontend-weekly-digest-cn'] },
  { id: 'edge-llm-workbench', name: 'edge-llm-workbench', pillar: 'weekly', action: 'merge', role: '边缘 LLM 工程实践', path: '/Users/tuaran/Documents/github/edge-llm-workbench', next: '内容进入前端周刊专题，代码保留独立。', links: ['frontend-weekly-digest-cn'] },
  { id: 'awsome-prompt', name: 'awsome-prompt', pillar: 'weekly', action: 'merge', role: '提示词教程资源', path: '/Users/tuaran/Documents/github/awsome-prompt', next: '修正命名为 awesome-prompt，内容并入前端周刊/博主联盟资源区。', links: ['frontend-weekly-digest-cn'] },
  { id: 'Awesome-Nano-Banana-images', name: 'Awesome-Nano-Banana-images', pillar: 'weekly', action: 'merge', role: 'AI 图像案例库', path: '/Users/tuaran/Documents/github/Awesome-Nano-Banana-images', next: '作为前端周刊 AI 图像专题素材库。', links: ['frontend-weekly-digest-cn'] },
  { id: 'EmployeeHub', name: 'EmployeeHub', pillar: 'agent', action: 'separate', role: '审计/数字员工业务线', path: '/Users/tuaran/Documents/github/EmployeeHub', next: '不并入四个内容核心，作为独立业务线观察。', links: ['accomplish'] },
  { id: 'Tasnia-aes', name: 'Tasnia-aes', pillar: 'weekly', action: 'archive', role: '前端可视化实验', path: '/Users/tuaran/Documents/github/Tasnia-aes', next: '已提交到私有仓库，作为实验项目归档。', links: [] },
  { id: 'agent-ops', name: 'agent-ops', pillar: 'agent', action: 'infra', role: '本地 Agent 自动化控制面', path: '/Users/tuaran/Documents/codex/agent-ops', next: '归入 AI Agent 基础设施，后续调度内容同步、线索扫描、项目健康检查。', links: ['accomplish', 'moltbot', 'md', 'blogger-alliance'] },
  { id: 'openclaw-issue-pr-tool', name: 'openclaw-issue-pr-tool', pillar: 'agent', action: 'infra', role: 'OpenClaw issue/PR 自动化工具', path: '/Users/tuaran/Documents/codex/openclaw-issue-pr-tool', next: '归入 AI Agent 工具线，可作为 agent-ops 的任务插件，而不是独立产品。', links: ['moltbot', 'agent-ops'] },
  { id: 'codex-local', name: 'codex-local', pillar: 'agent', action: 'keep', role: 'Codex 本地定制研究工作区', path: '/Users/tuaran/Documents/codex/codex-local', next: '保留为 AI Agent 研发参考，不并入博客或周刊。', links: ['accomplish', 'agent-ops'] },
  { id: 'hello-edge-agent', name: 'hello-edge-agent', pillar: 'agent', action: 'archive', role: 'Cloudflare edge agent 实验', path: '/Users/tuaran/Documents/codex/hello-edge-agent', next: '内容沉淀到 AI Agent/Cloudflare 实践文章，代码可归档；node_modules 可清理。', links: ['agent-ops'] },
  { id: 'csdn', name: 'csdn', pillar: 'alliance', action: 'merge', role: 'CSDN 草稿和多平台发布素材', path: '/Users/tuaran/Documents/codex/csdn', next: '归入博主联盟或 md 的内容分发素材池，先处理未跟踪草稿目录。', links: ['md', 'blogger-alliance'] },
  { id: 'pubishlab', name: 'pubishlab', pillar: 'weekly', action: 'merge', role: '出版/内容实验室 Next.js 项目', path: '/Users/tuaran/Documents/claude/pubishlab', next: '适合归入前端周刊的内容产品实验，或作为 md 的出版实验前台；先清 node_modules/.next。', links: ['frontend-weekly-digest-cn', 'md', 'tuaran-home-page'] },
  { id: 'ccunpacked-zh', name: 'ccunpacked-zh', pillar: 'weekly', action: 'merge', role: 'Claude Code 中文资料/教育站', path: '/Users/tuaran/Documents/claude/ccunpacked-zh', next: '可作为前端周刊的 AI 开发工具专题资料，先处理 .claude/.wrangler 本地目录。', links: ['frontend-weekly-digest-cn'] },
  { id: 'SaaS-skills', name: 'SaaS-skills', pillar: 'weekly', action: 'merge', role: 'SaaS 技术教育站', path: '/Users/tuaran/Documents/claude/SaaS-skills', next: '归入前端周刊课程/专题素材，保留独立仓库即可。', links: ['frontend-weekly-digest-cn'] },
  { id: 'localdocx-seedance', name: 'localdocx/seedance2.0', pillar: 'weekly', action: 'archive', role: 'Seedance 2.0 出版送审稿资产', path: '/Users/tuaran/Documents/codex/localdocx/seedance2.0', next: '这是文档资产，不是代码项目；应迁入统一 doc-assets/出版/Seedance，并保留终版与修订记录。', links: ['frontend-weekly-digest-cn'] },
  { id: 'claude-docx', name: 'claude/docx', pillar: 'weekly', action: 'archive', role: '出版、协议、智能体书稿资产', path: '/Users/tuaran/Documents/claude/docx', next: '统一归到文档资产库，按出版项目分组；不要留在 Claude 工具目录根下。', links: ['frontend-weekly-digest-cn', 'agent-ops'] },
  { id: 'xhs-auto-poster', name: 'xhs-auto-poster', pillar: 'alliance', action: 'merge', role: '小红书自动发布脚本', path: '/Users/tuaran/Documents/claude/xhs-auto-poster', next: '归入博主联盟内容分发工具链，注意 .env 和账号登录态不要入库。', links: ['blogger-alliance', 'md'] },
  { id: 'homepage-claude', name: 'claude/homepage', pillar: 'blog', action: 'archive', role: '历史主页静态实验', path: '/Users/tuaran/Documents/claude/homepage', next: '如无独立价值，迁到个人博客站的 archive/design-prototypes。', links: ['tuaran-home-page'] },
  { id: 'surveys', name: 'claude/surveys', pillar: 'agent', action: 'merge', role: 'Claude/代理调研材料', path: '/Users/tuaran/Documents/claude/surveys', next: '整理为 tuaran-home-page 的 research/topics 或前端周刊 AI 工具专题。', links: ['tuaran-home-page', 'frontend-weekly-digest-cn'] },
]

export const PORTFOLIO_GRAPH_POSITIONS = {
  'tuaran-home-page': [455, 46],
  'blogger-alliance': [185, 260],
  'frontend-weekly-digest-cn': [720, 260],
  accomplish: [455, 510],
  md: [455, 272],
  moltbot: [650, 530],
  'matrix-alliance': [28, 124],
  MatrixLinkTech: [28, 224],
  'fans-tracker': [28, 324],
  'github-follow': [190, 408],
  'auto-sync-blog': [190, 124],
  'muti-ip': [190, 612],
  'AI-Learning-Library': [890, 84],
  webllm: [890, 174],
  'edge-llm-workbench': [890, 264],
  'awsome-prompt': [890, 354],
  'Awesome-Nano-Banana-images': [890, 444],
  EmployeeHub: [255, 520],
  'Tasnia-aes': [742, 600],
  'agent-ops': [255, 650],
  'openclaw-issue-pr-tool': [650, 620],
  'codex-local': [455, 622],
  'hello-edge-agent': [650, 690],
  csdn: [28, 520],
  pubishlab: [720, 84],
  'ccunpacked-zh': [890, 6],
  'SaaS-skills': [890, 534],
  'localdocx-seedance': [742, 690],
  'claude-docx': [455, 690],
  'xhs-auto-poster': [28, 424],
  'homepage-claude': [255, 6],
  surveys: [890, 650],
}

/** seed 项目统一补上商业字段默认值（D1 行同形） */
export function seedProjectsWithBizDefaults() {
  return PORTFOLIO_SEED_PROJECTS.map((project) => ({
    ...project,
    revenueMonthly: 0,
    hoursMonthly: 0,
    bizStatus: 'unset',
  }))
}
