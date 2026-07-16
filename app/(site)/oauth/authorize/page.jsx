import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getUserFromRequest } from '../../../../lib/edgeSession'
import { oauthBaseUrl, validateAuthorizationRequest } from '../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const metadata = { title: '授权 MCP 访问', robots: { index: false, follow: false } }

function queryString(params) {
  const query = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value)
  })
  return query.toString()
}

export default async function OAuthAuthorizePage({ searchParams }) {
  const params = await searchParams
  const headerStore = await headers()
  const requestLike = { headers: headerStore, url: `${headerStore.get('x-forwarded-proto') || 'https'}://${headerStore.get('host') || '2aran.com'}/oauth/authorize` }
  const baseUrl = oauthBaseUrl(requestLike)
  const user = await getUserFromRequest(requestLike).catch(() => null)
  if (!user?.id) {
    const returnTo = `/oauth/authorize?${queryString(params)}`
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  let checked
  try {
    checked = await validateAuthorizationRequest(params, baseUrl)
  } catch {
    checked = { ok: false, description: '授权服务暂时不可用，请稍后重试。' }
  }
  if (!checked.ok) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        <section className="rounded-3xl border border-[#d5d7cd] bg-[#f6f8f3] p-7 dark:border-[#293241] dark:bg-[#111821]">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9a7b45]">OAuth Error</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">无法继续授权</h1>
          <p className="mt-4 text-sm leading-7 text-[#65665d] dark:text-gray-300">{checked.description || 'OAuth 请求不合法。'}</p>
          <Link href="/mcp-center" className="mt-5 inline-block text-sm text-[#8b5a1f] underline">返回 MCP 中心</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20">
      <section className="rounded-3xl border border-[#d5d7cd] bg-[#f6f8f3] p-6 shadow-[0_20px_60px_rgba(82,69,45,0.08)] dark:border-[#293241] dark:bg-[#111821] sm:p-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#9a7b45] dark:text-[#929870]">OAuth Authorization</p>
        <h1 className="mb-3 text-2xl font-semibold text-[#1a1b17] dark:text-gray-100">授权智能体访问文章 MCP</h1>
        <p className="text-sm leading-7 text-[#65665d] dark:text-gray-300">
          <strong>{checked.client.name}</strong> 请求代表账号 <strong>{user.name || user.login || user.id}</strong> 连接本站服务。
        </p>
        <div className="my-6 rounded-xl border border-[#d8d9cf] bg-white/70 p-4 dark:border-[#344052] dark:bg-[#0d131b]/70">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-[#77796d]">将获得的权限</p>
          <ul className="mb-0 space-y-2 text-sm leading-6 text-[#35362f] dark:text-gray-200">
            <li>读取公开文章、专题调研和资源的标题、摘要、标签、日期与链接</li>
            <li>查询最近更新，并按关键词检索公开内容</li>
          </ul>
        </div>
        <p className="mb-6 text-xs leading-6 text-[#77796d] dark:text-gray-400">
          不会授权草稿、私有内容、账号资料或写操作。你可以随时由客户端撤销连接。
        </p>
        <form action="/api/oauth/authorize" method="post" className="grid gap-3 sm:grid-cols-2">
          {Object.entries(params || {}).map(([key, value]) => typeof value === 'string' ? <input key={key} type="hidden" name={key} value={value} /> : null)}
          <button name="decision" value="deny" className="rounded-xl border border-[#caccc0] px-4 py-3 text-sm font-medium text-[#35362f] dark:border-[#344052] dark:text-gray-200">拒绝</button>
          <button name="decision" value="approve" className="rounded-xl bg-[#8b5a1f] px-4 py-3 text-sm font-medium text-white dark:bg-[#d7a85c] dark:text-[#1d160d]">确认授权</button>
        </form>
      </section>
    </main>
  )
}
