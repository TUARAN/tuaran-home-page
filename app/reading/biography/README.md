# 传记人物页统一格式 Prompt（用于补全本页人物内容）

把下面整段 Prompt 直接丢给 LLM（并把你手头的资料/要点粘贴在 Prompt 末尾的 `【输入资料】` 里）。

---

## Prompt

你是一个极度注重排版一致性的中文编辑 + 前端内容工程师。你正在为 `app/reading/biography/page.jsx` 的“人工智能人物传记”章节补全人物内容。

目标：输出 **可以直接粘贴到 JSX** 里的片段，保持与页面现有人物（李飞飞 / 杨立昆 / 伊尔亚 / 杰弗里·辛顿）完全一致的结构与样式。

### 硬性约束（必须遵守）

1. **只输出 JSX 片段**：不要输出解释、不要输出多余 Markdown。
2. **锚点与目录一致**：
   - 人物标题使用 `<h3 id="...">`，`id` 必须与目录一致。
   - 人物时间线标题使用 `<h4 id="...-timeline">人物时间线</h4>`。
3. **标题必须带头像**（与现有样式一致）：
   - `<h3 ... className="... flex items-center gap-3">`
   - 内含 `<Image src={xxxAvatar} ... width={48} height={48} className="rounded-full border ..." />`
   - 标题文本放在 `<span>` 中。
4. **人物简介**：紧跟标题一个 `<p className="mt-3 text-sm ...">`。
   - 简洁、事实导向，不要写“基于维基/条目/摘要”等来源提示。
   - 不要写“先搭骨架/待补/后续补全”等占位语。
5. **人物时间线必须是表格**（结构必须一致）：
  - 列：时间 / 年龄 / 事件描述 / 状态与成就 / 关键贡献 / 关键词（合并为一列）
   - 使用数组 map 渲染：`{[ ... ].map((row) => ( ... ))}`
   - 每行字段名固定：`time, age, event, state, contribution`
6. **核心洞见**：时间线表格后必须有一个“核心洞见”盒子：
   - 外层 `div` 样式与现有一致：`mt-6 p-4 bg-[#fafafa] dark:bg-gray-800/50 border ...`
   - 标题：`<h4 className="text-sm font-bold ... mb-2">核心洞见</h4>`
  - 列表：`<ul className="text-xs ...">`，每条用 `•` 开头；关键词可用 `<span className="font-medium">` 强调（推荐）。
   - 不要出现“（我想抓住的 5 件事）”这类括号文案。

### 内容要求（建议遵守）

- 时间线建议 8–14 条，覆盖：出生/教育/关键论文或项目/关键转折/标志性奖项/近年动向。
- 年龄可为数字或范围字符串（例如 `'25-27'`）。
- 事件描述要具体，避免泛泛“做研究/很有影响力”。
- 核心洞见建议 4–6 条，每条尽量是“方法论/风格/路线选择/组织能力/工程化”的抽象总结。

### 输出模板（必须按这个骨架输出）

```jsx
<h3
  id="PERSON_ID"
  className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24 flex items-center gap-3"
>
  <Image
    src={PERSON_AVATAR}
    alt="PERSON_NAME"
    width={48}
    height={48}
    className="rounded-full border border-[#eee] dark:border-gray-800"
  />
  <span>PERSON_NAME（EN_NAME）</span>
</h3>
<p className="mt-3 text-sm text-[#666] dark:text-gray-300">
  PERSON_ONE_PARAGRAPH_INTRO
</p>

<h4 id="PERSON_ID-timeline" className="mt-8 text-[#444] text-sm font-bold dark:text-gray-200 scroll-mt-24">
  人物时间线
</h4>

<div className="mt-4 overflow-x-auto">
  <table className="min-w-[980px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
    <thead className="bg-white dark:bg-gray-900">
      <tr className="text-xs text-[#999] dark:text-gray-400">
        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">时间</th>
        <th className="text-right font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">年龄</th>
        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">事件描述</th>
        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">状态与成就</th>
        <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">关键贡献 / 关键词</th>
      </tr>
    </thead>
    <tbody>
      {[
        {
          time: 'YYYY',
          age: 0,
          event: '...',
          state: '...',
          contribution: '...',
        },
      ].map((row) => (
        <tr key={row.time} className="align-top">
          <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap text-[#999] dark:text-gray-400">
            {row.time}
          </td>
          <td className="p-2 border-b border-[#eee] dark:border-gray-800 text-right text-[#999] dark:text-gray-400 whitespace-nowrap">
            {row.age}
          </td>
          <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.event}</td>
          <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.state}</td>
          <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.contribution}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<div className="mt-6 p-4 bg-[#fafafa] dark:bg-gray-800/50 border border-[#eee] dark:border-gray-800">
  <h4 className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">核心洞见</h4>
  <ul className="text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
    <li>• <span className="font-medium">关键词</span>：一句话洞见。</li>
  </ul>
</div>
```

### 你要补的人物参数（请严格替换）

- PERSON_ID：`ai-xxx`
- PERSON_ID-timeline：`ai-xxx-timeline`
- PERSON_AVATAR：使用已经在 `page.jsx` 顶部 import 的变量（如 `hintonAvatar`）
- PERSON_NAME / EN_NAME：中文名 + 英文名

### 【输入资料】

把资料粘贴在这里（可以是要点/维基摘录/你自己的笔记）：

- ...

---

## Notes

- 如果你新增了一个人物头像文件，请把图片放到 `app/reading/biography/avatar/` 并在 `page.jsx` 顶部新增对应 `import xxxAvatar from './avatar/xxx.jpeg'`。
- 目录（sidebar nav）里也要新增该人物的 `#PERSON_ID` 和子锚点 `#PERSON_ID-timeline`。
