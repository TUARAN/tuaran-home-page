#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(dirname "$script_dir")
build_dir="$project_dir/build"
output_app="$build_dir/Codex 模型切换器.app"

/bin/rm -rf "$build_dir"
/bin/mkdir -p "$output_app/Contents/MacOS" "$output_app/Contents/Resources"

for arch in arm64 x86_64; do
  /usr/bin/clang -fobjc-arc -framework AppKit -arch "$arch" \
    -mmacosx-version-min=13.0 \
    "$script_dir/Sources/main.m" \
    -o "$build_dir/CodexProviderMenu-$arch"
done

/usr/bin/lipo -create \
  "$build_dir/CodexProviderMenu-arm64" \
  "$build_dir/CodexProviderMenu-x86_64" \
  -output "$output_app/Contents/MacOS/CodexProviderMenu"
/bin/cp "$script_dir/Info.plist" "$output_app/Contents/Info.plist"
/bin/cp "$script_dir/Resources/codex-provider-switch" "$output_app/Contents/Resources/codex-provider-switch"
/bin/chmod +x "$output_app/Contents/MacOS/CodexProviderMenu" "$output_app/Contents/Resources/codex-provider-switch"
/usr/bin/codesign --force --deep --sign - "$output_app"
/usr/bin/codesign --verify --deep --strict "$output_app"
/usr/bin/file "$output_app/Contents/MacOS/CodexProviderMenu"
echo "built=$output_app"
