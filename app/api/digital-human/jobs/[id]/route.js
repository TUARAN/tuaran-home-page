import { getD1 } from '../../../../../lib/d1'
import { getAvatarR2 } from '../../../../../lib/r2'
import { requireDigitalHumanUser } from '../../../../../lib/digitalHuman/auth'
import {
  cancelDigitalHumanJobRecord,
  deleteDigitalHumanJobRecord,
  getDigitalHumanJobForUser,
  isDigitalHumanTerminalStatus,
  rowToDigitalHumanJob,
} from '../../../../../lib/digitalHuman/jobs'
import {
  cancelReplicatePrediction,
  getReplicatePrediction,
} from '../../../../../lib/digitalHuman/replicate'
import {
  applyReplicatePrediction,
  cleanupDigitalHumanInputs,
} from '../../../../../lib/digitalHuman/results'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dependenciesOrResponse() {
  try {
    return { db: getD1(), bucket: getAvatarR2() }
  } catch {
    return {
      response: Response.json({ error: 'DIGITAL_HUMAN_UNAVAILABLE' }, { status: 503 }),
    }
  }
}

export async function GET(req, { params }) {
  const auth = await requireDigitalHumanUser(req)
  if (auth.response) return auth.response
  const deps = dependenciesOrResponse()
  if (deps.response) return deps.response

  const { id } = await params
  let job = await getDigitalHumanJobForUser(deps.db, id, auth.userId)
  if (!job) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (!isDigitalHumanTerminalStatus(job.status) && job.provider_job_id) {
    try {
      const prediction = await getReplicatePrediction(job.provider_job_id)
      await applyReplicatePrediction({
        db: deps.db,
        bucket: deps.bucket,
        job,
        prediction,
      })
      job = await getDigitalHumanJobForUser(deps.db, id, auth.userId)
    } catch {
      // Webhook 仍是主路径；轮询同步失败时保留当前状态，避免把瞬时网络错误写成任务失败。
    }
  }

  return Response.json({ status: 'ok', job: rowToDigitalHumanJob(job) })
}

export async function DELETE(req, { params }) {
  const auth = await requireDigitalHumanUser(req)
  if (auth.response) return auth.response
  const deps = dependenciesOrResponse()
  if (deps.response) return deps.response

  const { id } = await params
  const job = await getDigitalHumanJobForUser(deps.db, id, auth.userId)
  if (!job) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (!isDigitalHumanTerminalStatus(job.status)) {
    if (job.provider_job_id) {
      await cancelReplicatePrediction(job.provider_job_id).catch(() => {})
    }
    await cancelDigitalHumanJobRecord(deps.db, job.id)
    await cleanupDigitalHumanInputs(deps.bucket, job)
    const next = await getDigitalHumanJobForUser(deps.db, id, auth.userId)
    return Response.json({ ok: true, action: 'canceled', job: rowToDigitalHumanJob(next) })
  }

  const keys = [
    job.source_object_key,
    job.audio_object_key,
    job.output_object_key,
  ].filter(Boolean)
  await Promise.all(keys.map((key) => deps.bucket.delete(key).catch(() => {})))
  await deleteDigitalHumanJobRecord(deps.db, job.id, auth.userId)
  return Response.json({ ok: true, action: 'deleted' })
}
