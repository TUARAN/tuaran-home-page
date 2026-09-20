'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  IconArrowDown,
  IconArrowRight,
  IconBrandApple,
  IconBrandWindows,
  IconCheck,
  IconCloud,
  IconDeviceDesktop,
  IconKey,
  IconMessageCircle,
  IconRefresh,
  IconShieldCheck,
} from '@tabler/icons-react'

import SharePageButton from '../../components/SharePageButton'
import styles from './workbuddy-acp-bridge.module.css'

const PAGE_URL = 'https://2aran.com/tools/workbuddy-acp-bridge'

const CAPABILITIES = [
  { id: 'cloud-invoke', lane: 'cloud', verb: '问', target: '云端', scope: 'user.task.invokable', endpoint: 'POST /openapi/v2/tasks', result: '返回 task_id、ACP link 和 token，再通过 ACP 通道接收流式回答。', short: '创建并执行云端任务' },
  { id: 'cloud-read', lane: 'cloud', verb: '查', target: '云端', scope: 'user.task.readable', endpoint: 'GET /openapi/v2/tasks · GET /tasks/{task_id}', result: '读取任务列表、状态和详情；会话恢复时可重新取得 ACP 凭据。', short: '查询云端任务与会话' },
  { id: 'local-invoke', lane: 'local', verb: '问', target: '本地', scope: 'user.localassistant.invokable', endpoint: 'POST /openapi/v2/localassistant/message', result: '只同步返回 message_id，表示任务已交给用户 PC 端本地助理。', short: '向 PC 本地助理发送任务' },
  { id: 'local-read', lane: 'local', verb: '查', target: '本地', scope: 'user.localassistant.readable', endpoint: 'GET /openapi/v2/localassistant/message?message_id=...', result: '用 message_id 做增量查询，直到取得 role=assistant 的最终回复。', short: '查在线状态、历史与结果' },
]

const FLOWS = {
  cloud: [
    ['01', '用户授权', 'OAuth 为应用签发用户 access token。'],
    ['02', '创建任务', 'POST /tasks 返回 task_id 与 ACP 连接凭据。'],
    ['03', '连接 ACP', '使用 SSE + JSON-RPC 建立云端会话。'],
    ['04', '实时回答', '流式消息回到硬件接入助手。'],
  ],
  local: [
    ['01', '检查在线', '确认用户电脑上的 WorkBuddy 本地助理在线。'],
    ['02', '发送任务', 'POST 消息后取得 message_id。'],
    ['03', '增量查询', '按 message_id 查询新产生的消息。'],
    ['04', '回到界面', '第一条 assistant 结果去重后显示在模拟器。'],
  ],
}

const PLATFORMS = [
  { id: 'mac-arm', label: 'macOS', detail: 'Apple Silicon', icon: IconBrandApple, file: 'WorkBuddy 硬件接入助手-0.1.0-arm64.dmg' },
  { id: 'mac-intel', label: 'macOS', detail: 'Intel', icon: IconBrandApple, file: 'WorkBuddy 硬件接入助手-0.1.0.dmg' },
  { id: 'windows', label: 'Windows', detail: 'x64', icon: IconBrandWindows, file: 'WorkBuddy 硬件接入助手 Setup 0.1.0.exe' },
]

const TEST_STEPS = [
  '安装并启动硬件接入助手',
  '填写 Client ID、Client Secret 和 localhost 回调',
  '在同一台电脑完成 WorkBuddy OAuth 授权',
  '分别验证问云端、查云端、问本地、查本地',
  '验证退出、重新授权、长任务和连续消息',
]

export default function WorkBuddyHardwareAccessClient() {
  const [activeCapability, setActiveCapability] = useState('cloud-invoke')
  const [flowMode, setFlowMode] = useState('cloud')
  const [platform, setPlatform] = useState('mac-arm')
  const [checked, setChecked] = useState([])
  const capability = CAPABILITIES.find((item) => item.id === activeCapability)
  const selectedPlatform = PLATFORMS.find((item) => item.id === platform)
  const progress = Math.round((checked.length / TEST_STEPS.length) * 100)
  const flow = useMemo(() => FLOWS[flowMode], [flowMode])

  function toggleStep(index) {
    setChecked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="面包屑导航">
          <Link href="/rich-pages">互动专题</Link><span>/</span><Link href="/tools">工具库</Link><span>/</span><span>WorkBuddy 硬件接入</span>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.statusRow}><span className={styles.status}><i /> 真实 API 联调已跑通</span><span className={styles.platform}>macOS · Windows</span></div>
            <p className={styles.eyebrow}>WORKBUDDY HARDWARE ACCESS</p>
            <h1>让硬件会问，<br /><em>也会把答案带回来。</em></h1>
            <p className={styles.lead}>OAuth 授权、云端任务、PC 本地助理和桌面消息入口已连成一条可测试链路。四项核心能力可以简化为：<strong>问云端、查云端、问本地、查本地。</strong></p>
            <div className={styles.actions}>
              <a className={styles.primaryAction} href="#capabilities">打开能力地图 <IconArrowDown size={17} /></a>
              <a className={styles.secondaryAction} href="#install">查看安装测试</a>
              <SharePageButton title="WorkBuddy 硬件接入助手" text="问云端、查云端、问本地、查本地，一页看懂 WorkBuddy 硬件 Open API。" url={PAGE_URL} size="sm" />
            </div>
          </div>
          <aside className={styles.liveCard}>
            <div className={styles.liveTop}><span>LIVE TEST STATUS</span><b>4 / 4</b></div>
            <div className={styles.liveRoute}><IconMessageCircle size={19} /><span>短信式入口</span><i /></div>
            <div className={styles.liveRoute}><IconDeviceDesktop size={19} /><span>本机 127.0.0.1:8080</span><i /></div>
            <div className={styles.liveSplit}><div><IconCloud size={19} /><strong>云端任务</strong><small>ACP 实时回答</small></div><div><IconDeviceDesktop size={19} /><strong>本地助理</strong><small>message_id 轮询</small></div></div>
            <p><IconShieldCheck size={16} /> Token 与密钥仅保存在用户本机</p>
          </aside>
        </section>

        <section className={styles.capabilitySection} id="capabilities">
          <div className={styles.sectionHeading}><p>FOUR CORE CAPABILITIES</p><h2>四个权限，对应两组“问与查”</h2><span>点击卡片查看权限、接口和返回方式。权限 Scope 不等于同步返回最终结果。</span></div>
          <div className={styles.capabilityLayout}>
            <div className={styles.capabilityGrid}>
              {CAPABILITIES.map((item) => (
                <button type="button" key={item.id} className={`${styles.capabilityCard} ${activeCapability === item.id ? styles.capabilityActive : ''}`} onClick={() => setActiveCapability(item.id)} aria-pressed={activeCapability === item.id}>
                  <span className={styles.capabilityVerb}>{item.verb}</span><span><strong>{item.target}</strong><small>{item.short}</small></span><IconArrowRight size={18} />
                </button>
              ))}
            </div>
            <article className={styles.capabilityDetail}>
              <div className={styles.detailHeader}><span>{capability.verb}{capability.target}</span><code>{capability.scope}</code></div>
              <h3>{capability.short}</h3>
              <div className={styles.endpoint}><span>HTTP</span><code>{capability.endpoint}</code></div>
              <p>{capability.result}</p>
              <div className={styles.detailNote}>{capability.lane === 'local' ? '本地助理是异步任务：“问本地”取得 message_id，“查本地”才能把结果带回界面。' : '云端任务创建后由 ACP 返回实时消息，读取接口主要用于列表、详情和会话恢复。'}</div>
            </article>
          </div>
        </section>

        <section className={styles.flowSection}>
          <div className={styles.flowHeader}><div className={styles.sectionHeading}><p>MESSAGE JOURNEY</p><h2>同一个消息入口，两种执行路线</h2></div><div className={styles.segmented}><button type="button" className={flowMode === 'cloud' ? styles.selected : ''} onClick={() => setFlowMode('cloud')}>云端任务</button><button type="button" className={flowMode === 'local' ? styles.selected : ''} onClick={() => setFlowMode('local')}>本地助理</button></div></div>
          <div className={styles.flowTrack}>{flow.map(([step, title, copy], index) => <article key={step}><span>{step}</span><h3>{title}</h3><p>{copy}</p>{index < flow.length - 1 && <IconArrowRight className={styles.flowArrow} size={18} />}</article>)}</div>
        </section>

        <figure className={`${styles.productShot} ${styles.smsPreview}`}>
          <div className={styles.smsWindow} aria-label="新消息 ClawBot 当前短信界面预览">
            <header className={styles.smsHeader}>
              <button type="button" aria-label="返回">‹</button>
              <div className={styles.smsIdentity}><i>W</i><span><strong>新消息 ClawBot</strong><small><b /> 在线</small></span></div>
              <button type="button" aria-label="更多">•••</button>
            </header>
            <div className={styles.smsConversation}>
              <time>今天</time>
              <div className={styles.receivedBubble}>您好，我是 WorkBuddy 助理。直接发送消息即可。</div>
              <small>已连接 5G 新消息模拟通道</small>
              <div className={styles.receivedBubble}>你好你好！有什么可以帮你的吗？</div>
              <small>WorkBuddy · 正在回复</small>
            </div>
            <div className={styles.smsComposer}>
              <button type="button" aria-label="添加附件">＋</button>
              <span>信息 · RCS</span>
              <button type="button" aria-label="发送">↑</button>
            </div>
          </div>
          <figcaption><strong>当前 8080 短信界面</strong><span>单列消息窗口作为入口，执行位置可在云端任务与 PC 本地助理之间切换。</span></figcaption>
        </figure>

        <section className={styles.installSection} id="install">
          <div className={styles.sectionHeading}><p>DESKTOP TEST KIT</p><h2>选择同事的电脑类型</h2><span>安装包已生成，当前采用内部发放。公开下载前还需要 Apple 公证和 Windows 代码签名。</span></div>
          <div className={styles.platformGrid}>{PLATFORMS.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={platform === item.id ? styles.platformActive : ''} onClick={() => setPlatform(item.id)}><Icon size={27} /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{platform === item.id && <IconCheck size={18} />}</button> })}</div>
          <div className={styles.selectedPackage}><div><span>应发给测试同事的文件</span><strong>{selectedPlatform.file}</strong></div><p>内测包不包含 Client Secret。第一次启动会自动打开接入向导。</p></div>
          <div className={styles.testPanel}>
            <div className={styles.testProgress}><div><span>内部联调清单</span><strong>{checked.length}/{TEST_STEPS.length}</strong></div><div className={styles.progressBar}><i style={{ width: `${progress}%` }} /></div></div>
            <div className={styles.checklist}>{TEST_STEPS.map((step, index) => <button type="button" key={step} onClick={() => toggleStep(index)} className={checked.includes(index) ? styles.checked : ''}><i>{checked.includes(index) && <IconCheck size={15} />}</i><span>{step}</span></button>)}</div>
            {progress === 100 && <p className={styles.completeMessage}><IconCheck size={17} /> 本机的内部联调流程已全部勾选完成。</p>}
          </div>
        </section>

        <section className={styles.securityGrid}>
          <article><IconKey size={24} /><p>LOCAL SECURITY</p><h2>什么留在用户电脑</h2><ul><li>Client Secret 使用系统安全存储</li><li>OAuth token 只写入权限受限的本地文件</li><li>本地服务仅监听 127.0.0.1:8080</li><li>Bridge Key 自动生成，只保护真实硬件接口</li></ul></article>
          <article><IconRefresh size={24} /><p>CURRENT BOUNDARY</p><h2>内测已可用，公开发布还有四步</h2><ul><li>macOS Developer ID 签名与 notarization</li><li>Windows 代码签名，降低 SmartScreen 告警</li><li>手机扫码需要 HTTPS 回调与一次性配对服务</li><li>真实 5G 入口还需要生产网关端到端联调</li></ul></article>
        </section>

        <section className={styles.conclusion}><div><span>REPORT SUMMARY</span><h2>可以怎么向领导汇报</h2></div><blockquote>WorkBuddy 硬件 Open API 的核心链路已跑通：OAuth 授权、云端任务、PC 本地助理与结果回传均已完成真实验证，并形成 macOS、Windows 内部测试客户端。下一阶段重点是安装包签名、扫码配对与真实 5G 生产链路。</blockquote></section>
      </div>
    </main>
  )
}
