/** Append or replace a STORED (uncompressed) entry in a ZIP ArrayBuffer/Uint8Array. Edge-safe, no deps. */

const enc = new TextEncoder()

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let crc = index
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)
    table[index] = crc >>> 0
  }
  return table
})()

export function crc32(bytes) {
  let crc = 0xffffffff
  for (let index = 0; index < bytes.length; index += 1) crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function u16(view, offset, value) {
  view.setUint16(offset, value, true)
}

function u32(view, offset, value) {
  view.setUint32(offset, value, true)
}

function readU16(view, offset) {
  return view.getUint16(offset, true)
}

function readU32(view, offset) {
  return view.getUint32(offset, true)
}

function findEndOfCentralDirectory(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const min = Math.max(0, bytes.length - (64 * 1024 + 22))
  for (let offset = bytes.length - 22; offset >= min; offset -= 1) {
    if (readU32(view, offset) !== 0x06054b50) continue
    const commentLength = readU16(view, offset + 20)
    if (offset + 22 + commentLength !== bytes.length) continue
    return {
      offset,
      diskEntries: readU16(view, offset + 8),
      totalEntries: readU16(view, offset + 10),
      centralSize: readU32(view, offset + 12),
      centralOffset: readU32(view, offset + 16),
      commentLength,
    }
  }
  throw new Error('ZIP_EOCD_NOT_FOUND')
}

function listCentralEntries(bytes, eocd) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const entries = []
  let cursor = eocd.centralOffset
  for (let index = 0; index < eocd.totalEntries; index += 1) {
    if (readU32(view, cursor) !== 0x02014b50) throw new Error('ZIP_CENTRAL_CORRUPT')
    const fileNameLength = readU16(view, cursor + 28)
    const extraLength = readU16(view, cursor + 30)
    const commentLength = readU16(view, cursor + 32)
    const localOffset = readU32(view, cursor + 42)
    const fileName = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + fileNameLength))
    const recordSize = 46 + fileNameLength + extraLength + commentLength
    entries.push({ fileName, localOffset, recordStart: cursor, recordSize, recordBytes: bytes.subarray(cursor, cursor + recordSize) })
    cursor += recordSize
  }
  return entries
}

function localRecordSize(bytes, localOffset) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (readU32(view, localOffset) !== 0x04034b50) throw new Error('ZIP_LOCAL_CORRUPT')
  const method = readU16(view, localOffset + 8)
  const flags = readU16(view, localOffset + 6)
  const compressedSize = readU32(view, localOffset + 18)
  const fileNameLength = readU16(view, localOffset + 26)
  const extraLength = readU16(view, localOffset + 28)
  let dataSize = compressedSize
  // Data descriptor: rare for our packages; reject rather than guess wrong.
  if (flags & 0x8) throw new Error('ZIP_DATA_DESCRIPTOR_UNSUPPORTED')
  if (method !== 0 && method !== 8) throw new Error('ZIP_METHOD_UNSUPPORTED')
  return 30 + fileNameLength + extraLength + dataSize
}

function buildStoredLocalAndCentral(fileName, content, localOffset) {
  const nameBytes = enc.encode(fileName)
  const crc = crc32(content)
  const local = new Uint8Array(30 + nameBytes.length + content.length)
  const localView = new DataView(local.buffer)
  u32(localView, 0, 0x04034b50)
  u16(localView, 4, 20)
  u16(localView, 6, 0)
  u16(localView, 8, 0)
  u16(localView, 10, 0)
  u16(localView, 12, 0)
  u32(localView, 14, crc)
  u32(localView, 18, content.length)
  u32(localView, 22, content.length)
  u16(localView, 26, nameBytes.length)
  u16(localView, 28, 0)
  local.set(nameBytes, 30)
  local.set(content, 30 + nameBytes.length)

  const central = new Uint8Array(46 + nameBytes.length)
  const centralView = new DataView(central.buffer)
  u32(centralView, 0, 0x02014b50)
  u16(centralView, 4, 20)
  u16(centralView, 6, 20)
  u16(centralView, 8, 0)
  u16(centralView, 10, 0)
  u16(centralView, 12, 0)
  u16(centralView, 14, 0)
  u32(centralView, 16, crc)
  u32(centralView, 20, content.length)
  u32(centralView, 24, content.length)
  u16(centralView, 28, nameBytes.length)
  u16(centralView, 30, 0)
  u16(centralView, 32, 0)
  u16(centralView, 34, 0)
  u16(centralView, 36, 0)
  u32(centralView, 38, 0)
  u32(centralView, 42, localOffset)
  central.set(nameBytes, 46)
  return { local, central }
}

/**
 * Inject a STORED file into zip bytes. Replaces an existing same-name entry.
 * @param {Uint8Array|ArrayBuffer} input
 * @param {string} fileName
 * @param {Uint8Array|string} content
 */
export function injectZipStoredFile(input, fileName, content) {
  const source = input instanceof Uint8Array ? input : new Uint8Array(input)
  const payload = typeof content === 'string' ? enc.encode(content) : content
  const eocd = findEndOfCentralDirectory(source)
  const entries = listCentralEntries(source, eocd)
  const kept = entries.filter((entry) => entry.fileName !== fileName)

  const parts = []
  const offsets = new Map()
  for (const entry of kept) {
    const size = localRecordSize(source, entry.localOffset)
    const nextOffset = parts.reduce((sum, part) => sum + part.length, 0)
    offsets.set(entry.fileName, nextOffset)
    parts.push(source.subarray(entry.localOffset, entry.localOffset + size))
  }

  const newLocalOffset = parts.reduce((sum, part) => sum + part.length, 0)
  const built = buildStoredLocalAndCentral(fileName, payload, newLocalOffset)
  parts.push(built.local)

  const centralParts = []
  for (const entry of kept) {
    const record = new Uint8Array(entry.recordBytes)
    u32(new DataView(record.buffer), 42, offsets.get(entry.fileName))
    centralParts.push(record)
  }
  centralParts.push(built.central)

  const centralOffset = parts.reduce((sum, part) => sum + part.length, 0)
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const totalEntries = kept.length + 1
  const eocdBytes = new Uint8Array(22)
  const eocdView = new DataView(eocdBytes.buffer)
  u32(eocdView, 0, 0x06054b50)
  u16(eocdView, 4, 0)
  u16(eocdView, 6, 0)
  u16(eocdView, 8, totalEntries)
  u16(eocdView, 10, totalEntries)
  u32(eocdView, 12, centralSize)
  u32(eocdView, 16, centralOffset)
  u16(eocdView, 20, 0)

  const total = centralOffset + centralSize + 22
  const output = new Uint8Array(total)
  let cursor = 0
  for (const part of parts) {
    output.set(part, cursor)
    cursor += part.length
  }
  for (const part of centralParts) {
    output.set(part, cursor)
    cursor += part.length
  }
  output.set(eocdBytes, cursor)
  return output
}

export function communitySecretLocalJson(secret) {
  return `${JSON.stringify({ secret: String(secret || '').trim() }, null, 2)}\n`
}
