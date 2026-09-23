import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Droplets, AlertTriangle, ArrowRight, Map as MapIcon, LineChart, HelpCircle,
  Gauge, Boxes, SlidersHorizontal, Satellite, Bell, Megaphone, HardHat, FileCheck,
} from 'lucide-react'
import { Reveal, SectionHead, usePrefersReducedMotion } from './ui'
import { useLandingTheme } from './theme'
import { STATIONS, bandFor, WHY_FACTORS, KULLAMPATTI_HISTORY, SCENARIOS } from './data'
import { makeScale, linePath, type Pt } from './chart'

/* ===========================================================================
   SECTION 12 — The platform
   SECTION 13 — Impact

   The mock panels reuse the authenticated app's own palette exactly
   (index.css — light tokens by default, dark tokens under
   :root[data-theme="dark"]) so this preview reads as the same product
   rather than a separate marketing illustration — and, since the real
   dashboard also has a light/dark toggle, it switches with the landing
   page's own toggle for the same reason.
   =========================================================================== */

interface AppPalette {
  page: string; card: string; border: string
  ink: string; ink2: string; muted: string
  primary: string; secondary: string
  normal: string; watch: string; high: string; critical: string
}

const APP_LIGHT: AppPalette = {
  page: '#FAF9F5', card: '#F0EEE5', border: '#D8D5C9',
  ink: '#211F1B', ink2: '#5C5A52', muted: '#9B998E',
  primary: '#08917D', secondary: '#D85A2A',
  normal: '#2F9E44', watch: '#F0A80C', high: '#E2691A', critical: '#D62828',
}

const APP_DARK: AppPalette = {
  page: '#15140F', card: '#211F1B', border: '#3A382F',
  ink: '#F0EEE5', ink2: '#C2C0B6', muted: '#8A897F',
  primary: '#3FC9AF', secondary: '#F0824A',
  normal: '#2F9E44', watch: '#F0A80C', high: '#E2691A', critical: '#D62828',
}

function riskHex(app: AppPalette): Record<string, string> {
  return { LOW: app.normal, MODERATE: app.watch, HIGH: app.high, CRITICAL: app.critical }
}

const MODULES = [
  { icon: MapIcon, label: 'Risk Map' },
  { icon: LineChart, label: 'Forecast' },
  { icon: HelpCircle, label: 'WHY Analysis' },
  { icon: Gauge, label: 'Stress Clock' },
  { icon: Boxes, label: 'Digital Twin' },
  { icon: SlidersHorizontal, label: 'Scenarios' },
  { icon: Satellite, label: 'Satellite' },
  { icon: Bell, label: 'Alerts' },
  { icon: Megaphone, label: 'Advisory' },
  { icon: HardHat, label: 'Construction Review' },
  { icon: FileCheck, label: 'Extraction Requests' },
]

export default function SectionPlatform() {
  return (
    <div id="platform">
      <PlatformPreview />
      <Impact />
    </div>
  )
}

/* =========================== SECTION 12 ==================================== */

function PlatformPreview() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const { theme } = useLandingTheme()
  const app = useMemo(() => (theme === 'dark' ? APP_DARK : APP_LIGHT), [theme])

  /* One rAF-throttled scroll handler drives the parallax for all three panels
     via a single custom property. No per-panel listeners. */
  useEffect(() => {
    const el = stageRef.current
    if (!el || reduced) return
    let ticking = false
    let active = false

    const update = () => {
      ticking = false
      const r = el.getBoundingClientRect()
      const p = 1 - Math.min(1, Math.max(0, (r.top + r.height * 0.4) / window.innerHeight))
      el.style.setProperty('--p', p.toFixed(3))
    }
    const onScroll = () => {
      if (!active || ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    const io = new IntersectionObserver(([e]) => {
      active = e.isIntersecting
      if (active) update()
    }, { rootMargin: '120px' })
    io.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduced])

  return (
    <section className="gwl-sec">
      <div className="gwl-wrap">
        <SectionHead
          eyebrow="The platform"
          title="This is the product, not a concept deck."
          lead="Forecasts, risk scoring, explanations, scenarios, the district map and the advisory workflow already run as one application. Here is what an officer actually opens."
          align="center"
        />

        {/* ---- floating panels ---- */}
        <Reveal className="mt-16">
          <div
            ref={stageRef}
            className="relative mx-auto"
            style={{ perspective: '1600px', maxWidth: 1080, ['--p' as string]: 0.5 }}
          >
            <div
              className="relative"
              style={{ transform: 'rotateX(7deg)', transformStyle: 'preserve-3d' }}
            >
              {/* main */}
              <div
                className="relative z-10 rounded-[14px] overflow-hidden"
                style={{
                  background: app.page,
                  border: `1px solid ${app.border}`,
                  boxShadow: '0 60px 120px -50px rgba(0,0,0,0.95)',
                }}
              >
                <AppChrome app={app} />
                <div className="grid md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-3 p-3">
                  <PriorityList app={app} />
                  <div className="flex flex-col gap-3">
                    <KpiRow app={app} />
                    <ForecastPanel app={app} />
                  </div>
                </div>
              </div>

              {/* floating left */}
              <div
                className="hidden lg:block absolute z-20 rounded-[12px] overflow-hidden"
                style={{
                  width: 268, left: -58, top: '38%',
                  background: app.card,
                  border: `1px solid ${app.border}`,
                  boxShadow: '0 40px 70px -34px rgba(0,0,0,0.95)',
                  transform: 'translate3d(0, calc((var(--p) - 0.5) * -56px), 90px)',
                }}
              >
                <WhyPanel app={app} />
              </div>

              {/* floating right */}
              <div
                className="hidden lg:block absolute z-20 rounded-[12px] overflow-hidden"
                style={{
                  width: 246, right: -52, top: '14%',
                  background: app.card,
                  border: `1px solid ${app.border}`,
                  boxShadow: '0 40px 70px -34px rgba(0,0,0,0.95)',
                  transform: 'translate3d(0, calc((var(--p) - 0.5) * 68px), 110px)',
                }}
              >
                <MapPanel app={app} />
              </div>

              {/* floating bottom-right */}
              <div
                className="hidden xl:block absolute z-20 rounded-[12px] overflow-hidden"
                style={{
                  width: 232, right: -20, bottom: -48,
                  background: app.card,
                  border: `1px solid ${app.border}`,
                  boxShadow: '0 40px 70px -34px rgba(0,0,0,0.95)',
                  transform: 'translate3d(0, calc((var(--p) - 0.5) * -34px), 130px)',
                }}
              >
                <AlertPanel app={app} />
              </div>
            </div>
          </div>
        </Reveal>

        <p className="gwl-note text-center mt-16 lg:mt-24 max-w-[62ch] mx-auto">
          Panels above reproduce the officer console's live layout and palette. The station values
          shown are a sample view — the running application computes them per station.
        </p>

        {/* ---- module list ---- */}
        <Reveal className="mt-10" delay={100}>
          <div className="flex flex-wrap justify-center gap-2">
            {MODULES.map(m => (
              <span key={m.label} className="gwl-badge" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
                <m.icon className="w-3.5 h-3.5" style={{ color: 'var(--aqua)' }} />
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex justify-center mt-9">
            <Link to="/login" className="gwl-btn gwl-btn--ghost">
              Open the platform <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* --- mock panels ----------------------------------------------------------- */

function AppChrome({ app }: { app: AppPalette }) {
  return (
    <div className="flex items-center justify-between px-4 h-11" style={{ borderBottom: `1px solid ${app.border}`, background: app.card }}>
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5" style={{ color: app.primary }} />
          <span className="text-[12px] font-bold tracking-tight" style={{ color: app.ink }}>
            Ground<span style={{ color: app.primary }}>Watch</span>
          </span>
        </span>
        <span className="hidden sm:flex items-center gap-1">
          {['Dashboard', 'Risk Map', 'Alerts'].map((l, i) => (
            <span key={l} className="px-2.5 py-1 rounded text-[10.5px] font-semibold"
              style={i === 0
                ? { background: app.secondary, color: '#fff' }
                : { color: app.ink2 }}>
              {l}
            </span>
          ))}
        </span>
      </div>
      <span className="text-right leading-tight hidden sm:block">
        <span className="block text-[10px] font-semibold" style={{ color: app.ink }}>District Officer</span>
        <span className="block text-[8.5px] uppercase tracking-wider gwl-mono" style={{ color: app.muted }}>district · salem</span>
      </span>
    </div>
  )
}

function PriorityList({ app }: { app: AppPalette }) {
  const rows = [...STATIONS].sort((a, b) => b.score - a.score).slice(0, 6)
  const RISK_HEX = riskHex(app)
  return (
    <div className="rounded-[8px] overflow-hidden" style={{ background: app.card, border: `1px solid ${app.border}` }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${app.border}` }}>
        <AlertTriangle className="w-3 h-3" style={{ color: app.high }} />
        <span className="text-[11px] font-semibold" style={{ color: app.ink }}>Priority Intervention List</span>
      </div>
      <div className="grid grid-cols-12 gap-2 px-4 py-1.5 text-[8.5px] font-semibold uppercase tracking-wider"
        style={{ borderBottom: `1px solid ${app.border}`, color: app.muted }}>
        <span className="col-span-1">#</span>
        <span className="col-span-5">Station</span>
        <span className="col-span-3">Risk</span>
        <span className="col-span-3 text-right">GW Now</span>
      </div>
      {rows.map((s, i) => {
        const lvl = bandFor(s.score)
        const hex = RISK_HEX[lvl]
        return (
          <div key={s.name} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center"
            style={{
              borderBottom: `1px solid ${app.border}`,
              borderLeft: `3px solid ${hex}`,
              background: i < 2 ? `color-mix(in srgb, ${hex} 10%, transparent)` : 'transparent',
            }}>
            <span className="col-span-1 gwl-mono text-[11px] font-bold" style={{ color: hex }}>{i + 1}</span>
            <span className="col-span-5 text-[11px] font-semibold truncate" style={{ color: app.ink }}>{s.name}</span>
            <span className="col-span-3">
              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded"
                style={{ background: hex, color: lvl === 'MODERATE' ? '#3D2E06' : '#fff' }}>
                {lvl}
              </span>
            </span>
            <span className="col-span-3 text-right gwl-mono text-[10.5px]" style={{ color: app.ink2 }}>
              {(2 + s.score / 9).toFixed(1)} m
            </span>
          </div>
        )
      })}
    </div>
  )
}

function KpiRow({ app }: { app: AppPalette }) {
  const counts = { CRITICAL: 0, HIGH: 0 }
  STATIONS.forEach(s => {
    const l = bandFor(s.score)
    if (l === 'CRITICAL') counts.CRITICAL++
    if (l === 'HIGH') counts.HIGH++
  })
  const cards = [
    { k: 'Total Stations', v: STATIONS.length, c: app.ink, b: app.border },
    { k: 'Critical', v: counts.CRITICAL, c: app.critical, b: app.critical },
    { k: 'High Risk', v: counts.HIGH, c: app.high, b: app.high },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(c => (
        <div key={c.k} className="rounded-[8px] px-3 py-3"
          style={{ background: app.card, border: `1px solid ${c.b}` }}>
          <div className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: c.c }}>{c.k}</div>
          <div className="gwl-mono text-[22px] font-bold leading-none mt-2" style={{ color: c.c }}>{c.v}</div>
        </div>
      ))}
    </div>
  )
}

function ForecastPanel({ app }: { app: AppPalette }) {
  const hist = KULLAMPATTI_HISTORY.slice(-10)
  const fc = SCENARIOS.normal.depths.slice(0, 4)
  const W = 300, H = 96
  const all = [...hist.map(d => d.depth), ...fc]
  const x = makeScale([0, all.length - 1], [6, W - 6])
  const y = makeScale([0, Math.max(...all) + 1], [10, H - 10])
  const hPts: Pt[] = hist.map((d, i) => [x(i), y(d.depth)])
  const fPts: Pt[] = [[x(hist.length - 1), y(hist[hist.length - 1].depth)],
  ...fc.map((d, i) => [x(hist.length + i), y(d)] as Pt)]

  return (
    <div className="rounded-[8px] p-3 flex-1" style={{ background: app.card, border: `1px solid ${app.border}` }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold" style={{ color: app.ink }}>Kullampatti · Forecast</span>
        <span className="text-[8.5px] gwl-mono" style={{ color: app.muted }}>6 MO</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-2 block" aria-hidden="true">
        <path d={linePath(hPts)} fill="none" stroke={app.primary} strokeWidth="1.5" />
        <path d={linePath(fPts)} fill="none" stroke={app.secondary} strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx={x(hist.length - 1)} cy={y(hist[hist.length - 1].depth)} r="2.5" fill={app.primary} />
      </svg>
    </div>
  )
}

function WhyPanel({ app }: { app: AppPalette }) {
  return (
    <div className="p-3.5">
      <div className="text-[10px] font-semibold" style={{ color: app.ink }}>WHY Analysis</div>
      <div className="text-[8.5px] uppercase tracking-wider gwl-mono mt-0.5" style={{ color: app.muted }}>
        Kullampatti · HIGH
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {WHY_FACTORS.slice(0, 4).map(f => (
          <div key={f.feature}>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[9.5px] truncate" style={{ color: app.ink2 }}>{f.name}</span>
              <span className="gwl-mono text-[8.5px] shrink-0" style={{ color: app.muted }}>
                {(f.importance * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-[3px] rounded-full" style={{ background: app.border }}>
              <div className="h-full rounded-full"
                style={{ width: `${(f.importance / 0.3521) * 100}%`, background: app.primary }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MapPanel({ app }: { app: AppPalette }) {
  const pts = STATIONS.slice(0, 26)
  const RISK_HEX = riskHex(app)
  return (
    <div className="p-3.5">
      <div className="text-[10px] font-semibold" style={{ color: app.ink }}>Risk Map</div>
      <div className="text-[8.5px] uppercase tracking-wider gwl-mono mt-0.5" style={{ color: app.muted }}>
        Salem district
      </div>
      <svg viewBox="0 0 200 130" className="w-full h-auto mt-3 block" aria-hidden="true">
        <rect width="200" height="130" fill={app.page} rx="4" />
        {pts.map((s, i) => {
          const hex = RISK_HEX[bandFor(s.score)]
          const px = 14 + ((s.lon - 77.7) / 1.15) * 172
          const py = 116 - ((s.lat - 11.42) / 0.5) * 100
          return <circle key={s.name} cx={px} cy={py} r={i % 5 === 0 ? 3 : 2.2} fill={hex} opacity="0.9" />
        })}
      </svg>
    </div>
  )
}

function AlertPanel({ app }: { app: AppPalette }) {
  return (
    <div className="p-3.5">
      <div className="flex items-center gap-1.5">
        <Bell className="w-3 h-3" style={{ color: app.secondary }} />
        <span className="text-[10px] font-semibold" style={{ color: app.ink }}>Farmer Alerts</span>
      </div>
      <div className="mt-3 rounded-[6px] overflow-hidden" style={{ border: `1px solid ${app.secondary}` }}>
        <div className="px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wider"
          style={{ background: app.secondary, color: '#fff' }}>
          Advisory · HIGH
        </div>
        <p className="px-2.5 py-2 text-[9px] leading-snug" style={{ color: app.ink2 }}>
          Reduce unnecessary irrigation and prioritize efficient water use.
        </p>
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[8.5px] gwl-mono" style={{ color: app.muted }}>EN / தமிழ்</span>
        <span className="text-[8.5px] gwl-mono" style={{ color: app.normal }}>SENT</span>
      </div>
    </div>
  )
}

/* =========================== SECTION 13 ==================================== */

const BEFORE = ['Thousands of observations', 'Manual analysis', 'Delayed identification', 'Reactive action']
const AFTER = ['Multiple data sources', 'Prediction', 'Risk prioritization', 'Explainable insight', 'Action']

function Impact() {
  return (
    <section className="gwl-sec" style={{ background: 'var(--bg-raise)' }}>
      <div className="gwl-gridlines" />
      <div className="gwl-wrap relative">
        <SectionHead
          eyebrow="Impact"
          title="From reactive monitoring to proactive decisions."
          lead="The data was always there. What changes is how quickly it becomes something a district can act on."
          align="center"
        />

        <div className="mt-14 grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 md:gap-8 items-stretch max-w-5xl mx-auto">
          <Column label="Before" items={BEFORE} tone="muted" />

          <div className="flex md:flex-col items-center justify-center gap-3">
            <span className="hidden md:block w-px flex-1" style={{ background: 'linear-gradient(180deg, transparent, var(--line-strong))' }} />
            <span
              className="w-9 h-9 rounded-full grid place-items-center shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--aqua) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--aqua) 35%, transparent)',
              }}
            >
              <ArrowRight className="w-4 h-4 md:rotate-90" style={{ color: 'var(--aqua)' }} />
            </span>
            <span className="hidden md:block w-px flex-1" style={{ background: 'linear-gradient(0deg, transparent, var(--line-strong))' }} />
          </div>

          <Column label="After" items={AFTER} tone="accent" />
        </div>
      </div>
    </section>
  )
}

function Column({ label, items, tone }: { label: string; items: string[]; tone: 'muted' | 'accent' }) {
  const accent = tone === 'accent'
  return (
    <Reveal delay={accent ? 180 : 0}>
      <div
        className="h-full p-6 rounded-[14px]"
        style={{
          background: accent ? 'color-mix(in srgb, var(--aqua) 5%, transparent)' : 'var(--panel)',
          border: `1px solid ${accent ? 'color-mix(in srgb, var(--aqua) 22%, transparent)' : 'var(--line)'}`,
        }}
      >
        <div className="gwl-note" style={{ color: accent ? 'var(--aqua)' : 'var(--ink-3)', letterSpacing: '0.2em' }}>
          {label}
        </div>
        <ol className="mt-6 flex flex-col">
          {items.map((it, i) => (
            <li key={it} className="flex gap-3.5 items-start">
              <span className="flex flex-col items-center self-stretch">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0"
                  style={{ background: accent ? 'var(--aqua)' : 'var(--ink-3)' }}
                />
                {i < items.length - 1 && (
                  <span className="w-px flex-1 my-1.5"
                    style={{ background: accent ? 'color-mix(in srgb, var(--aqua) 30%, transparent)' : 'var(--line)' }} />
                )}
              </span>
              <span
                className="pb-5 text-[14.5px] tracking-[-0.01em]"
                style={{ color: accent ? 'var(--ink)' : 'var(--ink-3)' }}
              >
                {it}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  )
}
