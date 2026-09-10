#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null; then
  for candidate in "$HOME/.local/bin/node" /opt/homebrew/bin/node /usr/local/bin/node; do
    if [[ -x "$candidate" ]]; then export PATH="$(dirname "$candidate"):$PATH"; break; fi
  done
fi
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw new Error("需要 Node.js 22 或更新版本")'
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run doctor
npm run configure
echo '检查完成。上方为配置预览；运行 npm run configure -- --apply 可注册模拟/DRY 模式。'
