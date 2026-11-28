// 分发智能体的 harness：账号、安全规则、内容处理、核对与回报格式。
// skill（./skill.js）和任务提示词（./taskPrompt.js）都从这里取规则，不另写一份。
// 规则或手册（./playbooks.js）有改动时提升 HARNESS_VERSION，并运行 `npm run distributor:skill` 重新生成 skill。

export const HARNESS_VERSION = '1.4.6'

export const DISTRIBUTOR_SKILL_NAME = '2aran-distributor'

export const SITE_ORIGIN = 'https://2aran.com'

export const EGO_BROWSER_PROFILE = {
  name: 'Aran',
  profileId: 'Profile 1',
}

export const GUEST_EGO_BROWSER_PROFILE = {
  name: '分发专用',
  profileId: 'SyncBlog',
}

export const PUBLIC_SKILL_PAGE_PATH = '/skill-center/2aran-distributor'
export const PUBLIC_SKILL_DOWNLOAD_PATH = '/api/resources/aran-distributor-skill'

export const HARNESS_RULES = [
  {
    title: '站长任务台 · 浏览器与账号',
    rules: [
      '先运行 `ego-browser skill`，按输出的使用指南操作。',
      `只用 ego lite 的「${EGO_BROWSER_PROFILE.name}」账号：创建任务空间时传 \`{ profileId: "${EGO_BROWSER_PROFILE.profileId}" }\`。不要用其他 profile，也不要改用别的浏览器。`,
      '每个平台先确认已登录；未登录就把任务空间交给站长登录（handOff），站长回复后再继续。',
      '全部平台处理完后关闭任务空间（`finish({ keep: [] })`）。',
    ],
  },
  {
    title: '安全规则',
    rules: [
      '涉及权利声明的勾选项（翻译授权、原创声明、转载许可），先停下来问站长，不能自行勾选。',
      '编辑器里已有标题或正文时不要覆盖，先问站长是继续编辑还是新建。',
      '同一平台发布失败后，先到平台的草稿箱和文章列表确认有没有留下内容，再决定是否重试，避免重复发布。',
      '只处理任务里列出的平台。',
    ],
  },
  {
    title: '内容处理',
    rules: [
      '正文使用任务里的 Markdown 原文，保留图片、代码块、引用和标题层级；开头的作者署名为三行 blockquote，段与段之间有空行（建任务已预处理）。建任务时已将「适用范围」等边界说明引用挪到文末（紧贴「信息来源」节之前），与站内文章页一致，外发不要再抄回文首；不要把三行作者介绍合并成一段。',
      '平台编辑页有独立「标题」输入框时：标题只填该输入框，正文不得再保留与标题相同的首条 `#` 标题（建任务时已去掉；若仍出现，发布前先删掉）。',
      '正文里指代站点的「本站」改成「我的个人站」，其他内容不改写。',
      '掘金：站内图床（2aran.com）与预览「转存失败」/裂图必须走「下载 → 编辑器上传 → 替换 Markdown 链接」；含 `<figure>`/`<svg>` 的 HTML 需截图或导出 PNG 后上传替换，不能只粘贴原始 HTML。详见掘金手册「图床替换」。',
      '站内 TL;DR 旁的作者介绍不在 `article.prose-tuaran` 里。掘金/CSDN/51CTO 用任务 `markdown` 文首三行作者 blockquote；富文本平台（X、小红书、知乎、今日头条、微博头条）须先粘任务 JSON 的 `authorIntroHtml`（或 skill 里等价的作者介绍 HTML），再粘从站内原文 evaluate 得到的正文 HTML，两次粘贴都在正文最前、章节 h2 之前。51CTO 优先整篇 Markdown，不行再走 HTML。',
      '标题超过平台字数上限时，取原标题冒号前的部分；仍超出就从原标题里删减，不新编措辞，并记进回报。',
      '文章类型：正文开头注明转译或转载外部原文时，按「翻译」或「转载」发布并填写那个原文链接；否则选「原创」。',
      '摘要按平台字数限制从任务里的摘要压缩，不编造正文没有的信息。',
      '标签从任务里的站内标签就近匹配平台可选标签。',
    ],
  },
  {
    title: '核对',
    rules: [
      '每个平台发布前在预览里核对：标题、图片全部加载、代码块数量、章节标题。',
      '发布后按手册的「核对」和「成功标志」确认结果，不以点过按钮为准。',
      '任务台回报前必须完成该平台手册「核对」；未完成不得 POST `action:result` 为 `published` / `reviewing`。',
      '`articleUrl` 填读者可见的成稿链接（各平台手册「成功标志」）；勿填编辑器、compose、write、publish 发布页或仅草稿箱入口。标题与任务不完全一致时（平台截断标题），按手册用前缀或任务 title 子串在列表里匹配。',
      '掘金：`.../editor/drafts/<sid>` ≠ 成稿 `article_id`；须 `creator/home` 或 `query_list` 取 `/post/<id>`。',
      'CSDN：`editor.csdn.net` 仅是编辑页；成稿链在成功页或 `blog.csdn.net` 文章页。',
      'X：须出现 `/status/<id>` 或 Articles「Published」列表；勿把 `/compose/articles/edit/<id>` 当已发布。',
      '知乎：回报链为 `https://zhuanlan.zhihu.com/p/<id>`，不能带 `/edit`。',
      '头条：仅在 `profile_v4/graphic/articles`（或带「审核中」）出现才可记 reviewing/published；只在 `manage/draft` 则为 draft。',
      '小红书：须在笔记管理「已发布」或「审核中」看到标题匹配项；长文排版页停留不算成功。',
      '51CTO：须在创作中心文章管理出现该标题；勿把 `/blogger/draft/` 编辑链当已发布。',
      '微博：须有个人主页「文章」或已发布列表中的成稿链；`#/draft/` 仅为草稿。',
    ],
  },
]

export const REPORT_FIELDS = [
  '平台',
  '结果：已发布 / 审核中 / 草稿 / 失败 / 跳过',
  '文章链接或文章 ID',
  '问题与处理：遇到的异常和处理方式，没有就写「无」',
  '手册偏差：页面和手册不一致的地方（按钮改名、选择器失效、新增弹窗等）和建议的改法，没有就写「无」',
]

// 结果取值：回报字段「结果」与任务台接口 status 一一对应。
export const RESULT_STATUS_LABELS = {
  published: '已发布',
  reviewing: '审核中',
  draft: '草稿',
  failed: '失败',
  skipped: '跳过',
}

export const GUEST_MODE_RULES = [
  '任务标明「自备账号（guest）」时走本节；含「任务地址」和「token」的是站长任务台，访客不要混用。',
  '先运行 `ego-browser skill`。创建任务空间时使用任务给出的 `profileId`（默认 SyncBlog），专用于各平台登录态，不要与日常上网 profile 混用。',
  '每个平台先确认已登录；未登录就把任务空间交给任务创建者登录（handOff），对方回复后再继续。',
  '正文默认不含全文：打开任务里的站内原文 URL，按「内容处理」从页面取正文；富文本平台先粘文首作者介绍 HTML（见 skill「内容处理」），再粘正文；禁止从第三方镜像粘贴整篇替代原文。',
  '发布到自己的平台账号；文首或文末保留原文链接。转载或翻译须填原文 URL，权利声明勾选前必须经任务创建者确认。',
  '不要使用他人的 Bearer token，不要调用站长的任务台接口。',
  `安装 skill：打开 ${SITE_ORIGIN}${PUBLIC_SKILL_PAGE_PATH} 下载，或 GET ${SITE_ORIGIN}${PUBLIC_SKILL_DOWNLOAD_PATH} 保存为 SKILL.md，放入 Cursor / Codex / Claude 的 skills 目录下的 \`2aran-distributor/\`。`,
  '全部平台处理完后关闭任务空间（`finish({ keep: [] })`），在对话里按「回报」逐平台说明结果。',
]

export const AGENT_JOB_MODE_RULES = [
  '任务给出「任务地址」和「token」时用任务台模式；任务直接带 Markdown 原文时是离线任务，跳过本节，处理完在对话里回报。',
  '领取：`curl -sS -H "Authorization: Bearer <token>" <任务地址>`。返回 JSON：title、url、summary、tags、platformIds、markdown、`authorIntroHtml`、`harnessVersion、results。Markdown 平台用 markdown；富文本平台先粘 authorIntroHtml，再粘站内正文 HTML。',
  'harnessVersion 与本 skill 版本不一致时先停下，请站长更新 skill。',
  'results 里已有「published / reviewing / draft」结果的平台不要重复发布，先问站长。',
  '每个平台处理完立刻回报，不要等全部结束。用 heredoc 把 JSON 从标准输入传给 curl，避免引号转义：`curl -sS -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" --data-binary @- <任务地址>`，请求体 `{"action":"result","platformId":"juejin","status":"published","articleUrl":"…","notes":"…","playbookDeviation":"…"}`。`articleUrl` 填手册「成功标志」里的公开成稿址；各平台编辑器/compose/drafts 链仅在 `status: draft` 且手册核对确认未成稿时使用。',
  `status 取值：${Object.entries(RESULT_STATUS_LABELS).map(([key, label]) => `\`${key}\`（${label}）`).join('、')}。notes 写「问题与处理」，playbookDeviation 写「手册偏差」，没有就写「无」。`,
  '全部平台回报后收尾：POST `{"action":"finish"}`。收尾后 token 失效，台账按结果标成完成、部分完成或失败。',
  '接口返回 401 `INVALID_TOKEN` 时 token 已过期或任务已取消：停下，请站长在后台 /admin/article-distribution 重新复制领取指令。',
  'token 只放在命令行参数里，不写进文件、提交或回报内容。',
]
