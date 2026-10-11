# 路由 SEO 审计

`npm run seo:routes:audit` 扫描 App Router 的全部页面，检查普通静态页注册状态，以及 canonical、noindex、Open Graph、JSON-LD 和 Sitemap 的缺失或冲突。结果写入被 Git 忽略的 `tmp/seo-route-audit.current.json`，并与仓库中的 `route-audit.snapshot.json` 比较。

审计结果有变化时，CI 会失败。先查看当前文件与基线的差异；确认变更符合预期后运行 `npm run seo:routes:update`，把更新后的快照与代码一并提交。这样，已有欠账可以逐步减少，修复过的问题也不会在不更新快照的情况下悄悄回来。

审计脚本与快照只在 Node / CI 中读取。普通页面注册表仅由服务端 Sitemap 路由导入；测试会阻止它被客户端页面引用，因此这些文件不会进入浏览器 JavaScript 包。

Cloudflare 公网站构建会临时把后台路由移入 `.public-pages-build-excluded`。审计会读取该暂存目录并还原为原始路由身份，因此隔离构建期间不会产生虚假的路由删除。
