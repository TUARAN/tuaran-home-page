import Image from 'next/image'
import Link from 'next/link'

import styles from './workbuddy-acp-bridge.module.css'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/tools/workbuddy-acp-bridge'
const PREVIEW_URL = 'https://2aran.com/images/tools/workbuddy-acp-bridge/desktop-sms-bridge.png'

export const metadata = {
  title: 'ACP 短信桥接测试终端',
  description: '在本地桌面短信窗口中发送消息，经本机桥接服务和 ACP 接入用户授权的 WorkBuddy 会话。',
  keywords: ['WorkBuddy', 'ACP', '硬件接入', '本地桥接', '桌面应用', '短信模拟器'],
  alternates: { canonical: '/tools/workbuddy-acp-bridge' },
  openGraph: {
    title: 'ACP 短信桥接测试终端',
    description: '短信式桌面模拟终端：本地输入，经 ACP 安全桥接至 WorkBuddy 会话。',
    url: PAGE_URL,
    type: 'website',
    images: [{ url: PREVIEW_URL, width: 2360, height: 1640, alt: 'ACP 短信桥接测试终端桌面界面' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ACP 短信桥接测试终端',
    description: '短信式桌面模拟终端：本地输入，经 ACP 安全桥接至 WorkBuddy 会话。',
    images: [PREVIEW_URL],
  },
}

const flow = [
  {
    step: '01',
    title: '短信式输入',
    copy: '用户在桌面窗口中输入文本，模拟未来按键、串口或设备 SDK 产生的硬件消息。',
  },
  {
    step: '02',
    title: '本机安全桥接',
    copy: '桥接服务只监听电脑回环地址，完成设备事件校验、会话选择与 ACP 双向通信。',
  },
  {
    step: '03',
    title: '进入授权会话',
    copy: '消息进入用户主动选择的 WorkBuddy 会话，流式结果再返回桌面窗口。',
  },
]

const permissions = [
  {
    scope: 'user.task.readable',
    title: '读取会话',
    copy: '列出用户已授权的任务，供用户在本地选择需要接入的会话。',
  },
  {
    scope: 'user.task.invokable',
    title: '调用会话',
    copy: '创建测试会话、获取 ACP 接入信息，并向当前会话发送用户输入。',
  },
]

const facts = [
  ['产品形态', 'macOS 桌面测试应用'],
  ['当前阶段', '企业内部开发联调'],
  ['通信方式', 'OAuth 2.0 + ACP SSE / JSON-RPC'],
  ['本地服务', '127.0.0.1:8799'],
  ['硬件状态', '短信界面模拟，预留设备事件入口'],
  ['凭据策略', '仅保存在用户本机'],
]

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ACP 短信桥接测试终端',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS',
  url: PAGE_URL,
  description: '用于企业内部硬件接入联调的短信式桌面模拟终端。',
  author: { '@type': 'Person', name: 'TUARAN', url: 'https://2aran.com' },
}

export default function WorkBuddyAcpBridgePage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="面包屑导航">
          <Link href="/tools">工具库</Link>
          <span>/</span>
          <span>硬件接入实验</span>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.statusRow}>
              <span className={styles.status}><i /> 企业内部联调</span>
              <span className={styles.platform}>macOS · Apple Silicon</span>
            </div>
            <p className={styles.eyebrow}>WORKBUDDY ACP · LOCAL BRIDGE</p>
            <h1>ACP 短信桥接<br />测试终端</h1>
            <p className={styles.lead}>
              在电脑本地模拟短信设备的消息入口。用户选择或创建 WorkBuddy 会话后，
              文本经本机桥接服务和 ACP 送入目标会话，结果实时回到桌面窗口。
            </p>
            <div className={styles.actions}>
              <a href="#workflow" className={styles.primaryAction}>查看接入流程</a>
              <a href="#security" className={styles.secondaryAction}>了解安全边界</a>
            </div>
            <ul className={styles.chips} aria-label="产品特性">
              <li>短信式交互</li>
              <li>本地优先</li>
              <li>ACP 双向流</li>
              <li>OAuth 授权</li>
            </ul>
          </div>

          <aside className={styles.signalCard} aria-label="消息路由概览">
            <p>ACTIVE ROUTE</p>
            <div><span>SMS</span><strong>短信模拟器</strong><small>本地输入</small></div>
            <i />
            <div><span>ACP</span><strong>本地桥接</strong><small>安全转发</small></div>
            <i />
            <div><span>W</span><strong>WorkBuddy</strong><small>云端会话</small></div>
          </aside>
        </section>

        <figure className={styles.productShot}>
          <div className={styles.shotBar}>
            <span><i /><i /><i /></span>
            <strong>真实桌面应用界面</strong>
            <em>Mock 联调模式</em>
          </div>
          <Image
            src="/images/tools/workbuddy-acp-bridge/desktop-sms-bridge.png"
            width={2360}
            height={1640}
            priority
            alt="ACP 短信桥接测试终端，左侧为短信模拟器，中间为消息窗口，右侧为 WorkBuddy 会话路由"
          />
          <figcaption>当前截图为 Mock 联调模式；切换真实模式后，由用户完成 WorkBuddy OAuth 授权。</figcaption>
        </figure>

        <section className={styles.section} id="workflow">
          <div className={styles.sectionHeading}>
            <p>MESSAGE FLOW</p>
            <h2>一条消息如何进入 WorkBuddy</h2>
            <span>保留真实硬件接入所需的事件边界，先用桌面短信窗口验证完整链路。</span>
          </div>
          <div className={styles.flowGrid}>
            {flow.map((item) => (
              <article key={item.step}>
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.permissionSection}>
          <div className={styles.sectionHeading}>
            <p>MINIMUM ACCESS</p>
            <h2>只申请完成联调所需的权限</h2>
          </div>
          <div className={styles.permissionList}>
            {permissions.map((item) => (
              <article key={item.scope}>
                <code>{item.scope}</code>
                <div><h3>{item.title}</h3><p>{item.copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.detailsGrid} id="security">
          <div className={styles.securityCard}>
            <p className={styles.cardEyebrow}>LOCAL-FIRST SECURITY</p>
            <h2>密钥留在用户电脑</h2>
            <p>
              Client Secret 使用系统安全存储加密；OAuth Token 写入权限受限的本地文件；
              ACP Token 仅保存在桥接进程内存。模拟硬件只接触独立的设备事件入口。
            </p>
            <ul>
              <li>服务默认仅监听 127.0.0.1</li>
              <li>设备事件使用独立 Bridge Key 校验</li>
              <li>ACP 权限请求需用户在本地确认</li>
              <li>不自动操作 WorkBuddy 桌面客户端</li>
            </ul>
          </div>

          <div className={styles.factCard}>
            <p className={styles.cardEyebrow}>PRODUCT FACTS</p>
            <h2>产品信息</h2>
            <dl>
              {facts.map(([term, value]) => (
                <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.boundary}>
          <div>
            <p>TESTING STATUS</p>
            <h2>当前用于协议验证和企业内部测试</h2>
          </div>
          <p>
            已完成本地桥接、会话选择、消息去重、SSE 分块解析、OAuth Token 刷新和桌面安装包验证。
            实体硬件直连将在设备配对、请求签名、时间戳与 TLS 方案完成后开放。
          </p>
        </section>
      </div>
    </main>
  )
}
