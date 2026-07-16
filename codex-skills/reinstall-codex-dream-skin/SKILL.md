---
name: reinstall-codex-dream-skin
description: Safely reinstall, update, apply, verify, or restore Codex Dream Skin on macOS from a user-provided image. Use when a user supplies an image plus this Skill or its Skill Center link and asks to install, reinstall, change, repair, or remove the local Codex Desktop theme without modifying the official app bundle.
---

# Reinstall Codex Dream Skin

Turn one local image into a reversible Codex Desktop theme by reusing the audited Codex Dream Skin engine. Keep the official app bundle and signature untouched.

## Required input

- Require a local image path or an attached image saved locally. Accept PNG, JPEG, HEIC, TIFF, or WebP up to 50 MB.
- Use `https://github.com/TUARAN/Codex-Dream-Skin.git` as the engine source unless the user explicitly requests another repository.
- Treat the Skill Center page as instructions, not as the theme engine source.

## Workflow

1. Resolve the attached image to an absolute local path. Never upload it.
2. Confirm macOS, the official Codex Desktop app, and `~/.codex/config.toml` exist. If the config is missing, ask the user to launch Codex once and stop.
3. Inspect whether Codex is running. Installing and preparing the image does not require a restart. Applying to a running app does.
4. Run a dry preflight first:

   ```bash
   /bin/bash scripts/reinstall-theme-macos.sh --image "/absolute/path/image.png" --dry-run
   ```

5. Reinstall and prepare the theme without restarting Codex:

   ```bash
   /bin/bash scripts/reinstall-theme-macos.sh --image "/absolute/path/image.png" --name "主题名"
   ```

6. If Codex is already running, pass `--apply-now` only when the user explicitly authorized applying/restarting it. A request that clearly says “重装并应用”“现在换肤” or equivalent is authorization. Otherwise, ask first. If Codex is not running, `--apply-now` may launch it.

   ```bash
   /bin/bash scripts/reinstall-theme-macos.sh --image "/absolute/path/image.png" --name "主题名" --apply-now
   ```

7. Report the installed engine commit, theme name, verification state, and rollback command. Do not claim the visual result passed unless live verification passed.

## Safety rules

- Never edit `Codex.app`, `app.asar`, the app signature, API keys, model providers, or Base URLs.
- Accept the default GitHub repository without extra confirmation. For any other source URL, show it to the user and require explicit confirmation before passing `--allow-untrusted-source`.
- Keep CDP on loopback. Reject ports outside `1024..65535`.
- Preserve the engine's existing atomic config backup and restore path.
- Do not remove user images or theme state during reinstall.
- If any preflight, install, or verification step fails, stop and report the exact failing step. Do not bypass signature or process-identity checks.

## Repair and rollback

Re-run the same command to repair or update an installation. To restore the official appearance:

```bash
~/.codex/codex-dream-skin-studio/scripts/restore-dream-skin-macos.sh --restore-base-theme --restart-codex
```

Require explicit restart authorization when Codex is running. The engine remains installed after restore so the user can apply another image later.
