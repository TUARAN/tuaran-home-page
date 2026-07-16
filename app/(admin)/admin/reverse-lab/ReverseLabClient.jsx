'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowUpRight,
  IconCheck,
  IconCircleCheck,
  IconLock,
  IconRefresh,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, Section } from '../../components/ui'

const STORAGE_KEY = 'admin:reverse-lab:v1'

const LEARNING_STAGES = [
  {
    id: 'representation',
    index: '01',
    title: '表示与文件',
    goal: '看懂十六进制、字节序、ASCII/Unicode，以及 PE、ELF、Mach-O 的基本结构。',
    evidence: '能从文件头、字符串和导入信息写出一页“样本画像”。',
  },
  {
    id: 'assembly',
    index: '02',
    title: '架构与汇编',
    goal: '先掌握 x86-64 的寄存器、栈、调用约定、比较与跳转，不急着背指令表。',
    evidence: '能手工解释一个短函数的输入、分支和返回值。',
  },
  {
    id: 'static',
    index: '03',
    title: '静态分析',
    goal: '从入口、字符串、导入、交叉引用和控制流逐步建立假设。',
    evidence: '能在 Ghidra 或 JADX 中重命名关键符号，并画出最小调用链。',
  },
  {
    id: 'dynamic',
    index: '04',
    title: '动态验证',
    goal: '在隔离环境里用断点、单步和参数观察验证静态假设。',
    evidence: '能把“假设—观察点—结果—结论”记录完整，不修改未知程序行为。',
  },
]

const RESOURCES = [
  {
    title: 'x86-64 Assembly · OST2',
    kind: '基础课',
    stage: '表示 → 汇编',
    description: '系统补足寄存器、内存、栈与调用约定，适合作为逆向前置课。',
    href: 'https://p.ost2.fyi/courses/course-v1%3AOpenSecurityTraining2%2BArch1001_x86-64_Asm%2B2021_v1/',
  },
  {
    title: 'Introduction to Ghidra · NSA',
    kind: '官方教程',
    stage: '静态分析',
    description: '从项目、导入和自动分析开始，建立标准的静态分析操作顺序。',
    href: 'https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html',
  },
  {
    title: 'The Official Radare2 Book',
    kind: '官方手册',
    stage: '静态 → 自动化',
    description: '偏命令行与可脚本化工作流，适合在掌握基本概念后补充。',
    href: 'https://book.rada.re/',
  },
  {
    title: 'MAS Crackmes · OWASP',
    kind: '授权练习',
    stage: '移动端实践',
    description: '明确用于训练的移动端样本；从 Android Level 1 开始，不碰来源不明 APK。',
    href: 'https://mas.owasp.org/crackmes/',
  },
]

const TOOLS = [
  {
    name: 'Ghidra',
    role: '主力静态分析',
    platforms: 'Windows / macOS / Linux',
    use: '原生二进制的反汇编、反编译、交叉引用与符号整理。',
    rule: '默认首选；先看导入、字符串和调用关系，再进入函数细节。',
    href: 'https://github.com/NationalSecurityAgency/ghidra',
  },
  {
    name: 'JADX',
    role: 'Android 静态分析',
    platforms: '跨平台',
    use: '查看 APK / DEX 的 Java 近似源码、Manifest、资源和引用。',
    rule: '仅在 Android 样本时使用；反编译结果不是原始源码，要回看 smali 验证。',
    href: 'https://github.com/skylot/jadx',
  },
  {
    name: 'x64dbg',
    role: 'Windows 动态调试',
    platforms: 'Windows',
    use: '断点、单步、寄存器、内存与调用栈观察。',
    rule: '放在隔离虚拟机；只验证一个明确假设，不漫无目的单步。',
    href: 'https://help.x64dbg.com/en/latest/',
  },
  {
    name: 'radare2',
    role: '命令行与自动化',
    platforms: 'Windows / macOS / Linux',
    use: '快速识别、反汇编、批处理与可复现分析脚本。',
    rule: '作为第二工具，不与 Ghidra 重复堆功能；需要批处理时再引入。',
    href: 'https://www.radare.org/n/radare2.html',
  },
  {
    name: 'Frida',
    role: '进阶动态观察',
    platforms: '桌面 / 移动端',
    use: '在运行时观察函数调用、参数和模块。',
    rule: '完成静态路线后再用；只观察自有测试程序，避免生产设备和真实账号。',
    href: 'https://frida.re/docs/quickstart/',
  },
]

const QUESTIONS = [
  {
    id: 'magic',
    question: '文件开头是 7F 45 4C 46，最合理的第一判断是什么？',
    options: ['它很可能是 ELF 文件', '它一定是 64 位 Windows 程序', '它已经被加密', '它是 APK'],
    answer: 0,
    explanation: '7F 45 4C 46 是 ELF magic；架构和位数还需要继续读取头部字段。',
  },
  {
    id: 'endian',
    question: '按小端序解释 78 56 34 12，得到哪个 32 位值？',
    options: ['0x78563412', '0x12345678', '0x78654321', '无法判断'],
    answer: 1,
    explanation: '小端序把最低有效字节放在低地址，因此显示顺序与数值书写顺序相反。',
  },
  {
    id: 'workflow',
    question: '拿到一个明确授权的未知样本，哪组动作更适合作为起点？',
    options: ['直接双击运行', '先算哈希、识别格式、提取元信息', '先修改二进制', '先关闭安全工具'],
    answer: 1,
    explanation: '先建立不可变样本标识和基础画像，之后的分析才可复盘、可对照。',
  },
  {
    id: 'branch',
    question: 'cmp eax, 5 之后执行 jne fail，什么时候会跳到 fail？',
    options: ['eax 等于 5', 'eax 不等于 5', 'eax 大于 5', '无条件跳转'],
    answer: 1,
    explanation: 'jne 表示 not equal；cmp 结果不相等时零标志 ZF 为 0，分支成立。',
  },
  {
    id: 'evidence',
    question: '静态分析中看到一条可疑字符串，正确做法是什么？',
    options: ['直接当作最终结论', '沿交叉引用找到使用位置并验证', '立刻删除字符串', '忽略所有字符串'],
    answer: 1,
    explanation: '字符串是导航线索，不是行为证据；需要结合引用、控制流或动态观察。',
  },
  {
    id: 'tool',
    question: '分析自建 Android APK 的类、Manifest 和资源，优先选哪个工具？',
    options: ['x64dbg', 'JADX', 'Wireshark', 'GDB'],
    answer: 1,
    explanation: 'JADX 面向 APK / DEX 静态分析，并能展示 Manifest、资源和引用。',
  },
]

const MAGIC_SIGNATURES = [
  { prefix: '7f454c46', label: 'ELF 可执行/目标文件' },
  { prefix: '4d5a', label: 'PE / Windows 可执行文件（MZ）' },
  { prefix: 'cafebabe', label: 'Java Class 或 Mach-O Fat；需结合后续字段' },
  { prefix: '504b0304', label: 'ZIP 容器（APK / JAR 也可能使用）' },
  { prefix: '89504e470d0a1a0a', label: 'PNG 图片' },
]

function externalLinkProps() {
  return { target: '_blank', rel: 'noopener noreferrer' }
}

function ByteLab() {
  const [value, setValue] = useState('7F 45 4C 46 02 01 01 00')
  const result = useMemo(() => {
    const compact = value.replace(/0x/gi, '').replace(/[\s,:-]/g, '')
    if (!compact) return { error: '请输入十六进制字节。' }
    if (!/^[0-9a-f]+$/i.test(compact)) return { error: '只接受 0-9、A-F 和常见分隔符。' }
    if (compact.length % 2) return { error: '每个字节需要两位十六进制数。' }
    if (compact.length > 128) return { error: '基础实验最多解析 64 字节。' }

    const bytes = compact.match(/.{2}/g).map((item) => Number.parseInt(item, 16))
    const ascii = bytes.map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '·')).join('')
    const signature = MAGIC_SIGNATURES.find((item) => compact.toLowerCase().startsWith(item.prefix))
    const littleEndian = bytes.slice(0, 4).reduce((sum, byte, index) => sum + byte * (2 ** (index * 8)), 0) >>> 0
    return { bytes, ascii, signature: signature?.label || '未命中内置常见签名', littleEndian }
  }, [value])

  return (
    <Section
      title="字节观察台"
      description="纯浏览器解析，不上传、不读取本地文件。练习文件签名、可打印字符串和小端整数。"
    >
      <label className="block text-[12px] font-semibold text-[#53554d] dark:text-gray-300" htmlFor="reverse-byte-input">
        十六进制字节
      </label>
      <textarea
        id="reverse-byte-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        spellCheck={false}
        rows={3}
        className="mt-2 w-full rounded-lg border border-[#caccc0] bg-[#fafaf6] px-3 py-2 font-mono text-[13px] leading-6 text-[#15140f] outline-none transition focus:border-[#6f7166] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-100 dark:focus:border-[#718096]"
      />
      {result.error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {result.error}
        </p>
      ) : (
        <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-[#dedfd5] bg-[#dedfd5] sm:grid-cols-3 dark:border-[#26313e] dark:bg-[#26313e]">
          <div className="bg-white p-3 dark:bg-[#10161f]">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">签名判断</dt>
            <dd className="mt-1 text-[12px] font-semibold leading-5 text-[#15140f] dark:text-gray-100">{result.signature}</dd>
          </div>
          <div className="bg-white p-3 dark:bg-[#10161f]">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">ASCII 预览</dt>
            <dd className="mt-1 break-all font-mono text-[12px] leading-5 text-[#15140f] dark:text-gray-100">{result.ascii}</dd>
          </div>
          <div className="bg-white p-3 dark:bg-[#10161f]">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">前 4 字节 · 小端</dt>
            <dd className="mt-1 font-mono text-[12px] font-semibold leading-5 text-[#15140f] dark:text-gray-100">0x{result.littleEndian.toString(16).padStart(8, '0').toUpperCase()}</dd>
          </div>
        </dl>
      )}
    </Section>
  )
}

function KnowledgeTest({ savedScore, onScore }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const score = QUESTIONS.reduce((total, question) => total + (answers[question.id] === question.answer ? 1 : 0), 0)

  function submit() {
    setSubmitted(true)
    onScore(score)
  }

  function reset() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <Section
      title="基础知识测试"
      description="6 题覆盖文件头、字节序、分支、证据链和工具选择；答完后再查看解释。"
      actions={savedScore != null ? <span className="font-mono text-[11px] text-[#77796d] dark:text-gray-400">历史最好 {savedScore}/6</span> : null}
    >
      <ol className="space-y-6">
        {QUESTIONS.map((question, questionIndex) => (
          <li key={question.id}>
            <p className="text-[13px] font-semibold leading-6 text-[#15140f] dark:text-gray-100">
              <span className="mr-2 font-mono text-[10px] text-[#929487]">{String(questionIndex + 1).padStart(2, '0')}</span>
              {question.question}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === optionIndex
                const correct = submitted && optionIndex === question.answer
                const wrong = submitted && selected && optionIndex !== question.answer
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                    className={`rounded-lg border px-3 py-2 text-left text-[12px] leading-5 transition disabled:cursor-default ${
                      correct
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : wrong
                          ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
                          : selected
                            ? 'border-[#15140f] bg-[#f0efe7] text-[#15140f] dark:border-gray-200 dark:bg-[#1a2330] dark:text-gray-100'
                            : 'border-[#dedfd5] bg-white text-[#53554d] hover:border-[#9b9d90] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568]'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {submitted ? <p className="mt-2 text-[11px] leading-5 text-[#77796d] dark:text-gray-400">{question.explanation}</p> : null}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#e6e7df] pt-4 dark:border-[#26313e]">
        {submitted ? (
          <>
            <p className="mr-auto text-[13px] font-semibold text-[#15140f] dark:text-gray-100">本次得分 {score}/6</p>
            <AdminButton type="button" onClick={reset}><IconRefresh size={15} />重新测试</AdminButton>
          </>
        ) : (
          <>
            <p className="mr-auto text-[11px] text-[#858779] dark:text-[#8e9ab0]">已作答 {Object.keys(answers).length}/6</p>
            <AdminButton type="button" variant="primary" disabled={Object.keys(answers).length !== QUESTIONS.length} onClick={submit}>
              提交并查看解释
            </AdminButton>
          </>
        )}
      </div>
    </Section>
  )
}

export default function ReverseLabClient() {
  const [progress, setProgress] = useState({ completed: [], bestScore: null, notes: '' })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved && typeof saved === 'object') {
        setProgress({
          completed: Array.isArray(saved.completed) ? saved.completed : [],
          bestScore: Number.isInteger(saved.bestScore) ? saved.bestScore : null,
          notes: typeof saved.notes === 'string' ? saved.notes : '',
        })
      }
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {}
  }, [progress, ready])

  function toggleStage(id) {
    setProgress((current) => ({
      ...current,
      completed: current.completed.includes(id)
        ? current.completed.filter((item) => item !== id)
        : [...current.completed, id],
    }))
  }

  function saveScore(score) {
    setProgress((current) => ({
      ...current,
      bestScore: current.bestScore == null ? score : Math.max(current.bestScore, score),
    }))
  }

  const completedCount = progress.completed.filter((id) => LEARNING_STAGES.some((stage) => stage.id === id)).length

  return (
    <AdminPage
      title="逆向测试"
      description="为自有或明确授权的软件建立一条可重复的学习路径：先理解，再静态分析，最后在隔离环境里做最小动态验证。"
    >
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-[#caccc0] bg-white p-5 dark:border-[#2d3744] dark:bg-[#10161f]">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">学习闭环</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#15140f] dark:text-gray-100">观察 → 假设 → 验证 → 记录</h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-6 text-[#67695d] dark:text-gray-400">
            每次只回答一个问题，并留下样本哈希、环境、证据和结论。页面只保存本机学习进度与笔记，不接收或执行任何样本。
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e9e9e1] dark:bg-[#202b38]">
              <div className="h-full rounded-full bg-[#15140f] transition-all dark:bg-gray-100" style={{ width: `${completedCount * 25}%` }} />
            </div>
            <span className="font-mono text-[10px] text-[#77796d] dark:text-gray-400">{completedCount}/4 阶段</span>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200"><IconLock size={17} /><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">实验边界</span></div>
          <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[#655f4b] dark:text-amber-100/80">
            <li>只分析自编译、开源许可或明确授权样本。</li>
            <li>未知样本放入快照虚拟机，默认断网且不放真实凭据。</li>
            <li>不绕过许可、付费、账号或生产系统控制。</li>
          </ul>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)] xl:items-start">
        <div className="space-y-6">
          <Section title="四阶段路线" description="阶段按顺序推进；完成标准强调可解释的产物，不以安装了多少工具衡量。">
            <ol className="divide-y divide-[#e6e7df] dark:divide-[#26313e]">
              {LEARNING_STAGES.map((stage) => {
                const done = progress.completed.includes(stage.id)
                return (
                  <li key={stage.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[42px_minmax(0,1fr)_auto]">
                    <span className="font-mono text-[11px] font-semibold text-[#929487] dark:text-[#718096]">{stage.index}</span>
                    <div>
                      <h3 className="text-[13px] font-semibold text-[#15140f] dark:text-gray-100">{stage.title}</h3>
                      <p className="mt-1 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">{stage.goal}</p>
                      <p className="mt-2 text-[11px] leading-5 text-[#858779] dark:text-[#8e9ab0]"><span className="font-semibold">完成产物：</span>{stage.evidence}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleStage(stage.id)}
                      aria-pressed={done}
                      className={`inline-flex h-8 items-center gap-1.5 self-start rounded-lg border px-2.5 text-[11px] font-semibold transition ${done ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-[#caccc0] bg-white text-[#67695d] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300'}`}
                    >
                      {done ? <IconCheck size={14} /> : null}{done ? '已完成' : '标记完成'}
                    </button>
                  </li>
                )
              })}
            </ol>
          </Section>

          <ByteLab />
          <KnowledgeTest savedScore={progress.bestScore} onScore={saveScore} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[72px]">
          <Section title="学习资料" description="只收录结构化课程、项目官方教程和明确授权练习。">
            <ul className="divide-y divide-[#e6e7df] dark:divide-[#26313e]">
              {RESOURCES.map((resource) => (
                <li key={resource.href} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#929487] dark:text-[#718096]">{resource.kind} · {resource.stage}</span>
                      <h3 className="mt-1 text-[13px] font-semibold text-[#15140f] dark:text-gray-100">{resource.title}</h3>
                    </div>
                    <a href={resource.href} {...externalLinkProps()} aria-label={`打开 ${resource.title}`} className="mt-0.5 text-[#858779] transition hover:text-[#15140f] dark:text-[#8e9ab0] dark:hover:text-gray-100"><IconArrowUpRight size={16} /></a>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#67695d] dark:text-gray-400">{resource.description}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="通用工具箱" description="一个主力工具配一个明确用途；需要时再安装，不做全家桶。">
            <ul className="space-y-3">
              {TOOLS.map((tool) => (
                <li key={tool.name} className="rounded-lg border border-[#dedfd5] bg-[#fafaf6] p-3 dark:border-[#2d3744] dark:bg-[#0e131c]">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-[13px] font-semibold text-[#15140f] dark:text-gray-100">{tool.name}</h3><p className="mt-0.5 font-mono text-[9px] text-[#858779] dark:text-[#8e9ab0]">{tool.role} · {tool.platforms}</p></div>
                    <a href={tool.href} {...externalLinkProps()} aria-label={`打开 ${tool.name} 官方资料`} className="text-[#858779] transition hover:text-[#15140f] dark:text-[#8e9ab0] dark:hover:text-gray-100"><IconArrowUpRight size={15} /></a>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#53554d] dark:text-gray-300">{tool.use}</p>
                  <p className="mt-1 text-[10px] leading-5 text-[#858779] dark:text-[#8e9ab0]">使用边界：{tool.rule}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="复盘记录" description="仅保存到当前浏览器。不要记录样本、密钥、账号或真实业务数据。">
            <label htmlFor="reverse-notes" className="sr-only">逆向学习复盘记录</label>
            <textarea
              id="reverse-notes"
              rows={7}
              maxLength={2000}
              value={progress.notes}
              onChange={(event) => setProgress((current) => ({ ...current, notes: event.target.value }))}
              placeholder={'样本来源与授权：\n本次问题：\n静态证据：\n动态验证：\n结论与待办：'}
              className="w-full rounded-lg border border-[#caccc0] bg-[#fafaf6] px-3 py-2 text-[12px] leading-6 text-[#15140f] outline-none transition placeholder:text-[#a0a296] focus:border-[#6f7166] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-100 dark:placeholder:text-[#536173] dark:focus:border-[#718096]"
            />
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#858779] dark:text-[#8e9ab0]"><IconCircleCheck size={13} />自动保存在本机 · {progress.notes.length}/2000</p>
          </Section>
        </aside>
      </div>
    </AdminPage>
  )
}
