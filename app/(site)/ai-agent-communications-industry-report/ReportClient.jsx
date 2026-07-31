'use client'

import { useMemo, useState } from 'react'

import styles from './report.module.css'
import {
  CASES,
  CHANNEL_SEGMENTS,
  COMMUNICATION_CATEGORIES,
  METRICS,
  RECOMMENDATIONS,
  SOURCES,
  sourceList,
} from './data'

const FILTERS = [
  ['all', '全部指标'],
  ['supply', '供给规模'],
  ['adoption', '安装与热度'],
  ['audience', '用户入口'],
  ['economy', 'Token 与市场'],
]

const GROUP_LABELS = {
  supply: '供给规模',
  adoption: '安装与热度',
  audience: '用户入口',
  economy: 'Token 与市场',
}

function InlineSources({ ids }) {
  return (
    <span className={styles.inlineSources}>
      {sourceList(ids).map((source, index) => (
        <span key={source.id}>
          {index ? ' · ' : ''}
          <a href={source.url} target="_blank" rel="noreferrer">{source.publisher}</a>
        </span>
      ))}
    </span>
  )
}

function MetricCard({ metric }) {
  return (
    <article className={`${styles.metricCard} ${styles[`tone_${metric.tone}`]}`}>
      <div className={styles.metricTopline}>
        <span>{GROUP_LABELS[metric.group]}</span>
        <span>{metric.signal}</span>
      </div>
      <p className={styles.metricValue}>{metric.value}</p>
      <h3>{metric.label}</h3>
      <p className={styles.metricDefinition}>{metric.definition}</p>
      <details className={styles.metricDetails}>
        <summary>查看统计口径与边界</summary>
        <div>
          <p><strong>如何得到：</strong>{metric.method}</p>
          <p><strong>不能代表：</strong>{metric.boundary}</p>
          <p><strong>来源：</strong><InlineSources ids={metric.sourceIds} /></p>
        </div>
      </details>
    </article>
  )
}

function CategoryBars() {
  const maxDownloads = Math.max(...COMMUNICATION_CATEGORIES.map((item) => item.downloads))

  return (
    <div className={styles.barList} aria-label="ClawHub 通信类 Skill 分类下载量">
      {COMMUNICATION_CATEGORIES.map((item) => (
        <div className={styles.barRow} key={item.name}>
          <div className={styles.barLabel}>
            <span>{item.name}</span>
            <span>{item.skills} 个</span>
          </div>
          <div className={styles.barTrack}>
            <span style={{ width: `${Math.max(3, item.downloads / maxDownloads * 100)}%` }} />
          </div>
          <div className={styles.barNumbers}>
            <span>{(item.downloads / 10000).toFixed(1)} 万下载</span>
            <span>{(item.installs / 10000).toFixed(2)} 万安装</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ReportClient() {
  const [filter, setFilter] = useState('all')
  const filteredMetrics = useMemo(
    () => filter === 'all' ? METRICS : METRICS.filter((metric) => metric.group === filter),
    [filter],
  )

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.breadcrumb}>互动专题 / 前沿行业研究 / 2026-07-21</div>
            <p className={styles.eyebrow}>AI Agent Communications Industry Report</p>
            <h1>AI 智能体通信能力行业报告</h1>
            <p className={styles.lede}>
              Channel 抢占用户入口，Skill 封装可执行动作，Token 成为推理与编排的计量单位。
              当“发消息、发短信、打电话、处理回复”进入 Agent 闭环，通信行业开始从连接供给转向智能执行。
            </p>
          </div>
          <aside className={styles.heroAside}>
            <div className={styles.heroStat}>
              <span>29</span>
              <p>OpenClaw Channel</p>
            </div>
            <div className={styles.heroStat}>
              <span>666</span>
              <p>本站识别通信 Skill</p>
            </div>
            <div className={styles.heroStat}>
              <span>128.7万</span>
              <p>通信 Skill 累计下载</p>
            </div>
            <p className={styles.heroNote}>所有顶部数字均可在下文展开查看定义、时间和来源。</p>
          </aside>
        </div>
      </section>

      <nav className={styles.toc} aria-label="报告目录">
        <a href="#summary">结论</a>
        <a href="#metrics">数据</a>
        <a href="#stack">产业栈</a>
        <a href="#supply">Skill / Channel</a>
        <a href="#cases">产品案例</a>
        <a href="#economy">商业化</a>
        <a href="#sources">来源</a>
      </nav>

      <section className={styles.section} id="summary">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Executive Summary</p>
          <h2>结论不是“通信会被 AI 替代”，而是通信能力会被重新封装</h2>
        </div>
        <div className={styles.summaryGrid}>
          <article>
            <span>01</span>
            <h3>入口从 App 变成 Channel</h3>
            <p>用户仍在微信、Slack、短信和电话里表达意图，但 Agent Gateway 开始统一身份、会话、路由与回复。</p>
          </article>
          <article>
            <span>02</span>
            <h3>能力从 API 变成 Skill</h3>
            <p>“发一条消息”只是动作；预约、催收、客服升级、销售跟进等完整流程才是可复用、可定价的 Skill。</p>
          </article>
          <article>
            <span>03</span>
            <h3>计量从消息数延伸到 Token</h3>
            <p>规划、检索、工具调用、重试和回复理解都会消耗 Token；它是新增成本层，但不是唯一价值指标。</p>
          </article>
          <article>
            <span>04</span>
            <h3>市场尚无统一“调用量”</h3>
            <p>公开市场主要披露下载与安装，Skill 常在本地运行。把 1.3 亿安装写成 1.3 亿调用，会造成量级与商业价值误判。</p>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.softSection}`} id="metrics">
        <div className={styles.sectionHeadingRow}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Metric Atlas</p>
            <h2>先按口径看数，再谈市场大小</h2>
            <p>筛选供给、安装、用户和 Token 数据；每张卡片均标明它是什么，以及它不是什么。</p>
          </div>
          <div className={styles.filters} role="group" aria-label="筛选指标">
            {FILTERS.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.metricGrid}>
          {filteredMetrics.map((metric) => <MetricCard metric={metric} key={metric.id} />)}
        </div>
      </section>

      <section className={styles.section} id="stack">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Industry Stack</p>
          <h2>Channel × Skill × Token：三个概念对应三层价值</h2>
          <p>Channel 解决“在哪沟通”，Skill 解决“完成什么”，Token 记录“智能执行消耗多少”。三者不可互相替代。</p>
        </div>
        <div className={styles.stackFlow}>
          <article>
            <span>01 · DISTRIBUTION</span>
            <h3>Channel</h3>
            <p>微信、Telegram、Slack、SMS、Voice Call</p>
            <b>身份 · 会话 · 路由 · 送达</b>
          </article>
          <i>→</i>
          <article>
            <span>02 · EXECUTION</span>
            <h3>Skill</h3>
            <p>预约、通知、跟进、分流、升级、回写</p>
            <b>流程 · 规则 · 工具 · 审批</b>
          </article>
          <i>→</i>
          <article>
            <span>03 · COMPUTE</span>
            <h3>Token</h3>
            <p>理解、规划、检索、生成、复盘、重试</p>
            <b>推理 · 上下文 · 成本 · 调度</b>
          </article>
          <i>→</i>
          <article>
            <span>04 · BUSINESS</span>
            <h3>Outcome</h3>
            <p>送达、回复、成交、解决、留存</p>
            <b>任务成功率 · 单位结果成本</b>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="supply">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Supply Map</p>
          <h2>OpenClaw 有 29 个 Channel；通信 Skill 的“数量”取决于分类边界</h2>
          <p>Channel 是官方清单，可以直接计数；Skill 没有统一通信标签，因此必须同时给出规则、快照时间和排除项。</p>
        </div>
        <div className={styles.supplyGrid}>
          <article className={styles.channelPanel}>
            <div className={styles.panelTitle}>
              <div>
                <p>OpenClaw Channel 构成</p>
                <strong>29</strong>
              </div>
              <a href={SOURCES.openclawChannels.url} target="_blank" rel="noreferrer">官方目录 ↗</a>
            </div>
            <div className={styles.segmentBar} aria-label="OpenClaw Channel 构成">
              {CHANNEL_SEGMENTS.map((item) => <span key={item.label} style={{ flex: item.value }} title={`${item.label}：${item.value}`} />)}
            </div>
            <div className={styles.segmentLegend}>
              {CHANNEL_SEGMENTS.map((item, index) => (
                <div key={item.label}>
                  <i data-index={index} />
                  <p><strong>{item.value}</strong> {item.label}</p>
                  <span>{item.examples}</span>
                </div>
              ))}
            </div>
            <p className={styles.evidenceNote}>第一方合计 26 个（core、bundled 与 official plugin）；外部插件 3 个。这里的“官方”指由 OpenClaw 官方仓库/包维护，不代表对应通信平台官方背书。</p>
          </article>
          <article className={styles.skillPanel}>
            <div className={styles.panelTitle}>
              <div>
                <p>ClawHub 通信 Skill 快照</p>
                <strong>666</strong>
              </div>
              <a href={SOURCES.clawhubApi.url} target="_blank" rel="noreferrer">公共 API ↗</a>
            </div>
            <CategoryBars />
            <p className={styles.evidenceNote}>本站严格口径按唯一 slug 统计；邮件占 379 个。若聚焦用户所说的 IM、消息、短信与电话，排除邮件后为 287 个、累计下载约 65.0 万次。</p>
          </article>
        </div>
        <div className={styles.callout}>
          <span>最重要的数据纠偏</span>
          <h3>目前不能严谨地说“Skill 调用市场达到 ×× 次”</h3>
          <p>ClawHub 能观测目录下载和部分登录用户安装，但 Skill 通常在本地或企业环境运行，市场方看不到每一次实际执行。建议统一写法：</p>
          <blockquote>“截至 2026 年 7 月，第三方目录追踪 6.05 万个 Agent Skill；整个工具生态累计安装约 1.3 亿次。真实运行调用量尚无统一公开统计。”</blockquote>
        </div>
      </section>

      <section className={styles.section} id="cases">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Product Signals</p>
          <h2>四类产品正在从不同方向占领通信执行入口</h2>
          <p>开源框架、办公 Agent、超级 App 与大众 AI 助手的路径不同，但都在把“聊天”向“执行”推进。</p>
        </div>
        <div className={styles.caseGrid}>
          {CASES.map((item) => (
            <article key={item.id}>
              <span>{item.kicker}</span>
              <h3>{item.name}</h3>
              <h4>{item.headline}</h4>
              <p>{item.summary}</p>
              <ul>{item.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
              <div className={styles.caseSources}><InlineSources ids={item.sourceIds} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.economySection}`} id="economy">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Token Economy</p>
          <h2>通信 Channel 会成为 Token 消耗入口，但收入不会只按 Token 结算</h2>
          <p>每一次多轮沟通会叠加理解、历史上下文、工具调用与重试。Token 是底层成本，业务结果才是上层价值。</p>
        </div>
        <div className={styles.economyGrid}>
          <div className={styles.tokenScale}>
            <div>
              <span>中国总体</span>
              <strong>&gt;140 万亿</strong>
              <p>日均 Token 调用，截至 2026 年 3 月；两年内超千倍增长。</p>
              <InlineSources ids={['tokenChina']} />
            </div>
            <div>
              <span>研究样本</span>
              <strong>≈1,000×</strong>
              <p>Agentic Coding 相对 code chat / reasoning 的 Token 量级；不可外推为通信平均值。</p>
              <InlineSources ids={['agentTokenPaper']} />
            </div>
          </div>
          <div className={styles.revenueLayers}>
            <h3>未来可能并存的五种计费</h3>
            {[
              ['01', 'Token / 模型推理', '理解、规划、生成与上下文缓存'],
              ['02', 'Skill / API 调用', '业务能力、数据与工具执行'],
              ['03', '通信资源', '短信条数、号码、通话分钟、录音'],
              ['04', '企业订阅', '席位、权限、审计、SLA 与私有化'],
              ['05', '结果付费', '有效会话、预约完成、线索或交易转化'],
            ].map(([id, name, desc]) => (
              <div key={id}><span>{id}</span><strong>{name}</strong><p>{desc}</p></div>
            ))}
          </div>
        </div>
        <div className={styles.marketBoundary}>
          <strong>市场规模边界：</strong>
          目前没有可信、统一的“Skill 市场收入”或“通信 Skill 调用市场”统计。可作为相邻市场参照的是中国企业 Agentic AI：Grand View Research 估计 2024 年为 1.932 亿美元，2030 年预测 19.382 亿美元、2025—2030 CAGR 47.5%；该数字不能改写成 Skill 市场规模。
          <InlineSources ids={['agentMarket']} />
        </div>
      </section>

      <section className={styles.section} id="recommendations">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Action Framework</p>
          <h2>从“接入更多渠道”走向“交付可审计结果”</h2>
        </div>
        <div className={styles.recommendations}>
          {RECOMMENDATIONS.map(([title, desc], index) => (
            <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{desc}</p></div></article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.sourceSection}`} id="sources">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Source Ledger</p>
          <h2>数据来源与证据等级</h2>
          <p>优先使用官方文档、公司披露与平台 API；学术论文和第三方监测用于补充分类、用户与市场口径。</p>
        </div>
        <div className={styles.sourceTable} role="table" aria-label="报告数据来源">
          <div className={styles.sourceHead} role="row">
            <span role="columnheader">来源</span><span role="columnheader">统计时间</span><span role="columnheader">等级</span>
          </div>
          {Object.entries(SOURCES).map(([id, source]) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={id} role="row">
              <span role="cell"><strong>{source.name}</strong><small>{source.publisher}</small></span>
              <span role="cell">{source.date}</span>
              <span role="cell">{source.tier} ↗</span>
            </a>
          ))}
        </div>
        <div className={styles.methodology}>
          <h3>本站测算方法与限制</h3>
          <p><strong>通信 Skill：</strong>2026-07-21 全量分页读取 ClawHub 公共目录，按唯一 slug 去重后，通过平台词与动作词联合规则分类；必须具备“发送、接收、回复、呼叫、收件箱、通知”等通信执行语义。排除文档发布、内容写作、账号验证和纯模板。</p>
          <p><strong>下载 / 安装：</strong>下载为目录累计 download 计数；安装依赖 ClawHub 的登录 CLI best-effort 遥测。二者均不是运行调用。跨 Skill 汇总会重复计算安装多个 Skill 的同一用户。</p>
          <p><strong>置信判断：</strong>29 个 Channel、npm 下载、腾讯 MAU 属可直接复核数据；666 个通信 Skill 属规则分类测算；约 50 万运行系统与市场预测需带来源使用；真实 Skill 调用量属于公开数据缺口。</p>
        </div>
      </section>
    </main>
  )
}
