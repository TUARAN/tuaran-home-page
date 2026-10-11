export const MAX_UTTERANCE_LENGTH = 140

export function stripMarkdownForSpeech(markdown) {
  if (!markdown) return ''
  return String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitSpeechText(text, maxLength = MAX_UTTERANCE_LENGTH) {
  if (!text) return []
  const units = text.match(/[^。！？!?；;，,\n]+[。！？!?；;，,\n]?/g) || [text]
  const chunks = []
  let current = ''
  for (const unit of units) {
    if ((current + unit).length <= maxLength) {
      current += unit
      continue
    }
    if (current) chunks.push(current.trim())
    if (unit.length <= maxLength) {
      current = unit
      continue
    }
    for (let i = 0; i < unit.length; i += maxLength) {
      const part = unit.slice(i, i + maxLength).trim()
      if (part) chunks.push(part)
    }
    current = ''
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export function pickChineseVoice(voices) {
  if (!Array.isArray(voices) || !voices.length) return null
  return (
    voices.find((voice) => /^zh(-|_)/i.test(voice.lang)) ||
    voices.find((voice) => /^yue(-|_)/i.test(voice.lang)) ||
    voices[0]
  )
}
