import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  handleDailyTopGet,
  handleDailyTopOptions,
  handleDailyTopPost,
} from '../../../../lib/interaction/dailyTop/http.js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function requestEnv() {
  return getOptionalRequestContext()?.env || {}
}

export function OPTIONS(request) {
  return handleDailyTopOptions(request)
}

export function GET(request) {
  return handleDailyTopGet(request, requestEnv())
}

export function POST(request) {
  return handleDailyTopPost(request, requestEnv())
}
