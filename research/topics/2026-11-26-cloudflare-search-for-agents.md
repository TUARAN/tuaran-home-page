---
title: Cloudflare 推出 Search for Agents：一键给网站加上面向智能体的搜索接口（全文转译 + 评论）
category: topics
date: 2026-11-26
time: 15:40
topic_type: tech
subjects: [web_cloud]
content_type: archive
tags: [Cloudflare, Search for Agents, AI Search, Markdown for Agents, 智能体, Agent, HTTP QUERY, RFC 10008, well-known, 站点搜索]
summary: Cloudflare 2026-11-25 发布 Search for Agents：在仪表盘打开一个开关，就为整个 zone 自动建立 AI Search 索引，并在自己的域名下暴露 /.well-known/search 搜索端点，通过 meta 标签和 Markdown front matter 告诉智能体去哪里搜。全文转译，保留原图和代码，文末附评论。
tldr: Markdown for Agents 让智能体读懂单个页面，Search for Agents 让智能体在站内找到该读哪个页面。端点只返回检索到的 Markdown 片段，不生成答案；支持 GET 和新的 HTTP QUERY 方法。发现机制是 Cloudflare 自定的 agent:* 约定，能否普及取决于智能体客户端是否跟进；站长开启前要先核对付费内容和不想被检索的页面。
assistance: claude-code
model: claude-opus-5-5
review_ready: false
ad_eligible: false
pv: 0
auto_images: false
---

原文为 Cloudflare 官方博客 [Introducing Search for Agents](https://blog.cloudflare.com/search-for-agents/)，作者 Celso Martinho、Gabriel Massadas、Nelson Duarte，发布于 2026-11-25。全文中译，图片与代码按原文顺序保留，代码不翻译；「译注」为补充说明，评论放在文末。

![Search for Agents 题图](/research/cloudflare-search-for-agents/01.webp)

## 一、Search for Agents 是什么

[AI Search](https://developers.cloudflare.com/ai-search/) 是 Cloudflare 的一项服务：它为你的内容建立索引，让你不必自建整套检索基础设施，就能给任何应用或智能体加上搜索。它早就支持把你的[网站](https://developers.cloudflare.com/ai-search/configuration/data-source/website/)作为数据源，自动爬取、转换并索引页面。

不过，要给网站配一个 AI Search 实例，过去仍需要先手动创建和配置，然后再做全部集成工作：让搜索端点能从你的域名访问，并确保智能体知道索引在哪、怎么用。

今天我们推出 Search for Agents，把这套配置收进 Cloudflare 仪表盘里的一个开关。为你的 zone 打开它，我们的服务就会创建 AI Search 实例、开始索引你的内容，并让搜索在你自己的域名下可被发现、可被调用。

> 译注：zone 是 Cloudflare 的计费与配置单位，通常对应一个根域名及其子域。

## 二、工作原理

这个思路顺着 [Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/) 自然延伸而来。Markdown for Agents 中，Cloudflare 网络会对已开启的 zone 借助内容协商请求头，把任意 HTML 页面实时转换成 Markdown。同样地，Search for Agents 借助 AI Search 的能力，自动为你的 zone 建立索引，并在你的域名下暴露 API，任何 AI 智能体都能发现并用它搜索你的网站。这一切都在网络层完成。

你可以通过 API 开启 Search for Agents，也可以在 zone 页面的仪表盘里，从「Quick Actions（快速操作）」中开启：

![在仪表盘的 Quick Actions 中开启 Search for Agents](/research/cloudflare-search-for-agents/02.webp)

*图：在仪表盘中开启 Search for Agents*

Search for Agents 面向所有客户开放，包括免费套餐（有[额度限制](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)）。开启后，Cloudflare 会自动创建一个 AI Search 实例，并开始爬取、索引 zone 中的内容。爬取过程的细节请参阅我们的[开发者文档](https://developers.cloudflare.com/ai-search/configuration/data-source/website/)。

你可以直接从这个页面进入实例，也可以在账户的 AI > AI Search 实例列表里找到它：

![Search for Agents 自动创建的 AI Search 实例详情页](/research/cloudflare-search-for-agents/03.webp)

*图：Search for Agents 对应的 AI Search 实例*

为 zone 创建的 AI Search 实例使用默认设置，但你随时可以开启重排序（reranking），或修改缓存等配置项。完整选项见[文档](https://developers.cloudflare.com/ai-search/configuration/)。

AI Search 完成内容索引后，你自己或互联网上任何智能体都可以开始使用 Search for Agents，前提是符合你域名的各项设置，例如机器人管理（Bot Management）、[AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/) 和 Web 应用防火墙（[WAF](https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/)）的配置。

### 可发现性

智能体如果不知道搜索的存在，搜索就没什么用。为了便于发现，Search for Agents 会在你网站的每个页面上自动声明搜索端点。

例如，对于 HTML 响应，我们会在页面的 `<head>` 中加入元数据：

```html
<meta name="agent:instructions" content="Use this search API to find relevant content across this site with keywords or natural-language queries, instead of crawling individual pages. Results are returned in Markdown.">
<meta name="agent:endpoint" content="https://developers.cloudflare.com/.well-known/search?q={query}">
<meta name="agent:method" content="GET">
<meta name="agent:documentation" content="https://developers.cloudflare.com/ai-search/how-to/search-for-agents/">
```

如果你还开启了 [Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)，那么带 `Accept: text/markdown` 请求页面的智能体，会在 YAML front matter 中收到同样的信息：

```yaml
---
agent:
  instructions: "Use this search API to find relevant content across this site with keywords or natural-language queries, instead of crawling individual pages. Results are returned in Markdown."
  endpoint: "https://developers.cloudflare.com/.well-known/search?q={query}"
  method: "GET"
  documentation: "https://developers.cloudflare.com/ai-search/how-to/search-for-agents/"
---
```

智能体很容易读懂这些说明，知道下一步该怎样搜索你的网站。

> 译注：`instructions` 的意思是「用这个搜索 API，以关键词或自然语言查询在全站查找相关内容，不要逐页爬取；结果以 Markdown 返回」。

### 搜索内容

智能体一旦知道你的网站有搜索端点，就可以开始调用：

```bash
$ curl "https://developers.cloudflare.com/.well-known/search?q=cloudflare+artifacts"
# Search results for: "cloudflare artifacts"

## docs/artifacts/api/workers-binding/index.md (score: 1.000)

# Workers binding · Artifacts · Cloudflare Artifacts docs

Call Artifacts from a Worker binding.

---

## docs/artifacts/index.md (score: 0.951)

# Artifacts · Cloudflare Artifacts docs

Store, version, and share filesystem artifacts across Workers, APIs, and Git-compatible tools.
...
```

取决于你的 AI Search 配置，智能体还可以用自然语言向搜索端点提问：

```bash
$ curl --get "https://developers.cloudflare.com/.well-known/search" --data-urlencode "q=What is the maximum push size for Cloudflare Artifacts?"
# Search results for: "What is the maximum push size for Cloudflare Artifacts?"

## docs/artifacts/platform/limits/index.limits-cloudflare-artifacts-docs.md (score: 1.000)

# Limits · Cloudflare Artifacts docs
Section: Limits · Cloudflare Artifacts docs

title: Limits
description: Review Artifacts platform limits.
pcx_content_type: reference
products:
  - artifacts

Limits that apply to creating, importing, cloning, and pushing Artifacts are detailed below.

These limits cover naming rules, storage, request rates for control-plane and Git operations, and the size of each push.

FeatureLimitControl-plane request rate2,000 requests per 10 seconds per Artifacts namespaceGit request rate, per artifact2,000 requests per 10 seconds per artifactMaximum storage per repository1 GB for repos created on or after 2026-09-29. Repos created earlier have a 10 GB limit. See size limit change.Maximum storage per account1 TB (can be raised on request)Maximum number of repositoriesUnlimitedMaximum number of namespacesUnlimitedNamespace name length2–63 charactersNamespace and repo namesStart with a letter or digit. Remaining characters may include letters, digits, ., _, and -.Maximum push size64 MiB per push. Includes all data sent in the push. Split larger work into several smaller pushes.Maximum objects per push50,000 objects, such as file versions, folders, and commits.Maximum file size32 MiB per file. Already-compressed files, like images, video, or zip archives, may be rejected slightly below 32 MiB.Maximum ref updates per push1 MiB of branch and tag updates per push.Maximum entries per folder100,000 files and subfolders in a single folder.
...
```

注意，这个搜索端点返回的是检索到的 Markdown 内容，不返回生成的答案。智能体本身已经有 AI 模型，也已经在和用户对话；它需要的只是你网站上的相关信息，用不着另一个 AI 模型替它作答。

### 支持新的 HTTP 方法：QUERY

新的 HTTP QUERY 方法是 IETF 建议标准（Proposed Standard），顺带一提，合著者之一是我们的同事 [James Snell](https://blog.cloudflare.com/author/jasnell/)，于 2026 年 6 月以 [RFC 10008](https://www.rfc-editor.org/rfc/rfc10008.html) 发布。QUERY 允许客户端在请求体中发送搜索条件，且是安全、幂等的，不会修改服务器状态。这让它很适合 AI 搜索。

QUERY 的落地正在推进：主流浏览器厂商正在[讨论](https://github.com/whatwg/fetch/issues/1938)这份 RFC，多个框架和客户端已经采用（例如 [curl](https://daniel.haxx.se/blog/2026/06/21/query-with-curl/) 和 [undici](https://github.com/nodejs/undici/releases/tag/v8.6.0)），或正在[讨论](https://github.com/zalando/skipper/issues/4113)是否采用。

Search for Agents 原生支持 QUERY，请求体可以是纯文本，也可以是 JSON：

```bash
# Plain text
curl -X QUERY 'https://developers.cloudflare.com/.well-known/search' \
  --data 'What is the maximum payload size per ingestion request in Basin Pipelines?'

# JSON
curl -X QUERY 'https://developers.cloudflare.com/.well-known/search' \
  --header 'Content-Type: application/json' \
  --data '{"q":"How many bulk import requests per minute does Email Service allow?"}'
```

> 译注：undici 是 Node.js 内置 `fetch` 背后的 HTTP 客户端。

### 实际效果

来看看它在一次智能体会话里的表现。我们的[开发者文档](https://developers.cloudflare.com/)已经开启了 Search for Agents。我们打开一个 OpenCode 会话，提问「Cloudflare Artifacts 的单次推送上限是多少？」，从日志里能看到：智能体先在首页发现了搜索端点，然后带着问题请求 /.well-known/search 获取搜索结果。

![OpenCode 日志：智能体请求 /.well-known/search](/research/cloudflare-search-for-agents/04.webp)

*图：一次 Search for Agents 请求*

几秒后答案返回，而且是正确的。

![OpenCode 借助 Search for Agents 得到答案](/research/cloudflare-search-for-agents/05.webp)

*图：OpenCode 通过 Search for Agents 拿到答案*

智能体发现搜索 API 后，同一会话里每当需要在同一个网站查内容，大概率会反复调用它。

我们在这次发布之前，就已经为开发者文档开启了 Search for Agents。我们观察到，智能体在执行任务时能很好地发现并使用这个搜索 API。

![开发者文档中 Search for Agents 请求的样本](/research/cloudflare-search-for-agents/06.webp)

*图：开发者文档中 Search for Agents 请求的样本*

### 它仍然是一个 AI Search 实例

Search for Agents 由你账户里的一个 AI Search 实例驱动，所以你同样能用上全部标准配置项和功能。例如，你可以开启公开的 [REST API](https://developers.cloudflare.com/ai-search/api/search/public-endpoint/) 或 [MCP](https://developers.cloudflare.com/ai-search/api/search/mcp/) 端点，在 [Workers](https://developers.cloudflare.com/ai-search/api/search/workers-binding/) 中调用它，甚至把 AI Search [嵌入](https://search.ai.cloudflare.com/)网站，给人类访客使用。

![嵌入 Cloudflare 博客的 AI Search 搜索组件](/research/cloudflare-search-for-agents/07.webp)

*图：嵌入 Cloudflare 博客的 AI Search Snippet*

### 开始使用 Search for Agents

从今天起，Search for Agents 向所有客户开放。用量按 [AI Search 定价](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)计费，包括内容摄取、索引内容存储和查询服务，并适用账户在 Workers 免费版和付费版下各自包含的用量与限制。

我们也建议你看看 [Agent Readiness](https://isitagentready.com/) 页面（参见[发布公告](https://blog.cloudflare.com/agent-readiness/)），了解如何让网站更适配智能体：从引导智能体完成身份认证，到控制智能体能看到哪些内容、以什么格式接收内容，以及如何为内容付费。

![Agent Readiness 对 Search for Agents 的检测结果](/research/cloudflare-search-for-agents/08.webp)

*图：Agent Readiness 对 Search for Agents 的检测*

更多信息请查看 Search for Agents 的[开发者文档](https://developers.cloudflare.com/ai-search/how-to/search-for-agents/)。欢迎[在 X 上关注我们](https://x.com/CloudflareDev)，或到 [Cloudflare 开发者 Discord](https://discord.cloudflare.com) 和我们交流。我们很想听听那些让内容可被智能体搜索的站长的反馈。

---

## 三、评论

### 它补的是「找」这一步

Markdown for Agents 解决的是「读」：智能体拿到一个 URL 后，少吃 HTML 噪音、少花 token。它没解决「该读哪个 URL」。智能体以前的做法是先用通用搜索引擎找入口，或者顺着站内链接一页页抓，抓得多、命中低，站长那边还要承担这些爬取流量。Search for Agents 把站内检索交给站点自己提供，智能体一次请求拿到排好序的片段。原文 OpenCode 的例子就是这条路径：首页读到 meta，下一步直接查 `/.well-known/search`，没有再翻文档目录。

对文档站、知识库、长文博客这类「内容多、单页答案明确」的站点，这一步省下的轮次最多。

### 发现机制是 Cloudflare 自己的约定

`agent:instructions`、`agent:endpoint` 这组 meta 名和 front matter 里的 `agent:` 字段，原文没有说明出自哪个标准，读下来是 Cloudflare 定义的写法。它能不能起作用，取决于两件事：

1. 智能体得先抓到这个站的某个页面，并且读 `<head>` 或 Markdown front matter。只靠通用搜索 API 拿摘要、从不直接访问页面的智能体，看不到这条声明。
2. 智能体或它的工具层要认这套字段。原文的演示用的是 OpenCode，靠模型自己读懂 `instructions` 那句英文。这种方式的好处是不需要客户端改代码，代价是每次能不能用上要看模型当下的判断。

和 `llms.txt` 对照看会更清楚。`llms.txt` 是站长手写或生成的一份静态目录，告诉模型「站里有什么」；Search for Agents 是按查询返回结果的接口，回答「这个问题对应哪几段」。两者可以并存。2aran.com 现在已经有 `/llms.txt` 路由，列出公开文章的标题、链接和摘要；如果再开搜索端点，目录和查询就都齐了。

### 只返回片段，不生成答案

这是整个设计里我最认同的一点。端点返回原文片段加分数，由调用方的模型自己组织回答。好处有三：站点不用为每次查询付一次生成费用；内容口径留在站长手里，不会被另一个模型改写后再被引用；调用方能看到出处路径，回答可以附链接。

代价也直接写在原文示例里。第二个 curl 返回的 Limits 页面，原本是一张表格，进了检索结果后表头和单元格挤成了一整行（`FeatureLimitControl-plane request rate2,000 requests…`），分隔符全丢了。模型大概还能读懂，但「64 MiB per push」这种数字紧挨着前后文本，误读的可能性比表格高。表格密集的页面，开启后值得自己查几条，看看切块效果。

### QUERY 方法：方向对，但先别依赖

GET 把查询塞进 URL，长问题会撞上 URL 长度限制，还会原样留在访问日志、代理日志和浏览器历史里。QUERY 把查询放进请求体，同时保留了 GET 的安全、幂等语义，可以被缓存。用来承载自然语言问题，这个语义正合适。

现实问题在中间层。很多 WAF 规则、反向代理、负载均衡器和企业出口网关只放行常见方法，遇到不认识的方法会直接拒绝。原文列出的客户端支持也还在早期：curl 和 undici 已经跟进，浏览器 Fetch 规范仍在讨论。智能体侧在相当长时间里还会以 GET 为主，QUERY 作为长查询的补充。

### 站长开启前要核对的三件事

1. **哪些内容会进索引。** 爬虫会把 zone 下能爬到的页面都摄取进去。站点如果有付费阅读、会员内容或只想给人看的页面，先确认这些内容在服务端渲染时有没有输出到 HTML 里；只靠前端遮挡的正文，爬虫照样能读到。本站文章带燃币付费墙，开启前要先查这一点。
2. **访问策略会同时约束搜索端点。** 原文说明搜索受 Bot Management、AI Crawl Control 和 WAF 配置约束。之前为了挡 AI 爬虫加过规则的站点，开启后可能发现智能体搜不了；反过来，为了让搜索可用而放宽规则，也会同时放宽对页面本身的抓取。两边要一起看。
3. **费用按 AI Search 计。** 摄取、存储和查询都计量，免费版有额度。内容量大、更新频繁的站点，开启后先观察一两周用量再决定是否保留。

### 我的判断

Cloudflare 这一年在「站点如何面向智能体」上连续出了几块：Markdown for Agents 管格式，AI Crawl Control 管谁能抓、要不要付费，Agent Readiness 做检测，Search for Agents 管检索。单看每一块都不复杂，合起来是一套由 CDN 在网络层替站长完成的「智能体接入层」。站长要做的只剩打开开关和设规则，这对没有工程资源的中小站点吸引力最大。

真正决定它能走多远的，是 `agent:*` 这套声明会不会被 Cloudflare 以外的智能体客户端和其他 CDN 接受。如果只有部分模型偶尔读懂，它就是一个好用的 Cloudflare 功能；如果主流编码智能体和浏览器智能体都按它去找搜索入口，它会成为一种事实上的站点约定。

**持续验证**

- 主流智能体客户端（Claude Code、Codex、Cursor 等）是否在工具层显式识别 `agent:endpoint`，还是继续依赖模型临场读懂。
- `/.well-known/search` 这个路径和 `agent:*` 字段是否会提交给 IETF 或 W3C 形成规范。

资料截至 2026-11-26，正文以 Cloudflare 博客原文为准；图片版权归 Cloudflare 所有，转载仅用于翻译与评论。
