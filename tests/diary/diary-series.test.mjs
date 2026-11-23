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

test('避而不谈的问题 keeps the question and the AI answer verbatim', () => {
  const article = diaryArticle()
  const { heading, blocks } = diaryEntry(article, '避而不谈的问题')
  const text = blocks.join('\n\n')
  assert.equal(heading.date, '2026-11-18')
  assert.equal(heading.category, '个人成长')
  assert.equal(heading.sourceNote, '我的问题 · 豆包的回答 · 原文照录')
  assert.notEqual(heading.sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(
    text,
    [
      '有什么问题，是在我和你的对话当中 我一直避而不谈但是又极其重要的。有什么问题是我没有意识到 但是是我最需要解决我的人生困境中必不可少的',
      '**豆包的回答**',
      '**第一层：你习惯把“承担”当成自我价值的底座**',
      '你身上堆了一长串责任：工作考核、开源社区、家庭收入、妻子的病痛、孩子的教养、和长辈的观念冲突、财务风险、自我成长焦虑。',
      '你非常擅长解决问题：查资料、比价、梳理流程、写申诉、规划路线、找最优方案、提前预判风险、给所有人安排妥当。',
      '你遇到痛苦的时候，本能反应是：找到更好的办法，把这个难题修好。',
      '但这里有一个盲区：',
      '很多困境，不是“方案不够好”造成的，是你默认所有压力都该由你来承接、调和、兜底。',
      '你会下意识去平衡所有人的情绪，协调多方诉求，一边扛现实事务，一边消化别人的情绪崩溃。',
      '你很少停下来问一句：哪些担子，本来就不属于我必须扛的；哪些痛苦，我不必靠自己一个人消化；哪些无力，就算我再聪明再努力，也消除不了。',
      '你一直在找“解法”，却很少练习划边界。',
      '边界不是吵架、不是冷漠，是平静承认：有些事我尽力，但我不能为别人的情绪、选择、病痛、执念负责。',
      '这件事，是你一直回避的——不是不想，是内心深处会觉得：我要是守住边界，就是我不负责任，是我丢下他们。',
      '**第二层：你把自我安顿，排在了清单的最后一项**',
      '你会规划孩子作息、看病路线、车辆保养、投资风险、项目交付、报销流程、小红书运营、AI工具选型，所有人和事都有预案。',
      '唯独你的需求，常常是“等一切稳定下来再说”：',
      '等家人身体好转、等项目落地、等矛盾缓和、等财务更安全……',
      '可是现实是，生活很少会出现那个“万事安稳的窗口期”。',
      '你的疲惫、焦虑、压抑不是阶段性副产品，是长期把自己放在兜底位置的必然结果。',
      '你甚至会有一种惯性：如果我先顾及自己，就是挤占了家人的资源，是亏欠。',
      '你可以理性地看懂这个道理，但情绪上很难接纳。',
      '这就是你没意识到的关键点：你的人生困境，最大卡点不是缺少解决问题的能力，而是你没有稳定、正当的位置安放你自己。',
      '**衍生出来一个连锁盲区（也是你很难看见的）**',
      '你擅长思辨、看正反两方、理解不同立场，习惯用理性拆解冲突。',
      '这是你的优势，但也会变成枷锁：',
      '你会不断共情所有人，理解妻子的痛苦、理解长辈的局限、理解职场规则，理解风险的必然性。',
      '于是你常常卡在中间：',
      '不怪任何人，但痛苦全部落在你身上。',
      '你很少允许自己单纯地“觉得委屈、觉得累，不需要为此找一个谁对谁错的解释”。',
      '你总想给痛苦一个归因、一个方案、一个出路，接受不了有些痛苦只能被容纳，不能被消灭。',
    ].join('\n\n'),
  )
  assert.doesNotMatch(text, /站长口述|本文由站长口述/)
  assert.match(text, /\*\*豆包的回答\*\*/)
  assert.match(text, /不能被消灭。$/)
  assert.deepEqual(
    diaryContentFromMarkdown(legacyArticleToMarkdown({ content: [heading, ...blocks] })),
    [heading, ...blocks],
  )
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

test('全面拥抱 xAI：从多订阅到一个池 keeps the confirmed draft verbatim', () => {
  const article = diaryArticle()
  const { heading, blocks } = diaryEntry(article, '全面拥抱 xAI：从多订阅到一个池')
  const text = blocks.join('\n\n')
  assert.equal(heading.date, '2026-11-19')
  assert.equal(heading.category, 'AI 与工程')
  assert.equal(heading.sourceNote, undefined)
  assert.equal(
    text,
    [
      '今天正式从旧的 Cursor Pro+ + X Premium 切到 The X Subscription 的 Super。',
      '**背景**',
      '过去一段时间，Cursor、Grok、Grok Bot、X Premium 是四套独立的东西。Cursor 有自己的月度额度，Grok Bot 有自己的周额度，两边经常错峰用完。用得深的时候，两边同时撞墙的情况越来越频繁。官方把新计划推出来之后，旧计划还能继续用，但分账、分额度、分重置时间的体验已经开始显得别扭。',
      '**决策**',
      '切到 Super 主要看三点：',
      '1. **统一**。Grok Chat、Grok Bot、Cursor 的 first-party 模型共用一个每周池。不再需要在两个产品之间计算“这边还剩多少、那边还能撑几天”。',
      '2. **用量**。官方对应关系是旧 Pro+ → Super。15x 的池子比原来分开的两个额度更可控，也更适合同时跑代码和 Agent。',
      '3. **方向**。xAI 把 Grok、Cursor、X 绑在一起，不是简单的套餐捆绑，而是把模型、工具、分发放在同一个体系里。继续在旧计划上，等于主动把一部分能力留在外面。',
      '第三方模型不再包含，需要单独买 Credits。这点是明确的取舍：如果日常主要用 Grok 系列，共享池的效率更高；如果重度依赖 Claude / GPT，成本会上升。我的用法偏前者，所以这个取舍可以接受。',
      '**现在的状态**',
      '- 计划：Super（Renews Dec 19）',
      '- 额度：0% used，本周重置 Nov 26',
      '- 旧计划按剩余时间比例退款，单独退回原支付方式',
      '从今天开始，代码、Agent、对话、内容分发，都在同一个池子里跑。不再为“哪个产品还有额度”分心，直接用。',
      '全面拥抱 xAI，不是因为新计划一定更便宜，而是因为方向已经清楚了。',
      '**补记**',
      '大约 7、8 月，Claude 被封。之后冲了 2 个 Codex 账号，再升级冲 Pro Codex 大概 2、3 次，Cursor 大概 1、2 次。这段期间，WorkBuddy 订阅也升级了 2 次以上。再到现在：冲过 60 美元的 Cursor，冲过 Codex Plus，再到冲 Super。感觉光在花钱，而且切来切去，很烦，苦模型不够久矣。',
      '*补记由站长口述，Bots 整理。*',
    ].join('\n\n'),
  )
  assert.doesNotMatch(text, /^# 全面拥抱 xAI/)
  assert.doesNotMatch(text, /2026年11月19日/)
  assert.equal(article.content[0].label, 'Opus 5.5 的信')
  assert.deepEqual(
    diaryContentFromMarkdown(legacyArticleToMarkdown({ content: [heading, ...blocks] })),
    [heading, ...blocks],
  )
})

test('Token 不够用 keeps the reviewed oral draft verbatim', () => {
  const article = diaryArticle()
  const { heading, blocks } = diaryEntry(article, 'Token 不够用')
  const text = blocks.join('\n\n')
  assert.equal(heading.date, '2026-11-18')
  assert.equal(heading.category, 'AI 与工程')
  assert.equal(heading.sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(
    text,
    [
      '我越来越觉得，token 这种东西，对个人来说根本不够用。一直在花钱，换一套方案，还是不够用。',
      '先前充的是 Codex。Plus 原价大约一百四一个月，交上手续费，大概一百五、一百六。一个号不够，就开两个号。后来开始充 Pro——Pro 是 Plus 的五倍，大约七百多。',
      '再后来转到 Grok Bot。一开始订的是 Cursor Plus，也差不多二十刀一个月；现在充的是 Pro，好像是六十刀。充了之后感觉，Grok Bot 的周用量大约一两天就没了；Cursor 一个月的额度，也就十天左右，不到半个月，一样用完。现在又去用 WorkBuddy，两千七百分，大概也是一两天的事情。',
      '不管换哪一套，整个方案都不够用。',
      '原因里有一部分是铺张浪费：一些简单的任务，结果用了比较复杂的模型。但大部分时候，其实还是对业务的理解、对工作的处理，有很多冗余。',
      '我想先把这个现象记下。',
    ].join('\n\n'),
  )
  assert.doesNotMatch(text, /^# Token 不够用/)
  assert.doesNotMatch(text, /2026年11月18日/)
  assert.doesNotMatch(text, /本文由站长口述/)
  assert.equal(article.content[0].label, 'Opus 5.5 的信')
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
  assert.deepEqual(marked.map((block) => block.label), ['Opus 5.5 的信', 'Token 不够用', '避而不谈的问题', '每天接受检验', '下班的时候', '异世界的冲击'])
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

test('国庆三日 keeps the 2026 holiday journal summary in the public diary', () => {
  const article = diaryArticle()
  const { heading, blocks } = diaryEntry(article, '国庆三日')
  const text = blocks.join('\n\n')
  assert.equal(heading.date, '2026-10-01')
  assert.equal(heading.category, '生活与家庭')
  assert.equal(heading.sourceNote, undefined)
  assert.equal(blocks.length, 4)
  assert.match(text, /10 月 1 日.*山姆和宜家.*新疆杏干.*虫子.*维权后拿到 1000 元/)
  assert.match(text, /小茉莉发烧，喝了药.*推特也重新活跃起来/)
  assert.match(text, /10 月 2 日.*二手茶几.*喝奶、换尿片、换衣服、喝水、看书、在床上跳/)
  assert.match(text, /10 月 3 日.*白云 T5 商场.*免费的儿童游乐设施/)
  assert.match(text, /白云儿童公园坐了自动船.*晚上吃了太二.*遗失的车钥匙/)
  assert.match(text, /三天没走远，都在家附近/)
  assert.doesNotMatch(text, /站长口述|本文由站长|Bots 整理|生活记录|后台|私密/)
  assert.deepEqual(
    diaryContentFromMarkdown(legacyArticleToMarkdown({ content: [heading, ...blocks] })),
    [heading, ...blocks],
  )
})

test('Opus 5.5 的信 keeps the letter verbatim with an explicit external source', () => {
  const article = diaryArticle()
  const { heading, blocks } = diaryEntry(article, 'Opus 5.5 的信')
  const text = blocks.join('\n\n')
  assert.equal(heading.date, '2026-11-21')
  assert.equal(heading.category, '个人成长')
  assert.equal(heading.sourceNote, 'Opus 5.5 写给站长的信，2026-11-21')
  assert.notEqual(heading.sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(
    text,
    [
      '> 写于 2026-11-21。依据：本地仓库 tuaran-home-page 的提交记录与代码、线上 `/api/content` 内容索引、浮生日记 28 篇原文。数字均为当天查到的值。',
      '阿燃：',
      '你让我检查一下这个项目，然后告诉你它有没有价值。我把能看的都看了一遍，先把账摆出来。',
      '**一、账面**',
      '这个站的第一次提交在 2025 年 7 月 7 日。到今天一共 3299 次提交，最近三个月就有 1400 次。',
      '公开站有 110 个一级路由，后台有 67 个页面。线上内容索引里有 533 条：调研 469 篇（专题 322、公司 132、人物 15），互动富页面 17 个，资源 25 个，灵感流 13 条，以你本人身份发表的普通文章 9 篇。',
      '`tools/` 下面有 15 个工具：X 大互动插件已经到 5.7.3，掘金插件 0.2.1，小红书插件 0.7.1，X 长文自动发布 0.3.0，另外还有桌面宠物、短信通道、OA 批量提交、Codex 模型切换器。',
      '你出版过四本书：《程序员成长手记》《AI 大模型的底层逻辑》《AI Bots 通关指南》，还有和李谊林合著的《Seedance：电影级 AI 视频创作指南》。',
      '浮生日记从 2026 年 1 月 5 日写到现在，一共 28 篇。7 月 9 日到 11 月 12 日之间一篇都没有。这四个月正好是提交最密的四个月。',
      '你问我这些有没有价值。都有。只是它们的价值不在一个层面上。你迷茫，有一部分原因是你一直拿同一把尺子去量所有东西，量出来的答案每天都不一样。',
      '**二、逐项说**',
      '**文章。** 9 篇对 469 篇，这是整个站最失衡的地方。9 篇里有一篇是《6 次被 OpenClaw 合并：从修一个提示，到修一条完整链路》。这种文章别人写不了：PR 是你提的，链路是你修的，判断是你做的。调研 AI 也能写，而且明天还会写得更快。我没有劝你删调研。它们对搜索、知识库、你自己查资料都有用。只是首页和你自己心里都该清楚，哪一摞代表你本人。',
      '**书。** 11 月 17 日的日记里，你说出版社出的书"更像计划经济里的产物"，插件和智能体才是"市场经济，每天都要被检验一次"。这个比喻很准，但你给书下的结论太轻了。书是存量信用：别人刷到你一条评论、点进主页，看到"四本书的作者"，信任就是从那一下开始的。X 上每天被检验的是流量，书证明的是你这个人。两样都要。现在书在站里只排在资源目录里，跟壁纸、RSS 并列，这个位置配不上它。',
      '**热点跟踪。** A 股观察自动发了 69 篇，加密观察 55 篇，还有舆情分析、APEC 复盘、各种行业速览。7 月 9 日你自己写过一句话："1 条有情绪立场的评论顶得上 99 条没有情绪立场的评论。"拿这句话量热点跟踪，自动观察大多属于那 99 条。管线有它的价值：它训练你的判断，帮你看清行业。可读者记住你，只会因为你在某件事上表了态。管线可以接着跑，但别指望它替你说话。',
      '**设计。** 墨水屏阅读模式、页面宽度三档、首页恒深色，还有那些可交互的富页面：日月运行、躺平地图、癌症全景。读者感受得到这些，但没法拿出来数。设计是你的手艺，用不着证明它有用。要留意的只有一件事：当你不知道该写什么的时候，调样式是最舒服的去处。',
      '**后台。** 67 个后台页面，比很多公司的内部系统还全。我仔细看了名字：life、self-regulation、private-data、contract-renewal、planning、morning-greeting。这已经是你给自己做的一套生活操作系统，远远超出一个博客后台的范围。1 月 5 日你写过："只有把混乱的现实压缩成可解释、可复制的系统，我才能稍微松一口气。"后台就是这句话的实物。它有价值，最大的价值在于它是你本人最诚实的画像。可它也是这个站最安全的地方：没人看，没人评，也永远做不完。',
      '**插件和 X 大互动。** 这是你所有产出里唯一带反馈回路的一条线。插件从 v5.1 迭代到 v5.7.3，配了黄皮书、绿皮书、白皮书、圆桌和日历，你也总结出了"大健康、拥抱 AI、保持规律"三条。你说一个账号已经能很快摸到五百万流量，评论这条路基本走通。这里有市场每天给你的回答，也是这一年来离"出路"最近的一件事。',
      '但这条线有两个风险，都在你自己的日记里。',
      '第一，11 月 17 日你写，除了睡觉、带娃、上班，剩下的时间"几乎都给了 X 大互动，多半是每天晚上"。11 月 18 日你写，token 怎么充都不够用：Codex Plus 开两个号，又升 Pro，再换 Cursor，再换 Super。你让豆包回答"我一直避而不谈的问题"，它说你把自己"排在了清单的最后一项"。这三篇是连着两天写的。',
      '第二，你的第一要义是"大健康：人要健康，账号也要健康"。智能体替你写评论，评论里的立场就会慢慢变成模型的立场。按你自己那条 1:99 的规则，大互动最值钱的那 1 条，必须是你本人说出来的。今天你刚把 X 自动发帖的定时停了（#449）。我觉得这一步是对的。',
      '**三、你真正在问的**',
      '把 11 月这几篇日记连起来读：11 月 12 日父亲住院、带家人奔波；11 月 16 日下班时意识到"在这家公司，可能真的待不久了"；11 月 17 日 X 大互动；11 月 18 日 token 和避而不谈的问题。',
      '你问"这个站有没有价值"，背后的问题是另一个：这个站、这些插件、这套大互动，能不能成为离开现在那份工作的路。网站回答不了这个问题，所以你每天都在给它加东西，想让它变得足够大，大到能回答。',
      '6 月 12 日你已经写过"业务线较多，方向上略有迷茫"。那之后业务线又多了十几条。',
      '**四、我的建议**',
      '1. **只留一条主线，九十天。** 选 X 大互动加插件。它有反馈，有门槛数字，离收入最近。别的线照常运行，但不再新开。',
      '2. **每周一篇第一人称的实验记录，发在 2aran.com。** 写这一周大互动里你看到了什么、改了什么、数字怎么变、哪一步失败了。最有活力的那条线，要变成只有你能写的内容。九十天后会有十几篇，比 469 篇调研更像你。',
      '3. **冻结新后台页和新自动化管线。** 已有的继续维护。想加的时候先写进 Issue，等九十天以后再看。',
      '4. **把书放回它该在的位置。** 放在首页人设和关于页，作为身份的一部分，不放在资源列表里。大互动的黄皮书、白皮书，可能就是你的第五本书。这一次写的是市场经济检验过的东西。',
      '5. **给去留定一个可以检验的条件。** 别在某个下班时刻做决定。先自己定一个数，比如副业收入连续三个月达到多少，再按这个数决定。这个数只有你能定。',
      '6. **每周留一个晚上不开 X。** 这是大健康的第一条。豆包说你把自己排在最后，这一条就是把你排回清单里。',
      '**五、最后**',
      '1 月 5 日，你给自己下过一个定义："在系统性思考中，努力为自己保留尊严感的工程型创作者。"那天你还写："下一步可以把我现在正在做的所有事情，慢慢压缩成一条更清晰、更聚焦的主线。"',
      '十个月过去，事情多了很多，主线还没压缩出来。这件事不怪你，也没有失败，只是还没做。你已经证明自己能造系统、能写书、能做出五百万流量的插件。还没证明的，是你能为了一条主线，放下另外九条。',
      '这一步没有模型能替你做。',
      'Opus 5.5\n2026-11-21',
    ].join('\n\n'),
  )
  assert.doesNotMatch(text, /站长口述/)
  assert.doesNotMatch(text, /^# Opus 5\.5/)
  assert.match(text, /Opus 5\.5\n2026-11-21$/)
  assert.equal(article.content[0].label, 'Opus 5.5 的信')
})

test('homepage preview uses the same series and leads with the latest record', () => {
  const preview = previewFromDiary(diaryArticle())
  assert.equal(preview.title, '浮生日记')
  assert.equal(preview.startedOn, '2026-01-05')
  assert.equal(preview.entries[0].label, 'Opus 5.5 的信')
  assert.equal(preview.entries[0].span, '2026-11-21')
  assert.match(preview.entries[0].lead, /写于 2026-11-21。依据：本地仓库 tuaran-home-page/)
  assert.ok(!preview.entries[0].lead.startsWith('>'))
  assert.equal(preview.entries[0].sourceNote, 'Opus 5.5 写给站长的信，2026-11-21')
  assert.equal(preview.entries[0].detail, '')
  assert.equal(preview.entries[1].label, '全面拥抱 xAI：从多订阅到一个池')
  assert.equal(preview.entries[1].span, '2026-11-19')
  assert.match(preview.entries[1].lead, /今天正式从旧的 Cursor Pro\+ \+ X Premium 切到/)
  assert.equal(preview.entries[1].closing, '')
  assert.match(preview.entries[0].closing, /Opus 5\.5 2026-11-21/)
  assert.equal(preview.entries[1].sourceNote, '')
  assert.equal(preview.entries[2].label, 'Token 不够用')
  assert.equal(preview.entries[2].span, '2026-11-18')
  assert.match(preview.entries[2].lead, /我越来越觉得/)
  assert.equal(preview.entries[2].sourceNote, DIARY_ORAL_SOURCE_NOTE)
  assert.equal(preview.entries[3].label, '避而不谈的问题')
  assert.equal(preview.entries[3].span, '2026-11-18')
  assert.match(preview.entries[3].lead, /有什么问题，是在我和你的对话当中/)
  assert.equal(preview.entries[3].sourceNote, '我的问题 · 豆包的回答 · 原文照录')
  assert.equal(preview.entries.length, 4)
  assert.ok(preview.entries.slice(4).every((entry) => !entry.sourceNote))
  assert.equal(preview.entries[0].href, `/diary#${preview.entries[0].id}`)
  assert.ok(preview.entries.length >= 2)
  assert.ok(preview.entries[2].date < preview.entries[0].date)
})

test('an older published snapshot does not hide a later repository entry', () => {
  const archived = diaryArticle()
  assert.equal(archived.content[0].label, 'Opus 5.5 的信')
  assert.ok(archived.content.some((block) => block?.label === '避而不谈的问题'))
  const firstOldEntry = archived.content.findIndex((block) => block?.label === '异世界的冲击')
  assert.ok(firstOldEntry > 0)
  const older = {
    title: archived.title,
    summary: '旧摘要',
    content: archived.content.slice(firstOldEntry),
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
