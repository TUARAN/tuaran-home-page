import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  TAPEOUT_XIANGQI_PLAN,
  createInitialPieces,
  isInCheck,
  isLegalMove,
  legalMovesForPiece,
  movePiece,
} from '../lib/tapeoutXiangqi.js'

test('initial board contains 32 pieces and red moves first', () => {
  const pieces = createInitialPieces()
  assert.equal(pieces.length, 32)
  assert.equal(pieces.filter((piece) => piece.color === 'red').length, 16)
  assert.equal(isInCheck(pieces, 'red'), false)
  assert.equal(isInCheck(pieces, 'black'), false)
})

test('horse leg, elephant eye and river boundaries are enforced', () => {
  const pieces = createInitialPieces()
  assert.equal(isLegalMove(pieces, 'r-horse-1', 7, 2, 'red'), true)
  assert.equal(isLegalMove(pieces, 'r-horse-1', 8, 3, 'red'), false)
  assert.equal(isLegalMove(pieces, 'r-elephant-2', 7, 4, 'red'), true)
  assert.equal(isLegalMove(pieces, 'r-elephant-2', 6, 4, 'red'), false)
  assert.equal(isLegalMove(pieces, 'r-pawn-0', 6, 1, 'red'), false)
})

test('cannon needs exactly one screen to capture', () => {
  const pieces = createInitialPieces()
  assert.equal(isLegalMove(pieces, 'r-cannon-1', 0, 1, 'red'), true)
  assert.equal(isLegalMove(pieces, 'r-cannon-1', 2, 1, 'red'), false)
})

test('move result changes the turn and records notation', () => {
  const pieces = createInitialPieces()
  const result = movePiece(pieces, 'r-pawn-0', 5, 0, 'red')
  assert.ok(result)
  assert.equal(result.turn, 'black')
  assert.match(result.notation, /兵/)
  assert.equal(legalMovesForPiece(result.pieces, 'b-pawn-0', 'black').length > 0, true)
})

test('public dashboard keeps execution times and human authorization gates visible', () => {
  assert.ok(TAPEOUT_XIANGQI_PLAN.some((step) => step.owner === 'human' && step.status === 'waiting'))
  assert.ok(TAPEOUT_XIANGQI_PLAN.every((step) => step.planned && step.actual))
  const source = readFileSync('app/(site)/tapeout-xiangqi/TapeoutXiangqiClient.jsx', 'utf8')
  assert.match(source, /下载 JSON 快照/)
  assert.match(source, /不要发私钥、助记词或钱包备份/)
  assert.match(source, /立即试玩/)
  assert.match(source, /https:\/\/tapeout\.net\/#containers/)
  assert.match(source, /Container Opener/)
  assert.match(source, /SiteRegistry/)
  assert.match(source, /DomainBinding/)
  assert.match(source, /预计人工参与约 30–60 分钟/)
  assert.match(source, /viewBox="0 0 900 1000"/)
  assert.match(source, /M350 50 L550 250/)
  assert.match(source, /BOARD_MARKERS/)
})
