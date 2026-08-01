#!/bin/sh
set -eu

action="${1:---check}"
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
skill_dir=$(dirname "$script_dir")
app_source="$skill_dir/assets/Codex 模型切换器.app"
catalog_source="$skill_dir/assets/models.deepseek.json"
install_dir="$HOME/Applications"
app_target="$install_dir/Codex 模型切换器.app"
config_path="${CODEX_HOME:-$HOME/.codex}/config.toml"
codex_bin="/Applications/ChatGPT.app/Contents/Resources/codex"

check() {
  [ "$(uname -s)" = "Darwin" ] || { echo "error: macOS is required" >&2; return 1; }
  major=$(sw_vers -productVersion | cut -d. -f1)
  [ "$major" -ge 13 ] || { echo "error: macOS 13 or later is required" >&2; return 1; }
  [ -x "$codex_bin" ] || { echo "error: official Codex Desktop was not found at /Applications/ChatGPT.app" >&2; return 1; }
  [ -f "$config_path" ] || { echo "error: $config_path is missing; launch Codex once first" >&2; return 1; }
  [ -x "$app_source/Contents/MacOS/CodexProviderMenu" ] || { echo "error: bundled app asset is incomplete" >&2; return 1; }
  [ -f "$catalog_source" ] || { echo "error: bundled DeepSeek model catalog is missing" >&2; return 1; }
  /usr/bin/plutil -lint "$app_source/Contents/Info.plist" >/dev/null
  echo "preflight=ok"
  echo "install_path=$app_target"
}

verify() {
  check
  [ -d "$app_target" ] || { echo "error: switcher is not installed" >&2; return 1; }
  "$app_target/Contents/MacOS/CodexProviderMenu" --self-test
  "$codex_bin" features list >/dev/null
  echo "config_parse=ok"
}

case "$action" in
  --check)
    check
    ;;
  --install)
    check
    /bin/mkdir -p "$install_dir"
    stage="$install_dir/.Codex-model-switcher.stage.$$"
    trap '/bin/rm -rf "$stage"' EXIT HUP INT TERM
    /bin/cp -R "$app_source" "$stage"
    if [ -e "$app_target" ]; then
      backup="$install_dir/Codex 模型切换器.backup.$(date +%Y%m%d-%H%M%S).app"
      /bin/mv "$app_target" "$backup"
      echo "app_backup=$backup"
    fi
    /bin/mv "$stage" "$app_target"
    trap - EXIT HUP INT TERM
    echo "installed=$app_target"
    ;;
  --verify)
    verify
    ;;
  --uninstall)
    if [ -d "$app_target" ]; then
      /bin/rm -rf "$app_target"
      echo "removed=$app_target"
    else
      echo "not_installed=$app_target"
    fi
    ;;
  *)
    echo "usage: $0 --check|--install|--verify|--uninstall" >&2
    exit 2
    ;;
esac
