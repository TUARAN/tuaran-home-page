import assert from 'node:assert/strict'
import test from 'node:test'

import {
  bloggerEyeConnectionFailure,
  queryBloggerEyeLoopbackPermission,
} from '../lib/bloggerEyeBrowser.mjs'

test('优先读取 Chrome 的回环网络权限', async () => {
  const calls = []
  const status = { state: 'granted' }
  const result = await queryBloggerEyeLoopbackPermission({
    async query({ name }) {
      calls.push(name)
      return status
    },
  })

  assert.deepEqual(calls, ['loopback-network'])
  assert.equal(result.state, 'granted')
  assert.equal(result.status, status)
})

test('旧版 Chrome 回退到 local-network-access 权限名', async () => {
  const calls = []
  const result = await queryBloggerEyeLoopbackPermission({
    async query({ name }) {
      calls.push(name)
      if (name === 'loopback-network') throw new TypeError('unsupported permission name')
      return { state: 'prompt' }
    },
  })

  assert.deepEqual(calls, ['loopback-network', 'local-network-access'])
  assert.equal(result.state, 'prompt')
})

test('权限 API 不可用时仍允许继续探测服务', async () => {
  assert.deepEqual(await queryBloggerEyeLoopbackPermission(undefined), {
    state: 'unsupported',
    status: null,
  })
})

test('权限拒绝与服务离线使用不同提示', () => {
  assert.equal(bloggerEyeConnectionFailure('denied').state, 'denied')
  assert.match(bloggerEyeConnectionFailure('denied').detail, /本地网络访问/)
  assert.equal(bloggerEyeConnectionFailure('granted').state, 'offline')
})
