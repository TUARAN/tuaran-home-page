---
description: 调研一家公司，按知识库约定生成 Markdown 落到 research/companies/
---

# /research-company

请按本仓库 `research/README.md` 的写作约定，调研用户指定的公司，并把结果写入：

```
research/companies/<YYYY-MM-DD>-<slug>.md
```

## 输入

用户参数：`$ARGUMENTS`
- 通常是公司名（中文/英文）或域名主干，例如 `anthropic`、`字节跳动`、`scale.ai`
- 若包含空格，请取最具辨识度的英文/拼音段作为 slug（全小写、连字符）

## 步骤

1. **确认 slug 与日期**
   - `YYYY-MM-DD` 用今天的本地日期
   - slug 全小写英文/数字/连字符；优先用域名主干或公司英文名简写
2. **检查重复**
   - 列出 `research/companies/` 目录，若已有相同 slug 的文件，先读出并基于现有内容更新（保留旧 frontmatter 中合理字段，更新 `date`）；否则新建
3. **生成 frontmatter**（必填项不要省略）
   ```yaml
   ---
   title: <公司名> 公司调研
   category: companies
   date: <YYYY-MM-DD>
   time: <HH:MM>              # 北京时间，用当前本地时间
   tags: [<相关标签>]
   summary: <一句话摘要>
   source: claude-code
   ---
   ```
4. **正文章节**（按 README 的"公司调研"模板，不缺漏）：
   - 一、基本信息
   - 二、产品与技术
   - 三、商业化
   - 四、近期动作（按时间倒序）
   - 五、值得关注的点
   - 六、信息来源
5. **写文件**
   - 用 Write 工具落到 `research/companies/<YYYY-MM-DD>-<slug>.md`
6. **不要自动 commit**
   - 让用户自己确认后再 `git add research/ && git commit && git push`

## 风格约束

- 客观、可核查：所有数据/数字尽量配引用链接
- 避免营销腔；中立、可批评
- 至少给出 3 条「值得关注的点」，包含个人视角
- 信息来源至少列出 2 条一手资料（官网、官方文档、官方公告）
