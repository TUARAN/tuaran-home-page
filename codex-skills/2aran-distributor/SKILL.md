---
name: 2aran-distributor
description: >
  阿燃分发智能体（2aran-distributor）。用 ego lite 把 2aran.com 或自备 Markdown 发到掘金、CSDN、X、小红书、知乎、今日头条等外部平台。
  Use when: 用户粘贴「2aran 分发任务」或「自备账号」分发任务，或要求把文章同步到自己的内容平台账号。
metadata:
  version: "1.4.1"
---

# 2aran-distributor

由 2aran.com 的 `lib/distribution/` 生成，不要直接修改本文件。公开下载见站内「阿燃分发智能体」；站长在仓库运行 `npm run distributor:skill:install` 同步到本机。

## 开工前

- 任务里写明了 harness 版本。本 skill 的版本是 `1.4.1`；两者不一致时先停下，从站内重新下载 SKILL.md 或请站长更新 skill。
- 任务列出的平台在下方没有手册时，先问任务创建者：跳过，还是边探索边发布。探索发布时同样遵守全部安全规则，并在回报里给出这个平台的手册草稿（入口、登录判断、步骤、核对、成功标志）。
- 按任务里的平台顺序逐个处理：一个平台发布并核对完，再开始下一个。

## 站长任务台 · 浏览器与账号

- 先运行 `ego-browser skill`，按输出的使用指南操作。
- 只用 ego lite 的「Aran」账号：创建任务空间时传 `{ profileId: "Profile 1" }`。不要用其他 profile，也不要改用别的浏览器。
- 每个平台先确认已登录；未登录就把任务空间交给站长登录（handOff），站长回复后再继续。
- 全部平台处理完后关闭任务空间（`finish({ keep: [] })`）。

## 安全规则

- 涉及权利声明的勾选项（翻译授权、原创声明、转载许可），先停下来问站长，不能自行勾选。
- 编辑器里已有标题或正文时不要覆盖，先问站长是继续编辑还是新建。
- 同一平台发布失败后，先到平台的草稿箱和文章列表确认有没有留下内容，再决定是否重试，避免重复发布。
- 只处理任务里列出的平台。

## 内容处理

- 正文使用任务里的 Markdown 原文，保留图片、代码块、引用和标题层级；开头的作者署名行保留。
- 平台编辑页有独立「标题」输入框时：标题只填该输入框，正文不得再保留与标题相同的首条 `#` 标题（建任务时已去掉；若仍出现，发布前先删掉）。
- 正文里指代站点的「本站」改成「我的个人站」，其他内容不改写。
- 掘金：站内图床（2aran.com）与预览「转存失败」/裂图必须走「下载 → 编辑器上传 → 替换 Markdown 链接」；含 `<figure>`/`<svg>` 的 HTML 需截图或导出 PNG 后上传替换，不能只粘贴原始 HTML。详见掘金手册「图床替换」。
- 富文本编辑器（X、小红书、知乎、今日头条）不认 Markdown：打开任务 `url` 的站内原文，用 evaluate 取 `article.prose-tuaran`（或 `main article`）的 HTML，删掉目录、导航、按钮和与标题重复的 h1，把图片和链接改成绝对地址，再用 `page.keyboard.paste({ text, html })` 粘贴进正文；各平台还要做的转换见手册。
- 标题超过平台字数上限时，取原标题冒号前的部分；仍超出就从原标题里删减，不新编措辞，并记进回报。
- 文章类型：正文开头注明转译或转载外部原文时，按「翻译」或「转载」发布并填写那个原文链接；否则选「原创」。
- 摘要按平台字数限制从任务里的摘要压缩，不编造正文没有的信息。
- 标签从任务里的站内标签就近匹配平台可选标签。

## 核对

- 每个平台发布前在预览里核对：标题、图片全部加载、代码块数量、章节标题。
- 发布后按手册的「核对」和「成功标志」确认结果，不以点过按钮为准。
- 任务台回报前必须完成该平台手册「核对」；未完成不得 POST `action:result` 为 `published` / `reviewing`。
- 掘金：编辑器 `.../editor/drafts/<sid>` 与成稿 `article_id` 不同；`articleUrl` 只能是 `https://juejin.cn/post/<article_id>`。发布弹窗仍开着或草稿编辑器仍可访问，不能单独作为失败依据，须用 `creator/home` 或 `query_list` 按任务 title 取成稿链接并打开 `/post/<id>` 核对标题。

## 平台手册

手册里的选择器和代码片段优先使用；失效时自己看页面处理，并记进回报的「手册偏差」。

### 掘金（`juejin`，2026-11-28 实测）

- 入口：https://juejin.cn/editor/drafts/new?v=2
- 登录判断：页面弹出登录框，或右上角出现「登录」按钮，就是未登录。
- 步骤：
  1. 编辑器是 bytemd（CodeMirror）。标题只填顶部标题输入框；正文用下方片段一次性写入（不要逐字输入），且不得含与标题相同的首条 `#` 标题。
  2. 写入后切预览核对：标题不重复；统计 `![](…)` 数量，预览里每张图须能加载。
  3. 图床替换（本站图或预览「转存失败」/裂图必做）：`await page.fetch(图片绝对URL, { saveAs: "/绝对路径/文件名.ext" })` 下载；点工具栏「图片」上传该文件；用返回的掘金 CDN 地址，在 CodeMirror 中把对应 `![](旧URL)` 整段替换为 `![](新URL)`，逐张处理直至预览无裂图。
  4. HTML/SVG 示意图：掘金不渲染 `<figure>`/`<svg>`。打开任务 `url` 站内原文，对示意图 `page.screenshot({ ... })` 存为 PNG 后按上一步上传，正文改为 `![图注](掘金URL)`；无法截图时删除原始标签，只保留图注文字。
  5. 点「发布」打开弹窗：分类按内容选（技术文章一般选「人工智能」或「前端」）；标签要先聚焦 `.publish-popup input.byte-select__input` 再输入，然后点击匹配的 `.byte-select-option`，最多 3 个；封面选正文第一张可用图；摘要 50–100 字。
  6. 确认弹窗内容后，点弹窗底部的发布按钮。
  7. 发布后必须按「核对」执行：编辑器 URL 里的 `.../editor/drafts/<id>` 是草稿 sid，不等于成稿 `article_id`；仅凭草稿页仍可打开不得记为已发布。
- 写入正文（page.evaluate）：

  ```js
  document.querySelector('.CodeMirror').CodeMirror.setValue(markdown)
  ```

- 核对：创作者首页按标题取成稿链接：

  ```js
  await page.goto('https://juejin.cn/creator/home', { timeout: 60000 });
const match = [...document.querySelectorAll('a')].find((a) => a.textContent?.includes(title));
const articleId = match?.href?.match(/\/post\/(\d+)/)?.[1];
  ```

- 核对：query_list API（POST，带 Cookie）：

  ```js
  const res = await fetch('https://api.juejin.cn/content_api/v1/article/query_list', {
  method: 'POST',
  credentials: 'include',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ user_id, sort_type: 2, cursor: '0' }),
});
const row = (await res.json()).data?.find((x) => x.article_info?.title === title);
  ```

- 核对：按任务 title 核对成稿：打开 `https://juejin.cn/creator/home`（勿用已失效的 `creator/content/article`）在列表里匹配标题并取 `/post/<article_id>`；或在当前页 `POST https://api.juejin.cn/content_api/v1/article/query_list`（`user_id` 来自 `GET https://api.juejin.cn/user_api/v1/user/get` 的 `data.user_id`，`sort_type: 2`，`cursor: "0"`）按标题取 `article_id`。再 `goto https://juejin.cn/post/<article_id>` 核对 `h1` 与任务标题一致。不要用 GET `list_by_user`（实测 `err_no: 2`）。
- 成功标志：创作者首页或个人 `/user/<user_id>/posts` 出现该标题，且 `https://juejin.cn/post/<article_id>` 可打开（`h1` 一致）。任务台 `articleUrl` 必须是该 post 链接；仅当只有草稿编辑器 URL、且上述校验均失败时，才用 `status: draft` 并写编辑器 drafts 链。

### CSDN（`csdn`，2026-11-26 实测）

- 入口：https://editor.csdn.net/md/
- 登录判断：编辑器跳到 passport.csdn.net 登录页，就是未登录。
- 步骤：
  1. 先点「【无标题】」，再填 `input.article-bar__title`。
  2. 正文区是 contenteditable 的 `pre.editor__inner`：聚焦后全选，用键盘粘贴整篇 Markdown。CSDN 会自动把外链图片转存到 i-blog.csdnimg.cn，等预览里的图片全部加载后再继续。
  3. 点顶部「发布文章」打开弹窗：添加最多 4 个标签；封面选推荐缩略图后，要在「图片编辑」里点「确认上传」；摘要写进摘要文本框（≤256 字）。
  4. 文章类型：原创文章选「原创」。翻译或转载要填写原文链接 `input.text-originallink`；「翻译」开关用 `label.lab-switch:has-text('翻译')` 定位。选「翻译」时还要勾选「原文允许翻译或者本次翻译已经获得原文作者授权」，这一项属于权利声明，按安全规则先问站长。
  5. 最后点弹窗底部的红色按钮 `button.btn-b-red`。顶部工具栏的 `.btn-publish` 是另一个按钮，不要点。
- 核对：确认页面跳转，并打开「查看文章」链接核对标题和图片。
- 成功标志：跳到 `mp.csdn.net/mp_blog/creation/success/<文章ID>`；新文章通常先进入审核。

### X（`twitter`，2026-11-27 实测）

- 入口：https://x.com/compose/articles
- 登录判断：跳到 x.com/i/flow/login 或出现「Sign in」按钮，就是未登录。
- 步骤：
  1. 在 Articles 列表点新建（Write），进入编辑器。标题填顶部标题输入框。
  2. 正文按「富文本编辑器」规则粘贴 HTML，但 X 只认两级标题且不支持表格：粘贴前把 h2→h1（Heading）、h3/h4→h2（Subheading），每个表格改成列表（每行一条，首列加粗，其余写成「列名：值」用「；」分隔），图片先换成 `[[IMGn]]` 占位段落。
  3. 粘贴的图片不会上传。逐张处理：先下载图片到本地，选中对应 `[[IMGn]]` 占位段落，点「Insert → Media」，用 `page.setInputFiles('input[data-testid="fileInput"]', 路径)` 上传；有图注时写进弹窗里的 `[role="dialog"] textarea`。
  4. 封面（可选）用 `input[data-testid="fileInput"][multiple]` 上传正文第一张图，裁剪弹窗点「Apply」。
  5. 菜单或弹窗的遮罩会挡住点击：选择器必须只匹配一个元素，被挡时先用 evaluate 算坐标再 `page.mouse.click`。
  6. 点「Publish」，在确认弹窗里再点 `[role="dialog"]` 内的「Publish」。之后弹出的 Boost（付费推广）直接关掉，不付费。
- 核对：打开个人主页最新帖子，核对文章标题、章节标题、列表和图片。
- 成功标志：生成 `https://x.com/<账号>/status/<ID>` 的文章帖，发布即公开，无审核。

### 小红书（`xiaohongshu`，2026-11-27 实测）

- 入口：https://creator.xiaohongshu.com/publish/publish?from=menu&target=article
- 登录判断：跳到 creator.xiaohongshu.com/login 登录页，就是未登录。
- 步骤：
  1. 点「写长文」标签，再点「新的创作」。先关掉「图片可以编辑啦」之类的功能引导弹窗（点弹窗右上角 X）。
  2. 标题填 `textarea[placeholder="输入标题"]`（≤64 字）。
  3. 正文是 tiptap（`.tiptap.ProseMirror`），只保留 h1、h2、段落、列表和引用，加粗、链接、表格都会丢：粘贴前把 h2→h1、h3/h4→h2，表格改成列表（同 X），图片换成 `[[IMGn]]` 占位。正文区可能被 `xhs-publish-btn` 挡住点击，用 evaluate 对 `.tiptap.ProseMirror` 调 `focus()` 后再粘贴。
  4. 图片：选中占位段落，先 `page.waitForFileChooser()` 再点工具栏图片按钮，`setFiles` 上传下载好的图片，然后删掉占位文字。
  5. 点「一键排版」选模板（默认「逻辑结构」即可），点「下一步」生成图片卡片并进入笔记表单。弹出定位权限时关掉再继续。
  6. 笔记标题 `input[placeholder="填写标题会有更多赞哦"]` 最多 20 字：超出时按「标题过长」规则截短。笔记正文（≤1000 字）填任务摘要。
  7. 话题：在笔记正文末尾输入 `#话题词`，等联想列表出现后按回车，最多 3 个，从站内标签就近匹配。
  8. 「原创声明」属于权利声明，按安全规则先问站长；不要关联活动（误关联时点「取消关联」）。
  9. 点可见的「发布」按钮（用 evaluate 算坐标点击，避免点到 `xhs-publish-btn` 上的其他区域）。
- 核对：打开笔记管理 https://creator.xiaohongshu.com/new/note-manager，新笔记出现在列表里；笔记 ID 在 `note-card` 的 `data-impression` 的 noteId 里。
- 成功标志：发布后地址带 `published=true`，笔记管理显示「审核中」；审核通过后地址为 `https://www.xiaohongshu.com/explore/<笔记ID>`。

### 知乎（`zhihu`，2026-11-27 实测）

- 入口：https://zhuanlan.zhihu.com/write
- 登录判断：跳到 www.zhihu.com/signin 登录页，就是未登录。
- 步骤：
  1. 标题填 `textarea[placeholder="请输入标题（最多 100 个字）"]`。
  2. 正文是 Draft.js（`.public-DraftEditor-content`）：聚焦后直接粘贴站内原文 HTML，不用转换；标题层级、表格、列表、链接都能保留，图片会自动转存到 pic-private.zhihu.com。等图片全部转存后再继续。
  3. 封面：`page.setInputFiles('input.UploadPicture-input', 路径)` 上传正文第一张图。
  4. 话题：先点「添加话题」，再鼠标点击「搜索话题...」输入框（不点击就输入不进去），输入关键词后点击输入框下方匹配的结果，最多 3 个。
  5. 「创作声明」保持「无声明」，要改成原创等声明时按安全规则先问站长；「投稿至问题」和专栏保持默认。
  6. 点「发布」，按钮显示「发布中…」，约 15 秒后跳转。
- 核对：打开发布后的文章页，核对章节标题、表格数量和图片。
- 成功标志：地址从 `/p/<ID>/edit` 变成 `https://zhuanlan.zhihu.com/p/<ID>`，发布即公开。

### 头条（`toutiao`，2026-11-27 实测）

- 入口：https://mp.toutiao.com/profile_v4/graphic/publish
- 登录判断：跳到 mp.toutiao.com/auth/page/login 登录页，就是未登录。
- 步骤：
  1. 先关掉右侧「头条创作助手」抽屉（它会挡住标题框）。顶部提示的旧草稿与本任务无关时不要点开。
  2. 标题 `textarea[placeholder="请输入文章标题（2～30个字）"]` 最多 30 字：超出时按「标题过长」规则截短。
  3. 正文是 ProseMirror（`.ProseMirror`）：聚焦后粘贴站内原文 HTML。表格和图片能保留（图片自动转存），但所有标题都会变成 h1、多数链接会丢，这是平台限制，记进手册偏差即可。
  4. 封面默认取正文图片，确认有图即可。「投放广告」是必选项，保持默认。
  5. 默认勾选的「头条首发」要取消（文章已在其他平台发布）；「同时发布微头条」不在任务范围内，也要取消。「作品声明」留空，要加声明时按安全规则先问站长。
  6. 点「预览并发布」，在预览页点「确认发布」。
- 核对：跳到 https://mp.toutiao.com/profile_v4/graphic/articles，新文章在列表里显示「审核中」，且没有「首发」标记；文章 ID（pgc_id）在预览链接里。
- 成功标志：文章列表显示「审核中」；审核通过后会出现在 `https://www.toutiao.com/item/<ID>`。

## 自备账号模式

- 任务标明「自备账号（guest）」时走本节；含「任务地址」和「token」的是站长任务台，访客不要混用。
- 先运行 `ego-browser skill`。创建任务空间时使用任务给出的 `profileId`（默认 SyncBlog），专用于各平台登录态，不要与日常上网 profile 混用。
- 每个平台先确认已登录；未登录就把任务空间交给任务创建者登录（handOff），对方回复后再继续。
- 正文默认不含全文：打开任务里的站内原文 URL，按「内容处理」从页面取正文；禁止从第三方镜像粘贴整篇替代原文。
- 发布到自己的平台账号；文首或文末保留原文链接。转载或翻译须填原文 URL，权利声明勾选前必须经任务创建者确认。
- 不要使用他人的 Bearer token，不要调用站长的任务台接口。
- 安装 skill：打开 https://2aran.com/skill-center/2aran-distributor 下载，或 GET https://2aran.com/api/resources/aran-distributor-skill 保存为 SKILL.md，放入 Cursor / Codex / Claude 的 skills 目录下的 `2aran-distributor/`。
- 全部平台处理完后关闭任务空间（`finish({ keep: [] })`），在对话里按「回报」逐平台说明结果。

## 任务台模式

- 任务给出「任务地址」和「token」时用任务台模式；任务直接带 Markdown 原文时是离线任务，跳过本节，处理完在对话里回报。
- 领取：`curl -sS -H "Authorization: Bearer <token>" <任务地址>`。返回 JSON：title、url、summary、tags、platformIds、markdown、harnessVersion、results。按 platformIds 的顺序处理，正文用 markdown 字段。
- harnessVersion 与本 skill 版本不一致时先停下，请站长更新 skill。
- results 里已有「published / reviewing / draft」结果的平台不要重复发布，先问站长。
- 每个平台处理完立刻回报，不要等全部结束。用 heredoc 把 JSON 从标准输入传给 curl，避免引号转义：`curl -sS -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" --data-binary @- <任务地址>`，请求体 `{"action":"result","platformId":"juejin","status":"published","articleUrl":"…","notes":"…","playbookDeviation":"…"}`。`articleUrl` 填手册「成功标志」里的公开文章址，勿填仅自己可见的编辑页或草稿箱址（掘金 drafts 链仅在 `status: draft` 时使用）。
- status 取值：`published`（已发布）、`reviewing`（审核中）、`draft`（草稿）、`failed`（失败）、`skipped`（跳过）。notes 写「问题与处理」，playbookDeviation 写「手册偏差」，没有就写「无」。
- 全部平台回报后收尾：POST `{"action":"finish"}`。收尾后 token 失效，台账按结果标成完成、部分完成或失败。
- 接口返回 401 `INVALID_TOKEN` 时 token 已过期或任务已取消：停下，请站长在后台 /admin/article-distribution 重新复制领取指令。
- token 只放在命令行参数里，不写进文件、提交或回报内容。

## 回报

全部平台处理完后，在对话里按平台逐条回报（任务台模式也要）：

- 平台
- 结果：已发布 / 审核中 / 草稿 / 失败 / 跳过
- 文章链接或文章 ID
- 问题与处理：遇到的异常和处理方式，没有就写「无」
- 手册偏差：页面和手册不一致的地方（按钮改名、选择器失效、新增弹窗等）和建议的改法，没有就写「无」
