---
name: reinstall-codex-dream-skin
description: Safely reinstall, update, apply, verify, or restore Codex Dream Skin from a user-provided image on macOS or Windows. Use when a user supplies an image plus this Skill or its Skill Center link and asks to install, reinstall, change, repair, or remove the local Codex Desktop theme without modifying the official app bundle or Store package.
---

# Reinstall Codex Dream Skin

Turn one local image into a reversible Codex Desktop theme by selecting the command for the host operating system. Keep the official Codex installation and signature untouched.

## Select the host workflow

Detect the host from the execution environment. Do not ask the user which system they use when it is discoverable.

- On macOS (`uname -s` is `Darwin`), use `scripts/reinstall-theme-macos.sh`.
- On Windows (`$env:OS` is `Windows_NT`), use `scripts/reinstall-theme-windows.ps1` from Windows PowerShell 5.1 or newer.
- On Linux or WSL, stop. Codex Dream Skin has no supported Linux desktop engine. Do not run a Windows script against a mounted Windows installation from WSL.

Use `https://github.com/TUARAN/Codex-Dream-Skin.git` as the engine source unless the user explicitly approves another repository. Treat the Skill Center link as instructions, not as the engine source.

## macOS

Accept PNG, JPEG, HEIC, TIFF, or WebP up to 50 MB. Resolve the attachment to an absolute local path and never upload it.

Run preflight:

```bash
/bin/bash scripts/reinstall-theme-macos.sh --image "/absolute/path/image.png" --dry-run
```

Reinstall and prepare without restarting Codex:

```bash
/bin/bash scripts/reinstall-theme-macos.sh --image "/absolute/path/image.png" --name "主题名"
```

Add `--apply-now` only after restart authorization. A clear request such as “重装并应用” or “现在换肤” counts as authorization.

## Windows

Accept PNG, JPEG, BMP, or TIFF up to 50 MB. The Windows wrapper converts the image to the PNG asset expected by the native Windows Dream Skin engine and deploys the engine to `%USERPROFILE%\.codex\codex-dream-skin-windows`.

Require the official Microsoft Store `OpenAI.Codex` package, Node.js 22 or newer in `PATH`, and Git when downloading the default remote engine. Stop and report the missing prerequisite instead of installing system software implicitly.

Run preflight:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\reinstall-theme-windows.ps1 -Image "C:\absolute\image.jpg" -DryRun
```

Close Codex, then reinstall and prepare:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\reinstall-theme-windows.ps1 -Image "C:\absolute\image.jpg" -Name "主题名"
```

If Codex is running, use `-ApplyNow` only after restart authorization. This switch authorizes the wrapper to close Codex, install, relaunch with loopback CDP, and run live verification.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\reinstall-theme-windows.ps1 -Image "C:\absolute\image.jpg" -Name "主题名" -ApplyNow
```

## Completion report

Report the detected platform, installed engine commit, theme name, application state, verification state, and platform-specific rollback command. Do not claim the visual result passed unless live verification passed.

## Safety rules

- Never edit `Codex.app`, `app.asar`, WindowsApps, package signatures, API keys, model providers, or Base URLs.
- Require explicit confirmation before using a non-default source and its `--allow-untrusted-source` or `-AllowUntrustedSource` switch.
- Keep CDP on loopback and reject ports outside `1024..65535`.
- Preserve the engine's atomic config backup and restore behavior.
- Never remove user images or theme state merely to reinstall the engine.
- Stop on any preflight, install, or verification failure. Never bypass app signature, Store package identity, process ownership, or renderer identity checks.

## Rollback

macOS:

```bash
~/.codex/codex-dream-skin-studio/scripts/restore-dream-skin-macos.sh --restore-base-theme --restart-codex
```

Windows:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\codex-dream-skin-windows\scripts\restore-dream-skin.ps1" -RestoreBaseTheme -PromptRestart
```

Require restart authorization when Codex is running.
