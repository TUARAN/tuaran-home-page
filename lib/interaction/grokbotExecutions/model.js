/**
 * 大互动日历 · Grokbot 执行记录
 *
 * 独立于每日互动前十和本账号任务次数。
 * 落盘：`lib/interaction/grokbotExecutions/records.json`
 * 只收录已公开审计字段：账号链接、规则、时间、计数、核验状态、批次进度。
 * 待执行只写计数，不写账号名单。
 *
 * schemaVersion: 1
 */

export const GROKBOT_EXECUTIONS_SCHEMA_VERSION = 1
export const GROKBOT_EXECUTION_ACTOR = 'Grokbot'
export const GROKBOT_EXECUTION_TIMEZONE = 'Asia/Shanghai'
export const GROKBOT_EXECUTION_TITLE = 'Grokbot 执行记录'
export const GROKBOT_EXECUTION_OWNER_HANDLE = 'tarsixseveneig1'
export const GROKBOT_EXECUTION_OWNER_ID = '1059979808292069376'

export const SERIES_STATUS = {
  completed: 'completed',
  inProgress: 'in_progress',
}

export const RESULT_STATUS = {
  success: 'success',
  failure: 'failure',
  skipped: 'skipped',
}

export const VERIFICATION_STATUS = {
  verified: 'verified',
  pending: 'pending',
}

export const SERIES_STATUS_LABEL = {
  completed: '已完成',
  in_progress: '进行中',
}

export const RESULT_STATUS_LABEL = {
  success: '成功',
  failure: '失败',
  skipped: '跳过',
}

export const VERIFICATION_STATUS_LABEL = {
  verified: '已核验',
  pending: '待核验',
}

export const HANZI_DETECTION_COPY = '汉字检测只看昵称和简介是否出现 CJK 表意文字（统一汉字及扩展/兼容区）。不能用它判定地区、国籍，也不能区分简体和繁体。日文汉字算「有汉字」；仅有假名、韩文、拉丁字母、符号或空白，算「无汉字」。空简介且昵称无汉字仍会入选。'

const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const PRIVATE_PATH_RE = /\/workspace|x-unfollow-audit|pendingAccounts|pendingHandles|pendingUsernames|DAILY_TOP_INGEST|bearer\s+[A-Za-z0-9._-]+/i
const FORBIDDEN_ACTOR_RE = /Grokbox/

function fail(context, message) {
  throw new Error(`${context}: ${message}`)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0
}

function assertActor(value, context) {
  if (value !== GROKBOT_EXECUTION_ACTOR) fail(context, `执行者必须是 ${GROKBOT_EXECUTION_ACTOR}`)
  if (FORBIDDEN_ACTOR_RE.test(String(value))) fail(context, '执行者不得写成 Grokbox')
}

function assertNoPrivatePayload(value, context) {
  const blob = JSON.stringify(value)
  if (PRIVATE_PATH_RE.test(blob) || FORBIDDEN_ACTOR_RE.test(blob)) {
    fail(context, '公开记录含有私有路径、密钥痕迹、待执行名单或错误执行者名称')
  }
}

function validateAccount(account, context) {
  if (!account || typeof account !== 'object') fail(context, '账号记录无效')
  if (!HANDLE_RE.test(account.username || '')) fail(context, '账号 handle 无效')
  if (account.profileUrl !== `https://x.com/${account.username}`) fail(context, '账号链接必须是 https://x.com/{handle}')
  if (!isNonEmptyString(account.completedAtAsiaShanghai)) fail(context, '缺少完成时间')
  if (!RESULT_STATUS_LABEL[account.resultStatus]) fail(context, '结果状态必须是成功、失败或跳过')
  if (!VERIFICATION_STATUS_LABEL[account.verificationStatus]) fail(context, '核验状态必须是已核验或待核验')
  if (account.pendingUsername || account.pendingHandle) fail(context, '不得写入待执行账号')
}

function validateBatch(batch, context) {
  if (!batch || typeof batch !== 'object') fail(context, '批次无效')
  if (!Number.isInteger(batch.index) || batch.index < 1) fail(context, '批次序号无效')
  if (!DATE_RE.test(batch.date || '')) fail(context, '批次日期无效')
  if (!isNonEmptyString(batch.startedAtAsiaShanghai) || !isNonEmptyString(batch.completedAtAsiaShanghai)) {
    fail(context, '批次缺少起止时间')
  }
  if (!batch.counts || !isCount(batch.counts.attempted) || !isCount(batch.counts.succeeded) || !isCount(batch.counts.skipped) || !isCount(batch.counts.failed)) {
    fail(context, '批次计数不完整')
  }
  if (!VERIFICATION_STATUS_LABEL[batch.verificationStatus]) fail(context, '批次核验状态无效')
  if (!Array.isArray(batch.accounts)) fail(context, '批次账号列表无效')
  batch.accounts.forEach((account, index) => validateAccount(account, `${context} accounts[${index}]`))
}

function queuePending(series) {
  if (isCount(series?.counts?.pending)) return series.counts.pending
  if (isCount(series?.queue?.pending)) return series.queue.pending
  return 0
}

export function derivedSeriesStatus(series) {
  if (queuePending(series) > 0) return SERIES_STATUS.inProgress
  if (series?.status === SERIES_STATUS.inProgress) return SERIES_STATUS.inProgress
  return SERIES_STATUS.completed
}

export function seriesStatusLabel(series) {
  return SERIES_STATUS_LABEL[derivedSeriesStatus(series)]
}

export function resultStatusLabel(status) {
  return RESULT_STATUS_LABEL[status] || status
}

export function verificationStatusLabel(status) {
  return VERIFICATION_STATUS_LABEL[status] || status
}

export function validateGrokbotExecutions(records, fileName = 'records.json') {
  const context = fileName
  if (!records || typeof records !== 'object') fail(context, '记录无效')
  if (records.schemaVersion !== GROKBOT_EXECUTIONS_SCHEMA_VERSION) fail(context, 'schemaVersion 不匹配')
  if (records.documentType !== 'grokbot_execution_records') fail(context, 'documentType 不匹配')
  assertActor(records.actor, context)
  if (records.timezone !== GROKBOT_EXECUTION_TIMEZONE) fail(context, '时区必须是 Asia/Shanghai')
  if (!isNonEmptyString(records.asOfAsiaShanghai)) fail(context, '缺少数据截止时间')
  if (records.ownerAccount?.username !== GROKBOT_EXECUTION_OWNER_HANDLE) fail(context, '执行对象账号不匹配')
  if (records.ownerAccount?.id !== GROKBOT_EXECUTION_OWNER_ID) fail(context, '执行对象 id 不匹配')
  if (!isNonEmptyString(records.method)) fail(context, '缺少方法说明')
  if (!isNonEmptyString(records.hanziDetection)) fail(context, '缺少汉字检测口径')
  if (!records.hanziDetection.includes('CJK 表意文字')) fail(context, '汉字检测口径必须写明 CJK 表意文字')
  if (!records.hanziDetection.includes('不能用它判定地区')) fail(context, '汉字检测口径必须写明不能判定地区')
  if (!Array.isArray(records.series) || records.series.length === 0) fail(context, '缺少系列')

  records.series.forEach((series, seriesIndex) => {
    const seriesContext = `${context} series[${seriesIndex}]`
    if (!isNonEmptyString(series.id) || !isNonEmptyString(series.title)) fail(seriesContext, '系列缺少编号或标题')
    assertActor(series.actor, seriesContext)
    if (!isNonEmptyString(series.rule) || !isNonEmptyString(series.rate)) fail(seriesContext, '系列缺少规则或节奏')
    if (!Array.isArray(series.batches)) fail(seriesContext, '系列必须用 batches 数组，以便后续追加')
    const pending = queuePending(series)
    if (pending > 0 && series.status !== SERIES_STATUS.inProgress) {
      fail(seriesContext, '仍有待执行计数时不得标为已完成')
    }
    if (pending > 0 && derivedSeriesStatus(series) === SERIES_STATUS.completed) {
      fail(seriesContext, '仍有待执行计数时状态不得为已完成')
    }
    if (series.status === SERIES_STATUS.completed && pending > 0) {
      fail(seriesContext, '已完成系列不得带有待执行计数')
    }
    if (series.queue && Array.isArray(series.queue.accounts)) fail(seriesContext, '待执行不得附账号名单')
    series.batches.forEach((batch, batchIndex) => validateBatch(batch, `${seriesContext} batches[${batchIndex}]`))
  })

  assertNoPrivatePayload(records, context)
  return records
}

export function executionDates(records) {
  const dates = new Set()
  for (const series of records?.series || []) {
    for (const batch of series.batches || []) {
      if (DATE_RE.test(batch.date)) dates.add(batch.date)
    }
  }
  return [...dates].sort()
}

export function batchesOnDate(records, date) {
  if (!DATE_RE.test(date || '')) return []
  const matched = []
  for (const series of records?.series || []) {
    for (const batch of series.batches || []) {
      if (batch.date === date) {
        matched.push({ series, batch })
      }
    }
  }
  return matched
}

export function hasPrivateOrForbiddenPayload(value) {
  const blob = JSON.stringify(value)
  return PRIVATE_PATH_RE.test(blob) || FORBIDDEN_ACTOR_RE.test(blob)
}
