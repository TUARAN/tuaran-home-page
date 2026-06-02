'use client'

import { useEffect, useMemo, useState } from 'react'

import { decryptPayload, fetchEncryptedRecords, KIND_LABELS, migrate } from '../../../../lib/longCompass'

import RecordCard from './components/RecordCard'
import StatusPanel from './components/StatusPanel'
import Timeline from './components/Timeline'
import UnlockForm from './components/UnlockForm'

function login() {
  window.location.href = `/api/auth/login?returnTo=${encodeURIComponent('/about/long-compass')}`
}

export default function LongCompassClient() {
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)
  const [encryptedItems, setEncryptedItems] = useState([])
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [records, setRecords] = useState([])
  const [activeKind, setActiveKind] = useState('snapshot')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // ---- 拉密文记录 ----
  useEffect(() => {
    ;(async () => {
      try {
        const result = await fetchEncryptedRecords()
        if (result.status === 'unauthorized') return setAuthError('UNAUTHORIZED')
        if (result.status === 'forbidden') return setAuthError('FORBIDDEN')
        if (result.status !== 'ok') throw new Error(result.error || 'LOAD_FAILED')
        setUser(result.user || null)
        setEncryptedItems(result.items || [])
      } catch (e) {
        setError(e?.message || 'LOAD_FAILED')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ---- 解锁 ----
  async function handleUnlock(e) {
    e.preventDefault()
    const value = password.trim()
    if (!value || busy) return
    setBusy(true)
    setError('')
    try {
      const decrypted = []
      for (const item of encryptedItems) {
        const rawPlain = await decryptPayload(item.payload, value)
        decrypted.push({ ...item, plain: migrate(rawPlain) })
      }
      setRecords(decrypted)
      setUnlocked(true)
      setPassword('')
    } catch {
      setError('口令错误，无法解密资料库。')
    } finally {
      setBusy(false)
    }
  }

  // ---- 派生数据 ----
  const currentRecords = useMemo(
    () =>
      records.filter((item) => item.kind === activeKind).sort((a, b) => b.updatedAt - a.updatedAt),
    [activeKind, records]
  )

  const counts = useMemo(
    () =>
      records.reduce(
        (acc, item) => ((acc[item.kind] = (acc[item.kind] || 0) + 1), acc),
        { snapshot: 0, strategy: 0, review: 0 }
      ),
    [records]
  )

  const stats = useMemo(() => {
    const cipherSizes = encryptedItems.map((it) => JSON.stringify(it.payload).length)
    const totalCipher = cipherSizes.reduce((a, b) => a + b, 0)
    const maxCipher = cipherSizes.length ? Math.max(...cipherSizes) : 0
    const totalPlain = records.reduce((acc, r) => acc + (r.plain?.content?.length || 0), 0)
    const maxPlain = records.length ? Math.max(...records.map((r) => r.plain?.content?.length || 0)) : 0
    const oldest = records.reduce((min, r) => Math.min(min, r.plain?.updatedAt || Infinity), Infinity)
    return {
      total: encryptedItems.length,
      totalCipherKB: (totalCipher / 1024).toFixed(1),
      maxCipherKB: (maxCipher / 1024).toFixed(1),
      totalPlainKChars: (totalPlain / 1000).toFixed(1),
      maxPlainKChars: (maxPlain / 1000).toFixed(1),
      oldestYear: Number.isFinite(oldest) ? new Date(oldest).getFullYear() : null,
    }
  }, [encryptedItems, records])

  // ---- 渲染 ----
  if (loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1080px] items-center px-4 py-8">
        <p className="font-mono text-xs text-[#8f8069] dark:text-[#8e9ab0]">Loading private workspace...</p>
      </main>
    )
  }

  if (authError) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[680px] flex-col justify-center px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
          Long Compass
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">长期罗盘</h1>
        <p className="mt-3 text-sm leading-7 text-[#5d554a] dark:text-gray-300">
          {authError === 'UNAUTHORIZED' ? '需要先登录。' : '当前账号没有访问权限。'}
        </p>
        {authError === 'UNAUTHORIZED' ? (
          <button
            type="button"
            onClick={login}
            className="mt-5 w-fit rounded-lg bg-[#3f3527] px-4 py-2 text-sm font-medium text-white hover:bg-[#221f19] dark:bg-gray-200 dark:text-[#111]"
          >
            登录
          </button>
        ) : null}
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 py-8">
      <header className="border-b border-[#e8dfd0] pb-5 dark:border-gray-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
              Long Compass
            </p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#221f19] dark:text-gray-100">
              长期罗盘
            </h1>
          </div>
          <span className="rounded-full border border-[#e8dfd0] px-3 py-1 text-xs text-[#6b5f4d] dark:border-[#2d3440] dark:text-gray-300">
            {unlocked ? '已解锁' : user?.name || user?.login || '已登录'}
          </span>
        </div>
      </header>

      {!unlocked ? (
        <UnlockForm
          encryptedCount={encryptedItems.length}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={handleUnlock}
          busy={busy}
          error={error}
        />
      ) : (
        <section className="mt-6">
          <div className="flex flex-wrap gap-2 border-b border-[#e8dfd0] pb-3 dark:border-gray-800">
            {Object.entries(KIND_LABELS).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setActiveKind(kind)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeKind === kind
                    ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                    : 'border border-[#e8dfd0] text-[#6b5f4d] hover:bg-white dark:border-[#2d3440] dark:text-gray-300 dark:hover:bg-[#121821]'
                }`}
              >
                {label} · {counts[kind] || 0}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {currentRecords.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#d8cdbb] px-4 py-6 text-sm text-[#847a67] dark:border-gray-700 dark:text-gray-400">
                暂无记录。
              </p>
            ) : activeKind === 'review' ? (
              <Timeline records={currentRecords} />
            ) : (
              <div className="space-y-3">
                {currentRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <StatusPanel
        unlocked={unlocked}
        total={stats.total}
        counts={counts}
        totalCipherKB={stats.totalCipherKB}
        maxCipherKB={stats.maxCipherKB}
        totalPlainKChars={stats.totalPlainKChars}
        maxPlainKChars={stats.maxPlainKChars}
        oldestYear={stats.oldestYear}
      />
    </main>
  )
}
