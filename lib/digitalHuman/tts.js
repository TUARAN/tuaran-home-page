import {
  DIGITAL_HUMAN_TTS_LANG,
  DIGITAL_HUMAN_TTS_MODEL,
} from './config'

function decodeBase64(value) {
  const binary = atob(String(value || ''))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export async function synthesizeDigitalHumanSpeech(ai, script) {
  if (!ai?.run) throw new Error('WORKERS_AI_UNAVAILABLE')

  const result = await ai.run(DIGITAL_HUMAN_TTS_MODEL, {
    prompt: script,
    lang: DIGITAL_HUMAN_TTS_LANG,
  })

  if (result?.audio) {
    const bytes = decodeBase64(result.audio)
    if (bytes.byteLength > 0) return bytes
  }
  if (typeof result === 'string' && result) {
    const bytes = decodeBase64(result)
    if (bytes.byteLength > 0) return bytes
  }
  if (result instanceof ArrayBuffer) return new Uint8Array(result)
  if (ArrayBuffer.isView(result)) {
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength)
  }

  throw new Error('TTS_EMPTY_AUDIO')
}
