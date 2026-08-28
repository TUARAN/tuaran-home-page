import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
import test from 'node:test'
import postcss from 'postcss'
import { themes, priceCents, buildDeliveryMessage, copyText } from '../public/skins/studio-model.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const html = readFileSync(join(root, 'public/skins/index.html'), 'utf8')
const controller = readFileSync(join(root, 'public/skins/studio.js'), 'utf8')

test('payment is inline, correctly priced and never presented as an automatic checkout', () => {
  assert.equal(priceCents, 1990)
  assert.match(html, /扫码，支付 ¥19\.9/)
  assert.match(html, /马上响应/)
  assert.match(html, /手动输入 ¥19\.9/)
  assert.match(html, /tuaran\(\*\*燃\)/)
  assert.ok(html.indexOf('wechat-pay.jpg') < html.indexOf('wechat-contact.png'))
  assert.doesNotMatch(html, /<dialog|role="dialog"|class="modal|payment-success|已到账|支付宝/)
  assert.doesNotMatch(controller, /fetch\(|localStorage|sessionStorage/)
  assert.match(html, /不能收款/)
  assert.match(html, /尚未完成 Windows \/ macOS 实机兼容验证，请勿付款/)
  assert.match(html, /name="robots" content="noindex,nofollow"/)
})

test('payment and contact QR images are byte-for-byte copies of existing owner assets', () => {
  assert.deepEqual(readFileSync(join(root, 'public/skins/wechat-pay.jpg')), readFileSync(resolve(root, '../../public/donate-wechat.jpg')))
  assert.deepEqual(readFileSync(join(root, 'public/skins/wechat-contact.png')), readFileSync(resolve(root, '../../gptplus-site/qrcodewechat3.png')))
})

test('delivery message records the platform and theme without claiming a payment happened', () => {
  const message = buildDeliveryMessage('Windows', 'cosmos')
  assert.match(message, /¥19\.90/)
  assert.match(message, /Windows/)
  assert.match(message, /宇宙旷工/)
  assert.match(message, /请在付款后/)
  assert.doesNotMatch(message, /已经付款|已支付|订单号|付款成功/)
  for (const bad of ['__proto__', 'constructor', 'missing']) {
    assert.match(buildDeliveryMessage('untrusted platform', bad), /电脑系统：请填写/)
    assert.match(buildDeliveryMessage('Windows', bad), /摸鱼办事处/)
  }
})

test('clipboard errors and missing permission return a usable fallback', async () => {
  let value
  assert.equal(await copyText('atar24', { async writeText(text) { value = text } }), true)
  assert.equal(value, 'atar24')
  assert.equal(await copyText('text', undefined), false)
  assert.equal(await copyText('text', { async writeText() { throw new Error('Denied') } }), false)
})

function element(extra = {}) {
  return { dataset: {}, attributes: {}, listeners: {}, classList: { contains: () => false },
    addEventListener(name, fn) { this.listeners[name] = fn },
    setAttribute(name, value) { this.attributes[name] = value },
    scrollIntoView() { this.scrolled = true }, focus() { this.focused = true }, select() { this.selected = true },
    ...extra,
  }
}

test('actual page controller switches previews and offers manual copy after denial', async () => {
  const nodes = Object.fromEntries(['#preview', '#preview-title', '#preview-caption', '.work-bottom span', '#copy-status', '#message-fallback', '#copy-wechat', '#copy-message', '#system'].map(id => [id, element()]))
  nodes['#system'].value = 'Windows'
  const buttons = Object.keys(themes).map(id => element({ dataset: { themeChoice: id }, classList: { contains: () => true } }))
  const context = { themes, buildDeliveryMessage, copyText, navigator: {}, matchMedia: () => ({ matches: true }), document: {
    querySelector: id => { assert.ok(nodes[id], id); return nodes[id] },
    querySelectorAll: () => buttons,
  } }
  vm.runInNewContext(controller.replace(/^import .*\n/, ''), context)
  buttons[2].listeners.click()
  assert.equal(nodes['#preview'].dataset.theme, 'cosmos')
  assert.equal(nodes['#preview-title'].textContent, '宇宙旷工')
  assert.equal(buttons[2].attributes['aria-pressed'], 'true')
  assert.equal(buttons[0].attributes['aria-pressed'], 'false')
  await nodes['#copy-message'].listeners.click()
  assert.equal(nodes['#message-fallback'].hidden, false)
  assert.match(nodes['#message-fallback'].value, /宇宙旷工/)
  assert.equal(nodes['#message-fallback'].selected, true)
  context.navigator.clipboard = { async writeText() {} }
  await nodes['#copy-wechat'].listeners.click()
  assert.equal(nodes['#message-fallback'].hidden, true)
  assert.match(nodes['#copy-status'].textContent, /微信号已复制/)
})

test('page and responsive CSS parse, and every local asset and anchor exists', () => {
  const css = postcss.parse(readFileSync(join(root, 'public/skins/studio.css'), 'utf8'))
  assert.ok(css.nodes.length > 50)
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1])
  assert.equal(new Set(ids).size, ids.length)
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), anchor)
  for (const [, path] of html.matchAll(/(?:src|href)="(\/(?:skins\/[^"?#]+|favicon\.svg))"/g)) readFileSync(join(root, 'public', path))
  assert.match(html, /非 WorkBuddy 实机截图/)
})

function contrast(first, second) {
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  }
  const a = luminance(first), b = luminance(second)
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}

test('all four theme palettes maintain readable text and button contrast', () => {
  assert.equal(Object.keys(themes).length, 4)
  for (const theme of Object.values(themes)) {
    for (const bg of [theme.canvas, theme.surface]) {
      for (const fg of [theme.text, theme.muted, theme.accent]) {
        assert.ok(contrast(fg, bg) >= 4.5, `${theme.id}: ${fg} on ${bg}: ${contrast(fg, bg)}`)
      }
    }
  }
})

test('build creates four separate safe ZIPs outside public assets, with matching manifests and hashes', () => {
  const result = JSON.parse(execFileSync(process.execPath, [join(root, 'scripts/build-skin-packs.mjs')], { encoding: 'utf8' }))
  const manifest = JSON.parse(readFileSync(join(result.out, 'manifest.json'), 'utf8'))
  assert.equal(manifest.saleReady, false)
  assert.equal(manifest.themes.length, 4)
  assert.equal(manifest.priceCents, priceCents)
  assert.doesNotMatch(result.out, /\/public\//)
  for (const item of manifest.themes) {
    const zipPath = join(result.out, item.file)
    const contents = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).trim().split('\n')
    assert.deepEqual(contents.sort(), ['LICENSE.md', 'THIRD-PARTY-NOTICES.md', 'preview.png', 'theme.css', 'theme.json'].sort())
    const config = JSON.parse(execFileSync('unzip', ['-p', zipPath, 'theme.json'], { encoding: 'utf8' }))
    assert.equal(config.id, item.id)
    assert.deepEqual(config.testedWorkBuddy, [])
    const png = execFileSync('unzip', ['-p', zipPath, 'preview.png'])
    assert.equal(png.readUInt32BE(16), 1200)
    assert.equal(png.readUInt32BE(20), 750)
    const bytes = readFileSync(zipPath)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256)
    const css = execFileSync('unzip', ['-p', zipPath, 'theme.css'], { encoding: 'utf8' })
    assert.doesNotMatch(css, /@import|url\(/)
    const ast = postcss.parse(css)
    ast.walkDecls(declaration => assert.ok(!['display', 'visibility', 'opacity', 'position', 'width', 'height'].includes(declaration.prop), declaration.prop))
    ast.walkRules(rule => assert.ok(rule.selector.startsWith(`body[data-workbuddy-theme="${item.id}"]`), rule.selector))
    assert.match(css, /prefers-reduced-motion/)
  }
  assert.ok(readdirSync(join(root, 'public/skins')).every(name => !name.endsWith('.zip')))
})
