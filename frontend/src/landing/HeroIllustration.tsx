import { useEffect, useMemo, useRef } from 'react'
import { Droplets, TrendingDown } from 'lucide-react'
import { usePrefersReducedMotion } from './ui'
import { useLandingTheme } from './theme'

/* ===========================================================================
   Hero illustration — a layered, illustrated groundwater cross-section.

   Six depth layers (sky, hill/treeline, soil, aquifer, wells, floating data
   chips), each its own <g>, composited with real 2.5D parallax: a single
   eased "camera" position (from mouse) plus a scroll-progress value drive
   every layer's transform, scaled by a per-layer factor — back layers barely
   move, the foreground and the overlay chips move the most. One rAF loop,
   direct style writes (no re-renders), paused via IntersectionObserver and
   skipped entirely under prefers-reduced-motion.

   Colour is illustration-internal for soil/water/wells (a cutaway of ground
   and water reads the same regardless of page theme, like a diagram in a
   textbook); only the sky/atmosphere and hillside — the "above ground, time
   of day" part of the scene — switch between the light and dark palettes.
   ========================================================================== */

type LayerKey = 'sky' | 'hill' | 'soil' | 'water' | 'wells' | 'chips'

const FACTORS: Record<LayerKey, { mouse: number; scroll: number }> = {
  sky:   { mouse: 2.5,  scroll: 4 },
  hill:  { mouse: 5.5,  scroll: 8 },
  soil:  { mouse: 8,    scroll: 10 },
  water: { mouse: 11,   scroll: 13 },
  wells: { mouse: 15,   scroll: 15 },
  chips: { mouse: 23,   scroll: 6 },
}

function getPalette(isDark: boolean) {
  return {
    sky0: isDark ? '#0B2A2E' : '#EAF6F1',
    sky1: isDark ? '#04070A' : '#F6F9F8',
    skyGlow: isDark ? 'rgba(63,201,175,0.20)' : 'rgba(14,156,137,0.16)',
    cloud: isDark ? 'rgba(143,217,201,0.09)' : 'rgba(255,255,255,0.75)',
    hill0: isDark ? '#173F3A' : '#CDE8DB',
    hill1: isDark ? '#0F2B27' : '#8FC7A9',
    canopy: isDark ? '#2F6F58' : '#4F9C79',
    canopy2: isDark ? '#245144' : '#3D7F60',
    trunk: isDark ? '#4A3826' : '#6B4F35',
    grass: isDark ? '#2F6F58' : '#4F9C79',
    soilTop0: '#5B4632', soilTop1: '#3E2F20',
    soilMid0: '#7C5B39', soilMid1: '#5E4128',
    soilDeep0: '#6B3B2C', soilDeep1: '#42241B',
    pebble: '#A79A83', pebbleShade: '#7C7160',
    root: '#4A3826',
    waterTop: '#BEEFEA', waterMid: '#3FC9AF', waterDeep: '#0B4D63',
    ripple: '#8FE3D3', particle: '#CFF5EC',
    wellCap: '#DCD8CC', wellCapShade: '#ADA898',
    wellPipe0: '#A6A69E', wellPipe1: '#5F5D56',
    wellGlow: '#3FC9AF',
    chipBg: isDark ? '#101820' : '#FFFFFF',
    chipBorder: isDark ? 'rgba(150,186,204,0.2)' : 'rgba(11,46,45,0.10)',
    chipText: isDark ? '#EAF1F5' : '#0C2321',
    chipShadow: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(11,46,45,0.20)',
  }
}

/* Shared "ground cut" line — the visible surface, reused so the hill sits
   behind it and the soil slab's top edge lines up exactly. */
const GROUND_TOP =
  'M-10,182 C40,168 90,196 150,178 C210,160 260,188 320,172 C370,158 405,176 450,168'

/* Soil/aquifer interface — deliberately loose, so the water layer (painted
   after the soil) laps a little way up into it at each trough, giving an
   organic, uneven interface instead of a ruled line. */
const WATER_TOP =
  'M-10,352 C40,342 90,362 150,346 C210,330 260,354 320,338 C365,328 405,346 450,336'
const WATER_TOP_2 =
  'M-10,366 C40,356 90,376 150,360 C210,344 260,368 320,352 C365,342 405,360 450,350'
const WATER_TOP_3 =
  'M-10,380 C40,370 90,390 150,374 C210,358 260,382 320,366 C365,356 405,374 450,364'

const TREES = [
  { x: 34, y: 172, s: 0.85 },
  { x: 96, y: 152, s: 1.05 },
  { x: 152, y: 174, s: 0.8 },
  { x: 218, y: 142, s: 1 },
  { x: 302, y: 160, s: 0.9 },
  { x: 368, y: 150, s: 0.75 },
]

const PEBBLES = [
  { x: 80, y: 210, r: 5, rot: 8 },
  { x: 262, y: 218, r: 4, rot: -14 },
  { x: 342, y: 240, r: 5.6, rot: 22 },
  { x: 140, y: 254, r: 4.2, rot: 4 },
  { x: 202, y: 276, r: 4.8, rot: -9 },
]

const PARTICLES = [
  { x: 40, y: 400, r: 2.2, op: 0.45, d: 0 },
  { x: 96, y: 440, r: 1.7, op: 0.35, d: 0.6 },
  { x: 150, y: 410, r: 2.8, op: 0.5, d: 1.3 },
  { x: 210, y: 460, r: 1.9, op: 0.3, d: 2 },
  { x: 260, y: 420, r: 2.4, op: 0.42, d: 2.7 },
  { x: 310, y: 470, r: 1.6, op: 0.3, d: 3.3 },
  { x: 350, y: 400, r: 2.6, op: 0.4, d: 1.8 },
  { x: 390, y: 450, r: 2, op: 0.32, d: 4.1 },
  { x: 120, y: 490, r: 1.8, op: 0.28, d: 4.8 },
]

export default function HeroIllustration({ className = '' }: { className?: string }) {
  const { theme } = useLandingTheme()
  const isDark = theme === 'dark'
  const pal = useMemo(() => getPalette(isDark), [isDark])
  const reduced = usePrefersReducedMotion()

  const hostRef = useRef<HTMLDivElement | null>(null)
  const layerRefs = useRef<Partial<Record<LayerKey, SVGGElement | null>>>({})

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const section = host.closest('.gwl-hero') as HTMLElement | null
    const fine = window.matchMedia('(pointer: fine)').matches

    const pointer = { x: 0, y: 0 }
    const camera = { x: 0, y: 0 }
    let scrollTarget = 0
    let scrollEased = 0.5
    let raf = 0
    let running = false

    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      pointer.x = Math.max(-1.6, Math.min(1.6, (e.clientX - cx) / (rect.width / 2)))
      pointer.y = Math.max(-1.6, Math.min(1.6, (e.clientY - cy) / (rect.height / 2)))
    }
    const onLeave = () => { pointer.x = 0; pointer.y = 0 }

    const updateScroll = () => {
      if (!section) return
      const r = section.getBoundingClientRect()
      scrollTarget = Math.min(1, Math.max(0, 1 - (r.top + r.height * 0.5) / window.innerHeight))
    }

    const loop = () => {
      camera.x += (pointer.x - camera.x) * 0.06
      camera.y += (pointer.y - camera.y) * 0.06
      scrollEased += (scrollTarget - scrollEased) * 0.08
      const drift = scrollEased - 0.5
      ;(Object.keys(FACTORS) as LayerKey[]).forEach(key => {
        const el = layerRefs.current[key]
        if (!el) return
        const f = FACTORS[key]
        const tx = camera.x * f.mouse
        const ty = camera.y * f.mouse * 0.55 + drift * f.scroll
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`
      })
      raf = requestAnimationFrame(loop)
    }

    const start = () => { if (!running && !reduced) { running = true; raf = requestAnimationFrame(loop) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    if (fine && !reduced) {
      window.addEventListener('pointermove', onMove, { passive: true })
      host.addEventListener('pointerleave', onLeave, { passive: true })
    }
    window.addEventListener('scroll', updateScroll, { passive: true })

    const io = new IntersectionObserver(([entry]) => {
      host.classList.toggle('is-idle', !entry.isIntersecting)
      if (entry.isIntersecting) { updateScroll(); start() } else stop()
    }, { threshold: 0 })
    io.observe(host)

    updateScroll()
    if (!reduced) start()

    return () => {
      stop()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', updateScroll)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  return (
    <div ref={hostRef} className={`gwl-illo ${className}`}>
      <svg viewBox="0 0 440 540" role="img" aria-label="Illustrated cross-section of a groundwater monitoring well, from the surface down to the aquifer">
        <defs>
          <linearGradient id="illoSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.sky0} />
            <stop offset="100%" stopColor={pal.sky1} />
          </linearGradient>
          <radialGradient id="illoSkyGlow" cx="72%" cy="18%" r="65%">
            <stop offset="0%" stopColor={pal.skyGlow} />
            <stop offset="100%" stopColor={pal.skyGlow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="illoHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.hill0} />
            <stop offset="100%" stopColor={pal.hill1} />
          </linearGradient>
          <linearGradient id="illoSoilTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.soilTop0} />
            <stop offset="100%" stopColor={pal.soilTop1} />
          </linearGradient>
          <linearGradient id="illoSoilMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.soilMid0} />
            <stop offset="100%" stopColor={pal.soilMid1} />
          </linearGradient>
          <linearGradient id="illoSoilDeep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.soilDeep0} />
            <stop offset="100%" stopColor={pal.soilDeep1} />
          </linearGradient>
          <linearGradient id="illoWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.waterTop} stopOpacity="0.9" />
            <stop offset="18%" stopColor={pal.waterMid} />
            <stop offset="100%" stopColor={pal.waterDeep} />
          </linearGradient>
          <linearGradient id="illoShaft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={pal.wellPipe0} />
            <stop offset="55%" stopColor={pal.wellPipe1} />
            <stop offset="100%" stopColor={pal.wellPipe0} />
          </linearGradient>

          <clipPath id="illoSoilClip"><path d={`${GROUND_TOP} L450,366 L-10,366 Z`} /></clipPath>

          {/* organic grain, composited over the soil only */}
          <filter id="illoGrain" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.4 0.4 0.4 0 0" />
          </filter>

          <filter id="illoChipShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor={pal.chipShadow} floodOpacity="1" />
          </filter>
          <filter id="illoSoftBlur" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* ============================= SKY (back) ============================= */}
        <g ref={el => { layerRefs.current.sky = el }} className="gwl-illo-layer">
          <rect x="-20" y="-20" width="480" height="260" fill="url(#illoSky)" />
          <rect x="-20" y="-20" width="480" height="260" fill="url(#illoSkyGlow)" />
          <g className="gwl-illo-cloud hidden sm:block" style={{ animationDelay: '0s' }} fill={pal.cloud}>
            <ellipse cx="72" cy="66" rx="34" ry="13" />
            <ellipse cx="98" cy="60" rx="23" ry="11" />
            <ellipse cx="50" cy="61" rx="19" ry="9" />
          </g>
          <g className="gwl-illo-cloud" style={{ animationDelay: '3s' }} fill={pal.cloud} opacity="0.8">
            <ellipse cx="330" cy="42" rx="26" ry="10" />
            <ellipse cx="350" cy="38" rx="17" ry="8" />
          </g>
        </g>

        {/* ========================= HILL + TREELINE (mid-back) ================== */}
        <g ref={el => { layerRefs.current.hill = el }} className="gwl-illo-layer">
          <path
            d="M-10,205 C50,140 100,215 160,155 C230,100 280,180 340,130 C380,105 420,150 450,120 L450,235 L-10,235 Z"
            fill="url(#illoHill)"
          />
          {TREES.map((t, i) => (
            <g
              key={i}
              transform={`translate(${t.x} ${t.y}) scale(${t.s})`}
              className={i % 2 === 0 ? '' : 'hidden sm:block'}
            >
              <rect x="-1.6" y="0" width="3.2" height="13" rx="1.6" fill={pal.trunk} />
              <ellipse cx="0" cy="-6" rx="11" ry="9.5" fill={pal.canopy2} />
              <ellipse cx="-3.2" cy="-9" rx="7.8" ry="7" fill={pal.canopy} />
            </g>
          ))}
        </g>

        {/* ============================ SOIL (surface) =========================== */}
        <g ref={el => { layerRefs.current.soil = el }} className="gwl-illo-layer">
          <g clipPath="url(#illoSoilClip)">
            <path d={`${GROUND_TOP} L450,235 C405,255 370,238 320,251 C260,267 210,240 150,257 C90,275 40,247 -10,261 Z`} fill="url(#illoSoilTop)" />
            <path d="M-10,261 C40,247 90,275 150,257 C210,240 260,267 320,251 C370,238 405,255 450,235 L450,300 C405,317 370,300 320,313 C260,329 210,302 150,319 C90,337 40,309 -10,323 Z" fill="url(#illoSoilMid)" />
            <path d="M-10,323 C40,309 90,337 150,319 C210,302 260,329 320,313 C370,300 405,317 450,300 L450,366 L-10,366 Z" fill="url(#illoSoilDeep)" />
            {/* grain */}
            <rect x="-10" y="160" width="470" height="210" filter="url(#illoGrain)" opacity="0.5" />
          </g>

          {/* roots */}
          <path d="M152,180 C146,202 162,214 149,236 C140,252 156,264 150,280" stroke={pal.root} strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M152,206 C139,215 130,220 121,231" stroke={pal.root} strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M300,164 C296,183 309,194 300,211" stroke={pal.root} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.75" />

          {/* pebbles */}
          {PEBBLES.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
              <ellipse cx="1.4" cy="2" rx={p.r * 1.05} ry={p.r * 0.8} fill={pal.pebbleShade} opacity="0.5" />
              <ellipse cx="0" cy="0" rx={p.r} ry={p.r * 0.75} fill={pal.pebble} />
            </g>
          ))}

          {/* grass tufts along the surface line */}
          {[24, 96, 232, 388].map((x, i) => (
            <g key={x} stroke={pal.grass} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.85"
              transform={`translate(${x} ${[178, 156, 165, 172][i]})`}>
              <path d="M0,0 q-3,-8 -6,-11" />
              <path d="M0,0 q0,-9 0,-13" />
              <path d="M0,0 q3,-8 6,-11" />
            </g>
          ))}
        </g>

        {/* =========================== AQUIFER (water) =========================== */}
        <g ref={el => { layerRefs.current.water = el }} className="gwl-illo-layer">
          <path d={`${WATER_TOP} L450,520 L-10,520 Z`} fill="url(#illoWater)" />
          <path d={WATER_TOP} fill="none" stroke={pal.ripple} strokeWidth="1.6" opacity="0.6" />
          <path d={WATER_TOP_2} fill="none" stroke={pal.ripple} strokeWidth="1.2" opacity="0.35" />
          <path d={WATER_TOP_3} fill="none" stroke={pal.ripple} strokeWidth="1" opacity="0.18" />
          <ellipse cx="150" cy="345" rx="66" ry="4" fill={pal.waterTop} opacity="0.32" />
          <ellipse cx="330" cy="330" rx="42" ry="3" fill={pal.waterTop} opacity="0.22" />

          {PARTICLES.map((p, i) => (
            <circle
              key={i} cx={p.x} cy={p.y} r={p.r} fill={pal.particle}
              className="gwl-illo-particle"
              style={{ ['--p-op' as string]: p.op, animationDelay: `${p.d}s`, opacity: p.op }}
            />
          ))}
        </g>

        {/* ========================== WELLS (foreground) ========================= */}
        <g ref={el => { layerRefs.current.wells = el }} className="gwl-illo-layer">
          {/* primary well */}
          <rect x="184" y="180" width="12" height="156" fill="url(#illoShaft)" />
          <circle cx="190" cy="336" r="17" fill={pal.wellGlow} opacity="0.28" filter="url(#illoSoftBlur)" />
          <circle cx="190" cy="336" r="5" fill={pal.wellGlow} />
          <circle cx="190" cy="336" r="5" fill={pal.wellGlow} className="gwl-ping" opacity="0.6" />

          <g transform="translate(190 172)">
            <rect x="-22" y="-4" width="44" height="12" rx="4" fill={pal.wellCapShade} />
            <rect x="-22" y="-7" width="44" height="10" rx="4" fill={pal.wellCap} />
            <rect x="-7" y="-23" width="14" height="17" rx="3" fill="url(#illoShaft)" stroke={pal.wellPipe1} strokeWidth="0.75" />
            <circle cx="0" cy="-27" r="6" fill="none" stroke={pal.wellPipe1} strokeWidth="2.2" />
            <line x1="-6" y1="-27" x2="6" y2="-27" stroke={pal.wellPipe1} strokeWidth="1.8" />
            <line x1="0" y1="-33" x2="0" y2="-21" stroke={pal.wellPipe1} strokeWidth="1.8" />
          </g>

          {/* secondary well — smaller, further back */}
          <g className="hidden sm:block">
            <rect x="336" y="181" width="7" height="153" fill={pal.wellPipe1} opacity="0.9" />
            <circle cx="339.5" cy="334" r="4" fill={pal.wellGlow} opacity="0.9" />
            <g transform="translate(340 173)">
              <rect x="-14" y="-3" width="28" height="8" rx="3" fill={pal.wellCapShade} />
              <rect x="-14" y="-5" width="28" height="6" rx="3" fill={pal.wellCap} />
              <rect x="-4" y="-14" width="8" height="10" rx="2" fill={pal.wellPipe1} />
            </g>
          </g>
        </g>

        {/* ===================== FLOATING DATA CHIPS (overlay) =================== */}
        <g ref={el => { layerRefs.current.chips = el }} className="gwl-illo-layer">
          <g className="gwl-illo-chip" style={{ animationDelay: '0.2s' }} filter="url(#illoChipShadow)">
            <g transform="translate(24 56)">
              <rect width="106" height="36" rx="18" fill={pal.chipBg} stroke={pal.chipBorder} />
              <circle cx="18" cy="18" r="11" fill={pal.wellGlow} opacity="0.16" />
              <g transform="translate(11 11)"><Droplets width={14} height={14} color={pal.wellGlow} /></g>
              <text x="36" y="22" fontSize="12.5" fontWeight="600" fontFamily="Inter, sans-serif" fill={pal.chipText}>4.89 m</text>
            </g>
          </g>

          <g className="gwl-illo-chip hidden sm:block" style={{ animationDelay: '1.6s' }} filter="url(#illoChipShadow)">
            <g transform="translate(244 36)">
              <rect width="120" height="36" rx="18" fill={pal.chipBg} stroke={pal.chipBorder} />
              <circle cx="18" cy="18" r="11" fill="#C05A1D" opacity="0.16" />
              <g transform="translate(11 11)"><TrendingDown width={14} height={14} color="#C05A1D" /></g>
              <text x="36" y="22" fontSize="12.5" fontWeight="600" fontFamily="Inter, sans-serif" fill={pal.chipText}>Declining</text>
            </g>
          </g>

          <g className="gwl-illo-chip" style={{ animationDelay: '0.9s' }} filter="url(#illoChipShadow)">
            <g transform="translate(348 114)">
              <rect width="76" height="32" rx="16" fill={pal.chipBg} stroke={pal.chipBorder} />
              <circle cx="17" cy="16" r="4" fill="#C05A1D" />
              <text x="30" y="21" fontSize="11.5" fontWeight="700" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.06em" fill={pal.chipText}>HIGH</text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
