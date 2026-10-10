'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconArchive, IconChartBar } from '@tabler/icons-react'

import { decryptPayload, fetchEncryptedRecords, KIND_LABELS, migrate } from '../../../lib/longCompass'

import PrivateVaultGate from '../components/PrivateVaultGate'
import FinanceView from './components/FinanceView'
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
  embedded = false,
  initialEncryptedItems = null,
  initialRecords = null,
  view = null,
}) {
  const preUnlocked = Array.isArray(initialRecords)
  const [loading, setLoading] = useState(!preUnlocked)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)
  const [encryptedItems, setEncryptedItems] = useState(
    Array.isArray(initialEncryptedItems) ? initialEncryptedItems : []
  )
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(preUnlocked)
  const [records, setRecords] = useState(preUnlocked ? initialRecords : [])
  const lockedView = view === 'records' || view === 'finance'
  const [activeView, setActiveView] = useState(view === 'finance' ? 'finance' : 'records')
  const [activeKind, setActiveKind] = useState('snapshot')
  const [expandedRecordId, setExpandedRecordId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // 主题筛选改为单选互斥（null = 全部）：选另一个会自动取消旧的，
  // 再点同一个取消选择回到「全部」。多选 AND 太严，常常归零。
  const [selectedTheme, setSelectedTheme] = useState(null)

  function handleKindChange(kind) {
    setActiveKind(kind)
    setSelectedTheme(null)
    setExpandedRecordId(null)
  }

  function handleViewChange(view) {
    setActiveView(view)
    setSelectedTheme(null)
    setExpandedRecordId(null)
  }

  function selectTheme(theme) {
    setSelectedTheme((prev) => (prev === theme ? null : theme))
    setExpandedRecordId(null)
  }

  function toggleRecord(id) {
    setExpandedRecordId((current) => (current === id ? null : id))
  }

  // ---- 拉密文记录 ----
  useEffect(() => {
    if (preUnlocked) return undefined
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
  }, [preUnlocked])

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

  const Container = embedded ? 'section' : 'main'

  return (
    <Container
      className={`flex w-full flex-1 flex-col ${
        embedded ? 'py-5' : 'mx-auto max-w-[1120px] px-4 py-8 md:px-6'
      }`}
    >
      {!embedded ? (
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
      ) : null}

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
        <section className={embedded ? '' : 'mt-6'}>
          {lockedView && activeView === 'finance' ? null : (
          <div className="rounded-2xl border border-[#dfe1da] bg-white/55 p-2.5 shadow-[0_10px_30px_rgba(47,48,39,0.04)] dark:border-[#29303a] dark:bg-[#121821]/70 sm:p-3">
            {lockedView ? null : (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#eceee8] p-1 dark:bg-[#0b1017]" role="tablist" aria-label="档案视图">
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'records'}
                onClick={() => handleViewChange('records')}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeView === 'records'
                    ? 'bg-white text-[#202119] shadow-sm ring-1 ring-black/[0.04] dark:bg-[#202833] dark:text-white dark:ring-white/10'
                    : 'text-[#6d7064] hover:text-[#25261f] dark:text-[#8e9ab0] dark:hover:text-gray-100'
                }`}
              >
                <IconArchive size={17} stroke={1.8} aria-hidden="true" />
                <span>Notion档案</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === 'finance'}
                onClick={() => handleViewChange('finance')}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeView === 'finance'
                    ? 'bg-white text-[#202119] shadow-sm ring-1 ring-black/[0.04] dark:bg-[#202833] dark:text-white dark:ring-white/10'
                    : 'text-[#6d7064] hover:text-[#25261f] dark:text-[#8e9ab0] dark:hover:text-gray-100'
                }`}
              >
                <IconChartBar size={17} stroke={1.8} aria-hidden="true" />
                <span>财务总览</span>
              </button>
            </div>
            )}
            {activeView === 'records' ? (
              <div className={`${lockedView ? '' : 'mt-3 border-t border-[#e2e4de] pt-3 dark:border-[#29303a]'} px-1`}>
                <div className="sm:flex sm:items-start sm:gap-5">
                  <div className="mb-2 sm:mb-0 sm:w-20 sm:flex-none sm:pt-2">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-[#777a6e] dark:text-[#8e9ab0]">记录类型</p>
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-1.5 min-[430px]:grid-cols-3" role="tablist" aria-label="记录类型">
                    {Object.entries(KIND_LABELS).map(([kind, label]) => (
                      <button
                        key={kind}
                        type="button"
                        role="tab"
                        aria-selected={activeKind === kind}
                        onClick={() => handleKindChange(kind)}
                        className={`flex min-h-10 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                          activeKind === kind
                            ? 'border-[#858879] bg-[#f4f5f0] text-[#202119] shadow-[inset_3px_0_0_#34362c] dark:border-[#657080] dark:bg-[#1b222c] dark:text-white dark:shadow-[inset_3px_0_0_#d7dccc]'
                            : 'border-transparent text-[#626459] hover:border-[#dfe1da] hover:bg-white/80 dark:text-gray-300 dark:hover:border-[#303846] dark:hover:bg-[#171e27]'
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`min-w-6 rounded-md px-1.5 py-0.5 text-center font-mono text-[10px] ${
                          activeKind === kind
                            ? 'bg-white text-[#4f5147] dark:bg-[#2a3440] dark:text-gray-200'
                            : 'bg-[#e8eae4] text-[#777a6e] dark:bg-[#242c36] dark:text-[#9aa6b9]'
                        }`}>
                          {counts[kind] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <ThemeFilter
                  selectedTheme={selectedTheme}
                  onSelect={selectTheme}
                  onClear={() => {
                    setSelectedTheme(null)
                    setExpandedRecordId(null)
                  }}
                  counts={themeCounts}
                />
              </div>
            ) : null}
          </div>
          )}

          <div className="mt-4">
            {activeView === 'finance' ? (
              <FinanceView records={records} />
            ) : currentRecords.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#c5c7bb] px-4 py-6 text-sm text-[#717367] dark:border-gray-700 dark:text-gray-400">
                {selectedTheme ? `「${selectedTheme}」主题下暂无记录。` : '暂无记录。'}
              </p>
            ) : activeKind === 'review' ? (
              <Timeline
                records={currentRecords}
                expandedRecordId={expandedRecordId}
                onToggleRecord={toggleRecord}
              />
            ) : (
              <div className="space-y-3">
                {currentRecords.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    expanded={expandedRecordId === record.id}
                    onToggle={toggleRecord}
                  />
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
    </Container>
  )
}
