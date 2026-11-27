// 分发智能体的 harness：账号、安全规则、内容处理、核对与回报格式。
// skill（./skill.js）和任务提示词（./taskPrompt.js）都从这里取规则，不另写一份。
// 规则或手册（./playbooks.js）有改动时提升 HARNESS_VERSION，并运行 `npm run distributor:skill` 重新生成 skill。

export const HARNESS_VERSION = '1.0.0'

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
      '正文里指代站点的「本站」改成「我的个人站」，其他内容不改写。',
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
