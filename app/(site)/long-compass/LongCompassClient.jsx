'use client'

import { useEffect, useMemo, useState } from 'react'

import { decryptPayload, fetchEncryptedRecords, KIND_LABELS, migrate } from '../../../lib/longCompass'

import PrivateVaultGate from '../components/PrivateVaultGate'
import RecordCard from './components/RecordCard'
import StatusPanel from './components/StatusPanel'
import ThemeFilter from './components/ThemeFilter'
import Timeline from './components/Timeline'
import UnlockForm from './components/UnlockForm'

const DEFAULT_DESCRIPTION = '站长的长期资产、行动框架与阶段复盘 —— 加密私域，仅作者本人可见。'

export default function LongCompassClient({
  returnTo = '/long-compass',
  eyebrow = 'Long Compass',
  description = DEFAULT_DESCRIPTION,
}) {
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
  // 主题筛选改为单选互斥（null = 全部）：选另一个会自动取消旧的，
  // 再点同一个取消选择回到「全部」。多选 AND 太严，常常归零。
  const [selectedTheme, setSelectedTheme] = useState(null)

  function handleKindChange(kind) {
    setActiveKind(kind)
    setSelectedTheme(null)
  }

  function selectTheme(theme) {
    setSelectedTheme((prev) => (prev === theme ? null : theme))
  }

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
  // 当前 kind 下的所有记录（未按 theme 过滤），用来算 theme 计数
  const kindRecords = useMemo(
    () => records.filter((item) => item.kind === activeKind).sort((a, b) => b.updatedAt - a.updatedAt),
    [activeKind, records]
  )

  // 当前 kind + theme 过滤后剩下的记录（theme 单选）
  const currentRecords = useMemo(() => {
    if (!selectedTheme) return kindRecords
    return kindRecords.filter((r) => (r.plain?.theme || []).includes(selectedTheme))
  }, [kindRecords, selectedTheme])

  // 当前 kind 下每个 theme 的记录数（用于 chip 上的 badge）
  const themeCounts = useMemo(() => {
    const acc = {}
    for (const r of kindRecords) {
      for (const t of r.plain?.theme || []) acc[t] = (acc[t] || 0) + 1
    }
    return acc
  }, [kindRecords])

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
      <PrivateVaultGate
        state="loading"
        vaultLabel="长期罗盘"
        returnTo={returnTo}
        description={description}
      />
    )
  }

  if (authError) {
    return (
      <PrivateVaultGate
        state={authError === 'UNAUTHORIZED' ? 'anonymous' : 'not-owner'}
        vaultLabel="长期罗盘"
        returnTo={returnTo}
        description={description}
      />
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 py-8">
      <header className="border-b border-[#dee0db] pb-5 dark:border-gray-800">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
              长期罗盘
            </h1>
          </div>
          <span className="rounded-full border border-[#dee0db] px-3 py-1 text-xs text-[#58594d] dark:border-[#2d3440] dark:text-gray-300">
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
          <div className="border-b border-[#dee0db] pb-3 dark:border-gray-800">
            <div className="flex flex-wrap gap-2">
              {Object.entries(KIND_LABELS).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => handleKindChange(kind)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeKind === kind
                      ? 'bg-[#2f3027] text-white dark:bg-gray-200 dark:text-[#111]'
                      : 'border border-[#dee0db] text-[#58594d] hover:bg-white dark:border-[#2d3440] dark:text-gray-300 dark:hover:bg-[#121821]'
                  }`}
                >
                  {label} · {counts[kind] || 0}
                </button>
              ))}
            </div>
            <ThemeFilter
              selectedTheme={selectedTheme}
              onSelect={selectTheme}
              onClear={() => setSelectedTheme(null)}
              counts={themeCounts}
            />
          </div>

          <div className="mt-4">
            {currentRecords.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-6 text-sm text-[#717367] dark:border-gray-700 dark:text-gray-400">
                {selectedTheme ? `「${selectedTheme}」主题下暂无记录。` : '暂无记录。'}
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
