import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

import { archiveImageView, archiveShanghaiDate } from '../../lib/interaction/archiveImage.js'

const KEPT_IDS = [
  '2118227929754948000',
  '2117966345736446301',
  '2117898382610215223',
  '2117846382329655356',
  '2116921085610561809',
  '2116733139548794896',
  '2116487349265911919',
  '2116345981411406123',
  '2116145170450382939',
  '2116092523408204109',
  '2115820723495452859',
  '2114896430125158863',
  '2114553923268939785',
  '2113879222380867740',
  '2113806563941257537',
]

const ADDED_IDS = [
  '2118189514292441406',
  '2117092447256019178',
  '2116424261426622648',
  '2113555612902752572',
  '2113450589103538387',
  '2112395844578410695',
  '2112122996844630088',
  '2111783087034265618',
  '2111771180952846401',
  '2111697760059879567',
  '2111419862044344498',
  '2110914335946240087',
  '2109828687038476467',
  '2108854541815038461',
  '2106008661487452220',
]

const EXPANDED_IDS = [
  '2117590691874562103',
  '2109581955566326200',
  '2108879044615835657',
  '2108851072655831195',
  '2108734217743958283',
  '2107793230393970903',
  '2100950575148044493',
  '2100791248298635273',
  '2100185809685287069',
  '2100067122525184214',
  '2099311169731489871',
  '2099283867790360632',
  '2098982634286362701',
  '2098723006034088440',
  '2098589702433427563',
  '2098228115818291260',
  '2095077056531034493',
  '2091798766445862930',
  '2091505385983422609',
  '2089943704761233541',
  '2089615645554188373',
  '2086690916409221451',
  '2086452498500649222',
  '2086100592188178700',
  '2085939221492031642',
  '2085895425421349255',
  '2085683036750811550',
  '2085566982699831305',
  '2084571349557887288',
  '2082801054526369975',
  '2082733045829025884',
  '2081573119404425254',
  '2080584403617816815',
  '2079414013839212710',
  '2079114108969042121',
  '2078385146546573505',
  '2078145752262754765',
  '2077915587783901492',
  '2077592422612381716',
  '2077552765996572819',
  '2077378608008679908',
  '2076967987723333930',
  '2076194774118474129',
  '2075028982760874177',
  '2073794076831625384',
]

const NO_IMAGE_IDS = [
  '2113806563941257537',
  '2108879044615835657',
  '2108851072655831195',
  '2107793230393970903',
  '2106008661487452220',
  '2100067122525184214',
  '2098982634286362701',
  '2098228115818291260',
  '2091505385983422609',
  '2085895425421349255',
  '2085566982699831305',
  '2081573119404425254',
  '2080584403617816815',
  '2079414013839212710',
  '2079114108969042121',
  '2078145752262754765',
  '2077915587783901492',
  '2077592422612381716',
  '2077552765996572819',
  '2077378608008679908',
  '2076967987723333930',
  '2075028982760874177',
]

test('archive image view prefers a local public path and still accepts a string URL', () => {
  assert.deepEqual(
    archiveImageView({
      url: 'https://pbs.twimg.com/media/example.jpg',
      localPath: '/resources/big-interaction-whitepaper/archive/1-1.jpg',
    }),
    {
      src: '/resources/big-interaction-whitepaper/archive/1-1.jpg',
      href: '/resources/big-interaction-whitepaper/archive/1-1.jpg',
    },
  )
  assert.deepEqual(
    archiveImageView({ url: 'https://pbs.twimg.com/media/example.jpg', localPath: 'images/1-1.jpg' }),
    { src: 'https://pbs.twimg.com/media/example.jpg', href: 'https://pbs.twimg.com/media/example.jpg' },
  )
  assert.deepEqual(archiveImageView('https://pbs.twimg.com/media/plain.jpg'), {
    src: 'https://pbs.twimg.com/media/plain.jpg',
    href: 'https://pbs.twimg.com/media/plain.jpg',
  })
  assert.equal(archiveImageView(''), null)
  assert.equal(archiveImageView({ url: '', localPath: '' }), null)
  assert.equal(archiveShanghaiDate('2026-09-13T23:47:31.000Z'), '2026-09-14')
  assert.equal(archiveShanghaiDate('2026-07-05T15:40:11.000Z'), '2026-07-05')
  assert.equal(archiveShanghaiDate('2026-11-05T06:24:27.000Z'), '2026-11-05')
})

test('big interaction archive keeps seventy-five posts and local images for the posts that have them', async () => {
  const archive = JSON.parse(await readFile(new URL('../../lib/interaction/bigInteractionArchive.json', import.meta.url), 'utf8'))
  assert.equal(archive.account, 'tarsixseveneig1')
  assert.equal(archive.checked, 90)
  assert.equal(archive.capturedAt, '2026-11-05T12:28:17.792Z')
  assert.equal(archive.posts.length, 75)

  const ids = archive.posts.map((post) => post.id)
  const createdAt = archive.posts.map((post) => post.createdAt)
  assert.deepEqual(createdAt, [...createdAt].sort((left, right) => right.localeCompare(left)))
  assert.equal(archive.posts[0].createdAt, '2026-11-05T06:24:27.000Z')
  assert.equal(archive.posts.at(-1).createdAt, '2026-07-05T15:40:11.000Z')
  assert.equal(archive.posts.at(-1).id, '2073794076831625384')

  for (const id of [...KEPT_IDS, ...ADDED_IDS, ...EXPANDED_IDS]) assert.equal(ids.includes(id), true)
  assert.equal(new Set(ids).size, 75)
  assert.deepEqual(ids.filter((id) => !archive.posts.find((post) => post.id === id).images.length).sort(), [...NO_IMAGE_IDS].sort())

  assert.equal(archive.posts.find((post) => post.id === '2117092447256019178').reviewStatus, '待复核')
  assert.equal(archive.posts.find((post) => post.id === '2116424261426622648').reviewStatus, '待复核')

  let imageCount = 0
  for (const post of archive.posts) {
    assert.equal(post.textMayBeTruncated, false)
    assert.equal(Array.isArray(post.images), true)
    if (NO_IMAGE_IDS.includes(post.id)) {
      assert.deepEqual(post.images, [])
      continue
    }
    assert.ok(post.images.length >= 1)
    for (const [index, image] of post.images.entries()) {
      imageCount += 1
      assert.match(image.url, /^https:\/\/pbs\.twimg\.com\//)
      assert.equal(image.localPath, `/resources/big-interaction-whitepaper/archive/${post.id}-${index + 1}.jpg`)
      const fileUrl = new URL(`../../public${image.localPath}`, import.meta.url)
      await access(fileUrl)
      const bytes = await readFile(fileUrl)
      assert.equal(bytes[0], 0xff)
      assert.equal(bytes[1], 0xd8)
      const view = archiveImageView(image)
      assert.equal(view.src, image.localPath)
      assert.equal(view.href, image.localPath)
    }
  }
  assert.equal(imageCount, 56)
})

test('whitepaper archive copy records three collection passes and reads local images', async () => {
  const page = await readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8')
  assert.match(page, /archiveImageView/)
  assert.match(page, /<ArchivePostImages images=\{post\.images\} \/>/)
  assert.match(page, /archiveShanghaiDate\(post\.createdAt\)/)
  assert.match(page, /共 \{archive\.posts\.length\} 条/)
  assert.match(page, /2026-07-05 23:40/)
  assert.match(page, /2026-11-05 14:24/)
  assert.match(page, /主页检查 319 条/)
  assert.match(page, /留下 15 条/)
  assert.match(page, /最早到 2026-10-24/)
  assert.match(page, /留下 30 条/)
  assert.match(page, /最早到 2026-10-02/)
  assert.match(page, /再加入 45 条/)
  assert.match(page, /互关/)
  assert.match(page, /交朋友/)
  assert.match(page, /互相关注/)
  assert.match(page, /浇友/)
  assert.match(page, /大互动理论/)
  assert.match(page, /关注突破/)
  assert.match(page, /破鼎/)
  assert.match(page, /破粉/)
  assert.match(page, /checked 字段是 \{archive\.checked\}，记下这次扩展关键词检索的唯一 ID 数量/)
  assert.match(page, /主页扫描另行检查过 319 条/)
  assert.match(page, /2026-07-05 之前翻页/)
  assert.match(page, /尚未收录/)
  assert.match(page, /配图使用本站文件/)
  assert.match(page, /这些帖子本身不带图片/)
  assert.doesNotMatch(page, /模型筛出/)
  assert.doesNotMatch(page, /图片仍使用 X 媒体地址/)
  assert.doesNotMatch(page, /从 @\{archive\.account\} 的主页扫描 \{archive\.checked\}/)
})
