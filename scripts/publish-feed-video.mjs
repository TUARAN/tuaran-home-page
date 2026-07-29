import { access, mkdtemp, rm, stat } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'

const CACHE_CONTROL = 'public, max-age=31536000, immutable'
const BUCKET = 'tuaran-media'

function usage() {
  console.error('Usage: node scripts/publish-feed-video.mjs <input.mp4> [feed/object-name.mp4]')
  process.exit(1)
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${command} exited with status ${code}`))
    })
  })
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

const inputArg = process.argv[2]
if (!inputArg) usage()

const input = resolve(inputArg)
await access(input)

if (extname(input).toLowerCase() !== '.mp4') {
  throw new Error('Feed videos must use an .mp4 filename.')
}

const objectKey = (process.argv[3] || `feed/${basename(input)}`).replace(/^\/+/, '')
if (!objectKey.startsWith('feed/') || !objectKey.endsWith('.mp4')) {
  throw new Error('The R2 object key must match feed/*.mp4.')
}

const workDir = await mkdtemp(join(tmpdir(), 'tuaran-feed-video-'))
const optimized = join(workDir, basename(objectKey))

try {
  console.log(`[feed-video] Optimizing ${input}`)
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel', 'warning',
    '-y',
    '-i', input,
    '-map', '0:v:0',
    '-map', '0:a?',
    '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '24',
    '-maxrate', '4M',
    '-bufsize', '8M',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    optimized,
  ])

  const [before, after] = await Promise.all([stat(input), stat(optimized)])
  console.log(`[feed-video] ${formatMiB(before.size)} → ${formatMiB(after.size)}`)

  console.log(`[feed-video] Uploading r2://${BUCKET}/${objectKey}`)
  await run('pnpm', [
    'dlx',
    'wrangler@4.114.0',
    'r2',
    'object',
    'put',
    `${BUCKET}/${objectKey}`,
    '--file', optimized,
    '--content-type', 'video/mp4',
    '--cache-control', CACHE_CONTROL,
    '--remote',
    '--force',
  ])

  console.log(`[feed-video] Published ${objectKey}`)
} finally {
  await rm(workDir, { recursive: true, force: true })
}
