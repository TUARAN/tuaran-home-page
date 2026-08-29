'use client'

import { useMemo, useState } from 'react'
import { buildLoanAnalysisBrief, extractLoanSnapshots, formatLoanMoney as money } from '../../../../lib/longCompass/loans'
import { PROSE_CLASS, renderMarkdown } from './markdown'

const panel = 'rounded-xl border border-[#dee0db] bg-white/75 p-4 dark:border-gray-800 dark:bg-[#121821]/75'
const muted = 'text-xs leading-6 text-[#717367] dark:text-gray-400'
const colors = ['#c56b37', '#bd9343', '#718a65', '#5e8c92', '#807798', '#9b8272']

export default function WealthView({ records }) {
  const snapshots = useMemo(() => extractLoanSnapshots(records), [records])
  const [selectedId, setSelectedId] = useState('')
  const snapshot = snapshots.find((item) => item.id === selectedId) || snapshots[0]
  return (
    <section className="space-y-5 text-[#35362f] dark:text-gray-200">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-gray-400">Debt & repayment</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">贷款与还款</h2>
          <p className={`mt-2 ${muted}`}>从贷款盘点开始，逐次保存余额与判断。历史本金、当前快照和未核实估算分别呈现。</p>
        </div>
        {snapshot ? <label className={muted}>历史快照
          <select value={snapshot.id} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 block max-w-full rounded-lg border border-[#dee0db] bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#121821]">
            {snapshots.map((item) => <option key={item.id} value={item.id}>{item.date} · {item.title}</option>)}
          </select>
        </label> : null}
      </header>
      {snapshot ? <SnapshotDashboard key={snapshot.id} snapshot={snapshot} /> : (
        <div className={panel}>
          <h3 className="font-medium">等待首份贷款快照</h3>
          <p className={`mt-2 ${muted}`}>通过本地加密导入保存含「快照日期」与「贷款明细」表格的记录，解锁后即可查看本金、构成和利率。不会从叙述中猜测余额。</p>
        </div>
      )}
    </section>
  )
}

function SnapshotDashboard({ snapshot }) {
  const activeLoans = snapshot.loans.filter((loan) => loan.remainingCents > 0).sort((a, b) => b.remainingCents - a.remainingCents)
  const byRate = [...snapshot.loans].sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
  const maxRate = Math.max(1, ...byRate.map((loan) => loan.rate ?? 0))
  const progress = snapshot.originalCents > 0 ? snapshot.repaidCents / snapshot.originalCents * 100 : null
  return <>
    <p className="rounded-lg bg-[#eef0eb] px-3 py-2 text-xs leading-6 dark:bg-[#23271e]">截至 {snapshot.date} · {snapshot.activeCount} 笔有余额 / {snapshot.settledCount} 笔已结清 · 历史记录，不是实时账单</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="历史借款本金" value={money(snapshot.originalCents)} note="所有列示借款的原始本金合计" />
      <Metric label="待还本金" value={money(snapshot.remainingCents)} note="不含未来利息与其他费用" accent />
      <Metric label="已经还掉的本金" value={money(snapshot.repaidCents)} note="原始本金 − 待还本金" />
      <Metric label="余额加权年化 · 复算" value={snapshot.weightedRate === null ? '无法计算' : `≈ ${snapshot.weightedRate.toFixed(2)}%`} note={`只使用有余额的借款；原图 ${snapshot.reportedRate === null ? '未提供' : `${snapshot.reportedRate}%`}`} />
    </div>
    {snapshot.warnings.length ? <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200" aria-label="数据核对提示">
      <h3 className="font-semibold">这些数字需要核对</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-6">{snapshot.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
    </aside> : null}
    <section className={panel}>
      <div className="flex items-baseline justify-between gap-2"><h3 className="font-semibold">本金偿还进度</h3><span className="font-mono text-xl">{progress === null ? '—' : `${progress.toFixed(2)}%`}</span></div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e7e8e0] dark:bg-gray-800" role="img" aria-label={progress === null ? '无法计算偿还进度' : `本金已偿还 ${progress.toFixed(2)}%`}>
        <div className="h-full rounded-full bg-[#718a65]" style={{ width: `${progress ?? 0}%` }} />
      </div>
      <p className={`mt-2 ${muted}`}>已还 {money(snapshot.repaidCents)} · 剩余 {money(snapshot.remainingCents)}。这是金额比例，不表示剩余还款时间。</p>
    </section>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={panel}>
        <h3 className="font-semibold">待还本金构成</h3>
        {snapshot.remainingCents === null ? <p className={muted}>明细有缺失，暂不计算占比。</p> : snapshot.remainingCents === 0 ? <p className={`mt-3 ${muted}`}>列示贷款本金已全部还清。</p> : <>
          <div className="mt-4 flex h-5 overflow-hidden rounded-full" aria-hidden="true">{activeLoans.map((loan, i) => <div key={loan.id} style={{ width: `${loan.remainingCents / snapshot.remainingCents * 100}%`, backgroundColor: colors[i % colors.length] }} />)}</div>
          <ul className="mt-4 space-y-3">{activeLoans.map((loan, i) => <li key={loan.id} className="flex flex-wrap items-center justify-between gap-1 text-xs leading-5">
            <span><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />{loan.label}</span>
            <span className="font-mono">{money(loan.remainingCents)} · {(loan.remainingCents / snapshot.remainingCents * 100).toFixed(1)}%</span>
          </li>)}</ul>
        </>}
      </section>
      <section className={panel}>
        <h3 className="font-semibold">年化估算对比</h3>
        <p className={muted}>从高到低；结清记录仅供回看，不列入当前处理顺序。</p>
        <ul className="mt-3 space-y-3">{byRate.map((loan) => <li key={loan.id}>
          <div className="mb-1 flex flex-wrap justify-between gap-1 text-xs"><span>{loan.label} {loan.remainingCents === 0 ? '· 已结清' : ''}</span><span>{loan.rateLabel}</span></div>
          <div className="h-2 rounded-full bg-[#e7e8e0] dark:bg-gray-800"><div className={`h-full rounded-full ${loan.remainingCents === 0 ? 'bg-gray-400' : 'bg-[#bd9343]'}`} style={{ width: `${(loan.rate ?? 0) / maxRate * 100}%` }} /></div>
        </li>)}</ul>
        <p className={`mt-3 ${muted}`}>利率来自记录，可能不是同一计息口径；实际成本、手续费和提前还款规则以合同为准。</p>
      </section>
    </div>
    <section className={panel}>
      <h3 className="font-semibold">逐笔贷款</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[740px] text-left text-xs leading-6">
          <caption className="sr-only">{snapshot.date} 贷款明细，金额单位人民币元</caption>
          <thead className="border-b border-[#dee0db] dark:border-gray-700"><tr>{['机构 / 产品', '原始本金', '待还本金', '年化估算', '还款方式', '剩余期数', '状态'].map((label) => <th scope="col" className="px-2 py-2 font-medium" key={label}>{label}</th>)}</tr></thead>
          <tbody>{snapshot.loans.map((loan) => <tr key={loan.id} className="border-b border-[#e5e6e0] last:border-0 dark:border-gray-800">
            <th scope="row" className="px-2 py-3 font-medium"><span className="block">{loan.label}</span><span className="block text-[10px] font-normal text-[#717367] dark:text-gray-400">借款日期：{loan.borrowedAt}</span></th>
            <td className="px-2">{money(loan.originalCents)}</td><td className="px-2">{money(loan.remainingCents)}</td><td className="px-2">{loan.rateLabel}</td><td className="px-2">{loan.method}</td><td className="px-2">{loan.remainingPeriods}</td><td className="px-2">{loan.status}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className={panel}>
      <h3 className="font-semibold">还款计划 · 原图待核实</h3>
      <p className={`mt-2 ${muted}`}>原图预计月供 {money(snapshot.monthlyCents)}，尚未复算。以下金额不是完整月度账单；月份与期数应逐笔核对，不据此生成还款提醒。</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">{snapshot.schedules.map((item, i) => <li key={i} className="border-l-2 border-[#bd9343] pl-3">
        <p className="text-sm">{item.month} <span className="ml-2 font-mono">{money(item.amountCents)}</span></p><p className={muted}>{item.label}</p>
      </li>)}</ul>
    </section>
    <AnalysisBrief snapshot={snapshot} />
    <details className={panel}><summary className="cursor-pointer text-sm font-medium">查看完整快照与当时的策略</summary><div className={PROSE_CLASS} dangerouslySetInnerHTML={{ __html: renderMarkdown(snapshot.content) }} /></details>
  </>
}

function Metric({ label, value, note, accent }) {
  return <div className={panel}><p className={muted}>{label}</p><p className={`mt-1 break-words font-mono text-xl font-semibold ${accent ? 'text-[#b76031] dark:text-[#e0a279]' : ''}`}>{value}</p><p className={`mt-2 ${muted}`}>{note}</p></div>
}

function AnalysisBrief({ snapshot }) {
  const [anonymize, setAnonymize] = useState(true)
  const [notice, setNotice] = useState('')
  const brief = useMemo(() => buildLoanAnalysisBrief(snapshot, { anonymize }), [snapshot, anonymize])
  async function copy() {
    try { await navigator.clipboard.writeText(brief); setNotice('已复制，请自行选择是否发送给外部模型。') }
    catch { setNotice('复制失败，请在材料框内全选并复制。') }
  }
  return <section className={`${panel} border-[#bdc9b5] dark:border-[#42533b]`}>
    <p className="text-[10px] uppercase tracking-[0.18em] text-[#718a65]">Review with an LLM</p>
    <h3 className="mt-1 font-serif text-lg font-semibold">大模型辅助负债分析</h3>
    <p className={`mt-2 ${muted}`}>先审阅数据，再复制给你选择的模型。此处只整理分析材料，不调用模型、不自动上传、不执行交易或还款。现金、收入和必要支出未补齐前，不生成具体提前还款金额。</p>
    <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={anonymize} onChange={(event) => { setAnonymize(event.target.checked); setNotice('') }} />隐藏机构名称（金额仍属敏感信息）</label>
    <label className="mt-3 block text-xs">分析材料预览<textarea readOnly value={brief} rows={10} className="mt-2 w-full rounded-lg border border-[#dee0db] bg-[#fafbf8] p-3 font-mono text-xs leading-6 dark:border-gray-700 dark:bg-[#0c1118]" /></label>
    <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={copy} className="rounded-lg bg-[#2f3027] px-4 py-2 text-xs font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-gray-200 dark:text-[#111]">复制分析材料</button><span role="status" className={muted}>{notice}</span></div>
  </section>
}
