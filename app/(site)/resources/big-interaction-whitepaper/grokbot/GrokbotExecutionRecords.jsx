import {
  HANZI_DETECTION_COPY,
  batchesOnDate,
  derivedSeriesStatus,
  resultStatusLabel,
  seriesStatusLabel,
  verificationStatusLabel,
} from '../../../../../lib/interaction/grokbotExecutions/model.js'
import styles from '../calendar/calendar.module.css'

function CountList({ counts, extra }) {
  const items = [
    ['成功', counts?.succeeded],
    ['失败', counts?.failed],
    ['跳过', counts?.skipped],
    ['待执行', counts?.pending],
  ]
  return (
    <ul className={styles.execCounts}>
      {items.map(([label, value]) => (
        value == null ? null : <li key={label}><span>{label}</span><strong>{value}</strong></li>
      ))}
      {extra}
    </ul>
  )
}

function AccountTable({ accounts, caption }) {
  return (
    <div className={styles.execTableWrap}>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">账号</th>
            <th scope="col">完成时间（Asia/Shanghai）</th>
            <th scope="col">结果</th>
            <th scope="col">核验</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account, index) => (
            <tr key={`${account.username}-${account.completedAtAsiaShanghai}`}>
              <td>{index + 1}</td>
              <td>
                <a href={account.profileUrl} target="_blank" rel="noopener noreferrer">@{account.username}</a>
              </td>
              <td>{account.completedAtAsiaShanghai}</td>
              <td>{resultStatusLabel(account.resultStatus)}</td>
              <td>{verificationStatusLabel(account.verificationStatus)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BatchCard({ series, batch, defaultOpen }) {
  const title = `${series.title} · 第 ${batch.index} 批`
  return (
    <details className={styles.execBatch} id={`grokbot-batch-${series.id}-${batch.index}`} defaultOpen={defaultOpen} data-batch-date={batch.date}>
      <summary>
        <strong>{title}</strong>
        <span>
          {batch.date} · {batch.counts.succeeded}/{batch.counts.attempted} 成功 · {verificationStatusLabel(batch.verificationStatus)}
        </span>
      </summary>
      <p className={styles.execMeta}>
        {batch.startedAtAsiaShanghai} 至 {batch.completedAtAsiaShanghai}
        {batch.followingCountBefore != null && batch.followingCountAfter != null
          ? `。公开关注数 ${batch.followingCountBefore} → ${batch.followingCountAfter}。`
          : '。'}
      </p>
      {batch.verificationSummary ? <p className={styles.execMeta}>{batch.verificationSummary}</p> : null}
      <CountList counts={batch.counts} />
      <AccountTable accounts={batch.accounts} caption={`${title} 已执行账号`} />
    </details>
  )
}

export default function GrokbotExecutionRecords({ records, selectedDate }) {
  if (!records) return null
  const owner = records.ownerAccount
  const dayBatches = selectedDate ? batchesOnDate(records, selectedDate) : []

  return (
    <section className={styles.executions} aria-labelledby="grokbot-executions-heading" id="grokbot-executions">
      <header className={styles.execHead}>
        <h2 id="grokbot-executions-heading">Grokbot 执行记录</h2>
        <p className={styles.execLead}>
          Grokbot 代 @{owner.username}（{owner.displayName}）执行的批次取关台账。时区 {records.timezone}。数据截至 {records.asOfAsiaShanghai}。
        </p>
        <p className={styles.execNote}>{records.method}</p>
        <p className={styles.execNote}>{records.hanziDetection || HANZI_DETECTION_COPY}</p>
        <p className={styles.execNote}>{records.privacyNote}</p>
        <p className={styles.execNote}>结果区分为成功、失败、跳过；核验状态区分为已核验、待核验。</p>
      </header>

      {selectedDate && dayBatches.length > 0 ? (
        <div className={styles.execToday} id={`grokbot-day-${selectedDate}`}>
          <h3>{selectedDate} 当日已核验批次</h3>
                    <ul className={styles.execDayList}>
            {dayBatches.map(({ series, batch }) => (
              <li key={`${series.id}-${batch.index}`}>
                <a href={`#grokbot-batch-${series.id}-${batch.index}`}>{series.title} · 第 {batch.index} 批</a>
                <span>{batch.counts.succeeded}/{batch.counts.attempted} 成功 · {verificationStatusLabel(batch.verificationStatus)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : selectedDate ? (
        <p className={styles.execMeta}>{selectedDate} 没有已写入并核验的执行批次。下面是各系列规则、进度和已核验结果。</p>
      ) : null}

      <div className={styles.execSeriesList}>
        {records.series.map((series) => {
          const status = derivedSeriesStatus(series)
          const statusLabel = seriesStatusLabel(series)
          const allAccounts = series.batches.flatMap((batch) => batch.accounts)
          return (
            <article key={series.id} className={styles.execSeries} data-series-status={status}>
              <header>
                <p className={styles.eyebrow}>执行者 Grokbot</p>
                <h3>{series.title}</h3>
                <p className={status === 'in_progress' ? styles.execStatusLive : styles.execStatusDone}>
                  状态：{statusLabel}
                </p>
              </header>
              <p className={styles.execMeta}><strong>规则。</strong> {series.rule}</p>
              <p className={styles.execMeta}><strong>节奏。</strong> {series.rate}</p>
              {series.startedAtAsiaShanghai ? (
                <p className={styles.execMeta}>
                  <strong>时间。</strong> {series.startedAtAsiaShanghai}
                  {series.completedAtAsiaShanghai ? ` 至 ${series.completedAtAsiaShanghai}` : ' 起，尚未全部完成'}
                  。
                </p>
              ) : null}
              <CountList
                counts={series.counts}
                extra={series.queue ? (
                  <li key="queue">
                    <span>队列</span>
                    <strong>{series.queue.done}/{series.queue.startSize}</strong>
                  </li>
                ) : null}
              />
              {series.queue ? (
                <p className={styles.execMeta}>
                  快照候选 {series.queue.snapshotCandidates} 个，排除 {series.queue.excluded} 个后锁定 {series.queue.startSize} 个。
                  排除原因计数：已不在关注 {series.queue.exclusionReasonCounts.noLongerFollowing}、现已回关 {series.queue.exclusionReasonCounts.nowFollowsBack}、现用昵称或简介出现汉字 {series.queue.exclusionReasonCounts.nameOrBioHasHanzi}。
                  {series.queue.note}
                </p>
              ) : null}
              {series.verification ? (
                <p className={styles.execMeta}>
                  <strong>核验。</strong> {verificationStatusLabel(series.verification.status)}
                  {series.verification.verifiedAtAsiaShanghai ? `（${series.verification.verifiedAtAsiaShanghai}）` : ''}
                  。{series.verification.summary}
                </p>
              ) : null}
              {series.followingCountReconciliation ? (
                <p className={styles.execMeta}>
                  <strong>关注数口径。</strong> {series.followingCountReconciliation.priorCount} → {series.followingCountReconciliation.verificationCount}，净少 {Math.abs(series.followingCountReconciliation.netChange)}。
                  对账 {series.followingCountReconciliation.formula}。
                  {series.followingCountReconciliation.note}
                </p>
              ) : null}
              {series.batches.map((batch) => (
                <BatchCard
                  key={`${series.id}-${batch.index}-${selectedDate && batch.date === selectedDate ? 'open' : 'shut'}`}
                  series={series}
                  batch={batch}
                  defaultOpen={Boolean(selectedDate && batch.date === selectedDate)}
                />
              ))}
              {allAccounts.length > 10 ? (
                <details className={styles.execBatch}>
                  <summary>
                    <strong>全部已执行账号（{allAccounts.length}）</strong>
                    <span>可滚动查看完整名单</span>
                  </summary>
                  <AccountTable accounts={allAccounts} caption={`${series.title} 全部已执行账号`} />
                </details>
              ) : null}
              {status === 'in_progress' ? (
                <p className={styles.execAppend}>后续已核验批次将按同样结构追加。进行中但尚未核验的批次不写入本台账。</p>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
