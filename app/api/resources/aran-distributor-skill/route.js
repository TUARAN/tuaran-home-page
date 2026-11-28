import { buildDistributorSkill } from '../../../../lib/distribution/skill.js'
import { HARNESS_VERSION } from '../../../../lib/distribution/harness.js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/** 公开 Skill 下载：仅 SKILL.md，无需克隆仓库或人员码。 */
export async function GET() {
  const body = buildDistributorSkill()
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="2aran-distributor-${HARNESS_VERSION}-SKILL.md"`,
      'Cache-Control': 'public, max-age=300',
    },
  })
}