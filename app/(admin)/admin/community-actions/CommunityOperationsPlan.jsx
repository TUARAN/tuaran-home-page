import { Section, StatusPill } from '../../components/ui'

const STAGES = [
  {
    id: 'baseline',
    number: '01',
    title: '盘点与单机试运行',
    period: '第 1 周',
    owner: '站长',
    tasks: [
      '记录闲置 M1 的内存、磁盘、macOS 版本和 NAS 型号；确认网线、路由器与 UPS 条件。',
      '用专用 Chrome 配置逐个平台登录，安装插件；先以低频、可人工核对的任务试运行。',
      '逐项实测 M1 → 目标平台、DeepSeek API、2aran.com 的连接，以及重启后的远程接入和任务恢复。',
      '连续 7 天记录内存、心跳、成功回执、登录失效、页面卡住、断网和人工介入次数。',
    ],
    evidence: '设备清单、连接测试结果、7 天运行记录和每类故障的首次样本。',
    gate: '能区分设备、浏览器、登录态、网络和目标平台故障；决定哪些任务可以继续试运行。',
  },
  {
    id: 'monitor',
    number: '02',
    title: '分层监控与告警',
    period: '第 2 周',
    owner: '站长 + 编码助手',
    tasks: [
      '在家中检查 M1、Chrome 和家庭网络；在家庭网络之外检查站点和设备心跳。',
      '为每项任务记录最近一次成功、最近一次失败、预期下次运行时间和插件版本。',
      '把设备失联、设备在线但任务停滞、回执接口故障、DeepSeek 故障分别告警并去重。',
      '模拟断网、Chrome 退出、登录失效和站点故障，核对告警是否指向正确故障层。',
    ],
    evidence: '监控规则、告警样本、四类故障演练记录及恢复时间。',
    gate: '家里断网时仍能收到外部告警；只有心跳而没有任务成果不会显示为运行正常。',
  },
  {
    id: 'recovery',
    number: '03',
    title: '安全恢复与状态保护',
    period: '监控验收后',
    owner: '编码助手实施，站长验收',
    tasks: [
      '将待执行时间、任务进度、已处理目标和待确认发布持久化，重启后先核对状态再续跑。',
      '短暂网络错误退避重试；Chrome 崩溃后恢复浏览器与任务。',
      '登录失效、验证码、平台限制和发布结果不明时暂停对应任务，保留现场供人工核对。',
      '对同一目标设置幂等标识，验证断线重连和重复回执不会造成重复提交。',
    ],
    evidence: '重启与断线演练、重复提交检查、暂停原因和人工处理记录。',
    gate: '常见基础设施故障可恢复；无法确认结果的外部动作不会自动再次提交。',
  },
  {
    id: 'delivery',
    number: '04',
    title: '编码、验证与发布',
    period: '恢复机制验收后持续运行',
    owner: '编码助手修复，站长把关外部动作',
    tasks: [
      '故障单关联错误码、插件版本、目标网址、脱敏截图和最小复现步骤。',
      '在隔离环境修复并运行相关测试；先在测试 Chrome 配置验证，再升级插件版本。',
      '按仓库版本规则发布，核对运行设备版本、回执、实际平台结果和回滚入口。',
      '将验证结论写回故障单；同类故障再发时重开并修正测试或监控规则。',
    ],
    evidence: '故障单、代码差异、测试结果、版本记录、发布验证和回滚演练。',
    gate: '每次修复都能从告警追溯到原因、改动、验证、发布及观察结果。',
  },
  {
    id: 'capacity',
    number: '05',
    title: '复盘与设备采购决策',
    period: '稳定运行 7 天后，按月复盘',
    owner: '站长',
    tasks: [
      '统计 M1 的内存压力、浏览器崩溃和任务积压；分别统计断网、登录及页面改版造成的中断。',
      '先处理网线、路由器、UPS 和远程维护缺口；NAS 保存配置与日志备份。',
      '只有 M1 持续资源不足或硬件不可靠、且影响已验证任务时，再评估 Mac mini。',
      '每月收紧无效任务、调整告警阈值和测试用例，并记录采购或不采购的依据。',
    ],
    evidence: '资源曲线、故障分类、月度复盘和采购决策记录。',
    gate: '采购理由来自可复现的硬件瓶颈；网络或登录故障由对应措施解决。',
  },
]

const FAULTS = [
  { signal: '设备或心跳失联', action: '从外部确认家庭网络与 M1 状态；恢复后核对任务状态。' },
  { signal: '设备在线，任务无成果', action: '检查 Chrome 标签页、登录态、插件版本与预期运行时间。' },
  { signal: '网络或 API 临时失败', action: '限次退避重试，恢复后补传回执；超过阈值告警。' },
  { signal: '平台限制或发布结果不明', action: '暂停该任务，人工确认实际结果后再决定续跑。' },
  { signal: '页面改版或代码错误', action: '保存脱敏证据，复现、修复、测试、验证、发布并观察。' },
]

export default function CommunityOperationsPlan() {
  return (
    <div className="grid gap-4">
      <Section title="实践目标" description="从一台闲置 M1 起步，验证浏览器任务的持续运行、可观测恢复与修正能力。">
        <div className="grid gap-3 text-[13px] leading-6 text-[#5f6156] dark:text-gray-300 md:grid-cols-3">
          <p className="m-0 rounded-lg border border-[#e4e6dc] p-3 dark:border-[#263142]"><b className="block text-[#25261f] dark:text-gray-100">执行</b>M1 保持浏览器登录态并运行插件；DeepSeek 通过 API 提供生成能力。</p>
          <p className="m-0 rounded-lg border border-[#e4e6dc] p-3 dark:border-[#263142]"><b className="block text-[#25261f] dark:text-gray-100">记录</b>站点收回执与状态；NAS 备份配置和日志，家庭网络之外负责失联告警。</p>
          <p className="m-0 rounded-lg border border-[#e4e6dc] p-3 dark:border-[#263142]"><b className="block text-[#25261f] dark:text-gray-100">决策</b>先查网络、登录与页面故障；有硬件瓶颈证据时再采购 Mac mini。</p>
        </div>
      </Section>

      <Section title="执行计划" description="按验收门槛逐阶段推进；每阶段保留证据，未验证的能力不计为完成。">
        <ol className="m-0 grid gap-3 p-0">
          {STAGES.map((stage) => (
            <li key={stage.id} className="list-none rounded-xl border border-[#e4e6dc] p-4 dark:border-[#263142]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-[#7a7c70] dark:text-gray-400">{stage.number}</span>
                <h3 className="m-0 text-[15px] font-semibold text-[#25261f] dark:text-gray-100">{stage.title}</h3>
                <StatusPill size="sm" tone="neutral" icon={false}>{stage.period}</StatusPill>
              </div>
              <p className="mb-0 mt-1 text-[12px] text-[#7a7c70] dark:text-gray-400">责任：{stage.owner}</p>
              <ul className="mb-0 mt-3 grid gap-1.5 pl-5 text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">
                {stage.tasks.map((task) => <li key={task}>{task}</li>)}
              </ul>
              <div className="mt-3 grid gap-2 border-t border-[#e4e6dc] pt-3 text-[12px] leading-5 text-[#5f6156] dark:border-[#263142] dark:text-gray-300 md:grid-cols-2">
                <p className="m-0"><b>留存证据：</b>{stage.evidence}</p>
                <p className="m-0"><b>完成门槛：</b>{stage.gate}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="故障到修正的闭环" description="发现异常 → 定位故障层 → 限定恢复动作 → 验证结果 → 发布修复 → 观察是否复发。">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13px] leading-6">
            <thead><tr className="text-[#7a7c70] dark:text-gray-400"><th className="pb-2 pr-4 font-medium">信号</th><th className="pb-2 font-medium">处理与回流</th></tr></thead>
            <tbody>{FAULTS.map((fault) => (
              <tr key={fault.signal} className="border-t border-[#e4e6dc] dark:border-[#263142]">
                <th className="py-2 pr-4 font-medium text-[#25261f] dark:text-gray-100">{fault.signal}</th>
                <td className="py-2 text-[#5f6156] dark:text-gray-300">{fault.action}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mb-0 mt-3 text-[12px] leading-5 text-[#7a7c70] dark:text-gray-400">每次故障记录：发生时间、设备与插件版本、任务、错误码、影响范围、处理动作、验证结果和复发情况。回执不保存正文、Cookie 或模型密钥。</p>
      </Section>

      <Section title="平台边界" description="任务能运行不等于适合无人值守；先核对平台规则与账号权限。">
        <p className="m-0 text-[13px] leading-6 text-[#5f6156] dark:text-gray-300">
          X 的浏览器脚本自动化、批量互动和 AI 自动回复受到官方规则限制。X 相关任务先核对规则，优先采用已有 API 发布与人工确认流程；其他平台也在扩大执行范围前逐项核对。
          {' '}<a className="underline underline-offset-2" href="https://help.x.com/en/rules-and-policies/x-automation" target="_blank" rel="noreferrer">查看 X 自动化规则</a>
        </p>
      </Section>
    </div>
  )
}
