import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { loadXExtensionReleaseWeeks } from '../../lib/community/xExtensionReleaseWeeks.js'
import { X_EXTENSION_LATEST_VERSION } from '../../lib/community/xExtensionVersion.js'
import { X_REPLY_EXTENSION_PACKAGE } from '../../lib/generated/xReplyExtensionPackage.js'

test('resource introduction and docs distinguish packaged version from local source', async () => {
  const intro = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/page.jsx', import.meta.url), 'utf8')
  const docs = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', import.meta.url), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('../../tools/x-reply-clipboard-extension/manifest.json', import.meta.url), 'utf8'))
  const packageVersion = X_REPLY_EXTENSION_PACKAGE.fileName.match(/-v(\d+\.\d+\.\d+)\.zip$/u)?.[1]
  const recentReleases = loadXExtensionReleaseWeeks().flatMap((week) => week.entries)

  assert.equal(manifest.version, X_EXTENSION_LATEST_VERSION)
  assert.ok(packageVersion)
  assert.notEqual(packageVersion, X_EXTENSION_LATEST_VERSION)
  assert.equal(recentReleases[0].version, `v${X_EXTENSION_LATEST_VERSION}`)
  assert.match(intro, /X_REPLY_EXTENSION_PACKAGE\.fileName\.match/)
  assert.match(intro, /loadXExtensionReleaseWeeks\(\)/)
  assert.match(intro, /本地开发版：六组十七项任务/)
  assert.match(docs, /X_REPLY_EXTENSION_PACKAGE\.fileName\.match/)
  assert.match(docs, /当前功能说明按本地源码 v\{SOURCE_VERSION\}/)
  assert.match(docs, /id="pace-community-share"/)
  assert.match(docs, /真实 X 页面联调阶段/)
  assert.doesNotMatch(docs, /当前说明核对至本地 v4\.3\.24|站内下载包仍是 v3|汇总 9 项任务/)
})
