'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './ai-startup-survivor.module.css'

const WIDTH = 960
const HEIGHT = 540
const SURVIVE_SECONDS = 60

const BUG_TYPES = {
  syntax: { name: '语法错误', color: '#ff6b6b', hp: 24, speed: 65, size: 12, power: 1 },
  timeout: { name: '超时异常', color: '#ffb84d', hp: 44, speed: 48, size: 16, power: 2 },
  memory: { name: '内存泄漏', color: '#a78bfa', hp: 74, speed: 34, size: 20, power: 3 },
}

const UPGRADES = [
  { id: 'damage', icon: '</>', title: '重构代码', text: '代码伤害 +35%', apply: (p) => { p.damage *= 1.35 } },
  { id: 'rate', icon: '>>', title: '并行编译', text: '发射速度 +25%', apply: (p) => { p.fireRate *= 0.75 } },
  { id: 'speed', icon: 'W+', title: '敏捷开发', text: '移动速度 +18%', apply: (p) => { p.speed *= 1.18 } },
  { id: 'multi', icon: '×2', title: '多智能体', text: '每次多发射 1 段代码', apply: (p) => { p.projectiles += 1 } },
  { id: 'magnet', icon: '( )', title: '云端同步', text: '算力吸附范围 +55', apply: (p) => { p.magnet += 55 } },
  { id: 'health', icon: '++', title: '技术债清零', text: '恢复 35 生命，生命上限 +15', apply: (p) => { p.maxHp += 15; p.hp = Math.min(p.maxHp, p.hp + 35) } },
  { id: 'size', icon: '[ ]', title: '上下文扩展', text: '代码体积 +30%', apply: (p) => { p.bulletSize *= 1.3 } },
  { id: 'armor', icon: '#', title: '类型安全', text: '碰撞伤害 -20%', apply: (p) => { p.armor *= 0.8 } },
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function sampleUpgrades() {
  return [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3)
}

function makeGame(status = 'ready') {
  return {
    status,
    elapsed: 0,
    spawnClock: 0,
    shotClock: 0,
    shake: 0,
    player: {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      r: 13,
      speed: 205,
      hp: 100,
      maxHp: 100,
      damage: 24,
      fireRate: 0.46,
      projectiles: 1,
      magnet: 52,
      bulletSize: 1,
      armor: 1,
      invulnerable: 0,
      facing: 1,
    },
    bullets: [],
    bugs: [],
    orbs: [],
    particles: [],
    level: 1,
    xp: 0,
    xpNeeded: 5,
    kills: 0,
  }
}

function spawnBug(game) {
  const edge = Math.floor(Math.random() * 4)
  const margin = 28
  let x = Math.random() * WIDTH
  let y = Math.random() * HEIGHT
  if (edge === 0) y = -margin
  if (edge === 1) x = WIDTH + margin
  if (edge === 2) y = HEIGHT + margin
  if (edge === 3) x = -margin

  const roll = Math.random()
  const type = game.elapsed > 40 && roll > 0.68
    ? 'memory'
    : game.elapsed > 18 && roll > 0.55
      ? 'timeout'
      : 'syntax'
  const spec = BUG_TYPES[type]
  const scale = 1 + game.elapsed * 0.006
  game.bugs.push({
    id: Math.random(), x, y, type,
    hp: spec.hp * scale,
    maxHp: spec.hp * scale,
    speed: spec.speed * (0.95 + Math.random() * 0.15),
    size: spec.size,
    hit: 0,
  })
}

function burst(game, x, y, color, count = 7) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const speed = 30 + Math.random() * 85
    game.particles.push({
      x, y, color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.25 + Math.random() * 0.35,
      maxLife: 0.6,
    })
  }
}

function shoot(game) {
  if (!game.bugs.length) return
  const p = game.player
  const target = game.bugs.reduce((closest, bug) => (
    !closest || distance(p, bug) < distance(p, closest) ? bug : closest
  ), null)
  const base = Math.atan2(target.y - p.y, target.x - p.x)
  const spread = 0.14
  for (let i = 0; i < p.projectiles; i += 1) {
    const offset = (i - (p.projectiles - 1) / 2) * spread
    const angle = base + offset
    game.bullets.push({
      x: p.x, y: p.y,
      vx: Math.cos(angle) * 520,
      vy: Math.sin(angle) * 520,
      r: 4 * p.bulletSize,
      damage: p.damage,
      life: 1.4,
    })
  }
  p.facing = Math.cos(base) >= 0 ? 1 : -1
}

function updateGame(game, dt, keys) {
  const p = game.player
  game.elapsed = Math.min(SURVIVE_SECONDS, game.elapsed + dt)
  p.invulnerable = Math.max(0, p.invulnerable - dt)
  game.shake = Math.max(0, game.shake - dt)

  let dx = 0
  let dy = 0
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1
  if (dx || dy) {
    const length = Math.hypot(dx, dy)
    p.x = clamp(p.x + (dx / length) * p.speed * dt, 24, WIDTH - 24)
    p.y = clamp(p.y + (dy / length) * p.speed * dt, 34, HEIGHT - 22)
    if (dx) p.facing = dx > 0 ? 1 : -1
  }

  game.spawnClock -= dt
  if (game.spawnClock <= 0) {
    spawnBug(game)
    if (game.elapsed > 32 && Math.random() > 0.65) spawnBug(game)
    game.spawnClock = Math.max(0.22, 0.78 - game.elapsed * 0.008)
  }

  game.shotClock -= dt
  if (game.shotClock <= 0 && game.bugs.length) {
    shoot(game)
    game.shotClock = p.fireRate
  }

  for (const bullet of game.bullets) {
    bullet.x += bullet.vx * dt
    bullet.y += bullet.vy * dt
    bullet.life -= dt
  }

  for (const bug of game.bugs) {
    const angle = Math.atan2(p.y - bug.y, p.x - bug.x)
    bug.x += Math.cos(angle) * bug.speed * dt
    bug.y += Math.sin(angle) * bug.speed * dt
    bug.hit = Math.max(0, bug.hit - dt)
  }

  for (const bullet of game.bullets) {
    if (bullet.life <= 0) continue
    for (const bug of game.bugs) {
      if (bug.hp <= 0 || distance(bullet, bug) > bullet.r + bug.size) continue
      bug.hp -= bullet.damage
      bug.hit = 0.08
      bullet.life = 0
      burst(game, bullet.x, bullet.y, '#69f6ff', 3)
      break
    }
  }

  for (const bug of game.bugs) {
    if (bug.hp > 0) continue
    const spec = BUG_TYPES[bug.type]
    game.kills += 1
    game.orbs.push({ x: bug.x, y: bug.y, r: 6, value: spec.power, pulse: Math.random() * 6 })
    burst(game, bug.x, bug.y, spec.color, 10)
  }
  game.bugs = game.bugs.filter((bug) => bug.hp > 0)
  game.bullets = game.bullets.filter((bullet) => bullet.life > 0 && bullet.x > -30 && bullet.x < WIDTH + 30 && bullet.y > -30 && bullet.y < HEIGHT + 30)

  for (const bug of game.bugs) {
    if (distance(p, bug) >= p.r + bug.size || p.invulnerable > 0) continue
    p.hp -= 12 * p.armor
    p.invulnerable = 0.65
    game.shake = 0.18
    const angle = Math.atan2(bug.y - p.y, bug.x - p.x)
    bug.x += Math.cos(angle) * 32
    bug.y += Math.sin(angle) * 32
    burst(game, p.x, p.y, '#ff6b6b', 8)
  }

  for (const orb of game.orbs) {
    orb.pulse += dt * 5
    const d = distance(p, orb)
    if (d < p.magnet) {
      const speed = 150 + (p.magnet - d) * 6
      const angle = Math.atan2(p.y - orb.y, p.x - orb.x)
      orb.x += Math.cos(angle) * speed * dt
      orb.y += Math.sin(angle) * speed * dt
    }
    if (d < p.r + orb.r + 3) {
      game.xp += orb.value
      orb.collected = true
      burst(game, p.x, p.y, '#ffe66d', 4)
    }
  }
  game.orbs = game.orbs.filter((orb) => !orb.collected)

  for (const particle of game.particles) {
    particle.x += particle.vx * dt
    particle.y += particle.vy * dt
    particle.vx *= 0.94
    particle.vy *= 0.94
    particle.life -= dt
  }
  game.particles = game.particles.filter((particle) => particle.life > 0)
}

function pixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height))
}

function drawBug(ctx, bug) {
  const spec = BUG_TYPES[bug.type]
  const x = Math.round(bug.x)
  const y = Math.round(bug.y)
  const s = bug.size
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = bug.hit > 0 ? '#ffffff' : spec.color
  ctx.fillRect(-s + 3, -s + 4, s * 2 - 6, s * 2 - 8)
  ctx.fillRect(-s, -s + 8, s * 2, s * 2 - 16)
  ctx.fillStyle = '#171528'
  ctx.fillRect(-Math.floor(s * 0.5), -4, 3, 4)
  ctx.fillRect(Math.floor(s * 0.3), -4, 3, 4)
  ctx.fillStyle = spec.color
  ctx.fillRect(-s - 5, -s + 4, 5, 3)
  ctx.fillRect(s, -s + 4, 5, 3)
  ctx.fillRect(-s - 5, s - 7, 5, 3)
  ctx.fillRect(s, s - 7, 5, 3)
  ctx.restore()
  if (bug.hp < bug.maxHp) {
    pixelRect(ctx, x - s, y - s - 7, s * 2, 3, '#261e35')
    pixelRect(ctx, x - s, y - s - 7, s * 2 * (bug.hp / bug.maxHp), 3, '#6dff9b')
  }
}

function drawPlayer(ctx, player, elapsed) {
  const blink = player.invulnerable > 0 && Math.floor(elapsed * 18) % 2 === 0
  if (blink) return
  const x = Math.round(player.x)
  const y = Math.round(player.y)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(player.facing, 1)
  pixelRect(ctx, -9, 8, 7, 8, '#273554')
  pixelRect(ctx, 3, 8, 7, 8, '#273554')
  pixelRect(ctx, -11, -7, 22, 18, '#5968e8')
  pixelRect(ctx, -8, -18, 16, 13, '#f2c49b')
  pixelRect(ctx, -9, -20, 18, 5, '#292235')
  pixelRect(ctx, 3, -13, 3, 3, '#211b2a')
  pixelRect(ctx, -18, -6, 8, 12, '#42e8d5')
  pixelRect(ctx, -16, -4, 4, 5, '#10263a')
  ctx.restore()
}

function drawScene(ctx, game) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = '#101426'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  for (let y = 0; y < HEIGHT; y += 32) {
    for (let x = 0; x < WIDTH; x += 32) {
      ctx.fillStyle = (x / 32 + y / 32) % 2 ? '#14192c' : '#171c32'
      ctx.fillRect(x, y, 32, 32)
      ctx.strokeStyle = '#1d233a'
      ctx.strokeRect(x, y, 32, 32)
    }
  }

  ctx.save()
  if (game.shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)
  const props = [
    [72, 74, '#28304a'], [830, 78, '#28304a'], [85, 440, '#2b3048'], [825, 430, '#2b3048'],
  ]
  for (const [x, y, color] of props) {
    pixelRect(ctx, x, y, 60, 28, '#0b0e1b')
    pixelRect(ctx, x + 4, y + 4, 52, 20, color)
    pixelRect(ctx, x + 10, y + 9, 7, 5, '#47e8d4')
    pixelRect(ctx, x + 22, y + 9, 25, 3, '#55617b')
    pixelRect(ctx, x + 22, y + 15, 18, 3, '#55617b')
  }

  for (const orb of game.orbs) {
    const glow = 2 + Math.sin(orb.pulse) * 1.5
    ctx.fillStyle = '#704e11'
    ctx.fillRect(Math.round(orb.x - orb.r - glow), Math.round(orb.y - orb.r - glow), (orb.r + glow) * 2, (orb.r + glow) * 2)
    ctx.fillStyle = '#ffe66d'
    ctx.fillRect(Math.round(orb.x - 5), Math.round(orb.y - 5), 10, 10)
    ctx.fillStyle = '#fff7b2'
    ctx.fillRect(Math.round(orb.x - 2), Math.round(orb.y - 2), 4, 4)
  }
  for (const bullet of game.bullets) {
    ctx.fillStyle = '#214b67'
    ctx.fillRect(Math.round(bullet.x - bullet.r - 2), Math.round(bullet.y - bullet.r - 2), Math.round((bullet.r + 2) * 2), Math.round((bullet.r + 2) * 2))
    ctx.fillStyle = '#69f6ff'
    ctx.fillRect(Math.round(bullet.x - bullet.r), Math.round(bullet.y - bullet.r), Math.round(bullet.r * 2), Math.round(bullet.r * 2))
  }
  for (const bug of game.bugs) drawBug(ctx, bug)
  drawPlayer(ctx, game.player, game.elapsed)
  for (const particle of game.particles) {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1)
    pixelRect(ctx, particle.x - 2, particle.y - 2, 4, 4, particle.color)
  }
  ctx.globalAlpha = 1
  ctx.restore()

  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 180, WIDTH / 2, HEIGHT / 2, 570)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(2,3,10,.54)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
}

export default function AiStartupSurvivorClient() {
  const canvasRef = useRef(null)
  const gameRef = useRef(makeGame())
  const keysRef = useRef(new Set())
  const frameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const hudClockRef = useRef(0)
  const [status, setStatus] = useState('ready')
  const [upgrades, setUpgrades] = useState([])
  const [hud, setHud] = useState({ elapsed: 0, hp: 100, maxHp: 100, xp: 0, xpNeeded: 5, level: 1, kills: 0 })

  const syncHud = useCallback((game) => {
    setHud({
      elapsed: game.elapsed,
      hp: game.player.hp,
      maxHp: game.player.maxHp,
      xp: game.xp,
      xpNeeded: game.xpNeeded,
      level: game.level,
      kills: game.kills,
    })
  }, [])

  const startGame = useCallback(() => {
    const game = makeGame('playing')
    gameRef.current = game
    keysRef.current.clear()
    setUpgrades([])
    setStatus('playing')
    syncHud(game)
    lastTimeRef.current = performance.now()
  }, [syncHud])

  const chooseUpgrade = useCallback((upgrade) => {
    const game = gameRef.current
    if (game.status !== 'upgrade') return
    upgrade.apply(game.player)
    game.level += 1
    game.xp -= game.xpNeeded
    game.xpNeeded = Math.floor(game.xpNeeded * 1.3) + 3
    game.status = 'playing'
    setStatus('playing')
    setUpgrades([])
    syncHud(game)
    lastTimeRef.current = performance.now()
  }, [syncHud])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = WIDTH * dpr
    canvas.height = HEIGHT * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false

    function loop(now) {
      const game = gameRef.current
      const dt = clamp((now - (lastTimeRef.current || now)) / 1000, 0, 0.033)
      lastTimeRef.current = now
      if (game.status === 'playing') {
        updateGame(game, dt, keysRef.current)
        if (game.player.hp <= 0) {
          game.status = 'lost'
          setStatus('lost')
          syncHud(game)
        } else if (game.elapsed >= SURVIVE_SECONDS) {
          game.status = 'won'
          setStatus('won')
          syncHud(game)
        } else if (game.xp >= game.xpNeeded) {
          game.status = 'upgrade'
          const choices = sampleUpgrades()
          setUpgrades(choices)
          setStatus('upgrade')
          syncHud(game)
        }
        hudClockRef.current += dt
        if (hudClockRef.current > 0.1) {
          syncHud(game)
          hudClockRef.current = 0
        }
      }
      drawScene(ctx, game)
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [syncHud])

  useEffect(() => {
    const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
    function onKeyDown(event) {
      if (!movementKeys.has(event.code)) return
      event.preventDefault()
      keysRef.current.add(event.code)
    }
    function onKeyUp(event) {
      if (!movementKeys.has(event.code)) return
      event.preventDefault()
      keysRef.current.delete(event.code)
    }
    function clearKeys() { keysRef.current.clear() }
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp, { passive: false })
    window.addEventListener('blur', clearKeys)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearKeys)
    }
  }, [])

  function holdKey(code, pressed) {
    if (pressed) keysRef.current.add(code)
    else keysRef.current.delete(code)
  }

  const secondsLeft = Math.max(0, Math.ceil(SURVIVE_SECONDS - hud.elapsed))
  const hpPercent = clamp((hud.hp / hud.maxHp) * 100, 0, 100)
  const xpPercent = clamp((hud.xp / hud.xpNeeded) * 100, 0, 100)

  return (
    <main className={styles.page}>
      <div className={styles.noise} aria-hidden="true" />
      <header className={styles.header}>
        <div>
          <div className={styles.brandMark}><span>AI</span> / STARTUP SURVIVOR</div>
          <h1>AI 创业幸存者</h1>
        </div>
        <div className={styles.releaseTarget}>
          <span>发布倒计时</span>
          <strong>{String(secondsLeft).padStart(2, '0')}<small>s</small></strong>
        </div>
      </header>

      <section className={styles.gameShell} aria-label="AI 创业幸存者游戏区">
        <div className={styles.hudTop}>
          <div className={styles.healthBlock}>
            <span>开发者状态</span>
            <div className={styles.bar}><i style={{ width: `${hpPercent}%` }} /></div>
            <b>{Math.ceil(Math.max(0, hud.hp))} / {hud.maxHp}</b>
          </div>
          <div className={styles.levelBadge}>LV.{hud.level}</div>
          <div className={styles.killCount}><span>已修复</span><strong>{hud.kills}</strong><small> BUGS</small></div>
        </div>

        <div className={styles.canvasWrap}>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="像素风游戏画面" />

          {status === 'ready' && (
            <div className={styles.overlay}>
              <div className={styles.startPanel}>
                <div className={styles.terminalIcon} aria-hidden="true"><span>_</span></div>
                <p className={styles.overline}>BOOT SEQUENCE / 00:60</p>
                <h2>一个人，也要把产品发出去。</h2>
                <p>Bug 会从办公室四周涌来。移动躲避，代码会自动攻击最近目标；捡起掉落的算力，构建你的技术栈。</p>
                <button type="button" onClick={startGame}>启动项目 <span>ENTER ↵</span></button>
                <div className={styles.keyHint}><kbd>WASD</kbd><span>或</span><kbd>方向键</kbd><span>移动</span></div>
              </div>
            </div>
          )}

          {status === 'upgrade' && (
            <div className={styles.overlay}>
              <div className={styles.upgradePanel}>
                <p className={styles.overline}>COMPUTE CAPACITY REACHED</p>
                <h2>算力升级 · 选择一项强化</h2>
                <div className={styles.upgradeGrid}>
                  {upgrades.map((upgrade, index) => (
                    <button key={upgrade.id} type="button" onClick={() => chooseUpgrade(upgrade)}>
                      <span className={styles.upgradeIndex}>0{index + 1}</span>
                      <span className={styles.upgradeIcon}>{upgrade.icon}</span>
                      <strong>{upgrade.title}</strong>
                      <small>{upgrade.text}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(status === 'won' || status === 'lost') && (
            <div className={styles.overlay}>
              <div className={`${styles.resultPanel} ${status === 'won' ? styles.won : styles.lost}`}>
                <p className={styles.overline}>{status === 'won' ? 'DEPLOYMENT SUCCESSFUL' : 'BUILD FAILED'}</p>
                <div className={styles.resultStamp}>{status === 'won' ? '已发布' : '待修复'}</div>
                <h2>{status === 'won' ? '产品成功上线！' : '技术债把你淹没了'}</h2>
                <p>{status === 'won' ? `60 秒内修复了 ${hud.kills} 个 Bug，独立开发者存活。` : `坚持了 ${Math.floor(hud.elapsed)} 秒，修复 ${hud.kills} 个 Bug。换个技术栈再来。`}</p>
                <button type="button" onClick={startGame}>重新启动项目</button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.xpRow}>
          <span>算力</span>
          <div className={styles.xpBar}><i style={{ width: `${xpPercent}%` }} /></div>
          <strong>{hud.xp} / {hud.xpNeeded} TFLOPS</strong>
        </div>
      </section>

      <section className={styles.footerInfo}>
        <div className={styles.instructions}>
          <span className={styles.sectionNumber}>01</span>
          <div><strong>移动与生存</strong><p>代码会自动锁定最近的 Bug。保持移动，拾取黄色算力块，坚持到倒计时归零。</p></div>
        </div>
        <div className={styles.legend} aria-label="敌人图例">
          {Object.entries(BUG_TYPES).map(([key, bug]) => (
            <span key={key}><i style={{ background: bug.color }} />{bug.name}</span>
          ))}
        </div>
      </section>

      <div className={styles.mobileControls} aria-label="触屏方向控制">
        <button type="button" aria-label="向上" onPointerDown={() => holdKey('ArrowUp', true)} onPointerUp={() => holdKey('ArrowUp', false)} onPointerCancel={() => holdKey('ArrowUp', false)}>↑</button>
        <button type="button" aria-label="向左" onPointerDown={() => holdKey('ArrowLeft', true)} onPointerUp={() => holdKey('ArrowLeft', false)} onPointerCancel={() => holdKey('ArrowLeft', false)}>←</button>
        <button type="button" aria-label="向下" onPointerDown={() => holdKey('ArrowDown', true)} onPointerUp={() => holdKey('ArrowDown', false)} onPointerCancel={() => holdKey('ArrowDown', false)}>↓</button>
        <button type="button" aria-label="向右" onPointerDown={() => holdKey('ArrowRight', true)} onPointerUp={() => holdKey('ArrowRight', false)} onPointerCancel={() => holdKey('ArrowRight', false)}>→</button>
      </div>
    </main>
  )
}
