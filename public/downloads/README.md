# Downloads

Small static downloadable files for resource pages.

Do not put desktop installers here. Cloudflare Pages has a 25 MiB per-file limit,
and the Electron installers are much larger. Upload desktop installers to R2 under
the `downloads/` prefix instead.

Desktop app reserved filenames:

- `2aran-desktop-macos-arm64-v0.1.0.dmg`
- `2aran-desktop-macos-x64-v0.1.0.dmg`
- `2aran-desktop-windows-v0.1.0.exe`

The desktop build scripts generate matching files in `desktop-dist/`:

```sh
npm run desktop:build:mac
npm run desktop:build:win
```

The download page points at `R2_PUBLIC_BASE/downloads/<file>`, not at this directory.
