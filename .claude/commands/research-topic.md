---
description: 调研一项技术/概念/事项，按当前生效的调研风格模版生成 Markdown 落到 research/topics/
---

# /research-topic

调研用户指定的事项（技术、协议、概念、产品、事件、行业……），结果写入：

```
research/topics/<YYYY-MM-DD>-<slug>.md
```

## 风格正本（执行前必读）

写作结构与措辞规则的**唯一正本**是 `lib/researchStyleTemplates.js` 中 `status === 'active'` 的版本
（当前为 v3 · 全文范式版；站长可在 /admin/research-style 查看版本史）。

**动笔前先读该文件的 active 版本**，全文按其 `principles`（七段骨架、事实研判分离、表格优先、
先结论后展开）与 `howToApply`（frontmatter 分工、未能验证清单、收口三件套、措辞 grep 黑名单）执行。
本文件不再复述规则内容，避免多处漂移；`research/README.md` 的旧六节模板仅作最低保底，冲突时以 active 版本为准。

topics 类补充两点：
- 研判层须给出明确的「跟进 / 不跟进 / 观望」判断与下一步
- 技术类信息来源必须包含官方文档链接

## 输入

用户参数：`$ARGUMENTS`
- 通常是事项名，例如 `mcp-protocol`、`agentic-rag`、`端侧推理`、`webgpu`
- 若是中文，请取常见英文译名作为 slug；若是英文，全小写连字符

## 步骤

1. **读风格正本**：`lib/researchStyleTemplates.js` 的 active 版本
2. **确认 slug 与日期**：`YYYY-MM-DD` 用今天的本地日期；slug 全小写英文/数字/连字符
3. **检查重复**：列出 `research/topics/`，若同 slug 已存在，基于现有内容更新（保留合理 frontmatter，更新 `date`）而非新建
4. **frontmatter 字段定义**见 `research/README.md`（category 为 `topics`；`topic_type` / `assistance` / `model` / `pv` 必填；`time` 用当前北京时间）；summary / tldr 的分工按风格正本执行
5. **正文**按风格正本的七段骨架写作
6. **写文件**：用 Write 工具落到 `research/topics/<YYYY-MM-DD>-<slug>.md`
7. **不要自动 commit**：让用户自己确认后再 `git add research/ && git commit && git push`
