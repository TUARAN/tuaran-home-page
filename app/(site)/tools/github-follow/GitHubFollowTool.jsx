'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-800'

function normalizeLogins(value) {
  return [...new Set(value.split(/[\s,，;；]+/).map((item) => item.trim().replace(/^@/, '')).filter((item) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(item)))]
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || `GitHub 请求失败（${response.status}）`)
  return data
}

function Candidate({ item, checked, onToggle }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 h-4 w-4" />
      <Image src={item.avatar_url} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full bg-slate-100" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <strong className="truncate text-sm">{item.name || item.login}</strong>
          <span className="font-mono text-xs text-slate-400">@{item.login}</span>
        </span>
        <span className="mt-1 block text-xs text-slate-500">{item.followers} 关注者 · {item.public_repos} 个公开仓库{item.bio ? ` · ${item.bio}` : ''}</span>
      </span>
    </label>
  )
}

export default function GitHubFollowTool() {
  const [token, setToken] = useState('')
  const [rawLogins, setRawLogins] = useState('')
  const [repo, setRepo] = useState('')
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [state, setState] = useState({ kind: 'idle', message: '' })
  const [results, setResults] = useState([])
  const selectedCount = selected.size
  const busy = state.kind === 'loading' || state.kind === 'running'

  const candidateLogins = useMemo(() => candidates.map((item) => item.login), [candidates])

  async function buildCandidates() {
    if (!token) return setState({ kind: 'error', message: '请先填写 Token。' })
    setState({ kind: 'loading', message: '正在读取候选资料…' })
    setResults([])
    try {
      let logins = normalizeLogins(rawLogins)
      const [owner, name] = repo.trim().split('/')
      if (owner && name) {
        const contributors = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contributors?per_page=100`, token)
        logins = [...new Set([...logins, ...contributors.filter((item) => item.type === 'User').map((item) => item.login)])]
      }
      if (!logins.length) throw new Error('请填写用户名，或填写 owner/repo。')
      if (logins.length > 100) throw new Error('每次最多检查 100 个候选。')
      const profiles = []
      for (const login of logins) {
        try {
          profiles.push(await githubRequest(`/users/${encodeURIComponent(login)}`, token))
        } catch {
          // 单个无效用户名不阻断其他候选。
        }
      }
      const viewer = await githubRequest('/user', token)
      const visible = profiles.filter((item) => item.login.toLowerCase() !== viewer.login.toLowerCase())
      setCandidates(visible)
      setSelected(new Set(visible.map((item) => item.login)))
      setState({ kind: 'success', message: `已加载 ${visible.length} 个候选，请取消不想关注的人。` })
    } catch (error) {
      setState({ kind: 'error', message: error.message || String(error) })
    }
  }

  function toggle(login) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(login)) next.delete(login)
      else next.add(login)
      return next
    })
  }

  async function followSelected() {
    const logins = candidateLogins.filter((login) => selected.has(login))
    if (!logins.length) return
    if (!window.confirm(`即将关注 ${logins.length} 个 GitHub 用户。此操作会修改你的 GitHub 关注列表，确定继续吗？`)) return
    setState({ kind: 'running', message: `正在执行 0/${logins.length}…` })
    const nextResults = []
    for (let index = 0; index < logins.length; index += 1) {
      const login = logins[index]
      try {
        await githubRequest(`/user/following/${encodeURIComponent(login)}`, token, { method: 'PUT' })
        nextResults.push({ login, ok: true })
      } catch (error) {
        nextResults.push({ login, ok: false, message: error.message || String(error) })
      }
      setResults([...nextResults])
      setState({ kind: 'running', message: `正在执行 ${index + 1}/${logins.length}…` })
    }
    const successCount = nextResults.filter((item) => item.ok).length
    setState({ kind: successCount === logins.length ? 'success' : 'error', message: `完成：成功 ${successCount}，失败 ${logins.length - successCount}。` })
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Token 只用于当前页面直连 GitHub API，不会发送到本站服务器，也不会写入 localStorage。建议使用细粒度 Token，并仅授予“Followers: Read and write”。
        </div>
        <label className="block space-y-1.5"><span className="text-sm font-medium">GitHub Token</span><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="github_pat_..." autoComplete="off" className={fieldClass} /></label>
        <label className="block space-y-1.5"><span className="text-sm font-medium">用户名清单</span><textarea value={rawLogins} onChange={(event) => setRawLogins(event.target.value)} rows={4} placeholder="octocat, torvalds 或每行一个用户名" className={fieldClass} /></label>
        <label className="block space-y-1.5"><span className="text-sm font-medium">从仓库贡献者补充候选（可选）</span><input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repo" className={fieldClass} /></label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={buildCandidates} disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">{state.kind === 'loading' ? '加载中…' : '生成候选清单'}</button>
          {candidates.length ? <button type="button" onClick={followSelected} disabled={busy || !selectedCount} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-slate-700">关注已选 {selectedCount} 人</button> : null}
        </div>
        {state.message ? <p className={`rounded-lg px-3 py-2 text-sm ${state.kind === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{state.message}</p> : null}
      </section>

      {candidates.length ? <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">候选用户</h2><button type="button" onClick={() => setSelected(selectedCount === candidates.length ? new Set() : new Set(candidateLogins))} className="text-xs text-blue-600 hover:underline dark:text-blue-400">{selectedCount === candidates.length ? '全部取消' : '全部选择'}</button></div><div className="grid gap-2 sm:grid-cols-2">{candidates.map((item) => <Candidate key={item.login} item={item} checked={selected.has(item.login)} onToggle={() => toggle(item.login)} />)}</div></section> : null}

      {results.length ? <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-3 font-semibold">执行结果</h2><div className="flex flex-wrap gap-2">{results.map((item) => <span key={item.login} title={item.message || ''} className={`rounded-full px-2.5 py-1 text-xs ${item.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>@{item.login} · {item.ok ? '成功' : '失败'}</span>)}</div></section> : null}
    </div>
  )
}
