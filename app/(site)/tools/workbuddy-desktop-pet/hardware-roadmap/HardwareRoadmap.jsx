'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import styles from './HardwareRoadmap.module.css'

const STORAGE_KEY = 'lulu-hardware-roadmap-v1'

const stages = [
  {
    id: 'buy', number: '01', label: '采购', kicker: '把型号买对',
    title: '得到一台真实、可编程的桌面终端',
    summary: '购买准确型号，保留订单、包装和规格资料。收到设备后，再以实机信息确定后续方案。',
    tasks: [
      ['buy-device', '购买 M5Stack CoreS3-SE，SKU：K128-SE'],
      ['buy-cable', '准备一根支持数据传输的 USB-C 线'],
      ['keep-proof', '保留订单、包装标签和产品型号照片'],
    ],
  },
  {
    id: 'design', number: '02', label: '设计', kicker: '定义鹿鹿的行为',
    title: '从通用开发板变成鹿鹿',
    summary: '先确定实体角色、交互边界、设备协议和隐私边界，再开始写固件。',
    tasks: [
      ['design-face', '完成待机、聆听、执行、完成、离线五种表情'],
      ['design-flow', '确定触摸、语音、屏幕与播报的最小闭环'],
      ['design-protocol', '冻结 USB JSON Lines 消息协议 v1'],
      ['design-security', '确认 Token 与 Client Secret 永不进入硬件'],
    ],
  },
  {
    id: 'firmware', number: '03', label: '固件', kicker: '点亮输入与输出',
    title: '让屏幕、触摸、麦克风和扬声器工作',
    summary: '从可靠的设备状态机开始，再逐步增加录音与语音反馈。',
    tasks: [
      ['fw-flash', '完成首次烧录并记录固件版本'],
      ['fw-screen', '显示鹿鹿形象、设备编号和连接状态'],
      ['fw-touch', '触摸操作能够产生真实设备事件'],
      ['fw-audio', '完成麦克风录音与扬声器提示音自检'],
    ],
  },
  {
    id: 'bridge', number: '04', label: '联调', kicker: '接入现有桥接器',
    title: '通过 USB 接入 Lulu Bridge',
    summary: '电脑负责凭据与业务编排；硬件采集动作、显示状态并反馈结果。',
    tasks: [
      ['bridge-detect', '桥接器能识别 K128-SE 的 USB 串口'],
      ['bridge-event', '硬件触摸事件能进入本机桥接器'],
      ['bridge-reply', 'WorkBuddy 回复能回传到硬件屏幕'],
      ['bridge-offline', '断开 USB 后正确显示离线状态'],
    ],
  },
  {
    id: 'evidence', number: '05', label: '证据', kicker: '整理审核材料',
    title: '把可运行原型变成可验证的证据',
    summary: '用照片和视频证明硬件存在、链路真实，且能力边界与申报内容一致。',
    tasks: [
      ['proof-front', '拍摄能看清鹿鹿与设备外观的亮屏正面照'],
      ['proof-link', '拍摄 USB 连接电脑与真实回复画面'],
      ['proof-video', '录制 30–60 秒完整闭环视频'],
      ['proof-page', '更新产品页、隐私说明、型号与量产计划'],
    ],
  },
  {
    id: 'submit', number: '06', label: '提交', kicker: '申请最小权限',
    title: '用原型的真实能力提交审核',
    summary: '完成企业与产品条件核验，仅申请实际使用的权限并提交实机证据。',
    tasks: [
      ['submit-scope', '仅申请 user.localassistant.readable 与 invokable'],
      ['submit-copy', '产品名称与介绍明确标注 CoreS3-SE 原型'],
      ['submit-assets', '上传实机图、演示视频和产品链接'],
      ['submit-review', '复核企业认证、隐私协议与明确量产计划'],
    ],
  },
]

const protocolRows = [
  ['IN', 'touch.action', '屏幕点击「开始」'],
  ['IN', 'audio.ready', '本机录音准备完成'],
  ['OUT', 'assistant.status', '连接、执行、离线或失败'],
  ['OUT', 'assistant.reply', '展示本次助理回复'],
]

export default function HardwareRoadmap() {
  const [activeStage, setActiveStage] = useState('buy')
  const [transport, setTransport] = useState('usb')
  const [checked, setChecked] = useState({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
      if (stored && typeof stored === 'object') setChecked(stored)
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked))
  }, [checked, ready])

  const allTasks = useMemo(() => stages.flatMap((stage) => stage.tasks), [])
  const finished = allTasks.filter(([id]) => checked[id]).length
  const progress = Math.round((finished / allTasks.length) * 100)
  const selected = stages.find((stage) => stage.id === activeStage) || stages[0]

  function toggleTask(id) {
    setChecked((current) => ({ ...current, [id]: !current[id] }))
  }

  function copyArrivalTemplate() {
    navigator.clipboard?.writeText('CoreS3-SE 已收到。我会附上包装正反面、设备型号标签和亮机照片，请开始鹿鹿硬件联调。')
  }

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link href="/tools/workbuddy-desktop-pet" className={styles.back}>← 鹿鹿精灵</Link>
        <span>LULU / HARDWARE STUDY 001</span>
        <span className={styles.navStatus}><i /> PRE-PURCHASE</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>DESKTOP COMPANION · PHYSICAL PROTOTYPE</p>
          <h1>给鹿鹿一副<br />真实的身体。</h1>
          <p className={styles.lead}>一台有触摸、有声音、能回应的桌面终端。先从 CoreS3-SE 原型开始，完成可验证的 WorkBuddy 硬件闭环。</p>
          <div className={styles.heroActions}>
            <a href="https://m5stack.taobao.com/" target="_blank" rel="noreferrer" className={styles.primaryAction}>淘宝搜索 K128-SE <span>↗</span></a>
            <a href="https://shop.m5stack.com/products/m5stack-cores3-se-iot-controller-w-o-battery-bottom" target="_blank" rel="noreferrer" className={styles.textAction}>查看官方规格 ↗</a>
          </div>
        </div>

        <div className={styles.productStage} aria-label="鹿鹿硬件原型概念图">
          <span className={styles.measureTop}>54 mm</span>
          <span className={styles.measureSide}>54 mm</span>
          <div className={styles.deviceShadow} />
          <div className={styles.device}>
            <div className={styles.deviceTop}><span /><span /><span /></div>
            <div className={styles.deviceScreen}>
              <Image src="/images/workbuddy-desktop-pet/lulu-giraffe.png" alt="鹿鹿精灵" width={240} height={240} priority />
              <span className={styles.listening}>READY</span>
            </div>
            <div className={styles.devicePort}>USB–C</div>
          </div>
          <div className={styles.productCaption}><strong>LULU–P0</strong><span>WORKING PROTOTYPE</span></div>
        </div>
      </section>

      <section className={styles.buyStrip}>
        <div><span>01 / 必买</span><strong>M5Stack CoreS3-SE</strong><small>SKU · K128-SE</small></div>
        <div><span>02 / 同时准备</span><strong>USB-C 数据线</strong><small>需支持数据传输</small></div>
        <div><span>03 / 暂缓</span><strong>外壳 · 电池 · 支架</strong><small>闭环完成后再定</small></div>
        <p>SE 版直接由 USB 供电。下单前核对触摸屏、双麦克风、扬声器与 USB-C。</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>SYSTEM ARCHITECTURE</p>
          <h2>一条清晰的信任边界</h2>
          <div className={styles.transport}>
            <button type="button" className={transport === 'usb' ? styles.active : ''} onClick={() => setTransport('usb')}>USB / V1</button>
            <button type="button" className={transport === 'wifi' ? styles.active : ''} onClick={() => setTransport('wifi')}>WI-FI / V2</button>
          </div>
        </div>

        <div className={styles.architecture}>
          <article className={styles.archNode}><span>01 · DEVICE</span><strong>Lulu P0</strong><p>{transport === 'usb' ? '触摸与音频经 USB 串口输入；屏幕和扬声器输出反馈。' : '通过局域网与桥接器通信；增加配网和设备认证。'}</p></article>
          <b className={styles.arrow}>→</b>
          <article className={`${styles.archNode} ${styles.archNodeDark}`}><span>02 · TRUST BOUNDARY</span><strong>Lulu Bridge</strong><p>保存授权状态、验证设备事件、调用 API。凭据留在电脑。</p></article>
          <b className={styles.arrow}>→</b>
          <article className={styles.archNode}><span>03 · AUTHORIZED</span><strong>WorkBuddy</strong><p>接收用户明确发起的请求，返回本次任务状态与回复。</p></article>
        </div>
        <p className={styles.archNote}>{transport === 'usb' ? 'V1 选择 USB：无需配网，调试变量少，审核演示链路清楚。' : 'V2 再引入 Wi-Fi：提升摆放自由度，同时补齐配网、认证与局域网安全。'}</p>
      </section>

      <section className={`${styles.section} ${styles.roadmapSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>DESIGN → EXECUTION</p>
          <h2>六步走到可提交原型</h2>
          <div className={styles.progressLabel}><span>{finished} / {allTasks.length}</span><strong>{progress}%</strong></div>
          <div className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></div>
        </div>

        <div className={styles.roadmap}>
          <nav className={styles.stageNav} aria-label="硬件化阶段">
            {stages.map((stage) => {
              const stageDone = stage.tasks.filter(([id]) => checked[id]).length
              return (
                <button key={stage.id} type="button" aria-current={activeStage === stage.id ? 'step' : undefined} className={activeStage === stage.id ? styles.currentStage : ''} onClick={() => setActiveStage(stage.id)}>
                  <span>{stage.number}</span><strong>{stage.label}</strong><small>{stageDone}/{stage.tasks.length}</small>
                </button>
              )
            })}
          </nav>

          <article className={styles.stagePanel}>
            <div className={styles.stageIntro}>
              <span>PHASE {selected.number}</span>
              <p>{selected.kicker}</p>
              <h3>{selected.title}</h3>
              <p>{selected.summary}</p>
            </div>
            <div className={styles.taskList}>
              {selected.tasks.map(([id, label], index) => (
                <label key={id} className={checked[id] ? styles.taskDone : ''}>
                  <input type="checkbox" checked={Boolean(checked[id])} onChange={() => toggleTask(id)} />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{label}</p>
                  <i>{checked[id] ? '✓' : '○'}</i>
                </label>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.protocolIntro}>
          <p className={styles.eyebrow}>USB CDC v1</p>
          <h2>硬件只传递事件与状态。</h2>
          <p>一行一条 JSON，包含 version、type、deviceId、eventId、timestamp 和 payload。OAuth Token 留在桥接器。</p>
        </div>
        <div className={styles.protocolTable}>
          {protocolRows.map(([direction, type, detail], index) => (
            <div key={type}><span>{String(index + 1).padStart(2, '0')}</span><b>{direction}</b><code>{type}</code><p>{detail}</p></div>
          ))}
        </div>
        <aside className={styles.evidenceCard}>
          <span>REVIEW PACKAGE</span>
          <strong>审核证据包</strong>
          <ul><li>实机亮屏正面照</li><li>USB 闭环演示视频</li><li>型号与量产计划</li><li>最小权限说明</li></ul>
        </aside>
      </section>

      <section className={styles.arrival}>
        <span className={styles.arrivalNumber}>NEXT<br />01</span>
        <div>
          <p className={styles.eyebrow}>WHEN IT ARRIVES</p>
          <h2>买到后，把设备交给我。</h2>
          <p>发来包装正反面、型号标签和亮机照片。我会核对硬件版本与 USB 信息，然后开始固件、串口协议和桥接器联调。</p>
          <button type="button" onClick={copyArrivalTemplate}>复制到货回复模板 <span>↗</span></button>
        </div>
      </section>
    </main>
  )
}
