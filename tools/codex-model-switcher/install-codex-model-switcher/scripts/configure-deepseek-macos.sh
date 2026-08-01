#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
skill_dir=$(dirname "$script_dir")
catalog_source="$skill_dir/assets/models.deepseek.json"
codex_dir="${CODEX_HOME:-$HOME/.codex}"
config_path="$codex_dir/config.toml"
models_path="$codex_dir/models.json"
codex_bin="/Applications/ChatGPT.app/Contents/Resources/codex"

[ "$(uname -s)" = "Darwin" ] || { echo "error: macOS is required" >&2; exit 1; }
[ -x "$codex_bin" ] || { echo "error: official Codex Desktop is missing" >&2; exit 1; }
[ -f "$config_path" ] || { echo "error: $config_path is missing" >&2; exit 1; }
[ -f "$catalog_source" ] || { echo "error: bundled model catalog is missing" >&2; exit 1; }

api_key="${DEEPSEEK_API_KEY:-}"
if [ -z "$api_key" ]; then
  [ -t 0 ] || { echo "error: run this script in a terminal for secure API key entry" >&2; exit 1; }
  printf 'DeepSeek API key (input hidden): ' >&2
  old_stty=$(stty -g)
  trap 'stty "$old_stty" 2>/dev/null || true' EXIT HUP INT TERM
  stty -echo
  IFS= read -r api_key
  stty "$old_stty"
  trap - EXIT HUP INT TERM
  printf '\n' >&2
fi

case "$api_key" in
  sk-*) ;;
  *) echo "error: expected a DeepSeek key beginning with sk-" >&2; exit 1 ;;
esac
case "$api_key" in
  *[!A-Za-z0-9_-]*) echo "error: API key contains unsupported characters" >&2; exit 1 ;;
esac

timestamp=$(date +%Y%m%d-%H%M%S)
config_backup="$config_path.before-deepseek-$timestamp"
/bin/cp -p "$config_path" "$config_backup"
if [ -f "$models_path" ]; then
  models_backup="$models_path.before-deepseek-$timestamp"
  /bin/cp -p "$models_path" "$models_backup"
  echo "models_backup=$models_backup"
fi

catalog_stage=$(mktemp "$codex_dir/models.json.stage.XXXXXX")
config_stage=$(mktemp "$codex_dir/config.toml.stage.XXXXXX")
trap '/bin/rm -f "$catalog_stage" "$config_stage"' EXIT HUP INT TERM
/bin/cp "$catalog_source" "$catalog_stage"
/bin/chmod 600 "$catalog_stage"

/usr/bin/awk '
BEGIN { skip = 0 }
/^\[model_providers\.deepseek\][[:space:]]*$/ { skip = 1; next }
skip && /^\[/ { skip = 0 }
!skip { print }
' "$config_path" > "$config_stage"

printf '\n[model_providers.deepseek]\n' >> "$config_stage"
printf 'name = "deepseek"\n' >> "$config_stage"
printf 'base_url = "https://api.deepseek.com/"\n' >> "$config_stage"
printf 'wire_api = "responses"\n' >> "$config_stage"
printf 'experimental_bearer_token = "%s"\n' "$api_key" >> "$config_stage"
/bin/chmod 600 "$config_stage"

/bin/mv "$catalog_stage" "$models_path"
/bin/mv "$config_stage" "$config_path"
trap - EXIT HUP INT TERM
api_key=''

if ! "$codex_bin" features list >/dev/null; then
  /bin/cp -p "$config_backup" "$config_path"
  echo "error: Codex rejected the configuration; restored $config_backup" >&2
  exit 1
fi

echo "configured=deepseek"
echo "config_backup=$config_backup"
echo "model_catalog=$models_path"
echo "note=use the switcher window to activate DeepSeek; configuration alone does not make a network request"
