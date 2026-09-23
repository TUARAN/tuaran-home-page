export const XIANGQI_COLS = 9
export const XIANGQI_ROWS = 10

const RED = 'red'
const BLACK = 'black'

const PIECE_LABELS = {
  red: { general: '帅', advisor: '仕', elephant: '相', horse: '马', rook: '车', cannon: '炮', pawn: '兵' },
  black: { general: '将', advisor: '士', elephant: '象', horse: '马', rook: '车', cannon: '砲', pawn: '卒' },
}

function piece(id, color, type, row, col) {
  return { id, color, type, label: PIECE_LABELS[color][type], row, col }
}

export function createInitialPieces() {
  const pieces = []
  const backRank = ['rook', 'horse', 'elephant', 'advisor', 'general', 'advisor', 'elephant', 'horse', 'rook']

  for (const color of [BLACK, RED]) {
    const row = color === BLACK ? 0 : 9
    const prefix = color === BLACK ? 'b' : 'r'
    backRank.forEach((type, col) => pieces.push(piece(`${prefix}-${type}-${col}`, color, type, row, col)))
    const cannonRow = color === BLACK ? 2 : 7
    pieces.push(piece(`${prefix}-cannon-1`, color, 'cannon', cannonRow, 1))
    pieces.push(piece(`${prefix}-cannon-7`, color, 'cannon', cannonRow, 7))
    const pawnRow = color === BLACK ? 3 : 6
    ;[0, 2, 4, 6, 8].forEach((col) => pieces.push(piece(`${prefix}-pawn-${col}`, color, 'pawn', pawnRow, col)))
  }

  return pieces
}

export function opponent(color) {
  return color === RED ? BLACK : RED
}

function at(pieces, row, col) {
  return pieces.find((item) => item.row === row && item.col === col) || null
}

function isInside(row, col) {
  return row >= 0 && row < XIANGQI_ROWS && col >= 0 && col < XIANGQI_COLS
}

function isInPalace(color, row, col) {
  if (col < 3 || col > 5) return false
  return color === RED ? row >= 7 && row <= 9 : row >= 0 && row <= 2
}

function blockersBetween(pieces, from, to) {
  if (from.row !== to.row && from.col !== to.col) return Infinity
  let count = 0
  if (from.row === to.row) {
    const start = Math.min(from.col, to.col) + 1
    const end = Math.max(from.col, to.col)
    for (let col = start; col < end; col += 1) if (at(pieces, from.row, col)) count += 1
  } else {
    const start = Math.min(from.row, to.row) + 1
    const end = Math.max(from.row, to.row)
    for (let row = start; row < end; row += 1) if (at(pieces, row, from.col)) count += 1
  }
  return count
}

function canMoveByShape(pieces, moving, toRow, toCol, target) {
  const rowDelta = toRow - moving.row
  const colDelta = toCol - moving.col
  const absRow = Math.abs(rowDelta)
  const absCol = Math.abs(colDelta)

  switch (moving.type) {
    case 'general': {
      if (target?.type === 'general' && moving.col === toCol) {
        return blockersBetween(pieces, moving, { row: toRow, col: toCol }) === 0
      }
      return isInPalace(moving.color, toRow, toCol) && absRow + absCol === 1
    }
    case 'advisor':
      return isInPalace(moving.color, toRow, toCol) && absRow === 1 && absCol === 1
    case 'elephant': {
      const staysHome = moving.color === RED ? toRow >= 5 : toRow <= 4
      if (!staysHome || absRow !== 2 || absCol !== 2) return false
      return !at(pieces, moving.row + rowDelta / 2, moving.col + colDelta / 2)
    }
    case 'horse': {
      if (!((absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2))) return false
      const legRow = moving.row + (absRow === 2 ? Math.sign(rowDelta) : 0)
      const legCol = moving.col + (absCol === 2 ? Math.sign(colDelta) : 0)
      return !at(pieces, legRow, legCol)
    }
    case 'rook':
      return (moving.row === toRow || moving.col === toCol) && blockersBetween(pieces, moving, { row: toRow, col: toCol }) === 0
    case 'cannon': {
      if (moving.row !== toRow && moving.col !== toCol) return false
      const blockers = blockersBetween(pieces, moving, { row: toRow, col: toCol })
      return target ? blockers === 1 : blockers === 0
    }
    case 'pawn': {
      const forward = moving.color === RED ? -1 : 1
      if (rowDelta === forward && colDelta === 0) return true
      const crossedRiver = moving.color === RED ? moving.row <= 4 : moving.row >= 5
      return crossedRiver && rowDelta === 0 && absCol === 1
    }
    default:
      return false
  }
}

function applyUncheckedMove(pieces, pieceId, toRow, toCol) {
  return pieces
    .filter((item) => !(item.row === toRow && item.col === toCol && item.id !== pieceId))
    .map((item) => (item.id === pieceId ? { ...item, row: toRow, col: toCol } : item))
}

export function isSquareAttacked(pieces, row, col, byColor) {
  const target = at(pieces, row, col)
  return pieces.some((moving) => moving.color === byColor && canMoveByShape(pieces, moving, row, col, target))
}

export function isInCheck(pieces, color) {
  const general = pieces.find((item) => item.color === color && item.type === 'general')
  if (!general) return true
  return isSquareAttacked(pieces, general.row, general.col, opponent(color))
}

export function isLegalMove(pieces, pieceId, toRow, toCol, turn) {
  const moving = pieces.find((item) => item.id === pieceId)
  if (!moving || moving.color !== turn || !isInside(toRow, toCol)) return false
  if (moving.row === toRow && moving.col === toCol) return false
  const target = at(pieces, toRow, toCol)
  if (target?.color === moving.color) return false
  if (!canMoveByShape(pieces, moving, toRow, toCol, target)) return false
  return !isInCheck(applyUncheckedMove(pieces, pieceId, toRow, toCol), moving.color)
}

export function legalMovesForPiece(pieces, pieceId, turn) {
  const moves = []
  for (let row = 0; row < XIANGQI_ROWS; row += 1) {
    for (let col = 0; col < XIANGQI_COLS; col += 1) {
      if (isLegalMove(pieces, pieceId, row, col, turn)) moves.push({ row, col })
    }
  }
  return moves
}

export function hasLegalMove(pieces, color) {
  return pieces
    .filter((item) => item.color === color)
    .some((item) => legalMovesForPiece(pieces, item.id, color).length > 0)
}

export function movePiece(pieces, pieceId, toRow, toCol, turn) {
  if (!isLegalMove(pieces, pieceId, toRow, toCol, turn)) return null
  const moving = pieces.find((item) => item.id === pieceId)
  const captured = at(pieces, toRow, toCol)
  const nextPieces = applyUncheckedMove(pieces, pieceId, toRow, toCol)
  const nextTurn = opponent(turn)
  const winner = captured?.type === 'general' || !hasLegalMove(nextPieces, nextTurn) ? turn : null
  return {
    pieces: nextPieces,
    turn: nextTurn,
    winner,
    check: !winner && isInCheck(nextPieces, nextTurn),
    notation: `${moving.label}${moving.col + 1}:${moving.row + 1}→${toCol + 1}:${toRow + 1}`,
  }
}

export function pieceAt(pieces, row, col) {
  return at(pieces, row, col)
}

export const TAPEOUT_XIANGQI_PLAN = Object.freeze([
  {
    id: 'scope',
    title: '需求与边界固化',
    owner: 'codex',
    status: 'done',
    planned: '2026-09-23 09:34–09:42',
    actual: '2026-09-23 09:34–09:35',
    output: '确定公开驾驶舱、纯静态游戏原型、主网授权边界。',
  },
  {
    id: 'engine',
    title: '中国象棋规则引擎',
    owner: 'codex',
    status: 'done',
    planned: '2026-09-23 09:42–10:12',
    actual: '2026-09-23 09:35–09:36',
    output: '棋子走法、蹩马腿、塞象眼、炮架、将帅照面、将军、胜负、悔棋。',
  },
  {
    id: 'console',
    title: '交互页与过程快照',
    owner: 'codex',
    status: 'done',
    planned: '2026-09-23 10:12–10:45',
    actual: '2026-09-23 09:36–09:37',
    output: '试玩、执行表、快照、授权清单与 JSON 导出。',
  },
  {
    id: 'verify',
    title: '规则测试与生产构建',
    owner: 'codex',
    status: 'done',
    planned: '2026-09-23 10:45–11:10',
    actual: '2026-09-23 09:37–09:38',
    output: '核心规则回归测试、路由审计与 Next.js 生产构建。',
  },
  {
    id: 'circuit',
    title: '铸造 NAND、流片并开启容器',
    owner: 'shared',
    status: 'done',
    planned: '15–30 分钟·预计 3 笔钱包确认',
    actual: '2026-09-23 10:47–10:54 CST·3 笔钱包确认',
    output: 'Codex 准备参数并核验结果；持有人确认铸造、Tapeout 与 Open。产出 TapeID 122.6 及容器 0xFC74…DfD7。',
  },
  {
    id: 'mainnet',
    title: '上传、签名与名字激活',
    owner: 'shared',
    status: 'done',
    planned: '20–40 分钟·预计 2 笔钱包确认',
    actual: '2026-09-23 11:09–11:32 CST·2 笔钱包确认',
    output: 'Codex 生成 8,920 bytes 单文件、校验 SHA-256、上传并验收；持有人确认 putFile 与 bind。当期 monthlyFee 为 0 BNB。',
  },
])

export const TAPEOUT_XIANGQI_RELEASE = Object.freeze({
  status: 'live',
  tapeId: '122.6',
  tapeName: '122.6.tape',
  publicUrl: 'https://122-6.tapekit.org/',
  statusUrl: 'https://122-6.tapekit.org/.tape/status',
  holder: '0x500Cd93c857DFb31C824475337DeB11Bad755245',
  container: '0xFC74b698d4733e355d250Ed958cE21faf4a0DfD7',
  fileSize: 8920,
  sha256: '74fe37c53365c297425cc20ca179aa7dced0b8bc16154f97be5f7f9ab936bc4d',
  costSummary: Object.freeze({
    protocol: '0.01233 BNB',
    gas: '约 0.000192635 BNB',
    total: '约 0.012522635 BNB',
    note: 'Gas 合计依 BscScan 公开记录汇总，其中前三笔按页面显示精度计算。',
  }),
  transactions: Object.freeze([
    { label: 'Mint 3 NAND', hash: '0xfc006373248d19ecae7ac8494f2dd02265ee5fe11fdfdbbc56a3a0f762c58cdd', value: '0.00013 BNB' },
    { label: 'Tapeout', hash: '0xcee9ce1d50da7d6f720981d52571b6ff639ccd15853a00ec0c24ee6aca861cfe', value: '0.0002 BNB' },
    { label: 'Open container', hash: '0x3e86d44899da6e9c8541e1ce4ceefcdbb99a3af9b6c186aed075eef5bcc607c3', value: '0.012 BNB' },
    { label: 'Put file', hash: '0xa818575230a9e3b424379cbb6c7e6c426a9b809c4e27147cc519fe9f2daf2985', value: '0.000152559125 BNB gas' },
    { label: 'Bind 1 month', hash: '0x87f3c3e3b76c31eb48c18f26a139e3fb72272cf5c1e6d146838d4ca9ad12eada', value: '0 BNB + 0.0000113157102 BNB gas' },
  ]),
})

export const TAPEOUT_XIANGQI_SNAPSHOTS = Object.freeze([
  {
    time: '2026-09-23 09:35 CST',
    title: '快照 01 · 方案冻结',
    detail: '采用“站内公开驾驶舱 + 独立静态上链包”双产物。主网写操作不自动执行。',
  },
  {
    time: '2026-09-23 09:36 CST',
    title: '快照 02 · 可玩内核',
    detail: '完成双人本地对弈的完整走子约束，走子后不允许己方将帅留在被攻击位置。',
  },
  {
    time: '2026-09-23 09:37 CST',
    title: '快照 03 · 公开驾驶舱',
    detail: '交互页能查看计划与实际耗时、责任边界、历史快照，并导出机读 JSON。',
  },
  {
    time: '2026-09-23 09:38 CST',
    title: '快照 04 · 验证完成',
    detail: '核心规则测试、路由登记与生产构建通过，页面进入可分享状态。',
  },
  {
    time: '2026-09-23 09:47 CST',
    title: '快照 05 · 授权路线展开',
    detail: '增加六步授权手册：官方链接、预计耗时、钱包核对项、完成后交接材料，并标注未能核验的控制台入口。',
  },
  {
    time: '2026-09-23 10:47–10:54 CST',
    title: '快照 06 · 电路与容器就绪',
    detail: '持有人依次确认 Mint、Tapeout 和 Open；生成 TapeID 122.6 与 ERC-6551 容器 0xFC74…DfD7。',
  },
  {
    time: '2026-09-23 11:09 CST',
    title: '快照 07 · 单文件写入链上',
    detail: 'Codex 将完整象棋压到 8,920 bytes 并校验 SHA-256；持有人确认 SiteRegistry.putFile，交易成功。',
  },
  {
    time: '2026-09-23 11:31 CST',
    title: '快照 08 · 122.6.tape 激活',
    detail: 'DomainBinding.bind 模拟成功后由持有人确认；合约费 0 BNB，实际 Gas 0.0000113157102 BNB。',
  },
  {
    time: '2026-09-23 11:32 CST',
    title: '快照 09 · 公开网关验收',
    detail: 'https://122-6.tapekit.org/ 已加载链上象棋；实际走出红兵 1:7→1:6，轮次和着法记录均正常。',
  },
])
