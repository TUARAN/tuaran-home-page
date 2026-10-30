# 智能体通信视频案例独立站

独立部署到 Cloudflare Pages 项目 `acc`：<https://acc-cpz.pages.dev/>。`public/` 是发布目录，包含页面、站内视频和 Pages 高级模式的 `_worker.js`。

```sh
./standalone/agent-communication-cases/deploy.sh
```

发布脚本在临时目录加载本项目的 `wrangler.toml`，避免仓库主站的 Wrangler 配置覆盖独立站绑定。

页面当前收录 25 条视频，按海外头部智能体、海外其他智能体、Instinct 专题测评、Muse 专题测评与更多智能体+通信视频排列，分别为 4、7、6、4、4 条。每条视频可在站内播放；较长视频按 Cloudflare Pages 单文件体积限制分段。新视频文件放在 `public/media/`，卡片数据保存在 `public/main.js`。

页脚 PV/UV 从计数功能上线后开始累计。`POST /api/visit` 每次打开页面增加一次 PV；UV 使用有效期一年的匿名浏览器 Cookie 去重，不保存 IP 或 User-Agent。数据保存在独立的 D1 数据库 `acc-visitor-stats`。数据库结构见 `stats-schema.sql`，部署时通过 `wrangler.toml` 绑定为 `STATS_DB`。
