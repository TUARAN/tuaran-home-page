import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

/** Cloudflare Workers AI binding。 */
export function getWorkersAi() {
  const ctx = getOptionalRequestContext()
  const ai = ctx?.env?.AI
  if (!ai) {
    throw new Error('Workers AI binding AI is missing (Cloudflare Pages env.AI)')
  }
  return ai
}
