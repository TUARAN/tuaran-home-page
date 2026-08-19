#!/usr/bin/env bash

set -euo pipefail

CONFIG_ROOT="${XDG_CONFIG_HOME:-${HOME}/.config}/tuaran-ollama"
CONFIG_FILE="${CONFIG_ROOT}/nas.env"
SYNC_CONFIG_FILE="${CONFIG_ROOT}/sync.env"
DEFAULT_URL="https://ollama.2aran.com"
DEFAULT_MODEL="qwen3.5:9b"
DEFAULT_SYNC_URL="https://admin.2aran.com/api/admin/deepseek-tasks/local-sync"
SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STORE_SCRIPT="${SCRIPT_ROOT}/ollama-nas-store.py"
UI_SCRIPT="${SCRIPT_ROOT}/ollama-nas-ui.py"

usage() {
  cat <<'EOF'
用法：
  scripts/ollama-nas.sh setup             配置 Cloudflare Access 凭据
  scripts/ollama-nas.sh sync-setup        配置线上调用记录同步
  scripts/ollama-nas.sh check             查看 NAS Ollama 模型列表
  scripts/ollama-nas.sh hello             向 NAS 上的 Qwen 打招呼
  scripts/ollama-nas.sh chat [消息]       发送自定义消息
  scripts/ollama-nas.sh history [数量]    查看最近调用，默认 20 条
  scripts/ollama-nas.sh show <ID>         查看一条调用的完整内容
  scripts/ollama-nas.sh stats [天数]      汇总用量，默认最近 30 天
  scripts/ollama-nas.sh ui [端口]         启动本地可视化控制台，默认 8788
  scripts/ollama-nas.sh sync [记录 ID]    同步一条或全部待同步记录

凭据保存在 ~/.config/tuaran-ollama/nas.env，不会写入项目。
记录保存在 ~/.local/share/tuaran-ollama/calls.sqlite3。
EOF
}

setup_config() {
  local client_id client_secret base_url model temp_file

  printf 'Cloudflare Access Client ID: '
  IFS= read -r client_id
  printf 'Cloudflare Access Client Secret（输入不会显示）: '
  IFS= read -r -s client_secret
  printf '\nOllama 地址 [%s]: ' "$DEFAULT_URL"
  IFS= read -r base_url
  printf '模型 [%s]: ' "$DEFAULT_MODEL"
  IFS= read -r model

  base_url="${base_url:-$DEFAULT_URL}"
  model="${model:-$DEFAULT_MODEL}"

  if [[ -z "$client_id" || -z "$client_secret" ]]; then
    printf '错误：Client ID 和 Client Secret 不能为空。\n' >&2
    exit 1
  fi
  if [[ "$base_url" != https://* ]]; then
    printf '错误：远程 Ollama 地址必须使用 HTTPS。\n' >&2
    exit 1
  fi

  mkdir -p "$CONFIG_ROOT"
  chmod 700 "$CONFIG_ROOT"
  temp_file="$(mktemp "${CONFIG_ROOT}/nas.env.XXXXXX")"
  trap 'rm -f "${temp_file:-}"' EXIT
  chmod 600 "$temp_file"

  {
    printf 'CF_ACCESS_CLIENT_ID=%q\n' "$client_id"
    printf 'CF_ACCESS_CLIENT_SECRET=%q\n' "$client_secret"
    printf 'OLLAMA_NAS_URL=%q\n' "${base_url%/}"
    printf 'OLLAMA_NAS_MODEL=%q\n' "$model"
  } > "$temp_file"

  mv "$temp_file" "$CONFIG_FILE"
  chmod 600 "$CONFIG_FILE"
  trap - EXIT
  printf '配置已保存：%s\n' "$CONFIG_FILE"
}

setup_sync() {
  local sync_token sync_url device_name device_id temp_file

  if [[ -f "$SYNC_CONFIG_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$SYNC_CONFIG_FILE"
  fi
  device_id="${LOCAL_LLM_DEVICE_ID:-$(python3 -c 'import uuid; print(uuid.uuid4())')}"

  printf 'LOCAL_LLM_SYNC_SECRET（输入不会显示）: '
  IFS= read -r -s sync_token
  printf '\n同步地址 [%s]: ' "${LOCAL_LLM_SYNC_URL:-$DEFAULT_SYNC_URL}"
  IFS= read -r sync_url
  printf '设备名称 [%s]: ' "${LOCAL_LLM_DEVICE_NAME:-MacBook-Pro}"
  IFS= read -r device_name

  sync_url="${sync_url:-${LOCAL_LLM_SYNC_URL:-$DEFAULT_SYNC_URL}}"
  device_name="${device_name:-${LOCAL_LLM_DEVICE_NAME:-MacBook-Pro}}"
  if [[ -z "$sync_token" ]]; then
    printf '错误：LOCAL_LLM_SYNC_SECRET 不能为空。\n' >&2
    exit 1
  fi
  if [[ "$sync_url" != https://* ]]; then
    printf '错误：同步地址必须使用 HTTPS。\n' >&2
    exit 1
  fi

  mkdir -p "$CONFIG_ROOT"
  chmod 700 "$CONFIG_ROOT"
  temp_file="$(mktemp "${CONFIG_ROOT}/sync.env.XXXXXX")"
  trap 'rm -f "${temp_file:-}"' EXIT
  chmod 600 "$temp_file"
  {
    printf 'LOCAL_LLM_SYNC_SECRET=%q\n' "$sync_token"
    printf 'LOCAL_LLM_SYNC_URL=%q\n' "$sync_url"
    printf 'LOCAL_LLM_DEVICE_ID=%q\n' "$device_id"
    printf 'LOCAL_LLM_DEVICE_NAME=%q\n' "$device_name"
  } > "$temp_file"
  mv "$temp_file" "$SYNC_CONFIG_FILE"
  chmod 600 "$SYNC_CONFIG_FILE"
  trap - EXIT
  python3 "$STORE_SCRIPT" init >/dev/null
  printf '同步配置已保存：%s\n' "$SYNC_CONFIG_FILE"
}

load_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    printf '尚未配置。请先运行：scripts/ollama-nas.sh setup\n' >&2
    exit 1
  fi

  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
  if [[ -f "$SYNC_CONFIG_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$SYNC_CONFIG_FILE"
  fi

  : "${CF_ACCESS_CLIENT_ID:?配置缺少 CF_ACCESS_CLIENT_ID}"
  : "${CF_ACCESS_CLIENT_SECRET:?配置缺少 CF_ACCESS_CLIENT_SECRET}"
  : "${OLLAMA_NAS_URL:?配置缺少 OLLAMA_NAS_URL}"
  : "${OLLAMA_NAS_MODEL:?配置缺少 OLLAMA_NAS_MODEL}"
}

sync_call() {
  local call_id="$1" payload_file response_file error_file remote_task_id sync_error
  if [[ -z "${LOCAL_LLM_SYNC_SECRET:-}" || -z "${LOCAL_LLM_SYNC_URL:-}" ]]; then
    return 0
  fi

  payload_file="$(mktemp "${TMPDIR:-/tmp}/ollama-sync-payload.XXXXXX")"
  response_file="$(mktemp "${TMPDIR:-/tmp}/ollama-sync-response.XXXXXX")"
  error_file="$(mktemp "${TMPDIR:-/tmp}/ollama-sync-error.XXXXXX")"
  python3 "$STORE_SCRIPT" sync-payload "$call_id" \
    --device-id "$LOCAL_LLM_DEVICE_ID" \
    --device-name "$LOCAL_LLM_DEVICE_NAME" > "$payload_file"

  if curl --fail-with-body --silent --show-error \
    --connect-timeout 10 \
    --max-time 30 \
    -H "Authorization: Bearer ${LOCAL_LLM_SYNC_SECRET}" \
    -H 'Content-Type: application/json' \
    --data-binary "@${payload_file}" \
    "$LOCAL_LLM_SYNC_URL" > "$response_file" 2> "$error_file"; then
    remote_task_id="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8")).get("taskId", ""))' "$response_file")"
    python3 "$STORE_SCRIPT" mark-sync "$call_id" --status synced --task-id "$remote_task_id"
    printf '线上同步成功：本地 #%s → %s\n' "$call_id" "$remote_task_id" >&2
  else
    sync_error="$(<"$error_file") $(<"$response_file")"
    OLLAMA_SYNC_ERROR="$sync_error" python3 "$STORE_SCRIPT" mark-sync "$call_id" --status failed
    printf '警告：本地调用已保存，但线上同步失败；可稍后运行 sync 重试。\n' >&2
  fi
  rm -f "$payload_file" "$response_file" "$error_file"
}

sync_pending() {
  local requested_id="${1:-}" call_id synced=0
  load_config
  if [[ -z "${LOCAL_LLM_SYNC_SECRET:-}" ]]; then
    printf '尚未配置线上同步。请先运行：scripts/ollama-nas.sh sync-setup\n' >&2
    exit 1
  fi
  python3 "$STORE_SCRIPT" init >/dev/null
  if [[ -n "$requested_id" ]]; then
    sync_call "$requested_id"
    return
  fi
  while IFS= read -r call_id; do
    [[ -z "$call_id" ]] && continue
    sync_call "$call_id"
    synced=$((synced + 1))
  done < <(python3 "$STORE_SCRIPT" pending --limit 200)
  printf '已处理 %s 条待同步记录。\n' "$synced"
}

curl_ollama() {
  curl --fail-with-body --silent --show-error \
    --connect-timeout 15 \
    --max-time 180 \
    -H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
    -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
    "$@"
}

pretty_json() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json, sys; json.dump(json.load(sys.stdin), sys.stdout, ensure_ascii=False, indent=2); print()'
  else
    cat
  fi
}

check_ollama() {
  load_config
  curl_ollama "${OLLAMA_NAS_URL}/api/tags" | pretty_json
}

chat_ollama() {
  local prompt="${1:-}" request_file response_file error_file started_at_ms exit_code call_id
  load_config

  if [[ -z "$prompt" ]]; then
    if [[ "${OLLAMA_NONINTERACTIVE:-}" != "1" ]]; then
      printf '你想对 Qwen 说什么：'
    fi
    IFS= read -r prompt
  fi
  if [[ -z "$prompt" ]]; then
    printf '错误：消息不能为空。\n' >&2
    exit 1
  fi

  request_file="$(mktemp "${TMPDIR:-/tmp}/ollama-nas-request.XXXXXX")"
  response_file="$(mktemp "${TMPDIR:-/tmp}/ollama-nas-response.XXXXXX")"
  error_file="$(mktemp "${TMPDIR:-/tmp}/ollama-nas-error.XXXXXX")"
  trap 'rm -f "${request_file:-}" "${response_file:-}" "${error_file:-}"' EXIT

  OLLAMA_CHAT_PROMPT="$prompt" python3 - "$OLLAMA_NAS_MODEL" > "$request_file" <<'PY'
import json
import os
import sys

print(json.dumps({
    "model": sys.argv[1],
    "messages": [{"role": "user", "content": os.environ["OLLAMA_CHAT_PROMPT"]}],
    "stream": False,
    "think": False,
}, ensure_ascii=False))
PY

  started_at_ms="$(python3 -c 'import time; print(int(time.time() * 1000))')"
  if curl_ollama \
    -H 'Content-Type: application/json' \
    --data-binary "@${request_file}" \
    "${OLLAMA_NAS_URL}/api/chat" > "$response_file" 2> "$error_file"; then
    call_id="$(OLLAMA_LOG_PROMPT="$prompt" python3 "$STORE_SCRIPT" record \
        --status succeeded \
        --started-at-ms "$started_at_ms" \
        --endpoint "$OLLAMA_NAS_URL" \
        --model "$OLLAMA_NAS_MODEL" \
        --response-file "$response_file")"
    pretty_json < "$response_file"
    printf '本地调用记录 ID：%s\n' "$call_id" >&2
    sync_call "$call_id"
  else
    exit_code=$?
    call_id="$(OLLAMA_LOG_PROMPT="$prompt" OLLAMA_LOG_ERROR="$(<"$error_file")" python3 "$STORE_SCRIPT" record \
        --status failed \
        --started-at-ms "$started_at_ms" \
        --endpoint "$OLLAMA_NAS_URL" \
        --model "$OLLAMA_NAS_MODEL" \
        --response-file "$response_file")"
    cat "$error_file" >&2
    if [[ -s "$response_file" ]]; then cat "$response_file" >&2; fi
    printf '本地失败记录 ID：%s\n' "$call_id" >&2
    sync_call "$call_id"
    exit "$exit_code"
  fi

  rm -f "$request_file" "$response_file" "$error_file"
  trap - EXIT
}

command_name="${1:-}"
case "$command_name" in
  setup)
    setup_config
    ;;
  sync-setup)
    setup_sync
    ;;
  check)
    check_ollama
    ;;
  hello)
    chat_ollama '你好，我是从公司里的 Mac 远程来找你的。请简单打个招呼，并告诉我你当前运行的模型身份。'
    ;;
  chat)
    shift
    chat_ollama "$*"
    ;;
  history)
    python3 "$STORE_SCRIPT" history --limit "${2:-20}"
    ;;
  show)
    if [[ -z "${2:-}" ]]; then
      printf '错误：请提供调用记录 ID。\n' >&2
      exit 1
    fi
    python3 "$STORE_SCRIPT" show "$2"
    ;;
  stats)
    python3 "$STORE_SCRIPT" stats --days "${2:-30}"
    ;;
  ui)
    python3 "$UI_SCRIPT" --port "${2:-8788}"
    ;;
  sync)
    sync_pending "${2:-}"
    ;;
  -h|--help|help|'')
    usage
    ;;
  *)
    printf '未知命令：%s\n\n' "$command_name" >&2
    usage >&2
    exit 1
    ;;
esac
