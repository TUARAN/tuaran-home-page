---
title: MCP（Model Context Protocol）调研
category: topics
date: 2026-05-15
tags: [AI, MCP, 协议, Agent]
summary: MCP 是 Anthropic 主导的开放协议，为大模型应用统一接入外部数据与工具。
source: manual
---

> 本文为示例占位调研，正式调研由 Claude Code / CodeX 按 `research/README.md` 约定生成。

## 一、是什么

MCP（Model Context Protocol，模型上下文协议）是 Anthropic 在 2024 年底推出的开放协议，
目标是为大模型应用与外部数据源、工具、服务之间提供一套**标准化、双向、可发现**的连接方式，
对标"AI 应用领域的 USB-C"。

## 二、为什么重要

- 解决"每个 LLM 应用都要自己写一套外部集成"的重复劳动
- 工具与数据源**实现一次**，所有支持 MCP 的客户端（Claude Desktop / Claude Code / Cursor / 其他）都能用
- 让能力解耦：模型方专注模型，工具方专注工具，应用方专注产品

## 三、关键玩家与生态

- 协议主导：Anthropic
- 早期接入：Claude Desktop、Claude Code、Zed、Cursor、Continue 等
- 第三方 MCP Server 生态：GitHub、Slack、Notion、Postgres、Filesystem 等大量官方/社区实现

## 四、技术细节

- 通信：JSON-RPC over stdio / HTTP（SSE）
- 能力分层：Tools（动作）/ Resources（数据）/ Prompts（提示词模板）
- 客户端 ↔ 服务端 双向：服务端也可以请求客户端做采样（sampling）

## 五、争议与风险

- 安全：远程 MCP Server 需要鉴权、最小权限、审计支持
- 标准统一性：与 OpenAI Function Calling、各家 Agent 框架并存
- 生态成熟度：实现质量参差，需要 curated 列表

## 六、个人结论

- MCP 是当前最值得跟进的"AI 应用集成"开放标准
- 自有工具/内部系统优先考虑封装为 MCP Server，可一次接入多个客户端
- 长期看可能会演化为某种"AI 操作系统"的事实接口层

## 七、信息来源

- [MCP 官方文档](https://modelcontextprotocol.io)
- [Anthropic MCP 公告](https://www.anthropic.com/news/model-context-protocol)
