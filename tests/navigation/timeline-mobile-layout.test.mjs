import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const root = fileURLToPath(new URL('../../', import.meta.url))
const PHONE = 390
const JUST_BELOW_MD = 767
const MD = 768
const DESKTOP = 1280

const [timeline, diary, yearSummary, home, homeDiary, homeCard] = await Promise.all([
  readFile(new URL('../../app/(site)/components/aceternity/timeline.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/diary/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/year-summary/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HomeDiarySeries.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HomeYearSummaryCard.jsx', import.meta.url), 'utf8'),
])

function classFrom(source, pattern, label) {
  const match = source.match(pattern)
  assert.ok(match, `missing ${label}`)
  return match[1]
}

const classes = {
  defaultRow: classFrom(timeline, /rowClassName \|\| '([^']+)'/, 'default row'),
  defaultRail: classFrom(timeline, /railClassName \|\| '([^']+)'/, 'default rail'),
  defaultLabel: classFrom(timeline, /labelClassName \|\| '([^']+)'/, 'default label'),
  body: classFrom(timeline, /<div className="(relative w-full [^"]+)">/, 'body'),
  beam: classFrom(timeline, /className="(absolute left-8[^"]+)"/, 'beam'),
  dot: classFrom(timeline, /className="(absolute left-3[^"]+)"/, 'dot'),
  header: classFrom(timeline, /className="(mx-auto max-w-5xl[^"]+)"/, 'header'),
  title: classFrom(timeline, /className="(mb-2 max-w-3xl[^"]+)"/, 'title'),
  diaryRow: classFrom(diary, /rowClassName="([^"]+)"/, 'diary row'),
  diaryRail: classFrom(diary, /railClassName="([^"]+)"/, 'diary rail'),
  diaryLabel: classFrom(diary, /labelClassName="([^"]+)"/, 'diary label'),
  dateMark: classFrom(diary, /className="(block text-left leading-none[^"]+)"/, 'date mark'),
  dateYear: classFrom(diary, /className="(block text-left text-\[11px\][^"]+)"/, 'date year'),
  dateDay: classFrom(diary, /className="(mt-1 block text-left text-lg[^"]+)"/, 'date day'),
}

function unescapeSelector(selector) {
  return selector.replace(/\\(.)/g, '$1')
}

function viewportAllows(rule, width) {
  let parent = rule.parent
  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule' && parent.name === 'media') {
      const mins = [...parent.params.matchAll(/min-width:\s*(\d+(?:\.\d+)?)px/g)].map((item) => Number(item[1]))
      const maxes = [...parent.params.matchAll(/max-width:\s*(\d+(?:\.\d+)?)px/g)].map((item) => Number(item[1]))
      if (mins.some((min) => width < min)) return false
      if (maxes.some((max) => width > max)) return false
    } else if (parent.type === 'atrule') {
      return false
    }
    parent = parent.parent
  }
  return true
}

function stylesAt(cssRoot, className, width) {
  const wanted = new Set(className.split(/\s+/).filter(Boolean))
  const declarations = new Map()
  cssRoot.walkRules((rule) => {
    if (!viewportAllows(rule, width)) return
    const matched = (rule.selectors || []).some((selector) => {
      const plain = unescapeSelector(selector.trim())
      if (!plain.startsWith('.') || /\s/.test(plain)) return false
      return wanted.has(plain.slice(1))
    })
    if (!matched) return
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value)
    })
  })
  return Object.fromEntries(declarations)
}

const utilities = await postcss([
  tailwindcss({
    content: [{
      raw: Object.values(classes).map((className) => `<div class="${className}"></div>`).join('\n'),
      extension: 'html',
    }],
    corePlugins: { preflight: false },
  }),
]).process('@tailwind utilities;', { from: undefined })
const cssRoot = postcss.parse(utilities.css)

function at(name, width) {
  return stylesAt(cssRoot, classes[name], width)
}

function expectStyle(styles, property, value) {
  assert.equal(styles[property], value, `${property} (got ${styles[property]})`)
}

test('phone and sub-md diary entries stack with a full-width body', () => {
  for (const width of [PHONE, JUST_BELOW_MD]) {
    const row = at('diaryRow', width)
    const rail = at('diaryRail', width)
    const body = at('body', width)
    expectStyle(row, 'flex-direction', 'column')
    expectStyle(row, 'align-items', 'stretch')
    expectStyle(rail, 'width', '100%')
    expectStyle(rail, 'position', 'relative')
    assert.notEqual(rail.width, '8rem')
    expectStyle(rail, 'padding-left', '1rem')
    expectStyle(body, 'width', '100%')
    expectStyle(body, 'padding-left', '1rem')
    expectStyle(body, 'padding-right', '1rem')
    assert.notEqual(body['padding-left'], '5rem')
    expectStyle(at('beam', width), 'display', 'none')
    expectStyle(at('dot', width), 'display', 'none')
    expectStyle(at('diaryLabel', width), 'display', 'block')
    expectStyle(at('dateMark', width), 'text-align', 'left')
    assert.equal(at('dateMark', width)['padding-left'], undefined)
    expectStyle(at('dateYear', width), 'font-size', '11px')
    expectStyle(at('dateYear', width), 'text-align', 'left')
    expectStyle(at('dateDay', width), 'font-size', '1.125rem')
    expectStyle(at('dateDay', width), 'text-align', 'left')
  }
})

test('phone and sub-md year-summary entries use the same stacked timeline', () => {
  assert.doesNotMatch(yearSummary, /rowClassName|railClassName|labelClassName/)
  assert.doesNotMatch(timeline, /md:hidden/)
  for (const width of [PHONE, JUST_BELOW_MD]) {
    const row = at('defaultRow', width)
    const rail = at('defaultRail', width)
    const label = at('defaultLabel', width)
    const body = at('body', width)
    expectStyle(row, 'flex-direction', 'column')
    expectStyle(rail, 'width', '100%')
    expectStyle(rail, 'position', 'relative')
    expectStyle(rail, 'flex-direction', 'column')
    assert.equal(rail['max-width'], undefined)
    expectStyle(label, 'font-size', '1.25rem')
    expectStyle(label, 'text-align', 'left')
    assert.notEqual(label['padding-left'], '5rem')
    expectStyle(body, 'width', '100%')
    expectStyle(body, 'padding-left', '1rem')
    assert.notEqual(body['padding-left'], '5rem')
    expectStyle(at('header', width), 'max-width', '64rem')
    expectStyle(at('header', width), 'padding-top', '2rem')
    expectStyle(at('title', width), 'font-size', '1.5rem')
  }
})

test('md and up keeps the desktop left rail for diary and year-summary', () => {
  for (const width of [MD, DESKTOP]) {
    const diaryRow = at('diaryRow', width)
    const diaryRail = at('diaryRail', width)
    expectStyle(diaryRow, 'flex-direction', 'row')
    expectStyle(diaryRow, 'align-items', 'flex-start')
    expectStyle(diaryRow, 'gap', '0.75rem')
    expectStyle(diaryRow, 'padding-top', '2rem')
    expectStyle(diaryRail, 'position', 'sticky')
    expectStyle(diaryRail, 'top', '6rem')
    expectStyle(diaryRail, 'width', '8rem')
    expectStyle(diaryRail, 'flex-shrink', '0')
    expectStyle(diaryRail, 'padding-left', '0px')
    expectStyle(at('dateMark', width), 'padding-left', '3rem')
    expectStyle(at('dateMark', width), 'text-align', 'left')
    expectStyle(at('dateYear', width), 'font-size', '11px')
    expectStyle(at('dateDay', width), 'font-size', '1.125rem')
    expectStyle(at('dateDay', width), 'font-weight', '600')

    const row = at('defaultRow', width)
    const rail = at('defaultRail', width)
    const label = at('defaultLabel', width)
    expectStyle(row, 'flex-direction', 'row')
    expectStyle(row, 'gap', '2.5rem')
    expectStyle(row, 'padding-top', '4rem')
    expectStyle(rail, 'position', 'sticky')
    expectStyle(rail, 'top', '6rem')
    expectStyle(rail, 'flex-direction', 'row')
    expectStyle(rail, 'align-items', 'center')
    expectStyle(rail, 'max-width', width >= 1024 ? '24rem' : '20rem')
    expectStyle(label, 'font-size', '3rem')
    expectStyle(label, 'padding-left', '5rem')
    expectStyle(at('body', width), 'padding-left', '1rem')
    expectStyle(at('body', width), 'padding-right', '1rem')
    expectStyle(at('dot', width), 'display', 'flex')
    expectStyle(at('dot', width), 'left', '0.75rem')
    expectStyle(at('beam', width), 'display', 'block')
    expectStyle(at('beam', width), 'left', '2rem')
    expectStyle(at('beam', width), 'width', '2px')
    expectStyle(at('header', width), 'max-width', '64rem')
    expectStyle(at('header', width), 'padding-top', '2.5rem')
    expectStyle(at('header', width), 'padding-bottom', '2.5rem')
    expectStyle(at('title', width), 'font-size', '1.875rem')
  }
})

test('the shared timeline is not mounted on the homepage', async () => {
  assert.doesNotMatch(`${home}\n${homeDiary}\n${homeCard}`, /aceternity\/timeline/)
  const hits = []
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
        continue
      }
      if (!/\.(js|jsx|mjs)$/.test(entry.name)) continue
      const text = await readFile(full, 'utf8')
      if (text.includes("aceternity/timeline'")) hits.push(path.relative(root, full))
    }
  }
  await walk(path.join(root, 'app'))
  assert.deepEqual(hits.sort(), [
    'app/(site)/articles/year-summary/page.jsx',
    'app/(site)/diary/page.jsx',
  ])
})
