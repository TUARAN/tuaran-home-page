import { getD1 } from '../../../../../lib/d1'
import { getAvatarR2 } from '../../../../../lib/r2'
import { getDigitalHumanSigningSecret } from '../../../../../lib/digitalHuman/config'
import { getDigitalHumanJob } from '../../../../../lib/digitalHuman/jobs'
import { DIGITAL_HUMAN_SELF_HOSTED_PROVIDER } from '../../../../../lib/digitalHuman/providerIds'
import { applyDigitalHumanProviderUpdate } from '../../../../../lib/digitalHuman/results'
import { verifyDigitalHumanSignature } from '../../../../../lib/digitalHuman/signing'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const url = new URL(req.url)
  const jobId = String(url.searchParams.get('job') || '').trim()
  if (!jobId) return Response.json({ error: 'MISSING_JOB_ID' }, { status: 400 })

  let verified = false
  try {
    verified = await verifyDigitalHumanSignature(getDigitalHumanSigningSecret(), {
      purpose: 'webhook',
      jobId,
      kind: 'sadtalker',
      expires: url.searchParams.get('expires'),
      signature: url.searchParams.get('signature'),
    })
  } catch {
    verified = false
  }
  if (!verified) return Response.json({ error: 'INVALID_OR_EXPIRED_SIGNATURE' }, { status: 403 })

  let db
  let bucket
  try {
    db = getD1()
    bucket = getAvatarR2()
  } catch {
    return Response.json({ error: 'DIGITAL_HUMAN_UNAVAILABLE' }, { status: 503 })
  }

  let prediction = null
  try {
    prediction = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const job = await getDigitalHumanJob(db, jobId)
  if (!job) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (job.provider !== DIGITAL_HUMAN_SELF_HOSTED_PROVIDER) {
    return Response.json({ error: 'PROVIDER_MISMATCH' }, { status: 409 })
  }
  if (job.provider_job_id && prediction?.id !== job.provider_job_id) {
    return Response.json({ error: 'PROVIDER_JOB_MISMATCH' }, { status: 409 })
  }

  try {
    await applyDigitalHumanProviderUpdate({ db, bucket, job, prediction })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json(
      { error: 'WEBHOOK_PROCESSING_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}
