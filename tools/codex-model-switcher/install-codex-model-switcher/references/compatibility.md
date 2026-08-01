# Compatibility and first-launch notes

## What works immediately

- The application is a universal `arm64` + `x86_64` macOS bundle.
- OpenAI/GPT mode reuses the user's existing Codex authentication, then applies the packaged GPT-5.6 Sol preset. The account must be entitled to that model and service tier.
- Closing the window keeps the menu-bar item running; quitting from the menu ends it.

## What still requires configuration

DeepSeek mode needs all of the following on the user's Mac:

- a DeepSeek-compatible endpoint that implements the Responses API;
- a valid API key owned by that user;
- the bundled model catalog copied to `~/.codex/models.json`;
- a `[model_providers.deepseek]` table in `~/.codex/config.toml`.

The preset uses:

- base URL `https://api.deepseek.com/`;
- wire API `responses`;
- model `deepseek-v4-flash`;
- model catalog supplied with this Skill.

Provider and model APIs change. If the endpoint rejects Responses API requests or the named model, local installation can still verify while an actual request fails. Report that distinction clearly.

## macOS trust

The public community build is ad-hoc signed, not Apple Developer ID notarized. On first launch, macOS may require Control-click → Open. Never remove quarantine automatically. A future Developer ID + notarized release can become a normal double-click install.

## Configuration ownership

The installer owns only:

- `~/Applications/Codex 模型切换器.app`;
- the `[model_providers.deepseek]` table it creates;
- `~/.codex/models.json` copied from the package;
- top-level provider/model keys changed when the user clicks a switch button.

It preserves unrelated tables and creates timestamped backups before configuration changes.
