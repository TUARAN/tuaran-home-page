#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
repo_dir="$(cd "$project_dir/../.." && pwd)"
stage_dir="$(mktemp -d "${TMPDIR:-/private/tmp}/acc-pages-deploy.XXXXXX")"
trap 'rm -rf "$stage_dir"' EXIT

cp "$project_dir/wrangler.toml" "$stage_dir/wrangler.toml"
ln -s "$project_dir/public" "$stage_dir/public"

cd "$stage_dir"
"$repo_dir/node_modules/.bin/wrangler" pages deploy --project-name acc --branch main
