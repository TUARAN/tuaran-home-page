import { ADDITIONAL_CLASSICAL_ORIGINALS } from './additionalClassicalOriginals'
import { EXTRA_CLASSICAL_ORIGINALS } from './extraClassicalOriginals'
import { POETRY_PEAK_WORKS } from './legacyPoetryOriginals'

function cleanTitle(title) {
  return title.replace(/[《》]/g, '').replace('将近酒', '将进酒')
}

function originalSearchUrl(title) {
  return `https://www.gushiwen.cn/search.aspx?value=${encodeURIComponent(cleanTitle(title))}`
}

const legacyOriginalsByTitle = new Map(
  POETRY_PEAK_WORKS.map((item, index) => [
    cleanTitle(item.title),
    {
      originalTitle: item.title,
      originalId: `poetry-peak-${index + 1}`,
      originalText: item.content,
      sourceUrl: item.sourceUrl || originalSearchUrl(item.title),
    },
  ])
)

const additionalOriginalsByTitle = new Map(
  Object.entries(ADDITIONAL_CLASSICAL_ORIGINALS).map(([title, originalText]) => [
    title,
    {
      originalText,
      sourceUrl: originalSearchUrl(title),
    },
  ])
)

const extraOriginalsByTitle = new Map(
  Object.entries(EXTRA_CLASSICAL_ORIGINALS).map(([title, original]) => [
    title,
    {
      sourceUrl: original.sourceUrl || originalSearchUrl(title),
      originalText: original.originalText,
    },
  ])
)

const originalsByTitle = new Map([
  ...legacyOriginalsByTitle,
  ...additionalOriginalsByTitle,
  ...extraOriginalsByTitle,
])

export function getClassicalOriginal(title) {
  const normalizedTitle = cleanTitle(title)
  return (
    originalsByTitle.get(normalizedTitle) || {
      sourceUrl: originalSearchUrl(title),
    }
  )
}
