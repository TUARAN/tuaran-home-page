// 分发智能体的 harness：账号、安全规则、内容处理、核对与回报格式。
// skill（./skill.js）和任务提示词（./taskPrompt.js）都从这里取规则，不另写一份。
// 规则或手册（./playbooks.js）有改动时提升 HARNESS_VERSION，并运行 `npm run distributor:skill` 重新生成 skill。

export const HARNESS_VERSION = '1.3.0'

export const DISTRIBUTOR_SKILL_NAME = '2aran-distributor'

export const SITE_ORIGIN = 'https://2aran.com'

export const EGO_BROWSER_PROFILE = {
  name: 'Aran',
  profileId: 'Profile 1',
}

export const HARNESS_RULES = [
  {
    title: '浏览器与账号',
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
      '正文使用任务里的 Markdown 原文，保留图片、代码块、引用和标题层级；开头的作者署名行保留。',
      '平台编辑页有独立「标题」输入框时：标题只填该输入框，正文不得再保留与标题相同的首条 `#` 标题（建任务时已去掉；若仍出现，发布前先删掉）。',
      '正文里指代站点的「本站」改成「我的个人站」，其他内容不改写。',
      '掘金：站内图床（2aran.com）与预览「转存失败」/裂图必须走「下载 → 编辑器上传 → 替换 Markdown 链接」；含 `<figure>`/`<svg>` 的 HTML 需截图或导出 PNG 后上传替换，不能只粘贴原始 HTML。详见掘金手册「图床替换」。',
      '富文本编辑器（X、小红书、知乎、今日头条）不认 Markdown：打开任务 `url` 的站内原文，用 evaluate 取 `article.prose-tuaran`（或 `main article`）的 HTML，删掉目录、导航、按钮和与标题重复的 h1，把图片和链接改成绝对地址，再用 `page.keyboard.paste({ text, html })` 粘贴进正文；各平台还要做的转换见手册。',
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

export const AGENT_JOB_MODE_RULES = [
  '任务给出「任务地址」和「token」时用任务台模式；任务直接带 Markdown 原文时是离线任务，跳过本节，处理完在对话里回报。',
  '领取：`curl -sS -H "Authorization: Bearer <token>" <任务地址>`。返回 JSON：title、url、summary、tags、platformIds、markdown、harnessVersion、results。按 platformIds 的顺序处理，正文用 markdown 字段。',
  'harnessVersion 与本 skill 版本不一致时先停下，请站长更新 skill。',
  'results 里已有「published / reviewing / draft」结果的平台不要重复发布，先问站长。',
  '每个平台处理完立刻回报，不要等全部结束。用 heredoc 把 JSON 从标准输入传给 curl，避免引号转义：`curl -sS -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" --data-binary @- <任务地址>`，请求体 `{"action":"result","platformId":"juejin","status":"published","articleUrl":"…","notes":"…","playbookDeviation":"…"}`。',
  `status 取值：${Object.entries(RESULT_STATUS_LABELS).map(([key, label]) => `\`${key}\`（${label}）`).join('、')}。notes 写「问题与处理」，playbookDeviation 写「手册偏差」，没有就写「无」。`,
  '全部平台回报后收尾：POST `{"action":"finish"}`。收尾后 token 失效，台账按结果标成完成、部分完成或失败。',
  '接口返回 401 `INVALID_TOKEN` 时 token 已过期或任务已取消：停下，请站长在后台 /admin/article-distribution 重新复制领取指令。',
  'token 只放在命令行参数里，不写进文件、提交或回报内容。',
]
