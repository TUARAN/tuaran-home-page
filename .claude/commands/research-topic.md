---
description: 调研一项技术/概念/事项，按知识库约定生成 Markdown 落到 research/topics/
---

# /research-topic

请按本仓库 `research/README.md` 的写作约定，调研用户指定的事项（技术、协议、概念、产品、事件、行业……），
并把结果写入：

```
research/topics/<YYYY-MM-DD>-<slug>.md
```

## 输入

用户参数：`$ARGUMENTS`
- 通常是事项名，例如 `mcp-protocol`、`agentic-rag`、`端侧推理`、`webgpu`
- 若是中文，请取常见英文译名作为 slug；若是英文，全小写连字符

## 步骤

1. **确认 slug 与日期**
   - `YYYY-MM-DD` 用今天的本地日期
   - slug 全小写英文/数字/连字符
2. **检查重复**
   - 列出 `research/topics/` 目录，若同 slug 已存在，更新而非新建（保留合理 frontmatter，更新 date）
3. **生成 frontmatter**
   ```yaml
   ---
   title: <事项名> 调研
   category: topics
   date: <YYYY-MM-DD>
   tags: [<相关标签>]
   summary: <一句话摘要>
   source: claude-code
   ---
   ```
4. **正文章节**（按 README 的"事项调研"模板，不缺漏）：
   - 一、是什么
   - 二、为什么重要
   - 三、关键玩家与生态
   - 四、技术 / 实施细节
   - 五、争议与风险
   - 六、个人结论（一句话定性 + 是否跟进 + 下一步）
   - 七、信息来源
5. **写文件**
   - 用 Write 工具落到 `research/topics/<YYYY-MM-DD>-<slug>.md`
6. **不要自动 commit**
   - 让用户自己确认后再 `git add research/ && git commit && git push`

## 风格约束

- 中立、可批评，避免单边吹捧
- 第六节「个人结论」必须给出明确的"跟进 / 不跟进 / 观望"判断与理由
- 信息来源至少 2 条一手资料；技术类必须包含官方文档链接
