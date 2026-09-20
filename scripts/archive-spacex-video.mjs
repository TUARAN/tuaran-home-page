#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  buildArchiveDraft,
  chooseNearestLaunch,
  timelineEntryFromDraft,
  validateArchiveDraft,
} from './spacex-video-archive-core.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const archiveModule = path.join(projectRoot, 'lib/spacexArchivedLaunches.js')
const draftDir = path.join(projectRoot, 'tmp/spacex-archive')
const maxPublicBytes = 24 * 1024 * 1024

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith('--')) positional.push(value)
    else if (value === '--allow-unverified') flags.allowUnverified = true
    else flags[value.slice(2)] = argv[++index]
  }
  return { positional, flags }
}

function run(binary, args) {
  const result = spawnSync(binary, args, { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`${binary} 执行失败：${result.stderr || result.stdout}`)
  return result.stdout
}

function videoMetadata(videoPath) {
  const raw = run('ffprobe', ['-v', 'error', '-show_entries', 'format=size,duration:format_tags=creation_time', '-of', 'json', videoPath])
  const format = JSON.parse(raw).format || {}
  return {
    size: Number(format.size || 0),
    duration: Number(format.duration || 0),
    creationTime: format.tags?.creation_time?.replace(/\.\d+Z$/, 'Z') || null,
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': '2aran-spacex-archive/1.0' } })
  if (!response.ok) throw new Error(`Launch Library 2 返回 ${response.status}: ${url}`)
  return response.json()
}

async function createDraft(videoPath, flags) {
  const metadata = videoMetadata(videoPath)
  if (!metadata.creationTime) throw new Error('视频没有 creation_time；请先用 ffmpeg 写入时间或手工提供已核验草稿')
  const center = Date.parse(metadata.creationTime)
  const windowMs = 12 * 60 * 60 * 1000
  const from = new Date(center - windowMs).toISOString()
  const to = new Date(center + windowMs).toISOString()
  const listUrl = `https://ll.thespacedevs.com/2.3.0/launches/previous/?limit=25&lsp__name=SpaceX&ordering=-net&net__gte=${encodeURIComponent(from)}&net__lte=${encodeURIComponent(to)}`
  const list = await fetchJson(listUrl)
  const match = chooseNearestLaunch(list.results || [], metadata.creationTime)
  if (!match) throw new Error('creation_time 前后 12 小时内没有找到 SpaceX 已发射任务')
  const detail = await fetchJson(match.launch.url)
  const draft = buildArchiveDraft(detail, {
    creationTime: metadata.creationTime,
    postUrl: flags['post-url'] || '',
    videoDescription: flags.description || '',
  })
  draft.match = {
    videoFile: path.resolve(videoPath),
    videoBytes: metadata.size,
    videoDurationSeconds: metadata.duration,
    deltaSeconds: Math.round(match.deltaMs / 1000),
    ll2LaunchId: detail.id,
  }
  await mkdir(draftDir, { recursive: true })
  const output = path.resolve(flags.output || path.join(draftDir, `${draft.timelineDraft.id}.json`))
  await writeFile(output, `${JSON.stringify(draft, null, 2)}\n`)
  console.log(JSON.stringify({ matched: detail.name, deltaSeconds: draft.match.deltaSeconds, draft: output }, null, 2))
}

async function encodeVideo(input, output, { start, duration } = {}) {
  const metadata = videoMetadata(input)
  await mkdir(path.dirname(output), { recursive: true })
  if (!start && !duration && metadata.size <= maxPublicBytes) {
    await copyFile(input, output)
    return { transcoded: false, bytes: metadata.size }
  }
  const outputDuration = Math.max(Number(duration) || metadata.duration, 1)
  const targetVideoKbps = Math.max(800, Math.min(3200, Math.floor(((18 * 1024 * 1024 * 8) / outputDuration / 1000) - 128)))
  const inputArgs = ['-y', ...(start ? ['-ss', start] : []), '-i', input, ...(duration ? ['-t', duration] : [])]
  run('ffmpeg', [
    ...inputArgs,
    '-vf', 'scale=min(1920\\,iw):-2',
    '-c:v', 'libx264', '-preset', 'medium', '-b:v', `${targetVideoKbps}k`,
    '-maxrate', `${Math.round(targetVideoKbps * 1.25)}k`, '-bufsize', `${targetVideoKbps * 2}k`,
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output,
  ])
  const result = await stat(output)
  if (result.size > maxPublicBytes) throw new Error(`压缩后仍超过 24 MiB：${result.size} bytes`)
  return { transcoded: true, bytes: result.size }
}

async function archiveDraft(draftPath, videoPath, flags) {
  const record = JSON.parse(await readFile(draftPath, 'utf8'))
  const errors = validateArchiveDraft(record, { allowUnverified: Boolean(flags.allowUnverified) })
  if (errors.length) throw new Error(errors.join('\n'))

  const moduleUrl = `${pathToFileURL(archiveModule).href}?t=${Date.now()}`
  const current = [...(await import(moduleUrl)).SPACEX_ARCHIVED_LAUNCHES]
  const duplicate = current.find((entry) => entry.id === record.timelineDraft.id
    || Math.abs(Date.parse(entry.publishedAt) - Date.parse(record.launchedAtUtc)) < 60_000)
  if (duplicate) throw new Error(`归档已存在：${duplicate.id}`)

  const videoName = `${record.timelineDraft.id.replace(/^spacex-/, '')}.mp4`
  const videoOutput = path.join(projectRoot, 'public/videos', videoName)
  const encoded = await encodeVideo(videoPath, videoOutput, { start: flags.start, duration: flags.duration })
  const entry = timelineEntryFromDraft(record, `/videos/${videoName}`)
  current.push(entry)
  current.sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt))

  const generated = `// This file is rewritten by scripts/archive-spacex-video.mjs after a launch is verified.\n// Keep the export as a plain array so the archive can run in Next.js' Edge runtime.\nexport const SPACEX_ARCHIVED_LAUNCHES = ${JSON.stringify(current, null, 2)}\n`
  const temporary = `${archiveModule}.tmp`
  await writeFile(temporary, generated)
  await rename(temporary, archiveModule)
  console.log(JSON.stringify({ archived: entry.id, video: videoOutput, ...encoded }, null, 2))
}

function usage() {
  console.log(`用法：
  npm run spacex:video:match -- <video.mp4> --post-url <SpaceX X 帖子> [--description <画面说明>]
  npm run spacex:video:archive -- <draft.json> <video.mp4> [--start HH:MM:SS] [--duration 秒数]

match 会用 MP4 creation_time 匹配 Launch Library 2，并在 tmp/spacex-archive 生成草稿。
archive 只接受已成功发射、来源完整且 needsVerification 为空的草稿，并自动截取/压缩视频、写入时间线。`)
}

const { positional, flags } = parseArgs(process.argv.slice(2))
const [command, ...inputs] = positional
try {
  if (command === 'match' && inputs[0]) await createDraft(path.resolve(inputs[0]), flags)
  else if (command === 'archive' && inputs[0] && inputs[1]) await archiveDraft(path.resolve(inputs[0]), path.resolve(inputs[1]), flags)
  else {
    usage()
    process.exitCode = command ? 1 : 0
  }
} catch (error) {
  console.error(`[spacex-archive] ${error.message}`)
  process.exitCode = 1
}
