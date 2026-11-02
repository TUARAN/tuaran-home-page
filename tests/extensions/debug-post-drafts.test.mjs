import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const poster = require('../../tools/x-reply-clipboard-extension/poster.js')
test('debug X and Xiaohongshu tasks save image drafts without touching the X composer', async () => {
  const prior = {chrome:globalThis.chrome, document:globalThis.document, FileReader:globalThis.FileReader, cards:globalThis.XrcXhsCards, image:globalThis.XInteractionPostImage}
  const storage = {}
  globalThis.chrome = {storage:{local:{get:async key=>({[key]:storage[key]}),set:async values=>Object.assign(storage,values)}}}
  globalThis.document = new Proxy({}, {get(){throw new Error('must not access X composer')}})
  globalThis.XrcXhsCards = {render:async()=>['data:image/png;base64,eGhz']}
  globalThis.XInteractionPostImage = {createPostCard:async()=>({})}
  globalThis.FileReader = class {readAsDataURL(){this.result='data:image/png;base64,eA==';this.onload()}}
  try {
    for (const kind of ['x','xhs']) {
      poster.setPostKind(kind)
      assert.equal(await poster.publishPost('标题\n\n正文'), 'draft-saved')
      assert.equal(storage.xrcDebugDrafts[0].kind, kind)
      assert.equal(storage.xrcDebugDrafts[0].status, 'draft')
      assert.equal(storage.xrcDebugDrafts[0].images.length, 1)
      assert.equal(poster.snapshot().count, 0)
    }
    assert.equal(storage.xrcDebugDrafts.length, 2)
  } finally {
    globalThis.chrome=prior.chrome;globalThis.document=prior.document;globalThis.FileReader=prior.FileReader;globalThis.XrcXhsCards=prior.cards;globalThis.XInteractionPostImage=prior.image
    poster.setPostKind('normal')
  }
})
