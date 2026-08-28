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
├── templates/                # 自动化写作模板，不参与文章加载
│   └── a-share-company-research.md
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
subjects: [business_market]  # 可选，显式主题；首项是卡片主分类，值见 lib/contentTaxonomy.js
content_type: analysis       # opinion | analysis | engineering_case | build_log | practice | guide | fact_check | profile | archive | research
assistance: claude-code      # 协助工具：claude-code | cursor | codex | workbuddy | doubao | gemini | gpt | manual
model: claude-opus-4-7       # 底层模型 ID（可选，仅作内部记录）
show_assistance: false       # 默认不展示；多版本对照或确有披露必要时才开启
review_ready: false          # 人工完成原创性、证据、来源与风险复核后才能改为 true
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
| `subjects` | ⭕ | 面向读者的显式主题，填写 1–3 个稳定 ID，首项作为卡片主分类；省略时才按旧字段兼容推断，受控值以 `lib/contentTaxonomy.js` 为准 |
| `content_type` | ⭕ | 面向读者的内容形态；不写时会根据分类推断。真实项目落地用 `engineering_case`，本站建设与运营复盘用 `build_log`，避免与公司、人物和公共议题共用同一种研究包装 |
| `assistance` | ⭕ | 协助工具的内部记录。旧文章的 `source` 字段仍兼容读取；工具不是作者，也不决定公开内容类型 |
| `model` | ⭕ | 底层模型 ID，仅作内部追溯，不作为作者或文章来源 |
| `show_assistance` | ⭕ | 是否在前台展示协助信息，默认 `false`；多版本对照等确有必要的页面可设为 `true` |
| `review_ready` | ⭕ | 是否进入 AdSense 复审重点与验证脚本范围，默认 `false`。只有具备明确作者增量、可核验证据、来源与人工复核记录的内容才能开启；不影响 sitemap、RSS、llms、搜索索引或站内推荐 |
| `ad_eligible` | ⭕ | 是否进入人工广告白名单，默认 `false`；健康、金融、政治、儿童和互动内容完成政策审查前不得开启 |
| `pv` | ⭕ | 阅读量，填非负整数；不填时按 `0` 展示 |

> 📐 **阅读时长**由 loader 自动按字数估算（中文 ~300 字/分钟），不需要在 frontmatter 写。

### 同题多版本

同一篇文章可用独占一行的 `<!-- variant:workbuddy -->` 分隔不同协助工具版本。
分隔符前的正文默认使用 `assistance` 指定的工具；后续版本 ID 对应
`lib/research/loader.js` 的 `VARIANT_LABELS`。设置 `show_assistance: true`，
详情页会显示版本切换，目录与正文同步更新；`?v=workbuddy` 可直达对应版本。
各版本独立保留来源与证据边界，作者仍统一为 TUARAN。

## 写作风格与审计（必读）

正文的唯一写作正本是 [`lib/researchStyleTemplates.js`](../lib/researchStyleTemplates.js)，在后台的 `/admin/research-style` 可查看。不要从本 README 或旧文章复述风格规则。

写作顺序固定为：**选风格 → 先列事实与来源 → 写结构分析 / 外部研判 → 跑措辞审计 → 人工复核。**

`review_ready: true` 不是“文章已经发布”的同义词。开启前必须同时满足：

1. 作者增量明确：包含亲历、代码、数据、截图、实测、独立模型或可辨认的专业判断；
2. 关键事实有一手来源，估算、推断和未能验证的内容已明确标注；
3. 标题、摘要和正文兑现同一个问题，没有批量模板痕迹或无关扩写；
4. 已完成人工事实复核、风险复核和页面阅读体验检查；
5. 健康、金融、法律、政治、儿童、转载档案和纯互动页面默认不得进入复审白名单。

`review_ready` 只控制 AdSense 复审重点与验证脚本范围，不控制 SEO 发现或索引；`ad_eligible` 继续控制审核通过后的实际广告投放。两者不得合并。

- 未指定时使用「默认分析风格」；人味、周刊解释、投研备忘、资料档案等风格按主题选用。
- 事实与研判必须分开；没有公开证据的内容写入「未能验证」，不要补成结论。
- 每个关键数字、日期、版本、价格都有来源，或明确标为估算。
- 所有文章共同遵守通用禁语。`不是 X，而是 Y` 是内容创作铁律中的强制禁用句式，直接陈述结论或拆成两句事实。`npm run research:style-audit` 会扫描其它候选表达，最终仍需人工复核。

### 默认调研骨架

```markdown
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

## 六、信息来源与说明
- 主要资料来源
- 哪些数据没有公开
- 哪些结论属于推断
- 资料截至日期
```

普通文章直接从核心结论、文章原文、具体问题 / 事实或作者亲历场景开始。不要在顶部放“写在前面：资料口径与观察立场”或“信息来源说明”。

医疗、法律、投资等必要风险提示，可能影响读者安全的说明，重大更正，以及会直接影响真实性的 OCR 错误或原文残缺提示继续放在顶部。骨架可随风格和题材调整；资料档案、投研备忘等请以风格库对应配置为准。

---

## 一键生成（内部命令）

仓库内已配置 slash command，可直接：

```
/research-company anthropic
/research-topic mcp-protocol
```

让 Claude Code 按本约定生成 frontmatter 完整、章节齐备的 MD 并落到正确目录。

### A 股公司观察流水线

```bash
npm run a-share:sync
npm run a-share:pick
npm run a-share:status
```

- `a-share:sync` 更新公司池并重建 A 股上市公司名单文章。
- `a-share:pick` 返回下一家待调研公司；未完成的选题会优先重试。
- 完成文章后运行
  `npm run a-share:complete -- --code <证券代码> --file <文章路径>`。
- 通用模板位于 `research/templates/a-share-company-research.md`，模板版本随结构升级递增。
- 自动生成稿必须保持 `review_ready: false`，且不会自动提交或发布。

### 加密资产观察流水线

- 线上任务每天北京时间 01:30 刷新 CoinGecko 市值前 250 名，并选择尚未完成的最高市值币种。
- 专用模板位于 `research/templates/crypto-asset-research.md`，覆盖背景、发展、技术、用途、代币经济、市场、治理、安全、监管与风险。
- 草稿进入 `/admin/crypto-research` 复核；保持 `review_ready: false` 与 `ad_eligible: false`，不提供投资建议。

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
