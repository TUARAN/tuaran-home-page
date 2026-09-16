import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  briefingCharCount,
  CONTRACT_RENEWAL_PAGES,
  CONTRACT_RENEWAL_QUESTIONS,
  CONTRACT_RENEWAL_SLIDE_DIR,
  CONTRACT_RENEWAL_TITLE,
  CONTRACT_RENEWAL_TOTAL_SECONDS,
  contractRenewalSlideSrc,
  sumBriefingSeconds,
} from '../lib/contractRenewalBriefing.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const weak = /还很不够|请多批评|我可能|我只是配合|能力不足|紧张|对不起/

test('续签述职讲稿正好 8 分钟，10 页都有对稿和 PPT 页图', async () => {
  assert.equal(CONTRACT_RENEWAL_TITLE, '续签述职')
  assert.equal(Array.from(CONTRACT_RENEWAL_TITLE).length, 4)
  assert.equal(CONTRACT_RENEWAL_PAGES.length, 10)
  assert.equal(sumBriefingSeconds(), CONTRACT_RENEWAL_TOTAL_SECONDS)
  assert.equal(CONTRACT_RENEWAL_TOTAL_SECONDS, 480)

  for (const page of CONTRACT_RENEWAL_PAGES) {
    assert.equal(page.slideSrc, contractRenewalSlideSrc(page.id))
    assert.match(page.slideSrc, new RegExp(`^${CONTRACT_RENEWAL_SLIDE_DIR}/page-\\d{2}\\.jpg$`))
    assert.ok(page.lines.length >= 1)
    assert.ok(page.seconds >= 9)
    assert.ok(page.job)
    assert.ok(page.stance)
    assert.ok(page.point)
    assert.ok(page.avoid)
    const chars = briefingCharCount(page)
    if (page.id !== 10) {
      assert.ok(chars >= page.seconds * 2, `${page.title} too short for ${page.seconds}s`)
    }
    assert.ok(chars <= page.seconds * 4.4, `${page.title} too dense for ${page.seconds}s: ${chars} chars`)
    assert.doesNotMatch(`${page.lines.join('')}${page.job}${page.stance}`, weak)
    await access(join(root, 'public', page.slideSrc.replace(/^\//, '')))
  }
})

test('续签述职口播稿锁定已复核的 10 点原文', () => {
  const script = CONTRACT_RENEWAL_PAGES.map((page) => page.lines.join(''))
  assert.match(script[0], /各位领导、同事，大家好！我是来自智能消息室的项目经理涂阿燃。/)
  assert.match(script[1], /岗位经历、智能体应用、数字员工建设、项目管理以及反思思考/)
  assert.match(script[2], /本次是第二次续签述职/)
  assert.match(script[2], /新消息与智能体的融合建设、阅信稽核考核流程、建设数字员工工具/)
  assert.match(script[3], /手搓通信专家智能体/)
  assert.match(script[3], /仅待码号申请完成即可推进落地/)
  assert.match(script[4], /打通WorkBuddy开发者平台的Channel能力/)
  assert.match(script[5], /我主导开发“阅信智核官”数字员工工具/)
  assert.match(script[6], /公司 AI 应用技能竞赛赛道第一/)
  assert.match(script[6], /2026年前8月完成896万元BC收入、1979万元下游结算/)
  assert.match(script[7], /所在支部获评集团红旗团支部/)
  assert.match(script[8], /还需对安全风险、合规要求及系统稳定性的系统性进一步加强/)
  assert.match(script[9], /请各位领导批评指正/)
})

test('续签述职答问短、能扛事，不把成果说小', () => {
  assert.equal(CONTRACT_RENEWAL_QUESTIONS.length, 6)
  for (const item of CONTRACT_RENEWAL_QUESTIONS) {
    assert.ok(item.q.length >= 8)
    assert.ok(item.a.length >= 24)
    assert.doesNotMatch(item.a, weak)
  }
  assert.match(CONTRACT_RENEWAL_QUESTIONS.find((item) => item.id === 'role').a, /是我搭的/)
  assert.match(CONTRACT_RENEWAL_QUESTIONS.find((item) => item.id === 'next').a, /安全和权限走在功能前面/)
})

test('续签述职只在站长后台，幻灯片走 /admin 受保护路径', async () => {
  const [page, client, routes, workspace, middleware] = await Promise.all([
    readFile(new URL('../app/(admin)/admin/contract-renewal/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/admin/contract-renewal/ContractRenewalClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/adminRoutes.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/admin/private-data/PrivateDataWorkspace.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../middleware.js', import.meta.url), 'utf8'),
  ])
  assert.match(page, /<AdminPageGate/)
  assert.match(page, /index: false/)
  assert.doesNotMatch(page, /runtime = 'edge'|force-dynamic/)
  assert.match(client, /ContractRenewalClient/)
  assert.match(client, /提词全屏/)
  assert.match(client, /items-start/)
  assert.doesNotMatch(client, /bg-\[#111\]|bg-black|aspect-video/)
  assert.match(routes, /href: '\/admin\/contract-renewal', label: '续签述职'/)
  assert.match(workspace, /href: '\/admin\/contract-renewal', title: '续签述职'/)
  assert.match(middleware, /'\/admin\/:path\*'/)
})
