import { execFileSync } from 'node:child_process'
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_VERSION = '1.3.6'
const TARGET_VERSION = '1.3.7'
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const downloadsDir = path.join(projectRoot, 'public', 'downloads')
const sourceArchive = path.join(downloadsDir, `2aran-article-distributor-extension-v${SOURCE_VERSION}.zip`)
const targetArchive = path.join(downloadsDir, `2aran-article-distributor-extension-v${TARGET_VERSION}.zip`)
const temporaryRoot = await mkdtemp(path.join(tmpdir(), '2aran-article-distributor-'))
const unpackedDir = path.join(temporaryRoot, 'extension')
const packedArchive = path.join(temporaryRoot, `2aran-article-distributor-extension-v${TARGET_VERSION}.zip`)

function replaceOnce(source, search, replacement, label) {
  const firstIndex = source.indexOf(search)
  if (firstIndex < 0) throw new Error(`没有找到待更新片段：${label}`)
  if (source.indexOf(search, firstIndex + search.length) >= 0) throw new Error(`待更新片段不唯一：${label}`)
  return source.replace(search, replacement)
}

try {
  execFileSync('unzip', ['-q', sourceArchive, '-d', unpackedDir])

  const manifestPath = path.join(unpackedDir, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  manifest.version = TARGET_VERSION
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const injectPath = path.join(unpackedDir, 'bundles', 'inject.js')
  const injectSource = await readFile(injectPath, 'utf8')
  await writeFile(
    injectPath,
    replaceOnce(injectSource, 'version: "1.1.0"', `version: "${TARGET_VERSION}"`, '页面连接桥版本'),
  )

  const backgroundPath = path.join(unpackedDir, 'bundles', 'background.js')
  let backgroundSource = await readFile(backgroundPath, 'utf8')
  backgroundSource = replaceOnce(
    backgroundSource,
    `                const inlineFormulas = [];
                let html = md;`,
    `                const inlineFormulas = [];
                const splitTableRow = (line) => {
                  const cells = String(line || "").replace(/^\\s*\\|/, "").replace(/\\|\\s*$/, "").split("|");
                  return cells.map((cell) => cell.trim());
                };
                const isTableDivider = (line) => {
                  const cells = splitTableRow(line);
                  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
                };
                const normalizeMarkdownTables = (source) => {
                  const lines = String(source || "").split(/\\r?\\n/);
                  const normalized = [];
                  let inCodeFence = false;
                  for (let index = 0; index < lines.length; index += 1) {
                    const line = lines[index];
                    if (/^\\s*\`\`\`/.test(line)) {
                      inCodeFence = !inCodeFence;
                      normalized.push(line);
                      continue;
                    }
                    if (!inCodeFence && line.includes("|") && isTableDivider(lines[index + 1] || "")) {
                      const header = splitTableRow(line).filter(Boolean);
                      if (header.length > 1) normalized.push(\`**\${header.join(" ｜ ")}**\`);
                      index += 1;
                      while (index + 1 < lines.length && lines[index + 1].includes("|")) {
                        const row = splitTableRow(lines[index + 1]).filter(Boolean);
                        if (row.length > 1) normalized.push(row.join(" ｜ "));
                        index += 1;
                      }
                      normalized.push("");
                      continue;
                    }
                    normalized.push(line);
                  }
                  return normalized.join("\\n");
                };
                let html = normalizeMarkdownTables(md);`,
    'X Articles Markdown 表格兼容器',
  )
  backgroundSource = replaceOnce(
    backgroundSource,
    `          console.log("[COSE] Twitter Articles 填充结果:", (_m = fillResult[0]) == null ? void 0 : _m.result);
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          return { success: true, message: "已同步到 Twitter Articles", tabId: tab.id };`,
    `          console.log("[COSE] Twitter Articles 填充结果:", (_m = fillResult[0]) == null ? void 0 : _m.result);
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          const twitterResult = (_m = fillResult[0]) == null ? void 0 : _m.result;
          if (!(twitterResult == null ? void 0 : twitterResult.success)) {
            return { success: false, message: "Twitter Articles 写入失败: " + ((twitterResult == null ? void 0 : twitterResult.error) || "未知错误"), tabId: tab.id };
          }
          return { success: true, message: "已同步到 Twitter Articles", tabId: tab.id };`,
    'X Articles 写入结果校验',
  )
  await writeFile(backgroundPath, backgroundSource)

  const twitterRendererPath = path.join(unpackedDir, 'bundles', 'platforms', 'twitter.js')
  let twitterRenderer = await readFile(twitterRendererPath, 'utf8')
  twitterRenderer = replaceOnce(
    twitterRenderer,
    `  renderer.table = function (header, body) {
    return \`<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
<thead>\${header}</thead>
<tbody>\${body}</tbody>
</table>\\n\`
  }`,
    `  renderer.table = function (header, body) {
    const rows = \`\${header}\${body}\`.match(/<tr>[\\s\\S]*?<\\/tr>/g) || []
    return rows.map((row, index) => {
      const cells = Array.from(row.matchAll(/<t[hd][^>]*>([\\s\\S]*?)<\\/t[hd]>/g))
        .map((match) => match[1].replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
      const text = cells.join(' ｜ ')
      return index === 0 ? \`<p><strong>\${text}</strong></p>\\n\` : \`<p>\${text}</p>\\n\`
    }).join('')
  }`,
    'X Articles renderer 表格兼容器',
  )
  await writeFile(twitterRendererPath, twitterRenderer)

  execFileSync('zip', ['-X', '-q', '-r', packedArchive, '.'], { cwd: unpackedDir })
  await copyFile(packedArchive, targetArchive)
  process.stdout.write(`已生成 ${path.relative(projectRoot, targetArchive)}\n`)
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
