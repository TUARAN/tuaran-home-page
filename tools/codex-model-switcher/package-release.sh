#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
skill_dir="$project_dir/install-codex-model-switcher"
build_app="$project_dir/build/Codex 模型切换器.app"
skill_app="$skill_dir/assets/Codex 模型切换器.app"
dist_dir="$project_dir/dist"
app_zip="$dist_dir/codex-model-switcher-macos-universal-v1.1.0.zip"
skill_zip="$dist_dir/install-codex-model-switcher-skill-v1.0.0.zip"

/bin/sh "$project_dir/macos/build-macos.sh"
/bin/rm -rf "$skill_app"
/bin/cp -R "$build_app" "$skill_app"
/bin/mkdir -p "$dist_dir"

stage=$(mktemp -d)
trap '/bin/rm -rf "$stage"' EXIT HUP INT TERM
/bin/cp -R "$build_app" "$stage/Codex 模型切换器.app"
/bin/cp "$project_dir/INSTALL.md" "$stage/安装说明.md"
/bin/rm -f "$app_zip" "$skill_zip"
/usr/bin/ditto -c -k --sequesterRsrc "$stage" "$app_zip"
/usr/bin/ditto -c -k --sequesterRsrc --keepParent "$skill_dir" "$skill_zip"
/usr/bin/unzip -t "$app_zip" >/dev/null
/usr/bin/unzip -t "$skill_zip" >/dev/null
/usr/bin/shasum -a 256 "$app_zip" "$skill_zip"
echo "app_zip=$app_zip"
echo "skill_zip=$skill_zip"
