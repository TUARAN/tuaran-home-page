# 自建 SadTalker API

这是本站数字人口播的兼容服务。它把 SadTalker 官方命令行封装成异步 API，同一时间只运行一个推理任务；网站负责中文 TTS、任务记录、鉴权和最终视频的私有 R2 存储。

## GPU 服务器部署

要求 Linux、NVIDIA 驱动、Docker、Docker Compose 和 NVIDIA Container Toolkit。建议至少 8 GB 显存。

```bash
cd services/sadtalker-api
cp .env.example .env
# 修改 .env 中的公开 HTTPS 地址和随机密钥
docker compose build
docker compose up -d
curl https://avatar-gpu.example.com/health
```

镜像固定在 SadTalker 官方仓库提交 `cd4c0465ae0b54a6f85af57f5c65fec9fe23e7f8`，避免上游变化导致部署结果漂移。首次构建会下载模型，耗时较长且镜像较大。

用 Caddy、Nginx 或 Cloudflare Tunnel 把本机 `8000` 端口暴露成 HTTPS。不要直接把未加 TLS 的端口暴露到公网。

然后给 Cloudflare Pages 配置：

```text
SADTALKER_API_BASE_URL=https://avatar-gpu.example.com
SADTALKER_API_TOKEN=与自建服务 .env 完全相同
```

重新部署网站后，“自建 SadTalker”Tab 会从灰点变成绿点。

## 本机运行

本机需要 Python 3.10、Git 和 FFmpeg。初始化脚本会固定 SadTalker 版本、创建独立虚拟环境并下载模型：

```bash
cd services/sadtalker-api
cp .env.example .env
# 修改 .env；本机无 NVIDIA GPU 时使用 SADTALKER_DEVICE=cpu
./scripts/bootstrap-local.sh
./scripts/run-local.sh
```

NVIDIA Linux 主机优先使用上面的 Docker Compose。macOS 或没有 NVIDIA GPU 的机器可以用 CPU 模式联调，但生成速度会明显慢，不建议作为正式服务。

线上 Cloudflare Pages 无法访问 `127.0.0.1`，本机服务必须通过 Cloudflare Tunnel 等方式获得一个可由公网访问的 HTTPS 地址，并同步填写 `SADTALKER_PUBLIC_BASE_URL`。

## API 契约

- `GET /health`：无需密钥的就绪检查。
- `POST /v1/jobs`：创建任务，返回 `id` 和 `queued`。
- `GET /v1/jobs/{id}`：查询 `queued / processing / succeeded / failed / canceled`。
- `POST /v1/jobs/{id}/cancel`：取消排队或运行中的任务。
- `GET /v1/jobs/{id}/output`：由本站后端带 Bearer Token 读取成片。

输入下载和回调域名默认只允许 `2aran.com`。如网站域名变化，修改
`SADTALKER_ALLOWED_INPUT_HOSTS` 与 `SADTALKER_ALLOWED_WEBHOOK_HOSTS`，不要使用任意域名通配，以免形成 SSRF 入口。
