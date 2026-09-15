import Link from 'next/link'
import {
  IconBellRinging,
  IconBriefcase2,
  IconBuildingBank,
  IconChevronRight,
  IconDeviceMobileMessage,
  IconMapPin,
  IconMessageCircle,
  IconMicrophone,
  IconPhoto,
  IconPlayerPlay,
  IconRobot,
  IconSend2,
  IconSettingsAutomation,
} from '@tabler/icons-react'

import styles from './new-message-phone.module.css'
import HardwarePlatform from './HardwarePlatform'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/products/new-message-phone'
const title = '新消息手机｜硬件平台原生消息应用'
const description = '新消息手机是面向通信硬件平台的原生消息应用，依托终端原生短信界面处理语音、图片、视频、位置等富媒体消息，并集成 Chatbot 智能服务模块。'

export const metadata = {
  title,
  description,
  keywords: ['新消息手机', '硬件平台应用', '富媒体消息', 'Chatbot', '智能体交互', '消息即服务'],
  alternates: { canonical: '/products/new-message-phone' },
  openGraph: { title, description, url: PAGE_URL, type: 'website' },
  twitter: { card: 'summary', title, description },
}

const capabilities = [
  { icon: IconMicrophone, label: '语音', copy: '在原生消息会话内接收与处理语音内容。' },
  { icon: IconPhoto, label: '图片', copy: '用图片呈现通知、凭证与业务信息。' },
  { icon: IconPlayerPlay, label: '视频', copy: '承载更完整的产品演示与服务说明。' },
  { icon: IconMapPin, label: '位置', copy: '在会话中完成地点分享与位置服务。' },
]

const scenarios = [
  {
    number: '01',
    icon: IconBuildingBank,
    title: '政务通知',
    copy: '将政策提醒、办事通知和进度查询送达手机原生入口，居民可在同一会话继续查询。',
    action: '通知送达 · 进度查询',
  },
  {
    number: '02',
    icon: IconBriefcase2,
    title: '企业服务',
    copy: '把客户服务、业务查询和流程指令汇入消息窗口，减少在多个应用之间切换。',
    action: '业务查询 · 指令下发',
  },
  {
    number: '03',
    icon: IconMessageCircle,
    title: '营销触达',
    copy: '通过图文、视频与交互式消息呈现产品信息，让用户从触达到咨询都在会话内完成。',
    action: '富媒体展示 · 即时咨询',
  },
  {
    number: '04',
    icon: IconBellRinging,
    title: '设备告警',
    copy: '将设备状态和异常告警发送到指定终端，并在会话中完成确认、处置和结果反馈。',
    action: '告警确认 · 闭环处理',
  },
]

const productFacts = [
  ['产品型号', 'NMP X1'],
  ['产品形态', '新消息智能通信终端'],
  ['通信能力', '5G / 4G / Wi-Fi 6 / Bluetooth 5.3'],
  ['消息引擎', '富媒体消息 · Chatbot · 智能体任务'],
  ['媒体能力', '文字 · 语音 · 图片 · 视频 · 位置'],
  ['安全能力', '可信设备认证 · 会话加密 · 权限隔离'],
  ['开放接口', '消息 API · Agent API · 设备控制 API'],
]

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: '新消息手机',
  category: '硬件平台应用',
  url: PAGE_URL,
  description,
  additionalProperty: productFacts.slice(2).map(([name, value]) => ({
    '@type': 'PropertyValue',
    name,
    value,
  })),
}

export default function NewMessagePhonePage() {
  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className={styles.ambientField} aria-hidden="true"><i /><i /><i /></div>

      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="面包屑导航">
          <Link href="/works">产品集</Link>
          <IconChevronRight size={14} aria-hidden="true" />
          <span>新消息手机</span>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> 通信硬件 · 消息即服务</p>
            <h1>新消息手机</h1>
            <p className={styles.headline}>让每一条消息，<br />直接成为一项服务。</p>
            <p className={styles.lead}>
              面向新消息手机硬件平台的原生消息应用。依托手机终端原生短信界面处理语音、图片、视频、位置等富媒体消息，
              集成 Chatbot 智能服务模块，在消息会话内完成智能体交互、任务控制与调度。
            </p>
            <div className={styles.actions}>
              <a href="#platform">查看硬件平台能力</a>
              <a href="#scenarios">了解应用场景 <IconChevronRight size={17} /></a>
              <Link href="/articles/research/topics/workbuddy-5g-sms-acp-current-session">
                查看 5G 消息 ACP 实践 <IconChevronRight size={17} />
              </Link>
            </div>
            <p className={styles.platformNote}>应用由新消息手机硬件平台承载，依托终端原生消息入口提供服务。</p>
            <dl className={styles.quickFacts}>
              <div><dt>01</dt><dd>原生入口<small>无需安装 APP</small></dd></div>
              <div><dt>02</dt><dd>富媒体消息<small>语音 · 图片 · 视频 · 位置</small></dd></div>
              <div><dt>03</dt><dd>智能体服务<small>交互 · 控制 · 调度</small></dd></div>
            </dl>
          </div>

          <div className={styles.messageStage} aria-label="新消息手机会话能力示意">
            <div className={styles.stageGlow} aria-hidden="true" />
            <div className={styles.stageOrbit} aria-hidden="true"><i /><i /><i /></div>
            <span className={`${styles.signalPill} ${styles.signalPillTop}`}>RICH MEDIA · ONLINE</span>
            <span className={`${styles.signalPill} ${styles.signalPillBottom}`}>AI AGENT · READY</span>
            <div className={styles.messagePanel}>
              <header>
                <span className={styles.botMark}><IconRobot size={23} /></span>
                <div><strong>城市服务助手</strong><small><i /> 智能服务在线</small></div>
                <span className={styles.nativeTag}>原生消息</span>
              </header>
              <div className={styles.conversation}>
                <p className={styles.time}>今天 09:30</p>
                <div className={styles.noticeCard}>
                  <span>服务通知</span>
                  <strong>您的业务已进入办理环节</strong>
                  <p>预计今日 17:00 前完成。可直接回复“查询进度”了解详情。</p>
                  <button type="button">查询办理进度 <IconChevronRight size={15} /></button>
                </div>
                <div className={styles.userBubble}>查询进度</div>
                <div className={styles.botBubble}>
                  当前进度：材料审核完成，正在进行结果确认。
                  <span><IconSettingsAutomation size={15} /> 任务已自动调度</span>
                </div>
              </div>
              <footer>
                <div className={styles.mediaTools} aria-label="富媒体能力">
                  <IconMicrophone size={18} /><IconPhoto size={18} /><IconMapPin size={18} />
                </div>
                <span>发送消息或下达指令</span>
                <IconSend2 size={18} />
              </footer>
            </div>
            <div className={styles.floatingNote}><IconDeviceMobileMessage size={19} /><span>消息即服务<small>无需跳转其他应用</small></span></div>
          </div>
        </section>

        <HardwarePlatform />

        <section className={styles.capabilitySection} id="capabilities">
          <div className={styles.sectionIntro}>
            <p>RICH MEDIA MESSAGING</p>
            <h2>原生短信界面，承载更丰富的消息</h2>
            <span>沿用用户熟悉的手机消息入口，将信息展示、即时交互和服务办理放进同一个会话。</span>
          </div>
          <div className={styles.capabilityGrid}>
            {capabilities.map(({ icon: Icon, label, copy }) => (
              <article key={label}>
                <Icon size={25} stroke={1.7} />
                <h3>{label}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.agentSection}>
          <div className={styles.agentCopy}>
            <p>CHATBOT SERVICE</p>
            <h2>消息窗口里的智能体服务</h2>
            <span>
              Chatbot 智能服务模块理解用户意图，连接业务系统，将咨询、查询、指令和任务调度串成可持续的服务流程。
            </span>
          </div>
          <div className={styles.workflow} aria-label="智能体服务流程">
            {[
              ['01', '消息触达', '通知与服务进入原生会话'],
              ['02', '智能交互', '识别意图并返回所需信息'],
              ['03', '任务执行', '下发指令并调度业务任务'],
              ['04', '结果闭环', '状态、结果与后续动作回到会话'],
            ].map(([step, name, copy], index) => (
              <div key={step}>
                <span>{step}</span><strong>{name}</strong><small>{copy}</small>
                {index < 3 && <IconChevronRight size={18} aria-hidden="true" />}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.scenarioSection} id="scenarios">
          <div className={styles.sectionIntro}>
            <p>APPLICATION SCENARIOS</p>
            <h2>覆盖通知、服务、触达与告警</h2>
            <span>面向需要高触达、低使用门槛和连续任务处理的业务场景。</span>
          </div>
          <div className={styles.scenarioGrid}>
            {scenarios.map(({ number, icon: Icon, title: itemTitle, copy, action }) => (
              <article key={number}>
                <div><span>{number}</span><Icon size={25} stroke={1.6} /></div>
                <h3>{itemTitle}</h3>
                <p>{copy}</p>
                <small>{action}</small>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.detailsSection}>
          <div className={styles.detailsHeading}>
            <p>DEVICE SPECIFICATIONS</p>
            <h2>样机配置</h2>
            <span>NMP X1 新消息智能通信终端的核心能力配置。</span>
          </div>
          <dl className={styles.factList}>
            {productFacts.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>

      </div>
    </main>
  )
}
