import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const rules = JSON.parse(fs.readFileSync(path.join(root, 'lib', 'researchStyleRules.json'), 'utf8'))
const categories = ['companies', 'topics', 'people']
const SOURCE_HEADING_RE = /^#{1,3}\s+.*(?:信息来源|资料来源|参考来源|来源与说明)/mu
const OPENING_SOURCE_RE = /(?:信息来源说明|资料口径|来源口径|信息口径|核验口径|抓取口径|本文(?:主要)?(?:基于|依据|据)|主要资料(?:来自|来源)|公开资料(?:整理|梳理)|\*\*来源[：:]\*\*)/u
const OPENING_WRAPPER_RE = /(?:写在前面|说在前面)/u
const SOURCE_DETAIL_RE = /(?:来源|口径|公开资料|外部观察|未(?:对外)?披露|未核实|截至\s*20\d{2}|转述)/u
const TOP_SAFETY_RE = /(?:医学边界|医疗建议|疾病治疗建议|法律意见|投资建议|买卖建议|收益承诺|喂养|儿科|营养师|OCR|原文(?:残缺|缺失)|原始[^。\n]{0,24}(?:归档|出处)[^。\n]{0,24}(?:不好找|无法核验)|错字|重大更正|安全提示|单源报道|官方[^。\n]{0,16}未[^。\n]{0,8}证实|网络传言|附件来源|未稳定命中原文)/u
const LINE_SAFETY_RE = /(?:不构成|不替代|不能替代|不作为|不涉及|不覆盖|仅供|安全提示|风险提示|法律意见|投资建议|医疗建议|专业建议|适用范围|范围说明|记录定位|写在前面|边界)/u
const SOURCE_SECTION_RE = /^#{1,4}\s+.*(?:信息来源|资料来源|参考资料|参考来源|来源与说明|References|Sources)/iu
const ANY_HEADING_RE = /^#{1,4}\s+/u
const REAL_NAV_RE = /(?:按钮|表格|两张表|这张表|列表|链接|章节|目录|图(?:片|表)?|卡片|输入框|二维码|下载入口)/u
const SCOPE_RE = /(?:所称|所说|使用的|范围|范畴|讨论对象|分析对象|记录定位|仅讨论|只讨论|只把|只关注|只用于|只保留|特指|面向|未(?:能|见|完成|执行|覆盖|展开|逐项|逐一|证实|实测|从|在|系统|按)|没能|无法|做不到|事实层|公开(?:信息|文本|口径|材料)|来源|核实|核验|截至|版本|写作时|撰写时|整理撰写|涵盖|定义|相应数字|默认目标|外部观察框架|尽调结论|关注的是|作为基线|是行业横向参照|为基于|据核心|初稿|更正|给框架|不提供|主要工作|不把|多处为外部观察|采用|引语|没有在|没有拿到|仅按|于\s*20\d{2}|诊疗指南|替代品|不作此推断|不构成|不替代|不涉及)/u
const INLINE_QUOTED_TERM_RE = /["“「『](?:本文|本篇|本调研|本页|下面|接下来)/u
const TEMPORAL_NEXT_RE = /接下来\s*(?:\d+|一|两|三|几)\s*(?:天|周|个月|月|年|段时间)/u
const SEMANTIC_USE_RE = /(?:抽象层越高，下面|上面.+下面|下面价格按|本篇起点)/u
const SELF_REFERENCE_STUDY = 'research/topics/2026-05-27-llm-self-reference.md'

function markdownBody(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '')
}

function openingWindow(source) {
  const body = markdownBody(source).trimStart()
  const headingMatches = [...body.matchAll(/^#{1,3}\s+.*$/gmu)]
  const firstHeading = headingMatches[0]
  const startsWithTitle = firstHeading?.index === 0 && /^#\s+/u.test(firstHeading[0])
  const startsWithOpeningSection = firstHeading?.index === 0 && /(?:写在前面|说在前面|信息来源说明)/u.test(firstHeading[0])
  const nextSection = startsWithTitle || startsWithOpeningSection
    ? (headingMatches[1]?.index ?? -1)
    : (firstHeading?.index ?? -1)
  return body.slice(0, Math.min(nextSection === -1 ? body.length : nextSection, 2400))
}

function inspectOpening(relativePath, source) {
  const opening = openingWindow(source)
  const sourceLike = OPENING_SOURCE_RE.test(opening)
    || (OPENING_WRAPPER_RE.test(opening) && SOURCE_DETAIL_RE.test(opening))
  const safetyException = sourceLike && TOP_SAFETY_RE.test(opening)
  const hasEndingSourceSection = SOURCE_HEADING_RE.test(markdownBody(source).slice(opening.length))
  return {
    path: relativePath,
    openingSourceDeclaration: sourceLike && !safetyException,
    duplicatedAtEnd: sourceLike && !safetyException && hasEndingSourceSection,
    safetyException,
  }
}

function countMatches(line, matcher) {
  const matches = line.match(new RegExp(matcher, 'gu'))
  return matches ? matches.length : 0
}

function classifyLines(lines) {
  const state = { inCode: false, inSources: false }
  return lines.map((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      state.inCode = !state.inCode
      return 'structure'
    }
    if (SOURCE_SECTION_RE.test(trimmed)) state.inSources = true
    else if (ANY_HEADING_RE.test(trimmed)) state.inSources = false
    if (state.inCode) return 'code'
    if (/^>/.test(trimmed)) return 'quote'
    if (state.inSources) return 'source'
    if (LINE_SAFETY_RE.test(line)) return 'safety'
    return 'author'
  })
}

function selfReferenceProtection(relativePath, line) {
  if (relativePath === SELF_REFERENCE_STUDY) return 'subject-matter'
  if (SCOPE_RE.test(line)) return 'scope'
  if (INLINE_QUOTED_TERM_RE.test(line)) return 'inline-quote'
  if (TEMPORAL_NEXT_RE.test(line)) return 'temporal'
  if (SEMANTIC_USE_RE.test(line)) return 'semantic'
  if (REAL_NAV_RE.test(line)) return 'navigation'
  return ''
}

const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles: 0,
  fixCount: 0,
  reviewCount: 0,
  rules: rules.map((rule) => ({
    ...rule,
    occurrences: 0,
    files: [],
    protectedOccurrences: 0,
    protectedReasons: {},
  })),
  contentOpeningAudit: {
    scannedFiles: 0,
    openingSourceDeclarations: [],
    duplicatedOpeningAndEndingSources: [],
    safetyExceptions: [],
  },
}

function auditOpening(relativePath, source) {
  const finding = inspectOpening(relativePath, source)
  report.contentOpeningAudit.scannedFiles += 1
  if (finding.openingSourceDeclaration) report.contentOpeningAudit.openingSourceDeclarations.push(relativePath)
  if (finding.duplicatedAtEnd) report.contentOpeningAudit.duplicatedOpeningAndEndingSources.push(relativePath)
  if (finding.safetyException) report.contentOpeningAudit.safetyExceptions.push(relativePath)
}

for (const category of categories) {
  const directory = path.join(root, 'research', category)
  if (!fs.existsSync(directory)) continue

  for (const filename of fs.readdirSync(directory)) {
    if (!filename.endsWith('.md')) continue
    report.scannedFiles += 1
    const relativePath = `research/${category}/${filename}`
    const source = fs.readFileSync(path.join(directory, filename), 'utf8')
    const lines = source.split(/\r?\n/)
    const contexts = classifyLines(lines)
    auditOpening(relativePath, source)

    for (const rule of report.rules) {
      let fileHits = 0
      for (const [lineIndex, line] of lines.entries()) {
        const lineHits = countMatches(line, rule.matcher)
        if (!lineHits) continue
        const context = contexts[lineIndex]
        const specialProtection = rule.id === 'empty-self-reference'
          ? selfReferenceProtection(relativePath, line)
          : (rule.id === 'false-contrast' || rule.id === 'model-self-reference')
              && relativePath === SELF_REFERENCE_STUDY
            ? 'subject-matter'
          : ''
        const protectedReason = context !== 'author' ? context : specialProtection
        if (protectedReason) {
          rule.protectedOccurrences += lineHits
          rule.protectedReasons[protectedReason] =
            (rule.protectedReasons[protectedReason] || 0) + lineHits
          continue
        }
        fileHits += lineHits
      }
      if (!fileHits) continue
      rule.occurrences += fileHits
      rule.files.push(relativePath)
      if (rule.severity === 'fix') report.fixCount += fileHits
      else report.reviewCount += fileHits
    }
  }
}

const syncedArticleDirectory = path.join(root, 'content', 'articles')
if (fs.existsSync(syncedArticleDirectory)) {
  for (const filename of fs.readdirSync(syncedArticleDirectory)) {
    if (!filename.endsWith('.json')) continue
    const relativePath = `content/articles/${filename}`
    const article = JSON.parse(fs.readFileSync(path.join(syncedArticleDirectory, filename), 'utf8'))
    auditOpening(relativePath, String(article.markdown || ''))
  }
}

const resourceDirectory = path.join(root, 'content', 'resources')
if (fs.existsSync(resourceDirectory)) {
  for (const filename of fs.readdirSync(resourceDirectory)) {
    if (!filename.endsWith('.md')) continue
    const relativePath = `content/resources/${filename}`
    auditOpening(relativePath, fs.readFileSync(path.join(resourceDirectory, filename), 'utf8'))
  }
}

for (const rule of report.rules) rule.files = rule.files.slice(0, 3)

const output = `// Generated by scripts/audit-research-style.mjs. Do not edit by hand.\nexport const RESEARCH_STYLE_AUDIT = ${JSON.stringify(report, null, 2)}\n`
fs.writeFileSync(path.join(root, 'lib', 'research', 'styleAudit.js'), output)

const openingCount = report.contentOpeningAudit.openingSourceDeclarations.length
const duplicateCount = report.contentOpeningAudit.duplicatedOpeningAndEndingSources.length
console.log(`Research style audit: ${report.scannedFiles} research files, ${report.contentOpeningAudit.scannedFiles} total content files, ${report.fixCount} style fixes, ${report.reviewCount} manual reviews, ${openingCount} opening source declarations, ${duplicateCount} duplicated source sections.`)
if (openingCount || duplicateCount) {
  console.error('Opening/source structure audit failed: move ordinary source declarations to a final “信息来源与说明” section.')
  process.exitCode = 1
}
