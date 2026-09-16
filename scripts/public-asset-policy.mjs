export const MAX_FILE_BYTES = 25 * 1024 * 1024
export const PLATFORM_FILE_COUNT_LIMIT = 20_000
export const REPOSITORY_FILE_COUNT_LIMIT = 15_000
export const FILE_COUNT_WARNING = 8_000

export function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

export function evaluatePublicAssets(files) {
  const warnings = []
  const errors = []
  const oversized = files
    .filter((item) => Number(item.size) > MAX_FILE_BYTES)
    .sort((left, right) => Number(right.size) - Number(left.size))
    .map((item) => ({
      file: String(item.file || ''),
      size: Number(item.size) || 0,
    }))

  if (oversized.length) {
    const listed = oversized
      .map((item) => `  - public/${item.file} (${formatMiB(item.size)})`)
      .join('\n')
    errors.push(
      `Cloudflare Pages only supports files up to ${formatMiB(MAX_FILE_BYTES)}. Move these files to R2 and reference them with R2_PUBLIC_BASE/feedMediaUrl:\n${listed}`,
    )
  }

  const fileCount = files.length
  if (fileCount >= PLATFORM_FILE_COUNT_LIMIT) {
    errors.push(
      `public/ has ${fileCount} files; Cloudflare Pages Free plan allows at most ${PLATFORM_FILE_COUNT_LIMIT} files per site.`,
    )
  } else if (fileCount >= REPOSITORY_FILE_COUNT_LIMIT) {
    errors.push(
      `public/ has ${fileCount} files; repository budget is ${REPOSITORY_FILE_COUNT_LIMIT} (platform Free limit ${PLATFORM_FILE_COUNT_LIMIT}). Move bulky trees to R2 before the Pages upload step.`,
    )
  } else if (fileCount >= FILE_COUNT_WARNING) {
    warnings.push(
      `public/ has ${fileCount} files; approaching the repository budget ${REPOSITORY_FILE_COUNT_LIMIT}.`,
    )
  }

  return { fileCount, oversized, warnings, errors }
}
