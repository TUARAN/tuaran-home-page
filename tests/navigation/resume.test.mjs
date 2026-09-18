import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { OPENCLAW_ACHIEVEMENT_COUNT } from '../../lib/openClawAchievements.js'
import { RESUME_PATH, resumeExperience, resumeOpenSource, resumeProfile } from '../../lib/resume.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'
import { routeFromPageFile } from '../../scripts/audit-route-seo.mjs'

test('about page exposes a job resume entry that routes to the printable CV', async () => {
  const [about, resumePage, toolbar, nav] = await Promise.all([
    readFile(new URL('../../app/(site)/about/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/about/resume/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/about/resume/ResumeToolbar.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
  ])

  assert.equal(RESUME_PATH, '/about/resume')
  assert.match(about, /href="\/about\/resume"/)
  assert.match(about, /求职简历/)
  assert.match(resumePage, /求职简历/)
  assert.match(resumePage, /application\/ld\+json/)
  assert.match(resumePage, /canonical: RESUME_PATH/)
  assert.match(toolbar, /window\.print\(\)/)
  assert.match(nav, /href: '\/about\/resume'/)
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === RESUME_PATH && entry.sitemap && entry.indexable))
  assert.equal(routeFromPageFile('/repo/app/(site)/about/resume/page.jsx', '/repo'), RESUME_PATH)
})

test('resume content stays within public facts and does not invent employers', () => {
  assert.equal(resumeProfile.name, '涂阿燃')
  assert.match(resumeProfile.intent, /AI 前沿部署/)
  assert.ok(resumeExperience.some((job) => job.org === '矩联科技'))
  assert.ok(resumeExperience.every((job) => !/腾讯|阿里|字节|华为|百度/.test(job.org)))
  assert.equal(resumeOpenSource.items.length, OPENCLAW_ACHIEVEMENT_COUNT)
})
