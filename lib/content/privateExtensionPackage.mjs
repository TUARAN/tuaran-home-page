import { X_REPLY_EXTENSION_PACKAGE } from '../generated/xReplyExtensionPackage.js'

// This bucket must remain private; callers authorize the download before reading bytes.
export async function readPrivateExtensionPackage(bucket, objectKey) {
  if (objectKey !== X_REPLY_EXTENSION_PACKAGE.objectKey) return null
  const object = await bucket.get(objectKey)
  if (!object) return null
  const bytes = new Uint8Array(await object.arrayBuffer())
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  if (bytes.byteLength !== X_REPLY_EXTENSION_PACKAGE.size || sha256 !== X_REPLY_EXTENSION_PACKAGE.sha256) {
    throw new Error('Private extension package integrity check failed')
  }
  return { ...X_REPLY_EXTENSION_PACKAGE, bytes }
}
