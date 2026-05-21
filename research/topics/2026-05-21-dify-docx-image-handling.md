---
title: Dify 知识库导入带图文 DOCX 的图片处理机制调研
category: topics
topic_type: tech
date: 2026-05-21
tags: [Dify, RAG, 知识库, DOCX, 多模态, 图片处理]
summary: Dify 导入带图 DOCX 的完整图片链路：抽取层不限格式/大小，多模态索引层限 JPG/PNG/GIF ≤2MB（可配），普通嵌入下图片不向量化、仅随 chunk 透传。
source: claude-code
model: claude-opus-4-7
---

> **本篇定位**：严格事实驱动的技术调研。每个事实点标注来源；一手依据为 Dify 官方仓库源码、官方 release notes 与仓库内环境变量示例。推断性结论会明确标注「推断」。截至 **2026-05-21**，Dify 最新版本 **v1.14.2**（2026-05-19 发布）；多模态知识库自 **v1.11.0** 引入。
>
> 来源标记：`[源码]` = `langgenius/dify` main 分支源码；`[v1.11.0]`/`[v1.11.1]` = 对应 release notes；`[env]` = 仓库环境变量示例；`[releases]` = GitHub releases 列表；`[社区]` = 非官方/issue。完整链接见第九节。

## 结论速览

- **会提取**：Dify 导入 DOCX 时由 `WordExtractor` 抽取文档内**全部**图片——抽取层**不限格式、不限大小** `[源码]`。
- **真正的限制在「入多模态索引」环节**：官方明示仅 **JPG / PNG / GIF 且 ≤ 2 MB** 的图片会作为附件挂到 chunk `[v1.11.0]`。2 MB 阈值由环境变量 `ATTACHMENT_IMAGE_FILE_SIZE_LIMIT` 控制，**自托管可改** `[env]`。
- **内嵌图 vs 外链图**：源码显式区分；外链图（仅 URL）经 `ssrf_proxy` 下载后**本地化重托管**，与内嵌图一样落进 Dify 自有存储 `[源码]`。
- **检索取决于 embedding 模型**：普通文本 embedding 下图片**不向量化、不可被独立检索**，仅作为 chunk 内的 markdown 引用随行透传给 Vision LLM；多模态 embedding 下图片**向量化**，支持 text↔image / image↔image 跨模态检索 `[v1.11.0]`。
- **每 chunk 图片数量**：官方**未设/未公开**硬性上限 `[源码][v1.11.0]`。

## 一、图片提取：是否读取、格式、大小限制

- Dify 知识库导入 DOCX，由 `api/core/rag/extractor/word_extractor.py` 的 `WordExtractor` 类处理 `[源码]`。
- 方法 `_extract_images_from_docx(doc)` 遍历 `doc.part.rels`，凡关系 `target_ref` 含 `"image"` 即抽取——**源码中无格式白名单、无大小（size）校验**，`UploadFile.size` 甚至硬编码为 `0` `[源码]`。
  → 即：**抽取这一步对格式、大小不做任何过滤**。
- 但官方对「最终进入（多模态）知识库」的图片有明确限定：**JPG、PNG、GIF 且 ≤ 2 MB** `[v1.11.0]`（原文："Dify grabs them automatically (JPG, PNG, GIF ≤ 2 MB)"）。
- **推断**：结合源码与 release notes——格式/大小过滤发生在**抽取之后的「附件挂载 / 多模态索引」阶段**，而非 DOCX 抽取阶段。

## 二、嵌入图片 vs 外链图片

`_extract_images_from_docx` 用 `rel.is_external` 显式分两条路径处理 `[源码]`：

| 类型 | 判定 | 处理方式 | `image_map` key |
|---|---|---|---|
| **内嵌图片** | `is_external == False` | 直接取 `rel.target_part.blob`（DOCX 内的图片二进制），扩展名取关系路径后缀 | `target_part` |
| **外链图片**（仅 URL） | `is_external == True` | 经 `core.helper.ssrf_proxy.get(url)` 下载（SSRF 防护）；扩展名由响应 `Content-Type` 猜测；下载失败则 `warning` 并**跳过该图**，不中断整篇 | `rId` |

- 两类最终**都被落地到 Dify 自有存储**，并替换为内联 markdown：`![image]({FILES_URL}/files/{id}/file-preview)` `[源码]`。
  → 外链图片不会以「裸 URL」留存，而是被**下载并本地化重托管**。
- v1.11.1 专门修复过「DOCX 外链图片导致抽取失败」的缺陷（PR #29558，`[v1.11.1]` § Document Handling）。

## 三、底层技术逻辑：解压 / 解析 / 存储 / 与 chunk 关联

- **解压 / 解析**：DOCX 是 OOXML（本质 zip 包）；Dify 用 `python-docx`（`from docx import Document`）解析，不手动解压 `[源码]`。
- **流程**（`parse_docx()`）`[源码]`：
  1. 先 `_extract_images_from_docx()` 建立 `image_map`（关系 → markdown 图片串）；
  2. 再逐段落、逐表格遍历；遇到 drawing 型图片（`<a:blip r:embed>`）或 VML/`pict` 型图片，按关系 id 替换为 `image_map` 中的内联 markdown。
- **存储**：`storage.save("image_files/{tenant_id}/{uuid}.{ext}", blob)`——写入 `ext_storage`（后端由 `STORAGE_TYPE` 决定：本地 / S3 / OSS 等）；同时向 DB `UploadFile` 表写入元数据 `[源码]`。
- **与 chunk 的关联**：`WordExtractor` 的产物是**一段带内联 `![image]()` 的 Markdown 文本**。分段（chunk）时，图片引用随其所在文本位置落入对应分段——即官方所说「每张图片绑定其所在文本块」`[v1.11.0]`（"Each image is linked to its matching text chunk"）。

## 四、索引与检索：普通嵌入 vs 多模态嵌入

`[v1.11.0]` § "Embedding Behavior" 明确两种行为：

| 维度 | 普通（纯文本）embedding | 多模态 embedding（带 Vision 标记） |
|---|---|---|
| 图片是否向量化 | **否** | **是**（文本 + 图片都向量化）|
| 图片能否被语义检索 | 否——图片只是 chunk 文本里的 markdown 引用 | 能——支持 text↔image、image↔image、image↔text 跨模态检索 |
| 返回 / 使用形式 | 命中 chunk 时图片随行；配合 **Vision LLM** 时图片进入 prompt | 检索直接命中图片；Vision LLM 可「看图」并解释图中细节 |
| 知识库标记 | 无 | 出现 **Multimodal** 标记 |

- 支持的多模态 embedding 模型 `[v1.11.0]`：AWS Bedrock `nova-2-multimodal-embeddings-v1:0`、Google Vertex AI `multimodalembedding@001`、Jina（`jina-embedding-v4` / `jina-clip-v1` / `jina-clip-v2` / `jina-reranker-m0`）、Tongyi `multimodal-embedding-v1`。
- Knowledge Pipeline 的 `KnowledgeBase` 节点新增两种分段模式：`multimodal-Parent-Child`、`multimodal-General` `[v1.11.0]`。
- 一句话：**图片要能被检索，必须选用多模态 embedding 模型**；否则图片只是「跟着文本走」的附件。

## 五、每分段图片数量上限 / 超限行为 / 自托管可配置项

- **每分段图片数量：官方未设、亦未公开硬性上限。** 抽取层 `_extract_images_from_docx` 对单文档图片数量无限制（仅有计数变量 `image_count`，未被用作上限）`[源码]`；release notes 与官方文档均未提「每 chunk 最多 N 张图」。
  → 用户问题中「每分段最多几张图」这一前提，**目前没有官方依据**；真正的约束是「单张图片」的格式与大小，不是数量。
- **单张图片限制**：JPG / PNG / GIF + ≤ 2 MB；不满足者不进入多模态附件 / 索引 `[v1.11.0]`。
- **自托管可改大小阈值** `[env]`：
  - `ATTACHMENT_IMAGE_FILE_SIZE_LIMIT`（单位 MB，默认 `2`）——知识库附件图片大小上限。`web/models/common.ts` 注释印证："default is 2MB, for dataset attachment upload only"。
  - `UPLOAD_IMAGE_FILE_SIZE_LIMIT`（默认 `10` MB）——通用图片上传上限（非本场景核心）。
- **格式白名单是否可配置**：未见对应环境变量；扩展支持格式需改源码 `[未见官方配置项]`。

## 六、官方文档、链接、版本信息（截至 2026-05-21）

- 多模态知识库自 **v1.11.0** 引入（release 标题 "Your knowledge base just went from mono to full HD"）；**v1.11.1** 修复 DOCX 外链图片抽取失败。
- 截至 2026-05-21，Dify 最新 release **v1.14.2**（2026-05-19）`[releases]`。本文「抽取层」「`ATTACHMENT_IMAGE_FILE_SIZE_LIMIT`」依据 **main 分支当前源码**，对 v1.14.x 仍成立；v1.12–v1.14 release notes 未见对 DOCX 图片机制的颠覆性改动（未逐版精校，属本文已知边界）。
- 关键官方页面见第九节。

## 七、关键限制汇总

| 项 | 限制 | 可否自托管调整 | 来源 |
|---|---|---|---|
| 单张图片大小 | ≤ 2 MB（默认） | ✅ `ATTACHMENT_IMAGE_FILE_SIZE_LIMIT` | `[env]` |
| 图片格式（入索引） | JPG / PNG / GIF | ❌ 无配置项，需改源码 | `[v1.11.0]` |
| 抽取层格式/大小 | 不限 | —— | `[源码]` |
| 每 chunk 图片数 | 无公开上限 | —— | `[源码][v1.11.0]` |
| 图片可被检索 | 仅多模态 embedding 下 | 取决于所选模型 | `[v1.11.0]` |
| 外链图片 | 经 `ssrf_proxy` 下载、本地化；失败即丢弃该图 | —— | `[源码]` |
| 普通 embedding | 图片不向量化，仅随 chunk 透传 Vision LLM | —— | `[v1.11.0]` |

**已知问题（社区，非官方结论）**：GitHub issue #11134 反馈「分段时文档图片丢失」、issue #30771 反馈「多模态知识库图片 embedding 不可检索 / 检索结果图片不渲染」——属社区 issue，是否已修复需对照具体版本，本文不据此下定论。`[社区]`

## 八、调研结论与建议

- **一句话定性**：Dify 对带图 DOCX 的处理是「**抽取层全收 + 索引层按 JPG/PNG/GIF≤2MB 过滤 + 检索能力取决于 embedding 模型**」的三段式机制——机制清晰，但「图片能否被检索」这一关键能力强依赖是否选用多模态 embedding 模型。
- **是否跟进**：**跟进（可用于生产，但需配置到位）**。若目标是「图片能被语义检索」，必须：① 升级到 ≥ v1.11.0；② 选多模态 embedding 模型（并把对应插件更新到最新版）；③ 用 `multimodal-General` / `multimodal-Parent-Child` 分段模式。
- **下一步行动**：
  1. 自托管若图片常超 2 MB，先调 `ATTACHMENT_IMAGE_FILE_SIZE_LIMIT`；
  2. 非 JPG/PNG/GIF（如 WebP/SVG/EMF）目前进不了索引，导入前先转码；
  3. 验收时单独测「外链图片 DOCX」（历史上有 bug，v1.11.1 才修）。
- **适用场景**：Dify 知识库选型、带图技术文档入库方案评估、多模态 RAG 落地。

## 九、信息来源

### 一手 / 官方

- [Dify v1.11.0 Release Notes](https://github.com/langgenius/dify/releases/tag/1.11.0) — § "Multimodal Knowledge Base"：图片格式 JPG/PNG/GIF ≤2MB、图片绑定 chunk、普通 vs 多模态 embedding 行为、多模态模型清单、`multimodal-*` 分段模式
- [Dify v1.11.1 Release Notes](https://github.com/langgenius/dify/releases/tag/1.11.1) — § "Document Handling"：修复 DOCX 外链图片抽取失败（PR #29558）
- [word_extractor.py 源码（main 分支）](https://github.com/langgenius/dify/blob/main/api/core/rag/extractor/word_extractor.py) — `WordExtractor` / `_extract_images_from_docx` / `parse_docx`：内嵌 vs 外链分流、`ssrf_proxy`、存储路径、内联 markdown、无格式/大小过滤
- [docker/envs/core-services/shared.env.example](https://github.com/langgenius/dify/blob/main/docker/envs/core-services/shared.env.example) — `ATTACHMENT_IMAGE_FILE_SIZE_LIMIT=2`、`UPLOAD_IMAGE_FILE_SIZE_LIMIT=10`
- [web/models/common.ts](https://github.com/langgenius/dify/blob/main/web/models/common.ts) — 注释："attachment_image_file_size_limit ... default is 2MB, for dataset attachment upload only"
- [Dify 官方博客 — Multimodal retrieval is now available in the knowledge base](https://dify.ai/blog/multimodal-retrieval-is-now-available-in-the-knowledge-base)
- [Dify Docs — Knowledge Pipeline 编排](https://docs.dify.ai/en/use-dify/knowledge/knowledge-pipeline/knowledge-pipeline-orchestration)
- [Dify GitHub Releases（版本信息，v1.14.2 为最新）](https://github.com/langgenius/dify/releases)
- 多模态知识库实现 PR：[#29115](https://github.com/langgenius/dify/pull/29115)、[#27793](https://github.com/langgenius/dify/pull/27793)；外链图片修复 [#29558](https://github.com/langgenius/dify/pull/29558)

### 社区 / 第三方（非官方，仅供参考）

- [GitHub Issue #11134](https://github.com/langgenius/dify/issues/11134) — 社区反馈：分段时文档图片丢失
- [GitHub Issue #30771](https://github.com/langgenius/dify/issues/30771) — 社区反馈：多模态知识库图片 embedding 不可检索、检索结果图片不渲染

> 边界说明：本文未逐版精校 v1.12–v1.14 release notes；「抽取层无过滤」「2MB 可配」依据 main 分支当前源码，若官方后续调整以最新源码 / release notes 为准。
