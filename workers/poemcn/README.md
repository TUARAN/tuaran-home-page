# 中国诗词 Worker

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
