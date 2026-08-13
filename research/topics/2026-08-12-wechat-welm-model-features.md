---
title: 微信 8 月 12 日公布 WeLM：80B 已用于小微，617B 正在开发
category: topics
topic_type: tech
date: 2026-08-12
time: 18:00
tags: [微信, WeLM, 微信AI, 大模型, MoE, Hidden Decoding, 腾讯, 小微]
summary: 微信官方 8 月 12 日确认 WeLM-80B 已部署于原生 AI 助手“小微”，用于聊天搜索、微信原生功能和小程序服务；617B-A23B MoE 正在开发，面向智能小程序开发与小微工具生成等复杂任务。
tldr: 这次官方披露解决了两个关键疑问：小微线上使用的是 80B 总参数、3B 激活参数的 WeLM-80B；617B 总参数、23B 激活参数的 MoE 仍在开发。此前技术博客公布的 Hidden Decoding、KV-Mirror 和 128K 上下文解释了模型如何控制资源成本，但 617B 上线时间、权重与 API 仍未公布。
subjects: [ai_dev]
content_type: analysis
assistance: codex
model: gpt-5.6
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

2026 年 8 月 12 日 19:59，微信官方 X 账号 `@Weixin_WeChat` 发布三张 WeLM 海报，首次公开说明 80B 与 617B 两个模型在微信产品中的状态。

- **WeLM-80B 已经部署**：官方原文为 “Deployed in Xiaowei, Weixin's native AI assistant”。模型用于聊天与搜索、调用微信原生功能、访问小程序服务。
- **WeLM-617B 正在开发**：官方海报标明 “In Development · MoE Architecture”，目标是用适中的激活参数提升通用理解与推理能力。
- **617B 的目标场景**：智能小程序开发（Intelligent Mini Program Development）与小微工具生成（Xiaowei Tool Generation）。官方没有宣布上线日期。
- **低激活参数**：80B 模型每个 token 约激活 3B 参数，617B 模型约激活 23B 参数。总参数负责容量，激活参数更直接影响单次推理计算量。
- **128K 上下文**：80B 系列先完成 11T tokens 主训练、1.4T 高质量数据退火，再用 1.3T tokens 做上下文扩展。
- **面向服务优化**：KV-Mirror、Grouped-Query Attention、MTP、投机解码与专家并行共同降低预填充、解码和 MoE 通信成本。
- **Hidden Decoding**：一个 token 被展开为多条并行 stream，前几条形成潜空间中间状态，最后一条负责预测。HD4 表示四条 stream。
- **617B 前沿规模实验**：WeLM-HD4-617B 在官方列出的九项早期 SFT-only 自测中全部超过同底座 WeLM-617B；这组结果尚未经过独立复现。
- **发布边界**：8 月 12 日是产品与模型路线披露，不是权重开源。官方仍未公布 WeLM-80B、130B 或 617B 权重、许可证、公开 API，以及 617B 的产品上线日期。

新浪转载稿标题写 617B，正文一处写成 671B。微信官方海报、7 月技术博客与论文均写 **617B**，所以 671B 可以确定为转载文字错误。

## 二、公开版本与时间线

| 时间 | 公开进展 | 可以确认的内容 |
|---|---|---|
| 2022-09 | WeLM 论文公开 | 1.3B、2.7B、10B 稠密模型；以中文为主，兼顾多语言与零/少样本任务 |
| 2026-01-21 | 高效稀疏 MoE 技术文章 | WeLM-80B-A3B、WeLM-130B-A4.9B；不足 14T tokens 训练；128K 上下文 |
| 2026-01-31 | WeLM-V3 后训练文章 | 上一代 WeLM-258B-A22B 的 SFT、强化学习、工具调用与角色扮演实践 |
| 2026-03-02 | Hidden Decoding 首篇文章 | 在 6B、8B、80B 规模验证序列维扩展；开源 Qwen3-8B 验证模型与 SGLang 部署代码 |
| 2026-06 | 微信原生 AI 助手“小微”灰度 | 多家媒体与腾讯客服口径称主模型使用 WeLM，部分查询会调用 DeepSeek |
| 2026-07-14 | Hidden Decoding at Scale | 展示 WeLM-HD4-80B 与 WeLM-HD4-617B，把方法扩展到 100B+ MoE |
| 2026-08-12 | 微信官方 X 账号公布 WeLM 模型海报 | 确认 WeLM-80B 已用于小微；WeLM-617B 正在开发，并说明两者面向的微信功能 |

7 月公开的是 617B 的技术实验与评测，8 月官方海报进一步给出产品状态：80B 已上线小微，617B 仍在开发。两者都没有面向开发者发布权重。

## 三、WeLM 的主要技术特性

### 3.1 高稀疏 MoE：容量与单次计算拆开

WeLM-80B 包含 80B 总参数，每个 token 激活约 3B；WeLM-130B 包含 130B 总参数，激活约 4.9B。两者都有 512 个专家，每个 token 选择 10 个专家，并保留 1 个共享专家。MoE 路由结合 loss-free balance routing 与未归一化 sigmoid gate，目标是减少专家负载失衡带来的额外损失。

617B 版本公开的信息较少。官方给出的口径是 617B 总参数、23B 激活参数，Hidden Decoding 的受控实验使用同一底座、同一数据和同一后训练配方比较自回归版与 HD4 版。

| 模型 | 总参数 | 激活参数 | 已公开状态 |
|---|---:|---:|---|
| WeLM-80B | 80B | 3B | 已部署于小微；权重未公开 |
| WeLM-130B | 130B | 4.9B | 由 80B 做 Depth Up-Scaling；权重未公开 |
| WeLM-258B（V3） | 258B | 22B | 后训练方法与自测公开；官方称为上一代模型 |
| WeLM-617B | 617B | 23B | 正在开发；面向微信生态复杂任务；权重未公开 |
| WeLM-HD4-617B | 617B 主干 | 23B 主干激活 | Hidden Decoding 实验版；未公开权重 |

### 3.2 KV-Mirror：减少长输入的预填充开销

WeLM 把前 1/3 层的隐藏状态以 U 形关系提供给后 1/3 层。后段层保留自己的 K/V 投影参数，但不再从本层输入重新生成全部 K/V。官方称，这种设计可以让预填充阶段提前退出一部分计算，同时避免所有深层都维护独立来源的 KV 激活。

KV-Mirror 也被用于 Hidden Decoding 的工程加速。在 80B、32K 训练设置下，官方报告单个 batch 时间从 15 秒降到 12 秒，约提升 20%。这是团队在自身架构和训练环境中的测量值，外部部署不能直接套用。

### 3.3 128K 上下文与多 Token 预测

80B 模型通过专门的 context extension 阶段把上下文扩展至 128K。官方评测覆盖 RULER、LongBench V2、MRCR V2 和 MTOB 等长上下文任务。

模型另加一层 MoE 作为 Multi-Token Prediction（MTP）层，训练损失权重为 0.3。MTP 可以为投机解码提供候选 token，减少逐 token 串行生成造成的延迟。官方没有公开微信线上服务采用的具体投机解码配置和端到端延迟。

### 3.4 Hidden Decoding：让每个 token 在潜空间里多算几步

Hidden Decoding 把同一个 token 复制到多套 embedding 中，沿序列维展开成多条 stream。以 HD4 为例，每个 token 对应四条 stream；前三条不直接承担下一个 token 的训练损失，最后一条读取这些中间状态后完成预测。

它增加的是并行潜空间计算。输出不会因此自动出现更长的思维链，Transformer 主干参数也不需要复制。官方探针实验显示，中间 stream 会形成不同内部状态，最后一条 stream 会读取其他 stream；把各 stream 的 KV 合并为共享 KV 后，平均成绩有所下降。

代价同样清楚：HD4 会把物理序列长度扩大四倍，非注意力计算量随位置数增加。如果每一层都对扩展后的序列做完整注意力，成本会接近平方增长。

### 3.5 Stream-Factorized Attention：把平方开销压到接近线性

官方在大多数层中只允许同一 stream 关注自己的历史位置，仅让少数层跨 stream 混合。这样既保留信息交换，又避免每层都在四倍长序列上做稠密注意力。

官方实测中，HD4 的有效序列扩大四倍：80B 训练单 batch 用时为基线的 5.1 倍，617B 为 4.4 倍，低于稠密注意力对应的 16 倍量级。增量训练也从已有 checkpoint 开始：80B HD4 续训使用 1.07T tokens，617B HD4 使用 0.90T tokens；表中完整自回归训练路径分别是 20.39T 与 17.06T tokens。两组数字统计边界不同，不能解读为“训练完整 HD4 只需基线约 5% 的总成本”。

## 四、能力表现该怎么读

官方用相同的短 SFT、无强化学习配方，对自回归基线和 HD4 版本做单变量比较。九项早期后训练评测中，HD4 在两个规模上都取得提升。

| 代表性基准 | WeLM-617B | WeLM-HD4-617B | 变化 |
|---|---:|---:|---:|
| GPQA Diamond | 89.1 | 91.2 | +2.1 |
| HLE | 33.6 | 35.4 | +1.8 |
| FrontierMath | 49.0 | 51.0 | +2.0 |
| PHYBench | 75.3 | 76.3 | +1.0 |
| SciCode | 51.4 | 52.1 | +0.7 |

这些结果支持一个有限结论：在同一主干、数据与后训练设置下，Hidden Decoding 带来了稳定增益。它们还不能证明 WeLM-HD4-617B 已经全面领先其他前沿模型，原因有三点：

1. 分数来自团队自测，部分任务使用内部数据集或特定评测设置。
2. 外部模型只用于绝对分参照，没有形成完全同条件的训练对照。
3. 7 月文章展示的 HD4 使用早期 SFT-only 后训练，团队明确写明下一步才会与强化学习充分结合。

## 五、它和微信 AI 产品是什么关系

官方海报已经确认 WeLM-80B 部署于微信原生 AI 助手“小微”。它承担三类能力：聊天与搜索、调用微信原生功能、访问小程序服务。这比此前媒体根据小微自述得出的“主模型采用 WeLM”更具体，型号和产品状态都有官方依据。

WeLM-617B 的官方定位是处理微信生态里的复杂任务，海报举了智能小程序开发和小微工具生成两个方向。它仍标注为“正在开发”，因此不能写成已经部署，也不能推定当前小微的工具生成全部由 617B 提供。

从技术选择看，高稀疏 MoE、KV-Mirror、MTP 和少量激活参数都适合高并发产品。Hidden Decoding 在小 batch 时可以利用空闲计算资源，但在大 batch、计算受限的服务中会降低吞吐。微信是否会把它部署到所有请求，取决于质量增益、延迟、显存与请求分层策略。这一段属于外部研判。

## 六、未能验证

- WeLM-80B、130B、258B、617B 及 HD4 版本均未看到公开权重、模型卡或许可证。
- 当前公开的 Hugging Face 权重是基于 Qwen3-8B 的 Hidden Decoding 方法验证模型，不能称为 WeLM-8B。
- 官方已确认小微部署 WeLM-80B，但其上下文长度、量化方式、流量规模以及与 DeepSeek 等模型的路由规则没有完整披露。
- WeLM-617B 的完成时间、产品上线日期，以及它与 7 月 WeLM-HD4-617B 实验版本是否采用完全相同的后训练配置，没有公开说明。
- 官方基准成绩尚未看到独立第三方复现；内部评测集无法由外部核验。
- 训练基础设施公开了 DualPipeV、DeepEP、FP8 激活量化和算子融合等方案，但没有披露 GPU 型号、数量、训练时长和完整成本。

## 七、信息来源与说明

**官方 / 一手资料**

- [微信官方 X 账号 `@Weixin_WeChat`](https://x.com/Weixin_WeChat) — 2026-08-12 19:59 发布 WeLM-80B 与 WeLM-617B 三张官方海报；80B 已部署于小微，617B 正在开发
- [WeLM 官方博客](https://welm.weixin.qq.com/) — 版本、发布日期与技术文章索引
- [Hidden Decoding at Scale：面向前沿大模型的潜空间计算扩展](https://welm.weixin.qq.com/posts/hidden_decoding_at_scale/) — 80B/617B、Stream-Factorized Attention、成本与评测
- [Hidden Decoding：在预训练中扩展序列长度](https://welm.weixin.qq.com/posts/hidden_decoding/) — 方法原理、消融实验与开源入口
- [以适度资源构建高效稀疏 MoE 模型](https://welm.weixin.qq.com/posts/building-effective-sparse-moe-models-with-moderate-resources/) — 80B/130B 架构、数据、训练和评测
- [初探 WeLM-258B MOE 模型后训练](https://welm.weixin.qq.com/posts/welm-v3-post/) — V3 后训练、强化学习与工具调用
- [Tencent/Sequential-Hidden-Decoding](https://github.com/Tencent/Sequential-Hidden-Decoding) — 论文、代码与 SGLang 部署说明
- [Hugging Face：Sequential Hidden Decoding](https://huggingface.co/collections/tencent/sequential-hidden-decoding) — Qwen3-8B 验证模型
- [WeLM: A Well-Read Pre-trained Language Model for Chinese](https://arxiv.org/abs/2209.10372) — 2022 年 WeLM 论文

**信息源核验**

- [新浪转载的 IT之家报道](https://finance.sina.cn/tech/2026-08-13/detail-ininchpa3516286.d.html) — 提供官方 X 帖截图与三张海报；正文把 617B 误写为 671B，本文按官方海报校正

**站内交叉**

- [微信原生智能体“小微”：灰度进展与 WeLM 技术架构](/articles/research/topics/wechat-xiaowei-native-agent)
- [微信 AI 生态对小程序开放：开发者机会与接入指南](/articles/research/topics/wechat-ai-miniprogram-ecosystem)

资料截至 2026-08-13。模型产品状态采用微信官方 8 月 12 日海报，架构、训练量和评测结果采用微信 AI 团队技术博客与论文；“适合高并发”“可能采用请求分层”等内容属于外部研判。文章尚未经过作者人工事实复核，因此保留 `review_ready: false`。
