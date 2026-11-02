import { INTERACTIVE_DIRECTORY_PATHS } from '../site/engineeringWorks.js'
import { isToolDirectoryItem } from './resourceDirectory.js'

const INTERACTIVE_HREFS = new Set(INTERACTIVE_DIRECTORY_PATHS.map((href) => href.split(/[?#]/)[0]))

export function isResourceDirectoryItem(item) {
  const href = String(item.href || '').split(/[?#]/)[0]
  return !isToolDirectoryItem(item)
    && !INTERACTIVE_HREFS.has(href)
    && item.contentKind !== 'interactive'
}
