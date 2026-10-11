/**
 * 单笔快照的名义与占比。
 * 名义 = |数量| × 标记价。占比以该快照全部持仓的毛名义为分母。空头权重为负。
 */

export function positionNotional(position) {
  return Math.abs(position.qty) * position.mark
}

export function positionBook(snapshot) {
  const rows = snapshot.positions.map((position) => ({
    ...position,
    notional: positionNotional(position),
  }))
  const gross = rows.reduce((sum, row) => sum + row.notional, 0)
  const margin = rows.reduce((sum, row) => sum + row.margin, 0)
  const pnl = rows.reduce((sum, row) => sum + row.pnl, 0)
  return {
    asOf: snapshot.asOf,
    venueLabel: snapshot.venueLabel,
    marginMode: snapshot.marginMode,
    gross,
    margin,
    pnl,
    rows: rows.map((row) => ({
      ...row,
      weight: gross ? row.notional / gross : 0,
      signedWeight: gross ? (row.side === 'short' ? -1 : 1) * row.notional / gross : 0,
    })),
  }
}

export function signedWeightForUnderlying(underlying, snapshot) {
  const row = positionBook(snapshot).rows.find((item) => item.underlying === underlying)
  return row ? row.signedWeight : null
}

export function applyPositionWeights(quotes, snapshot) {
  return (quotes || []).map((quote) => {
    const signedWeight = signedWeightForUnderlying(quote.symbol, snapshot)
    return signedWeight == null ? quote : { ...quote, weight: signedWeight }
  })
}
