import XPage from '../../../../(x)/x-workbench/XPage'
import {
  GROKBOT_PLAYBOOK_VERSION,
  grokbotBatchPhases,
  grokbotGrayRules,
  grokbotLayers,
  grokbotPromptSnippets,
  grokbotQualityChecks,
  grokbotRetainRules,
  grokbotUnfollowRules,
} from '../../../../../lib/interaction/grokbotPlaybook.js'
import styles from './grokbot.module.css'

export const dynamic = 'force-static'

const path = '/grokbot'
const canonicalUrl = 'https://x.2aran.com/grokbot'
const title = 'Grokbot 秘籍'
const intro = '用 @grokbot 治理 X 关注列表：五层策略、取关/保留规则编号、批次门禁与质检表。先出名单，站长确认后再执行。'
const description = 'Grokbot 关注列表治理 playbook：层级、UF/RT/GZ 规则矩阵、批次流程、质量管理与大段提示语模板。'
const jsonLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonicalUrl, inLanguage: 'zh-CN' }

const endorsements = [
  {
    who: 'CZ（@cz_binance）原帖',
    text: 'Used Grok Bot to clean up inactive and abusive accounts I follow. Ask it to keep constructive criticism. Not sure how well it worked. "AI did it." 🤷‍♂️ 🤣',
    href: 'https://x.com/cz_binance/status/2124698685116383430',
  },
  {
    who: '马斯克（@elonmusk）在该帖下回复',
    text: 'Cool',
    href: 'https://x.com/elonmusk/status/2124733560947138910',
  },
  {
    who: 'CZ 随后回复马斯克',
    text: 'Worked well so far.',
    href: 'https://x.com/cz_binance/status/2124744559343317455',
  },
]

export const metadata = {
  title: { absolute: `${title}｜X大互动` },
  description,
  alternates: { canonical: path },
  openGraph: { type: 'website', title, description, url: canonicalUrl, locale: 'zh_CN' },
}

function PlaybookTable({ caption, columns, rows, getKey }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.matrix}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function GrokbotPage() {
  return (
    <XPage
      active="/grokbot"
      title={title}
      intro={intro}
      meta={<span>Playbook 版本 {GROKBOT_PLAYBOOK_VERSION} · 规则冲突时保留类（RT）优先 · 与大互动日历互动口径可对齐</span>}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <section className={styles.section} aria-labelledby="grokbot-layers">
        <h2 id="grokbot-layers">策略层级（L0–L4）</h2>
        <p className={styles.lead}>
          自上而下：先划红线，再写目标与规则族，批次执行，最后质检闭环。Grokbot 适合 L2 以下的结构化输出；L3、L4 必须有人工门禁。
        </p>
        <PlaybookTable
          caption="五层策略与交付物"
          columns={[
            { key: 'level', label: '层级', render: (r) => <code>{r.level}</code> },
            { key: 'name', label: '名称', render: (r) => r.name },
            { key: 'scope', label: '范围', render: (r) => r.scope },
            { key: 'deliverable', label: '交付物', render: (r) => r.deliverable },
            { key: 'gate', label: '门禁', render: (r) => r.gate },
          ]}
          rows={grokbotLayers}
          getKey={(r) => r.level}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-unfollow">
        <h2 id="grokbot-unfollow">取关规则（UF）</h2>
        <p className={styles.lead}>硬取关优先处理；软取关排在批末。任一保留规则命中则不得进入执行名单。</p>
        <PlaybookTable
          caption="取关规则矩阵"
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'tier', label: '强度', render: (r) => r.tier },
            { key: 'signal', label: '信号', render: (r) => r.signal },
            { key: 'threshold', label: '阈值', render: (r) => r.threshold },
            { key: 'action', label: '动作', render: (r) => r.action },
            { key: 'evidence', label: '证据', render: (r) => r.evidence },
            { key: 'exception', label: '例外', render: (r) => r.exception },
          ]}
          rows={grokbotUnfollowRules}
          getKey={(r) => r.id}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-retain">
        <h2 id="grokbot-retain">保留规则（RT）</h2>
        <p className={styles.lead}>CZ 公开做法的核心：建设性批评要留。运营号建议把日历互动前十写入 RT-02。</p>
        <PlaybookTable
          caption="保留规则矩阵"
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'tier', label: '强度', render: (r) => r.tier },
            { key: 'signal', label: '信号', render: (r) => r.signal },
            { key: 'threshold', label: '阈值', render: (r) => r.threshold },
            { key: 'action', label: '动作', render: (r) => r.action },
            { key: 'evidence', label: '证据', render: (r) => r.evidence },
            { key: 'exception', label: '例外', render: (r) => r.exception },
          ]}
          rows={grokbotRetainRules}
          getKey={(r) => r.id}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-gray">
        <h2 id="grokbot-gray">灰区规则（GZ）</h2>
        <PlaybookTable
          caption="灰区与人工裁定"
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'cue', label: '场景', render: (r) => r.cue },
            { key: 'condition', label: '条件', render: (r) => r.condition },
            { key: 'resolution', label: '处理', render: (r) => r.resolution },
            { key: 'owner', label: '负责人', render: (r) => r.owner },
          ]}
          rows={grokbotGrayRules}
          getKey={(r) => r.id}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-batch">
        <h2 id="grokbot-batch">批次流程（P1–P6）</h2>
        <PlaybookTable
          caption="执行阶段与人机分工"
          columns={[
            { key: 'phase', label: '阶段', render: (r) => <code>{r.phase}</code> },
            { key: 'step', label: '步骤', render: (r) => r.step },
            { key: 'grokbot', label: 'Grokbot', render: (r) => r.grokbot },
            { key: 'human', label: '人工', render: (r) => r.human },
            { key: 'output', label: '产出', render: (r) => r.output },
          ]}
          rows={grokbotBatchPhases}
          getKey={(r) => r.phase}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-qc">
        <h2 id="grokbot-qc">质量管理（QC）</h2>
        <p className={styles.lead}>未过 QC-01、QC-03 不扩大批次。执行痕迹写入大互动日历，便于与圆桌、互动前十交叉核对。</p>
        <PlaybookTable
          caption="质检项与通过标准"
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'item', label: '项', render: (r) => r.item },
            { key: 'metric', label: '度量', render: (r) => r.metric },
            { key: 'pass', label: '通过', render: (r) => r.pass },
            { key: 'fail', label: '未过', render: (r) => r.fail },
            { key: 'record', label: '留痕', render: (r) => r.record },
          ]}
          rows={grokbotQualityChecks}
          getKey={(r) => r.id}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-prompts">
        <h2 id="grokbot-prompts">提示语模板</h2>
        <p className={styles.lead}>复制到与 @grokbot 的对话；把 N、白名单、日期换成当次实参。</p>
        <PlaybookTable
          caption="常用开场与收尾句"
          columns={[
            { key: 'scene', label: '场景', render: (r) => r.scene },
            { key: 'text', label: '示例', render: (r) => <span className={styles.prompt}>{r.text}</span> },
          ]}
          rows={grokbotPromptSnippets}
          getKey={(r) => r.scene}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-endorsements">
        <h2 id="grokbot-endorsements">公开背书</h2>
        <ul className={styles.quotes}>
          {endorsements.map((item) => (
            <li key={item.href} className={styles.quote}>
              <blockquote cite={item.href}>{item.text}</blockquote>
              <p className={styles.quoteMeta}>
                {item.who} · <a href={item.href} target="_blank" rel="noopener noreferrer">查看原帖</a>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </XPage>
  )
}