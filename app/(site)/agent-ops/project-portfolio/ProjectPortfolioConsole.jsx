'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const pillars = {
  blog: {
    name: '个人博客站',
    color: '#0f766e',
    path: 'tuaran-home-page',
    intent: '个人门户、调研知识库、作品入口、长期内容资产。',
  },
  alliance: {
    name: '博主联盟',
    color: '#b45309',
    path: 'blogger-alliance',
    intent: '创作者、品牌、增长、分发、数据和商业化。',
  },
  weekly: {
    name: '前端周刊',
    color: '#2563eb',
    path: 'frontend-weekly-digest-cn',
    intent: '技术趋势、前端内容、AI 专题、学习资料和案例。',
  },
  agent: {
    name: 'AI Agent',
    color: '#7c3aed',
    path: 'accomplish / moltbot',
    intent: '自动化执行、采集、分发、治理和本地智能工作流。',
  },
}

const projects = [
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

const decisions = [
  ['核心产品', 'blogger-alliance、frontend-weekly-digest-cn', '分别承担创作者增长和前端内容两条主线。'],
  ['个人门户', 'tuaran-home-page', '不并入产品，作为所有项目和调研的展示入口。'],
  ['共享基础设施', 'md', '内容生产、渲染、分发能力同时服务博客、联盟和周刊。'],
  ['博主联盟吸收', 'matrix-alliance、MatrixLinkTech、fans-tracker、github-follow、auto-sync-blog、muti-ip', '这些都围绕人、账号、品牌、增长、分发和数据。'],
  ['前端周刊吸收', 'AI-Learning-Library、webllm、edge-llm-workbench、awsome-prompt、Awesome-Nano-Banana-images', '这些适合转成技术专题、学习资源和案例库。'],
  ['AI Agent 独立', 'accomplish、moltbot', '它们是自动化和 agent runtime 能力，不应混进内容仓库。'],
  ['归档或删除', 'Tasnia-aes、smart-news-platform、before-404-archive、aranapi、juejin-welfare-clicker', '按本次决策处理，减少长期维护噪音。'],
  ['Codex 工作区归化', 'agent-ops、openclaw-issue-pr-tool、codex-local、hello-edge-agent、csdn、localdocx', 'Codex 目录应是 AI 协作工作台；其中工具归入 Agent 线，文档归入资产库，内容草稿归入 md/博主联盟。'],
  ['Claude 工作区归化', 'pubishlab、ccunpacked-zh、SaaS-skills、docx、xhs-auto-poster、surveys', 'Claude 目录应从项目仓库变成产物来源；成熟项目迁到 GitHub 主目录或归入四条主线，文档进入统一资产库。'],
]

const actionLabels = {
  all: '全部项目',
  core: '核心',
  merge: '整合',
  infra: '基础设施',
  keep: '保留',
  separate: '独立线',
  archive: '归档',
}

const actionStyles = {
  core: 'bg-[#dae4c7] text-[#92400e] dark:bg-[#3a2c0a] dark:text-[#a5b679]',
  merge: 'bg-[#e4e5d5] text-[#7c2d12] dark:bg-[#3b2112] dark:text-[#a4a274]',
  infra: 'bg-[#dcfce7] text-[#14532d] dark:bg-[#102a1b] dark:text-[#86efac]',
  keep: 'bg-[#e0f2fe] text-[#075985] dark:bg-[#0b2638] dark:text-[#7dd3fc]',
  separate: 'bg-[#ede9fe] text-[#5b21b6] dark:bg-[#241739] dark:text-[#c4b5fd]',
  archive: 'bg-[#e2e8f0] text-[#334155] dark:bg-[#1f2937] dark:text-[#cbd5e1]',
}

const positions = {
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

const principles = ['主目录只放 Git 仓库', '缓存和源码分开判断', '不确定先归档再删除', 'dirty repo 先收口']

const INFRA_DIMENSIONS = ['托管', 'DB', 'R2', '登录', '邮件', 'Admin', 'Changelog']

const SITE_INFRA = [
  {
    id: '2aran',
    name: '2aran.com',
    role: '个人门户与调研知识库',
    repoPath: 'tuaran-home-page',
    color: pillars.blog.color,
    stack: 'Next.js 15 + React 19 + Tailwind 3',
    cells: {
      托管: { tone: 'solid', primary: 'Cloudflare Pages', sub: 'next-on-pages' },
      DB: { tone: 'solid', primary: 'Cloudflare D1', sub: 'binding DB · db tuaran-me · 19 迁移' },
      R2: { tone: 'none', primary: '未使用', sub: 'wrangler.toml 无 r2_buckets' },
      登录: { tone: 'solid', primary: 'GH OAuth + Google OAuth + Email OTP', sub: 'edge HMAC cookie · ownerAuth env 配置' },
      邮件: { tone: 'solid', primary: 'Resend', sub: 'POST /emails · PBKDF2 · 限流 / TTL' },
      Admin: { tone: 'solid', primary: '/admin', sub: 'db · nav · ops · portfolio · share' },
      Changelog: { tone: 'partial', primary: 'JS 硬编码数组', sub: 'app/(site)/changelog/page.jsx · planned/done' },
    },
  },
  {
    id: 'syncblog',
    name: 'syncblog.cn',
    role: '内容生产 / 多平台分发底座',
    repoPath: 'md (TUARAN/md)',
    color: pillars.agent.color,
    stack: 'Vue 3 + Vite + pnpm monorepo',
    referenceTag: '仅 Changelog 形式参照',
    cells: {
      托管: { tone: 'note', primary: 'Cloudflare Worker', sub: 'WorkerEntrypoint · ASSETS 绑定 dist' },
      DB: { tone: 'solid', primary: 'Cloudflare D1', sub: 'binding DB · db syncblog · 6 迁移' },
      R2: { tone: 'note', primary: 'GitHub ImgBed', sub: 'bucketio × 20 仓 · 可选 CDN' },
      登录: { tone: 'solid', primary: '邮箱 + 密码 (PBKDF2)', sub: 'Worker HMAC cookie · legacy GitHub 兼容' },
      邮件: { tone: 'solid', primary: 'Resend', sub: 'EMAIL_PROVIDER=resend · 仅存验证码哈希' },
      Admin: { tone: 'note', primary: 'Workflow + Settings', sub: '/workflow/* · /settings · /pricing' },
      Changelog: { tone: 'solid', primary: 'CHANGELOG.md + /changelog', sub: '根 markdown · ChangelogPage 时间线' },
    },
    note: '不是传统 /admin 后台，而是把编辑器、素材、AI 创作、导入、分发、增长统计拆到 /workflow/*；账号、配额和创作者名片由 D1 + Worker API 支撑。',
  },
  {
    id: 'blogger',
    name: 'blogger-alliance.cn',
    role: '核心产品 · 博主联盟',
    repoPath: 'blogger-alliance',
    color: pillars.alliance.color,
    stack: 'Vue 3 + Vite',
    cells: {
      托管: { tone: 'note', primary: 'Cloudflare Worker', sub: 'cloudflare/worker.js · ASSETS · custom domain × 2' },
      DB: { tone: 'solid', primary: 'Supabase 单一数据源', sub: 'Postgres 业务数据 · Worker API 边界' },
      R2: { tone: 'none', primary: '未声明', sub: '—' },
      登录: { tone: 'solid', primary: 'Supabase Auth + Worker RBAC', sub: 'Bearer token · profiles.role 复验' },
      邮件: { tone: 'solid', primary: 'Resend SMTP', sub: 'Supabase 邮件改走 mail.syncblog.cn' },
      Admin: { tone: 'partial', primary: 'Workspace + 内部台账', sub: '/tob/internal · /workspace/cloud-promo' },
      Changelog: { tone: 'solid', primary: 'WorkspaceChangelog.vue', sub: '/workspace/changelog 产品动态' },
    },
    note: '账号、角色、商单、推广报告和年度总览已统一落到 Supabase Postgres；Cloudflare Worker 保留 API 边界，校验 Supabase JWT 与角色，并用服务端 service role 写业务数据。',
  },
  {
    id: 'frontendnext',
    name: 'frontendnext.com',
    role: '核心产品 · 前端周刊',
    repoPath: 'frontend-weekly-digest-cn/web',
    color: pillars.weekly.color,
    stack: 'Next.js 16 + TS + Tailwind 4',
    cells: {
      托管: { tone: 'solid', primary: 'Cloudflare Pages', sub: 'output: export (纯静态)' },
      DB: { tone: 'partial', primary: '无线上 DB', sub: '内容读 markdown · 订单代码写 .orders' },
      R2: { tone: 'none', primary: '未声明', sub: '—' },
      登录: { tone: 'none', primary: '无', sub: '纯只读站点' },
      邮件: { tone: 'partial', primary: '订阅 Stub', sub: '/api/subscribe 仅校验与回包' },
      Admin: { tone: 'none', primary: '无', sub: '—' },
      Changelog: { tone: 'none', primary: '未设独立 Changelog', sub: '靠 weekly/content 与 README 记录' },
    },
    note: 'README 锁死 Cloudflare Pages 与 output: export；app/api/{order,payments,subscribe} 和 .orders 文件持久化是代码占位，不等于当前线上能力。动态逻辑应迁到 Pages Functions/Workers + D1。',
  },
]

const SITE_INFRA_FINDINGS = [
  ['syncblog.cn', '后台形态不是 /admin，而是工作流中控台：/workflow/data、/workflow/creation、/workflow/import、/workflow/distribution、/workflow/stats，加 /settings、/pricing 和 /creator-offer。'],
  ['blogger-alliance.cn', '已收敛为 Supabase 单一数据源 + Worker API：/tob/internal 承载合作台账、推广报告与年度数据，/workspace/cloud-promo 是 admin 级推广素材入口。'],
  ['frontendnext.com', '线上部署口径仍是纯静态 Pages；订单、支付、订阅 API 是后端化预留，若上线必须先落 Pages Functions/Workers 和 D1，不能按当前 Next route handler 直接依赖。'],
  ['统一判断', '四站不需要强行同构：2aran 管理自己，syncblog 管内容生产，blogger-alliance 管商业台账，frontendnext 先保持静态内容站；需要统一的是 Changelog 口径和运行状态台账。'],
]

const INFRA_TONE_STYLES = {
  solid: 'border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
  partial: 'border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
  none: 'border-[#e2e6ee] bg-[#f7f8fb] text-[#667085] dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400',
  note: 'border-sky-200 bg-sky-50/60 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200',
}

const INFRA_TONE_DOT = {
  solid: 'bg-emerald-500',
  partial: 'bg-amber-500',
  none: 'bg-[#cbd5e1] dark:bg-gray-700',
  note: 'bg-sky-500',
}

const INFRA_TONE_LEGEND = [
  ['solid', '已具备 / 已对齐'],
  ['partial', '存在但分裂或不一致'],
  ['note', '已具备但与众不同'],
  ['none', '未使用 / 待定'],
]

function relationText(project) {
  const targets = project.links
    .slice(0, 4)
    .map((id) => projects.find((item) => item.id === id)?.name || id)
    .join(' -> ')
  if (!targets) return project.next
  return `${project.role}；关联 ${targets}。${project.next}`
}

function compactName(name) {
  return name.length > 18 ? `${name.slice(0, 17)}...` : name
}

const GRAPH_WIDTH = 1060
const GRAPH_HEIGHT = 760
const GRAPH_MIN_SCALE = 0.5
const GRAPH_MAX_SCALE = 2.25
const GRAPH_SCALE_STEP = 0.25
const GRAPH_DEFAULT_SCALE = 1

function clampGraphScale(value) {
  return Math.min(GRAPH_MAX_SCALE, Math.max(GRAPH_MIN_SCALE, value))
}

function GraphIcon({ type }) {
  const paths = {
    zoomIn: (
      <>
        <circle cx="10" cy="10" r="5" />
        <path d="M10 7v6M7 10h6M14 14l4 4" />
      </>
    ),
    zoomOut: (
      <>
        <circle cx="10" cy="10" r="5" />
        <path d="M7 10h6M14 14l4 4" />
      </>
    ),
    reset: <path d="M5 8a7 7 0 1 1 2 9.8M5 8V4M5 8h4" />,
    fullscreen: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
    exitFullscreen: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

function GraphControlButton({ label, onClick, disabled = false, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d9dee7] bg-white text-[#344054] transition hover:border-[#98a2b3] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-500"
    >
      <GraphIcon type={icon} />
    </button>
  )
}

const PORTFOLIO_SNAPSHOT = {
  at: '2026-06',
  label: '2026 年 6 月',
}

const PRIMARY_VIEW_DEFS = [
  {
    key: 'repos',
    label: '本地仓库',
    title: '三大板块 + AI Agent 关系图',
    desc: 'GitHub / Codex / Claude 工作区 · 拖拽画布移动；箭头表示吸收、服务、迁移或归档关系',
    snapshotAt: PORTFOLIO_SNAPSHOT.at,
    snapshotLabel: PORTFOLIO_SNAPSHOT.label,
  },
  {
    key: 'sites',
    label: '核心运营站点',
    title: '四站基础设施现状',
    desc: '2aran.com · syncblog.cn · blogger-alliance.cn · frontendnext.com（md 仅作 Changelog 形式参照）',
    snapshotAt: PORTFOLIO_SNAPSHOT.at,
    snapshotLabel: PORTFOLIO_SNAPSHOT.label,
  },
]

function SnapshotBadge({ label = PORTFOLIO_SNAPSHOT.label }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[#d9dee7] bg-[#f8fafc] px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#667085] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
      快照 {label}
    </span>
  )
}

export default function ProjectPortfolioConsole({ user }) {
  const [selected, setSelected] = useState('blogger-alliance')
  const [actionFilter, setActionFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [primaryView, setPrimaryView] = useState('repos')
  const [graphScale, setGraphScale] = useState(GRAPH_DEFAULT_SCALE)
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
  const [isGraphDragging, setIsGraphDragging] = useState(false)
  const graphFrameRef = useRef(null)
  const graphDragRef = useRef(null)
  const suppressGraphClickRef = useRef(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((project) => {
      const actionOk = actionFilter === 'all' || project.action === actionFilter
      const haystack = [project.name, project.role, project.next, project.path, pillars[project.pillar]?.name, project.action]
        .join(' ')
        .toLowerCase()
      return actionOk && (!q || haystack.includes(q))
    })
  }, [actionFilter, query])

  const visibleIds = useMemo(() => new Set(filtered.map((project) => project.id)), [filtered])
  const graphProjects = filtered.filter((project) => positions[project.id])
  const graphEdges = graphProjects.flatMap((project) =>
    project.links
      .filter((targetId) => (query.trim() ? visibleIds.has(targetId) : true))
      .map((targetId) => [project.id, targetId])
  )
  const selectedProject = projects.find((item) => item.id === selected) || projects[0]
  const selectedPillar = pillars[selectedProject.pillar]

  useEffect(() => {
    function syncFullscreenState() {
      setIsGraphFullscreen(document.fullscreenElement === graphFrameRef.current)
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  function updateGraphScale(nextScale) {
    setGraphScale(clampGraphScale(Math.round(nextScale * 100) / 100))
  }

  async function toggleGraphFullscreen() {
    const element = graphFrameRef.current
    if (!element) return

    if (document.fullscreenElement === element) {
      await document.exitFullscreen()
      return
    }

    await element.requestFullscreen()
  }

  function handleGraphPointerDown(event) {
    if (event.button !== 0) return

    graphDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
      moved: false,
    }
    setIsGraphDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleGraphPointerMove(event) {
    const drag = graphDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true
    }

    event.currentTarget.scrollLeft = drag.scrollLeft - deltaX
    event.currentTarget.scrollTop = drag.scrollTop - deltaY
    event.preventDefault()
  }

  function handleGraphPointerEnd(event) {
    const drag = graphDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    event.currentTarget.releasePointerCapture?.(event.pointerId)
    graphDragRef.current = null
    setIsGraphDragging(false)

    if (drag.moved) {
      suppressGraphClickRef.current = true
      setTimeout(() => {
        suppressGraphClickRef.current = false
      }, 0)
    }
  }

  function handleGraphNodeClick(projectId) {
    if (suppressGraphClickRef.current) return
    setSelected(projectId)
  }

  return (
    <main className="mx-auto grid w-full max-w-[1480px] gap-5 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-lg bg-[#111827] p-5 text-[#f8fafc] lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#94a3b8]">
            Agent Ops · Project Portfolio
          </p>
          <h1 className="mt-3 text-xl font-semibold leading-snug">TUARAN 项目组合图</h1>
          <p className="mt-2 text-sm leading-6 text-[#cbd5e1]">
            {primaryView === 'repos'
              ? '本地 GitHub / Codex / Claude 工作区：关系图、治理动作与整合路线。'
              : '四座核心运营站点：托管、数据、登录、邮件与后台现状对比。'}
          </p>
          <p className="mt-3 text-xs text-[#94a3b8]">
            已授权：{user?.name || user?.login || 'owner'} · 快照 {PORTFOLIO_SNAPSHOT.label}
          </p>
        </div>

        <p className="mt-6 text-xs uppercase text-[#94a3b8]">主视图</p>
        <div className="mt-2 grid gap-2">
          {PRIMARY_VIEW_DEFS.map((view) => {
            const active = primaryView === view.key
            return (
              <button
                key={view.key}
                type="button"
                aria-pressed={active}
                onClick={() => setPrimaryView(view.key)}
                className={`rounded-lg px-3 py-2.5 text-left transition ${
                  active ? 'bg-[#f8fafc] text-[#111827]' : 'bg-white/5 text-[#e5e7eb] hover:bg-white/10'
                }`}
              >
                <span className="block text-sm font-semibold">{view.label}</span>
                <span className={`mt-0.5 block text-[11px] ${active ? 'text-[#475467]' : 'text-[#94a3b8]'}`}>
                  {view.title}
                </span>
                <span className={`mt-0.5 block font-mono text-[10px] ${active ? 'text-[#667085]' : 'text-[#64748b]'}`}>
                  快照 {view.snapshotLabel}
                </span>
              </button>
            )
          })}
        </div>

        {primaryView === 'repos' ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                [String(Object.keys(pillars).length), '核心板块'],
                [String(projects.length), '仓库/工作区'],
                ['30G', '整理后体积'],
                ['38G', '已释放空间'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <b className="block text-lg">{value}</b>
                  <span className="text-xs text-[#cbd5e1]">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase text-[#94a3b8]">按治理动作筛选</p>
            <div className="mt-2 grid gap-2">
              {Object.entries(actionLabels).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={actionFilter === id}
                  onClick={() => setActionFilter(id)}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                    actionFilter === id ? 'bg-[#f8fafc] text-[#111827]' : 'bg-white/5 text-[#e5e7eb] hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase text-[#94a3b8]">四大板块</p>
            <div className="mt-2 grid gap-2">
              {Object.entries(pillars).map(([id, pillar]) => (
                <div key={id} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-[#e5e7eb]">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: pillar.color }} />
                  {pillar.name}
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase text-[#94a3b8]">管理原则</p>
            <div className="mt-2 grid gap-2">
              {principles.map((principle) => (
                <div key={principle} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-[#e5e7eb]">
                  {principle}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                [String(SITE_INFRA.length), '核心站点'],
                [String(INFRA_DIMENSIONS.length), '对比维度'],
                ['4', '图例类型'],
                [PORTFOLIO_SNAPSHOT.label.replace(/\s/g, ''), '快照月份'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <b className="block text-lg">{value}</b>
                  <span className="text-xs text-[#cbd5e1]">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase text-[#94a3b8]">四座站点</p>
            <div className="mt-2 grid gap-2">
              {SITE_INFRA.map((site) => (
                <a
                  key={site.id}
                  href={`#site-card-${site.id}`}
                  className="rounded-lg bg-white/5 px-3 py-2 text-sm text-[#e5e7eb] no-underline transition hover:bg-white/10"
                >
                  <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: site.color }} />
                  {site.name}
                </a>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase text-[#94a3b8]">状态图例</p>
            <div className="mt-2 grid gap-2">
              {INFRA_TONE_LEGEND.map(([tone, label]) => (
                <div key={tone} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-[#e5e7eb]">
                  <span className={`inline-block h-2 w-2 rounded-full ${INFRA_TONE_DOT[tone]}`} />
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      <div className="grid min-w-0 gap-5">
        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#667085] dark:text-gray-500">
              {primaryView === 'repos' ? '本地仓库' : '核心运营站点'}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#15140f] dark:text-gray-100">
              {primaryView === 'repos' ? '三大板块 + AI Agent 关系图' : '四站基础设施现状'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-gray-400">
              {primaryView === 'repos'
                ? '在左侧切换主视图或按治理动作筛选；点击节点或阵列行查看项目详情。'
                : '在左侧跳转四座站点卡片；对比托管、数据、登录、邮件与后台差异。'}
            </p>
          </div>
          {primaryView === 'repos' ? (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="搜索项目、角色或建议"
              className="w-full rounded-lg border border-[#d9dee7] bg-white px-3 py-2 text-sm outline-none focus:border-[#111827] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 md:w-72"
            />
          ) : (
            <SnapshotBadge />
          )}
        </section>

        <section className="space-y-3">
          {primaryView === 'repos' ? (
            <div
              ref={graphFrameRef}
              className={`flex min-h-0 w-full flex-col rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${
                isGraphFullscreen ? 'h-screen rounded-none border-0' : 'min-h-[640px]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#667085] dark:text-gray-500">本地仓库</p>
                  <h3 className="mt-1 text-base font-semibold text-[#15140f] dark:text-gray-100">三大板块 + AI Agent 关系图</h3>
                  <span className="mt-1 block text-xs text-[#667085] dark:text-gray-400">
                    GitHub / Codex / Claude 工作区 · 拖拽画布移动；箭头表示吸收、服务、迁移或归档关系
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <SnapshotBadge />
                  <div className="flex items-center gap-1.5">
                  <GraphControlButton
                    label="缩小关系图"
                    icon="zoomOut"
                    onClick={() => updateGraphScale(graphScale - GRAPH_SCALE_STEP)}
                    disabled={graphScale <= GRAPH_MIN_SCALE}
                  />
                  <span className="inline-flex h-8 min-w-14 items-center justify-center rounded-md border border-[#d9dee7] bg-[#f8fafc] px-2 font-mono text-[11px] text-[#475467] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                    {Math.round(graphScale * 100)}%
                  </span>
                  <GraphControlButton
                    label="放大关系图"
                    icon="zoomIn"
                    onClick={() => updateGraphScale(graphScale + GRAPH_SCALE_STEP)}
                    disabled={graphScale >= GRAPH_MAX_SCALE}
                  />
                  <GraphControlButton label="重置缩放" icon="reset" onClick={() => updateGraphScale(GRAPH_DEFAULT_SCALE)} disabled={graphScale === GRAPH_DEFAULT_SCALE} />
                  <GraphControlButton
                    label={isGraphFullscreen ? '退出全屏' : '全屏查看关系图'}
                    icon={isGraphFullscreen ? 'exitFullscreen' : 'fullscreen'}
                    onClick={toggleGraphFullscreen}
                  />
                  </div>
                </div>
              </div>
              <div
                className={`min-h-0 flex-1 select-none overflow-auto p-4 touch-none ${
                  isGraphDragging ? 'cursor-grabbing' : 'cursor-grab'
                } ${isGraphFullscreen ? '' : 'max-h-[760px]'}`}
                onPointerDown={handleGraphPointerDown}
                onPointerMove={handleGraphPointerMove}
                onPointerUp={handleGraphPointerEnd}
                onPointerCancel={handleGraphPointerEnd}
                onPointerLeave={handleGraphPointerEnd}
              >
                <svg
                  className="block"
                  width={GRAPH_WIDTH * graphScale}
                  height={GRAPH_HEIGHT * graphScale}
                  viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
                  role="img"
                  aria-label="TUARAN 项目关系图"
                >
                  <defs>
                    <marker id="portfolio-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#aab3c2" />
                    </marker>
                  </defs>
                  {graphEdges.map(([fromId, toId]) => {
                    const from = positions[fromId]
                    const to = positions[toId]
                    const fromProject = projects.find((project) => project.id === fromId)
                    if (!from || !to || !fromProject) return null
                    const strong = ['core', 'infra', 'merge'].includes(fromProject.action)
                    const midX = (from[0] + to[0]) / 2 + 70
                    return (
                      <path
                        key={`${fromId}-${toId}`}
                        d={`M ${from[0] + 70} ${from[1] + 22} C ${midX} ${from[1] + 22}, ${midX} ${to[1] + 22}, ${to[0] + 70} ${to[1] + 22}`}
                        markerEnd="url(#portfolio-arrow)"
                        fill="none"
                        stroke="#aab3c2"
                        strokeWidth={strong ? 2.8 : 1.6}
                      />
                    )
                  })}
                  {graphProjects.map((project) => {
                    const [x, y] = positions[project.id]
                    const pillar = pillars[project.pillar]
                    const isSelected = selected === project.id
                    const isCore = project.action === 'core'
                    return (
                      <g key={project.id} transform={`translate(${x}, ${y})`} className="cursor-pointer" onClick={() => handleGraphNodeClick(project.id)}>
                        <rect
                          width="150"
                          height="58"
                          rx="8"
                          fill="#fff"
                          stroke={isSelected ? '#111827' : pillar.color}
                          strokeWidth={isSelected || isCore ? 2.4 : 1.4}
                          filter={isSelected ? 'drop-shadow(0 8px 12px rgba(15,23,42,0.16))' : undefined}
                        />
                        <circle cx="16" cy="18" r="5" fill={pillar.color} />
                        <text x="28" y="22" fill="#17202a" fontSize="13" fontWeight="650">
                          {compactName(project.name)}
                        </text>
                        <text x="14" y="43" fill="#667085" fontSize="11">
                          {actionLabels[project.action]} · {pillar.name}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          ) : (
            <section className="flex min-h-[640px] w-full min-w-0 flex-col rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#667085] dark:text-gray-500">核心运营站点</p>
                  <h3 className="mt-1 text-base font-semibold text-[#15140f] dark:text-gray-100">四站基础设施现状</h3>
                  <span className="mt-1 block text-xs text-[#667085] dark:text-gray-400">
                    2aran.com · syncblog.cn · blogger-alliance.cn · frontendnext.com（md 仅作 Changelog 形式参照）
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <SnapshotBadge />
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#667085] dark:text-gray-400">
                    {INFRA_TONE_LEGEND.map(([tone, label]) => (
                      <span key={tone} className="inline-flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${INFRA_TONE_DOT[tone]}`} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {SITE_INFRA.map((site) => (
                    <article
                      key={site.id}
                      id={`site-card-${site.id}`}
                      className="overflow-hidden rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950/40"
                    >
                      <div className="h-1 w-full" style={{ background: site.color }} />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="break-words text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{site.name}</h4>
                            <p className="mt-0.5 text-[11px] leading-5 text-[#667085] dark:text-gray-400">{site.role}</p>
                          </div>
                          {site.referenceTag ? (
                            <span className="shrink-0 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
                              {site.referenceTag}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 break-words font-mono text-[10px] leading-4 text-[#94a3b8] dark:text-gray-500">
                          {site.repoPath}
                        </p>
                        <p className="mt-1 text-[11px] text-[#667085] dark:text-gray-400">{site.stack}</p>

                        <dl className="mt-4 grid gap-1.5">
                          {INFRA_DIMENSIONS.map((dim) => {
                            const cell = site.cells[dim]
                            return (
                              <div
                                key={dim}
                                className={`grid grid-cols-[56px_minmax(0,1fr)] items-start gap-2 rounded-md border px-2 py-1.5 text-[11px] leading-4 ${INFRA_TONE_STYLES[cell.tone]}`}
                              >
                                <dt className="flex items-center gap-1.5 pt-0.5 font-mono text-[10px] uppercase tracking-wider opacity-80">
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${INFRA_TONE_DOT[cell.tone]}`} />
                                  {dim}
                                </dt>
                                <dd className="min-w-0">
                                  <span className="block break-words font-semibold">{cell.primary}</span>
                                  {cell.sub ? <span className="block break-words text-[10px] opacity-75">{cell.sub}</span> : null}
                                </dd>
                              </div>
                            )
                          })}
                        </dl>

                        {site.note ? (
                          <div className="mt-3 rounded-md border-l-2 border-amber-400 bg-amber-50/70 px-2.5 py-1.5 text-[11px] leading-5 text-amber-900 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200">
                            {site.note}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="rounded-md border border-purple-200 bg-purple-50/50 px-3 py-2 text-[12px] leading-6 text-purple-900 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-200">
                  <b>模板参照范围：</b>仅 <span className="font-mono">Changelog</span> 形式参照 md（CHANGELOG.md）。其他维度（DB / R2 / 登录 / 账号 / 邮件 / Admin）现状已列，统一策略<b>待定</b>——本节先呈现真实差异，不预设对齐方向。
                </div>

                <div className="rounded-lg border border-[#d9dee7] bg-[#fbfcff] p-4 dark:border-gray-800 dark:bg-gray-950/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#667085] dark:text-gray-500">补充调研</p>
                      <h4 className="mt-1 text-sm font-semibold text-[#15140f] dark:text-gray-100">本轮本地代码扫描结论</h4>
                    </div>
                    <SnapshotBadge />
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {SITE_INFRA_FINDINGS.map(([site, finding]) => (
                      <div key={site} className="rounded-md border border-[#e2e6ee] bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[#667085] dark:text-gray-500">{site}</p>
                        <p className="mt-1 text-[12px] leading-6 text-[#344054] dark:text-gray-300">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </section>

        {primaryView === 'repos' ? (
        <section className="rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
            <h3 className="text-base font-semibold text-[#15140f] dark:text-gray-100">项目详情</h3>
            <p className="mt-1 text-xs text-[#667085] dark:text-gray-400">
              {selectedPillar.name} · {actionLabels[selectedProject.action]}
            </p>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h3 className="text-lg font-semibold text-[#15140f] dark:text-gray-100">{selectedProject.name}</h3>
              <p className="mt-1 break-words font-mono text-xs text-[#667085] dark:text-gray-400">{selectedProject.path}</p>
              <dl className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm leading-6">
                <dt className="text-[#667085]">归属</dt><dd>{selectedPillar.name}</dd>
                <dt className="text-[#667085]">角色</dt><dd>{selectedProject.role}</dd>
                <dt className="text-[#667085]">动作</dt><dd>{actionLabels[selectedProject.action]}</dd>
                <dt className="text-[#667085]">下一步</dt><dd>{selectedProject.next}</dd>
                <dt className="text-[#667085]">连接</dt><dd>{selectedProject.links.length ? selectedProject.links.join('、') : '无强依赖'}</dd>
              </dl>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#15140f] dark:text-gray-100">管理判断</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#344054] dark:text-gray-300">
                <li>{selectedPillar.intent}</li>
                <li>先整合内容、入口和数据关系，代码迁移要等边界稳定后再做。</li>
                <li>任何 dirty repo 先提交、stash 或归档，再移动目录。</li>
              </ul>
            </div>
          </div>
        </section>
        ) : null}

        {primaryView === 'repos' ? (
        <section className="rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
            <h3 className="text-base font-semibold text-[#15140f] dark:text-gray-100">关系阵列</h3>
            <span className="text-xs text-[#667085] dark:text-gray-400">按最终归属管理，不按历史目录名、工具来源或卡片分组管理</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f8fafc] text-left text-xs text-[#475467] dark:bg-gray-950 dark:text-gray-300">
                  {['项目 / 工作区', '个人站点', '博主联盟', '前端周刊', 'AI Agent', '基础设施', '动作', '关系说明'].map((head) => (
                    <th key={head} className="border-b border-r border-[#d9dee7] px-3 py-2 font-semibold dark:border-gray-800">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => {
                  const infra = project.action === 'infra' || project.id === 'md'
                  return (
                    <tr
                      key={project.id}
                      onClick={() => setSelected(project.id)}
                      className={`cursor-pointer hover:bg-[#fbfcff] dark:hover:bg-gray-950 ${selected === project.id ? 'bg-[#f3f4ed] dark:bg-[#1b1c13]' : ''}`}
                    >
                      <td className="min-w-[220px] border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">
                        <b className="block break-words text-[#17202a] dark:text-gray-100">{project.name}</b>
                        <span className="mt-1 block break-words text-[11px] leading-5 text-[#667085]">{project.path}</span>
                      </td>
                      {['blog', 'alliance', 'weekly', 'agent'].map((pillarId) => (
                        <td
                          key={pillarId}
                          className="border-b border-r border-[#d9dee7] px-3 py-2 text-center font-bold dark:border-gray-800"
                          style={{ color: project.pillar === pillarId ? pillars[pillarId].color : '#cbd5e1' }}
                        >
                          {project.pillar === pillarId ? '●' : '·'}
                        </td>
                      ))}
                      <td className="border-b border-r border-[#d9dee7] px-3 py-2 text-center font-bold dark:border-gray-800">
                        {infra ? '●' : '·'}
                      </td>
                      <td className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">
                        <span className={`rounded-full px-2 py-1 text-xs ${actionStyles[project.action] || 'bg-[#eef1f6] text-[#475467]'}`}>
                          {actionLabels[project.action]}
                        </span>
                      </td>
                      <td className="min-w-[260px] border-b border-[#d9dee7] px-3 py-2 leading-6 text-[#344054] dark:border-gray-800 dark:text-gray-300">
                        {relationText(project)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}

        {primaryView === 'repos' ? (
        <>
        <section className="rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
            <h3 className="text-base font-semibold text-[#15140f] dark:text-gray-100">未来 4 阶段迭代</h3>
            <span className="text-xs text-[#667085] dark:text-gray-400">先收口，再整合，最后产品化</span>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['1. 台账化', '每个仓库标状态、产品线、owner、dirty 情况和体积来源。先让所有项目有位置。', pillars.blog.color],
              ['2. 内容整合', '博主联盟吸收创作者增长工具；前端周刊吸收技术专题、资料库和案例。', pillars.alliance.color],
              ['3. 基础设施抽离', 'md 作为内容生产和分发底座，服务博客、博主联盟和前端周刊。', pillars.weekly.color],
              ['4. Agent 化运营', 'AI Agent 线提供自动选题、采集、分发、数据回流和项目治理助手。', pillars.agent.color],
            ].map(([title, body, color]) => (
              <article key={title} className="border-l-4 py-1 pl-3" style={{ borderColor: color }}>
                <b className="text-sm text-[#15140f] dark:text-gray-100">{title}</b>
                <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-gray-400">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
            <h3 className="text-base font-semibold text-[#15140f] dark:text-gray-100">关键决策表</h3>
            <span className="text-xs text-[#667085] dark:text-gray-400">用于后续迁移、归档和命名收敛</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f8fafc] text-left text-[#667085] dark:bg-gray-950 dark:text-gray-300">
                  <th className="border-b border-[#d9dee7] px-3 py-2 font-semibold dark:border-gray-800">决策</th>
                  <th className="border-b border-[#d9dee7] px-3 py-2 font-semibold dark:border-gray-800">涉及项目</th>
                  <th className="border-b border-[#d9dee7] px-3 py-2 font-semibold dark:border-gray-800">理由</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map(([decision, scope, reason]) => (
                  <tr key={decision}>
                    <td className="border-b border-[#d9dee7] px-3 py-3 font-medium dark:border-gray-800">{decision}</td>
                    <td className="border-b border-[#d9dee7] px-3 py-3 dark:border-gray-800">{scope}</td>
                    <td className="border-b border-[#d9dee7] px-3 py-3 leading-6 text-[#344054] dark:border-gray-800 dark:text-gray-300">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </>
        ) : null}
      </div>
    </main>
  )
}
