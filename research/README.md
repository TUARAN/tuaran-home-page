# 调研知识库（写作约定）

本目录是「TUARAN 调研知识库」的存储源头。所有调研报告都以 Markdown 文件落到这里，
随主站仓库一起 `git push`，Cloudflare Pages 自动重新构建后即在 `2aran.com/articles` 上线。

> 网站不调用任何大模型。调研内容的作者与来源统一记为 **TUARAN**；
> Claude Code / Codex / 豆包 / Gemini 等只作为协助工具标注，例如 `TUARAN（Codex 协助）`。

---

## 目录结构

```
research/
├── companies/                # 公司调研
│   └── 2026-05-15-anthropic.md
├── topics/                   # 其他事项调研（技术、产品、行业、概念……）
│   └── 2026-05-15-mcp-protocol.md
└── README.md                 # 本文件
```

- `companies/` 用于公司类调研（创业公司、大厂、被投企业等）
- `topics/` 用于其他事项调研（一项技术、一个标准、一个赛道、一份白皮书……）

## 文件命名

```
YYYY-MM-DD-<slug>.md
```

- 日期使用调研发起当日（北京时间），方便按时间排序
- `<slug>` 全小写英文/数字/连字符；公司名建议用域名主干（`anthropic`、`openai`、`bytedance`）

## Frontmatter（必填）

每篇 MD **必须**以 YAML frontmatter 开头：

```yaml
---
title: Anthropic 公司调研
category: companies          # companies | topics
date: 2026-05-15
tags: [AI, 大模型, 公司]
summary: 一句话概述本篇调研要回答的问题与结论。
tldr: 不写则回退用 summary；想突出与 summary 不同的一句话总结时填这里。
topic_type: market           # 仅 topics 用：industry | tech | product | market | thesis
source: claude-code          # 协助工具：claude-code | codex | doubao | gemini | gpt | manual
model: claude-opus-4-7       # 底层模型 ID（可选，仅作内部记录）
pv: 0                        # 阅读量（可选，列表页与详情页展示）
---
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | 列表页与详情页标题 |
| `category` | ✅ | `companies` 或 `topics`，必须与所在子目录一致 |
| `date` | ✅ | `YYYY-MM-DD` |
| `tags` | ⭕ | 字符串数组，用于检索与归档 |
| `summary` | ⭕ | 一句话摘要，列表页展示 |
| `tldr` | ⭕ | 详情页顶部 TL;DR 框使用；不写则回退 `summary` 或正文首段 |
| `topic_type` | ⭕ | 仅 `topics` 用，二级类型：`industry` 行业 / `tech` 技术 / `product` 产品 / `market` 市场 / `thesis` 观点 |
| `source` | ⭕ | 协助工具：`claude-code` / `codex` / `doubao` / `gemini` / `gpt` / `manual`；前台统一展示为 `来源：TUARAN（Codex 协助）` 这类口径 |
| `model` | ⭕ | 底层模型 ID，仅作内部追溯，不作为文章来源 |
| `pv` | ⭕ | 阅读量，填非负整数；不填时按 `0` 展示 |

> 📐 **阅读时长**由 loader 自动按字数估算（中文 ~300 字/分钟），不需要在 frontmatter 写。

## 正文章节模板

### 公司调研（`companies/`）

```markdown
## 一、基本信息
- 成立时间：
- 总部 / 主要团队：
- 创始团队 / 核心人物：
- 融资历史：
- 主营业务 / 核心产品：

## 二、产品与技术
- 核心产品矩阵
- 技术路线 / 模型 / 架构亮点
- 与竞争对手的差异点

## 三、商业化
- 收入模型
- 关键客户 / 行业落地
- 公开披露的营收 / 用户规模

## 四、近期动作（按时间倒序）
- 2026-04-xx：……
- 2026-03-xx：……

## 五、值得关注的点
- 个人视角的观察、风险、机会

## 六、信息来源
- [官网](https://...)
- [关键报道 / 文章](https://...)
```

### 事项调研（`topics/`）

```markdown
## 一、是什么
- 概念定义、提出背景、当前共识

## 二、为什么重要
- 解决的问题、影响范围、与已有方案对比

## 三、关键玩家与生态
- 主要参与公司、开源项目、标准组织

## 四、技术 / 实施细节
- 核心机制 / 工作原理
- 关键能力边界
- 现状成熟度

## 五、争议与风险
- 反对意见、未解决的问题、潜在风险

## 六、个人结论
- 一句话定性
- 是否值得跟进 / 接入 / 学习
- 下一步行动

## 七、信息来源
- [官方 / 一手资料](https://...)
- [关键文章 / 论文](https://...)
```

> 模板是建议而非强约束，可按调研主题灵活增删章节。

---

## 一键生成（Claude Code）

仓库内已配置 slash command，可直接：

```
/research-company anthropic
/research-topic mcp-protocol
```

让 Claude Code 按本约定生成 frontmatter 完整、章节齐备的 MD 并落到正确目录。

## 上线流程

```bash
git add research/
git commit -m "research: add <slug>"
git push
```

Cloudflare Pages 自动重 build 后访问：

- 列表页：<https://2aran.com/articles>（顶部「公司调研 / 事项调研」Tab）
- 详情页：`https://2aran.com/articles/research/<category>/<slug>`
  - 例：`/articles/research/companies/anthropic`（slug 为去掉日期前缀后的部分）
