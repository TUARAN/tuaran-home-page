import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_BLOGGER_EYE_ALLOWED_HOSTS,
  parseBloggerEyeAllowedHosts,
  parseBloggerEyeRunnerConfig,
  runBloggerEyeRegionalChecks,
  validateBloggerEyeCloudTarget,
  visitBloggerEyeTarget,
} from '../lib/bloggerEyeCloud.mjs'

test('云端小眼睛默认只允许本站及其子域', () => {
  assert.deepEqual(DEFAULT_BLOGGER_EYE_ALLOWED_HOSTS, ['2aran.com', '*.2aran.com'])
  assert.equal(validateBloggerEyeCloudTarget('https://2aran.com/articles').hostname, '2aran.com')
  assert.equal(validateBloggerEyeCloudTarget('https://admin.2aran.com/admin').hostname, 'admin.2aran.com')
  assert.throws(
    () => validateBloggerEyeCloudTarget('https://2aran.com.evil.test/'),
    /不在授权域名范围/,
  )
})

test('地区 Runner 配置只接受去重后的公网 HTTPS 端点', () => {
  const config = JSON.stringify([
    { id: 'hkg', label: '香港', url: 'https://hkg-runner.example.com/api/check' },
    { id: 'hkg', label: '重复', url: 'https://duplicate.example.com/api/check' },
    { id: 'local', url: 'https://127.0.0.1/api/check' },
    { id: 'plain', url: 'http://runner.example.com/api/check' },
  ])
  assert.deepEqual(parseBloggerEyeRunnerConfig(config), [
    { id: 'hkg', label: '香港', url: 'https://hkg-runner.example.com/api/check' },
  ])
})

test('地区检查向每个 Runner 发送同一授权目标并隔离单点失败', async () => {
  const calls = []
  const results = await runBloggerEyeRegionalChecks({
    targetUrl: 'https://2aran.com/health',
    runners: [
      { id: 'hkg', label: '香港', url: 'https://hkg.example.com/check' },
      { id: 'sin', label: '新加坡', url: 'https://sin.example.com/check' },
    ],
    secret: 'shared-secret',
    fetchImpl: async (url, init) => {
      calls.push({ url, init })
      if (String(url).includes('sin')) return Response.json({ ok: false, error: 'timeout' }, { status: 504 })
      return Response.json({ ok: true, ip: '203.0.113.8', status: 200, durationMs: 45 })
    },
  })

  assert.equal(calls.length, 2)
  assert.equal(calls[0].init.headers.authorization, 'Bearer shared-secret')
  assert.deepEqual(JSON.parse(calls[0].init.body), { url: 'https://2aran.com/health' })
  assert.equal(results[0].ok, true)
  assert.equal(results[1].ok, false)
  assert.match(results[1].error, /timeout/)
})

test('额外授权域名会规范化、去重并忽略无效配置', () => {
  assert.deepEqual(
    parseBloggerEyeAllowedHosts(' Example.com,*.Example.com,example.com,https://bad.test,*,localhost '),
    ['2aran.com', '*.2aran.com', 'example.com', '*.example.com'],
  )
})

test('云端目标拒绝明文协议、凭据、非常用端口和本地地址', () => {
  const allowed = parseBloggerEyeAllowedHosts('example.com')
  assert.throws(() => validateBloggerEyeCloudTarget('http://example.com', allowed), /必须使用 HTTPS/)
  assert.throws(() => validateBloggerEyeCloudTarget('https://user:pass@example.com', allowed), /不能包含账号密码/)
  assert.throws(() => validateBloggerEyeCloudTarget('https://example.com:8443', allowed), /不能指定自定义端口/)
  assert.throws(() => validateBloggerEyeCloudTarget('https://localhost', ['localhost']), /本地或 IP 地址/)
  assert.throws(() => validateBloggerEyeCloudTarget('https://127.0.0.1', ['127.0.0.1']), /本地或 IP 地址/)
})

test('访问过程限制预览大小并复检重定向目标', async () => {
  const calls = []
  const fetchImpl = async (url) => {
    calls.push(String(url))
    if (calls.length === 1) {
      return new Response(null, { status: 302, headers: { location: 'https://admin.2aran.com/ready' } })
    }
    return new Response('x'.repeat(80), {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const result = await visitBloggerEyeTarget({
    targetUrl: 'https://2aran.com/start',
    fetchImpl,
    maxPreviewBytes: 32,
  })

  assert.deepEqual(calls, ['https://2aran.com/start', 'https://admin.2aran.com/ready'])
  assert.equal(result.status, 200)
  assert.equal(result.effectiveUrl, 'https://admin.2aran.com/ready')
  assert.equal(result.preview, 'x'.repeat(32))
  assert.equal(result.previewTruncated, true)

  await assert.rejects(
    () => visitBloggerEyeTarget({
      targetUrl: 'https://2aran.com/start',
      fetchImpl: async () => new Response(null, { status: 302, headers: { location: 'https://evil.test/' } }),
    }),
    /不在授权域名范围/,
  )
})
