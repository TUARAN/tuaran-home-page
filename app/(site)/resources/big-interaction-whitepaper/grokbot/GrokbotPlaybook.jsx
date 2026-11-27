'use client'

import { useMemo, useState } from 'react'

import {
  GROKBOT_PLAYBOOK_VERSION,
  grokbotBatchPhases,
  grokbotGrayRules,
  grokbotLayers,
  grokbotQualityChecks,
  grokbotRetainRules,
  grokbotUnfollowRules,
} from '../../../../../lib/interaction/grokbotPlaybook.js'
import {
  buildGrokbotFollowingPrompt,
  GROKBOT_DEFAULT_SELECTION,
  grokbotSelectionKey,
  selectionFromSet,
  selectionSetFromGroups,
} from '../../../../../lib/interaction/grokbotPromptBuilder.js'
import styles from './grokbot.module.css'

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

function useRuleSelection(initial = GROKBOT_DEFAULT_SELECTION) {
  const [set, setSet] = useState(() => selectionSetFromGroups(initial))
  function toggle(group, id) {
    const key = grokbotSelectionKey(group, id)
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  function resetDefaults() {
    setSet(selectionSetFromGroups(GROKBOT_DEFAULT_SELECTION))
  }
  const selection = useMemo(() => selectionFromSet(set), [set])
  const isOn = (group, id) => set.has(grokbotSelectionKey(group, id))
  return { selection, toggle, resetDefaults, isOn }
}

function CopyPromptHero({ prompt, onReset }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <section className={styles.hero} aria-labelledby="grokbot-hero-title">
      <p className={styles.heroKicker}>一步交给 @grokbot</p>
      <h2 id="grokbot-hero-title">复制下面整段，粘贴到 Grokbot 对话即可完成关注列表治理（先出名单）</h2>
      <p className={styles.heroLead}>默认已勾选常用 UF / RT / GZ / QC。改勾选后提示词会实时更新，再点复制即可。</p>
      <div className={styles.promptBox}>
        <pre className={styles.promptPreview}>{prompt}</pre>
        <div className={styles.heroActions}>
          <button type="button" className={styles.copyBtn} onClick={copy}>
            {copied ? '已复制' : '复制提示词'}
          </button>
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            恢复默认勾选
          </button>
          <a className={styles.botLink} href="https://x.com/grokbot" target="_blank" rel="noopener noreferrer">
            打开 @grokbot
          </a>
        </div>
      </div>
    </section>
  )
}

function SelectableTable({
  caption,
  group,
  columns,
  rows,
  getKey,
  isOn,
  onToggle,
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.matrix}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">选用</th>
            {columns.map((col) => (
              <th key={col.key} scope="col">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = getKey(row)
            const on = isOn(group, id)
            return (
              <tr key={id} className={on ? '' : styles.rowOff}>
                <td>
                  <label className={styles.checkCell}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => onToggle(group, id)}
                      aria-label={`${id} ${row.signal || row.cue || row.item || row.step || row.name}`}
                    />
                    <span className={styles.srOnly}>{id}</span>
                  </label>
                </td>
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StaticTable({ caption, columns, rows, getKey }) {
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

export default function GrokbotPlaybook() {
  const { selection, toggle, resetDefaults, isOn } = useRuleSelection()
  const [batchLimit, setBatchLimit] = useState(50)
  const [whitelist, setWhitelist] = useState('')

  const prompt = useMemo(
    () => buildGrokbotFollowingPrompt({ selection, batchLimit, whitelist, listOnly: true }),
    [selection, batchLimit, whitelist],
  )

  return (
    <>
      <CopyPromptHero
        prompt={prompt}
        onReset={() => {
          resetDefaults()
          setBatchLimit(50)
          setWhitelist('')
        }}
      />

      <div className={styles.optionsBar}>
        <label>
          本批候选上限
          <input
            type="number"
            min={1}
            max={500}
            value={batchLimit}
            onChange={(e) => setBatchLimit(Number(e.target.value) || 50)}
          />
        </label>
        <label className={styles.whitelistField}>
          白名单（空格或逗号分隔 @）
          <input
            type="text"
            value={whitelist}
            placeholder="例如 @合作方 @同事"
            onChange={(e) => setWhitelist(e.target.value)}
          />
        </label>
      </div>

      <section className={styles.section} aria-labelledby="grokbot-layers">
        <h2 id="grokbot-layers">策略层级（L0–L4）</h2>
        <p className={styles.lead}>
          自上而下：先划红线，再写目标与规则族，批次执行，最后质检闭环。勾选会写入顶部提示词（除本说明表外）。
        </p>
        <StaticTable
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
        <p className={styles.lead}>硬取关优先；任一保留规则命中则不得进入执行名单。</p>
        <SelectableTable
          group="uf"
          caption="取关规则矩阵 · 勾选写入提示词"
          isOn={isOn}
          onToggle={toggle}
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'tier', label: '强度', render: (r) => r.tier },
            { key: 'signal', label: '信号', render: (r) => r.signal },
            { key: 'threshold', label: '阈值', render: (r) => r.threshold },
            { key: 'action', label: '动作', render: (r) => r.action },
          ]}
          rows={grokbotUnfollowRules}
          getKey={(r) => r.id}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-retain">
        <h2 id="grokbot-retain">保留规则（RT）</h2>
        <p className={styles.lead}>建设性批评要留；运营号建议勾选 RT-02。</p>
        <SelectableTable
          group="rt"
          caption="保留规则矩阵 · 勾选写入提示词"
          isOn={isOn}
          onToggle={toggle}
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'tier', label: '强度', render: (r) => r.tier },
            { key: 'signal', label: '信号', render: (r) => r.signal },
            { key: 'threshold', label: '阈值', render: (r) => r.threshold },
            { key: 'action', label: '动作', render: (r) => r.action },
          ]}
          rows={grokbotRetainRules}
          getKey={(r) => r.id}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-gray">
        <h2 id="grokbot-gray">灰区规则（GZ）</h2>
        <SelectableTable
          group="gz"
          caption="灰区与人工裁定 · 勾选写入提示词"
          isOn={isOn}
          onToggle={toggle}
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'cue', label: '场景', render: (r) => r.cue },
            { key: 'condition', label: '条件', render: (r) => r.condition },
            { key: 'resolution', label: '处理', render: (r) => r.resolution },
          ]}
          rows={grokbotGrayRules}
          getKey={(r) => r.id}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-batch">
        <h2 id="grokbot-batch">批次流程（P1–P6）</h2>
        <StaticTable
          caption="执行阶段与人机分工"
          columns={[
            { key: 'phase', label: '阶段', render: (r) => <code>{r.phase}</code> },
            { key: 'step', label: '步骤', render: (r) => r.step },
            { key: 'grokbot', label: 'Grokbot', render: (r) => r.grokbot },
            { key: 'human', label: '人工', render: (r) => r.human },
          ]}
          rows={grokbotBatchPhases}
          getKey={(r) => r.phase}
        />
      </section>

      <section className={styles.section} aria-labelledby="grokbot-qc">
        <h2 id="grokbot-qc">质量管理（QC）</h2>
        <p className={styles.lead}>版本 {GROKBOT_PLAYBOOK_VERSION} · 规则冲突时保留类（RT）优先。</p>
        <SelectableTable
          group="qc"
          caption="质检项 · 勾选写入提示词"
          isOn={isOn}
          onToggle={toggle}
          columns={[
            { key: 'id', label: '编号', render: (r) => <code>{r.id}</code> },
            { key: 'item', label: '项', render: (r) => r.item },
            { key: 'pass', label: '通过标准', render: (r) => r.pass },
          ]}
          rows={grokbotQualityChecks}
          getKey={(r) => r.id}
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
    </>
  )
}