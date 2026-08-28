import { mkdirSync, writeFileSync, readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { themes } from '../public/skins/studio-model.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist/skin-packs')
mkdirSync(out, { recursive: true })
// Build into a fresh staging directory: never carry stale files into a paid ZIP.
const stage = mkdtempSync(join(out, '.build-'))
const release = []
const license = readFileSync(join(root, 'skins/LICENSE'), 'utf8')
const notice = readFileSync(join(root, 'skins/THIRD-PARTY-NOTICES.md'), 'utf8')

function themeCss(t) {
  const scope = `body[data-workbuddy-theme="${t.id}"]`
  const tokens = {
    foreground: t.text, descriptionForeground: t.muted, 'icon-foreground': t.text,
    focusBorder: t.accent, 'textLink-foreground': t.accent, 'textLink-activeForeground': t.text,
    'editor-background': t.canvas, 'editor-foreground': t.text,
    'editorWidget-background': t.surface, 'editorWidget-foreground': t.text,
    'editorWidget-border': t.border, 'editorHoverWidget-background': t.surface,
    'editorHoverWidget-foreground': t.text, 'editorHoverWidget-border': t.border,
    'input-background': t.surface, 'input-foreground': t.text,
    'input-border': t.border, 'input-placeholderForeground': t.muted,
    'button-background': t.accent, 'button-foreground': t.surface,
    'button-hoverBackground': t.text, 'button-secondaryBackground': t.surface,
    'button-secondaryForeground': t.text, 'button-secondaryHoverBackground': t.canvas,
    'sideBar-background': t.surface, 'sideBar-foreground': t.text, 'sideBar-border': t.border,
    'sideBarTitle-foreground': t.accent, 'panel-background': t.canvas, 'panel-border': t.border,
    'menu-background': t.surface, 'menu-foreground': t.text, 'menu-border': t.border,
    'menu-selectionBackground': t.accent, 'menu-selectionForeground': t.surface,
    'dropdown-background': t.surface, 'dropdown-foreground': t.text, 'dropdown-border': t.border,
    'dropdown-listBackground': t.surface, 'list-activeSelectionBackground': t.accent,
    'list-activeSelectionForeground': t.surface, 'list-hoverBackground': t.surface,
    'list-inactiveSelectionBackground': t.surface, 'list-inactiveSelectionForeground': t.text,
    'list-focusOutline': t.accent, 'list-highlightForeground': t.accent,
    'tab-activeBackground': t.surface, 'tab-activeForeground': t.text,
    'tab-inactiveBackground': t.canvas, 'tab-inactiveForeground': t.muted,
    'titleBar-activeBackground': t.surface, 'titleBar-activeForeground': t.text,
    'textCodeBlock-background': t.surface, 'textPreformat-background': t.surface,
    'textPreformat-foreground': t.text, 'terminal-background': t.canvas,
    'terminal-foreground': t.text, 'terminalCursor-foreground': t.accent,
    'badge-background': t.accent, 'badge-foreground': t.surface, 'progressBar-background': t.accent,
  }
  return `/* ${t.name} | Original theme by TUARAN | MIT | No scripts or remote assets. */
${scope} {
  color-scheme: ${t.mode};
  color: ${t.text};
  background: ${t.canvas};
${Object.entries(tokens).map(([key, value]) => `  --vscode-${key}: ${value};`).join('\n')}
}
${scope} #root { background: ${t.canvas}; }
${scope} .main-content {
  color: ${t.text};
  background: radial-gradient(ellipse at 95% 95%, ${t.accent}26, transparent 70%), ${t.canvas} !important;
}
${scope} .conversation-list {
  background: ${t.surface}; color: ${t.text}; border-color: ${t.border};
}
${scope} :is(.conversation-list-tab-button, .wb-home-page button) {
  color: ${t.text}; background: ${t.surface}; border-color: ${t.border};
}
${scope} :is(.conversation-list-tab-button.active, .wb-scene-tabs__pill--active) {
  color: ${t.surface} !important; background: ${t.accent} !important;
}
${scope} :is(.conversation-list-tab-button.active, .wb-scene-tabs__pill--active) :is(span, svg) { color: inherit !important; }
${scope} :is(.wb-home-composer, .wb-scene-tabs, .detail-layout, .detail-sidebar, .codebuddy-menu-container, [role="dialog"], [role="menu"]) {
  color: ${t.text}; background: ${t.surface}; border-color: ${t.border};
}
${scope} :is(.teams-main-content, .cbChat, .claw-agent-chat-pane) { color: ${t.text}; background: ${t.canvas}; }
${scope} .wb-home-composer :is([contenteditable="true"], textarea, input) { color: ${t.text}; caret-color: ${t.accent}; }
${scope} .wb-home-composer :is([class*="_placeholder_"], [data-placeholder]) { color: ${t.muted}; }
${scope} :is(.conversation-list-version-badge, .conversation-list-tab-button-sub, .conversation-section-label-text) { color: ${t.muted}; }
${scope} :is(textarea, input, [contenteditable="true"], button):focus-visible { outline: 2px solid ${t.accent}; outline-offset: 2px; }
${scope} ::selection { color: ${t.surface}; background: ${t.accent}; }
@media (max-width: 980px) {
  ${scope} .main-content { background: ${t.canvas} !important; }
}
@media (prefers-reduced-motion: reduce) {
  /* This theme adds no motion. Native behavior is preserved. */
  ${scope} .main-content { background: ${t.canvas} !important; }
}
`
}

for (const theme of Object.values(themes)) {
  const directory = join(stage, theme.id)
  mkdirSync(directory)
  const manifest = {
    schemaVersion: 1, id: theme.id, displayName: theme.name, description: theme.caption,
    version: '1.0.0', mode: theme.mode, css: 'theme.css', preview: 'preview.png', author: 'TUARAN',
    testedWorkBuddy: [],
    design: {
      layoutMode: 'native-immersive', backgroundScope: 'workspace', decorDensity: 'minimal',
      modeReason: theme.mode === 'light' ? 'Light canvas with readable dark text.' : 'Dark canvas with readable light text.',
      allowedChanges: ['semantic colors', 'surface materials', 'backgrounds', 'borders', 'focus states'],
      preserve: ['native geometry', 'native controls', 'native visibility', 'native hit targets', 'native routes', 'user data'],
      verificationViewports: ['1600x900', '980x760'],
    },
    palette: { canvas: theme.canvas, surface: theme.surface, raised: theme.surface, input: theme.surface, text: theme.text, muted: theme.muted, accent: theme.accent, border: theme.border, focus: theme.accent, terminalBackground: theme.canvas, terminalForeground: theme.text },
  }
  writeFileSync(join(directory, 'theme.json'), JSON.stringify(manifest, null, 2) + '\n')
  writeFileSync(join(directory, 'theme.css'), themeCss(theme))
  // Upstream importThemeArchive accepts .md, but rejects extensionless LICENSE.
  writeFileSync(join(directory, 'LICENSE.md'), license)
  writeFileSync(join(directory, 'THIRD-PARTY-NOTICES.md'), notice)
  execFileSync('python3', [join(root, 'scripts/render-skin-preview.py'), join(directory, 'theme.json')], { stdio: 'inherit' })
  const zipName = `${theme.id}-1.0.0.zip`
  const zipPath = join(stage, zipName)
  execFileSync('zip', ['-X', '-q', zipPath, ...readdirSync(directory).sort()], { cwd: directory })
  const bytes = readFileSync(zipPath)
  writeFileSync(join(out, zipName), bytes)
  release.push({ id: theme.id, name: theme.name, file: zipName, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), testedWorkBuddy: [] })
}
writeFileSync(join(out, 'README.md'), readFileSync(join(root, 'skins/DELIVERY.md')))
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ version: '1.0.0', saleReady: false, priceCents: 1990, upstream: 'https://github.com/comeonzhj/WorkBuddy-theme-skill', themes: release }, null, 2) + '\n')
console.log(JSON.stringify({ out, stage, themes: release.length, saleReady: false }, null, 2))
