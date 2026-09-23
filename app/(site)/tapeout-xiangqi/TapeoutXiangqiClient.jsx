'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import {
  TAPEOUT_XIANGQI_PLAN,
  TAPEOUT_XIANGQI_SNAPSHOTS,
  createInitialPieces,
  legalMovesForPiece,
  movePiece,
  pieceAt,
} from '../../../lib/tapeoutXiangqi'

const TABS = [
  { id: 'game', label: '试玩' },
  { id: 'plan', label: '执行计划' },
  { id: 'snapshots', label: '过程快照' },
  { id: 'access', label: '授权清单' },
]

const OWNER_META = {
  codex: { label: 'Codex 直接执行', className: 'bg-cyan-400/10 text-cyan-200 ring-cyan-300/20' },
  human: { label: '必须人工授权', className: 'bg-amber-400/10 text-amber-200 ring-amber-300/20' },
  shared: { label: '人机协同', className: 'bg-violet-400/10 text-violet-200 ring-violet-300/20' },
}

const AUTHORIZATION_STEPS = [
  {
    id: 'wallet',
    title: '准备钱包与 BSC 主网',
    estimate: '5–10 分钟',
    href: 'https://docs.bnbchain.org/bnb-smart-chain/developers/wallet-configuration/',
    linkLabel: 'BNB Chain 官方钱包配置',
    action: '在 MetaMask、Trust Wallet 或你已使用的 EVM 钱包中切换到 BSC Mainnet。核对 Chain ID 56、原生币 BNB，并预留容器费、站点写入 Gas 和名字激活费。',
    walletPrompt: '只做网络切换；这一步不需要签名、授权代币或发送 BNB。',
    handoff: '只需告诉 Codex“BSC 主网已就绪”，不要发私钥、助记词或钱包备份。',
  },
  {
    id: 'circuit',
    title: '选定一枚 TapeOut 电路 NFT',
    estimate: '已持有：3–5 分钟；新获取：15–60+ 分钟',
    href: 'https://tapeout.net/#containers',
    linkLabel: 'TapeOut 官方容器页',
    action: '连接钱包后，从自己持有的电路中选一枚，记下处理器合约地址、处理器编号和电路 #ID。如果还没有电路，需先创建或从市场获取。',
    walletPrompt: '仅“连接钱包”可先确认；如果页面要求购买、铸造或流片，这将是一笔独立金融交易，先停下核对金额。',
    handoff: '把公开的处理器合约地址和 #ID 发给 Codex；钱包地址可选，私钥永远不发。',
  },
  {
    id: 'container',
    title: '开启 ERC-6551 电路容器',
    estimate: '3–8 分钟·通常 1 笔交易',
    href: 'https://bscscan.com/address/0x021745DE2f42A7839d96f2d3634d0294487D81F1',
    linkLabel: '在 BscScan 核对 Container Opener',
    action: '从 TapeOut 官方容器页进入目标电路，核对“当前持有人”确实是你的钱包，再点开启容器。官网当前文案提示容器开启费 0.012 BNB，以签名时页面和链上读值为准。',
    walletPrompt: '钱包应显示 BSC Mainnet、目标为 Container Opener、金额和 Gas。持有人、网络或金额任一不符就拒绝。',
    handoff: '完成后把交易哈希 TxID 发给 Codex，我会只读核对容器地址。',
  },
  {
    id: 'publish',
    title: '上传静态游戏文件',
    estimate: '10–25 分钟·交易数随文件和 24 KB 分块数变化',
    href: 'https://github.com/TapeOutProtocol/TapeKit#site-owner-handbook--%E7%AB%99%E9%95%BF%E6%89%8B%E5%86%8C',
    linkLabel: 'TapeKit 官方站长手册',
    verifyHref: 'https://bscscan.com/address/0xd006ffdd5Ae313B17729621A00999cD3C71CE5e6',
    verifyLabel: '核对 SiteRegistry 合约',
    action: 'Codex 先生成最小静态包、MIME 表、文件大小和 SHA-256 清单。你再使用已核对的托管控制台或 SiteRegistry 工具逐笔签名上传。',
    walletPrompt: '目标应是 SiteRegistry；方法应为 putFile / appendChunk / setFallback。不需要 ERC-20 无限 approve。若出现 setOperator，先核对被授权地址和可撤销方式。',
    handoff: '签名前将控制台 URL 或钱包请求截图给 Codex 复核；完成后提供交易哈希列表。',
    note: '当前 TapeKit 文档提到 HashPort 托管控制台，但未在规范中公布可稳定核验的固定 URL。因此本页不提供猜测链接，看到入口后再核对域名与合约。',
  },
  {
    id: 'activate',
    title: '激活 .tape 名字',
    estimate: '3–8 分钟·通常 1 笔交易',
    href: 'https://bscscan.com/address/0x861EE183de2BBE4a6ecf9D15812C123b566a3DB7',
    linkLabel: '在 BscScan 核对 DomainBinding',
    action: '先用本地开发预览验收未激活站点，再调用 bind(链上名字, 容器地址, 月数)。规范当前记录 0.08 BNB / 30 天，但签名前必须重读 monthlyFee。',
    walletPrompt: '钱包里的合约应为 DomainBinding，参数里的 `.tape` 名字和容器地址必须与已核对记录完全一致。',
    handoff: '把激活 TxID 发给 Codex，我会检查 isContainerLive、到期时间和链上名字。',
  },
  {
    id: 'verify',
    title: '逐字节验证与对外分享',
    estimate: '5–10 分钟·无需钱包签名',
    href: 'https://tapekit.org/',
    linkLabel: 'TapeKit 官方网关',
    action: 'Codex 使用 TapeKit 核对文件清单、大小和 SHA-256，检查链外请求，并生成 `https://<#ID>-<处理器编号>.tapekit.org/` 分享地址。',
    walletPrompt: '这是只读验证，不需要钱包连接、签名或付款。',
    handoff: '你打开最终地址做一次玩法验收；通过后即可分享。',
  },
]

function colorLabel(color) {
  return color === 'red' ? '红方' : '黑方'
}

const BOARD_MARKERS = [
  [2, 1], [2, 7], [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
  [6, 0], [6, 2], [6, 4], [6, 6], [6, 8], [7, 1], [7, 7],
]

function markerPath(row, col) {
  const x = 50 + col * 100
  const y = 50 + row * 100
  const left = col > 0 ? `M ${x - 12} ${y - 24} v 12 h -12 M ${x - 24} ${y + 12} h 12 v 12` : ''
  const right = col < 8 ? `M ${x + 12} ${y - 24} v 12 h 12 M ${x + 24} ${y + 12} h -12 v 12` : ''
  return `${left} ${right}`
}

function Board({ pieces, selectedId, legalMoves, onSquareClick, winner, turn }) {
  const legalKeys = new Set(legalMoves.map((move) => `${move.row}:${move.col}`))

  return (
    <div className="relative mx-auto aspect-[9/10] w-full max-w-[520px] overflow-hidden rounded-[1.75rem] border border-amber-200/30 bg-[#d7ae68] shadow-[inset_0_0_45px_rgba(117,66,20,0.2),0_36px_100px_rgba(0,0,0,0.45)]">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 900 1000"
        preserveAspectRatio="none"
      >
        <g fill="none" stroke="#68411f" strokeLinecap="square">
          <rect x="38" y="38" width="824" height="924" strokeWidth="3" opacity="0.48" />
          {Array.from({ length: 10 }, (_, row) => (
            <line key={`rank-${row}`} x1="50" y1={50 + row * 100} x2="850" y2={50 + row * 100} strokeWidth="2" opacity="0.62" />
          ))}
          <line x1="50" y1="50" x2="50" y2="950" strokeWidth="2" opacity="0.62" />
          <line x1="850" y1="50" x2="850" y2="950" strokeWidth="2" opacity="0.62" />
          {Array.from({ length: 7 }, (_, index) => {
            const x = 150 + index * 100
            return (
              <g key={`file-${x}`} strokeWidth="2" opacity="0.62">
                <line x1={x} y1="50" x2={x} y2="450" />
                <line x1={x} y1="550" x2={x} y2="950" />
              </g>
            )
          })}
          <path d="M350 50 L550 250 M550 50 L350 250 M350 750 L550 950 M550 750 L350 950" strokeWidth="2" opacity="0.62" />
          {BOARD_MARKERS.map(([row, col]) => (
            <path key={`marker-${row}-${col}`} d={markerPath(row, col)} strokeWidth="3" opacity="0.58" />
          ))}
        </g>
        <g fill="#68411f" fontFamily="serif" fontSize="42" fontWeight="700" opacity="0.66">
          <text x="250" y="514" textAnchor="middle">楚 河</text>
          <text x="650" y="514" textAnchor="middle">汉 界</text>
        </g>
      </svg>
      <div className="relative z-10 grid h-full grid-cols-9 grid-rows-10">
        {Array.from({ length: 90 }, (_, index) => {
          const row = Math.floor(index / 9)
          const col = index % 9
          const current = pieceAt(pieces, row, col)
          const selected = current?.id === selectedId
          const legal = legalKeys.has(`${row}:${col}`)
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              onClick={() => onSquareClick(row, col)}
              disabled={Boolean(winner)}
              aria-label={current ? `${colorLabel(current.color)}${current.label}` : `第 ${col + 1} 路第 ${row + 1} 行交点`}
              className="relative flex min-h-0 items-center justify-center disabled:cursor-default"
            >
              {legal ? <span className="absolute z-20 h-3 w-3 rounded-full bg-emerald-700/80 ring-4 ring-emerald-200/35" /> : null}
              {current ? (
                <span
                  className={`relative z-10 flex aspect-square w-[78%] items-center justify-center rounded-full border-2 bg-[#f5d99e] font-serif text-[clamp(0.75rem,4vw,1.65rem)] font-black shadow-[0_4px_0_#805126,0_6px_12px_rgba(55,30,10,0.38)] transition-transform ${
                    current.color === 'red' ? 'border-[#a6332c] text-[#a6332c]' : 'border-[#27231e] text-[#27231e]'
                  } ${selected ? '-translate-y-1 scale-110 ring-4 ring-cyan-300/75' : 'hover:-translate-y-0.5'}`}
                >
                  {current.label}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <span className="sr-only">当前轮到 {colorLabel(turn)}</span>
    </div>
  )
}

function GamePanel() {
  const [pieces, setPieces] = useState(() => createInitialPieces())
  const [turn, setTurn] = useState('red')
  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])
  const [moves, setMoves] = useState([])
  const [winner, setWinner] = useState(null)
  const [check, setCheck] = useState(false)

  const legalMoves = useMemo(
    () => (selectedId ? legalMovesForPiece(pieces, selectedId, turn) : []),
    [pieces, selectedId, turn],
  )

  function onSquareClick(row, col) {
    if (winner) return
    const current = pieceAt(pieces, row, col)
    if (current?.color === turn) {
      setSelectedId(current.id)
      return
    }
    if (!selectedId) return
    const result = movePiece(pieces, selectedId, row, col, turn)
    if (!result) return
    setHistory((items) => [...items, { pieces, turn, moves, winner, check }])
    setPieces(result.pieces)
    setTurn(result.turn)
    setWinner(result.winner)
    setCheck(result.check)
    setMoves((items) => [...items, result.notation])
    setSelectedId(null)
  }

  function resetGame() {
    setPieces(createInitialPieces())
    setTurn('red')
    setSelectedId(null)
    setHistory([])
    setMoves([])
    setWinner(null)
    setCheck(false)
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setPieces(previous.pieces)
    setTurn(previous.turn)
    setMoves(previous.moves)
    setWinner(previous.winner)
    setCheck(previous.check)
    setSelectedId(null)
    setHistory((items) => items.slice(0, -1))
  }

  return (
    <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Board pieces={pieces} selectedId={selectedId} legalMoves={legalMoves} onSquareClick={onSquareClick} winner={winner} turn={turn} />
      <aside className="flex flex-col gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Local playable build</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {winner ? `${colorLabel(winner)}胜` : `${colorLabel(turn)}走子`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {winner ? '对局已结束，可以悔棋或重开。' : check ? '将军：必须立即解除威胁。' : '点一枚棋子，再点亮起的合法落点。'}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={undo} disabled={!history.length} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-35">悔棋</button>
            <button type="button" onClick={resetGame} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">重新开始</button>
          </div>
        </div>

        <div className="min-h-[220px] flex-1 rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium text-white">着法记录</h3>
            <span className="font-mono text-xs text-slate-500">{moves.length} PLY</span>
          </div>
          {moves.length ? (
            <ol className="mt-4 grid max-h-64 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto font-mono text-xs text-slate-400">
              {moves.map((move, index) => <li key={`${move}-${index}`}><span className="mr-2 text-slate-600">{index + 1}.</span>{move}</li>)}
            </ol>
          ) : (
            <p className="mt-8 text-sm leading-6 text-slate-500">尚未走子。这个原型已经可以离线运行，不依赖接口或 CDN。</p>
          )}
        </div>
      </aside>
    </section>
  )
}

function PlanPanel() {
  const finished = TAPEOUT_XIANGQI_PLAN.filter((item) => item.status === 'done').length
  return (
    <section>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric value={`${finished}/${TAPEOUT_XIANGQI_PLAN.length}`} label="阶段完成" />
        <Metric value="4" label="Codex 已完成" />
        <Metric value="2" label="等待人工授权" accent />
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10">
        {TAPEOUT_XIANGQI_PLAN.map((item, index) => {
          const meta = OWNER_META[item.owner]
          return (
            <article key={item.id} className="grid gap-4 border-b border-white/10 bg-white/[0.035] p-5 last:border-b-0 md:grid-cols-[52px_minmax(0,1fr)_230px] md:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 font-mono text-sm text-slate-400">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] ring-1 ring-inset ${meta.className}`}>{meta.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] ${item.status === 'done' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/5 text-slate-400'}`}>{item.status === 'done' ? '已完成' : '待执行'}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.output}</p>
              </div>
              <dl className="grid grid-cols-[76px_1fr] content-start gap-x-3 gap-y-2 text-xs leading-5">
                <dt className="text-slate-600">计划时间</dt><dd className="font-mono text-slate-400">{item.planned}</dd>
                <dt className="text-slate-600">实际时间</dt><dd className="font-mono text-slate-300">{item.actual}</dd>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Metric({ value, label, accent = false }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'border-amber-300/20 bg-amber-300/[0.06]' : 'border-white/10 bg-white/[0.035]'}`}>
      <div className={`font-mono text-3xl font-semibold ${accent ? 'text-amber-200' : 'text-cyan-200'}`}>{value}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
    </div>
  )
}

function SnapshotPanel({ onDownload }) {
  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm leading-6 text-slate-400">快照只追加，不覆盖早期判断。下载包含计划、实际时间、责任人和快照。</p>
        </div>
        <button type="button" onClick={onDownload} className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-100">下载 JSON 快照</button>
      </div>
      <div className="relative mt-8 space-y-5 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-white/10">
        {TAPEOUT_XIANGQI_SNAPSHOTS.map((snapshot, index) => (
          <article key={snapshot.time} className="relative grid grid-cols-[32px_1fr] gap-4">
            <span className="relative z-10 mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/30 bg-[#08111f] font-mono text-[10px] text-cyan-200">{index + 1}</span>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <time className="font-mono text-[11px] text-slate-600">{snapshot.time}</time>
              <h3 className="mt-2 font-semibold text-white">{snapshot.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{snapshot.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AccessPanel() {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.045] p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">Authorization runbook</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">从钱包到分享，逐步确认</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">已持有可用电路时，预计人工参与约 30–60 分钟；需新获取电路时约 45–120+ 分钟。链上拥堵、文件分块数和钱包审核速度会改变实际用时。</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-cyan-200/15 bg-black/20 px-4 py-3 text-sm text-cyan-100">预计主网签名 <strong className="ml-1 text-xl">3–N 笔</strong></div>
        </div>
        <div className="mt-7 space-y-4">
          {AUTHORIZATION_STEPS.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-200/10 font-mono text-xs text-cyan-200">{index + 1}</span>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 font-mono text-xs text-cyan-200/65">预计 {item.estimate}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-white/10">{item.linkLabel} ↗</a>
                  {item.verifyHref ? <a href={item.verifyHref} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10">{item.verifyLabel} ↗</a> : null}
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">你要做什么</p><p className="mt-2 text-sm leading-6 text-slate-300">{item.action}</p></div>
                <div className="rounded-xl bg-amber-300/[0.04] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/55">钱包里核对什么</p><p className="mt-2 text-sm leading-6 text-slate-300">{item.walletPrompt}</p></div>
                <div className="rounded-xl bg-emerald-300/[0.04] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-emerald-200/55">完成后交给 Codex</p><p className="mt-2 text-sm leading-6 text-slate-300">{item.handoff}</p></div>
              </div>
              {item.note ? <p className="mt-4 rounded-xl border border-violet-300/10 bg-violet-300/[0.04] px-4 py-3 text-xs leading-5 text-violet-100/70">{item.note}</p> : null}
            </article>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.045] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Codex scope</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Codex 可以直接完成</h2>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
          {['游戏交互、象棋规则与测试', '纯静态上链包、压缩与哈希清单', '只读查询电路、容器、文件与名字状态', '上传前差异审查、Gas 估算与上线后验证'].map((item) => (
            <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Human authorization</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">你必须亲自确认</h2>
        <p className="mt-5 text-sm leading-7 text-slate-300">你只需处理三类行为：选择自己的链上资产、确认每笔钱包交易、决定实际支出。公开地址、#ID 和 TxID 可用于核验；私钥、助记词、钱包备份与任何验证码不可提供。</p>
      </div>
      <div className="lg:col-span-2 rounded-2xl border border-red-300/15 bg-red-300/[0.04] px-5 py-4 text-sm leading-6 text-slate-400">
        <strong className="text-red-200">安全红线：</strong>页面永不收集私钥、助记词或钱包备份。任何主网写操作都应先显示合约、方法、目标容器、金额和 Gas，再由你在钱包中确认。
      </div>
    </section>
  )
}

export default function TapeoutXiangqiClient() {
  const [tab, setTab] = useState('game')
  const [copyLabel, setCopyLabel] = useState('复制页面链接')

  function downloadSnapshot() {
    const snapshot = {
      project: 'TapeOut · 中国象棋上链',
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      publicPage: window.location.href,
      plan: TAPEOUT_XIANGQI_PLAN,
      snapshots: TAPEOUT_XIANGQI_SNAPSHOTS,
      boundaries: { codex: '代码、构建、只读验证、上传包', human: '钱包、资产选择、主网签名、费用确认' },
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'tapeout-xiangqi-project-snapshot.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyLabel('已复制')
      window.setTimeout(() => setCopyLabel('复制页面链接'), 1800)
    } catch {
      setCopyLabel('请从地址栏复制')
    }
  }

  return (
    <main className="min-h-screen bg-[#07101c] text-slate-200 selection:bg-cyan-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_5%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,0.10),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.045] px-5 py-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/resources/tapeout-protocol" className="text-sm text-slate-400 transition hover:text-cyan-200">← TapeOut Protocol</Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200 ring-1 ring-inset ring-emerald-200/20">原型已可玩</span>
              <span className="rounded-full bg-amber-300/10 px-3 py-1.5 text-xs text-amber-200 ring-1 ring-inset ring-amber-200/20">主网待授权</span>
            </div>
          </div>
          <div className="mt-12 max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200/70">Tapeout · build in public · snapshot 05</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">中国象棋，<br /><span className="text-cyan-200">正在准备上链。</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">这是可分享的项目驾驶舱：直接试玩、检查计划和实际用时、回看每次快照，也能看清 Codex 与钱包持有人各自负责什么。</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setTab('game')} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200">立即试玩</button>
            <button type="button" onClick={copyLink} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10">{copyLabel}</button>
          </div>
        </header>

        <nav className="sticky top-3 z-30 mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#0a1422]/90 p-1.5 shadow-xl backdrop-blur [scrollbar-width:none]">
          <div className="flex min-w-max gap-1">
            {TABS.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-xl px-4 py-2.5 text-sm transition ${tab === item.id ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{item.label}</button>
            ))}
          </div>
        </nav>

        <div className="mt-8">
          {tab === 'game' ? <GamePanel /> : null}
          {tab === 'plan' ? <PlanPanel /> : null}
          {tab === 'snapshots' ? <SnapshotPanel onDownload={downloadSnapshot} /> : null}
          {tab === 'access' ? <AccessPanel /> : null}
        </div>

        <footer className="mt-16 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-xs leading-5 text-slate-600 sm:flex-row">
          <p>当前公开快照：2026-09-23 09:47 CST · 授权路线已展开</p>
          <p>下一道门：电路 NFT 持有人授权</p>
        </footer>
      </div>
    </main>
  )
}
