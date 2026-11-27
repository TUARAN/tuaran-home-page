// 平台手册（playbook）：分发智能体在每个平台上的操作要点。
// 每条手册来自一次真实发布的实测；verifiedAt 是最近一次实测日期。
// 平台改版、智能体回报「手册偏差」后在这里更新，并提升 ./harness.js 的 HARNESS_VERSION。

export const DISTRIBUTION_PLAYBOOKS = {
  juejin: {
    verifiedAt: '2026-11-26',
    entry: 'https://juejin.cn/editor/drafts/new?v=2',
    login: '页面弹出登录框，或右上角出现「登录」按钮，就是未登录。',
    steps: [
      '编辑器是 bytemd（CodeMirror）。标题只填顶部标题输入框；正文用下方片段一次性写入（不要逐字输入），且不得含与标题相同的首条 `#` 标题。',
      '写入后切预览核对：标题不重复；统计 `![](…)` 数量，预览里每张图须能加载。',
      '图床替换（本站图或预览「转存失败」/裂图必做）：`await page.fetch(图片绝对URL, { saveAs: "/绝对路径/文件名.ext" })` 下载；点工具栏「图片」上传该文件；用返回的掘金 CDN 地址，在 CodeMirror 中把对应 `![](旧URL)` 整段替换为 `![](新URL)`，逐张处理直至预览无裂图。',
      'HTML/SVG 示意图：掘金不渲染 `<figure>`/`<svg>`。打开任务 `url` 站内原文，对示意图 `page.screenshot({ ... })` 存为 PNG 后按上一步上传，正文改为 `![图注](掘金URL)`；无法截图时删除原始标签，只保留图注文字。',
      '点「发布」打开弹窗：分类按内容选（技术文章一般选「人工智能」或「前端」）；标签要先聚焦 `.publish-popup input.byte-select__input` 再输入，然后点击匹配的 `.byte-select-option`，最多 3 个；封面选正文第一张可用图；摘要 50–100 字。',
      '确认弹窗内容后，点弹窗底部的发布按钮。',
    ],
    snippets: [
      {
        label: '写入正文（page.evaluate）',
        code: "document.querySelector('.CodeMirror').CodeMirror.setValue(markdown)",
      },
    ],
    verify: '发布后用 `https://api.juejin.cn/content_api/v1/article/list_by_user`（带 credentials）核对文章状态，拿到文章 ID。',
    success: '新文章出现在作者文章列表里；通常先进入审核，文章地址为 `https://juejin.cn/post/<文章ID>`。',
  },
  csdn: {
    verifiedAt: '2026-11-26',
    entry: 'https://editor.csdn.net/md/',
    login: '编辑器跳到 passport.csdn.net 登录页，就是未登录。',
    steps: [
      '先点「【无标题】」，再填 `input.article-bar__title`。',
      '正文区是 contenteditable 的 `pre.editor__inner`：聚焦后全选，用键盘粘贴整篇 Markdown。CSDN 会自动把外链图片转存到 i-blog.csdnimg.cn，等预览里的图片全部加载后再继续。',
      '点顶部「发布文章」打开弹窗：添加最多 4 个标签；封面选推荐缩略图后，要在「图片编辑」里点「确认上传」；摘要写进摘要文本框（≤256 字）。',
      '文章类型：原创文章选「原创」。翻译或转载要填写原文链接 `input.text-originallink`；「翻译」开关用 `label.lab-switch:has-text(\'翻译\')` 定位。选「翻译」时还要勾选「原文允许翻译或者本次翻译已经获得原文作者授权」，这一项属于权利声明，按安全规则先问站长。',
      '最后点弹窗底部的红色按钮 `button.btn-b-red`。顶部工具栏的 `.btn-publish` 是另一个按钮，不要点。',
    ],
    snippets: [],
    verify: '确认页面跳转，并打开「查看文章」链接核对标题和图片。',
    success: '跳到 `mp.csdn.net/mp_blog/creation/success/<文章ID>`；新文章通常先进入审核。',
  },
  twitter: {
    verifiedAt: '2026-11-27',
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
    verify: '打开个人主页最新帖子，核对文章标题、章节标题、列表和图片。',
    success: '生成 `https://x.com/<账号>/status/<ID>` 的文章帖，发布即公开，无审核。',
  },
  xiaohongshu: {
    verifiedAt: '2026-11-27',
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
    verify: '打开笔记管理 https://creator.xiaohongshu.com/new/note-manager，新笔记出现在列表里；笔记 ID 在 `note-card` 的 `data-impression` 的 noteId 里。',
    success: '发布后地址带 `published=true`，笔记管理显示「审核中」；审核通过后地址为 `https://www.xiaohongshu.com/explore/<笔记ID>`。',
  },
  zhihu: {
    verifiedAt: '2026-11-27',
    entry: 'https://zhuanlan.zhihu.com/write',
    login: '跳到 www.zhihu.com/signin 登录页，就是未登录。',
    steps: [
      '标题填 `textarea[placeholder="请输入标题（最多 100 个字）"]`。',
      '正文是 Draft.js（`.public-DraftEditor-content`）：聚焦后直接粘贴站内原文 HTML，不用转换；标题层级、表格、列表、链接都能保留，图片会自动转存到 pic-private.zhihu.com。等图片全部转存后再继续。',
      '封面：`page.setInputFiles(\'input.UploadPicture-input\', 路径)` 上传正文第一张图。',
      '话题：先点「添加话题」，再鼠标点击「搜索话题...」输入框（不点击就输入不进去），输入关键词后点击输入框下方匹配的结果，最多 3 个。',
      '「创作声明」保持「无声明」，要改成原创等声明时按安全规则先问站长；「投稿至问题」和专栏保持默认。',
      '点「发布」，按钮显示「发布中…」，约 15 秒后跳转。',
    ],
    snippets: [],
    verify: '打开发布后的文章页，核对章节标题、表格数量和图片。',
    success: '地址从 `/p/<ID>/edit` 变成 `https://zhuanlan.zhihu.com/p/<ID>`，发布即公开。',
  },
  toutiao: {
    verifiedAt: '2026-11-27',
    entry: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    login: '跳到 mp.toutiao.com/auth/page/login 登录页，就是未登录。',
    steps: [
      '先关掉右侧「头条创作助手」抽屉（它会挡住标题框）。顶部提示的旧草稿与本任务无关时不要点开。',
      '标题 `textarea[placeholder="请输入文章标题（2～30个字）"]` 最多 30 字：超出时按「标题过长」规则截短。',
      '正文是 ProseMirror（`.ProseMirror`）：聚焦后粘贴站内原文 HTML。表格和图片能保留（图片自动转存），但所有标题都会变成 h1、多数链接会丢，这是平台限制，记进手册偏差即可。',
      '封面默认取正文图片，确认有图即可。「投放广告」是必选项，保持默认。',
      '默认勾选的「头条首发」要取消（文章已在其他平台发布）；「同时发布微头条」不在任务范围内，也要取消。「作品声明」留空，要加声明时按安全规则先问站长。',
      '点「预览并发布」，在预览页点「确认发布」。',
    ],
    snippets: [],
    verify: '跳到 https://mp.toutiao.com/profile_v4/graphic/articles，新文章在列表里显示「审核中」，且没有「首发」标记；文章 ID（pgc_id）在预览链接里。',
    success: '文章列表显示「审核中」；审核通过后会出现在 `https://www.toutiao.com/item/<ID>`。',
  },
}

export const DISTRIBUTION_AGENT_PLATFORM_IDS = Object.keys(DISTRIBUTION_PLAYBOOKS)

export function getDistributionPlaybook(id) {
  return DISTRIBUTION_PLAYBOOKS[String(id || '').trim().toLowerCase()] || null
}
