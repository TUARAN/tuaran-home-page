'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLock,
  IconQrcode,
  IconRefresh,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react'

import {
  buildOtpAuthUri,
  decodeBase32,
  explainTotp,
  formatCode,
  generateSecret,
  generateTotp,
  normalizeBase32,
  normalizeTotpOptions,
  parseOtpAuthUri,
  verifyTotp,
} from '../../../../lib/tools/totp'

const DEMO_SECRET = 'JBSWY3DPEHPK3PXP'
const PANEL = 'rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5 sm:p-6'
const FIELD = 'w-full rounded-lg border border-[var(--site-line-strong)] bg-[var(--site-panel-strong)] px-3 py-2.5 text-sm text-[var(--site-ink)] outline-none transition focus:border-[#8a6422] focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-950'
const PRIMARY = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8a6422] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#6f5019] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d4ae66] dark:text-[#17130d]'
const SECONDARY = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--site-line-strong)] bg-transparent px-3 py-2 text-sm font-semibold text-[var(--site-ink)] transition hover:border-[#8a6422] disabled:cursor-not-allowed disabled:opacity-50'

function Badge({ children, tone = 'muted' }) {
  const tones = {
    muted: 'border-[var(--site-line)] text-[var(--site-muted)]',
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    bad: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>
}

function CountdownRing({ progress, seconds }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="5" stroke="var(--site-line)" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke="currentColor"
          className="text-[#8a6422] transition-[stroke-dashoffset] duration-200 ease-linear dark:text-[#d4ae66]"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <strong className="font-mono text-lg font-bold">{seconds}</strong>
        <span className="mt-0.5 text-[9px] text-[var(--site-faint)]">秒</span>
      </span>
    </div>
  )
}

function StepCard({ index, title, formula, value, highlight = false }) {
  return (
    <li className={`rounded-xl border p-4 ${highlight ? 'border-[#8a6422]/50 bg-[#8a6422]/5 dark:border-[#d4ae66]/40 dark:bg-[#d4ae66]/5' : 'border-[var(--site-line)] bg-[var(--site-panel-strong)]'}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8a6422] font-mono text-[11px] font-bold text-white dark:bg-[#d4ae66] dark:text-[#17130d]">{index}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="mt-1 font-mono text-[11px] leading-5 text-[var(--site-muted)]">{formula}</p>
          <p className={`mt-2 break-all font-mono text-[11px] leading-5 ${highlight ? 'font-bold text-[#8a6422] dark:text-[#d4ae66]' : 'text-[var(--site-ink)]'}`}>{value || '—'}</p>
        </div>
      </div>
    </li>
  )
}

export default function TwoFactorTool() {
  const [secretInput, setSecretInput] = useState(DEMO_SECRET)
  const [secretVisible, setSecretVisible] = useState(false)
  const [digits, setDigits] = useState(6)
  const [period, setPeriod] = useState(30)
  const [algorithm, setAlgorithm] = useState('SHA1')
  const [issuer, setIssuer] = useState('2aran')
  const [account, setAccount] = useState('demo')

  const [now, setNow] = useState(null)
  const [current, setCurrent] = useState(null)
  const [nextCode, setNextCode] = useState('')
  const [trace, setTrace] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [qrOpen, setQrOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrError, setQrError] = useState('')

  const [token, setToken] = useState('')
  const [tolerance, setTolerance] = useState(1)
  const [verifyResult, setVerifyResult] = useState(null)

  const normalizedSecret = useMemo(() => normalizeBase32(secretInput), [secretInput])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!normalizedSecret) {
      setCurrent(null)
      setTrace(null)
      setNextCode('')
      return undefined
    }

    let cancelled = false
    let timer
    let lastCounter = null

    try {
      decodeBase32(normalizedSecret)
      normalizeTotpOptions({ digits, period, algorithm })
    } catch (err) {
      setError(err.message)
      setCurrent(null)
      setTrace(null)
      setNextCode('')
      return undefined
    }

    const tick = async () => {
      const timestamp = Date.now()
      setNow(timestamp)
      try {
        const result = await generateTotp({ secret: normalizedSecret, timestamp, digits, period, algorithm })
        if (cancelled) return
        if (result.counter !== lastCounter) {
          lastCounter = result.counter
          const [next, explained] = await Promise.all([
            generateTotp({ secret: normalizedSecret, timestamp: result.expiresAt, digits, period, algorithm }),
            explainTotp({ secret: normalizedSecret, timestamp, digits, period, algorithm }),
          ])
          if (cancelled) return
          setCurrent(result)
          setNextCode(next.code)
          setTrace(explained)
          setError('')
          setVerifyResult(null)
        }
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setCurrent(null)
      }
      if (!cancelled) timer = window.setTimeout(tick, 250)
    }

    tick()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [normalizedSecret, digits, period, algorithm])

  useEffect(() => {
    if (!qrOpen || !normalizedSecret) return undefined
    let cancelled = false
    setQrError('')
    try {
      const uri = buildOtpAuthUri({ secret: normalizedSecret, account: account.trim() || 'demo', issuer: issuer.trim() || '2aran', digits, period, algorithm })
      QRCode.toDataURL(uri, { width: 320, margin: 1, color: { dark: '#171611', light: '#ffffff' } })
        .then((url) => {
          if (!cancelled) setQrDataUrl(url)
        })
        .catch((err) => {
          if (!cancelled) setQrError(err.message)
        })
    } catch (err) {
      setQrError(err.message)
    }
    return () => {
      cancelled = true
    }
  }, [qrOpen, normalizedSecret, account, issuer, digits, period, algorithm])

  const remainingMs = current && now ? Math.max(0, current.expiresAt - now) : 0
  const seconds = Math.ceil(remainingMs / 1000)
  const progress = current ? remainingMs / (current.period * 1000) : 0

  function applyOtpAuthLink(raw) {
    try {
      const parsed = parseOtpAuthUri(raw)
      setSecretInput(parsed.secret)
      setDigits(parsed.digits)
      setPeriod(parsed.period)
      setAlgorithm(parsed.algorithm)
      if (parsed.issuer) setIssuer(parsed.issuer)
      if (parsed.account) setAccount(parsed.account)
      setError('')
      setNotice('已读取 otpauth 链接里的参数')
    } catch (err) {
      setError(err.message)
    }
  }

  function handleSecretChange(value) {
    if (/^otpauth:\/\//i.test(value.trim())) {
      applyOtpAuthLink(value.trim())
      return
    }
    setSecretInput(value)
    setQrOpen(false)
    setQrDataUrl('')
  }

  async function copyCode() {
    if (!current) return
    try {
      await navigator.clipboard.writeText(current.code)
      setNotice(`已复制验证码，${seconds} 秒后失效`)
    } catch {
      setNotice('复制失败，请手动选择验证码')
    }
  }

  function rollSecret() {
    try {
      setSecretInput(generateSecret())
      setQrOpen(false)
      setQrDataUrl('')
      setToken('')
      setVerifyResult(null)
      setNotice('已生成新的随机密钥')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    if (!normalizedSecret) {
      setVerifyResult({ ok: false, title: '缺少密钥', detail: '先填入 Base32 密钥或 otpauth 链接。' })
      return
    }
    try {
      const result = await verifyTotp({
        secret: normalizedSecret,
        token,
        digits,
        period,
        algorithm,
        window: tolerance,
      })
      if (result.valid) {
        const offsetText = result.offset === 0
          ? '当前时间步'
          : result.offset > 0
            ? `超前 ${result.offset} 步（约 ${result.offset * period} 秒）`
            : `落后 ${Math.abs(result.offset)} 步（约 ${Math.abs(result.offset) * period} 秒）`
        setVerifyResult({
          ok: true,
          title: '验证通过',
          detail: `命中第 ${result.counter} 个时间步，${offsetText}。允许窗口 ±${tolerance} 步，即 ±${tolerance * period} 秒时钟误差。`,
        })
      } else if (result.reason === 'format') {
        setVerifyResult({ ok: false, title: '格式不符', detail: `当前配置要求 ${digits} 位数字。` })
      } else {
        setVerifyResult({
          ok: false,
          title: '验证不通过',
          detail: `当前时间步的正确答案是 ${formatCode(result.expected)}。若设备显示不同数字，请核对密钥、位数、周期与算法。`,
        })
      }
    } catch (err) {
      setVerifyResult({ ok: false, title: '无法计算', detail: err.message })
    }
  }

  function resetDemo() {
    setSecretInput(DEMO_SECRET)
    setDigits(6)
    setPeriod(30)
    setAlgorithm('SHA1')
    setIssuer('2aran')
    setAccount('demo')
    setToken('')
    setVerifyResult(null)
    setQrOpen(false)
    setNotice('已恢复公开演示密钥')
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-9 text-[var(--site-ink)]">
      <header className="border-b border-[var(--site-line)] pb-5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--site-muted)]">
          <Link href="/tools" className="hover:text-[var(--site-ink)]">工具库</Link>
          <span>／</span>
          <Link href="/tools#utility" className="hover:text-[var(--site-ink)]">实用工具</Link>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">2FA 在线验证器</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">
          填入 Base32 密钥或 otpauth 链接，得到每 30 秒刷新一次的动态验证码；也可以校验一枚已有验证码，并看清它由哪些中间量算出来。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="good"><IconLock size={13} />只在当前浏览器计算</Badge>
          <Badge><IconShieldCheck size={13} />RFC 6238 / RFC 4226</Badge>
          <Badge><IconClock size={13} />6 位 · 30 秒 · SHA-1 默认</Badge>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className={PANEL} aria-labelledby="code-generator-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="code-generator-title" className="flex items-center gap-2 text-base font-bold">
              <IconKey size={18} className="text-[#8a6422] dark:text-[#d4ae66]" />
              生成动态验证码
            </h2>
            <button type="button" onClick={resetDemo} className="text-[11px] font-semibold text-[var(--site-muted)] underline underline-offset-4 hover:text-[var(--site-ink)]">
              用演示密钥
            </button>
          </div>

          <label className="mt-4 block text-xs font-semibold" htmlFor="totp-secret">
            密钥（Base32，支持直接粘贴 otpauth 链接）
          </label>
          <div className="relative mt-2">
            <input
              id="totp-secret"
              value={secretInput}
              onChange={(event) => handleSecretChange(event.target.value)}
              type={secretVisible ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              placeholder="JBSWY3DPEHPK3PXP"
              className={`${FIELD} pr-11 font-mono uppercase tracking-wider`}
            />
            <button
              type="button"
              onClick={() => setSecretVisible((value) => !value)}
              aria-label={secretVisible ? '隐藏密钥' : '显示密钥'}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--site-muted)] hover:bg-[var(--site-line)]/40"
            >
              {secretVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[var(--site-faint)]">
            默认示例 JBSWY3DPEHPK3PXP 是公开演示密钥，不要用它保护真实账号。
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <label className="text-[11px] font-semibold text-[var(--site-muted)]">
              位数
              <select value={digits} onChange={(event) => setDigits(Number(event.target.value))} className={`${FIELD} mt-1.5 py-2`}>
                <option value={6}>6 位</option>
                <option value={8}>8 位</option>
              </select>
            </label>
            <label className="text-[11px] font-semibold text-[var(--site-muted)]">
              周期
              <select value={period} onChange={(event) => setPeriod(Number(event.target.value))} className={`${FIELD} mt-1.5 py-2`}>
                <option value={30}>30 秒</option>
                <option value={60}>60 秒</option>
              </select>
            </label>
            <label className="text-[11px] font-semibold text-[var(--site-muted)]">
              算法
              <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)} className={`${FIELD} mt-1.5 py-2`}>
                <option value="SHA1">SHA-1</option>
                <option value="SHA256">SHA-256</option>
                <option value="SHA512">SHA-512</option>
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--site-faint)]">当前验证码</p>
                <p aria-live="polite" className="mt-1 break-all font-mono text-[2.6rem] font-bold leading-none tracking-[0.14em] text-[var(--site-ink)] sm:text-5xl">
                  {current ? formatCode(current.code) : '— — —'}
                </p>
                <p className="mt-2 text-[11px] text-[var(--site-muted)]">
                  {current ? `下一枚 ${formatCode(nextCode)}，第 ${current.counter} 个时间步` : '等待可用密钥'}
                </p>
              </div>
              <CountdownRing progress={progress} seconds={seconds} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={copyCode} disabled={!current} className={PRIMARY}>
                <IconCopy size={16} />复制验证码
              </button>
              <button type="button" onClick={rollSecret} className={SECONDARY}>
                <IconRefresh size={16} />随机密钥
              </button>
              <button type="button" onClick={() => setQrOpen((value) => !value)} className={SECONDARY} aria-expanded={qrOpen}>
                <IconQrcode size={16} />{qrOpen ? '收起二维码' : '二维码'}
              </button>
            </div>
            {notice ? <p className="mt-3 text-[11px] font-semibold text-[#8a6422] dark:text-[#d4ae66]">{notice}</p> : null}
            {error ? <p className="mt-3 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p> : null}
          </div>

          {qrOpen ? (
            <div className="mt-4 rounded-xl border border-[var(--site-line)] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[11px] font-semibold text-[var(--site-muted)]">
                  服务名
                  <input value={issuer} onChange={(event) => setIssuer(event.target.value)} className={`${FIELD} mt-1.5 py-2`} placeholder="2aran" />
                </label>
                <label className="text-[11px] font-semibold text-[var(--site-muted)]">
                  账号标识
                  <input value={account} onChange={(event) => setAccount(event.target.value)} className={`${FIELD} mt-1.5 py-2`} placeholder="demo" />
                </label>
              </div>
              {qrError ? <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-400">{qrError}</p> : null}
              {qrDataUrl ? (
                <div className="mt-3 flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 二维码是浏览器内生成的数据 URL */}
                  <img src={qrDataUrl} alt="导入验证器用的 otpauth 二维码" width={180} height={180} className="rounded-lg border border-[var(--site-line)] bg-white p-1" />
                  <p className="text-center text-[11px] leading-5 text-[var(--site-faint)]">用手机验证器扫描后，密钥会进入手机；二维码只包含当前填写的密钥与参数。</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={PANEL} aria-labelledby="verify-title">
          <h2 id="verify-title" className="flex items-center gap-2 text-base font-bold">
            <IconShieldCheck size={18} className="text-[#8a6422] dark:text-[#d4ae66]" />
            校验一枚验证码
          </h2>
          <p className="mt-2 text-xs leading-6 text-[var(--site-muted)]">
            服务端拿到用户提交的 6 位数字后，会用同一密钥重算并比对。这里按同样方式判定，并告诉你命中的是第几个时间步。
          </p>

          <form onSubmit={handleVerify} className="mt-4 space-y-3">
            <label className="block text-[11px] font-semibold text-[var(--site-muted)]">
              待验证码
              <input
                value={token}
                onChange={(event) => setToken(event.target.value.replace(/[^\d\s]/g, '').slice(0, digits + 1))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={'1'.repeat(digits)}
                className={`${FIELD} mt-1.5 font-mono text-lg tracking-[0.3em]`}
              />
            </label>
            <label className="block text-[11px] font-semibold text-[var(--site-muted)]">
              允许时间步窗口
              <select value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} className={`${FIELD} mt-1.5`}>
                <option value={0}>严格：只认当前步（±0 秒）</option>
                <option value={1}>常用：前后各 1 步（±30 秒）</option>
                <option value={2}>宽松：前后各 2 步（±60 秒）</option>
              </select>
            </label>
            <button type="submit" className={`${PRIMARY} w-full`}>
              <IconCheck size={16} />校验
            </button>
          </form>

          <div aria-live="polite" className="mt-4">
            {verifyResult ? (
              <div className={`rounded-xl border p-4 ${verifyResult.ok ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/25' : 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/25'}`}>
                <p className={`flex items-center gap-2 text-sm font-bold ${verifyResult.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {verifyResult.ok ? <IconCheck size={16} /> : <IconX size={16} />}
                  {verifyResult.title}
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-[var(--site-ink)]">{verifyResult.detail}</p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--site-line)] p-4 text-[11px] leading-5 text-[var(--site-faint)]">
                输入验证码后得到结论：通过、格式不符，或给出当前时间步的正确答案。
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
            <p className="flex items-center gap-2 text-xs font-bold">
              <IconAlertTriangle size={15} className="text-[#8a6422] dark:text-[#d4ae66]" />
              真实系统还要多做两件事
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-[var(--site-muted)]">
              <li>记录已经用过的时间步，拒绝同一枚验证码重复提交（防重放）。</li>
              <li>限制单位时间内的失败次数，避免 6 位数字被在线穷举。</li>
            </ul>
          </div>
        </section>
      </div>

      <section className={`${PANEL} mt-4`} aria-labelledby="explain-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="explain-title" className="text-base font-bold">6 位数字的计算过程</h2>
            <p className="mt-1.5 text-xs leading-6 text-[var(--site-muted)]">
              密钥和时间是仅有的两个输入。每一步都按当前时间实算，第 5 步的结果就是上方显示的验证码。
            </p>
          </div>
          {trace ? <Badge>密钥 {trace.secretByteLength} 字节 · {trace.algorithm}</Badge> : null}
        </div>

        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          <StepCard
            index="1"
            title="共享密钥"
            formula="注册时下发给验证器的随机字节，Base32 只是它的可读写法"
            value={trace ? `${normalizedSecret.slice(0, 8)}…（共 ${normalizedSecret.length} 个字符）` : ''}
          />
          <StepCard
            index="2"
            title="时间步 T"
            formula="T = floor(unix 秒 ÷ 周期)"
            value={trace ? `T = ${trace.counter} · 十六进制 ${trace.counterHex}` : ''}
          />
          <StepCard
            index="3"
            title="HMAC 摘要"
            formula={`HMAC-${trace?.algorithm?.replace('SHA', 'SHA-') || 'SHA-1'}(密钥, T 的 8 字节大端)`}
            value={trace ? `${trace.digestHex}（${trace.digestLength} 字节）` : ''}
          />
          <StepCard
            index="4"
            title="动态截断"
            formula="offset = 末字节 & 0x0F，取 4 字节并抹掉最高位"
            value={trace ? `offset = ${trace.offset} · ${trace.truncatedHex} · 十进制 ${trace.binary}` : ''}
          />
          <StepCard
            index="5"
            title="取模得到验证码"
            formula={`${trace?.binary ?? 'binary'} mod 10^${digits}，左侧补零到 ${digits} 位`}
            value={trace ? formatCode(trace.code) : ''}
            highlight
          />
          <li className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)] p-4">
            <h3 className="text-sm font-bold">为什么每 30 秒变一次</h3>
            <p className="mt-2 text-[11px] leading-6 text-[var(--site-muted)]">
              时间步每 {period} 秒加一，第 3 步的 HMAC 输入随之改变，后续截断结果全部重算。两边时钟只要大致对齐，就能在同一时间步得到同一个数字；服务端放行前后各一步，用来吸收网络延迟和设备时钟误差。
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <div className={PANEL}>
          <h2 className="text-base font-bold">2FA、TOTP 与通行密钥</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-left text-[11px] leading-5">
              <thead>
                <tr className="border-b border-[var(--site-line)] text-[var(--site-faint)]">
                  <th className="py-2 pr-3 font-semibold">方式</th>
                  <th className="py-2 pr-3 font-semibold">凭据在哪</th>
                  <th className="py-2 font-semibold">离线可用</th>
                </tr>
              </thead>
              <tbody className="text-[var(--site-muted)]">
                <tr className="border-b border-[var(--site-line)]">
                  <td className="py-2 pr-3 font-semibold text-[var(--site-ink)]">TOTP（本工具）</td>
                  <td className="py-2 pr-3">双方共享的密钥 + 当前时间</td>
                  <td className="py-2">可以</td>
                </tr>
                <tr className="border-b border-[var(--site-line)]">
                  <td className="py-2 pr-3 font-semibold text-[var(--site-ink)]">短信 / 邮件验证码</td>
                  <td className="py-2 pr-3">服务端生成，经运营商或邮箱下发</td>
                  <td className="py-2">不可以</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-[var(--site-ink)]">通行密钥 / WebAuthn</td>
                  <td className="py-2 pr-3">设备里的私钥，服务端只存公钥</td>
                  <td className="py-2">通常可以</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-6 text-[var(--site-faint)]">
            短信验证码能证明「你持有这个号码」，但换卡攻击和拦截都可能绕过它；通行密钥把私钥留在设备里并绑定站点域名，对钓鱼站点免疫。TOTP 的优势是兼容性最广，代价是密钥一旦泄露，攻击者可以自己算出验证码。
          </p>
        </div>

        <div className={PANEL}>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <IconLock size={17} className="text-[#8a6422] dark:text-[#d4ae66]" />
            这个页面怎么处理你的密钥
          </h2>
          <ul className="mt-3 space-y-2 text-[11px] leading-6 text-[var(--site-muted)]">
            <li>计算全部在浏览器内完成，用的就是页面自带的 WebCrypto；没有把密钥发到服务器，也没有写入 localStorage、Cookie 或 URL。</li>
            <li>刷新或关闭页面后，输入框里的密钥随之消失；「二维码」只在展开时即时生成，不会上传。</li>
            <li>页面本身不发请求，但浏览器扩展、输入法、剪贴板工具和屏幕共享仍可能读到输入内容。</li>
            <li>重要账号优先用手机上的原生验证器；确实需要在电脑上临时算一枚码时，再使用离线或可信来源的网页工具。</li>
            <li>这里没有登录体系，也不保存账号：它只做 TOTP 计算，不校验身份，更不能替代服务端自己的二次验证。</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
