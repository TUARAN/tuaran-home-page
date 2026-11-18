---
title: 2026年11月18日：32GB 内存能跑起来的本地模型性能排序
category: topics
date: 2026-11-18
time: 11:43
tags: [AI, 大模型, 本地部署, 性能评测]
summary: 32GB 统一内存机器（MacBook Pro 等）能跑起来的本地 LLM 性能排行，Qwen3.8-27B 是目前的王者。
tldr: 32GB 以内内存能跑、且综合性能最强的模型是 Qwen3.8-27B（Q4 约 16-20GB），Artificial Analysis 指数 20.1；Gemma 4 31B 在 OpenWeights Bench 拿 99.3 分，但需要更好的量化；Qwen3.6-35B-A3B 在 LLMCheck 与 32GB 用户中呼声最高。
topic_type: tech
subjects: [ai_llm]
content_type: analysis
assistance: workbuddy
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

当前 32GB 统一内存机器（MacBook Pro M 系列、Mac mini 等）能跑起来的本地大模型中，**Qwen3.8-27B** 是综合性能最强的选择；**Gemma 4 31B IT** 在部分基准上略优但量化后质量损失较大；**Qwen3.6-35B-A3B** 作为 MoE 模型在上下文推理上表现突出，是 LLMCheck 指数中 32GB 以内的最佳推荐。

关键要点：

- **Qwen3.8-27B**（Alibaba，Apache 2.0，Q4_K_M 约 16-20GB）：llama.cpp 社区报告 160 条，生成 37 tok/s、预填充 417 tok/s，Artificial Analysis 指数 20.1，是 32GB 内用户运行量最大的模型（llamaperf 142 条独立报告）。
- **Gemma 4 31B IT**（Google，Apache 2.0，Q4 约 17-20GB）：OpenWeights Bench 总分 99.3，24-128GB 全档位第一，但 Unsloth QAT 重量化在保持质量方面表现最好，原生 GGUF 量化后下降明显。
- **Qwen3.6-35B-A3B**（Alibaba，Apache 2.0，Q4_K_M 约 20-22GB）：LLMCheck 指数 81，与 MiMo-V2.6-Flash 并列第一，但后者需要 192GB Mac Studio；32GB 以内唯一选择。Artificial Analysis 长上下文推理 71.7%，SWE-bench Pro 61.2。
- **GLM-5.3**（Zhipu AI，MIT，30B 参数但 MoE 架构）：Artificial Analysis 指数 31.7，API 价格 $0.07/M，但本地部署需要更大内存。

## 二、事实层

### 2.1 测试基准与数据来源

本次调研综合以下独立来源（截至 2026-11-18）：

| 来源 | 评测内容 | 更新日期 |
|---|---|---|
| llamaperf.com | 社区实测生成速度（用户自报） | 2026-11-17 |
| Artificial Analysis | Intelligence Index v5.0.1 | 2026-11-10 |
| LLMCheck | 综合指数（速度 + 能力 + 生态） | 2026-11-09 |
| OpenWeights Bench | 218 模型 × 270 题 × 13 类 | 2026-11-02 |
| Epoch AI | Open-Weights Index（能力 + 采用率 + 生态 + 许可） | 2026-11-17 |
| Kingy AI | 24GB MacBook Pro M4 Pro 20 任务实测 | 2026-11-03 |
| 67 AI Lab | 临床指南 QA、系统综述筛选 | 2026-11 |
| getrigbase.com | 多 GPU / 统一内存速度测试 | 2026-11-17 |

### 2.2 32GB 内存档位模型清单

| 排名 | 模型 | 参数 | Q4 所需内存 | 开发方 | 许可证 | AA 指数 | LLMCheck 指数 |
|---|---|---|---|---|---|---|---|
| 1 | Qwen3.8-27B | 27.8B dense | 16-20 GB | Alibaba | Apache 2.0 | 20.1 | — |
| 2 | Gemma 4 31B IT | 31B dense | 17-20 GB | Google | Apache 2.0 | 4.4 | — |
| 3 | Qwen3.6-35B-A3B | 35B / 3B active | 20-22 GB | Alibaba | Apache 2.0 | — | 81 |
| 4 | Nanbeige4.3-33B | 33B dense | 20.8 GB | — | Apache 2.0 | — | — |
| 5 | Arete-27B | 27B dense | 16.5 GB | Nous Research | Apache 2.0 | — | — |
| 6 | Gemma 4 26B-A4B | 26B / 4B active | 14-16 GB | Google | Apache 2.0 | — | — |
| 7 | Qwen3.5-9B | 9B dense | 5-6 GB | Alibaba | Apache 2.0 | — | — |
| 8 | Gemma 4 12B IT | 12B dense | 7-9 GB | Google | Apache 2.0 | — | — |
| 9 | DeepSeek V4.1 Flash | 552B / 16B active | 16-24 GB* | DeepSeek | MIT | — | 32.6 |
| 10 | GLM-5.3-Flash | 321B / 18B active | 16-24 GB* | Zhipu AI | MIT | — | 27.8 |

> *DeepSeek V4.1 Flash 和 GLM-5.3-Flash 为 MoE 架构，全量加载需 >32GB，但可通过 CPU offload / RAM 混合加载在 32GB 机器上运行，速度显著下降。

### 2.3 速度实测数据

| 模型 | 硬件 | 量化 | 生成速度 (tok/s) | 预填充速度 (tok/s) | 数据来源 |
|---|---|---|---|---|---|
| Qwen3.8-27B | M4 Pro 24GB | Q4_K_M | 35-37 | 417 | llamaperf 社区中位数 / 67 AI Lab |
| Qwen3.8-27B | RTX 5090 (2×) | Q4_K_M | 73 | — | getrigbase |
| Qwen3.6-35B-A3B | M4 Pro 24GB | Q4_K_M | 6-10 | — | TokenStrom / Kingy AI |
| Qwen3.6-35B-A3B | RTX 5090 (2×) | Q4_K_M | 274 | — | getrigbase |
| Gemma 4 31B IT | Strix Halo | q4_0 | 11.28 | — | getrigbase |
| Gemma 4 12B IT | Strix Halo | QAT Q4_0 | 25.9 | — | getrigbase |
| Qwen3.5-9B | Strix Halo | Q4_K_M | 38.1 | — | getrigbase |
| Qwen3-8B | M4 Pro 24GB | 默认 | ~30 | — | Kingy AI 实测 |
| Qwen3-4B | M4 Pro 24GB | 默认 | ~40 | — | Kingy AI 实测 |

### 2.4 能力实测

Kingy AI 在 24GB MacBook Pro M4 Pro 上跑了 20 项任务（10 日常 + 10 困难）：

| 模型 | 日常 10 题 | 困难 10 题 | 总分 | 总耗时 |
|---|---|---|---|---|
| ChatGPT (gpt-6.1-sol) | 10 | 10 | 20/20 | 5 min |
| Qwen3.8-27B (3-bit) | 10 | 9 | 19/20 | 29 min |
| Qwen3.8-27B (2-bit) | 10 | 9 | 19/20 | 32 min |
| Qwen3-8B | 10 | 8 | 18/20 | 14 min |
| Qwen3-4B | 9 | 6 | 15/20 | 11 min |

67 AI Lab 临床指南 QA（120 题，评分标准：85% 完全正确、0% 错误剂量）：

| 模型 | 完全正确 | 正确但遗漏细节 | 正确但 abstain | 错误剂量 |
|---|---|---|---|---|
| Opus 5.5 (参考) | 90.8% | — | 100% | 0 |
| DeepSeek V4.1 Flash | 90.0% | — | 100% | 0 |
| Qwen3.8-27B | 81.7% | — | — | 0 |
| Gemma 4 | 79.2% | — | — | 0 |
| Qwen3.6 | 75.8% | — | — | 0 |

## 三、结构分析

### 3.1 为什么 Qwen3.8-27B 是 32GB 档位的王者

Qwen3.8-27B 在三个维度上形成了组合优势：

1. **参数密度高**：27B 密集模型在 Q4 量化后仅占 16-20GB，在 32GB 机器上留有充足余量给 KV cache 和上下文窗口（262K tokens），实际使用中可加载 32K-64K 上下文而不溢出。
2. **社区生态成熟**：llamaperf 上 142 条独立报告（所有模型中最多），说明使用人数广、量化版本多、问题排查快。Hugging Face 下载量与 Epoch AI 采用率指标均位居开源模型前列。
3. **基准表现稳定**：在临床指南 QA 中 81.7% 完全正确，仅次于 Opus 5.5 和 DeepSeek V4.1 Flash；在 Kingy AI 的 20 任务测试中与 gpt-6.1-sol 仅差 1 题（困难题少 1 道代码题）。

### 3.2 Gemma 4 31B IT 的优势与局限

Gemma 4 31B IT 在 OpenWeights Bench 上拿到 99.3 分（全档位第一），但本地运行存在两个问题：

- **量化敏感**：原生 GGUF Q4 量化质量下降明显，需要 Unsloth 的 QAT 重量化才能保持接近原始质量。Google 提供的 QAT 文件在 Strix Halo 上跑出 11.28 tok/s，速度偏慢。
- **生态成熟度不足**：llamaperf 报告数少，社区量化版本选择有限。

### 3.3 Qwen3.6-35B-A3B 的 MoE 优势

Qwen3.6-35B-A3B 采用 Mixture-of-Experts 架构（35B 总量，3B 活跃），在 32GB 内存下可以全量加载。其优势在于：

- **LLMCheck 指数 81**，与需要 192GB Mac Studio 的 MiMo-V2.6-Flash 并列第一，是 32GB 以内唯一选择。
- **长上下文推理强**：Artificial Analysis LCR 71.7%，在系统综述筛选任务中 recall @50% 达 97.1%。
- **代码能力突出**：SWE-bench Pro 61.2，在本地模型中位居前列。

代价是速度较慢——M4 Pro 上仅 6-10 tok/s，RTX 5090 双卡下 274 tok/s。

### 3.4 小模型（<16GB）的选择

对于 16GB 及以下内存的机器：

- **Gemma 4 12B IT**（~8.9GB，OpenWeights Bench 98.6 分）是 16GB 机器最佳选择，性价比极高。
- **Qwen3.5-9B** 在 llamaperf 上 8GB 和 16GB 档位均为用户报告最多的模型。
- **Gemma 4 E4B IT**（~4-5GB）是 8GB 以下机器的首选。

## 四、外部研判

### 4.1 中国模型在本地生态的主导地位

2026 年 11 月的本地模型生态中，中国厂商（Alibaba Qwen、DeepSeek、Zhipu GLM）占据了前 5 名中的 4 席。Artificial Analysis Intelligence Index 前 5 名全部是中国模型：

1. Kimi K3.1 Pro（Moonshot AI）46.5
2. DeepSeek V4.1 Flash 1017 32.6
3. GLM 5.3 31.7
4. MiMo-V2.6-Pro（Xiaomi）29.9
5. MiniMax M3.1 Flash 29.1

这一趋势反映了中国开源大模型在本地部署场景中的持续投入与生态建设。

### 4.2 MoE 架构是 32GB 档位的未来

Qwen3.6-35B-A3B 和 DeepSeek V4.1 Flash 都采用了 MoE 架构，在参数量不变的前提下通过激活子集显著降低推理成本。在 32GB 内存限制下，MoE 模型可以加载更多总参数而不超出内存，是突破密度瓶颈的关键路径。

### 4.3 本地模型与云端 API 的差距在缩小

Kingy AI 的实测表明，Qwen3.8-27B 在 20 项日常和困难任务中达到 19/20，与 gpt-6.1-sol 仅差 1 题。差距主要在于：代码生成（本地模型无法通过全部 14 个隐藏测试）和格式遵循（小模型忽略 "ANSWER:" 等格式要求）。在日常任务上，本地模型已经与云端 API 持平。

## 五、信息来源与持续验证

### 主要来源

- llamaperf.com — 社区实测速度（2026-11-17 更新）
- Artificial Analysis Intelligence Index v5.0.1 — 能力评测（2026-11-10）
- LLMCheck — 综合指数（2026-11-09）
- OpenWeights Bench — 218 模型 × 270 题（2026-11-02）
- Epoch AI Open-Weights Index — 能力 + 采用率 + 生态 + 许可（2026-11-17）
- Kingy AI — 24GB MacBook Pro 20 任务实测（2026-11-03）
- 67 AI Lab — 临床指南 QA、系统综述筛选（2026-11）
- getrigbase.com — 多 GPU / 统一内存速度测试（2026-11-17）
- tokenstrom.com — Colibri 本地部署实测
- ai-master.dev — 综合评测与推荐

### 持续验证

- Qwen3.8-27B 的社区报告数（142 条）可能随新模型发布而变化，需关注 llamaperf 更新。
- Gemma 4 31B IT 的 QAT 重量化效果需更多硬件平台验证。
- MoE 模型在 32GB 机器上的速度表现高度依赖于量化格式和推理引擎。
