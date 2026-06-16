---
title: DeepSeek-V4-Pro 本地部署调研：1.6T MoE 落地的硬件账与量化分寸
category: topics
date: 2026-06-16
time: 16:40
tags: [大模型, 本地部署, DeepSeek, DeepSeek-V4, MoE, 量化, 显存, vLLM, llama.cpp, Ollama, 推理, 私有化, GPU]
summary: 拆解 DeepSeek-V4-Pro（1.6T MoE）的参数、四档硬件需求、五大框架适配、效果评测与并发吞吐，并给出可复制的部署命令；立场是把"集群级 Pro"与"单机可跑的 Flash"严格分开，不替任一档编实测数。
tldr: 判断框架——Pro 是集群机型（原生 862GB，Q4 仍要 ~569GB 显存，最少 8×H200/多节点），消费级单卡跑的其实是 V4-Flash（284B）。量化往下走的红线在 Q4：代码/数学/长链推理掉 Q3 以下不可用，闲聊问答可下探。所有逐显卡吞吐均为工程估算，非官方实测，边界已逐项标注。
topic_type: tech
assistance: claude-code
model: claude-opus-4-8
pv: 0
---

> **写在前面（来源口径与立场）**
>
> - **来源口径**：DeepSeek 官方（技术报告 / API 文档 / HuggingFace 卡片）只公开了**架构参数与基准分**；**逐显卡 token/s、各 GGUF 量化档显存、并发上限官方均未发布**。本文中这三类数字来自两个渠道，并在每张表里标注：① 第三方社区/评测站整理（codersera、morphllm、wavespeed 等，2026-05～06）；② 本文按"激活参数 × 显存带宽"做的**工程估算（非实测）**。
> - **外部观察立场**：作者 TUARAN 未拿到 V4-Pro 集群做实测，本文是基于公开资料 + 部署常识的**外部整理与测算**，不是官方白皮书，也不是实验室报告。
> - **未核实信息处理**：拿不到的数据一律标"未对外披露"或用"工程估算"区间给出，并在第十节「未能验证清单」集中列出，不在正文里假装确定。

---

## 一、先给结论

**如果只记住一句话**：你想"在本地跑 DeepSeek-V4"，能装进单机/消费级显卡的是 **V4-Flash（284B/激活13B）**；**V4-Pro（1.6T/激活49B）是集群机型，单卡双卡乃至 8×H100 单机都装不下**——给 Pro 谈"4090 单卡 token/s"是伪命题。

本节核心矛盾：**用户的硬件预期建立在"49B 激活参数好像不大"上，但 MoE 的"总参数"才决定你要搬多少 GB 进显存。**

四档部署结论速览（详细见第三节）：

| 档位 | 目标机型 | 现实可跑对象 | 最小硬件 | 量化建议 |
|---|---|---|---|---|
| 最低可运行 | 玩一玩、能出字 | **V4-Flash** Q2~Q3 | 2×RTX 4090 48GB / 1×RTX 6000 Ada 48GB | Q2_K（仅尝鲜，质量明显掉） |
| 流畅推理 | 个人/小团队日用 | **V4-Flash** Q4_K_M | 4×RTX 4090 / 2×RTX 6000 Ada / 1×H200 | Q4_K_M（甜点档） |
| 批量并发 | 私有服务 | **V4-Flash** FP4+FP8 原生 | 2×H200 141GB（或 4×A100 80GB） | 原生 FP4+FP8 |
| 全参数微调 | 研究/定制 | **V4-Pro** 仅多节点 | 16×H100 / 多节点 InfiniBand 集群 | 不量化（FP8 训练态） |

> Pro 与 Flash 的关系：同一架构家族、同一 1M 上下文、同一稀疏注意力，Flash 是"轻量同款"。**99% 想本地部署的人，正确答案是 Flash；想要 Pro 的能力又没集群，正确答案是调 API。**

---

## 二、模型基础参数拆解

本节核心论点：**V4 这一代的关键不在"更大"，而在"激活率更低 + KV cache 更省"——这正是它敢上 1M 上下文的底气。**

### 2.1 架构参数对照（官方确认）

| 维度 | V4-Pro | V4-Flash | V3（对照） | 状态 |
|---|---|---|---|---|
| 总参数 | 1.6 T | 284 B | 671 B | 已确认 |
| 激活参数/token | 49 B | 13 B | 37 B | 已确认 |
| 架构 | MoE（细粒度专家） | MoE | MoE | 已确认 |
| Transformer 层数 | 61 | 未对外披露 | 61 | Pro 已确认 |
| hidden dim | 7168 | 未对外披露 | 7168 | Pro 已确认 |
| 专家配置 | 384 路由专家 + 1 共享，每 token 激活 6 | 未对外披露 | 256+1 | Pro 已确认 |
| 注意力机制 | Token-wise 压缩 + DSA（DeepSeek Sparse Attention，含 CSA/HCA 两路压缩） | 同 Pro | MLA | 已确认 |
| 上下文窗口 | 1 M token | 1 M token | 128 K | 已确认 |
| 最大输出 | 384 K | 384 K | 8 K | 已确认 |
| 推理模式 | 混合 thinking/非 thinking，三档算力（至 Think Max） | 同 Pro | R 系列单独 | 已确认 |
| 许可证 | MIT，HF/ModelScope 可自托管，base+instruct | MIT | MIT | 已确认 |

> **效率数据（官方自我披露）**：在 1M 上下文场景下，V4-Pro 单 token 推理 FLOPs 仅为 V3.2 的 **约 27%**，KV cache 大小仅 **约 10%**；V4 系列 KV cache 约为标准 8-head GQA 的 **~2%**，Flash 的 1M 上下文 KV 仅约 **10 GB**。这是它能在不爆显存的前提下吃 1M token 的核心机制。

### 2.2 基础版 vs 量化版区别

- **base / instruct（官方 checkpoint）**：原生即 **FP4+FP8 混合精度**（这一代官方权重本身就是低精度训练/发布，不是 FP16 再压），所以"原生档"已经比上一代同总参数省一半显存。
- **社区 GGUF / AWQ 量化版**：在官方权重基础上再压（Q8/Q6/Q5/Q4_K_M/Q3/Q2_K）。注意：**因为原生已是 FP4+FP8，再往 Q3/Q2 压的边际损耗比 V3 时代更陡**——低档可用区间更窄。

### 2.3 推理 / 微调 / RAG 三场景参数差异

| 场景 | 实际吃显存的部分 | 关键参数 | 说明 |
|---|---|---|---|
| 推理 | 权重（按量化）+ KV cache（按上下文长度） | `max_model_len`、`gpu_memory_utilization`、量化档 | MoE 推理每 token 只激活 6 专家，但**全部专家权重必须常驻显存**，不能只装激活的那部分 |
| 微调（LoRA/QLoRA） | 量化权重（冻结）+ 低秩适配器 + 优化器状态 | `lora_rank`、`r`、`target_modules` | 单卡 QLoRA 仅对 Flash 现实；Pro 即便 LoRA 也要多卡 |
| 全参数微调 | FP8/BF16 权重 + 梯度 + 优化器（≈权重 3~4×） | ZeRO 阶段、`tp/pp/dp` | Pro 全参微调是多节点集群任务，非本文消费级范畴 |
| RAG | 推理显存 + 检索侧（向量库在 CPU/独立服务） | `embedding 模型`、`top_k`、拼接后 token 数 | RAG 不增加模型显存，但**长召回会把上下文推到几十 K，KV cache 涨**——这正是 V4 省 KV 的用武之地 |

---

## 三、本地部署硬件资源需求（四档）

本节核心矛盾：**"能不能跑"几乎只由显存总量决定，CPU/内存/硬盘是次级约束。** 下面所有显存数字来源已标注。

### 3.1 显卡：逐量化显存占用

> 数据来源：第三方社区整理（codersera 2026-05、wavespeed 2026-06），**非官方**；含权重 + 基础 KV/开销的最小可用值。

**V4-Flash（284B，本地主力）**

| 量化 | 权重体积 | 最小显存 | 参考显卡组合 |
|---|---|---|---|
| BF16 | ~520–570 GB | ~640 GB | 8×H100 80GB / 8×H200 |
| FP8 mixed | ~290–295 GB | ~320 GB | 4×H100 80GB / 4×A100 80GB |
| **FP4+FP8 原生（推荐）** | **~158–160 GB** | **~170–175 GB** | **2×H200 / 4×A100 80GB** |
| Q6/Q5 GGUF | ~100–120 GB | ~128–160 GB | 2×H100 80GB / 1×H200 |
| INT4/Q4（社区 AWQ） | ~80 GB | ~90–100 GB | **4×RTX 4090 24GB** / 2×RTX 6000 Ada |
| Q3 GGUF | ~60 GB | ~80–96 GB | 1×H100 80GB / 2×RTX 6000 Ada |
| Q2_K（极限） | ~40 GB | ~48–64 GB | **2×RTX 4090 / 1×RTX 6000 Ada 48GB** |

**V4-Pro（1.6T，集群机型）**

| 量化 | 权重体积 | 最小显存 | 部署形态 |
|---|---|---|---|
| BF16 | ~3.2 TB | ~3.5 TB+ | 多节点集群 |
| FP8 mixed | ~1.6 TB | ~1.7 TB+ | 多节点 H200/B200 |
| **FP4+FP8 原生** | **~862 GB** | **~1.0–1.2 TB** | **8×H200 单节点 / 16×H100 多节点** |
| Q4（实验性） | ~430 GB | ~512–640 GB | 8×H100（含 KV 后仍吃紧，可能放不下） |
| Q2（研究用） | ~216 GB | ~256–320 GB | 4×H100，质量损失重 |

> **红线**：社区实测指出，**即便 Q4 的 V4-Pro（~430GB 权重）也塞不进 8×H100（640GB）**——加上 KV cache 和运行时开销就溢出了。Pro 的最低现实门槛是 8×H200 或多节点。

### 3.2 N卡 / AMD / 国产卡适配

| 平台 | 适配状态 | 说明 |
|---|---|---|
| NVIDIA Hopper/Blackwell（H100/H200/B200） | ✅ 一等公民 | vLLM 0.7.x day-0 支持；DSA 混合注意力 kernel 在 Hopper/Blackwell 上才有完整速度 |
| NVIDIA Ampere/Ada（A100/4090/3090） | ⚠️ 能跑但非满速 | 缺 FP8/FP4 原生加速，需走 GGUF/AWQ 社区量化；DSA kernel 性能打折 |
| AMD（MI300X 等） | ⚠️ 取决于框架 | ROCm + vLLM 路径理论可行，但 V4 自定义 kernel 移植滞后，**未见可靠实测** |
| 国产卡（昇腾/沐曦/壁仞等） | ❓ 未对外披露 | 截至本文未见 V4 官方/社区在国产卡的可复现部署数据；按 V3 经验需厂商适配层，**不要假设开箱即用** |

**最低显卡型号推荐**：要本地真用起来，**Flash + 4×RTX 4090（24GB×4，AWQ Q4）** 是消费级的现实底线；想省事 **1×RTX 6000 Ada 48GB 跑 Q3** 也行，但速度和质量都打折。

### 3.3 CPU 纯跑

- **可行性**：Flash 用 llama.cpp + GGUF 可以纯 CPU 跑，但**只适合验证，不适合用**。
- **内存**：Q4 的 Flash 约需 **96–128 GB 系统内存**（权重 80GB + 上下文 + 开销）；Q2 约 64GB 起。
- **核心数**：建议 **16 核以上**，但瓶颈不在核数。
- **速度瓶颈**：纯 CPU 解码受**内存带宽**死锁——双通道 DDR5 约 80–100 GB/s，Flash 激活 13B@Q4 每 token 要读 ~6.5GB，**理论上限就 ~12–15 tok/s，实测常 <5 tok/s**。Pro 纯 CPU 不予讨论。

### 3.4 硬盘

| 对象/量化 | 磁盘占用 | 存储建议 |
|---|---|---|
| V4-Pro 原生 FP4+FP8 | ~862 GB | NVMe SSD 必备 |
| V4-Pro BF16 | ~3.2 TB | NVMe，多盘 |
| V4-Flash 原生 | ~158 GB | NVMe SSD |
| V4-Flash Q4 GGUF | ~80 GB | SSD |
| V4-Flash Q2 | ~40 GB | SSD |

**为什么 SSD 必备**：① 加载——HDD 读 160GB 权重要 10+ 分钟冷启动，NVMe 几十秒；② **MoE 专家若做磁盘/内存 offload，每 token 都可能触发换页，HDD 的随机 IO 会让吞吐塌到不可用**。预留 1.5× 模型体积给量化中间文件。

### 3.5 内存与 Swap

- **物理内存**：GPU 部署时建议 **≥ 系统能放下一份权重**（用于加载/转换缓冲），Flash 推荐 **128GB**，Pro 节点单机 **512GB+**。
- **Swap**：**生产推理不要靠 Swap 兜显存/内存**——一旦触发 swap，延迟会从毫秒级跳到秒级。Swap 仅作"加载期防 OOM"的保险，建议设 **物理内存的 0.5–1×**，且放 NVMe 上；运行期应让权重完全驻留 RAM/VRAM。

---

## 四、主流部署框架适配

本节核心论点：**框架选型先问"你是单机消费卡还是 Hopper 集群"，而不是先问哪个最快。**

| 框架 | 部署难度 | 性能优势 | 适用人群 | V4 适配现状 |
|---|---|---|---|---|
| **vLLM** | 中 | 吞吐/并发最强，PagedAttention，day-0 支持 V4 | 私有服务、批量并发 | ✅ 0.7.x 原生支持，需 `--trust-remote-code`，Hopper/Blackwell 满速 |
| **llama.cpp** | 中低 | GGUF 量化、CPU/混合 offload、消费卡友好 | 单机折腾、CPU 兜底 | ⚠️ 依赖社区出 GGUF；DSA 自定义注意力支持滞后于 vLLM |
| **Ollama** | 最低 | 一行命令、开箱即用 | 个人尝鲜、本地助手 | ⚠️ 取决于官方库是否上架 V4-Flash；上架前需手动导入 GGUF |
| **Text Generation WebUI** | 低 | 图形界面、参数可视化、多后端 | 调参、对比测试、非工程用户 | ⚠️ 经 llama.cpp/ExLlama 后端间接支持，跟随后端进度 |
| **DeepSeek 官方推理库** | 高 | 与官方权重/精度最对齐，FP8/FP4 原生 | 集群部署 Pro、对齐官方效果 | ✅ 官方首发即配套，但面向多卡/多节点 |

可直接复制的部署命令（**以 V4-Flash 为目标**；Pro 请替换为集群多节点参数）：

```bash
# ① vLLM —— 4×A100/H100 张量并行，OpenAI 兼容服务
pip install -U "vllm>=0.7.0"
vllm serve deepseek-ai/DeepSeek-V4-Flash \
  --trust-remote-code \
  --tensor-parallel-size 4 \
  --max-model-len 131072 \
  --gpu-memory-utilization 0.90 \
  --enable-prefix-caching \
  --port 8000
# 调用：curl http://localhost:8000/v1/chat/completions ...（OpenAI 格式）
```

```bash
# ② llama.cpp —— GGUF + GPU 全量 offload（消费卡/混合）
git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp
cmake -B build -DGGML_CUDA=ON && cmake --build build -j
# 先用 huggingface-cli 下载社区 GGUF（如 Q4_K_M）到 ./models/
./build/bin/llama-server \
  -m ./models/DeepSeek-V4-Flash-Q4_K_M.gguf \
  -ngl 99 \                # 尽可能多层放 GPU
  -c 32768 \               # 上下文
  --host 0.0.0.0 --port 8080
```

```bash
# ③ Ollama —— 个人最省心（若官方库已上架）
ollama run deepseek-v4-flash
# 未上架时手动导入 GGUF：
#   建 Modelfile：FROM ./DeepSeek-V4-Flash-Q4_K_M.gguf
ollama create deepseek-v4-flash -f Modelfile && ollama run deepseek-v4-flash
```

```bash
# ④ Text Generation WebUI —— 图形化
git clone https://github.com/oobabooga/text-generation-webui && cd text-generation-webui
./start_linux.sh   # 启动后在 Model 选项卡选 llama.cpp/ExLlama 后端加载 GGUF
```

> 注意：`deepseek-ai/DeepSeek-V4-Flash` 与 `DeepSeek-V4-Pro` 是 HF 上的官方仓库名（base/instruct 两版）；**社区 GGUF 文件名随发布方而变，命令里的文件名需按实际下载替换**。

---

## 五、模型实际输出效果评测

本节核心论点：**V4-Pro 在代码与长上下文上是开源 SOTA 级，但"国产同代里数学/多语种最强"这个位置在公开评测里仍被 Qwen 系咬得很紧。**

### 5.1 各能力维度（基准来源已标注）

| 能力 | V4-Pro 表现 | 来源/状态 |
|---|---|---|
| 代码 | SWE-bench Verified **80.6%**（开源权重最高档）；LiveCodeBench Pass@1 93.5 | SWE-bench 第三方核验；LiveCodeBench/Codeforces 为厂商自报 |
| 复杂推理 | Codeforces rating 3206（自报）；三档 thinking 可调 | 厂商自报 |
| 长文本 | 1M 上下文 + 384K 输出，KV 仅同类 ~2%，长召回不易爆显存 | 官方确认（机制）/ 长文质量缺独立长基准 |
| 多轮对话 | 混合 thinking 模式，适合 agent 多轮 | 机制确认，主观质量未独立评测 |
| 数学 | GSM8K **92.6%**；MMLU-Pro **87.5%** | 第三方整理 |
| 中英文 | 中文承袭 DeepSeek 系强项（C-Eval/C-SimpleQA 系列）；英文一线 | V3 谱系确认，V4 专项分未全披露 |
| 复杂指令遵循 | function calling / JSON / 上下文缓存默认开 | 官方确认 |

### 5.2 与同类对比

| 模型 | 定位 | 相对 V4-Pro 的优劣（公开评测口径） |
|---|---|---|
| DeepSeek-V3 | 上一代 671B MoE | 全面被超：参数 2.4×、上下文 8×、KV 效率代差；V4 是明确升级 |
| Qwen3（235B-A22B 等） | 同期国产开源强项 | **数学/多语种在多份公开评测里与 V4 互有胜负、局部反超**；本地可跑性 Qwen 中小档更友好 |
| Llama 4 系 | 西方开源对照 | V4 在代码/SWE-bench、上下文长度上领先；生态/工具链 Llama 更成熟 |

> 一句话：**要代码和超长上下文选 V4；要在单卡上务实跑、或冲数学/多语种，先认真对比 Qwen 同档。**

### 5.3 量化损耗：往下压到哪一档会坏

| 量化档 | 相对原生质量 | 适用 | 不适用 |
|---|---|---|---|
| 原生 FP4+FP8 | 基准 | 全部 | — |
| Q6/Q5 | 几乎无损 | 全部生产 | — |
| **Q4_K_M** | 接近 FP8，轻微下滑 | 通用问答、日常代码、RAG | 高精度数学证明/长链 agent 边缘掉点 |
| Q3 | 明显下滑 | 闲聊、草稿 | 代码、数学、复杂指令遵循 |
| Q2_K | 重损 | 仅尝鲜 / 验证能跑通 | 任何严肃任务 |

> **关键提醒**：V4 官方权重**本就是 FP4+FP8**，再压到 Q3/Q2 是"低精度上再低精度"，**衰减比 V3 时代更陡**。**代码生成、数学计算、长链推理、严格 JSON 指令——不要用 Q3 以下。** 闲聊和草稿可以下探。

---

## 六、并发承载 & 吞吐量测算

> **本节全部 token/s 与并发数为工程估算，非官方实测。** 估算法：解码受显存带宽约束，速率 ≈ 显存带宽 ÷（激活参数 × 每参数字节），再按真实开销打 5–7 折。Flash 激活 13B、Pro 激活 49B。**请把这些当数量级参考，不是 benchmark。**

### 6.1 单卡/单组单轮解码速率（估算，V4-Flash Q4，激活 13B≈6.5GB/token）

| 硬件 | 显存带宽 | 理论上限 | 估算实测区间 | 备注 |
|---|---|---|---|---|
| RTX 3090 | ~0.94 TB/s | ~145 tok/s | **~50–80 tok/s** | 需多卡才装得下 Flash，单卡仅示带宽 |
| RTX 4090 | ~1.0 TB/s | ~155 tok/s | **~60–90 tok/s** | 4×4090 跑 AWQ Q4 的单流速率 |
| A100 80GB | ~2.0 TB/s | ~300 tok/s | **~120–180 tok/s** | — |
| H100 80GB | ~3.35 TB/s | ~515 tok/s | **~200–320 tok/s** | FP8 原生更快 |
| H200 141GB | ~4.8 TB/s | ~740 tok/s | **~300–450 tok/s** | 单卡可放 Q4/Q5 Flash |

> **V4-Pro（激活 49B）**：即便在能装下的 8×H200 节点上，单流解码因激活参数 ~4× 于 Flash，**单请求 token/s 约为 Flash 的 1/3~1/4**；Pro 的价值在批量并发摊薄，不在单流快。

### 6.2 并发用户数（估算，V4-Flash，2×H200 原生 FP4+FP8，开 PagedAttention + 连续批处理）

| 场景 | 单请求平均上下文 | 估算并发对话数 | 瓶颈 |
|---|---|---|---|
| 单轮短问答（<1K token） | 小 | **80–150** | 算力/调度 |
| 万字长文本（~16K token） | 中 | **15–30** | KV cache 显存 |
| 代码生成（长输出） | 大输出 | **8–20** | 输出 token 串行 |

### 6.3 长上下文吞吐衰减（估算）

| 上下文 | 相对 4K 的单请求吞吐 | 说明 |
|---|---|---|
| 4K | 基准 | — |
| 32K | **~80–90%** | V4 KV 极省，衰减比传统 GQA 模型小 |
| 128K | **~55–70%** | prefill 变重，首 token 延迟显著上升 |
| 1M | **可加载，但首 token 延迟以秒~十秒计** | 适合"长文档一次性分析"，不适合高频交互 |

### 6.4 极限负载瓶颈出现条件

| 瓶颈 | 触发条件 | 表象 |
|---|---|---|
| 显存溢出（OOM） | 权重 + KV(并发×上下文) 超 VRAM | `CUDA out of memory`，请求被踢 |
| CPU 瓶颈 | 走了 CPU/磁盘 offload 或分词/采样在 CPU | GPU 利用率上不去 |
| IO 瓶颈 | MoE 专家换页、冷加载、HDD | 首 token 卡死、吞吐抖动 |
| 调度瓶颈 | 并发请求数 > 批处理调度能力 | 排队延迟暴涨，p99 失控 |

---

## 七、部署风险与优化方案

本节核心矛盾：**90% 的本地部署翻车是 OOM，而 OOM 的解法几乎都是"少装点上下文/换低一档量化/开 KV 优化"三选一。**

### 7.1 显存不足与优化（vLLM 为例）

```bash
# OOM 应急三连：降上下文 + 降显存利用率 + 换更低量化
vllm serve deepseek-ai/DeepSeek-V4-Flash --trust-remote-code \
  --tensor-parallel-size 4 \
  --max-model-len 32768 \          # ① 砍上下文，最直接省 KV
  --gpu-memory-utilization 0.85 \  # ② 留余量防碎片 OOM
  --quantization awq \             # ③ 走社区 AWQ Q4
  --kv-cache-dtype fp8 \           # ④ KV cache 量化到 FP8，再省一截
  --enable-prefix-caching \        # ⑤ 相同前缀复用 KV（多轮/RAG 收益大）
  --max-num-seqs 64                # ⑥ 限并发，挡住调度型 OOM
```

- **分页注意力（PagedAttention）**：vLLM 默认开启，无需配置；它把 KV cache 分块管理，是高并发不爆显存的核心。
- **批量推理**：vLLM 的连续批处理（continuous batching）默认开，`--max-num-seqs` 控批量上限。
- **KV 优化**：`--kv-cache-dtype fp8` + V4 自带的稀疏注意力，是长上下文的关键。

### 7.2 单机多卡 / 分布式条件与加速比

| 形态 | 条件 | 加速/收益 |
|---|---|---|
| 单机多卡张量并行（TP） | 卡间 NVLink/PCIe，`--tensor-parallel-size N` | **吞吐近线性，但非满倍**：2 卡 ~1.7–1.9×、4 卡 ~3.2–3.6×（受卡间通信折损） |
| 单机内 NVLink vs PCIe | NVLink 带宽高 | PCIe-only 多卡 TP 通信开销大，加速比明显低于 NVLink |
| 多节点（Pro 必需） | InfiniBand + 流水线并行 PP | 跨节点通信是瓶颈，扩展性 < 单机 TP；Pro 的 8×H200/16×H100 属此类 |

> 经验值：**消费级 4×4090 跑 Flash，相对 1 卡（若装得下）约 3.3× 吞吐**；继续堆卡边际递减。

### 7.3 离线本地部署限制

- **无联网**：模型权重、tokenizer、框架镜像需**预先下载**；`--trust-remote-code` 依赖的自定义模块要随权重一起拉全，离线机不能临时联网补包。
- **API 调用**：本地起的是 OpenAI 兼容服务（vLLM/llama.cpp server），**应用侧改 base_url 指向本地即可**，无需公网。
- **RAG 结合**：向量库（如本地 Chroma/PGVector）+ embedding 模型全本地化即可全离线；V4 的省 KV 特性让"长召回拼接"在显存上更从容，但**召回质量取决于 embedding 与切分，与 V4 本身无关**。

---

## 八、落地场景建议

| 场景 | 推荐对象 + 量化 | 推荐硬件 | 理由 |
|---|---|---|---|
| 个人本地玩耍 | **V4-Flash Q3/Q4 GGUF** | 1×RTX 6000 Ada 48GB / 2×4090 | 能出活、成本可控；尝鲜可 Q2 但别当真用 |
| 企业私有知识库（RAG） | **V4-Flash Q4_K_M / FP8** | 2×H200 或 4×A100 80GB | Q4 质量够 RAG，1M 上下文吃长文档；并发靠 vLLM |
| 本地代码助手 | **V4-Flash FP8 / Q5（不要 Q3 以下）** | 2×H100/H200 | 代码对量化敏感，质量优先；SWE-bench 强是卖点 |
| 离线生产服务 | **V4-Flash 原生 FP4+FP8** | 2×H200 起，按并发横向扩 | 与官方精度对齐，吞吐最稳 |
| 想要 Pro 级能力 | **V4-Pro，但走 API**（除非有集群） | 8×H200 / 多节点（自建）或官方 API | 自建 Pro 成本极高，多数团队 API 更划算 |

---

## 九、研判：这套硬件账怎么算才不踩坑（观察）

> 以下为外部分析视角，不是预测，也不是采购建议。逐条判断落在"机制与约束"上，不替任何一档背书具体到 token 的实测。

1. **MoE 的"激活参数小"是吞吐概念，不是显存概念。** 49B 激活决定它算得快，但 1.6T 总参数决定你得搬多少 GB 进显存——把这两个混为一谈，是"4090 跑 Pro"这类误判的根。
2. **V4 这代真正的解锁点是 KV cache 省到 ~2%。** 它不是"参数更多所以更强"，而是"长上下文的边际显存成本被压下来"，所以 1M 才落地。本地部署最该盯的指标因此从"参数量"转向"KV/上下文预算"。
3. **量化的安全边界这代更窄。** 官方权重已是 FP4+FP8，社区再压的空间被前置吃掉了，Q3 以下对代码/数学是真坏。把"能加载"误当"能用"，是低量化档最大的认知陷阱。
4. **绝大多数"本地部署 DeepSeek"的正解是 Flash，不是 Pro。** 真正需要 Pro 的，几乎都同时具备集群——否则 API 在成本和稳定性上都更优。本地化的价值在数据不出域，不在"把最大模型搬回家"。

---

## 十、未能验证的事实清单

- V4-Flash 的层数 / hidden dim / 专家数：官方未对外披露（仅 Pro 公布）。
- 官方逐显卡 token/s、各 GGUF 量化档显存：**无官方数据**，本文相应数字为社区整理或工程估算。
- V4 在 AMD ROCm / 国产卡（昇腾/沐曦/壁仞）的可复现部署：截至 2026-06 未见可靠实测。
- V4-Flash 的独立 SWE-bench 等核验分（截至 2026-06-09 未公开）。
- 第六节并发数、长上下文衰减比：均为按激活参数与带宽的估算区间，未经作者实测台架验证。
- 潜在获取路径：官方技术报告 PDF、HF/ModelScope 模型卡更新、vLLM/llama.cpp release notes、社区跑分库（LMSYS、各评测站）后续实测。

---

**结语**：以上是一种外部解读——把 DeepSeek-V4-Pro 放回它真实的部署语境里，区分"集群机型 Pro"和"单机可跑的 Flash"，把官方确认的架构数据、社区整理的显存数据、和按机制做的吞吐估算分层标注清楚。**以上为分析视角，不是预测，也不是建议；逐显卡吞吐与并发数据为工程估算，非官方实测，落地采购请以目标硬件实测为准。**

**信息来源**

- 官方 / 一手：DeepSeek API 文档（V4 Preview 发布 2026-04-24）、HuggingFace `deepseek-ai/DeepSeek-V4-Pro` 与 `DeepSeek-V4-Flash` 模型卡、DeepSeek V4 技术报告解读。
- 行业 / 第三方（显存与吞吐整理，非官方）：morphllm「DeepSeek V4: 1.6T MoE」、codersera「V4 VRAM & GPU Requirements 2026」、wavespeed「V4 GPU/VRAM」、siliconflow 模型页、nvidia build 模型卡、Qwen3 技术报告（对照）。

**站内交叉**

- [CUDA 生态调研](/articles/2026-06-02-cuda-ecosystem)
- [本地常驻 LLM 与 NVIDIA Spark](/articles/2026-06-02-local-always-on-llm-nvidia-spark)
- [Qwen3.5 边缘部署](/articles/2026-05-20-qwen3-5-edge-deployment)
- [15 分钟看懂大语言模型](/articles/2026-06-01-15-minutes-understand-large-language-models)
