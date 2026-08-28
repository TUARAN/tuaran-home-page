# 阿燃诗词 Worker

独立部署的古诗文阅读与数据采集站，目标域名为 `poemcn.2aran.com`。

主站的 Cloudflare Pages 构建不会发布这个 Worker。修改 `workers/poemcn/` 后，需单独测试并部署，确保线上脚本与页面同步更新：

```bash
npm --prefix workers/poemcn test
npx wrangler deploy --dry-run --config workers/poemcn/wrangler.toml
npx wrangler dev --config workers/poemcn/wrangler.toml
npx wrangler deploy --config workers/poemcn/wrangler.toml
```

静态页面位于 `public/`，搜索、D1 查询和定时采集器位于 `src/`。机器人每 15 分钟从 MIT 开源的 `chinese-poetry` 数据集导入一批记录，按朝代、体裁、格律和主题自动分类。

```bash
pnpm dlx wrangler@4.125.0 d1 migrations apply china-poetry --local --config workers/poemcn/wrangler.toml
pnpm dlx wrangler@4.125.0 d1 migrations apply china-poetry --remote --config workers/poemcn/wrangler.toml
```

数据来源和许可会随每条诗文保存。采集状态可通过 `/api/stats` 查询。

## 共享主站登录

诗词站通过带凭证的 `https://2aran.com/api/subsites/session` 读取主站会话；登录、账户管理和退出均使用主站入口。没有独立账号库，不复制主站签名密钥，不在浏览器存储登录令牌。重新聚焦、恢复页面或切回标签时刷新状态；接口异常显示可重试的错误，不伪装成游客。

发布顺序：先发布主站 `lib/subsiteOrigins.js` 中的精确来源与回跳白名单，再单独部署诗词 Worker 的静态页面。仅发布诗词站会导致跨源会话请求被拒绝，登录回跳被主站重置。

2026-08-28 已发布：主站手动部署 `95269828-aaac-427d-be19-8f68629504d9`，诗词 Worker 版本 `3f3defa1-297d-42f3-83c1-b71c9c1bbd57`。完整公开站构建和 38 项测试通过，生产 CORS 预检已从 403 变为 204。后续 Git 自动部署以包含本次白名单的提交为准；浏览器验收连接超时，尚未验证真实账号的完整登录与退出流程。

## 品牌与搜索抓取

品牌统一为 **阿燃诗词**（Aran Poetry），描述性副标题为“古诗词与文言文”，保留现有域名，不迁移 URL。主站 `/sites` 与首页入口使用相同名称。

- 首页由 Worker 直接输出 D1 中的推荐诗文与真实阅读链接，并内嵌首屏数据，浏览器无需再请求一次首屏内容。
- `/poems/<id>` 返回独立 HTML 阅读页、唯一标题、canonical、作品来源和 CreativeWork 数据；没有译文或赏析的记录不宣称已有相应资料。
- `/sitemap.xml` 返回 sitemap index，首页及诗文分片位于 `/sitemaps/`。诗文以稳定 rowid 区间每 1000 条分片，lastmod 取数据库实际更新时间，不用每次请求时间伪装更新。
- `/robots.txt` 声明站点地图；未知地址返回 404，数据故障返回 503；搜索参数页 noindex，workers.dev 页面跳回正式域名。
- `WebSite` 结构化数据、页面品牌和 Open Graph 信息一致。没有伪造评价、访问量或搜索排名。

上线后可在 Google Search Console、Bing Webmaster Tools、百度搜索资源平台验证站点并提交 `https://poemcn.2aran.com/sitemap.xml`，优先检查首页和几个代表诗文页。提交需要站点所有者账号与相应权限；公开 `site:` 检索不是完整收录报告。抓取、收录与排名由搜索引擎决定，不能承诺“立即搜到”或通用词排名第一。先观察品牌词“阿燃诗词”，再观察“诗名 + 作者 + 阿燃诗词”的展现与点击。
