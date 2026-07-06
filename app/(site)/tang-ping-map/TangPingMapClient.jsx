'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TANG_PING_MAP_POINTS } from '../../../lib/tangPingMapData'

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
const CLUSTER_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css'
const CLUSTER_DEFAULT_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.min.css'

const LEAFLET_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
]

const CLUSTER_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js',
  'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
]

const PRICE_TIERS = [
  { label: '≤ 3', name: '极低', max: 3, color: '#2d5d65' },
  { label: '3 - 6', name: '低', max: 6, color: '#5a7a5a' },
  { label: '6 - 10', name: '中', max: 10, color: '#c89132' },
  { label: '10 - 15', name: '高', max: 15, color: '#b85c3a' },
  { label: '> 15', name: '极高', max: Infinity, color: '#8b3a3a' },
]

const TILES = {
  amap: {
    name: '高德',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: '1234',
    attribution: '© 高德地图',
    coord: 'gcj02',
    maxZoom: 18,
  },
  carto: {
    name: 'CARTO',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '© OpenStreetMap · © CARTO',
    coord: 'wgs84',
    maxZoom: 19,
  },
  osm: {
    name: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '© OpenStreetMap',
    coord: 'wgs84',
    maxZoom: 19,
  },
}

const COORD = {
  pi: Math.PI,
  a: 6378245.0,
  ee: 0.00669342162296594323,
  outOfChina(lat, lng) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
  },
  transformLat(x, y) {
    let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    result += ((20 * Math.sin(6 * x * this.pi) + 20 * Math.sin(2 * x * this.pi)) * 2) / 3
    result += ((20 * Math.sin(y * this.pi) + 40 * Math.sin((y / 3) * this.pi)) * 2) / 3
    result += ((160 * Math.sin((y / 12) * this.pi) + 320 * Math.sin((y * this.pi) / 30)) * 2) / 3
    return result
  },
  transformLng(x, y) {
    let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    result += ((20 * Math.sin(6 * x * this.pi) + 20 * Math.sin(2 * x * this.pi)) * 2) / 3
    result += ((20 * Math.sin(x * this.pi) + 40 * Math.sin((x / 3) * this.pi)) * 2) / 3
    result += ((150 * Math.sin((x / 12) * this.pi) + 300 * Math.sin((x / 30) * this.pi)) * 2) / 3
    return result
  },
  wgs84ToGcj02(lat, lng) {
    if (this.outOfChina(lat, lng)) return [lat, lng]
    let dLat = this.transformLat(lng - 105, lat - 35)
    let dLng = this.transformLng(lng - 105, lat - 35)
    const radLat = (lat / 180) * this.pi
    let magic = Math.sin(radLat)
    magic = 1 - this.ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)
    dLat = (dLat * 180) / (((this.a * (1 - this.ee)) / (magic * sqrtMagic)) * this.pi)
    dLng = (dLng * 180) / ((this.a / sqrtMagic) * Math.cos(radLat) * this.pi)
    return [lat + dLat, lng + dLng]
  },
}

function ensureStylesheet(id, href) {
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`)
    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = url
    script.async = false
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function loadAny(urls, isReady) {
  if (isReady()) return
  let lastError = null
  for (const url of urls) {
    try {
      await loadScript(url)
      if (isReady()) return
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('script load failed')
}

function getTier(priceWan) {
  return PRICE_TIERS.find((tier) => priceWan <= tier.max) || PRICE_TIERS[PRICE_TIERS.length - 1]
}

function popupHtml(point) {
  const tier = getTier(point.priceWan)
  return `
    <div class="tp-pop">
      <div class="tp-pop-head">
        <div class="tp-id-tag">No. ${String(point.id).padStart(3, '0')} · ${tier.name}价位</div>
        <div class="tp-pop-region">
          <span class="tp-pop-prov">${point.province}</span>
          <span class="tp-pop-city">${point.city}</span>
        </div>
      </div>
      <div class="tp-pop-loc">
        <div class="tp-pop-name">${point.location}</div>
        <div class="tp-pop-sub">${point.district}</div>
      </div>
      <div class="tp-pop-stats">
        <div class="tp-pop-stat price">
          <div class="tp-pop-label">House</div>
          <div class="tp-pop-value">约${point.priceWan}万</div>
        </div>
        <div class="tp-pop-stat">
          <div class="tp-pop-label">Area</div>
          <div class="tp-pop-value">${point.area}平</div>
        </div>
        <div class="tp-pop-stat">
          <div class="tp-pop-label">Rent</div>
          <div class="tp-pop-value">¥${point.rent}/月</div>
        </div>
      </div>
      <div class="tp-pop-foot">更新 · ${point.date}</div>
    </div>
  `
}

function numericFilter(value) {
  if (value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function TangPingMapClient() {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const baseLayerRef = useRef(null)
  const markerLayerRef = useRef(null)
  const leafletReadyRef = useRef(false)
  const [loadError, setLoadError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [tileKey, setTileKey] = useState('amap')
  const [panelOpen, setPanelOpen] = useState(false)
  const [fitRequest, setFitRequest] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    province: '',
    priceMin: '',
    priceMax: '',
    areaMin: '',
    areaMax: '',
    rentMin: '',
    rentMax: '',
  })

  const provinces = useMemo(
    () => [...new Set(TANG_PING_MAP_POINTS.map((point) => point.province))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    []
  )

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const priceMin = numericFilter(filters.priceMin)
    const priceMax = numericFilter(filters.priceMax)
    const areaMin = numericFilter(filters.areaMin)
    const areaMax = numericFilter(filters.areaMax)
    const rentMin = numericFilter(filters.rentMin)
    const rentMax = numericFilter(filters.rentMax)

    return TANG_PING_MAP_POINTS.filter((point) => {
      if (filters.province && point.province !== filters.province) return false
      if (search) {
        const blob = `${point.province}${point.city}${point.district}${point.location}`.toLowerCase()
        if (!blob.includes(search)) return false
      }
      if (priceMin != null && point.priceWan < priceMin) return false
      if (priceMax != null && point.priceWan > priceMax) return false
      if (areaMin != null && point.area < areaMin) return false
      if (areaMax != null && point.area > areaMax) return false
      if (rentMin != null && point.rent < rentMin) return false
      if (rentMax != null && point.rent > rentMax) return false
      return true
    })
  }, [filters])

  const getCoord = useCallback(
    (point) => {
      if (TILES[tileKey].coord === 'gcj02') return COORD.wgs84ToGcj02(point.lat, point.lng)
      return [point.lat, point.lng]
    },
    [tileKey]
  )

  const updateFilter = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    if (key === 'province' && value) setFitRequest((current) => current + 1)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      province: '',
      priceMin: '',
      priceMax: '',
      areaMin: '',
      areaMax: '',
      rentMin: '',
      rentMax: '',
    })
    setFitRequest((current) => current + 1)
  }, [])

  useEffect(() => {
    ensureStylesheet('tp-leaflet-css', LEAFLET_CSS)
    ensureStylesheet('tp-cluster-css', CLUSTER_CSS)
    ensureStylesheet('tp-cluster-default-css', CLUSTER_DEFAULT_CSS)

    let cancelled = false

    async function initMap() {
      try {
        await loadAny(LEAFLET_SCRIPTS, () => Boolean(window.L))
        try {
          await loadAny(CLUSTER_SCRIPTS, () => Boolean(window.L?.markerClusterGroup))
        } catch {
          // Marker clustering is an enhancement; the map should still work with plain markers.
        }
        if (cancelled || !mapNodeRef.current || mapRef.current) return

        const L = window.L
        const map = L.map(mapNodeRef.current, {
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false,
          maxZoom: 19,
        }).setView([34.8, 105.0], 4)

        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

        const layer =
          typeof L.markerClusterGroup === 'function'
            ? L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 45,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                disableClusteringAtZoom: 11,
              })
            : L.layerGroup()
        map.addLayer(layer)

        mapRef.current = map
        markerLayerRef.current = layer
        leafletReadyRef.current = true
        setMapReady(true)
        setLoadError('')
        setFitRequest((current) => current + 1)
      } catch (error) {
        console.error('[TangPingMap] map init failed', error)
        if (!cancelled) setLoadError('地图资源加载失败，请检查网络后刷新。')
      }
    }

    initMap()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerLayerRef.current = null
        baseLayerRef.current = null
        leafletReadyRef.current = false
        setMapReady(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !leafletReadyRef.current || !mapRef.current) return
    const L = window.L
    const tile = TILES[tileKey]
    if (baseLayerRef.current) mapRef.current.removeLayer(baseLayerRef.current)
    baseLayerRef.current = L.tileLayer(tile.url, {
      subdomains: tile.subdomains,
      attribution: tile.attribution,
      maxZoom: tile.maxZoom,
    }).addTo(mapRef.current)
  }, [mapReady, tileKey])

  useEffect(() => {
    if (!mapReady || !leafletReadyRef.current || !mapRef.current || !markerLayerRef.current) return
    const L = window.L
    const layer = markerLayerRef.current
    layer.clearLayers()

    const markers = filtered.map((point) => {
      const tier = getTier(point.priceWan)
      const marker = L.marker(getCoord(point), {
        icon: L.divIcon({
          className: 'tp-pin-wrap',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10],
          html: `<div class="tp-pin" style="background:${tier.color}"></div>`,
        }),
      })
      marker.bindPopup(popupHtml(point), { maxWidth: 320, minWidth: 240, closeButton: true })
      return marker
    })

    if (typeof layer.addLayers === 'function') {
      layer.addLayers(markers)
    } else {
      markers.forEach((marker) => layer.addLayer(marker))
    }

    if (fitRequest && filtered.length) {
      const bounds = L.latLngBounds(filtered.map((point) => getCoord(point)))
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 9 })
    }
  }, [filtered, fitRequest, getCoord, mapReady])

  return (
    <main className="tp-map-shell">
      <div className="tp-topbar">
        <div className="tp-brand">
          <p className="tp-eyebrow">Atlas · 2026</p>
          <h1>
            躺平地图<span> · tang ping map</span>
          </h1>
        </div>
        <div className="tp-stats">
          <strong>{filtered.length}</strong>
          <span> / </span>
          <strong>{TANG_PING_MAP_POINTS.length}</strong>
          <span> 个标记</span>
        </div>
      </div>

      <aside className={`tp-panel ${panelOpen ? 'open' : ''}`}>
        <button type="button" className="tp-panel-head" onClick={() => setPanelOpen((open) => !open)}>
          <span>筛选 · Filters</span>
          <span className="tp-panel-toggle">{panelOpen ? '▾' : '▴'}</span>
        </button>
        <div className="tp-panel-body">
          <label className="tp-field">
            <span>关键词搜索</span>
            <input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="城市、小区…"
              autoComplete="off"
            />
          </label>

          <label className="tp-field">
            <span>省份</span>
            <select value={filters.province} onChange={(event) => updateFilter('province', event.target.value)}>
              <option value="">全部</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>

          <label className="tp-field">
            <span>二手房价 (万元)</span>
            <div className="tp-range">
              <input
                type="number"
                value={filters.priceMin}
                onChange={(event) => updateFilter('priceMin', event.target.value)}
                placeholder="0"
                step="0.1"
              />
              <b>—</b>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(event) => updateFilter('priceMax', event.target.value)}
                placeholder="20"
                step="0.1"
              />
            </div>
          </label>

          <label className="tp-field">
            <span>面积 (平)</span>
            <div className="tp-range">
              <input type="number" value={filters.areaMin} onChange={(event) => updateFilter('areaMin', event.target.value)} placeholder="0" />
              <b>—</b>
              <input type="number" value={filters.areaMax} onChange={(event) => updateFilter('areaMax', event.target.value)} placeholder="120" />
            </div>
          </label>

          <label className="tp-field">
            <span>租金 (元/月)</span>
            <div className="tp-range">
              <input
                type="number"
                value={filters.rentMin}
                onChange={(event) => updateFilter('rentMin', event.target.value)}
                placeholder="0"
                step="50"
              />
              <b>—</b>
              <input
                type="number"
                value={filters.rentMax}
                onChange={(event) => updateFilter('rentMax', event.target.value)}
                placeholder="1200"
                step="50"
              />
            </div>
          </label>

          <button type="button" className="tp-reset" onClick={resetFilters}>
            重置 Reset
          </button>
        </div>
      </aside>

      <div className="tp-tile-switcher" aria-label="底图切换">
        {Object.entries(TILES).map(([key, tile]) => (
          <button key={key} type="button" className={tileKey === key ? 'active' : ''} onClick={() => setTileKey(key)}>
            {tile.name}
          </button>
        ))}
      </div>

      <div className="tp-legend">
        <div className="tp-legend-title">房价分级 · 万元/套</div>
        {PRICE_TIERS.map((tier) => (
          <div key={tier.label} className="tp-legend-row">
            <span style={{ backgroundColor: tier.color }} />
            <b>{tier.label}</b>
          </div>
        ))}
      </div>

      <a className="tp-source" href="https://tpmap.ritmex.one/" target="_blank" rel="noreferrer">
        Source · Tang Ping Map
      </a>

      {loadError ? (
        <div className="tp-load-error">
          <h2>地图加载失败</h2>
          <p>{loadError}</p>
        </div>
      ) : null}

      <div ref={mapNodeRef} className="tp-map" aria-label="躺平地图点位地图" />

      <style jsx global>{`
        .tp-map-shell {
          --bg: #f5f0e1;
          --paper: #fbf7ea;
          --surface: #ffffff;
          --ink: #1a1c19;
          --ink-soft: #3d403a;
          --ink-muted: #7a7c72;
          --line: #d4cbb1;
          --line-soft: #e6dfc8;
          --jade: #2d4a3d;
          --jade-pale: #e6ecde;
          position: relative;
          height: 100dvh;
          min-height: 620px;
          overflow: hidden;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .tp-map {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: #eae3d0;
        }

        .tp-map .leaflet-container,
        .tp-map-shell .leaflet-container {
          background: #eae3d0;
          font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .tp-map-shell .leaflet-top.leaflet-left {
          left: 14px;
          top: 14px;
        }

        .tp-map-shell .leaflet-bottom.leaflet-left {
          bottom: 14px;
          left: 14px;
        }

        .tp-map-shell .leaflet-control-zoom {
          overflow: hidden;
          border: 1px solid rgba(61, 64, 58, 0.18) !important;
          border-radius: 6px !important;
          box-shadow: 0 8px 24px rgba(26, 28, 25, 0.12);
        }

        .tp-map-shell .leaflet-control-zoom a {
          width: 38px !important;
          height: 38px !important;
          border-color: rgba(61, 64, 58, 0.12) !important;
          background: rgba(255, 255, 255, 0.92) !important;
          color: var(--ink) !important;
          line-height: 36px !important;
          backdrop-filter: blur(10px);
        }

        .tp-map-shell .leaflet-control-scale-line {
          border-color: rgba(61, 64, 58, 0.45) !important;
          background: rgba(251, 247, 234, 0.78);
          color: var(--ink-soft);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
        }

        .tp-map-shell .leaflet-control-attribution {
          background: rgba(251, 247, 234, 0.85) !important;
          color: var(--ink-muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px !important;
        }

        .tp-topbar {
          pointer-events: none;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 28px;
          padding: 18px 92px 40px 74px;
          background: linear-gradient(180deg, rgba(251, 247, 234, 0.9) 0%, rgba(251, 247, 234, 0.62) 66%, rgba(251, 247, 234, 0) 100%);
        }

        .tp-brand,
        .tp-stats {
          pointer-events: auto;
        }

        .tp-brand {
          max-width: min(620px, calc(100vw - 390px));
        }

        .tp-eyebrow {
          margin: 0 0 4px;
          color: var(--jade);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .tp-brand h1 {
          margin: 0;
          color: var(--ink);
          font-family: 'Noto Serif SC', Georgia, serif;
          font-size: clamp(20px, 2vw, 30px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.1;
          text-shadow: 0 1px 0 rgba(251, 247, 234, 0.8);
        }

        .tp-brand h1 span {
          color: var(--jade);
          font-family: Georgia, serif;
          font-style: italic;
          font-weight: 500;
        }

        .tp-stats {
          white-space: nowrap;
          border: 1px solid rgba(61, 64, 58, 0.14);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 8px 22px rgba(26, 28, 25, 0.08);
          color: var(--ink-soft);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          padding: 10px 16px;
          backdrop-filter: blur(10px);
        }

        .tp-stats strong {
          color: var(--jade);
          font-size: 13px;
          font-weight: 600;
        }

        .tp-panel {
          position: absolute;
          left: 28px;
          top: 128px;
          z-index: 25;
          display: flex;
          width: min(300px, calc(100vw - 56px));
          max-height: calc(100dvh - 164px);
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(61, 64, 58, 0.14);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 18px 44px rgba(26, 28, 25, 0.12);
          backdrop-filter: blur(12px);
        }

        .tp-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border: 0;
          border-bottom: 1px solid rgba(61, 64, 58, 0.1);
          background: rgba(251, 247, 234, 0.74);
          color: var(--jade);
          cursor: default;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          padding: 13px 18px;
          text-align: left;
          text-transform: uppercase;
        }

        .tp-panel-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 1px solid var(--line);
          border-radius: 5px;
          color: var(--ink-soft);
          font-size: 14px;
          letter-spacing: 0;
        }

        .tp-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
        }

        .tp-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 16px;
        }

        .tp-field > span {
          color: var(--ink-soft);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .tp-field input,
        .tp-field select {
          width: 100%;
          border: 1px solid rgba(61, 64, 58, 0.16);
          border-radius: 6px;
          background: rgba(251, 247, 234, 0.72);
          color: var(--ink);
          font-family: inherit;
          font-size: 13px;
          outline: none;
          padding: 10px 12px;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }

        .tp-field input:focus,
        .tp-field select:focus {
          border-color: var(--jade);
          background: var(--surface);
          box-shadow: 0 0 0 2px var(--jade-pale);
        }

        .tp-range {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr);
          align-items: center;
          gap: 8px;
        }

        .tp-range input {
          padding-left: 6px;
          padding-right: 6px;
          text-align: center;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
        }

        .tp-range b {
          color: var(--ink-muted);
          font-weight: 400;
          text-align: center;
        }

        .tp-reset {
          width: 100%;
          border: 0;
          border-radius: 6px;
          background: var(--ink);
          color: var(--paper);
          cursor: pointer;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          padding: 11px 16px;
          text-transform: uppercase;
          transition: background 0.2s ease;
        }

        .tp-reset:hover {
          background: var(--jade);
        }

        .tp-tile-switcher {
          position: absolute;
          right: 20px;
          top: 82px;
          z-index: 25;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(61, 64, 58, 0.14);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 12px 28px rgba(26, 28, 25, 0.1);
          backdrop-filter: blur(10px);
        }

        .tp-tile-switcher button {
          min-width: 72px;
          width: 100%;
          border: 0;
          border-bottom: 1px solid var(--line-soft);
          background: transparent;
          color: var(--ink-soft);
          cursor: pointer;
          display: block;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          padding: 9px 12px;
          text-align: center;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .tp-tile-switcher button:last-child {
          border-bottom: 0;
        }

        .tp-tile-switcher button:hover {
          background: rgba(230, 236, 222, 0.85);
          color: var(--jade);
        }

        .tp-tile-switcher button.active {
          background: var(--jade);
          color: var(--paper);
        }

        .tp-legend {
          position: absolute;
          bottom: 36px;
          right: 26px;
          z-index: 25;
          border: 1px solid rgba(61, 64, 58, 0.14);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 36px rgba(26, 28, 25, 0.1);
          font-size: 12px;
          padding: 13px 16px;
          backdrop-filter: blur(12px);
        }

        .tp-legend-title {
          border-bottom: 1px solid var(--line-soft);
          color: var(--jade);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          margin-bottom: 8px;
          padding-bottom: 6px;
          text-transform: uppercase;
        }

        .tp-legend-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 4px 0;
          color: var(--ink-soft);
        }

        .tp-legend-row span {
          width: 14px;
          height: 14px;
          flex: 0 0 14px;
          border: 2px solid var(--surface);
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
        }

        .tp-legend-row b {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 500;
        }

        .tp-source {
          position: absolute;
          bottom: 18px;
          right: 26px;
          z-index: 25;
          color: rgba(61, 64, 58, 0.62);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .tp-pin-wrap {
          border: 0;
          background: transparent;
        }

        .tp-pin {
          width: 18px;
          height: 18px;
          border: 2.5px solid var(--paper);
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .tp-pin:hover {
          transform: scale(1.25);
        }

        .tp-map-shell .marker-cluster-small,
        .tp-map-shell .marker-cluster-medium,
        .tp-map-shell .marker-cluster-large {
          background: transparent !important;
        }

        .tp-map-shell .marker-cluster-small div,
        .tp-map-shell .marker-cluster-medium div,
        .tp-map-shell .marker-cluster-large div {
          border: 2px solid var(--paper) !important;
          background: rgba(45, 74, 61, 0.92) !important;
          box-shadow: 0 0 0 1px var(--jade), 0 4px 14px rgba(26, 28, 25, 0.2) !important;
          color: var(--paper) !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }

        .tp-map-shell .marker-cluster-medium div {
          background: rgba(184, 92, 58, 0.92) !important;
          box-shadow: 0 0 0 1px #b85c3a, 0 4px 14px rgba(26, 28, 25, 0.2) !important;
        }

        .tp-map-shell .marker-cluster-large div {
          background: rgba(139, 58, 58, 0.94) !important;
          box-shadow: 0 0 0 1px #8b3a3a, 0 4px 14px rgba(26, 28, 25, 0.2) !important;
        }

        .tp-map-shell .leaflet-popup-content-wrapper {
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface);
          box-shadow: 0 8px 32px rgba(26, 28, 25, 0.18);
          padding: 0;
        }

        .tp-map-shell .leaflet-popup-content {
          min-width: 240px;
          margin: 0 !important;
        }

        .tp-map-shell .leaflet-popup-tip {
          background: var(--surface);
        }

        .tp-map-shell .leaflet-popup-close-button {
          color: var(--ink-muted) !important;
          font-size: 18px !important;
          padding: 6px 8px !important;
        }

        .tp-pop {
          color: var(--ink);
          font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .tp-pop-head {
          border-bottom: 1px solid var(--line-soft);
          background: var(--paper);
          padding: 14px 18px 10px;
        }

        .tp-id-tag {
          color: var(--ink-muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
        }

        .tp-pop-region {
          margin-top: 4px;
        }

        .tp-pop-prov {
          color: var(--jade);
          font-family: 'Noto Serif SC', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          margin-right: 6px;
        }

        .tp-pop-city {
          color: var(--ink);
          font-size: 14px;
          font-weight: 500;
        }

        .tp-pop-loc {
          padding: 10px 18px 6px;
        }

        .tp-pop-name {
          color: var(--ink);
          font-family: 'Noto Serif SC', Georgia, serif;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .tp-pop-sub {
          color: var(--ink-muted);
          font-size: 12px;
        }

        .tp-pop-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          margin-top: 8px;
          background: var(--line-soft);
        }

        .tp-pop-stat {
          background: var(--surface);
          padding: 10px 8px;
          text-align: center;
        }

        .tp-pop-label {
          color: var(--ink-muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          margin-bottom: 3px;
          text-transform: uppercase;
        }

        .tp-pop-value {
          color: var(--ink);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 13px;
          font-weight: 500;
        }

        .tp-pop-stat.price .tp-pop-value {
          color: var(--jade);
        }

        .tp-pop-foot {
          color: var(--ink-muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          padding: 8px 18px 12px;
          text-align: right;
        }

        .tp-load-error {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: var(--paper);
          color: var(--ink-soft);
          padding: 24px;
          text-align: center;
        }

        .tp-load-error h2 {
          color: var(--ink);
          font-family: 'Noto Serif SC', Georgia, serif;
          font-size: 24px;
          margin: 0 0 12px;
        }

        .tp-load-error p {
          max-width: 420px;
          color: var(--ink-muted);
          font-size: 14px;
          margin: 0;
        }

        @media (max-width: 980px) {
          .tp-topbar {
            padding-right: 86px;
          }

          .tp-brand {
            max-width: calc(100vw - 250px);
          }

          .tp-panel {
            left: 18px;
            top: 118px;
            width: 286px;
            max-height: calc(100dvh - 154px);
          }

          .tp-tile-switcher {
            right: 18px;
            top: 78px;
          }
        }

        @media (max-width: 720px) {
          .tp-map-shell {
            min-height: 100dvh;
          }

          .tp-topbar {
            align-items: flex-start;
            gap: 10px;
            padding: 12px 74px 32px 62px;
          }

          .tp-brand {
            max-width: calc(100vw - 156px);
          }

          .tp-eyebrow {
            font-size: 9px;
            letter-spacing: 0.16em;
          }

          .tp-brand h1 {
            font-size: 18px;
            line-height: 1.12;
          }

          .tp-brand h1 span {
            display: none;
          }

          .tp-stats {
            border-radius: 6px;
            font-size: 10px;
            padding: 8px 10px;
          }

          .tp-map-shell .leaflet-top.leaflet-left {
            left: 12px;
            top: 12px;
          }

          .tp-map-shell .leaflet-control-zoom a {
            width: 34px !important;
            height: 34px !important;
            line-height: 32px !important;
          }

          .tp-tile-switcher {
            right: 12px;
            top: 76px;
          }

          .tp-tile-switcher button {
            min-width: 58px;
            font-size: 10px;
            padding: 8px 9px;
          }

          .tp-panel {
            left: 0;
            right: 0;
            top: auto;
            bottom: 0;
            width: 100%;
            max-height: 50dvh;
            border-right: 0;
            border-bottom: 0;
            border-left: 0;
            border-radius: 12px 12px 0 0;
            box-shadow: 0 -4px 20px rgba(26, 28, 25, 0.15);
            transform: translateY(calc(100% - 46px));
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .tp-panel.open {
            transform: translateY(0);
          }

          .tp-panel-head {
            cursor: pointer;
          }

          .tp-panel-toggle {
            display: inline-flex;
          }

          .tp-panel-body {
            max-height: calc(50dvh - 50px);
          }

          .tp-legend {
            bottom: 62px;
            right: 12px;
            font-size: 11px;
            padding: 8px 10px;
          }

          .tp-legend-row {
            margin: 2px 0;
          }

          .tp-source {
            display: none;
          }
        }

        @media (max-width: 420px) {
          .tp-legend {
            display: none;
          }
        }
      `}</style>
    </main>
  )
}
