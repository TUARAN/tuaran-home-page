---
name: install-codex-model-switcher
description: Install, configure, repair, inspect, or uninstall Tuaran's Codex Model Switcher on macOS. Use when a user provides this Skill or the 2aran.com download and asks Codex to set up a local window/menu-bar switcher between their OpenAI Codex provider and a DeepSeek-compatible Responses API provider without bundling credentials.
---

# Install Codex Model Switcher

Install the bundled universal macOS app and configure only the provider settings it owns. Preserve unrelated Codex settings and never print, upload, or bundle an API key.

## Preconditions

- Require macOS 13 or later.
- Require the official Codex Desktop app at `/Applications/ChatGPT.app` and `~/.codex/config.toml`. If either is missing, ask the user to install/launch Codex once and stop.
- Read `references/compatibility.md` before configuring DeepSeek.
- Treat the bundled defaults as a tested compatibility preset, not a promise that every third-party endpoint supports Codex tools.

## Workflow

1. Resolve this Skill directory and run the read-only preflight:

   ```bash
   /bin/sh scripts/install-switcher-macos.sh --check
   ```

2. Inspect the output. Do not continue if the OS, Codex app, configuration, app asset, or model catalog check fails.
3. Install the application for the current user:

   ```bash
   /bin/sh scripts/install-switcher-macos.sh --install
   ```

4. If the user only wants OpenAI/GPT switching, launch the app and stop. Their existing OpenAI login/config remains authoritative.
5. If the user asks for DeepSeek, explain that the key stays in `~/.codex/config.toml`, then run the interactive configurator in a real terminal so the key can be entered without echo:

   ```bash
   /bin/sh scripts/configure-deepseek-macos.sh
   ```

   Never ask the user to paste the key into chat. Never pass it as a command-line argument. The script may also read `DEEPSEEK_API_KEY` only when the user has already set that environment variable themselves.
6. Validate the resulting configuration:

   ```bash
   /bin/sh scripts/install-switcher-macos.sh --verify
   ```

7. Open `~/Applications/Codex 模型切换器.app`. On an unnotarized release, tell the user to Control-click the app, choose **Open**, and approve the first launch in macOS. Do not remove quarantine or bypass Gatekeeper automatically.
8. Report the install path, detected provider, backup paths, and whether verification passed. State that switching restarts Codex and can interrupt active tasks.

## Repair and uninstall

Re-run `--install` to replace only the app bundle. Existing configuration is not changed.

To remove the app:

```bash
/bin/sh scripts/install-switcher-macos.sh --uninstall
```

Uninstalling leaves Codex configuration, `models.json`, and backups in place. Remove or restore provider configuration only when the user explicitly asks.

## Safety rules

- Never copy a maintainer's `~/.codex` directory or credentials into the package.
- Back up `config.toml` and `models.json` before changing them; use atomic replacement and mode `600` for config files.
- Do not edit `/Applications/ChatGPT.app`, its signature, or its bundled resources.
- Do not switch or restart Codex while a task is running unless the user explicitly authorizes the interruption.
- Never claim a third-party provider is working merely because TOML parses. Verification proves local config parsing; a short user-approved model request is required to prove endpoint/account compatibility.
- Stop on validation failure and show the exact backup path. Do not silently fall back to another provider.
