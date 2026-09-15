import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const page = await readFile(new URL('../app/(site)/products/new-message-phone/page.jsx', import.meta.url), 'utf8')
const platform = await readFile(new URL('../app/(site)/products/new-message-phone/HardwarePlatform.jsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../app/(site)/products/new-message-phone/new-message-phone.module.css', import.meta.url), 'utf8')
const localPage = await readFile(new URL('../deliverables/new-message-phone.html', import.meta.url), 'utf8')

test('new message phone page exposes review-critical product information', () => {
  for (const phrase of ['新消息手机', '硬件平台原生消息应用', '手机终端原生短信界面', 'Chatbot 智能服务模块', 'NMP X1', '设备控制 API']) {
    assert.match(page, new RegExp(phrase))
  }
  for (const scenario of ['政务通知', '企业服务', '营销触达', '设备告警']) {
    assert.match(page, new RegExp(scenario))
  }
})

test('new message phone page is indexable and responsive', () => {
  assert.match(page, /canonical: '\/products\/new-message-phone'/)
  assert.match(page, /'@type': 'Product'/)
  assert.match(platform, /HARDWARE PLATFORM APPLICATION/)
  assert.match(platform, /硬件平台原生能力/)
  assert.match(page, /<HardwarePlatform \/>/)
  assert.match(page, /workbuddy-5g-sms-acp-current-session/)
  assert.match(page, /查看 5G 消息 ACP 实践/)
  assert.doesNotMatch(`${page}${platform}${localPage}`, /DOWNLOADS|macOS|Windows|Linux|Apple Silicon|安装包|下载 v1/)
  assert.doesNotMatch(`${page}${localPage}`, /审核与业务对接|以实际交付版本|运营商网络支持为准/)
  assert.match(styles, /@media \(max-width: 620px\)/)
  assert.match(styles, /prefers-reduced-motion/)
})
