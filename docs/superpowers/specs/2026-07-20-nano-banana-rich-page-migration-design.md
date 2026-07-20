# Nano Banana Gallery 多维页面迁移设计

## 目标

将现有 Nano Banana 图片案例页从“资源库”完整迁移到“多维页面”，使导航归类、内容注册、统计口径和 SEO 语义保持一致，同时保留旧链接的访问能力与搜索权重。

## 页面与路由

- 新的唯一正式地址为 `/nano-banana-gallery`。
- 现有 `/resources/nano-banana-gallery` 不再渲染独立页面，改为永久重定向到新地址。
- 页面主体、搜索、输入输出对比、提示词复制和源项目说明保持不变，本次不重新设计画廊交互。
- 页面内面包屑从“内容 · 资源”调整为“多维页面”，并链接到 `/rich-pages`。

## 内容归类

- 从资源库条目、资源型内容注册和资源型索引中移除 Nano Banana Gallery。
- 在 `ENGINEERING_WORKS` 中登记为多维页面，分类使用 `ai-engineering`，页面类型标记为 AI 视觉案例库。
- 页面继续使用站点型展示模式，与当前主站导航、页脚和内容宽度保持一致。
- 多维页面列表成为该页面唯一的站内目录入口，不在资源库重复展示。

## SEO 与统计

- canonical、Open Graph URL 和 Sitemap 全部指向 `/nano-banana-gallery`。
- 旧地址使用永久重定向，避免形成两份可索引内容。
- 在通用内容统计注册表中增加 `rich-page` 类型，并以 `rich-page/nano-banana-gallery` 统计后续访问；互动内容键使用 `rich-page:nano-banana-gallery`。
- 内容解析器识别 `rich-page` 类型，使评论通知、讨论入口和内容索引都能正确返回新地址与标题。
- 将页面纳入多维页面 SEO 注册表，复用现有 `richPageSeo` 的元数据和结构化数据机制。

## 实现边界

- 不改动 `lib/nanoBananaCases.js` 的案例数据。
- 不改动案例生成脚本及上游 GitHub 固定版本。
- 不新增新的视觉样式、筛选项或画廊功能。
- 不迁移或重写旧的 `resource/nano-banana-gallery` 历史统计数据；新地址的多维页面阅读量从新口径独立累计。

## 验证

- 添加自动化检查，确认 Nano Banana Gallery 已进入多维页面注册表且不再存在于资源库注册表。
- 检查新地址的 metadata、canonical 和 Sitemap。
- 检查旧地址返回永久重定向并指向新地址。
- 运行相关自动化测试与完整生产构建，确认静态页面和路由生成成功。
