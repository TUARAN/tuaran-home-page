import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [clientSource, pageSource, worksSource, directorySource, quizPageSource, quizClientSource, questionBankSource, richPagesSource, builderSource, seoSource] = await Promise.all([
  readFile(new URL('../../app/(site)/adsense-content-check/AdSenseContentCheckClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/adsense-content-check/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../lib/engineeringWorks.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/quiz/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/quiz/QuizClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../lib/questionBank2026.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/rich-pages/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/buildKnowledgeItems.js', import.meta.url), 'utf8'),
  readFile(new URL('../../lib/richPageSeo.js', import.meta.url), 'utf8'),
])

test('AdSense policy summary is implemented as a registered interactive page', () => {
  assert.match(pageSource, /createRichPageMetadata\('adsense-content-check'\)/)
  assert.match(worksSource, /id: 'adsense-content-check'[\s\S]*href: '\/adsense-content-check'/)
  assert.match(clientSource, /const POLICY_SUMMARIES = \[/)
  assert.equal(clientSource.match(/critical: (?:true|false)/g)?.length, 24)
  assert.match(clientSource, /pass: \{ label: '通过'/)
  assert.match(clientSource, /fix: \{ label: '待整改'/)
  assert.match(clientSource, /unsure: \{ label: '待确认'/)
  assert.match(clientSource, /window\.localStorage\.setItem\(STORAGE_KEY/)
  assert.match(clientSource, /这是站内自检结果，不是 Google 审核结果预测/)
})

test('legacy and delivery-based interactive links resolve to the independent group', () => {
  assert.match(directorySource, /works: 'interactive'/)
  assert.match(directorySource, /delivery === 'interact'[\s\S]*\? 'interactive'/)
})

test('2026 quiz is owner-only, tagged, gated, and hidden from public discovery', () => {
  assert.match(worksSource, /id: 'quiz'[\s\S]*category: 'learning-tool'[\s\S]*audience: 'owner'[\s\S]*tags: \['党建知识', '题库', '学习模式', '考试模式', '仅站长'\]/)
  assert.match(quizPageSource, /getOwnerPageState\(\)[\s\S]*state !== 'owner'/)
  assert.match(quizPageSource, /PrivateVaultGate[\s\S]*returnTo="\/quiz"/)
  assert.doesNotMatch(quizPageSource, /\(admin\)/)
  assert.match(quizPageSource, /ContentPvBeacon category="rich-page" slug="quiz"/)
  assert.match(quizClientSource, /key=\{`\$\{currentQuestion\.id\}-\$\{optionIndex\}`\}/)
  assert.doesNotMatch(quizClientSource, /key=\{option\}/)
  assert.match(questionBankSource, /"id": 101,[\s\S]*"type": "fill"[\s\S]*"question": "请完整默写中国共产党入党誓词。"/)
  assert.match(quizClientSource, /isFillQuestion[\s\S]*fillAnswerWrap[\s\S]*核对答案/)
  assert.match(quizClientSource, /normalizeFillAnswer/)
  assert.match(quizClientSource, /choiceQuestions[\s\S]*fillQuestion \? \[fillQuestion\] : \[\]/)
  assert.match(quizClientSource, /WRONG_BOOK_STORAGE_KEY = 'quiz:wrong-book:2026:v1'/)
  assert.match(quizClientSource, /localStorage\.setItem\(WRONG_BOOK_STORAGE_KEY/)
  assert.match(quizClientSource, /setMode\('review'\)[\s\S]*setQuestions\(wrongQuestions\)/)
  assert.match(quizClientSource, /回答正确，已移出错题本/)
  assert.match(quizPageSource, /robots:[\s\S]*index: false[\s\S]*follow: false/)
  assert.match(richPagesSource, /work\.audience !== 'owner' \|\| canViewOwnerContent/)
  assert.match(richPagesSource, /label: '仅站长'/)
  assert.match(richPagesSource, /work\.tags \|\| \[\][\s\S]*filter\(\(tag\) => tag !== '仅站长'\)/)
  assert.match(builderSource, /includeOwner = false[\s\S]*includeOwner \|\| p\.audience !== 'owner'/)
  assert.match(seoSource, /work\.audience === 'owner'[\s\S]*index: false, follow: false/)
})
