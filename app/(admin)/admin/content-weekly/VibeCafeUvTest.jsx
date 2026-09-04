'use client'

import { useEffect, useRef, useState } from 'react'
import { AdminButton, Section } from '../../components/ui'
import { createVibeUvExperiment, VIBE_UV_TEST_MODES } from '../../../../lib/vibeCafeUvTest.mjs'

export default function VibeCafeUvTest() {
  const [mode, setMode] = useState('retain-reload')
  const [rounds, setRounds] = useState(5)
  const [intervalSeconds, setIntervalSeconds] = useState(2)
  const [running, setRunning] = useState(false)
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('等待开始')
  const active = useRef(null)

  useEffect(() => () => {
    const run = active.current
    active.current = null
    if (run) {
      clearTimeout(run.timer)
      try { run.experiment.cleanup() } catch {}
    }
  }, [])

  function stop() {
    const run = active.current
    active.current = null
    if (!run) return
    clearTimeout(run.timer)
    setRunning(false)
    try { run.experiment.cleanup(); setStatus('已停止，已删除本次测试键') }
    catch { setStatus('已停止，但浏览器拒绝清理本次测试键') }
  }

  function start() {
    if (active.current) return
    setRows([])
    let experiment
    try {
      experiment = createVibeUvExperiment({
        storage: window.localStorage,
        key: `tuaran:uv-test:${crypto.randomUUID()}`,
        mode,
      })
    } catch {
      setStatus('浏览器存储不可用，无法执行测试')
      return
    }
    const run = { experiment, timer: null }
    active.current = run
    setRunning(true)
    setStatus('本地测试中；没有向 VibeCafé 发送事件')
    const results = []
    function next() {
      if (active.current !== run) return
      try {
        results.push(experiment.step())
        setRows([...results])
        if (results.length >= rounds) {
          experiment.cleanup()
          active.current = null
          setRunning(false)
          setStatus('测试完成，已删除本次测试键；结果仅代表客户端身份生命周期')
        } else {
          run.timer = setTimeout(next, intervalSeconds * 1000)
        }
      } catch {
        active.current = null
        setRunning(false)
        try { experiment.cleanup() } catch {}
        setStatus('测试失败：浏览器拒绝读写测试存储，未判定为通过')
      }
    }
    next()
  }

  const uniqueIds = new Set(rows.map(row => row.visitorId)).size
  const expectation = VIBE_UV_TEST_MODES.find(item => item.id === mode)?.expected
  const inputClass = 'mt-1 w-full rounded-lg border border-[#d9dccf] bg-white px-3 py-2 text-xs dark:border-[#334155] dark:bg-[#111923]'
  return (
    <Section title="VibeCafé UV 机制对照测试" description="在当前浏览器的独立测试键中模拟访客 ID 生命周期。不会清除登录、偏好或正式统计 ID；不向平台发送测试流量。" className="mb-4">
      <p className="text-xs leading-6 text-[#66685f] dark:text-gray-400">这是依据 2026-09-04 公开 v1 脚本实现的本地模型，不运行正式采集 SDK。清除存储后，旧页面仍持有内存 ID；重新初始化才会重新读取或生成。每轮模拟一次页面加载或一次不同网址的导航事件。</p>
      <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <label className="text-xs">对照场景<select className={inputClass} value={mode} disabled={running} onChange={event => { setMode(event.target.value); setRows([]); setStatus('等待开始') }}>{VIBE_UV_TEST_MODES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="text-xs">测试轮数<select className={inputClass} value={rounds} disabled={running} onChange={event => setRounds(Number(event.target.value))}>{[3, 5, 10].map(value => <option key={value} value={value}>{value} 轮</option>)}</select></label>
        <label className="text-xs">每轮间隔<select className={inputClass} value={intervalSeconds} disabled={running} onChange={event => setIntervalSeconds(Number(event.target.value))}>{[1, 2, 5, 900].map(value => <option key={value} value={value}>{value === 900 ? '15 分钟' : `${value} 秒`}</option>)}</select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><AdminButton type="button" onClick={start} disabled={running}>开始本地对照测试</AdminButton><AdminButton type="button" onClick={stop} disabled={!running}>停止测试</AdminButton><span role="status" className="text-xs">{status}</span></div>
      <p className="mt-3 text-xs leading-6">预期：{expectation}。当前记录 {rows.length} 次模拟事件、{uniqueIds} 个独立测试 ID。平台实际 UV：未测量。</p>
      <p className="mt-2 text-xs leading-6 text-[#77786f] dark:text-gray-400">测试需保持此页面打开，关闭或离开页面会停止，后台标签页可能延迟计时。15 分钟间隔若全天运行相当于 96 轮；此面板最多 10 轮后自动停止，不是全天候调度服务。</p>
      {rows.length > 0 ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className="border-b"><th className="py-2">轮次</th><th>操作</th><th>模拟上报 visitorId</th><th>测试存储</th><th>ID 变化</th></tr></thead><tbody>{rows.map(row => <tr key={row.round} className="border-b border-black/5 dark:border-white/10"><td className="py-2">{row.round}</td><td>{row.cleared ? '清除' : '保留'} / {row.reinitialized ? '初始化' : '保持页面'}</td><td className="font-mono">{row.visitorId}</td><td>{row.storedId ? '存在' : '已清空'}</td><td>{row.changed === null ? '首次' : row.changed ? '已变化' : '未变化'}</td></tr>)}</tbody></table></div> : null}
      <p className="mt-3 text-xs leading-6 text-[#77786f] dark:text-gray-400">真实 UV 验收需使用测试专用产品，并从平台报表核对同一时间窗的结果。客户端产生了新 ID，不等于服务端一定新增 UV；平台可能另外按日期、IP 或风控规则过滤。</p>
    </Section>
  )
}
