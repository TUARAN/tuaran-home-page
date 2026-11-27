// 平台手册（playbook）：分发智能体在每个平台上的操作要点。
// 每条手册来自一次真实发布的实测；verifiedAt 是最近一次实测日期。
// 平台改版、智能体回报「手册偏差」后在这里更新，并提升 ./harness.js 的 HARNESS_VERSION。

export const DISTRIBUTION_PLAYBOOKS = {
  juejin: {
    verifiedAt: '2026-11-26',
    entry: 'https://juejin.cn/editor/drafts/new?v=2',
    login: '页面弹出登录框，或右上角出现「登录」按钮，就是未登录。',
    steps: [
      '编辑器是 bytemd（CodeMirror）。标题填入顶部标题输入框；正文用下方片段一次性写入，不要逐字输入。',
      '写入后检查预览：外链图片可能显示「转存失败」。失败的图片先下载到本地，再用工具栏的图片上传按钮逐张上传，替换为掘金图床地址。',
      '点「发布」打开弹窗：分类按内容选（技术文章一般选「人工智能」或「前端」）；标签要先聚焦 `.publish-popup input.byte-select__input` 再输入，然后点击匹配的 `.byte-select-option`，最多 3 个；封面选正文第一张图；摘要 50–100 字。',
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
}

export const DISTRIBUTION_AGENT_PLATFORM_IDS = Object.keys(DISTRIBUTION_PLAYBOOKS)

export function getDistributionPlaybook(id) {
  return DISTRIBUTION_PLAYBOOKS[String(id || '').trim().toLowerCase()] || null
}
