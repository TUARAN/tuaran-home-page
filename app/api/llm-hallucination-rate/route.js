import { NextResponse } from 'next/server'

import { LLM_HALLUCINATION_RATE_REFERENCE } from '../../../lib/llmHallucinationRate'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(LLM_HALLUCINATION_RATE_REFERENCE, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
