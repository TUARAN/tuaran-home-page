import { X_REPLY_EXTENSION_PACKAGE } from '../generated/xReplyExtensionPackage.js'
import { SYNCBLOG_EXTENSION_PACKAGE } from '../generated/syncblogExtensionPackage.js'
export const MANAGED_EXTENSIONS = Object.freeze({
  x: { id: 'x', title: 'X 高频互动助手', resourceKey: 'resource:x-reply-clipboard-extension', href: '/resources/x-reply-clipboard-extension', docs: '/resources/x-reply-clipboard-extension/docs', release: X_REPLY_EXTENSION_PACKAGE },
  'ai-distributor': { id: 'ai-distributor', title: 'AI 分发大师', resourceKey: 'resource:syncblog-publisher', href: '/tools/syncblog-publisher', docs: '/tools/syncblog-publisher/docs', release: SYNCBLOG_EXTENSION_PACKAGE },
})
export const privateExtensionReleaseForKey = key => Object.values(MANAGED_EXTENSIONS).find(item => item.release.objectKey === key)?.release
export const isManagedExtensionResource = key => Object.values(MANAGED_EXTENSIONS).some(item => item.resourceKey === key)
