#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${SERVICE_DIR}/.env" ]]; then
  set -a
  source "${SERVICE_DIR}/.env"
  set +a
fi

export SADTALKER_ROOT="${SADTALKER_ROOT:-${SERVICE_DIR}/.runtime/SadTalker}"
export SADTALKER_DATA_ROOT="${SADTALKER_DATA_ROOT:-${SERVICE_DIR}/.data}"
export SADTALKER_DEVICE="${SADTALKER_DEVICE:-cpu}"

cd "${SERVICE_DIR}"
exec "${SERVICE_DIR}/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000 --workers 1
