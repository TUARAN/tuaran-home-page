#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_DIR="${SERVICE_DIR}/.runtime"
SADTALKER_DIR="${RUNTIME_DIR}/SadTalker"
VENV_DIR="${SERVICE_DIR}/.venv"
SADTALKER_COMMIT="cd4c0465ae0b54a6f85af57f5c65fec9fe23e7f8"

mkdir -p "${RUNTIME_DIR}"
if [[ ! -d "${SADTALKER_DIR}/.git" ]]; then
  git clone https://github.com/OpenTalker/SadTalker.git "${SADTALKER_DIR}"
fi

git -C "${SADTALKER_DIR}" fetch origin
git -C "${SADTALKER_DIR}" checkout "${SADTALKER_COMMIT}"

python3.10 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install torch==2.0.1 torchvision==0.15.2
sed '/^gradio/d' "${SADTALKER_DIR}/requirements.txt" > "${RUNTIME_DIR}/sadtalker-requirements.txt"
"${VENV_DIR}/bin/pip" install -r "${RUNTIME_DIR}/sadtalker-requirements.txt"
"${VENV_DIR}/bin/pip" install -r "${SERVICE_DIR}/requirements-api.txt"

if [[ ! -d "${SADTALKER_DIR}/checkpoints" ]]; then
  (
    cd "${SADTALKER_DIR}"
    bash scripts/download_models.sh
  )
fi

echo "SadTalker local runtime is ready."
echo "Next: copy .env.example to .env, export its variables, then run scripts/run-local.sh."
