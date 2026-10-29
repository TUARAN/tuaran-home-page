import { COMMUNITY_ACTION_SECRET_KEY } from '../community/communityActions.js'
import {
  createXReplyDownloadPassword,
  saveXReplyDownloadPassword,
  xReplyDownloadPasswordStatus,
} from './xReplyDownloadPassword.mjs'

async function writeSetting(db, key, value, actor) {
  await db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  ).bind(key, value, Date.now(), actor).run()
}

/** One invite code = download unlock + community receipt secret; plaintext returned once. */
export async function saveBoundXReplyInvite(db, actor = 'owner') {
  const owner = String(actor || 'owner')
  const { password, record } = await createXReplyDownloadPassword(owner)
  await saveXReplyDownloadPassword(db, record)
  await writeSetting(db, COMMUNITY_ACTION_SECRET_KEY, password, owner)
  return {
    invite: password,
    secret: password,
    password,
    record,
    ...xReplyDownloadPasswordStatus(record),
  }
}
