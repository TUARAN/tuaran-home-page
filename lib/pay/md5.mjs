/**
 * 纯 JS MD5（无依赖，Edge 运行时可用）。
 * Cloudflare Workers / next-on-pages 的 Edge 运行时没有 node:crypto，
 * 而国内聚合支付网关的签名普遍是 MD5(参数串 + key)，所以这里自带一份。
 * 只在服务端签/验签使用，不要拿它做任何密码学安全用途。
 */

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const K = [
  -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426,
  -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162,
  1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
  643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
  568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784,
  1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
  -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222,
  -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
  -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
  -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649,
  -145523070, -1120210379, 718787259, -343485551,
]

function cycle(state, block) {
  let a = state[0]
  let b = state[1]
  let c = state[2]
  let d = state[3]

  for (let i = 0; i < 64; i += 1) {
    let f
    let g
    if (i < 16) {
      f = (b & c) | (~b & d)
      g = i
    } else if (i < 32) {
      f = (d & b) | (~d & c)
      g = (5 * i + 1) % 16
    } else if (i < 48) {
      f = b ^ c ^ d
      g = (3 * i + 5) % 16
    } else {
      f = c ^ (b | ~d)
      g = (7 * i) % 16
    }
    const prev = d
    d = c
    c = b
    const sum = a + f + K[i] + block[g]
    const rotate = (sum << S[i]) | (sum >>> (32 - S[i]))
    b = b + rotate
    a = prev
  }

  state[0] = state[0] + a
  state[1] = state[1] + b
  state[2] = state[2] + c
  state[3] = state[3] + d
}

function toHex(n) {
  const HEX = '0123456789abcdef'
  let out = ''
  for (let j = 0; j < 4; j += 1) {
    out += HEX.charAt((n >> (j * 8 + 4)) & 0x0f) + HEX.charAt((n >> (j * 8)) & 0x0f)
  }
  return out
}

/** @param {Uint8Array} bytes */
function digest(bytes) {
  const len = bytes.length
  const paddedLength = len + 1 + ((56 - ((len + 1) % 64) + 64) % 64) + 8
  const buf = new Uint8Array(paddedLength)
  buf.set(bytes)
  buf[len] = 0x80
  // 64 位小端长度（bit）
  const lo = (len << 3) >>> 0
  const hi = Math.floor((len * 8) / 4294967296)
  buf[paddedLength - 8] = lo & 0xff
  buf[paddedLength - 7] = (lo >>> 8) & 0xff
  buf[paddedLength - 6] = (lo >>> 16) & 0xff
  buf[paddedLength - 5] = (lo >>> 24) & 0xff
  buf[paddedLength - 4] = hi & 0xff
  buf[paddedLength - 3] = (hi >>> 8) & 0xff
  buf[paddedLength - 2] = (hi >>> 16) & 0xff
  buf[paddedLength - 1] = (hi >>> 24) & 0xff

  const state = [1732584193, -271733879, -1732584194, 271733878]
  const block = new Array(16)
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let j = 0; j < 16; j += 1) {
      const p = offset + j * 4
      block[j] = buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16) | (buf[p + 3] << 24)
    }
    cycle(state, block)
  }
  return toHex(state[0]) + toHex(state[1]) + toHex(state[2]) + toHex(state[3])
}

/** @param {string} input */
export function md5(input) {
  const str = String(input ?? '')
  const bytes = new TextEncoder().encode(str)
  return digest(bytes)
}

export function md5Hex(input) {
  return md5(input)
}
