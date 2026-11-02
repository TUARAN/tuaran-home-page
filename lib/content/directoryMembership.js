import { INTERACTIVE_DIRECTORY_WORKS } from '../site/engineeringWorks.js'
import { isToolDirectoryItem } from './resourceDirectory.js'

const INTERACTIVE_HREFS = new Set(INTERACTIVE_DIRECTORY_WORKS.map((work) => work.href.split(/[?#]/)[0]))

export function isResourceDirectoryItem(item) {
  const href = String(item.href || '').split(/[?#]/)[0]
  return !isToolDirectoryItem(item)
    && !INTERACTIVE_HREFS.has(href)
    && item.contentKind !== 'interactive'
}
