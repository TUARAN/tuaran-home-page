#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import vm from 'node:vm'

import { WORKBUDDY_CONNECTORS, WORKBUDDY_SKILL_METADATA } from '../lib/workbuddyMarketplaceManifest.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_ROOT = join(ROOT, 'public/downloads/workbuddy')
const CATALOG_FILE = join(ROOT, 'lib/workbuddyMarketplaceArtifacts.js')
const MAX_BYTES = 3 * 1024 * 1024
const ARCHIVE_TIME = new Date('2026-01-01T00:00:00Z')
const checkOnly = process.argv.includes('--check')

function loadSkills() {
  const context = vm.createContext({})
  for (const filename of ['codexModelSwitcherSkill.js', 'dreamSkinReinstallSkill.js', 'renweiWritingSkill.js']) {
    const source = readFileSync(join(ROOT, 'app/(site)/skill-center', filename), 'utf8')
      .replace(/export const (\w+)\s*=/, 'globalThis.$1 =')
    vm.runInContext(source, context, { filename })
  }
  const registry = readFileSync(join(ROOT, 'app/(site)/skill-center/skills.js'), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace('export const PUBLISHED_SKILLS =', 'globalThis.PUBLISHED_SKILLS =')
    .replace(/\nexport function getSkillById[\s\S]*$/, '')
  vm.runInContext(registry, context, { filename: 'skills.js' })
  return context.PUBLISHED_SKILLS
}

function stripFrontmatter(markdown) {
  return String(markdown).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trimStart()
}

function yamlString(value) {
  return JSON.stringify(String(value))
}

function workbuddySkillMarkdown(skill, metadata) {
  const fields = [
    '---',
    `name: ${skill.name}`,
    `display_name: ${yamlString(skill.title)}`,
    `display_name_en: ${yamlString(metadata.displayNameEn)}`,
    `description: ${yamlString(skill.desc)}`,
    `description_zh: ${yamlString(skill.desc)}`,
    `description_en: ${yamlString(metadata.descriptionEn)}`,
    'version: 1.0.0',
    `author: ${yamlString(metadata.author || 'TUARAN')}`,
    ...(metadata.disableModelInvocation ? ['disable-model-invocation: true'] : []),
    'user-invocable: true',
    '---',
    '',
  ]
  return `${fields.join('\n')}${stripFrontmatter(skill.codex.skillMd)}\n`
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function svgIcon(label, accent = '#49d49d') {
  const initials = label.split(/[-\s]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${label}"><rect width="256" height="256" rx="56" fill="#0b1915"/><path d="M56 64h144v96H119l-43 37v-37H56z" fill="${accent}"/><text x="128" y="127" text-anchor="middle" font-family="Arial,sans-serif" font-size="54" font-weight="700" fill="#0b1915">${initials}</text></svg>\n`
}

function zipDirectory(stagingRoot, folderName, outputFile) {
  const normalizeTimes = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(path, entry.name)
      if (entry.isDirectory()) normalizeTimes(child)
      utimesSync(child, ARCHIVE_TIME, ARCHIVE_TIME)
    }
  }
  normalizeTimes(join(stagingRoot, folderName))
  utimesSync(join(stagingRoot, folderName), ARCHIVE_TIME, ARCHIVE_TIME)
  mkdirSync(dirname(outputFile), { recursive: true })
  rmSync(outputFile, { force: true })
  execFileSync('/usr/bin/zip', ['-X', '-q', '-r', outputFile, folderName], { cwd: stagingRoot })
}

function artifactInfo(kind, id, title, metadata, file) {
  const data = readFileSync(file)
  if (data.length > MAX_BYTES) throw new Error(`${relative(ROOT, file)} 超过 3MB`)
  return {
    kind,
    id,
    title,
    downloadUrl: `/${relative(join(ROOT, 'public'), file).split('\\').join('/')}`,
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
    readiness: metadata.readiness,
    readinessLabel: metadata.readinessLabel,
    note: metadata.note,
    sourceUrl: kind === 'Skill' ? `/skill-center/${id}` : `/mcp-center#${id}`,
  }
}

function buildSkill(skill, metadata, stagingRoot) {
  const folder = skill.name
  const root = join(stagingRoot, folder)
  let packagedSkill = skill
  if (metadata.bundledRelease === 'codex-model-switcher') {
    const sourceRoot = join(ROOT, 'tools/codex-model-switcher/install-codex-model-switcher')
    execFileSync('/bin/sh', [join(ROOT, 'tools/codex-model-switcher/macos/build-macos.sh')], { stdio: 'inherit' })
    packagedSkill = { ...skill, codex: { ...skill.codex, skillMd: readFileSync(join(sourceRoot, 'SKILL.md'), 'utf8') } }
    cpSync(join(sourceRoot, 'scripts'), join(root, 'scripts'), { recursive: true })
    cpSync(join(sourceRoot, 'references'), join(root, 'references'), { recursive: true })
    mkdirSync(join(root, 'assets'), { recursive: true })
    cpSync(join(sourceRoot, 'assets/models.deepseek.json'), join(root, 'assets/models.deepseek.json'))
    cpSync(join(ROOT, 'tools/codex-model-switcher/build/Codex 模型切换器.app'), join(root, 'assets/Codex 模型切换器.app'), { recursive: true })
  }
  write(join(root, 'SKILL.md'), workbuddySkillMarkdown(packagedSkill, metadata))
  for (const extra of skill.codex.extraFiles || []) {
    if (extra.filename === 'agents/openai.yaml') continue
    write(join(root, extra.filename), extra.content)
  }
  const file = join(OUTPUT_ROOT, 'skills', `${folder}-workbuddy.zip`)
  zipDirectory(stagingRoot, folder, file)
  rmSync(root, { recursive: true, force: true })
  return artifactInfo('Skill', skill.id, skill.title, metadata, file)
}

function connectorSkillMarkdown(connector) {
  const calls = connector.tools.map((tool) => `- \`${tool}\``).join('\n')
  return `---\nname: ${connector.id}\ndescription: ${yamlString(connector.descriptionEn)}\ndescription_zh: ${yamlString(connector.descriptionZh)}\ndescription_en: ${yamlString(connector.descriptionEn)}\nversion: 1.0.0\nauthor: TUARAN\n---\n\n# ${connector.nameZh}\n\n当用户的请求符合连接器能力时，选择语义最匹配的工具，只传递完成任务所需的参数。不要虚构工具未返回的数据。\n\n## 可用工具\n\n${calls}\n\n## 使用边界\n\n${connector.id === 'tuaran-local-crypto-demo' ? '- 加密和解密只在本地子进程执行，但工具参数与结果仍可能进入 WorkBuddy 和模型上下文。\n- 不要输出、记录或复述用户配置的密钥。' : '- 仅查询公开信息；如果服务要求授权，按 WorkBuddy 的 OAuth 引导完成授权。\n- 调用失败时返回可读错误，不用猜测结果。'}\n`
}

function connectorConfig(connector) {
  if (connector.localServerPath) {
    return {
      mcpServers: {
        [connector.id]: {
          type: 'stdio',
          command: 'node',
          args: ['server.mjs'],
          env: { LOCAL_MCP_SECRET: '${LOCAL_MCP_SECRET}' },
          runtime: { type: 'node', version: '20' },
          timeout: 30000,
        },
      },
    }
  }
  return {
    mcpServers: {
      [connector.id]: { type: 'streamableHttp', url: connector.endpoint, timeout: 30000 },
    },
  }
}

function buildConnector(connector, stagingRoot) {
  const folder = connector.id
  const root = join(stagingRoot, folder)
  const metadata = {
    name: connector.nameEn,
    name_zh: connector.nameZh,
    name_en: connector.nameEn,
    description: connector.descriptionEn,
    description_zh: connector.descriptionZh,
    description_en: connector.descriptionEn,
    source: connector.id,
    type: 'mcp',
    version: '1.0.0',
    examples_zh: connector.examplesZh,
    examples_en: connector.examplesEn,
    minWorkbuddyVersion: connector.minWorkbuddyVersion,
    ...(connector.localServerPath ? { auth_mode: 'token' } : {}),
  }
  write(join(root, 'connector-meta.json'), `${JSON.stringify(metadata, null, 2)}\n`)
  write(join(root, 'mcp.json'), `${JSON.stringify(connectorConfig(connector), null, 2)}\n`)
  write(join(root, 'icon.svg'), svgIcon(connector.nameEn, connector.localServerPath ? '#f2c45a' : '#49d49d'))
  write(join(root, 'skills', connector.id, 'SKILL.md'), connectorSkillMarkdown(connector))
  if (connector.localServerPath) {
    write(join(root, 'server.mjs'), readFileSync(join(ROOT, connector.localServerPath), 'utf8'))
    write(join(root, 'token-schema.json'), `${JSON.stringify({
      title: '本地加密密钥',
      title_en: 'Local encryption secret',
      description: '密钥由 WorkBuddy 保存在本机，仅通过环境变量交给本地 MCP 进程。',
      description_en: 'The secret is stored locally and passed only to the local MCP process.',
      fields: [{ key: 'LOCAL_MCP_SECRET', label: '本地加密密钥', label_en: 'Local encryption secret', type: 'password', required: true, placeholder: '输入一段仅供本机使用的高强度密钥' }],
    }, null, 2)}\n`)
  }
  const file = join(OUTPUT_ROOT, 'connectors', `${folder}-workbuddy.zip`)
  zipDirectory(stagingRoot, folder, file)
  rmSync(root, { recursive: true, force: true })
  return artifactInfo('MCP', connector.id, connector.nameZh, connector, file)
}

function validateArchive(artifact) {
  const file = join(ROOT, 'public', artifact.downloadUrl.replace(/^\//, '').replace(/^downloads\//, 'downloads/'))
  if (!statSync(file).isFile()) throw new Error(`缺少 ${artifact.downloadUrl}`)
  const entries = execFileSync('/usr/bin/unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const root = `${artifact.id}/`
  if (!entries.every((entry) => entry.startsWith(root))) throw new Error(`${artifact.id} ZIP 根目录不唯一`)
  if (entries.some((entry) => /(^|\/)(\.env|node_modules|__MACOSX)(\/|$)|agents\/openai\.yaml/.test(entry))) throw new Error(`${artifact.id} 包含禁止文件`)
  const required = artifact.kind === 'Skill'
    ? [`${root}SKILL.md`]
    : [`${root}connector-meta.json`, `${root}mcp.json`, `${root}icon.svg`]
  for (const entry of required) if (!entries.includes(entry)) throw new Error(`${artifact.id} 缺少 ${entry}`)
  const content = execFileSync('/usr/bin/unzip', ['-p', file], { encoding: 'utf8', maxBuffer: MAX_BYTES * 2 })
  if (/\/Users\/tuaran\/|\/Documents\/GitHub\/tuaran-home-page\//.test(content)) throw new Error(`${artifact.id} 包含维护者本机绝对路径`)
  if (/(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{20,}/.test(content)) throw new Error(`${artifact.id} 疑似包含真实凭据`)
  if (artifact.kind === 'Skill') {
    for (const field of ['description:', 'description_zh:', 'description_en:', 'version:', 'author:']) {
      if (!content.includes(`\n${field}`) && !content.startsWith(field)) throw new Error(`${artifact.id} SKILL.md 缺少 ${field}`)
    }
  } else {
    const mcpEntry = `${root}mcp.json`
    const mcp = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', file, mcpEntry], { encoding: 'utf8' }))
    if (Object.keys(mcp.mcpServers || {}).length !== 1) throw new Error(`${artifact.id} 必须只配置一个 MCP Server`)
    JSON.parse(execFileSync('/usr/bin/unzip', ['-p', file, `${root}connector-meta.json`], { encoding: 'utf8' }))
  }
  if (readFileSync(file).length > MAX_BYTES) throw new Error(`${artifact.id} 超过 3MB`)
}

function createCatalog(artifacts) {
  const source = `// Generated by scripts/build-workbuddy-marketplace.mjs. Do not edit by hand.\nexport const WORKBUDDY_MARKETPLACE_ARTIFACTS = ${JSON.stringify(artifacts, null, 2)}\n`
  write(CATALOG_FILE, source)
}

function main() {
  if (checkOnly) {
    const source = readFileSync(CATALOG_FILE, 'utf8').replace(/^\/\/.*\nexport const WORKBUDDY_MARKETPLACE_ARTIFACTS = /, '')
    const artifacts = JSON.parse(source.trim())
    artifacts.forEach(validateArchive)
    console.log(`Validated ${artifacts.length} WorkBuddy ZIP packages.`)
    return
  }

  const stagingRoot = mkdtempSync(join(tmpdir(), 'workbuddy-marketplace-'))
  try {
    const skills = loadSkills()
    const artifacts = skills.map((skill) => {
      const metadata = WORKBUDDY_SKILL_METADATA[skill.id]
      if (!metadata) throw new Error(`缺少 Skill 元数据：${skill.id}`)
      return buildSkill(skill, metadata, stagingRoot)
    })
    artifacts.push(...WORKBUDDY_CONNECTORS.map((connector) => buildConnector(connector, stagingRoot)))
    createCatalog(artifacts)
    artifacts.forEach(validateArchive)
    console.log(`Built and validated ${artifacts.length} WorkBuddy ZIP packages.`)
  } finally {
    rmSync(stagingRoot, { recursive: true, force: true })
  }
}

main()
