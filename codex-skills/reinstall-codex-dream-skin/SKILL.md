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

6. If Codex is already running, pass `--apply-now` only when the user explicitly authorized applying/restarting it. A request that clearly says “重装并应用”“现在换肤” or equivalent is authorization. Otherwise, ask first. If Codex is not running, `--apply-now` may launch it. This command only prepares a durable resume marker and starts the independent helper; it must not assume the invoking Agent will survive the restart.

   ```bash
   /bin/bash scripts/reinstall-theme-macos.sh --image "/absolute/path/image.png" --name "主题名" --apply-now
   ```

7. Treat restart and injection/verification as two recoverable stages. Before restart, require `resume.json` to record the theme, port, phase, result path, log path, and restart count. The persistent helper owns: wait for CDP → start/reuse injector → live verify → atomically write `result.json`.
8. After the invoking Agent or script resumes, inspect the marker and result first. Probe all three facts before taking action: `http://127.0.0.1:<port>/json/version`, whether the Codex main process command line contains `--remote-debugging-port=<port>`, and whether a live recorded injector/state already exists. If CDP is healthy, resume injection/verification only. Never repeat `--apply-now` merely because the prior call was interrupted or status reports `session=off`.
9. Report the installed engine commit, theme name, durable phase/result, exact log path, and rollback command. Do not claim the visual result passed unless `result.json` says `verified` and live verification passed.

## Resume after Codex restarts

Use the installed helper rather than rerunning installation:

```bash
~/.codex/codex-dream-skin-studio/scripts/resume-dream-skin-macos.sh --resume
```

Valid phases are `prepared`, `restarting`, `cdp-ready`, `injecting`, `verified`, and `failed`. `session=off` describes only an injector session and is not an install/reinstall decision signal.

## Safety rules

- Never edit `Codex.app`, `app.asar`, the app signature, API keys, model providers, or Base URLs.
- Accept the default GitHub repository without extra confirmation. For any other source URL, show it to the user and require explicit confirmation before passing `--allow-untrusted-source`.
- Keep CDP on loopback. Reject ports outside `1024..65535`.
- Preserve the engine's existing atomic config backup and restore path.
- Do not remove user images or theme state during reinstall.
- After `open -na ... --args`, verify both `/json/version` and the Codex main-process debug-port argument. If Codex is running without usable CDP, stop it at most once, then launch the already signature-verified `$CODEX_EXE` directly as the only fallback. Window activation must use `open -a`, never `open -n`.
- Permit at most one automatic restart per resume marker. A second failure must end in `failed` and report the exact `apply.log` and `result.json` paths; never loop.
- If any preflight, install, or verification step fails, stop and report the exact failing step. Do not bypass signature or process-identity checks.

## Repair and rollback

Re-run the same command to repair or update an installation. To restore the official appearance:

```bash
~/.codex/codex-dream-skin-studio/scripts/restore-dream-skin-macos.sh --restore-base-theme --restart-codex
```

Require explicit restart authorization when Codex is running. The engine remains installed after restore so the user can apply another image later.
