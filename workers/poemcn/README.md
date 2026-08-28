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
