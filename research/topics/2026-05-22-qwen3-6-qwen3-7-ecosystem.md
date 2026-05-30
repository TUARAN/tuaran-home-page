---
title: Qwen3.6 与 Qwen3.7 生态调研
category: topics
topic_type: tech
date: 2026-05-22
tags: [Qwen, 大模型, 开源模型, Agent, 多模态, 本地部署, 模型生态]
summary: Qwen3.6 是 Qwen 在 2026 年 4 月推出的开源权重小型旗舰线，官方 Hugging Face Collection 当前包含 4 个条目；Qwen3.7 则在 2026 年 5 月以 Qwen3.7-Max 的闭源服务化旗舰形态发布，核心定位从“可本地部署的 agentic coding 模型”升级到“长周期 Agent 工作负载模型”。两代共同指向一个趋势：Qwen 正在把开源权重生态、工具调用、长上下文、多模态和服务化旗舰模型组合成完整开发者基础设施。
assistance: codex
pv: 0
---

> **信息来源说明**：本调研基于 Qwen 官方博客 / Alibaba Cloud Community、Hugging Face 官方 Qwen 模型卡、Hugging Face Collection、vLLM recipes、ModelScope / 第三方模型平台索引、TechNode / CnTechPost 等公开资料整理。Qwen3.7 仍处于刚发布阶段，部分信息仅有服务化模型与媒体报道，未公开权重、参数规模和完整模型卡；下文出现此类数据时统一标注"未公开"或"估算"。

## 一、核心结论

- **Qwen3.6 官方开源家族数量**：**4 个 Hugging Face 官方条目**，分别为 Qwen3.6-35B-A3B、Qwen3.6-35B-A3B-FP8、Qwen3.6-27B、Qwen3.6-27B-FP8。
- **Qwen3.6 核心定位**：面向 agentic coding、仓库级推理、多模态理解、长上下文与本地 / 私有化部署的开源权重模型线。
- **Qwen3.7 当前官方公开形态**：**Qwen3.7-Max**，服务化 / 闭源旗舰 Agent 模型；公开权重数量为 **0**。
- **Qwen3.7 Preview 形态**：公开报道和社区测试中出现 **Qwen3.7-Max-Preview、Qwen3.7-Plus-Preview**；是否作为正式模型计数，需等 Qwen 官方模型卡 / API 文档确认。
- **CoPaw-Flash / QwenPaw-Flash 口径**：这是一条重要的官方 AgentScope 衍生线，旧名 **CoPaw-Flash**、现名 **QwenPaw-Flash**；它不是 Qwen3.6 主家族成员，但代表“官方专项微调 + Flash 小模型 + Agent 数据蒸馏”的路线。
- **生态规模**：Qwen3.6 两个主底座在 HF Model Tree 下已有 **约 1,100+ 衍生条目**，其中量化模型占大头；去重后有效社区模型估算 **500-800 个**。
- **代际方向**：Qwen3.6 解决“开源可用、开发者能跑、工具能接”；Qwen3.7 重点冲“长周期自主 Agent、复杂工具链、35 小时级连续任务”。

## 二、基础背景

### 2.1 系列名称与团队

| 项目 | 内容 |
|---|---|
| 模型系列 | Qwen3.6 / Qwen3.7 |
| 开发团队 | Alibaba Cloud / Qwen Team / 通义千问团队 |
| 所属公司 | 阿里巴巴集团 / 阿里云 |
| 前身 | Qwen3、Qwen3.5、Qwen3-Next、Qwen3-Coder 等 |
| 开源平台 | Hugging Face、ModelScope |
| 服务入口 | Qwen Chat、DashScope / Alibaba Cloud Model Studio、第三方 API 平台 |

### 2.2 首次发布时间

| 时间 | 事件 | 说明 |
|---|---|---|
| 2026-02 | Qwen3.5 系列发布 | Qwen3.6 的直接前身 |
| 2026-04 | Qwen3.6-35B-A3B 发布 | 官方称为 Qwen3.6 第一个 open-weight 版本 |
| 2026-04 | Qwen3.6-27B 发布 | 27B dense 多模态模型，主打旗舰级 coding 能力 |
| 2026-05-20 / 05-21 | Qwen3.7-Max 发布 | 面向 Agent 工作负载的闭源服务化旗舰 |

### 2.3 开源协议

| 系列 | 权重状态 | 协议 |
|---|---|---|
| Qwen3.6-35B-A3B | 开源权重 | Apache-2.0 |
| Qwen3.6-27B | 开源权重 | Apache-2.0 |
| Qwen3.6 FP8 版本 | 官方量化权重 | Apache-2.0 |
| Qwen3.7-Max | 未开放权重 | 服务化 / 闭源，协议未按开源模型披露 |

### 2.4 基座架构与原生能力

| 模型 | 架构 | 参数 | 上下文 | 原生能力 |
|---|---|---:|---:|---|
| Qwen3.6-27B | Dense + Vision Encoder + Gated DeltaNet / Gated Attention 混合结构 | **27B** | **262,144 tokens**，YaRN 可扩展到约 **1,010,000** | 文本、图像、视频输入，代码、工具调用、长上下文 |
| Qwen3.6-35B-A3B | MoE + Vision Encoder + Gated DeltaNet / Gated Attention 混合结构 | **35B total / 3B active** | **262,144 tokens**，YaRN 可扩展到约 **1,010,000** | 多模态、代码、Agent、工具调用、长视频 / 长文档 |
| Qwen3.7-Max | 未公开 | 未公开 | 未公开；官方评测覆盖 128K MRCR-v2 等长上下文任务 | 复杂 Agent、代码调试、办公自动化、长周期工具调用 |

> **关键判断**：Qwen3.6 的技术核心在于组合 **Gated DeltaNet、Gated Attention、MTP、多模态 Encoder、262K 长上下文**，已经超出传统 Transformer Dense/MoE 二分；Qwen3.7-Max 则进一步把能力目标从“模型能力”推向“Agent 稳定执行能力”。

## 三、官方完整家族

### 3.1 Qwen3.6 官方开源家族

Hugging Face 官方 Qwen3.6 Collection 当前显示 **4 个条目**：

| 模型 | 类型 | 参数 | 架构 | 上下文 | 发布时间 | 备注 |
|---|---|---:|---|---:|---|---|
| Qwen3.6-35B-A3B | 主模型 | **35B / 3B active** | MoE，多模态 | **262K**，可扩展约 **1.01M** | 2026-04 | 首个 Qwen3.6 open-weight 版本 |
| Qwen3.6-35B-A3B-FP8 | 官方量化 | **35B / 3B active** | MoE，多模态 | **262K** | 2026-04 | 官方 FP8 权重 |
| Qwen3.6-27B | 主模型 | **27B** | Dense，多模态 | **262K**，可扩展约 **1.01M** | 2026-04 | 旗舰级 coding dense 模型 |
| Qwen3.6-27B-FP8 | 官方量化 | **27B** | Dense，多模态 | **262K** | 2026-04 | 官方 FP8 权重 |

**官方开源版本总数：4。**

### 3.2 Qwen3.7 官方服务化家族

| 模型 | 类型 | 权重 | 参数 | 上下文 | 发布时间 | 状态 |
|---|---|---|---:|---:|---|---|
| Qwen3.7-Max | 服务化旗舰 | 未开放 | 未公开 | 未公开 | 2026-05-20 / 05-21 | 已发布 / API 即将或逐步开放 |
| Qwen3.7-Max-Preview | 预览版 | 未开放 | 未公开 | 未公开 | 2026-05 | 社区和媒体报道出现 |
| Qwen3.7-Plus-Preview | 预览版 | 未开放 | 未公开 | 未公开 | 2026-05 | 社区和媒体报道出现 |

**Qwen3.7 已确认正式模型数量：1（Qwen3.7-Max）。**  
**Qwen3.7 公开权重数量：0。**  
**若把 Preview 名称也计入服务化变体：约 3 个。**

### 3.3 Flash / Plus / Max

| 层级 | Qwen3.6 | Qwen3.7 | 说明 |
|---|---|---|---|
| Flash | 未见 Qwen3.6 官方开源权重同名模型 | 未确认 | 通常为服务化轻量 / 低价路线，需等 DashScope 文档 |
| Plus | Qwen3.6-Plus 在社区和 API 语境出现，但缺少公开权重模型卡 | Qwen3.7-Plus-Preview 出现在公开测试语境 | 服务化中档模型 |
| Max | Qwen3.6-Max-Preview 在社区语境出现 | **Qwen3.7-Max** 正式发布 | 闭源旗舰，面向复杂 Agent |

> **口径说明**：开源权重统计以 Hugging Face Qwen 官方 Collection 为准；Plus / Max 这类服务化版本应与开源权重分开统计。

## 四、官方衍生 / 子模型 / 专用模型

### 4.1 Qwen3.6 官方专项方向

Qwen3.6 本身没有拆成 Qwen3.6-Coder、Qwen3.6-Agent、Qwen3.6-LongContext 等独立命名专用模型；它把专项能力整合进主模型：

| 方向 | 代表 | 数量 |
|---|---|---:|
| Agentic Coding | Qwen3.6-27B、Qwen3.6-35B-A3B | **2 个主模型** |
| 多模态 | 两个主模型均带 Vision Encoder | **2 个主模型** |
| 长上下文 | 两个主模型均 262K 原生上下文，可扩展约 1.01M | **2 个主模型** |
| 官方 FP8 量化 | Qwen3.6-27B-FP8、Qwen3.6-35B-A3B-FP8 | **2 个量化版本** |
| MTP / 推理加速 | 模型卡明确支持 multi-step MTP | **2 个主模型** |

### 4.2 Qwen3 生态同期专项模型

这些不是 Qwen3.6 / Qwen3.7 命名，但属于同一 Qwen3 代际生态：

| 方向 | 官方系列 | 数量级 |
|---|---|---:|
| 代码 | Qwen3-Coder、Qwen3-Coder-Next | **数个模型 / Collection** |
| 多模态 | Qwen3-VL、Qwen3-Omni | **多尺寸、多变体** |
| Embedding / Reranking | Qwen3-Embedding、Qwen3-Reranker、Qwen3-VL-Embedding / Reranker | **0.6B / 4B / 8B 等尺寸** |
| 语音 | Qwen3-ASR、Qwen3-TTS | **专项模型线** |
| 安全 | Qwen3Guard | **安全分类 / 守护模型线** |
| 机制解释 | Qwen-Scope | **14 组 SAE，覆盖 7 个 Qwen3 / Qwen3.5 变体** |

### 4.3 CoPaw-Flash / QwenPaw-Flash：官方 Agent 衍生线

**CoPaw-Flash-9B** 需要单独看。它不是 Qwen3.6 官方主家族，也不是普通社区微调；它属于 AgentScope 团队基于 Qwen3.5 系列推出的官方 Agent 衍生线，后续官方仓库命名从 **CoPaw-Flash** 调整为 **QwenPaw-Flash**。

| 模型 | 当前官方命名 | 底座 / 关系 | 参数 | 定位 |
|---|---|---|---:|---|
| CoPaw-Flash-9B | QwenPaw-Flash-9B | 基于 Qwen3.5-9B 的 Agent / tool-use 微调 | **9B** | 轻量 Agent、工具调用、快速任务执行 |
| CoPaw-Flash-9B-Preview | QwenPaw-Flash-9B-Preview | 早期预览 | **9B** | 预览版能力验证 |
| CoPaw-Flash-9B-FP8 | QwenPaw-Flash-9B-FP8 | 官方 FP8 量化 | **9B** | 低显存部署 |
| CoPaw-Flash-9B-GGUF | QwenPaw-Flash-9B-GGUF | 官方 / 准官方 GGUF 分发 | **9B** | llama.cpp / Ollama / LM Studio 本地生态 |
| CoPaw-Flash-9B-GPTQ-Int4 | QwenPaw-Flash-9B-GPTQ-Int4 | 官方 / 准官方 GPTQ 量化 | **9B** | INT4 GPU 推理 |
| CoPaw-Flash-9B-AWQ | QwenPaw-Flash-9B-AWQ | 官方 / 准官方 AWQ 量化 | **9B** | INT4 GPU 推理 |
| CoPaw-Flash-9B-GPTQ-Int8 | QwenPaw-Flash-9B-GPTQ-Int8 | 官方 / 准官方 GPTQ 量化 | **9B** | INT8 GPU 推理 |

**该衍生线官方 Collection 数量：约 7 个条目。**

它的重要性在于：

- **不是主模型家族**：不能把它算进 Qwen3.6 官方 4 个主条目。
- **是官方专项微调**：它代表 Qwen 官方生态在 Agent / tool-use 方向做轻量专项模型。
- **底座更小**：9B 级别比 Qwen3.6-27B / 35B-A3B 更适合低成本本地 Agent。
- **量化更完整**：FP8、GGUF、GPTQ、AWQ 等格式齐全，说明官方希望它直接进入本地部署生态。
- **与 Qwen3.7 路线呼应**：Qwen3.7-Max 做闭源旗舰 Agent，QwenPaw-Flash-9B 做开源轻量 Agent，两者构成“服务化旗舰 + 本地小模型”的双线布局。

> **关键判断**：CoPaw-Flash-9B / QwenPaw-Flash-9B 是 Qwen 生态里非常值得重点关注的“官方衍生模型”：它主攻 Agent、工具调用、轻量部署和可量化分发，不追求通用最强。

### 4.4 官方量化 / 蒸馏 / 轻量

| 类型 | 官方代表 | 数量 |
|---|---|---:|
| FP8 | Qwen3.6-27B-FP8、Qwen3.6-35B-A3B-FP8 | **2** |
| QwenPaw-Flash 官方量化 | QwenPaw-Flash-9B-FP8 / GGUF / GPTQ / AWQ / GPTQ-Int8 | **约 5 个量化条目** |
| INT4 / GGUF | Qwen3.6 官方主仓未直接发布 GGUF / INT4；QwenPaw-Flash 已有对应分发 | Qwen3.6：**0**；QwenPaw：**多格式** |
| 蒸馏 / Agent 数据微调 | QwenPaw-Flash-9B 属于 Agent 专项衍生；公开细节有限 | **1 条主线** |
| 服务化闭源 | Qwen3.7-Max | **1 正式** |

## 五、社区微调生态

### 5.1 最活跃底座

| 底座 | 活跃原因 | HF 可见量级 |
|---|---|---:|
| Qwen3.6-27B | Dense、能力强、部署相对直接，社区更易量化 | Model Tree：Adapters **52**、Finetunes **182**、Merges **4**、Quantizations **369** |
| Qwen3.6-35B-A3B | MoE 仅 3B active，适合低成本推理和实验 | Model Tree：Adapters **21**、Finetunes **129**、Merges **1**、Quantizations **377** |
| Qwen3.6-27B-FP8 | 官方轻量权重，利于服务部署 | 主要作为部署版本 |
| Qwen3.6-35B-A3B-FP8 | 官方轻量权重，利于服务部署 | 主要作为部署版本 |

按 HF Model Tree 简单相加，Qwen3.6 两个主底座已有 **1,135 个**衍生条目；考虑同一模型多格式重复、GGUF 多量化档位重复、镜像仓重复，去重后的有效社区模型估算 **500-800 个**。

### 5.2 社区主要微调方向

| 方向 | 占比判断 | 典型内容 |
|---|---|---|
| 量化 | 最高 | GGUF、AWQ、GPTQ、AutoRound、NVFP4、FP8、IQ4_XS、Q4_K_M |
| 代码 / Agent | 高 | Claude / Opus / Sonnet reasoning distill、repo-level coding、tool-call 优化 |
| Uncensored / Abliterated | 高 | HauhauCS、Heretic、Huihui、AEON 等 |
| 长上下文 | 中 | MTP 保留、KV cache 优化、YaRN 长上下文实践 |
| 中文 / 通用聊天 | 中 | 中文对话、角色、医疗 / 法律 / 教育类微调 |
| 多模态 | 中 | 保留 image-text-to-text 能力的量化与微调 |
| 行业应用 | 中低 | 安全、金融、医疗、科研、办公自动化 |
| CoPaw / QwenPaw 二次衍生 | 中 | 围绕 QwenPaw-Flash-9B 的 GGUF、角色、tool-use、低显存部署再包装 |

### 5.3 CoPaw-Flash / QwenPaw 社区衍生

CoPaw-Flash-9B / QwenPaw-Flash-9B 因为尺寸小、Agent 定位明确、官方量化格式齐全，很容易形成二次衍生：

| 方向 | 社区玩法 | 数量级判断 |
|---|---|---:|
| GGUF 再分发 | Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0 等多档位 | **十数个文件 / 仓库级变体** |
| Ollama / LM Studio 包装 | Modelfile、预设 system prompt、工具调用模板 | **低到中** |
| Agent prompt 模板 | 浏览器操作、MCP、代码执行、Shell 工具调用 | **中** |
| Uncensored / Roleplay | 基于 9B 底座做轻量去审查或角色化 | **低到中** |
| 任务型微调 | 信息抓取、自动化办公、代码修复、网页操作 | **早期，数量不大** |

估算口径：

- 官方 QwenPaw / CoPaw Collection：**约 7 个条目**。
- 社区二次衍生：当前估算 **20-80 个**，主要集中在 GGUF / Ollama / prompt template / tool-use 包装。
- 相比 Qwen3.6-27B / 35B-A3B 的 **500-800 有效社区模型**，QwenPaw 生态还小，但方向更聚焦。

### 5.4 代表性社区模型

| 模型 / 作者 | 底座 | 特点 |
|---|---|---|
| AgentScope/QwenPaw-Flash-9B | Qwen3.5-9B 衍生 | 官方 AgentScope 衍生主模型，旧称 CoPaw-Flash-9B |
| AgentScope/QwenPaw-Flash-9B-GGUF | QwenPaw-Flash-9B | 官方 / 准官方 GGUF 分发，面向本地 Agent |
| AgentScope/QwenPaw-Flash-9B-AWQ | QwenPaw-Flash-9B | AWQ INT4 推理版本 |
| unsloth/Qwen3.6-27B-GGUF | 27B | 高下载量 GGUF，面向 llama.cpp / LM Studio / Ollama 本地生态 |
| unsloth/Qwen3.6-27B-NVFP4 | 27B | NVFP4 量化，面向新 GPU / 高效推理 |
| DavidAU/Qwen3.6-27B-Heretic-Uncensored-FINETUNE-NEO-CODE-Di-IMatrix-MAX-GGUF | 27B | Uncensored + code 方向 + GGUF |
| HauhauCS/Qwen3.6-27B-Uncensored-HauhauCS-Aggressive | 27B | 激进去审查方向 |
| HauhauCS/Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive | 35B-A3B | MoE 底座去审查方向 |
| llmfan46/Qwen3.6-27B-uncensored-heretic-v2-Native-MTP-Preserved | 27B | 强调保留 Native MTP |
| llmfan46/Qwen3.6-35B-A3B-uncensored-heretic-Native-MTP-Preserved | 35B-A3B | MoE + MTP 保留 + 多量化格式 |
| z-lab/Qwen3.6-27B-DFlash | 27B | 压缩 / 快速推理实验 |
| cyankiwi/Qwen3.6-27B-AWQ-INT4 | 27B | AWQ INT4 部署版本 |
| ggml-org/Qwen3.6-27B-MTP-GGUF | 27B | ggml / llama.cpp 生态 MTP GGUF |

> **生态判断**：Qwen3.6 社区明显偏 **量化、Agent、代码、MTP 保留、长上下文、去审查实验**，传统“聊天微调”占比不再是主线。

## 六、版本演进与代际关系

### 6.1 前身模型

| 代际 | 代表 | 关系 |
|---|---|---|
| Qwen3 | 0.6B、1.7B、4B、8B、14B、32B、30B-A3B、235B-A22B 等 | 通用开源大模型基础代 |
| Qwen3.5 | 27B、35B-A3B、122B-A10B、397B-A17B 等 | 更强 coding / reasoning / MoE 实验 |
| Qwen3.6 | 27B、35B-A3B | 小型旗舰，强调稳定、真实开发、agentic coding |
| Qwen3.7 | Max | 闭源服务化旗舰，强调长周期 Agent |

### 6.2 本代核心改进

| 维度 | Qwen3.6 | Qwen3.7 |
|---|---|---|
| 架构 | Gated DeltaNet + Gated Attention + MTP + 多模态 | 未公开 |
| 目标 | 开源权重、稳定可部署、coding / agent 实用性 | 长周期 Agent、复杂工具链、持续执行 |
| 上下文 | 262K 原生，YaRN 到约 1.01M | 未公开；评测覆盖长上下文和工具链 |
| 部署 | HF / ModelScope / vLLM / SGLang / KTransformers / Transformers | 服务化 API |
| 生态 | 社区量化和微调极快 | 刚发布，社区只能通过 API / Chat 评测 |

### 6.3 关键技术跃迁

- **Qwen3 → Qwen3.5**：MoE 大模型与 coding / reasoning 能力增强。
- **Qwen3.5 → Qwen3.6**：把能力下沉到 **27B dense / 35B-A3B MoE**，让中小规模模型具备接近旗舰的 coding / agent 表现。
- **Qwen3.6 → Qwen3.7**：从“可开源部署模型”转向“Agent frontier 模型”，重点是工具调用稳定性、长周期执行和真实任务闭环。

### 6.4 下一代路线图

官方未披露完整 Qwen3.8 / Qwen4 路线图。按当前趋势推断：

- Qwen3.7-Max 先以服务化旗舰验证 Agent 能力。
- 若延续 Qwen 节奏，后续可能出现 Qwen3.7-Plus / Flash API 稳定版。
- 是否开放 Qwen3.7 权重、是否有 27B / 35B-A3B 开源版，**截至 2026-05-22 未确认**。
- 开源侧更可能继续围绕 **Agent、coding、多模态、长上下文、小 MoE / dense 高性价比模型**推进。

## 七、硬件与部署生态

### 7.1 权重显存 / 内存需求估算

以下为只加载权重的粗略估算，不含长上下文 KV cache、batch、视觉输入缓存和推理框架开销。

| 模型 | BF16 / FP16 | FP8 | INT4 / GGUF Q4 | 实用建议 |
|---|---:|---:|---:|---|
| Qwen3.6-27B | **54-56GB** | **28-32GB** | **14-18GB** | 24GB 显卡可短上下文本地跑 Q4；生产长上下文需多卡 |
| Qwen3.6-35B-A3B | **70-75GB** | **36-42GB** | **18-24GB** | MoE active 低但全权重要加载；12-24GB 可尝试低比特 GGUF，长上下文需降窗口 |
| Qwen3.7-Max | 未公开 | 未公开 | 不适用 | 仅服务化，无法本地部署 |

### 7.2 长上下文显存现实

Qwen3.6 模型卡建议：

- 默认上下文 **262,144 tokens**。
- 遇到 OOM 可降低上下文。
- 为保留复杂任务 thinking 能力，建议上下文至少 **128K**。
- vLLM / SGLang 官方示例常用 **8 GPUs** 跑 262K。

实际部署判断：

| 场景 | 可行配置 |
|---|---|
| 4K-16K 聊天 / 代码辅助 | 16-24GB 消费级 GPU + Q4 / IQ4 |
| 32K-64K 仓库分析 | 24-48GB 显存更稳 |
| 128K 长上下文 | 多卡或高显存 GPU |
| 262K 官方满上下文 | 推荐多卡，官方示例多为 **8 卡 tensor parallel** |
| 1M YaRN 扩展 | 研究 / 特殊生产场景，不适合普通本地部署 |

### 7.3 推理框架支持

| 框架 | 支持状态 | 说明 |
|---|---|---|
| Hugging Face Transformers | 官方支持 | 适合测试和中低并发 |
| vLLM | 官方模型卡示例支持；推荐 vLLM >= 0.19.0 | 支持 OpenAI-compatible API、tool-call parser、MTP |
| SGLang | 官方模型卡示例支持；推荐 sglang >= 0.5.10 | 支持 tool use、MTP、长上下文 |
| KTransformers | 官方提及支持 | 适合 CPU-GPU 异构与 MoE 优化实验 |
| llama.cpp / GGUF | 社区支持成熟 | 主要依赖 unsloth、ggml-org、bartowski、社区 GGUF |
| Ollama / LM Studio | 通过 GGUF 间接支持 | 适合本地体验 |
| TensorRT-LLM | 理论可适配，公开资料少于 vLLM / SGLang | 生产部署需自行验证 |
| Docker Model Runner | HF 页面给出入口 | 适合快速试跑 |

### 7.4 量化生态成熟度

| 维度 | 判断 |
|---|---|
| 官方 FP8 | 成熟，官方提供 2 个 Qwen3.6 FP8 仓库 |
| GGUF | 非常活跃，Qwen3.6-27B / 35B-A3B 均有大量社区版本 |
| AWQ / GPTQ / AutoRound | 活跃，适合服务端 INT4 |
| NVFP4 | 活跃，面向新硬件 |
| MTP 保留 | 社区重点方向之一，但不同量化版本质量差异大 |
| 长上下文量化 | 可用但不稳定，KV cache 与框架版本影响大 |

## 八、Qwen3.7-Max 能力节点

公开资料显示，Qwen3.7-Max 的主要指标集中在 Agent：

| 指标 | 数值 |
|---|---:|
| Terminal-Bench 2.0-Terminus | **69.7** |
| SWE-Verified | **80.4** |
| SWE-Pro | **60.6** |
| SWE-Multilingual | **78.3** |
| SciCode | **53.5** |
| MCP-Mark | **60.8** |
| MCP-Atlas | **76.4** |
| SkillsBench | **59.2** |
| Kernel Bench L3 | **1.98x median speedup / 96% win rate** |
| BFCL-V4 | **75.0** |
| 连续 Agent 测试 | 约 **35 小时** |
| 工具调用 | 报道口径称 **1,000+** 次工具调用 |

> **重要限制**：这些指标来自官方博客 / 公开报道，Qwen3.7-Max 权重、参数、训练数据、上下文窗口、API 价格和可复现实验细节尚未完整公开。

## 九、数量级总表

| 类别 | Qwen3.6 | Qwen3.7 |
|---|---:|---:|
| 官方开源主模型 | **2** | **0** |
| 官方开源 FP8 | **2** | **0** |
| 官方 HF Collection 条目 | **4** | **0** |
| 官方服务化正式模型 | 至少 **Plus / Max 语境存在，但公开口径不完整** | **1：Qwen3.7-Max** |
| Preview 服务化模型 | 约 **1-2**，社区语境 | 约 **2：Max-Preview / Plus-Preview** |
| CoPaw / QwenPaw 官方衍生线 | **约 7 个条目**，基于 Qwen3.5-9B 的 AgentScope 衍生 | 不计入 Qwen3.7 |
| CoPaw / QwenPaw 社区二次衍生 | **估算 20-80** | 不适用 |
| HF Model Tree 衍生条目 | **约 1,135** | **0** |
| 去重后社区有效模型 | **估算 500-800** | **0-10 API 包装 / 评测项目** |
| 官方专项子模型 | 主要整合在主模型内；同期 Qwen3 专项线很多 | 未公开 |

## 十、总结判断

### 10.1 一句话概括

**Qwen3.6 是 Qwen 在开源权重生态里最实用的一代小型旗舰，Qwen3.7-Max 则是 Qwen 向闭源服务化 Agent 前沿发起冲刺的旗舰模型。**

### 10.2 官方 / 社区数量级对比

- 官方 Qwen3.6 开源条目：**4 个**。
- 社区 Qwen3.6 衍生条目：HF 可见 **1,100+**，去重有效估算 **500-800**。
- 官方 Qwen3.7 正式模型：**1 个服务化模型**。
- Qwen3.7 开源 / 社区微调生态：**基本尚未形成**。

### 10.3 生态健康度

| 维度 | 判断 |
|---|---|
| 开源活跃度 | Qwen3.6 极高 |
| 社区微调速度 | 极快，尤其 27B 和 35B-A3B |
| 量化成熟度 | 高，但版本质量差异大 |
| 部署框架支持 | vLLM / SGLang / Transformers / KTransformers 支持强 |
| 多模态生态 | 官方能力强，社区本地部署仍比纯文本复杂 |
| Agent 方向 | Qwen3.7-Max 明确强化，Qwen3.6 是开源侧主力 |
| 风险 | Qwen3.7 信息不完整；Qwen3.6 社区模型重复和质量分层严重 |

### 10.4 趋势判断

1. **开源侧**：Qwen3.6-27B 和 Qwen3.6-35B-A3B 会继续成为本地 Agent / coding / 长上下文实验的热门底座。
2. **服务侧**：Qwen3.7-Max 代表 Qwen 正把竞争焦点从 benchmark 迁移到“真实长周期任务”。
3. **社区侧**：量化、MTP 保留、uncensored、Claude / Opus reasoning distill、repo-level coding 会继续扩张。
4. **商业侧**：Qwen3.7 如果 API 稳定且价格有优势，会直接进入 Claude Code / OpenCode / OpenClaw / DevRel 自动化工作流。
5. **下一阶段看点**：是否发布 Qwen3.7-27B / 35B-A3B 开源权重，以及 Qwen3.7-Max 是否开放稳定 API、价格和系统卡。

## 参考来源

- Qwen3.6-35B-A3B Hugging Face 模型卡：<https://huggingface.co/Qwen/Qwen3.6-35B-A3B>
- Qwen3.6-27B Hugging Face 模型卡：<https://huggingface.co/Qwen/Qwen3.6-27B>
- Qwen3.6 Hugging Face Collection：<https://huggingface.co/collections/Qwen/qwen36>
- QwenPaw-Flash / CoPaw-Flash Hugging Face Collection：<https://huggingface.co/collections/agentscope-ai/copaw-flash>
- QwenPaw-Flash-9B Hugging Face 模型卡：<https://huggingface.co/agentscope-ai/QwenPaw-Flash-9B>
- Qwen3.7: The Agent Frontier，Alibaba Cloud Community：<https://www.alibabacloud.com/blog/qwen3-7-the-agent-frontier_603154>
- Qwen3.6-35B-A3B vLLM Recipes：<https://recipes.vllm.ai/Qwen/Qwen3.6-35B-A3B>
- Qwen3.6-27B vLLM Recipes：<https://recipes.vllm.ai/Qwen/Qwen3.6-27B>
- TechNode：Alibaba introduces Qwen3.7-Max as next-gen AI agent model，<https://technode.com/2026/05/21/alibaba-introduces-qwen3-7-max-as-next-gen-ai-agent-model/>
- CnTechPost：Alibaba releases Qwen3.7-Max agent model，<https://cntechpost.com/2026/05/20/alibaba-releases-qwen3-7-max-agent-model-tackle-complex-ai-workflows/>
- Qwen3 Technical Report：<https://arxiv.org/abs/2505.09388>
- Qwen-Scope：<https://arxiv.org/abs/2605.11887>
