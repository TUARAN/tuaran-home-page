# 小眼睛地区 Runner

每个 Runner 提供一个受共享密钥保护的单次网站检查端点。将同一镜像部署到不同云地区后，后台“小眼睛”可以一次收集多个真实出口 IP、HTTP 状态码和耗时。

Runner 与 Cloudflare 控制面使用同一套安全边界：仅接受 HTTPS、禁止账号密码和自定义端口、禁止本地或 IP 目标，并只允许 `BLOGGER_EYE_ALLOWED_HOSTS` 中登记的域名。默认允许 `2aran.com` 与 `*.2aran.com`。

## 构建与运行

```bash
docker build -t blogger-eye-runner tools/blogger-eye-runner
docker run --rm -p 8080:8080 \
  -e BLOGGER_EYE_REGION=hkg \
  -e BLOGGER_EYE_ALLOWED_HOSTS=example.com,*.example.com \
  -e BLOGGER_EYE_RUNNER_SECRET='替换为随机长密钥' \
  blogger-eye-runner
```

部署平台必须提供公网 HTTPS 地址。健康检查为 `GET /health`，控制面调用 `POST /api/check`。不要把 Runner 端口直接暴露成无鉴权代理。

## 接入 Cloudflare Pages

在项目根目录交互式设置两个加密 Secret：

```bash
npx wrangler pages secret put BLOGGER_EYE_RUNNERS --project-name tuaran
npx wrangler pages secret put BLOGGER_EYE_RUNNER_SECRET --project-name tuaran
```

`BLOGGER_EYE_RUNNERS` 的值是 JSON 数组，最多 8 个端点：

```json
[
  {"id":"hkg","label":"香港","url":"https://hkg-runner.example.com/api/check"},
  {"id":"sin","label":"新加坡","url":"https://sin-runner.example.com/api/check"}
]
```

`BLOGGER_EYE_RUNNER_SECRET` 必须与每个 Runner 的同名环境变量一致。新增获授权目标域名时，在 Pages 和所有 Runner 上同步设置 `BLOGGER_EYE_ALLOWED_HOSTS`；Pages 中可使用普通加密变量保存它。

## 使用 Locust 做授权压测

探测接口每次只发出一次请求。需要对自有网站做小规模压力测试时，可以让相同镜像进入 Locust 模式：

```bash
docker run --rm \
  -e BLOGGER_EYE_TARGET_URL=https://2aran.com/health \
  -e BLOGGER_EYE_ALLOWED_HOSTS=2aran.com,*.2aran.com \
  blogger-eye-runner \
  locust -f locustfile.py --headless --users 5 --spawn-rate 1 --run-time 30s
```

只对自有或明确获授权的目标运行。用户数、生成速率和持续时间应从小值开始；多地区部署产生的网络与计算费用由对应云平台计费。

## 测试

```bash
cd tools/blogger-eye-runner
python3 -m unittest -v test_runner.py
```
