# 文章与分析（写作约定）

本目录是 TUARAN 长文内容的存储源头。文章以 Markdown 文件落到这里，
随主站仓库一起 `git push`，Cloudflare Pages 自动重新构建后即在 `2aran.com/articles` 上线。

> 作者统一为 **TUARAN**。选题、判断、取舍、编排和最终发布责任都由作者承担。
> Claude Code / Codex / 豆包 / Gemini 等只作为内部协助工具记录，默认不在前台逐篇展示。

---

## 目录结构

```
research/                     # 保留旧目录名，避免破坏链接和构建脚本
├── companies/                # 公司观察
│   └── 2026-05-15-anthropic.md
├── topics/                   # 专题（技术、产品、行业、观点……）
│   └── 2026-05-15-mcp-protocol.md
├── people/                   # 人物观察
│   └── 2026-06-05-dangnian-mingyue.md
└── README.md                 # 本文件
```

- `companies/` 用于公司观察（创业公司、大厂、被投企业等）
- `topics/` 用于专题文章（一项技术、一个标准、一个赛道、一个观点……）
- `people/` 用于人物观察（创作者、企业家、学者、公共人物等）

## 文件命名

```
YYYY-MM-DD-<slug>.md
```

- 日期使用文章创建当日（北京时间），方便按时间排序
- `<slug>` 全小写英文/数字/连字符；公司名建议用域名主干（`anthropic`、`openai`、`bytedance`）

## Frontmatter（必填）

每篇 MD **必须**以 YAML frontmatter 开头：

```yaml
---
title: Anthropic 公司观察
category: companies          # companies | topics | people
date: 2026-05-15
time: 14:30              # 可选，北京时间 HH:MM；新调研建议填写，列表按日期+时间排序
tags: [AI, 大模型, 公司]
summary: 一句话概述本篇调研要回答的问题与结论。
tldr: 不写则回退用 summary；想突出与 summary 不同的一句话总结时填这里。
topic_type: market           # 仅 topics 用：industry | tech | product | market | thesis
content_type: analysis       # opinion | analysis | practice | guide | fact_check | profile | archive | research
assistance: claude-code      # 协助工具：claude-code | cursor | codex | doubao | gemini | gpt | manual
model: claude-opus-4-7       # 底层模型 ID（可选，仅作内部记录）
show_assistance: false       # 默认不展示；多版本对照或确有披露必要时才开启
ad_eligible: false           # 人工完成广告政策审查后才能改为 true
pv: 0                        # 阅读量（可选，列表页与详情页展示）
---
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | 列表页与详情页标题 |
| `category` | ✅ | `companies` 或 `topics`，必须与所在子目录一致 |
| `date` | ✅ | `YYYY-MM-DD` |
| `time` | ⭕ | `HH:MM` 或 `HH:MM:SS`（北京时间）；新文章建议填写。有则列表与 RSS 按日期+时间排序；旧文章无此字段仍只显示日期 |
| `tags` | ⭕ | 字符串数组，用于检索与归档 |
| `summary` | ⭕ | 一句话摘要，列表页展示 |
| `tldr` | ⭕ | 详情页顶部 TL;DR 框使用；不写则回退 `summary` 或正文首段 |
| `topic_type` | ⭕ | 仅 `topics` 用，二级类型：`industry` 行业 / `tech` 技术 / `product` 产品 / `market` 市场 / `thesis` 观点 |
| `content_type` | ⭕ | 面向读者的内容形态；不写时会根据分类推断。观点类优先用 `opinion`，实操复盘用 `practice` |
| `assistance` | ⭕ | 协助工具的内部记录。旧文章的 `source` 字段仍兼容读取；工具不是作者，也不决定公开内容类型 |
| `model` | ⭕ | 底层模型 ID，仅作内部追溯，不作为作者或文章来源 |
| `show_assistance` | ⭕ | 是否在前台展示协助信息，默认 `false`；多版本对照等确有必要的页面可设为 `true` |
| `ad_eligible` | ⭕ | 是否进入人工广告白名单，默认 `false`；健康、金融、政治、儿童和互动内容完成政策审查前不得开启 |
| `pv` | ⭕ | 阅读量，填非负整数；不填时按 `0` 展示 |

> 📐 **阅读时长**由 loader 自动按字数估算（中文 ~300 字/分钟），不需要在 frontmatter 写。

## 写作风格与审计（必读）

正文的唯一写作正本是 [`lib/researchStyleTemplates.js`](../lib/researchStyleTemplates.js)，在后台的 `/admin/research-style` 可查看。不要从本 README 或旧文章复述风格规则。

写作顺序固定为：**选风格 → 先列事实与来源 → 写结构分析 / 外部研判 → 跑措辞审计 → 人工复核。**

- 未指定时使用「默认分析风格」；人味、周刊解释、投研备忘、资料档案等风格按主题选用。
- 事实与研判必须分开；没有公开证据的内容写入「未能验证」，不要补成结论。
- 每个关键数字、日期、版本、价格都有来源，或明确标为估算。
- 所有文章共同遵守通用禁语。`npm run research:style-audit` 会扫描候选句；它是提示器，不会替代人判断「不是 X，而是 Y」等必要对比。

### 默认调研骨架

```markdown
## 写在前面
100 字以内：资料口径与观察立场。

## 一、先给结论
一句话结论 + 3–5 个具体要点。

## 二、事实层
公开资料、时间线、基本信息。

## 三、结构分析
商业模式、技术链路、组织约束、利益相关方。

## 四、外部研判
明确这是观察，不要写成已被证实的事实。

## 五、未能验证
缺失事实，以及可能的查证路径。

## 六、信息来源
一手资料、行业资料、站内交叉链接。
```

> 骨架可随风格和题材调整；资料档案、投研备忘等请以风格库对应配置为准。

---

## 一键生成（内部命令）

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

- 列表页：<https://2aran.com/articles>（「文章与分析」入口）
- 详情页：`https://2aran.com/articles/research/<category>/<slug>`
  - 例：`/articles/research/companies/anthropic`（slug 为去掉日期前缀后的部分）
