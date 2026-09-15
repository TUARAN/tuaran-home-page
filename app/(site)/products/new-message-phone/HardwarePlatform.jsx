import styles from './new-message-phone.module.css'

const platformCapabilities = [
  {
    number: '01',
    title: '原生消息入口',
    label: '终端系统级能力',
    detail: '应用依托新消息手机的原生消息界面运行，用户从熟悉的会话入口直接使用服务。',
  },
  {
    number: '02',
    title: '富媒体通信',
    label: '多种消息形态',
    detail: '在硬件平台内统一处理文字、语音、图片、视频与位置等富媒体消息。',
  },
  {
    number: '03',
    title: '智能体服务',
    label: 'Chatbot 原生集成',
    detail: '智能服务模块在消息会话中理解意图、连接业务，并持续反馈处理状态。',
  },
  {
    number: '04',
    title: '任务协同',
    label: '控制与调度闭环',
    detail: '通过硬件平台完成业务查询、指令下发、任务调度和结果回传。',
  },
]

export default function HardwarePlatform() {
  return (
    <section className={styles.platformSection} id="platform">
      <div className={styles.platformBackdrop} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.platformHeading}>
        <div>
          <p>HARDWARE PLATFORM APPLICATION</p>
          <h2>面向新消息手机硬件平台的原生应用</h2>
        </div>
        <span className={styles.platformSummary}><i />应用能力由硬件终端原生承载，随终端配置与业务系统接入提供服务。</span>
      </div>

      <div className={styles.platformGrid}>
        {platformCapabilities.map((item, index) => (
          <article key={item.number} style={{ '--card-index': index }}>
            <div className={styles.platformTop}><b>{item.number}</b><i aria-hidden="true" /></div>
            <h3>{item.title}</h3>
            <strong>{item.label}</strong>
            <p>{item.detail}</p>
            <span className={styles.platformTag}><i />硬件平台原生能力</span>
          </article>
        ))}
      </div>

      <div className={styles.platformFlow} aria-label="硬件平台应用服务链路">
        {['新消息手机', '原生消息', 'Chatbot', '业务闭环'].map((item, index) => (
          <div key={item}><span>{item}</span>{index < 3 && <b aria-hidden="true">→</b>}</div>
        ))}
      </div>
    </section>
  )
}
