'use client'

import { useEffect, useRef } from 'react'

import { getSolarHourAngleRadians } from './solarMath'

const EARTH_ORBIT_RADIUS = 2.72
const EARTH_RADIUS = 0.36
const MOON_ORBIT_RADIUS = 0.58
const SUN_RADIUS = 0.44

function createOrbit(THREE, radius, color, opacity = 0.36, scaleZ = 1) {
  const points = []
  for (let i = 0; i <= 220; i += 1) {
    const a = (i / 220) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius * scaleZ))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.LineLoop(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  )
}

function latLonToVector3(THREE, latitude, longitude, radius) {
  const lat = (latitude * Math.PI) / 180
  const lon = (longitude * Math.PI) / 180
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon)
  )
}

function createEarthTexture(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height)
  ocean.addColorStop(0, '#36b7df')
  ocean.addColorStop(0.55, '#126db8')
  ocean.addColorStop(1, '#082f69')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(60, 154, 91, 0.9)'
  ;[
    'M108 190 C158 116 248 112 308 156 C360 194 342 270 276 292 C210 314 124 264 108 190Z',
    'M348 122 C428 78 548 122 586 204 C620 278 530 326 446 294 C372 266 304 192 348 122Z',
    'M612 154 C684 92 804 118 860 192 C920 272 820 334 720 302 C640 276 560 228 612 154Z',
    'M736 356 C812 326 902 352 940 400 C890 452 778 452 716 410 C692 390 708 366 736 356Z',
    'M462 374 C536 350 620 382 650 430 C594 474 492 472 438 432 C412 410 430 386 462 374Z',
  ].forEach((path) => ctx.fill(new Path2D(path)))

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ;[
    [62, 116, 250, 92, 424, 118],
    [500, 170, 692, 134, 938, 184],
    [108, 318, 362, 284, 562, 328],
    [614, 394, 790, 362, 970, 406],
  ].forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo(x2, y2, x3, y3)
    ctx.stroke()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

function createSunTexture(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(canvas.width, canvas.height)
  const data = image.data

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4
      const nx = x / canvas.width
      const ny = y / canvas.height
      const wave =
        Math.sin(nx * 34 + Math.sin(ny * 12) * 2.4) * 0.5 +
        Math.sin((nx + ny) * 52) * 0.28 +
        Math.sin(Math.hypot(nx - 0.5, ny - 0.5) * 88) * 0.22
      const heat = Math.max(0, Math.min(1, 0.58 + wave * 0.22 + Math.random() * 0.16))
      data[i] = 255
      data[i + 1] = Math.round(118 + heat * 116)
      data[i + 2] = Math.round(8 + heat * 38)
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 36; i += 1) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = 10 + Math.random() * 30
    const flare = ctx.createRadialGradient(x, y, 0, x, y, r)
    flare.addColorStop(0, 'rgba(255, 255, 214, 0.42)')
    flare.addColorStop(0.45, 'rgba(255, 159, 36, 0.2)')
    flare.addColorStop(1, 'rgba(255, 96, 18, 0)')
    ctx.fillStyle = flare
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export default function ThreeSolarSystem({
  phase = 0,
  season = 0.45,
  time = 8,
  yearProgress = 0.42,
  orbitRunKey = 0,
  location,
}) {
  const hostRef = useRef(null)
  const stateRef = useRef({ phase, season, time, yearProgress, orbitRunKey, location })

  useEffect(() => {
    stateRef.current = { phase, season, time, yearProgress, orbitRunKey, location }
  }, [phase, season, time, yearProgress, orbitRunKey, location])

  useEffect(() => {
    let disposed = false
    let frameId = 0
    let renderer = null
    let resizeObserver = null

    const view = {
      dragging: false,
      lastX: 0,
      lastY: 0,
      panX: 0,
      panY: 0,
      zoom: 1,
      pointerId: null,
    }

    async function mount() {
      const THREE = await import('three')
      if (disposed || !hostRef.current) return undefined

      const host = hostRef.current
      const scene = new THREE.Scene()
      const frustum = 5.35
      const camera = new THREE.OrthographicCamera(-6, 6, 3, -3, 0.1, 200)
      camera.position.set(0, 5.4, 7.2)
      camera.lookAt(0, 0, 0)

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      host.replaceChildren(renderer.domElement)

      const stage = new THREE.Group()
      scene.add(stage)

      function applyView() {
        stage.position.x = view.panX
        stage.position.y = view.panY
        camera.zoom = view.zoom
        camera.updateProjectionMatrix()
      }

      function resetView() {
        view.panX = 0
        view.panY = 0
        view.zoom = 1
        applyView()
      }

      function resize() {
        if (!renderer) return
        const width = Math.max(320, host.clientWidth)
        const height = Math.min(560, Math.max(340, Math.round(width * 0.56)))
        const aspect = width / height
        renderer.setSize(width, height, false)
        camera.left = (-frustum * aspect) / 2
        camera.right = (frustum * aspect) / 2
        camera.top = frustum / 2
        camera.bottom = -frustum / 2
        applyView()
      }

      renderer.domElement.style.display = 'block'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      resize()
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host)

      scene.add(new THREE.AmbientLight(0x6f86a8, 0.72))

      const sunLight = new THREE.PointLight(0xffe4a3, 8.8, 60)
      stage.add(sunLight)

      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(SUN_RADIUS, 96, 96),
        new THREE.MeshBasicMaterial({ map: createSunTexture(THREE), color: 0xffcc55 })
      )
      stage.add(sun)

      const sunGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0xff9d1c,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      stage.add(sunGlow)

      const sunCorona = new THREE.Mesh(
        new THREE.SphereGeometry(0.98, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0xffd26a,
          transparent: true,
          opacity: 0.045,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      stage.add(sunCorona)

      const earthOrbit = createOrbit(THREE, EARTH_ORBIT_RADIUS, 0x4ea7d8, 0.38, 0.74)
      stage.add(earthOrbit)

      const earthSystem = new THREE.Group()
      stage.add(earthSystem)

      const earthAxialGroup = new THREE.Group()
      earthSystem.add(earthAxialGroup)

      const earthSpinGroup = new THREE.Group()
      earthAxialGroup.add(earthSpinGroup)

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_RADIUS, 72, 72),
        new THREE.MeshStandardMaterial({
          map: createEarthTexture(THREE),
          roughness: 0.84,
          metalness: 0.02,
        })
      )
      earthSpinGroup.add(earth)

      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_RADIUS * 1.03, 48, 48),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.13,
          wireframe: true,
        })
      )
      earthSpinGroup.add(clouds)

      const cityGroup = new THREE.Group()
      const initialLocation = stateRef.current.location
      if (initialLocation) {
        const markerPosition = latLonToVector3(THREE, initialLocation.latitude, initialLocation.longitude, EARTH_RADIUS * 1.1)
        cityGroup.position.copy(markerPosition)
        cityGroup.lookAt(new THREE.Vector3(0, 0, 0))
        cityGroup.add(new THREE.Mesh(
          new THREE.SphereGeometry(0.028, 18, 18),
          new THREE.MeshBasicMaterial({ color: 0xffef8a })
        ))
        cityGroup.add(new THREE.Mesh(
          new THREE.RingGeometry(0.044, 0.068, 28),
          new THREE.MeshBasicMaterial({
            color: 0xffef8a,
            transparent: true,
            opacity: 0.48,
            side: THREE.DoubleSide,
          })
        ))
        earthSpinGroup.add(cityGroup)
      }

      const earthAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, -0.56, 0),
          new THREE.Vector3(0, 0.56, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.82 })
      )
      earthAxialGroup.add(earthAxis)

      const moonOrbit = createOrbit(THREE, MOON_ORBIT_RADIUS, 0xe2e8f0, 0.36, 0.78)
      earthSystem.add(moonOrbit)

      const moonPivot = new THREE.Group()
      earthSystem.add(moonPivot)

      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 36, 36),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.94 })
      )
      moon.position.set(MOON_ORBIT_RADIUS, 0, 0)
      moonPivot.add(moon)

      const stars = new THREE.Points(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 120 }, () => new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 5.4,
            (Math.random() - 0.5) * 9 - 2
          ))
        ),
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.016, transparent: true, opacity: 0.66 })
      )
      scene.add(stars)

      function onPointerDown(event) {
        view.dragging = true
        view.pointerId = event.pointerId
        view.lastX = event.clientX
        view.lastY = event.clientY
        host.setPointerCapture?.(event.pointerId)
        host.style.cursor = 'grabbing'
      }

      function onPointerMove(event) {
        if (!view.dragging || event.pointerId !== view.pointerId) return
        const width = Math.max(320, host.clientWidth)
        const height = Math.max(320, host.clientHeight)
        const dx = event.clientX - view.lastX
        const dy = event.clientY - view.lastY
        view.lastX = event.clientX
        view.lastY = event.clientY
        view.panX += (dx / width) * (camera.right - camera.left) / view.zoom
        view.panY -= (dy / height) * (camera.top - camera.bottom) / view.zoom
        applyView()
      }

      function onPointerUp(event) {
        if (event.pointerId !== view.pointerId) return
        view.dragging = false
        view.pointerId = null
        host.releasePointerCapture?.(event.pointerId)
        host.style.cursor = 'grab'
      }

      function onWheel(event) {
        event.preventDefault()
        view.zoom = Math.min(1.55, Math.max(0.72, view.zoom * (event.deltaY > 0 ? 0.92 : 1.08)))
        applyView()
      }

      host.style.cursor = 'grab'
      host.style.touchAction = 'none'
      host.addEventListener('pointerdown', onPointerDown)
      host.addEventListener('pointermove', onPointerMove)
      host.addEventListener('pointerup', onPointerUp)
      host.addEventListener('pointercancel', onPointerUp)
      host.addEventListener('wheel', onWheel, { passive: false })
      host.addEventListener('sunMoonResetView', resetView)

      const clock = new THREE.Clock()
      const sunDirection = new THREE.Vector3()
      const inverseAxialQuaternion = new THREE.Quaternion()
      const orbitAnimation = {
        key: stateRef.current.orbitRunKey,
        startedAt: null,
        fromAngle: 0,
      }

      function easeInOut(value) {
        return value < 0.5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2
      }

      function render() {
        if (disposed) return
        const elapsed = clock.elapsedTime
        const delta = clock.getDelta()
        const current = stateRef.current
        const baseEarthAngle = current.yearProgress * Math.PI * 2 - Math.PI * 0.58
        let earthAngle = baseEarthAngle
        let moonAngle = current.phase * Math.PI * 2 - Math.PI

        if (current.orbitRunKey !== orbitAnimation.key) {
          orbitAnimation.key = current.orbitRunKey
          orbitAnimation.startedAt = elapsed
          orbitAnimation.fromAngle = baseEarthAngle
        }

        if (orbitAnimation.startedAt !== null) {
          const progress = Math.min(1, (elapsed - orbitAnimation.startedAt) / 7)
          const easedProgress = easeInOut(progress)
          earthAngle = orbitAnimation.fromAngle + easedProgress * Math.PI * 2
          moonAngle += easedProgress * Math.PI * 2 * 12
          if (progress >= 1) {
            orbitAnimation.startedAt = null
            earthAngle = baseEarthAngle
            moonAngle = current.phase * Math.PI * 2 - Math.PI
          }
        }

        const orbitZScale = 0.74
        const earthX = Math.cos(earthAngle) * EARTH_ORBIT_RADIUS
        const earthZ = Math.sin(earthAngle) * EARTH_ORBIT_RADIUS * orbitZScale

        earthSystem.position.set(earthX, 0, earthZ)
        earthSystem.scale.setScalar(1 + Math.sin(earthAngle) * 0.04)
        earthAxialGroup.rotation.z = (23.44 * current.season * Math.PI) / 180
        sunDirection.set(-earthX, 0, -earthZ).normalize()
        inverseAxialQuaternion.copy(earthAxialGroup.quaternion).invert()
        sunDirection.applyQuaternion(inverseAxialQuaternion)

        const cityLongitudeAngle = -((current.location?.longitude || 0) * Math.PI) / 180
        const sunLongitudeAngle = Math.atan2(sunDirection.z, sunDirection.x)
        const solarHourAngle = getSolarHourAngleRadians({
          time: current.time,
          location: current.location,
          yearProgress: current.yearProgress,
        })
        earthSpinGroup.rotation.y =
          cityLongitudeAngle -
          sunLongitudeAngle -
          solarHourAngle +
          (orbitAnimation.startedAt === null ? 0 : ((elapsed - orbitAnimation.startedAt) / 7) * Math.PI * 2 * 18)
        moonPivot.rotation.y = moonAngle

        sun.rotation.y += delta * 0.018
        sunGlow.scale.setScalar(1 + Math.sin(elapsed * 1.2) * 0.018)
        sunCorona.scale.setScalar(1 + Math.sin(elapsed * 0.86) * 0.028)
        clouds.rotation.y += delta * 0.025
        stars.rotation.y += delta * 0.001

        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(render)
      }
      render()

      return () => {
        host.removeEventListener('pointerdown', onPointerDown)
        host.removeEventListener('pointermove', onPointerMove)
        host.removeEventListener('pointerup', onPointerUp)
        host.removeEventListener('pointercancel', onPointerUp)
        host.removeEventListener('wheel', onWheel)
        host.removeEventListener('sunMoonResetView', resetView)
        host.style.cursor = ''
        host.style.touchAction = ''
      }
    }

    let detachInteractions
    mount().then((detach) => {
      detachInteractions = detach
    })

    return () => {
      disposed = true
      if (frameId) window.cancelAnimationFrame(frameId)
      if (detachInteractions) detachInteractions()
      if (resizeObserver) resizeObserver.disconnect()
      if (renderer) {
        renderer.dispose()
        renderer.domElement.remove()
      }
    }
  }, [])

  return (
    <div className="relative min-h-[340px] min-w-0 w-full overflow-hidden rounded-[24px] border border-[#243244] bg-[#07101d] shadow-[0_18px_50px_rgba(15,23,42,0.2)]">
      <div ref={hostRef} className="h-full min-h-[340px] min-w-0 w-full" aria-label="3D 太阳、地球、月球运行模型" />
      <div className="pointer-events-none absolute left-4 right-4 top-4 rounded-2xl border border-white/12 bg-[#08111f]/78 px-3 py-2 text-[12px] leading-5 text-[#dbeafe] backdrop-blur">
        <span className="font-semibold text-[#f8fafc]">广州观测 · 3D 日心模型</span>
        <span className="mx-2 text-[#7f8fa6]">·</span>
        完整系统视图，可拖动与缩放
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex max-w-[calc(100%-8rem)] flex-wrap gap-2 rounded-2xl border border-white/12 bg-[#08111f]/78 px-3 py-2 text-[11px] text-[#cbd5e1] backdrop-blur">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#fbbf24]" />太阳</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#38bdf8]" />地球</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#b3cc8a]" />广州</span>
        <span>距离与大小为观察用示意</span>
      </div>
      <button
        type="button"
        onClick={() => hostRef.current?.dispatchEvent(new Event('sunMoonResetView'))}
        className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-[#08111f]/78 px-3 py-2 text-[11px] font-semibold text-[#dbeafe] backdrop-blur transition hover:border-white/35 hover:bg-[#111c2c]"
      >
        重置视角
      </button>
    </div>
  )
}
