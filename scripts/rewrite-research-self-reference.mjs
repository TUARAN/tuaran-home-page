import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const write = process.argv.includes('--write')
const phaseArg = process.argv.find((arg) => arg.startsWith('--phase='))
const phase = phaseArg?.split('=')[1] || 'false-contrast'
const categories = ['companies', 'topics', 'people']

const FALSE_CONTRAST_RE = /(?:并|绝|从来)?不是[^。；，、：:！!？?\n]{1,24}[，,]?\s*而是/gu
const NAVIGATION_TERM_RE = /(?:本文|本篇|本调研|(?<!文)本页|下面(?!试)|接下来)/gu
const SAFETY_RE = /(?:不构成|不替代|不能替代|不作为|不涉及|不覆盖|仅供|安全提示|风险提示|法律意见|投资建议|医疗建议|专业建议|适用范围|范围说明|记录定位|写在前面|边界)/u
const SOURCE_HEADING_RE = /^#{1,4}\s+.*(?:信息来源|资料来源|参考资料|参考来源|来源与说明|References|Sources)/iu
const HEADING_RE = /^#{1,4}\s+/u
const REAL_NAV_RE = /(?:按钮|表格|两张表|这张表|列表|链接|章节|目录|图(?:片|表)?|卡片|输入框|二维码|下载入口)/u
const SCOPE_RE = /(?:所称|所说|使用的|范围|范畴|讨论对象|分析对象|记录定位|仅讨论|只讨论|只把|只关注|只用于|只保留|特指|面向|未(?:能|见|完成|执行|覆盖|展开|逐项|逐一|证实|实测|从|在|系统|按)|没能|无法|做不到|事实层|公开(?:信息|文本|口径|材料)|来源|核实|核验|截至|版本|写作时|撰写时|整理撰写|涵盖|定义|相应数字|默认目标|外部观察框架|尽调结论|关注的是|作为基线|是行业横向参照|为基于|据核心|初稿|更正|给框架|不提供|主要工作|不把|多处为外部观察|采用|引语|没有在|没有拿到|仅按|于\s*20\d{2}|诊疗指南|替代品|不作此推断|不构成|不替代|不涉及)/u
const INLINE_QUOTED_TERM_RE = /["“「『](?:本文|本篇|本调研|本页|下面|接下来)/u
const TEMPORAL_NEXT_RE = /接下来\s*(?:\d+|一|两|三|几)\s*(?:天|周|个月|月|年|段时间)/u
const SEMANTIC_USE_RE = /(?:抽象层越高，下面|上面.+下面|下面价格按|本篇起点)/u
const SELF_REFERENCE_STUDY = 'research/topics/2026-05-27-llm-self-reference.md'

function classifyLine(line, state) {
  const trimmed = line.trim()
  if (trimmed.startsWith('```')) {
    state.inCode = !state.inCode
    return 'structure'
  }
  if (SOURCE_HEADING_RE.test(trimmed)) state.inSources = true
  else if (HEADING_RE.test(trimmed)) state.inSources = false
  if (state.inCode) return 'code'
  if (/^>/.test(trimmed)) return 'quote'
  if (state.inSources) return 'source'
  if (SAFETY_RE.test(line)) return 'safety'
  return 'author'
}

function directStatement(line) {
  const withoutBoldContrast = line.replace(
    /\*\*(?:并|绝|从来)?不是[^。；，、：:！!？?\n]{1,24}\*\*[，,]?\s*而是/gu,
    '',
  )
  return withoutBoldContrast.replace(FALSE_CONTRAST_RE, (match, offset, source) => {
    const before = source.slice(0, offset).trimEnd()
    const previous = before.at(-1) || ''
    const startsStandalone = !previous || /[：:；;。！？!?（(【[]/u.test(previous)
    return startsStandalone ? '' : '是'
  })
}

function removeEmptyNavigation(line) {
  let next = line

  next = next
    .replace(/(?:本文|本篇)(?:将|会)(?:重点)?(分析|讨论|梳理|介绍|回答|聚焦|说明|记录)/gu, '重点$1')
    .replace(/(?:本文|本篇)(认为|判断|主张)/gu, '可以$1')
    .replace(/(?:本文|本篇)(建议|记录|梳理|分析|讨论|介绍|说明)/gu, '$1')
    .replace(/(?:本调研)(认为|判断|建议|记录|梳理|分析|讨论|介绍|说明)/gu, '$1')
    .replace(/(?:本页)(?:将|会)?(展示|列出|汇总|提供|记录|说明)/gu, '$1')
    .replace(/本文的?(核心观点|判断框架|核心链条|重点)/gu, '$1')
    .replace(/本文(从|用|把|按|以|等量|逐一|拆解|汇总|给出)/gu, '$1')
    .replace(/本文(?:要论证|调研|聚焦)/gu, '重点讨论')
    .replace(/本文能确认/gu, '目前能确认')
    .replace(/本篇(拆解|汇总|逐一|复盘|梳理|介绍)/gu, '$1')
    .replace(/本调研最/gu, '最')
    .replace(/本调研主体/gu, '分析主体')
    .replace(/(?:接下来|下面)[，,:：]?\s*(?:将|会)?(?:重点)?(分析|讨论|梳理|介绍|回答|聚焦|说明|记录|展开)/gu, '$1')
    .replace(/下面(?:先)?把/gu, '把')
    .replace(/下面逐条/gu, '逐条')
    .replace(/接下来最/gu, '最')
    .replace(/接下来值得/gu, '值得')
    .replace(/接下来要补的是/gu, '待补事项')
    .replace(/下面这一节/gu, '这一节')
    .replace(/下面五个场景/gu, '五个常见场景')
    .replace(/但下面这些要谨慎/gu, '但有几项需要谨慎')
    .replace(/用下面模板/gu, '用这份模板')
    .replace(/问下面这些问题/gu, '问这些问题')
    .replace(/下面这句话/gu, '这句话')
    .replace(/按下面的顺序/gu, '按这个顺序')
    .replace(/下面一条条说/gu, '逐条说明')
    .replace(/下面这些心理学概念/gu, '这些心理学概念')
    .replace(/满足下面三项/gu, '满足三项')
    .replace(/被下面几类信号/gu, '被这几类信号')
    .replace(/给一个保守估算/gu, '给出一个保守估算')
    .replace(/把下面这条链路/gu, '把这条链路')
    .replace(/用下面这个表/gu, '用这张表')
    .replace(/下面三件事/gu, '三件事')
    .replace(/拆成下面两条路径/gu, '拆成两条路径')
    .replace(/用下面几项指标/gu, '用这些指标')
    .replace(/下面任一信号/gu, '任一信号')
    .replace(/按下面的最小方案/gu, '按这套最小方案')
    .replace(/经历下面几步/gu, '经历几步')
    .replace(/从下面四条命令/gu, '从这四条命令')
    .replace(/到下面两个单位/gu, '到两个单位')
    .replace(/给出了下面这些/gu, '给出了这些')
    .replace(/压缩成下面这张表/gu, '压缩成表格')
    .replace(/随手记到这篇下面/gu, '随手补进同一篇记录')
    .replace(/给本调研做案例闭环/gu, '形成案例闭环')
    .replace(/本调研要论证的核心/gu, '核心结论是')
    .replace(/引用本篇做背景/gu, '引用这项分析作为背景')
    .replace(/用本篇的结论/gu, '用上述结论')
    .replace(/按本文这张大表/gu, '按这张大表')
    .replace(/回到本文，用/gu, '用')
    .replace(/为了让本调研可复现/gu, '为便于复现')
    .replace(/与本文循证共识的关系/gu, '与循证共识的关系')
    .replace(/本文第四节/gu, '第四节')
    .replace(/本文更值得后续跟踪/gu, '更值得后续跟踪')
    .replace(/如本文 (LangChain|AgentScope)/gu, '如 $1')
    .replace(/本篇分清/gu, '分清')
    .replace(/本文沿/gu, '沿')
    .replace(/本文的判断也要修正/gu, '判断也要修正')
    .replace(/本文的核心判断/gu, '核心判断')
    .replace(/(?:接下来|下面)[，,:：]\s*/gu, '')

  return next
}

let changedFiles = 0
let changedLines = 0
let changedOccurrences = 0
const protectedCounts = { quote: 0, code: 0, source: 0, safety: 0, scope: 0, navigation: 0 }
const samples = []

for (const category of categories) {
  const directory = path.join(root, 'research', category)
  for (const filename of fs.readdirSync(directory)) {
    if (!filename.endsWith('.md')) continue
    const fullPath = path.join(directory, filename)
    const relativePath = path.relative(root, fullPath)
    const source = fs.readFileSync(fullPath, 'utf8')
    const lines = source.split(/\r?\n/)
    const state = { inCode: false, inSources: false }
    let fileChanged = false

    const updatedLines = lines.map((line, index) => {
      const kind = classifyLine(line, state)
      const matcher = phase === 'navigation'
        ? new RegExp(NAVIGATION_TERM_RE.source, 'gu')
        : new RegExp(FALSE_CONTRAST_RE.source, 'gu')
      const hits = line.match(matcher)?.length || 0
      if (!hits) return line

      if (relativePath === SELF_REFERENCE_STUDY) {
        protectedCounts.scope += hits
        return line
      }
      if (kind !== 'author') {
        if (protectedCounts[kind] != null) protectedCounts[kind] += hits
        return line
      }
      if (phase === 'navigation' && SCOPE_RE.test(line)) {
        protectedCounts.scope += hits
        return line
      }
      if (phase === 'navigation' && INLINE_QUOTED_TERM_RE.test(line)) {
        protectedCounts.quote += hits
        return line
      }
      if (phase === 'navigation' && TEMPORAL_NEXT_RE.test(line)) {
        protectedCounts.navigation += hits
        return line
      }
      if (phase === 'navigation' && SEMANTIC_USE_RE.test(line)) {
        protectedCounts.scope += hits
        return line
      }
      if (phase === 'navigation' && REAL_NAV_RE.test(line)) {
        protectedCounts.navigation += hits
        return line
      }

      const updated = phase === 'navigation' ? removeEmptyNavigation(line) : directStatement(line)
      if (updated === line) return line
      fileChanged = true
      changedLines += 1
      changedOccurrences += hits
      if (samples.length < 12) samples.push({ path: relativePath, line: index + 1, before: line, after: updated })
      return updated
    })

    if (!fileChanged) continue
    changedFiles += 1
    if (write) fs.writeFileSync(fullPath, updatedLines.join('\n'))
  }
}

console.log(JSON.stringify({
  phase,
  mode: write ? 'write' : 'dry-run',
  changedFiles,
  changedLines,
  changedOccurrences,
  protectedCounts,
  samples,
}, null, 2))
