-- AI 项目管理台 · 项目台账（/admin/portfolio）
-- 正本从 ProjectPortfolioConsole.jsx 的硬编码数组迁来（快照 2026-06）；
-- seed 数据与 lib/portfolioSeed.js 保持同形，D1 不可用时前端回退到该文件。
-- 商业字段由站长在管理台维护：
--   revenue_monthly 月收入（元）/ hours_monthly 月投入（小时）
--   biz_status ∈ ('unset','earning','burning','hobby') = 待标注/在挣钱/烧时间/纯爱好
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pillar TEXT NOT NULL,
  action TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  next_step TEXT NOT NULL DEFAULT '',
  links TEXT NOT NULL DEFAULT '[]',
  pos_x INTEGER,
  pos_y INTEGER,
  revenue_monthly REAL NOT NULL DEFAULT 0,
  hours_monthly REAL NOT NULL DEFAULT 0,
  biz_status TEXT NOT NULL DEFAULT 'unset',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_pillar
  ON portfolio_projects (pillar);

INSERT OR IGNORE INTO portfolio_projects
  (id, name, pillar, action, role, path, next_step, links, pos_x, pos_y, revenue_monthly, hours_monthly, biz_status, sort_order, updated_at)
VALUES
  ('tuaran-home-page', 'tuaran-home-page', 'blog', 'keep', '个人门户与调研知识库', '/Users/tuaran/Documents/github/tuaran-home-page', '继续作为所有项目的展示入口，承载调研记录和项目索引。', '["blogger-alliance","frontend-weekly-digest-cn","md"]', 455, 46, 0, 0, 'unset', 0, 1749724800000),
  ('blogger-alliance', 'blogger-alliance', 'alliance', 'core', '核心产品：博主联盟', '/Users/tuaran/Documents/github/blogger-alliance', '作为创作者增长和品牌协作主产品，吸收周边增长工具。', '["matrix-alliance","MatrixLinkTech","fans-tracker","github-follow","auto-sync-blog","muti-ip","md"]', 185, 260, 0, 0, 'unset', 10, 1749724800000),
  ('frontend-weekly-digest-cn', 'frontend-weekly-digest-cn', 'weekly', 'core', '核心产品：前端周刊', '/Users/tuaran/Documents/github/frontend-weekly-digest-cn', '作为技术内容主阵地，吸收 AI 学习、WebLLM 和前端实践专题。', '["AI-Learning-Library","webllm","edge-llm-workbench","awsome-prompt","Awesome-Nano-Banana-images","md"]', 720, 260, 0, 0, 'unset', 20, 1749724800000),
  ('accomplish', 'accomplish', 'agent', 'keep', '桌面 AI coworker', '/Users/tuaran/Documents/github/accomplish', '独立主线，未来给内容和项目治理提供 agent 能力。', '["moltbot","md","tuaran-home-page"]', 455, 510, 0, 0, 'unset', 30, 1749724800000),
  ('moltbot', 'moltbot', 'agent', 'keep', 'AI gateway / OpenClaw runtime', '/Users/tuaran/Documents/github/moltbot', '保留独立，作为消息、多渠道和 agent runtime 试验线。', '["accomplish"]', 650, 530, 0, 0, 'unset', 40, 1749724800000),
  ('md', 'md', 'blog', 'infra', '内容生产和多平台分发底座', '/Users/tuaran/Documents/github/md', '不要并入单一产品，作为博客、博主联盟、前端周刊共享基础设施。', '["tuaran-home-page","blogger-alliance","frontend-weekly-digest-cn"]', 455, 272, 0, 0, 'unset', 50, 1749724800000),
  ('matrix-alliance', 'matrix-alliance', 'alliance', 'merge', '创作者矩阵方法论和平台原型', '/Users/tuaran/Documents/github/matrix-alliance', '优先内容和概念整合进博主联盟，代码暂不强迁。', '["blogger-alliance"]', 28, 124, 0, 0, 'unset', 60, 1749724800000),
  ('MatrixLinkTech', 'MatrixLinkTech', 'alliance', 'merge', '品牌/业务展示站', '/Users/tuaran/Documents/github/MatrixLinkTech', '整合为博主联盟背后的服务品牌或公司介绍页。', '["blogger-alliance"]', 28, 224, 0, 0, 'unset', 70, 1749724800000),
  ('fans-tracker', 'fans-tracker', 'alliance', 'merge', '粉丝与账号数据追踪', '/Users/tuaran/Documents/github/fans-tracker', '并入博主联盟数据分析能力。', '["blogger-alliance"]', 28, 324, 0, 0, 'unset', 80, 1749724800000),
  ('github-follow', 'github-follow', 'alliance', 'merge', '技术创作者发现工具', '/Users/tuaran/Documents/github/github-follow', '作为博主联盟创作者发现和推荐模块。', '["blogger-alliance"]', 190, 408, 0, 0, 'unset', 90, 1749724800000),
  ('auto-sync-blog', 'auto-sync-blog', 'alliance', 'merge', '博客自动同步工具', '/Users/tuaran/Documents/github/auto-sync-blog', '并入内容分发工具链，和 md 打通。', '["blogger-alliance","md"]', 190, 124, 0, 0, 'unset', 100, 1749724800000),
  ('muti-ip', 'muti-ip', 'alliance', 'merge', 'blogger-eye-platform 运行/采集工具', '/Users/tuaran/Documents/github/muti-ip', '先改名或记录远端名，再归入博主联盟数据采集线。', '["blogger-alliance"]', 190, 612, 0, 0, 'unset', 110, 1749724800000),
  ('AI-Learning-Library', 'AI-Learning-Library', 'weekly', 'merge', 'AI 学习资源库', '/Users/tuaran/Documents/github/AI-Learning-Library', '抽取部分内容成为前端周刊 AI 学习专题，不整体硬并。', '["frontend-weekly-digest-cn"]', 890, 84, 0, 0, 'unset', 120, 1749724800000),
  ('webllm', 'webllm', 'weekly', 'merge', 'WebLLM / WebGPU LLM 参考', '/Users/tuaran/Documents/github/webllm', '沉淀为前端周刊 Web 端 AI 专题案例。', '["frontend-weekly-digest-cn"]', 890, 174, 0, 0, 'unset', 130, 1749724800000),
  ('edge-llm-workbench', 'edge-llm-workbench', 'weekly', 'merge', '边缘 LLM 工程实践', '/Users/tuaran/Documents/github/edge-llm-workbench', '内容进入前端周刊专题，代码保留独立。', '["frontend-weekly-digest-cn"]', 890, 264, 0, 0, 'unset', 140, 1749724800000),
  ('awsome-prompt', 'awsome-prompt', 'weekly', 'merge', '提示词教程资源', '/Users/tuaran/Documents/github/awsome-prompt', '修正命名为 awesome-prompt，内容并入前端周刊/博主联盟资源区。', '["frontend-weekly-digest-cn"]', 890, 354, 0, 0, 'unset', 150, 1749724800000),
  ('Awesome-Nano-Banana-images', 'Awesome-Nano-Banana-images', 'weekly', 'merge', 'AI 图像案例库', '/Users/tuaran/Documents/github/Awesome-Nano-Banana-images', '作为前端周刊 AI 图像专题素材库。', '["frontend-weekly-digest-cn"]', 890, 444, 0, 0, 'unset', 160, 1749724800000),
  ('EmployeeHub', 'EmployeeHub', 'agent', 'separate', '审计/数字员工业务线', '/Users/tuaran/Documents/github/EmployeeHub', '不并入四个内容核心，作为独立业务线观察。', '["accomplish"]', 255, 520, 0, 0, 'unset', 170, 1749724800000),
  ('Tasnia-aes', 'Tasnia-aes', 'weekly', 'archive', '前端可视化实验', '/Users/tuaran/Documents/github/Tasnia-aes', '已提交到私有仓库，作为实验项目归档。', '[]', 742, 600, 0, 0, 'unset', 180, 1749724800000),
  ('agent-ops', 'agent-ops', 'agent', 'infra', '本地 Agent 自动化控制面', '/Users/tuaran/Documents/codex/agent-ops', '归入 AI Agent 基础设施，后续调度内容同步、线索扫描、项目健康检查。', '["accomplish","moltbot","md","blogger-alliance"]', 255, 650, 0, 0, 'unset', 190, 1749724800000),
  ('openclaw-issue-pr-tool', 'openclaw-issue-pr-tool', 'agent', 'infra', 'OpenClaw issue/PR 自动化工具', '/Users/tuaran/Documents/codex/openclaw-issue-pr-tool', '归入 AI Agent 工具线，可作为 agent-ops 的任务插件，而不是独立产品。', '["moltbot","agent-ops"]', 650, 620, 0, 0, 'unset', 200, 1749724800000),
  ('codex-local', 'codex-local', 'agent', 'keep', 'Codex 本地定制研究工作区', '/Users/tuaran/Documents/codex/codex-local', '保留为 AI Agent 研发参考，不并入博客或周刊。', '["accomplish","agent-ops"]', 455, 622, 0, 0, 'unset', 210, 1749724800000),
  ('hello-edge-agent', 'hello-edge-agent', 'agent', 'archive', 'Cloudflare edge agent 实验', '/Users/tuaran/Documents/codex/hello-edge-agent', '内容沉淀到 AI Agent/Cloudflare 实践文章，代码可归档；node_modules 可清理。', '["agent-ops"]', 650, 690, 0, 0, 'unset', 220, 1749724800000),
  ('csdn', 'csdn', 'alliance', 'merge', 'CSDN 草稿和多平台发布素材', '/Users/tuaran/Documents/codex/csdn', '归入博主联盟或 md 的内容分发素材池，先处理未跟踪草稿目录。', '["md","blogger-alliance"]', 28, 520, 0, 0, 'unset', 230, 1749724800000),
  ('pubishlab', 'pubishlab', 'weekly', 'merge', '出版/内容实验室 Next.js 项目', '/Users/tuaran/Documents/claude/pubishlab', '适合归入前端周刊的内容产品实验，或作为 md 的出版实验前台；先清 node_modules/.next。', '["frontend-weekly-digest-cn","md","tuaran-home-page"]', 720, 84, 0, 0, 'unset', 240, 1749724800000),
  ('ccunpacked-zh', 'ccunpacked-zh', 'weekly', 'merge', 'Claude Code 中文资料/教育站', '/Users/tuaran/Documents/claude/ccunpacked-zh', '可作为前端周刊的 AI 开发工具专题资料，先处理 .claude/.wrangler 本地目录。', '["frontend-weekly-digest-cn"]', 890, 6, 0, 0, 'unset', 250, 1749724800000),
  ('SaaS-skills', 'SaaS-skills', 'weekly', 'merge', 'SaaS 技术教育站', '/Users/tuaran/Documents/claude/SaaS-skills', '归入前端周刊课程/专题素材，保留独立仓库即可。', '["frontend-weekly-digest-cn"]', 890, 534, 0, 0, 'unset', 260, 1749724800000),
  ('localdocx-seedance', 'localdocx/seedance2.0', 'weekly', 'archive', 'Seedance 2.0 出版送审稿资产', '/Users/tuaran/Documents/codex/localdocx/seedance2.0', '这是文档资产，不是代码项目；应迁入统一 doc-assets/出版/Seedance，并保留终版与修订记录。', '["frontend-weekly-digest-cn"]', 742, 690, 0, 0, 'unset', 270, 1749724800000),
  ('claude-docx', 'claude/docx', 'weekly', 'archive', '出版、协议、智能体书稿资产', '/Users/tuaran/Documents/claude/docx', '统一归到文档资产库，按出版项目分组；不要留在 Claude 工具目录根下。', '["frontend-weekly-digest-cn","agent-ops"]', 455, 690, 0, 0, 'unset', 280, 1749724800000),
  ('xhs-auto-poster', 'xhs-auto-poster', 'alliance', 'merge', '小红书自动发布脚本', '/Users/tuaran/Documents/claude/xhs-auto-poster', '归入博主联盟内容分发工具链，注意 .env 和账号登录态不要入库。', '["blogger-alliance","md"]', 28, 424, 0, 0, 'unset', 290, 1749724800000),
  ('homepage-claude', 'claude/homepage', 'blog', 'archive', '历史主页静态实验', '/Users/tuaran/Documents/claude/homepage', '如无独立价值，迁到个人博客站的 archive/design-prototypes。', '["tuaran-home-page"]', 255, 6, 0, 0, 'unset', 300, 1749724800000),
  ('surveys', 'claude/surveys', 'agent', 'merge', 'Claude/代理调研材料', '/Users/tuaran/Documents/claude/surveys', '整理为 tuaran-home-page 的 research/topics 或前端周刊 AI 工具专题。', '["tuaran-home-page","frontend-weekly-digest-cn"]', 890, 650, 0, 0, 'unset', 310, 1749724800000);
