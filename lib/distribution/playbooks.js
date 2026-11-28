// 平台手册（playbook）：分发智能体在每个平台上的操作要点。
// 每条手册来自一次真实发布的实测；verifiedAt 是最近一次实测日期。
// 平台改版、智能体回报「手册偏差」后在这里更新，并提升 ./harness.js 的 HARNESS_VERSION。

export const DISTRIBUTION_PLAYBOOKS = {
  juejin: {
    verifiedAt: '2026-11-28',
    entry: 'https://juejin.cn/editor/drafts/new?v=2',
    login: '页面弹出登录框，或右上角出现「登录」按钮，就是未登录。',
    steps: [
      '编辑器是 bytemd（CodeMirror）。标题只填顶部标题输入框；正文用下方片段一次性写入（不要逐字输入），且不得含与标题相同的首条 `#` 标题。',
      '写入后切预览核对：标题不重复；统计 `![](…)` 数量，预览里每张图须能加载。',
      '图床替换（本站图或预览「转存失败」/裂图必做）：`await page.fetch(图片绝对URL, { saveAs: "/绝对路径/文件名.ext" })` 下载；点工具栏「图片」上传该文件；用返回的掘金 CDN 地址，在 CodeMirror 中把对应 `![](旧URL)` 整段替换为 `![](新URL)`，逐张处理直至预览无裂图。',
      'HTML/SVG 示意图：掘金不渲染 `<figure>`/`<svg>`。打开任务 `url` 站内原文，对示意图 `page.screenshot({ ... })` 存为 PNG 后按上一步上传，正文改为 `![图注](掘金URL)`；无法截图时删除原始标签，只保留图注文字。',
      '点「发布」打开弹窗：分类按内容选（技术文章一般选「人工智能」或「前端」）；标签要先聚焦 `.publish-popup input.byte-select__input` 再输入，然后点击匹配的 `.byte-select-option`，最多 3 个；封面选正文第一张可用图；摘要 50–100 字。',
      '确认弹窗内容后，点弹窗底部的发布按钮。',
      '发布后必须按「核对」执行：编辑器 URL 里的 `.../editor/drafts/<id>` 是草稿 sid，不等于成稿 `article_id`；仅凭草稿页仍可打开不得记为已发布。',
    ],
    snippets: [
      {
        label: '写入正文（page.evaluate）',
        code: "document.querySelector('.CodeMirror').CodeMirror.setValue(markdown)",
      },
      {
        label: '核对：创作者首页按标题取成稿链接',
        code: "await page.goto('https://juejin.cn/creator/home', { timeout: 60000 });\nconst match = [...document.querySelectorAll('a')].find((a) => a.textContent?.includes(title));\nconst articleId = match?.href?.match(/\\/post\\/(\\d+)/)?.[1];",
      },
      {
        label: '核对：query_list API（POST，带 Cookie）',
        code: "const res = await fetch('https://api.juejin.cn/content_api/v1/article/query_list', {\n  method: 'POST',\n  credentials: 'include',\n  headers: { 'content-type': 'application/json' },\n  body: JSON.stringify({ user_id, sort_type: 2, cursor: '0' }),\n});\nconst row = (await res.json()).data?.find((x) => x.article_info?.title === title);",
      },
    ],
    verify:
      '按任务 title 核对成稿：打开 `https://juejin.cn/creator/home`（勿用已失效的 `creator/content/article`）在列表里匹配标题并取 `/post/<article_id>`；或在当前页 `POST https://api.juejin.cn/content_api/v1/article/query_list`（`user_id` 来自 `GET https://api.juejin.cn/user_api/v1/user/get` 的 `data.user_id`，`sort_type: 2`，`cursor: "0"`）按标题取 `article_id`。再 `goto https://juejin.cn/post/<article_id>` 核对 `h1` 与任务标题一致。不要用 GET `list_by_user`（实测 `err_no: 2`）。',
    success:
      '创作者首页或个人 `/user/<user_id>/posts` 出现该标题，且 `https://juejin.cn/post/<article_id>` 可打开（`h1` 一致）。任务台 `articleUrl` 必须是该 post 链接；仅当只有草稿编辑器 URL、且上述校验均失败时，才用 `status: draft` 并写编辑器 drafts 链。',
  },
  csdn: {
    verifiedAt: '2026-11-28',
    entry: 'https://editor.csdn.net/md/',
    login: '编辑器跳到 passport.csdn.net 登录页，就是未登录。',
    steps: [
      '先点「【无标题】」，再填 `input.article-bar__title`。ego-browser 下若标题框或 `pre.editor__inner` 的 `getBoundingClientRect().width === 0`，用 evaluate 给 `input.article-bar__title` 与 `pre.editor__inner` 赋值并 `dispatchEvent(new Event("input", { bubbles: true }))`，不要因 click/fill 超时直接报失败。',
      '正文区是 contenteditable 的 `pre.editor__inner`：聚焦后全选，用键盘粘贴整篇 Markdown。CSDN 会自动把外链图片转存到 i-blog.csdnimg.cn，等预览里的图片全部加载后再继续。',
      '点顶部「发布文章」打开弹窗：添加最多 4 个标签；封面选推荐缩略图后，要在「图片编辑」里点「确认上传」；摘要写进摘要文本框（≤256 字）。',
      '文章类型：原创文章选「原创」。翻译或转载要填写原文链接 `input.text-originallink`；「翻译」开关用 `label.lab-switch:has-text(\'翻译\')` 定位。选「翻译」时还要勾选「原文允许翻译或者本次翻译已经获得原文作者授权」，这一项属于权利声明，按安全规则先问站长。',
      '最后点弹窗底部的红色按钮 `button.btn-b-red`。顶部工具栏的 `.btn-publish` 是另一个按钮，不要点。',
    ],
    snippets: [],
    verify:
      '发布后看 URL 是否跳到 `mp.csdn.net/mp_blog/creation/success/<文章ID>`，或打开 `https://mp.csdn.net/mp_blog/manage/article` 按任务 title 找到新文并点「查看文章」；`editor.csdn.net` 仍可打开不能当作未发布依据。',
    success:
      '成功页或管理列表中的 `https://blog.csdn.net/<账号>/article/details/<文章ID>`（读者链）。任务台 `articleUrl` 填 blog 文章址或 success 页，不填 `editor.csdn.net`。',
  },
  twitter: {
    verifiedAt: '2026-11-28',
    entry: 'https://x.com/compose/articles',
    login: '跳到 x.com/i/flow/login 或出现「Sign in」按钮，就是未登录。',
    steps: [
      '在 Articles 列表点新建（Write），进入编辑器。标题填顶部标题输入框。',
      '正文按「富文本编辑器」规则粘贴 HTML，但 X 只认两级标题且不支持表格：粘贴前把 h2→h1（Heading）、h3/h4→h2（Subheading），每个表格改成列表（每行一条，首列加粗，其余写成「列名：值」用「；」分隔），图片先换成 `[[IMGn]]` 占位段落。',
      '粘贴的图片不会上传。逐张处理：先下载图片到本地，选中对应 `[[IMGn]]` 占位段落，点「Insert → Media」，用 `page.setInputFiles(\'input[data-testid="fileInput"]\', 路径)` 上传；有图注时写进弹窗里的 `[role="dialog"] textarea`。',
      '封面（可选）用 `input[data-testid="fileInput"][multiple]` 上传正文第一张图，裁剪弹窗点「Apply」。',
      '菜单或弹窗的遮罩会挡住点击：选择器必须只匹配一个元素，被挡时先用 evaluate 算坐标再 `page.mouse.click`。',
      '点「Publish」，在确认弹窗里再点 `[role="dialog"]` 内的「Publish」。之后弹出的 Boost（付费推广）直接关掉，不付费。',
    ],
    snippets: [],
    verify:
      '发布完成后地址应跳到 `https://x.com/<账号>/status/<ID>`，或在 `compose/articles` 的 Published 列表见到该标题；`/compose/articles/edit/<id>` 仅 Draft 不能记 published。',
    success:
      '任务台 `articleUrl` 填 `/status/<ID>` 完整链；不要用 Articles 草稿 edit 链代替。',
  },
  xiaohongshu: {
    verifiedAt: '2026-11-28',
    entry: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article',
    login: '跳到 creator.xiaohongshu.com/login 登录页，就是未登录。',
    steps: [
      '点「写长文」标签，再点「新的创作」。先关掉「图片可以编辑啦」之类的功能引导弹窗（点弹窗右上角 X）。',
      '标题填 `textarea[placeholder="输入标题"]`（≤64 字）。',
      '正文是 tiptap（`.tiptap.ProseMirror`），只保留 h1、h2、段落、列表和引用，加粗、链接、表格都会丢：粘贴前把 h2→h1、h3/h4→h2，表格改成列表（同 X），图片换成 `[[IMGn]]` 占位。正文区可能被 `xhs-publish-btn` 挡住点击，用 evaluate 对 `.tiptap.ProseMirror` 调 `focus()` 后再粘贴。',
      '图片：选中占位段落，先 `page.waitForFileChooser()` 再点工具栏图片按钮，`setFiles` 上传下载好的图片，然后删掉占位文字。',
      '点「一键排版」选模板（默认「逻辑结构」即可），点「下一步」生成图片卡片并进入笔记表单。弹出定位权限时关掉再继续。',
      '笔记标题 `input[placeholder="填写标题会有更多赞哦"]` 最多 20 字：超出时按「标题过长」规则截短。笔记正文（≤1000 字）填任务摘要。',
      '话题：在笔记正文末尾输入 `#话题词`，等联想列表出现后按回车，最多 3 个，从站内标签就近匹配。',
      '「原创声明」属于权利声明，按安全规则先问站长；不要关联活动（误关联时点「取消关联」）。',
      '点可见的「发布」按钮（用 evaluate 算坐标点击，避免点到 `xhs-publish-btn` 上的其他区域）。',
    ],
    snippets: [],
    verify:
      '打开 https://creator.xiaohongshu.com/new/note-manager ，在「审核中」或「已发布」按标题匹配（笔记标题可能被截到 20 字）；长文「一键排版」预览页不算发布成功；noteId 在 `note-card` 的 `data-impression` 里。',
    success:
      '笔记管理出现该笔记且状态为审核中或已发布；`articleUrl` 优先 `https://www.xiaohongshu.com/explore/<笔记ID>`，审核中若无 explore 链可填笔记管理页并记 `reviewing`；勿填仅停留在发布流程的 URL。',
  },
  zhihu: {
    verifiedAt: '2026-11-28',
    entry: 'https://zhuanlan.zhihu.com/write',
    login: '跳到 www.zhihu.com/signin 登录页，就是未登录。',
    steps: [
      '标题填 `textarea[placeholder="请输入标题（最多 100 个字）"]`。',
      '正文是 Draft.js（`.public-DraftEditor-content`）：聚焦后**先** `page.keyboard.paste({ html: authorIntroHtml })` 粘贴任务 JSON 的三行作者介绍（blockquote），**再**粘贴站内 `article.prose-tuaran` HTML（去重 h1、绝对化图片链）。顺序不能反；作者介绍不在站内正文 DOM 里，漏粘就会缺块。',
      '第二次粘贴后核对文首应有三段引用样式作者信息，再核对标题层级、表格、列表与图片；图片会自动转存到 pic-private.zhihu.com，等转存完成后再继续。',
      '封面：`page.setInputFiles(\'input.UploadPicture-input\', 路径)` 上传正文第一张图。',
      '话题：先点「添加话题」，再鼠标点击「搜索话题...」输入框（不点击就输入不进去），输入关键词后点击输入框下方匹配的结果，最多 3 个。',
      '「创作声明」保持「无声明」，要改成原创等声明时按安全规则先问站长；「投稿至问题」和专栏保持默认。',
      '点「发布」，按钮显示「发布中…」，约 15 秒后跳转。',
    ],
    snippets: [],
    verify:
      '发布跳转后 URL 为 `https://zhuanlan.zhihu.com/p/<ID>`（无 `/edit`），打开核对章节标题、表格与图片；仍在 `/write` 或 `/p/<ID>/edit` 则未成稿。',
    success:
      '任务台 `articleUrl` 必须为 `https://zhuanlan.zhihu.com/p/<ID>`，不带 `/edit`。',
  },
  toutiao: {
    verifiedAt: '2026-11-28',
    entry: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    login: '跳到 mp.toutiao.com/auth/page/login 登录页，就是未登录。',
    steps: [
      '先关掉右侧「头条创作助手」抽屉（它会挡住标题框）。顶部提示的旧草稿与本任务无关时不要点开。',
      '标题 `textarea[placeholder="请输入文章标题（2～30个字）"]` 最多 30 字：超出时按「标题过长」规则截短。',
      '正文是 ProseMirror（`.ProseMirror`）：聚焦后粘贴站内原文 HTML。表格和图片能保留（图片自动转存），但所有标题都会变成 h1、多数链接会丢，这是平台限制，记进手册偏差即可。',
      '封面默认取正文图片，确认有图即可。「投放广告」是必选项，保持默认。',
      '默认勾选的「头条首发」要取消（文章已在其他平台发布）；「同时发布微头条」不在任务范围内，也要取消。「作品声明」留空，要加声明时按安全规则先问站长。',
      '点「预览并发布」，在预览页点「确认发布」。',
      '发布后按「核对」区分：标题在平台上可能被截短（2～30 字），用任务 title 前缀在列表里匹配。',
    ],
    snippets: [],
    verify:
      '打开 https://mp.toutiao.com/profile_v4/graphic/articles 按截短后的标题找「审核中」；若无，再查 https://mp.toutiao.com/profile_v4/manage/draft — 仅草稿箱有则为 draft，不能记 published。确认无「首发」误勾选。',
    success:
      '图文列表出现该文（通常审核中）；`articleUrl` 用列表预览/详情链或后续 `https://www.toutiao.com/item/<ID>`，勿只填 `graphic/publish` 编辑页。',
  },
  '51cto': {
    verifiedAt: '2026-11-28',
    entry: 'https://blog.51cto.com/blogger/publish',
    login: '跳到 blog.51cto.com 登录页，或发文页要求登录，就是未登录。',
    steps: [
      '悟空编辑器页面：标题填发文页标题输入框；正文用任务 Markdown（无与标题相同的首条 `#` 标题）。优先整篇粘贴 Markdown；若预览不识别再按站内 HTML 规则粘贴。',
      '粘贴后核对预览：章节标题、代码块、引用与图片；站内图（2aran.com）若预览裂图，下载后走编辑器上传，替换为 51CTO 图床地址。',
      '填写摘要/分类/标签（若有弹窗）：摘要用任务 summary 压缩；标签从站内 tags 就近选，最多按页面限制。',
      '原创/转载类声明、邀请码活动弹窗非本任务范围时不要误填；权利声明按安全规则先问站长。',
      '点「发布」或「提交审核」（以页面按钮文案为准）。发布后按「核对」在创作中心文章列表找成稿，不凭仍在 `/blogger/publish` 或 `/blogger/draft/` 编辑页记 published。',
    ],
    snippets: [],
    verify:
      '打开 https://blog.51cto.com/creative-center/manager 在「文章管理」按任务 title 匹配；或打开 `https://blog.51cto.com/blogger/draft/<did>` 仅当手册确认仍为草稿且列表无已发布项时用 `status: draft`。',
    success:
      '文章管理列表出现该标题且状态为已发布/审核通过；`articleUrl` 填读者链 `https://blog.51cto.com/blogger/article/<id>` 或列表给出的博文链，勿只填 `blogger/publish` 或草稿 edit 链。',
  },
  weibo: {
    verifiedAt: '2026-11-28',
    entry: 'https://card.weibo.com/article/v5/editor',
    login: '跳到 weibo.com 登录页，或 card.weibo.com 要求登录，就是未登录。',
    steps: [
      '头条文章编辑器（v5）：先点「写文章」或进入空白草稿。标题填顶部标题框；导语可填任务 summary 压缩版（可留空）。',
      '正文是 TipTap（`.ProseMirror`）：按「富文本编辑器」规则粘贴站内原文 HTML，不直接粘 Markdown。标题层级保留 h2/h3；表格若丢失按手册偏差记录。',
      '图片必须落到微博图床：外链或本站图不能指望自动持久化。逐张下载后，在正文对应位置用编辑器上传/粘贴图片（勿仅用 base64 insertHTML）；等编辑器 `img src` 变为 `*.sinaimg.cn` 再继续。',
      '封面：上传正文第一张可用图作题图（按页面「文章封面」入口）。',
      '「仅粉丝可见全文」「赞赏」「同步新浪看点」等特权/声明项按安全规则先问站长；默认可不开启。',
      '正文完成后点「下一步」编辑 accompanying 短微博，再点「发布」（或「定时发」若站长明确要求定时）。仅保存草稿未点发布时只能记 `draft`。',
    ],
    snippets: [
      {
        label: '聚焦正文（ProseMirror）',
        code: 'document.querySelector(\'.ProseMirror\')?.focus()',
      },
    ],
    verify:
      '发布后在 https://weibo.com/ 个人主页「文章」列表，或编辑器「已发布」列表，按标题匹配；`#/draft/<id>` 仅草稿不能记 published。打开成稿链核对标题与首段。',
    success:
      '前台可见头条文章链（形如 `https://weibo.com/ttarticle/p/show?id=...` 或列表给出的文章 URL）；`articleUrl` 填该读者链，勿只填 `card.weibo.com/article/v5/editor#/draft/...`。',
  },
}

export const DISTRIBUTION_AGENT_PLATFORM_IDS = Object.keys(DISTRIBUTION_PLAYBOOKS)

export function getDistributionPlaybook(id) {
  return DISTRIBUTION_PLAYBOOKS[String(id || '').trim().toLowerCase()] || null
}
