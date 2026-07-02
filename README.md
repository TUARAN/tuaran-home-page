# 涂阿燃的网络日志 · 2aran.com

这是 [2aran.com](https://2aran.com) 的源码仓库。

**这个仓库开源不是为了让你部署一份**——它是个人网站，大量功能绑定作者自己的 Cloudflare、OAuth 与数据配置。开源是为了让你看到：一个前端 + AI Agent 工程师（同时是奶爸、是 founder），怎么把写作、调研、资源、工具和站内社区放进同一个 Web 应用，按"值得投入 20 年、每日复利"的方式持续迭代。

一句话概括它在干嘛：**用 AI 把内容、作品和增长连起来的个人操作台，正在往「内容 + 资源 + 工具的分享与讨论平台」演进。**

## 五个板块

站点主导航就是站点的世界观，收敛为五个频道：

| 板块 | 里面有什么 |
|---|---|
| **内容** | 原创专栏、灵感流、网络日志、[Dad Stack](https://2aran.com/dad-stack)，以及公司 / 事项 / 人物三类 AI 协助深度调研 |
| **资源** | [资源库](https://2aran.com/articles?tab=resources)：AI 与开发、人文与政经、外部收藏、职场资料、壁纸等原文与索引 |
| **工具** | [工具库](https://2aran.com/tools)：可直接使用的站内工具、浏览器扩展、可视化富页面与长期系统 |
| **圈子** | [讨论中心](https://2aran.com/community)：聚合全站评论与热门讨论串，加上留言板、燃币与合作入口 |
| **关于** | [关于本站](https://2aran.com/site)、[站点索引](https://2aran.com/map)、[更新记录](https://2aran.com/changelog)、公开的[访问数据](https://2aran.com/traffic) |

## 设计上值得一看的几件事

如果你是来读代码或找灵感的，这些是本仓库比较有意思的设计决策：

- **统一内容管线**：文章、调研、资源主题页归一成同一个 entry 形状（`lib/contentPipeline.js`），一个 contentKey 同时是评论的 key、燃币解锁的 key、相关阅读的检索键和阅读统计的键。挂一个组件，页面就进入整套互动体系。
- **内容 metadata 进 D1**：`content_index` 表 + 后台一键同步，手工登记的内容条目不经构建部署直接出现在索引页——个人站也可以做到"发布不依赖 CI"。
- **三层运行时并存**：静态 / ISR 页面（SEO 与速度）、Cloudflare Edge API（登录、评论、燃币，D1 存储）、浏览器端 WebGPU 推理（[/web-llm](https://2aran.com/web-llm)，模型跑在访客设备上，服务端零推理成本）。
- **自定义 Edge 鉴权**：不用 NextAuth，GitHub / Google OAuth + HMAC 签名 Cookie 的轻量 session（`lib/edgeSession.js`），专为 Cloudflare Edge 运行时设计；游客评论走独立的 cookie 绑定，登录后自动合并历史。
- **调研工作流**：调研以 Markdown 落盘（`research/`），frontmatter 约定风格、标签与 AI 协助标注；写作风格有唯一正本（`lib/researchStyleTemplates.js`）并在后台可视化。AI 是协助工具，署名永远是人。
- **燃币（Ranbi）**：站内积分体系，签到、评论获取，解锁深度调研与资料消耗——内容平台激励闭环的最小实现。
- **网站不调用任何大模型**：所有 AI 参与发生在写作与工程环节，线上站点本身零 LLM API 依赖（浏览器端推理除外，那跑在你自己的设备上）。

## 值得一读

调研与长文里比较有代表性的（全部免费）：

- [苏轼人物调研：被贬到尽头，仍然把生活过成宇宙](https://2aran.com/articles/research/people/su-shi)
- [埃隆·马斯克：把公司当火箭发射的人](https://2aran.com/people/elon-musk)（一页式交互体验页）
- [张一鸣早期博客调研：怎样看《字节跳动方法论》](https://2aran.com/articles/research/people/zhang-yiming-early-blog-bytedance-methodology)
- [人工智能先驱：六个把神经网络从冷宫带回王座的人](https://2aran.com/people/ai-pioneers)
- [AI API 中转站灰色经济调研：暴利、注水与跑路链条](https://2aran.com/articles/research/topics/ai-api-relay-station-grey-economy)
- [从 chat 任务到 agent loop：Anthropic 一线工程实践](https://2aran.com/articles/research/topics/chat-to-agent-loop-anthropic-practice)
- [15 分钟了解大模型：从 Token、矩阵运算到 RAG 与 Agent](https://2aran.com/articles/research/topics/15-minutes-understand-large-language-models)
- [从身体的一块淤青发现白血病：白血病深度调研](https://2aran.com/articles/research/topics/bruise-to-leukemia-deep-research)
- [先有渠道，再有产品：我把一人公司的顺序搞反过一次](https://2aran.com/articles/research/topics/channel-before-product-solo-founder)
- [中国 2000 元以下洗碗机市场调研](https://2aran.com/articles/research/topics/china-dishwasher-under-2k)（是的，什么都调研）

完整清单见[调研索引](https://2aran.com/articles?tab=research)，目前 110+ 篇。

## 资源精选

- [置身 X 内](https://2aran.com/resources/shen-zhi-ding-nei) — 大厂职场文本存档合集（钉内 / 钉外 / 团内 / 米内）
- [单篇封神的中国古典名篇](https://2aran.com/classical-masterpieces) — 凭一篇立住文学史地位的作品谱系
- [儒释道 · 神仙体系](https://2aran.com/ru-shi-dao) — 三教人物 / 神祇体系一张结构图
- [明清与三国历史笔记](https://2aran.com/history/ming-qing)
- [中国政治体制](https://2aran.com/china-politics) — 当代中国研究资料
- [大模型教程](https://2aran.com/bookmarks/llm-tutorials) / [AI 工具索引](https://2aran.com/bookmarks/ai-tools) / [开发资源索引](https://2aran.com/bookmarks/dev-resources)
- [Codex 学习资源收集](https://2aran.com/resources/codex-learning-resource-map-yichen)
- [RSS 订阅墙](https://2aran.com/resources/rss) — 我长期在读的博客与周刊

## 工具精选

- [X 互关清理助手](https://2aran.com/resources/x-mutual-cleaner-extension) — 一键取消没有回关你的人（浏览器扩展）
- [端侧大模型实验台](https://2aran.com/web-llm) — WebGPU 在浏览器里跑大模型，不上传任何数据
- [Skill 中心](https://2aran.com/skill-center) — 模型与智能体能力货架
- [Agent 世界杯](https://2aran.com/agent-world-cup) — 2026 世界杯赛程 / 分组 / 资讯，自动采集
- [站内转短](https://2aran.com/works#site-tools) — 短链与分享系统
- [吃什么](https://2aran.com/eatwhat) — 今天点什么的小工具
- [壁纸下载](https://2aran.com/resources/wallpapers)
- 对外产品：[博主联盟](https://blogger-alliance.cn/)、[前端周看](https://frontendnext.com/)、[AI 分发大师](https://syncblog.cn/)

## 未来会怎样

方向已经定了：从"个人作品集"走向**策展人式的分享与讨论平台**——内容和资源由站长供给（这是已验证的强项），社区做轻互动，跑通留存再谈共建。大致顺序：

1. **留存优先**：邮件订阅（newsletter）、回访 / 评论转化等运营指标，把外部平台 400 万+ 阅读的流量真正留下来
2. **内容层继续归一**：巨型话题页拆成数据 + 模板，全部内容进统一管线（工作底稿见 `ai-context/content-layer-refactor-plan.md`）
3. **燃币权益做实**：深度调研分级解锁，配套反作弊与审核
4. **再开放**：读者投稿资源 / 工具（走审核队列）、RSS 互推、社区周报

第一人称的判断与写作永远是地基；AI 协助调研会沉为资料层，不再是主打。

## 技术栈

- **框架**：Next.js 15 App Router + React 19（JavaScript，无 TypeScript）
- **样式**：Tailwind CSS 3（页面宽度三档约定 + 浅色 / 深色 / 墨水屏三套阅读主题）
- **平台**：Cloudflare Pages / Functions（`@cloudflare/next-on-pages`）+ D1 + R2
- **认证**：自定义 Edge session（GitHub / Google OAuth + 签名 Cookie），邮箱验证码与密码登录
- **自动化**：GitHub Actions 定时采集（舆情 / 世界杯）、Wrangler 迁移

> 历史遗留：仓库中仍保留已废弃的 NextAuth 相关文件（`[...nextauth]` 路由返回 410）与本地版 `lib/stompDb.js`，线上均不使用。

## 反馈方式

优先通过 [Issues](https://github.com/TUARAN/tuaran-home-page/issues) 收集反馈：

- 页面打不开、移动端错位、样式异常、链接失效
- 文章或调研内容里的事实错误、错别字、表达不清
- 可访问性、性能、SEO 改进建议
- 新页面、新工具、新栏目想法

请不要在 Issue 里提交 API key、token、密码、私人联系方式或其他敏感信息。

## 开发者说明

代码可以本地跑起来看（`npm install && npm run dev`），但登录、评论、燃币、采集、加密内容等功能依赖作者自己的 Cloudflare / OAuth / 邮件配置，外部开发者浏览代码通常不需要复刻。这不是通用 starter，Pull Request 会按站点定位与维护成本决定是否接受。

## 许可证

本仓库采用双许可证：

- **代码**：MIT License。适用于站点源码、组件、脚本、API 路由、配置和其他可执行代码。
- **非代码内容**：除非另有说明，本站原创文字、调研笔记、资源整理、图片说明和其他非代码材料采用 [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/)（CC BY-NC-SA 4.0）。

也就是说，代码可以按 MIT 协议学习、复用和改造；原创内容可以在署名、非商业、相同方式共享的前提下转载和改编。第三方链接、引用材料、商标、平台截图和外部资源仍归其原权利人所有。

## 作者

涂阿燃 / 掘金安东尼

- 网站：[2aran.com](https://2aran.com)
- 掘金：[掘金主页](https://juejin.cn/user/3544481219674541)
