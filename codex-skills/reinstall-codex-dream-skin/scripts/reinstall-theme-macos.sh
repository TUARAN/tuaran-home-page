#!/bin/bash

set -euo pipefail

DEFAULT_REPOSITORY="https://github.com/TUARAN/Codex-Dream-Skin.git"
IMAGE=""
THEME_NAME=""
SOURCE="$DEFAULT_REPOSITORY"
REF="main"
PORT="9341"
APPLY_NOW="false"
DRY_RUN="false"
ALLOW_UNTRUSTED_SOURCE="false"
KEEP_CHECKOUT="false"

fail() {
  printf 'Codex Dream Skin reinstall: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: reinstall-theme-macos.sh --image <path> [options]

Options:
  --name <name>              Theme name (defaults to image filename)
  --source <git-url|dir>     Engine source (default: TUARAN/Codex-Dream-Skin)
  --ref <git-ref>            Branch or tag for remote source (default: main)
  --port <port>              Loopback CDP port (default: 9341)
  --apply-now                Launch or explicitly restart Codex and verify live
  --allow-untrusted-source   Permit a source other than the default repository
  --keep-checkout            Keep a downloaded checkout for diagnostics
  --dry-run                  Validate inputs and print the planned actions only
  --help                     Show this help
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --image) IMAGE="${2:-}"; shift 2 ;;
    --name) THEME_NAME="${2:-}"; shift 2 ;;
    --source) SOURCE="${2:-}"; shift 2 ;;
    --ref) REF="${2:-}"; shift 2 ;;
    --port) PORT="${2:-}"; shift 2 ;;
    --apply-now) APPLY_NOW="true"; shift ;;
    --allow-untrusted-source) ALLOW_UNTRUSTED_SOURCE="true"; shift ;;
    --keep-checkout) KEEP_CHECKOUT="true"; shift ;;
    --dry-run) DRY_RUN="true"; shift ;;
    --help|-h) usage; exit 0 ;;
    *) fail "Unknown argument: $1" ;;
  esac
done

[ "$(/usr/bin/uname -s)" = "Darwin" ] || fail "This installer requires macOS."
[ -n "$IMAGE" ] || fail "Pass --image with an absolute local image path."
[ "${IMAGE#/}" != "$IMAGE" ] || fail "Image path must be absolute: $IMAGE"
[ -f "$IMAGE" ] || fail "Image not found: $IMAGE"

case "$IMAGE" in
  *.png|*.PNG|*.jpg|*.JPG|*.jpeg|*.JPEG|*.webp|*.WEBP|*.heic|*.HEIC|*.tif|*.TIF|*.tiff|*.TIFF) ;;
  *) fail "Unsupported image type. Use PNG, JPEG, HEIC, TIFF, or WebP." ;;
esac

IMAGE_BYTES="$(/usr/bin/stat -f '%z' "$IMAGE")"
[ "$IMAGE_BYTES" -le 52428800 ] || fail "Image is larger than 50 MB."
case "$PORT" in ''|*[!0-9]*) fail "Invalid port: $PORT" ;; esac
[ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || fail "Port must be between 1024 and 65535."
[ -n "$REF" ] || fail "Git ref cannot be empty."

if [ ! -d "$SOURCE" ] && [ "$SOURCE" != "$DEFAULT_REPOSITORY" ] && [ "$ALLOW_UNTRUSTED_SOURCE" != "true" ]; then
  fail "Non-default source requires --allow-untrusted-source after user confirmation: $SOURCE"
fi

if [ -z "$THEME_NAME" ]; then
  base="$(/usr/bin/basename "$IMAGE")"
  THEME_NAME="${base%.*}"
fi
THEME_NAME="$(printf '%s' "$THEME_NAME" | /usr/bin/tr -d '\n' | /usr/bin/cut -c1-80)"
[ -n "$THEME_NAME" ] || fail "Theme name cannot be empty."

if [ -d "/Applications/ChatGPT.app" ]; then
  CODEX_BUNDLE="/Applications/ChatGPT.app"
elif [ -d "$HOME/Applications/ChatGPT.app" ]; then
  CODEX_BUNDLE="$HOME/Applications/ChatGPT.app"
else
  fail "Official Codex Desktop app was not found."
fi
[ -f "$HOME/.codex/config.toml" ] \
  || fail "Codex config is missing. Launch Codex once, close it, and rerun."
RUNTIME_NODE="$CODEX_BUNDLE/Contents/Resources/cua_node/bin/node"
[ -x "$RUNTIME_NODE" ] || fail "Codex bundled Node.js runtime was not found."

WORK_ROOT=""
cleanup() {
  if [ -n "$WORK_ROOT" ] && [ -d "$WORK_ROOT" ] && [ "$KEEP_CHECKOUT" != "true" ]; then
    /bin/rm -rf "$WORK_ROOT"
  fi
}
trap cleanup EXIT

if [ -d "$SOURCE" ]; then
  SOURCE_ROOT="$(cd "$SOURCE" && pwd -P)"
  COMMIT="local-source"
  if [ -d "$SOURCE_ROOT/.git" ]; then
    COMMIT="$(/usr/bin/git -C "$SOURCE_ROOT" rev-parse HEAD)"
  fi
  WORK_ROOT="$(/usr/bin/mktemp -d /tmp/codex-dream-skin-skill.XXXXXX)"
  PROJECT_ROOT="$WORK_ROOT/Codex-Dream-Skin"
  /bin/mkdir -p "$PROJECT_ROOT"
  /usr/bin/rsync -a --exclude '.git/' "$SOURCE_ROOT/" "$PROJECT_ROOT/"
else
  command -v git >/dev/null 2>&1 || fail "git is required to download the theme engine."
  WORK_ROOT="$(/usr/bin/mktemp -d /tmp/codex-dream-skin-skill.XXXXXX)"
  PROJECT_ROOT="$WORK_ROOT/Codex-Dream-Skin"
  /usr/bin/git clone --depth 1 --branch "$REF" --single-branch "$SOURCE" "$PROJECT_ROOT"
  COMMIT="$(/usr/bin/git -C "$PROJECT_ROOT" rev-parse HEAD)"
fi

MACOS_ROOT="$PROJECT_ROOT/macos"
INSTALLER="$MACOS_ROOT/scripts/install-dream-skin-macos.sh"
[ -f "$INSTALLER" ] || fail "macOS installer not found in source: $INSTALLER"
for required in \
  "$MACOS_ROOT/scripts/common-macos.sh" \
  "$MACOS_ROOT/scripts/load-image-theme-macos.sh" \
  "$MACOS_ROOT/scripts/doctor-macos.sh" \
  "$MACOS_ROOT/scripts/verify-dream-skin-macos.sh" \
  "$MACOS_ROOT/assets/dream-skin.css" \
  "$MACOS_ROOT/assets/renderer-inject.js"; do
  [ -s "$required" ] || fail "Required engine file is missing or empty: $required"
done

THEME_JSON="$MACOS_ROOT/assets/theme.json"
THEME_IMAGE="$(/usr/bin/plutil -extract image raw -o - "$THEME_JSON" 2>/dev/null || true)"
[ -n "$THEME_IMAGE" ] || fail "Bundled theme.json has no image field."
if [ ! -s "$MACOS_ROOT/assets/$THEME_IMAGE" ]; then
  [ -s "$MACOS_ROOT/assets/portal-hero.png" ] \
    || fail "Bundled theme image is missing and no safe fallback exists: $THEME_IMAGE"
  /usr/bin/python3 - "$THEME_JSON" <<'PY'
import json
import os
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as source:
    theme = json.load(source)
theme["image"] = "portal-hero.png"
temporary = f"{path}.{os.getpid()}.tmp"
with open(temporary, "w", encoding="utf-8") as target:
    json.dump(theme, target, ensure_ascii=False, indent=2)
    target.write("\n")
os.replace(temporary, path)
PY
  printf 'Compatibility repair: replaced missing bundled image %s with portal-hero.png in the staged checkout.\n' "$THEME_IMAGE"
fi

while IFS= read -r script; do /bin/bash -n "$script"; done < <(
  /usr/bin/find "$MACOS_ROOT/scripts" -maxdepth 1 -type f -name '*.sh' -print
)
(
  # Reuse the engine's canonical signature, Team ID, architecture, and Node checks.
  . "$MACOS_ROOT/scripts/common-macos.sh"
  START_ERROR_LOG=""
  discover_codex_app
  require_macos_runtime
)
while IFS= read -r script; do "$RUNTIME_NODE" --check "$script" >/dev/null; done < <(
  /usr/bin/find "$MACOS_ROOT/scripts" "$MACOS_ROOT/assets" -maxdepth 1 -type f \
    \( -name '*.mjs' -o -name '*.js' \) -print
)
"$RUNTIME_NODE" "$MACOS_ROOT/scripts/injector.mjs" --check-payload >/dev/null

if [ "$DRY_RUN" = "true" ]; then
  printf 'Preflight passed.\n'
  printf 'Source: %s (%s)\n' "$SOURCE" "$REF"
  printf 'Engine commit: %s\n' "$COMMIT"
  printf 'Image: %s (%s bytes)\n' "$IMAGE" "$IMAGE_BYTES"
  printf 'Theme: %s\n' "$THEME_NAME"
  printf 'Apply now: %s\n' "$APPLY_NOW"
  printf 'Plan: atomically reinstall engine, prepare image, run doctor%s.\n' "$([ "$APPLY_NOW" = "true" ] && printf ', launch/restart Codex, verify live' || true)"
  exit 0
fi

/bin/bash "$INSTALLER" --port "$PORT" --no-launch

INSTALLED_ROOT="$HOME/.codex/codex-dream-skin-studio"
LOAD_IMAGE="$INSTALLED_ROOT/scripts/load-image-theme-macos.sh"
[ -x "$LOAD_IMAGE" ] || fail "Installed image loader is missing: $LOAD_IMAGE"
"$LOAD_IMAGE" --file "$IMAGE" --name "$THEME_NAME" --no-apply
"$INSTALLED_ROOT/scripts/doctor-macos.sh"

if [ "$APPLY_NOW" = "true" ]; then
  "$INSTALLED_ROOT/scripts/start-dream-skin-macos.sh" --port "$PORT" --restart-existing
  "$INSTALLED_ROOT/scripts/verify-dream-skin-macos.sh" --port "$PORT"
fi

printf 'RESULT engine_commit=%s theme=%s applied=%s verified=%s\n' \
  "$COMMIT" "$THEME_NAME" "$APPLY_NOW" "$APPLY_NOW"
if [ "$APPLY_NOW" != "true" ]; then
  printf 'Theme is prepared but not live. Re-run with --apply-now after restart authorization.\n'
fi
printf 'Rollback: %s --restore-base-theme --restart-codex\n' \
  "$INSTALLED_ROOT/scripts/restore-dream-skin-macos.sh"
