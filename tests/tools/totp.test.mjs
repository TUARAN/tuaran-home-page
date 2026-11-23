import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildOtpAuthUri,
  decodeBase32,
  dynamicTruncate,
  encodeBase32,
  explainTotp,
  formatCode,
  generateHotp,
  generateSecret,
  generateTotp,
  normalizeBase32,
  parseOtpAuthUri,
  verifyTotp,
} from '../../lib/tools/totp.js'

const ASCII = (value) => new TextEncoder().encode(value)

const RFC_SHA1_SECRET = '12345678901234567890'
const RFC_SHA256_SECRET = '12345678901234567890123456789012'
const RFC_SHA512_SECRET = '1234567890123456789012345678901234567890123456789012345678901234'

// RFC 附录给的是 ASCII 密钥，实现层统一收 Base32，所以先编码再喂进去。
const toBase32 = (plain) => encodeBase32(ASCII(plain))
const RFC_SHA1_BASE32 = toBase32(RFC_SHA1_SECRET)
const RFC_SHA256_BASE32 = toBase32(RFC_SHA256_SECRET)
const RFC_SHA512_BASE32 = toBase32(RFC_SHA512_SECRET)

const RFC_6238_VECTORS = [
  { timestamp: 59, sha1: '94287082', sha256: '46119246', sha512: '90693936' },
  { timestamp: 1111111109, sha1: '07081804', sha256: '68084774', sha512: '25091201' },
  { timestamp: 1111111111, sha1: '14050471', sha256: '67062674', sha512: '99943326' },
  { timestamp: 1234567890, sha1: '89005924', sha256: '91819424', sha512: '93441116' },
  { timestamp: 2000000000, sha1: '69279037', sha256: '90698825', sha512: '38618901' },
  { timestamp: 20000000000, sha1: '65353130', sha256: '77737706', sha512: '47863826' },
]

test('Base32 编解码符合 RFC 4648 测试向量', () => {
  const vectors = [
    ['', ''],
    ['f', 'MY'],
    ['fo', 'MZXQ'],
    ['foo', 'MZXW6'],
    ['foob', 'MZXW6YQ'],
    ['fooba', 'MZXW6YTB'],
    ['foobar', 'MZXW6YTBOI'],
  ]
  for (const [plain, encoded] of vectors) {
    assert.equal(encodeBase32(ASCII(plain)), encoded, plain)
    assert.equal(new TextDecoder().decode(decodeBase32(encoded)), plain, encoded)
  }
})

test('Base32 输入容忍空格、连字符、等号和小写', () => {
  assert.equal(normalizeBase32('jbsw y3dp-ehpk3pxp=='), 'JBSWY3DPEHPK3PXP')
  assert.equal(decodeBase32('jbsw y3dp-ehpk3pxp').length, 10)
  assert.throws(() => decodeBase32('JBSW1Y3D'), /A-Z 和 2-7/)
  assert.equal(decodeBase32('   ').length, 0)
})

test('HOTP 与 RFC 4226 附录 D 的 10 个向量一致', async () => {
  const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489']
  for (const [counter, code] of expected.entries()) {
    assert.equal(await generateHotp({ secret: RFC_SHA1_BASE32, counter, digits: 6, algorithm: 'SHA1' }), code, `counter=${counter}`)
  }
})

test('TOTP 与 RFC 6238 附录 B 的 SHA1/SHA256/SHA512 向量一致', async () => {
  for (const vector of RFC_6238_VECTORS) {
    const cases = [
      ['SHA1', RFC_SHA1_BASE32, vector.sha1],
      ['SHA256', RFC_SHA256_BASE32, vector.sha256],
      ['SHA512', RFC_SHA512_BASE32, vector.sha512],
    ]
    for (const [algorithm, secret, code] of cases) {
      const result = await generateTotp({
        secret,
        timestamp: vector.timestamp * 1000,
        digits: 8,
        period: 30,
        algorithm,
      })
      assert.equal(result.code, code, `${algorithm} @ ${vector.timestamp}`)
    }
  }
})

test('时间步、剩余毫秒和到期时间按周期推进', async () => {
  const result = await generateTotp({ secret: 'JBSWY3DPEHPK3PXP', timestamp: 1_700_000_000_000, period: 30, digits: 6 })
  assert.equal(result.counter, Math.floor(1_700_000_000 / 30))
  assert.equal(result.expiresAt, (result.counter + 1) * 30 * 1000)
  assert.equal(result.remainingMs, result.expiresAt - 1_700_000_000_000)
  assert.match(result.code, /^\d{6}$/)

  const boundary = await generateTotp({ secret: 'JBSWY3DPEHPK3PXP', timestamp: 1_700_000_010_000, period: 30, digits: 6 })
  assert.equal(boundary.counter, result.counter + 1)
  assert.equal(boundary.remainingMs, 30_000)
})

test('解释用的中间量与最终验证码一致', async () => {
  const timestamp = 1_700_000_000_000
  const trace = await explainTotp({ secret: 'JBSWY3DPEHPK3PXP', timestamp, digits: 6 })
  const result = await generateTotp({ secret: 'JBSWY3DPEHPK3PXP', timestamp, digits: 6 })

  assert.equal(trace.code, result.code)
  assert.equal(trace.counterHex.length, 16)
  assert.equal(trace.digestHex.length, trace.digestLength * 2)
  assert.equal(trace.digestLength, 20)
  assert.equal(trace.truncatedHex.length, 8)
  assert.ok(trace.offset >= 0 && trace.offset <= 15)

  const digest = Uint8Array.from(trace.digestHex.match(/../g).map((pair) => Number.parseInt(pair, 16)))
  const { offset, binary } = dynamicTruncate(digest)
  assert.equal(offset, trace.offset)
  assert.equal(binary, trace.binary)
  assert.equal(String(binary % 1_000_000).padStart(6, '0'), trace.code)
})

test('verifyTotp 接受当前与相邻时间步，拒绝越窗和错码', async () => {
  const secret = 'JBSWY3DPEHPK3PXP'
  const timestamp = 1_700_000_000_000
  const current = await generateTotp({ secret, timestamp, digits: 6 })
  const previous = await generateTotp({ secret, timestamp: timestamp - 30_000, digits: 6 })
  const next = await generateTotp({ secret, timestamp: timestamp + 30_000, digits: 6 })
  const far = await generateTotp({ secret, timestamp: timestamp - 90_000, digits: 6 })

  const exact = await verifyTotp({ secret, token: current.code, timestamp, window: 1 })
  assert.deepEqual([exact.valid, exact.offset], [true, 0])

  const loose = await verifyTotp({ secret, token: previous.code, timestamp, window: 1 })
  assert.deepEqual([loose.valid, loose.offset], [true, -1])

  const ahead = await verifyTotp({ secret, token: next.code, timestamp, window: 1 })
  assert.deepEqual([ahead.valid, ahead.offset], [true, 1])

  const strict = await verifyTotp({ secret, token: previous.code, timestamp, window: 0 })
  assert.equal(strict.valid, false)
  assert.equal(strict.reason, 'mismatch')
  assert.equal(strict.expected, current.code)

  const outOfWindow = await verifyTotp({ secret, token: far.code, timestamp, window: 2 })
  assert.equal(outOfWindow.valid, false)

  const wrongFormat = await verifyTotp({ secret, token: '12345', timestamp, digits: 6 })
  assert.deepEqual([wrongFormat.valid, wrongFormat.reason], [false, 'format'])

  const spaced = await verifyTotp({ secret, token: formatCode(current.code), timestamp, digits: 6 })
  assert.equal(spaced.valid, true)
})

test('8 位验证码和自定义周期同样通过校验', async () => {
  const secret = 'JBSWY3DPEHPK3PXP'
  const timestamp = 1_700_000_000_000
  const code = await generateTotp({ secret, timestamp, digits: 8, period: 60 })
  assert.match(code.code, /^\d{8}$/)
  assert.equal(code.counter, Math.floor(1_700_000_000 / 60))

  const verified = await verifyTotp({ secret, token: code.code, timestamp, digits: 8, period: 60, window: 0 })
  assert.equal(verified.valid, true)
})

test('otpauth 链接可解析并往返重建', () => {
  const parsed = parseOtpAuthUri(
    'otpauth://totp/GitHub:tuaran?secret=JBSW%20Y3DP-EHPK3PXP&issuer=GitHub&algorithm=SHA256&digits=8&period=60',
  )
  assert.equal(parsed.issuer, 'GitHub')
  assert.equal(parsed.account, 'tuaran')
  assert.equal(parsed.secret, 'JBSWY3DPEHPK3PXP')
  assert.equal(parsed.algorithm, 'SHA256')
  assert.equal(parsed.digits, 8)
  assert.equal(parsed.period, 60)

  const rebuilt = buildOtpAuthUri({ secret: parsed.secret, issuer: parsed.issuer, account: parsed.account, algorithm: 'SHA256', digits: 8, period: 60 })
  const roundTrip = parseOtpAuthUri(rebuilt)
  assert.deepEqual(
    { secret: roundTrip.secret, issuer: roundTrip.issuer, account: roundTrip.account, algorithm: roundTrip.algorithm, digits: roundTrip.digits, period: roundTrip.period },
    { secret: 'JBSWY3DPEHPK3PXP', issuer: 'GitHub', account: 'tuaran', algorithm: 'SHA256', digits: 8, period: 60 },
  )

  assert.throws(() => parseOtpAuthUri('https://example.com'), /otpauth/)
  assert.throws(() => parseOtpAuthUri('otpauth://totp/demo?digits=6'), /secret/)
  assert.throws(() => parseOtpAuthUri('otpauth://totp/demo?secret=JBSWY3DPEHPK3PXP&digits=7'), /6 位或 8 位/)
})

test('随机密钥是 160 位 Base32，且每次不同', () => {
  const first = generateSecret()
  const second = generateSecret()
  assert.match(first, /^[A-Z2-7]{32}$/)
  assert.notEqual(first, second)
  assert.equal(decodeBase32(first).length, 20)
})

test('非法位数、周期和算法会被拒绝', async () => {
  await assert.rejects(() => generateTotp({ secret: 'JBSWY3DPEHPK3PXP', digits: 7 }), /6 位或 8 位/)
  await assert.rejects(() => generateTotp({ secret: 'JBSWY3DPEHPK3PXP', period: 0 }), /1 到 300 秒/)
  await assert.rejects(() => generateTotp({ secret: 'JBSWY3DPEHPK3PXP', algorithm: 'MD5' }), /SHA1/)
})

test('验证码分组显示不丢字符', () => {
  assert.equal(formatCode('123456'), '123 456')
  assert.equal(formatCode('12345678'), '1234 5678')
  assert.equal(formatCode(''), ' ')
})
