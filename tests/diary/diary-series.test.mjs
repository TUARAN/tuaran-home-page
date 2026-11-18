import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { diaryContentFromMarkdown, legacyArticleToMarkdown } from '../../lib/article/legacyArticleMigration.mjs'
import {
  DIARY_ORAL_SOURCE_NOTE,
  DIARY_SERIES_STARTED_ON,
  DIARY_SERIES_TITLE,
  earliestDiaryDate,
  previewFromDiary,
  selectDiarySeries,
} from '../../lib/diary/diarySeries.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))

function legacyArticles() {
  const filename = path.join(root, 'app/(site)/articles/articlesData.js')
  const source = fs.readFileSync(filename, 'utf8').replace(
    /^import (\w+) from '([^']+\.json)'\s*$/gm,
    (_, name, relative) => `const ${name} = ${fs.readFileSync(path.resolve(path.dirname(filename), relative), 'utf8')};`,
  ).replace('export const articles =', 'const articles =')
  return JSON.parse(vm.runInNewContext(`${source}\nJSON.stringify(articles)`))
}

function diaryArticle() {
  return legacyArticles().find((article) => article.slug === 'diary-self-reflection')
}

function diaryEntry(article, label) {
  const index = article.content.findIndex((block) => block?.label === label)
  assert.ok(index >= 0)
  const blocks = []
  for (let cursor = index + 1; cursor < article.content.length; cursor += 1) {
    const block = article.content[cursor]
    if (block && typeof block === 'object' && block.date) break
    blocks.push(block)
  }
  return { heading: article.content[index], blocks }
}

function shockEntry(article) {
  return diaryEntry(article, '异世界的冲击')
}

test('浮生日记 starts on the earliest timeline entry and keeps that framing', () => {
  const article = diaryArticle()
  const founder = article.content.find((block) => block?.label === '工程型创作者')
  assert.equal(earliestDiaryDate(article), DIARY_SERIES_STARTED_ON)
  assert.equal(article.date, DIARY_SERIES_STARTED_ON)
  assert.equal(founder.date, '2026-01-05')
  assert.match(article.summary, /^从 2026-01-05 起/)
  assert.doesNotMatch(article.summary, /口述|机器人整理/)
  assert.doesNotMatch(article.summary, /2026-05-11/)
  assert.equal(DIARY_SERIES_TITLE, '浮生日记')
})

test('每天接受检验 keeps the reviewed oral draft verbatim', () => {
  const { heading, blocks } = diaryEntry(diaryArticle(), '每天接受检验')
  const text = blocks.join('\n\n')
  assert.equal(heading.date, '2026-11-17')
  assert.equal(heading.category, '内容与增长')
  assert.equal(heading.sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(
    text,
    [
      '最近一个多月，或许一个半月，除了睡觉，除了生活带娃，再除了工作，剩下来的时间其实已经不多了，几乎都给了 X 大互动——多半是每天晚上。现在的工作，很多时候也是在驱动 AI 来做。它现在安在一个智能体里：浏览器插件接上大模型，把评论、点赞、发帖、关注，还有社群，一环一环编排起来，做成高频的互动。',
      '规则很多，多到后来写成了一份大互动的文档，也就是黄皮书。可大模型也一直在旁边帮着。这套东西，本来就是用大模型开发出来的；到了具体环节，它的介入往往又简单得惊人。平台有平台的规矩，生活有生活的节律，账号有它当时的状态——这些都不是并列的条款，是要揉在一起的。整个生态都得活起来，才叫把这件事做成。',
      '我想，X 大互动其实是一套大互动的理论。第一要义是大健康：人要健康，账号也要健康，两头都轻不得。第二要义是拥抱 AI，而且要充分地拥抱。以后人和智能体的边界，大概会越来越模糊；有时候人不太愿意再跟人打交道，人跟这一类「人」说话，智能体跟智能体来往，或许就是这样的趋势。反正，全面用 AI，是一定的。第三要义是保持规律，再慢慢拓展边界，去试那些规则允许的地方。先记下这三条，其余的，我一时也记不全了，过一阵再补。',
      '做到现在，一个账号已经可以很快摸到五百万的流量。评论这条路，基本上走通了；评论和关注，也会回赠一些真切的反馈。',
      '我在自己的站点上，记过出版社出的那些书。写到这里忽然觉得，那种书更像计划经济里的产物。而眼前这套理论，这个智能体，这种插件的形态，才是市场经济——它每天都要被检验一次，无处可躲。短期的愿望并不复杂：先等到创作者收益，再让关注的人，一点点多起来。',
    ].join('\n\n'),
  )
  assert.doesNotMatch(text, /本文由站长口述/)
  assert.doesNotMatch(text, /2026-11-17 口述，Bots 整理/)
  assert.doesNotMatch(text, /每天接受检验/)
  assert.deepEqual(
    diaryContentFromMarkdown(legacyArticleToMarkdown({ content: [heading, ...blocks] })),
    [heading, ...blocks],
  )
})

test('下班的时候 keeps the reviewed oral draft verbatim', () => {
  const { heading, blocks } = diaryEntry(diaryArticle(), '下班的时候')
  const text = blocks.join('\n\n')
  assert.equal(heading.date, '2026-11-16')
  assert.equal(heading.category, '生活与家庭')
  assert.equal(heading.sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(
    text,
    [
      '今天下班的时候，我忽然意识到，自己在这家公司，可能真的待不久了。',
      '这还不是一个决定。只是到了下班这一刻，忽然觉得，往后的日子不能一直照着现在的样子过。',
      '这是一家国企。钱不多，大家却仍然在卷加班。让我烦闷的，倒不完全是忙，而是忙来忙去，许多事情并没有真正往前走。依我的观察，日常不少时间花在画PPT上，花在扯皮上，花在把责任划来划去上。说到具体执行，却又很难有人愿意多往前做一点。说是牵头，落下来仍旧是层层管控、各种规则，至于事情究竟由谁推动，反而不那么清楚。',
      '我不知道每个人心里怎么想，也不好替所有人下判断。只是今天忍不住觉得，我所不满的那种双轨制，恐怕不是学历高一些、人聪明一些，就能消除它带来的问题。人到了各自的位置上，总会有所顾虑。可最后，这些顾虑都变成了日常，事情还是那些事情，时间却实实在在地过去了。',
      '家里的日子没有停。',
      '二〇二三年结婚，二〇二四年有了孩子，二〇二五年孩子一岁，今年两岁，明年就三岁了。这么一数，几年不过短短一句话。可孩子以后要用钱的地方还有很多，我不可能一直靠“先这样吧”过下去。想到这里，再看眼下这些反复消耗的时间，就更难说服自己。',
      '可现在又到处都在说经济下行。留下来的理由越来越薄，离开却也不是一句气话就能办成的事。我并没有在今天想出答案，只是两头的顾虑挤在一起，让人觉得憋闷。',
      '连早点下班，也会让我多想一层：别人会不会觉得我异样？我不知道别人究竟怎么看，也许只是自己在意。但谁不想早点回家呢？想按时结束一天的工作，原本不该是一件需要解释太多的事。',
      '我并不是不愿意干活。只是越来越难接受，时间花出去了，事情没有多少进展，收入也不足以让我安心，而家里的日子还在一年一年往前走。',
      '今天还没有决定要走。只是下班的时候，突然觉得，不能总等到下一年，再把同样的问题问自己一遍。',
    ].join('\n\n'),
  )
  assert.doesNotMatch(text, /本文由站长口述/)
  assert.deepEqual(
    diaryContentFromMarkdown(legacyArticleToMarkdown({ content: [heading, ...blocks] })),
    [heading, ...blocks],
  )
})

test('异世界的冲击 keeps the oral account and stays within the public draft', () => {
  const { heading, blocks } = shockEntry(diaryArticle())
  const text = blocks.join('\n')
  assert.equal(heading.dateStart, '2026-11-06')
  assert.equal(heading.date, '2026-11-12')
  assert.equal(heading.sourceNote, DIARY_ORAL_SOURCE_NOTE)
  const marked = diaryArticle().content.filter((block) => block?.sourceNote)
  assert.deepEqual(marked.map((block) => block.label), ['每天接受检验', '下班的时候', '异世界的冲击'])
  assert.match(text, /异世界的冲击/)
  assert.match(text, /这里的「异」是异同的异/)
  assert.match(text, /腿部手术已经住院/)
  assert.match(text, /带妻子去复诊，岳父一同前往，还去看了广州塔。小茉莉没带波西，哭得比较多/)
  assert.doesNotMatch(text, /小猫利|没带娃娃/)
  assert.match(text, /不知道对生活有什么改善，只是有感受/)
  assert.doesNotMatch(text, /notion|诊断|癌症|肿瘤|化疗|病历|手术史/i)
  assert.deepEqual(
    diaryContentFromMarkdown(legacyArticleToMarkdown({ content: [heading, ...blocks] })),
    [heading, ...blocks],
  )
})

test('homepage preview uses the same series and leads with the latest record', () => {
  const preview = previewFromDiary(diaryArticle())
  assert.equal(preview.title, '浮生日记')
  assert.equal(preview.startedOn, '2026-01-05')
  assert.equal(preview.entries[0].label, '每天接受检验')
  assert.equal(preview.entries[0].span, '2026-11-17')
  assert.match(preview.entries[0].lead, /最近一个多月/)
  assert.match(preview.entries[0].closing, /才是市场经济/)
  assert.equal(preview.entries[0].sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(preview.entries[1].label, '下班的时候')
  assert.equal(preview.entries[1].span, '2026-11-16')
  assert.equal(preview.entries[1].sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(preview.entries[2].label, '异世界的冲击')
  assert.equal(preview.entries[2].span, '2026-11-06～2026-11-12')
  assert.equal(preview.entries[2].sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.match(preview.entries[2].detail, /小茉莉没带波西/)
  assert.doesNotMatch(preview.entries[2].detail, /小猫利|没带娃娃/)
  assert.ok(preview.entries.slice(3).every((entry) => !entry.sourceNote))
  assert.equal(preview.entries[0].href, `/diary#${preview.entries[0].id}`)
  assert.ok(preview.entries.length >= 2)
  assert.ok(preview.entries[1].date < preview.entries[0].date)
})

test('an older published snapshot does not hide a later repository entry', () => {
  const archived = diaryArticle()
  assert.equal(archived.content[0].label, '每天接受检验')
  const older = {
    title: archived.title,
    summary: '旧摘要',
    content: archived.content.slice(17),
  }
  assert.equal(selectDiarySeries(archived, older), archived)

  const newer = {
    title: '线上更新',
    summary: '线上',
    content: [{ date: '2026-12-01', label: '之后的记录', category: '日记' }, '后写的一条'],
  }
  assert.equal(selectDiarySeries(archived, newer), newer)
})

test('homepage and diary page share the series module and the public title', async () => {
  const [home, diary, section] = await Promise.all([
    fs.promises.readFile(path.join(root, 'app/(site)/page.jsx'), 'utf8'),
    fs.promises.readFile(path.join(root, 'app/(site)/diary/page.jsx'), 'utf8'),
    fs.promises.readFile(path.join(root, 'app/(site)/components/HomeDiarySeries.jsx'), 'utf8'),
  ])
  assert.match(home, /previewFromDiary\(archivedDiary\)/)
  assert.match(home, /public\/data\/article-archive\/diary-self-reflection\.json/)
  assert.doesNotMatch(home, /articles\/articlesData/)
  assert.match(diary, /readArchivedArticle/)
  assert.doesNotMatch(diary, /articles\/articlesData/)
  assert.match(home, /<HomeDiarySeries preview=\{diaryPreview\} \/>/)
  assert.match(diary, /selectDiarySeries\(archived, published\)/)
  assert.match(diary, /publishedTime: toIsoDate\(DIARY_SERIES_STARTED_ON\)/)
  assert.match(diary, /datePublished: toIsoDate\(DIARY_SERIES_STARTED_ON\)/)
  assert.match(section, /\{preview\.title\}/)
  assert.match(section, /className="home-work-stack"/)
  assert.match(section, /className="home-section-title"/)
  assert.doesNotMatch(section, /diary-sheet|These entries are mostly the site owner's spoken accounts/)
  assert.doesNotMatch(diary, /DIARY_SERIES_NOTE|记录主要是站长口述，由机器人整理后公开/)
  assert.match(diary, /diary-entry-source-note/)
  assert.match(diary, /from '..\/components\/aceternity\/timeline'/)
  assert.match(diary, /<Timeline/)
  assert.match(diary, /<DiaryDateMark entry=\{entry\} \/>/)
  assert.match(diary, /rowClassName="flex flex-col items-stretch justify-start gap-3 pt-8 md:flex-row md:items-start"/)
  assert.match(diary, /railClassName="relative z-40 w-full self-start px-4 text-left md:sticky md:top-24 md:w-32 md:shrink-0 md:px-0"/)
  assert.match(diary, /labelClassName="block"/)
  assert.doesNotMatch(diary, /labelClassName="[^"]*hidden/)
  assert.match(diary, /className="block text-left leading-none md:pl-12"/)
  assert.match(diary, /splitIsoDate\(entry\.date\)/)
  assert.match(diary, /text-left text-lg font-semibold/)
  assert.match(diary, /text-left text-\[11px\]/)
  assert.doesNotMatch(diary, /dateStart|～/)
  assert.doesNotMatch(diary, /title: group\.year/)
  assert.doesNotMatch(diary, /title: group\.year|src=\{diary\.cover\}|diary-sheet/)
  assert.doesNotMatch(`${home}\n${diary}\n${section}`, /站长字数/)
})
