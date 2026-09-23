import { useMemo, useState } from 'react'
import { Activity, CloudRain, TrendingDown, Target, ZoomOut, MapPin, History } from 'lucide-react'
import { Reveal, SectionHead, LiveRegion, useInView, RiskPill, riskClass, Counter, type RiskLevel } from './ui'
import {
  RISK_BANDS, bandFor, STATIONS, WHY_FACTORS, WHY_DISCLAIMER, SCENARIOS, KULLAMPATTI_HISTORY,
} from './data'

/* ===========================================================================
   SECTION 7 — Risk engine
   SECTION 8 — WHY analysis
   SECTION 9 — Priority locations
   =========================================================================== */

const FOCUS_SCORE = SCENARIOS.normal.riskScore   // 61 — Kullampatti, normal rainfall
const FOCUS_LEVEL = bandFor(FOCUS_SCORE)

export default function SectionRisk() {
  return (
    <div id="risk">
      <RiskEngine />
      <WhyAnalysis />
      <PriorityLocations />
    </div>
  )
}

/* =========================== SECTION 7 ===================================== */

function RiskEngine() {
  const now = KULLAMPATTI_HISTORY[KULLAMPATTI_HISTORY.length - 1]
  const next = SCENARIOS.normal.depths[0]

  const cards = [
    {
      icon: Activity, k: 'Risk score',
      v: <><Counter to={FOCUS_SCORE} /><span style={{ color: 'var(--ink-3)' }}>/100</span></>,
      s: `${FOCUS_LEVEL} band`, tone: FOCUS_LEVEL as RiskLevel,
    },
    {
      icon: TrendingDown, k: 'Groundwater trend', v: 'Declining',
      s: `${now.depth.toFixed(2)} m → deepening since Dec`, tone: undefined,
    },
    {
      icon: CloudRain, k: 'Rainfall condition', v: 'Below expected',
      s: `${now.rain?.toFixed(1)} mm in ${now.label} 25`, tone: undefined,
    },
    {
      icon: Target, k: 'Forecast', v: `${next.toFixed(2)} m`,
      s: 'next month, below ground level', tone: undefined,
    },
  ]

  return (
    <section className="gwl-sec">
      <div className="gwl-wrap">
        <SectionHead
          eyebrow="Risk engine"
          title="Not just a prediction. A priority signal."
          lead={`A forecast on its own still leaves an officer with ${STATIONS.length} stations and no ordering. The risk engine folds the forecast together with the recent groundwater trend and the rainfall condition into a single 0–100 score, so attention can go where it matters first.`}
        />

        <div className="mt-14 grid lg:grid-cols-[400px_minmax(0,1fr)] gap-8 lg:gap-14 items-start">
          <Reveal>
            <div className="gwl-panel p-6">
              <RiskGauge score={FOCUS_SCORE} />
              <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--line)' }}>
                <div className="gwl-note mb-3">GroundWatch Operational Risk Bands</div>
                <ul className="flex flex-col gap-1.5">
                  {RISK_BANDS.map(b => (
                    <li
                      key={b.level}
                      className={`flex items-center justify-between px-3 py-2 rounded-[6px] ${riskClass[b.level]}`}
                      style={{
                        background: b.level === FOCUS_LEVEL ? 'color-mix(in srgb, var(--risk) 12%, transparent)' : 'transparent',
                        border: `1px solid ${b.level === FOCUS_LEVEL ? 'color-mix(in srgb, var(--risk) 32%, transparent)' : 'transparent'}`,
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <i className="gwl-dot" />
                        <span className="text-[12.5px] font-medium tracking-wide">{b.level}</span>
                      </span>
                      <span className="gwl-mono text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
                        {b.from}–{b.to}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="gwl-note mt-4 leading-relaxed">
                  These are GroundWatch operational bands used to prioritise attention inside the
                  platform. They are not official CGWB groundwater categories.
                </p>
              </div>
            </div>
          </Reveal>

          <div>
            <div className="grid sm:grid-cols-2 gap-3">
              {cards.map((c, i) => (
                <Reveal key={c.k} delay={i * 90}>
                  <div className={`gwl-card gwl-card--hover p-5 h-full ${c.tone ? riskClass[c.tone] : ''}`}>
                    <div className="flex items-center gap-2.5">
                      <c.icon className="w-3.5 h-3.5" style={{ color: c.tone ? 'var(--risk)' : 'var(--ink-3)' }} />
                      <span className="gwl-note">{c.k}</span>
                    </div>
                    <div
                      className="mt-3.5 text-[1.75rem] leading-none font-semibold gwl-num tracking-[-0.03em]"
                      style={{ color: c.tone ? 'var(--risk)' : 'var(--ink)' }}
                    >
                      {c.v}
                    </div>
                    <div className="gwl-note mt-2.5">{c.s}</div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={260}>
              <div
                className={`mt-3 gwl-card p-5 sm:p-6 ${riskClass[FOCUS_LEVEL]}`}
                style={{
                  borderColor: 'color-mix(in srgb, var(--risk) 38%, transparent)',
                  background: 'color-mix(in srgb, var(--risk) 7%, transparent)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="gwl-note" style={{ color: 'var(--risk)', letterSpacing: '0.18em' }}>
                      Priority location
                    </div>
                    <h3 className="gwl-h3 mt-2.5">Kullampatti</h3>
                    <p className="gwl-note mt-1.5">Edappadi block · Salem district</p>
                  </div>
                  <div className="text-right">
                    <RiskPill level={FOCUS_LEVEL} />
                    <div className="gwl-num text-[2.25rem] leading-none font-semibold mt-2.5"
                      style={{ color: 'var(--risk)' }}>
                      {FOCUS_SCORE}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --- semicircular gauge ---------------------------------------------------- */

function RiskGauge({ score }: { score: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 })
  const level = bandFor(score)

  const W = 320, H = 190
  const cx = W / 2, cy = 160, r = 120
  const toXY = (frac: number, rad: number) => {
    const a = Math.PI + frac * Math.PI
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]
  }
  const arc = (f0: number, f1: number, rad: number) => {
    const [x0, y0] = toXY(f0, rad)
    const [x1, y1] = toXY(f1, rad)
    return `M${x0} ${y0} A${rad} ${rad} 0 0 1 ${x1} ${y1}`
  }

  const segs = [
    { level: 'LOW' as const, f0: 0, f1: 0.245, c: 'var(--low)' },
    { level: 'MODERATE' as const, f0: 0.25, f1: 0.495, c: 'var(--moderate)' },
    { level: 'HIGH' as const, f0: 0.5, f1: 0.695, c: 'var(--high)' },
    { level: 'CRITICAL' as const, f0: 0.7, f1: 1, c: 'var(--critical)' },
  ]

  const frac = score / 100
  const angle = -90 + frac * 180

  return (
    <div ref={ref} className={riskClass[level]}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img"
        aria-label={`Risk score ${score} of 100, ${level} band`}>
        {/* track */}
        <path d={arc(0, 1, r)} fill="none" stroke="var(--line-soft)" strokeWidth="14" strokeLinecap="round" />

        {segs.map(s => (
          <path
            key={s.level}
            d={arc(s.f0, s.f1, r)}
            fill="none"
            stroke={s.c}
            strokeWidth="14"
            strokeLinecap="round"
            opacity={s.level === level ? 1 : 0.22}
            style={{ transition: 'opacity 700ms ease 700ms' }}
          />
        ))}

        {/* ticks */}
        {[0, 0.25, 0.5, 0.7, 1].map(f => {
          const [x0, y0] = toXY(f, r - 12)
          const [x1, y1] = toXY(f, r - 18)
          return <line key={f} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--line-strong)" strokeWidth="1" />
        })}

        {/* needle */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${inView ? angle : -90}deg)`,
            transition: 'transform 1.5s cubic-bezier(0.22,1,0.36,1) 200ms',
          }}
        >
          <line x1={cx} y1={cy} x2={cx} y2={cy - r + 22} stroke="var(--risk)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="6" fill="var(--bg-raise)" stroke="var(--risk)" strokeWidth="2" />

        <text x={cx} y={cy - 48} textAnchor="middle" fontSize="46" fontWeight="600" fill="var(--risk)"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
          {inView ? score : 0}
        </text>
        <text x={cx} y={cy - 26} textAnchor="middle" fontSize="10" fill="var(--ink-3)"
          fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.18em">
          {level}
        </text>

        <text x={cx - r} y={cy + 20} textAnchor="middle" fontSize="9" fill="var(--ink-3)"
          fontFamily="'IBM Plex Mono', monospace">0</text>
        <text x={cx + r} y={cy + 20} textAnchor="middle" fontSize="9" fill="var(--ink-3)"
          fontFamily="'IBM Plex Mono', monospace">100</text>
      </svg>
    </div>
  )
}

/* =========================== SECTION 8 ===================================== */

const WHY_BULLETS = [
  { icon: TrendingDown, text: 'Recent groundwater levels are declining' },
  { icon: History, text: 'Historical groundwater trend is influencing the forecast' },
  { icon: CloudRain, text: 'Rainfall conditions are contributing to water stress' },
]

function WhyAnalysis() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 })
  const maxImp = Math.max(...WHY_FACTORS.map(f => f.importance))

  return (
    <section className="gwl-sec" style={{ background: 'var(--bg-raise)' }}>
      <div className="gwl-gridlines" />
      <div className="gwl-wrap relative">
        <SectionHead
          eyebrow="Explainable risk analysis"
          title="Know why the risk is rising."
          lead="A score nobody can interrogate is a score nobody will act on. Every GroundWatch risk value opens into the factors behind it — what moved the forecast, how strongly, and what that means in words an officer can use."
        />

        <div ref={ref} className="mt-14 grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-4">

          {/* verdict */}
          <Reveal>
            <div className={`gwl-panel p-6 sm:p-7 h-full flex flex-col ${riskClass[FOCUS_LEVEL]}`}>
              <div className="flex items-center justify-between">
                <span className="gwl-note">Kullampatti · Edappadi</span>
                <RiskPill level={FOCUS_LEVEL} />
              </div>

              <div className="mt-6">
                <div
                  className="text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.04em]"
                  style={{ color: 'var(--risk)' }}
                >
                  {FOCUS_LEVEL} RISK
                </div>
                <div className="gwl-eyebrow mt-6">Why?</div>
              </div>

              <ul className="mt-5 flex flex-col gap-3">
                {WHY_BULLETS.map((b, i) => (
                  <li
                    key={b.text}
                    className="flex gap-3 items-start"
                    style={{
                      opacity: inView ? 1 : 0,
                      transform: inView ? 'none' : 'translateY(8px)',
                      transition: `all 600ms cubic-bezier(0.22,1,0.36,1) ${300 + i * 140}ms`,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-md grid place-items-center shrink-0"
                      style={{
                        background: 'color-mix(in srgb, var(--risk) 14%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--risk) 30%, transparent)',
                      }}
                    >
                      <b.icon className="w-3 h-3" style={{ color: 'var(--risk)' }} />
                    </span>
                    <span className="text-[14px] leading-relaxed mt-0.5" style={{ color: 'var(--ink-2)' }}>{b.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <p className="gwl-note leading-relaxed">{WHY_DISCLAIMER}</p>
              </div>
            </div>
          </Reveal>

          {/* contributions */}
          <Reveal delay={120}>
            <div className="gwl-panel p-6 sm:p-7 h-full">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em]">Feature contribution</h3>
                <span className="gwl-note">model influence</span>
              </div>

              <ul className="mt-7 flex flex-col gap-5">
                {WHY_FACTORS.map((f, i) => (
                  <li key={f.feature}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[13.5px] font-medium tracking-[-0.01em]">{f.name}</span>
                      <span className="gwl-mono text-[11px] shrink-0" style={{ color: 'var(--ink-3)' }}>
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-2 h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--line-soft)' }}>
                      <div
                        className="h-full rounded-full origin-left"
                        style={{
                          width: `${(f.importance / maxImp) * 100}%`,
                          background: i < 3
                            ? 'linear-gradient(90deg, var(--aqua), var(--cyan))'
                            : 'var(--line-strong)',
                          transform: inView ? 'scaleX(1)' : 'scaleX(0)',
                          transition: `transform 900ms cubic-bezier(0.22,1,0.36,1) ${200 + i * 110}ms`,
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="gwl-note" style={{ color: 'var(--aqua)' }}>{f.strength}</span>
                      <span className="gwl-note">· {f.note}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* =========================== SECTION 9 ===================================== */

type Filter = 'ALL' | RiskLevel

const FILTERS: Filter[] = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW']

function PriorityLocations() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [hover, setHover] = useState<string | null>(null)
  const [focusBlock, setFocusBlock] = useState<string | null>(null)

  const ranked = useMemo(
    () => [...STATIONS].sort((a, b) => b.score - a.score),
    [],
  )
  const priority = ranked.filter(s => s.score >= 50)
  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 }
    STATIONS.forEach(s => { c[bandFor(s.score)]++ })
    return c
  }, [])

  const visible = (s: typeof STATIONS[number]) =>
    filter === 'ALL' || bandFor(s.score) === filter

  return (
    <section className="gwl-sec">
      <div className="gwl-wrap">
        <SectionHead
          eyebrow="Priority locations"
          title="The district, ordered by where it hurts first."
          lead="Every observation station in the pilot network, carrying its own score and band. Filter by risk, focus a block, and the list reorders around what needs attention."
        />

        <Reveal className="mt-12">
          <div className="gwl-panel overflow-hidden">
            <header
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              style={{ borderBottom: '1px solid var(--line)' }}
            >
              <div className="flex items-baseline gap-3">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em]">Salem District</h3>
                <span className="gwl-note">{STATIONS.length} monitoring locations</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`gwl-tab ${filter === f ? 'is-active' : ''} ${f !== 'ALL' ? riskClass[f] : ''}`}
                    style={{ ['--tint' as string]: f === 'ALL' ? 'var(--aqua)' : 'var(--risk)' }}
                  >
                    {f}{f !== 'ALL' && <span className="ml-1.5 opacity-60">{counts[f]}</span>}
                  </button>
                ))}
              </div>
            </header>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
              <DistrictMap
                filter={filter}
                hover={hover}
                setHover={setHover}
                focusBlock={focusBlock}
                setFocusBlock={setFocusBlock}
                visible={visible}
              />

              {/* priority list */}
              <aside style={{ borderLeft: '1px solid var(--line)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
                  <div className="gwl-note">Priority locations</div>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="gwl-num text-[1.9rem] font-semibold leading-none">
                      <Counter to={priority.length} />
                    </span>
                    <span className="gwl-note">at HIGH or CRITICAL</span>
                  </div>
                </div>

                <ul className="max-h-[320px] overflow-y-auto">
                  {ranked.filter(visible).slice(0, 14).map(s => {
                    const lvl = bandFor(s.score)
                    return (
                      <li key={s.name}>
                        <button
                          onMouseEnter={() => setHover(s.name)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(s.name)}
                          onBlur={() => setHover(null)}
                          onClick={() => setFocusBlock(s.block)}
                          className={`w-full text-left px-5 py-3 flex items-center justify-between gap-3 transition-colors ${riskClass[lvl]}`}
                          style={{
                            borderBottom: '1px solid var(--line-soft)',
                            background: hover === s.name ? 'color-mix(in srgb, var(--risk) 10%, transparent)' : 'transparent',
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium truncate">{s.name}</span>
                            <span className="gwl-note block mt-0.5">{s.block}</span>
                          </span>
                          <span className="flex items-center gap-2.5 shrink-0">
                            <span className="gwl-mono text-[13px]" style={{ color: 'var(--risk)' }}>{s.score}</span>
                            <i className="gwl-dot" />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </aside>
            </div>
          </div>
          <p className="gwl-note mt-3">
            Station names, blocks and coordinates are from the pilot network. Scores shown here are a
            sample operational view — live values are computed per station inside the platform.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* --- map ------------------------------------------------------------------- */

const MAP_W = 660, MAP_H = 420, MAP_PAD = 46

function DistrictMap({
  filter, hover, setHover, focusBlock, setFocusBlock, visible,
}: {
  filter: Filter
  hover: string | null
  setHover: (v: string | null) => void
  focusBlock: string | null
  setFocusBlock: (v: string | null) => void
  visible: (s: typeof STATIONS[number]) => boolean
}) {
  const geo = useMemo(() => {
    const kx = Math.cos((11.65 * Math.PI) / 180)
    const xs = STATIONS.map(s => s.lon * kx)
    const ys = STATIONS.map(s => s.lat)
    const x0 = Math.min(...xs), x1 = Math.max(...xs)
    const y0 = Math.min(...ys), y1 = Math.max(...ys)

    const sx = (MAP_W - MAP_PAD * 2) / (x1 - x0)
    const sy = (MAP_H - MAP_PAD * 2) / (y1 - y0)
    const s = Math.min(sx, sy)
    const ox = (MAP_W - (x1 - x0) * s) / 2
    const oy = (MAP_H - (y1 - y0) * s) / 2

    const project = (lat: number, lon: number): [number, number] => [
      ox + (lon * kx - x0) * s,
      MAP_H - oy - (lat - y0) * s,
    ]

    const pts = STATIONS.map(st => ({ ...st, p: project(st.lat, st.lon) }))
    return { pts, hull: convexHull(pts.map(p => p.p)) }
  }, [])

  /* zoom to a block's centroid */
  const view = useMemo(() => {
    if (!focusBlock) return { k: 1, tx: 0, ty: 0 }
    const inBlock = geo.pts.filter(p => p.block === focusBlock)
    if (!inBlock.length) return { k: 1, tx: 0, ty: 0 }
    const cx = inBlock.reduce((a, p) => a + p.p[0], 0) / inBlock.length
    const cy = inBlock.reduce((a, p) => a + p.p[1], 0) / inBlock.length
    const k = 2.1
    return { k, tx: MAP_W / 2 - cx * k, ty: MAP_H / 2 - cy * k }
  }, [focusBlock, geo])

  const hullPath = geo.hull.length
    ? `M${geo.hull.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')} Z`
    : ''

  const hovered = geo.pts.find(p => p.name === hover)
  const r = 5 / view.k

  return (
    <LiveRegion className="relative">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full h-auto block" role="img"
        aria-label="Map of monitoring locations across Salem district, coloured by risk band">
        <defs>
          <radialGradient id="map-glow" cx="50%" cy="50%">
            <stop offset="0%" style={{ stopColor: 'var(--deep)' }} stopOpacity="0.22" />
            <stop offset="100%" style={{ stopColor: 'var(--deep)' }} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="url(#map-glow)" />

        {/* graticule */}
        <g stroke="var(--line-soft)">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={(MAP_W / 8) * i} x2={(MAP_W / 8) * i} y1="0" y2={MAP_H} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" x2={MAP_W} y1={(MAP_H / 5) * i} y2={(MAP_H / 5) * i} />
          ))}
        </g>

        <g
          style={{
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`,
            transition: 'transform 800ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* network envelope */}
          <path d={hullPath} fill="color-mix(in srgb, var(--aqua) 4%, transparent)" stroke="var(--line-strong)"
            strokeWidth={1 / view.k} strokeDasharray={`${4 / view.k} ${5 / view.k}`} />

          {geo.pts.map(st => {
            const lvl = bandFor(st.score)
            const on = visible(st)
            const isHover = hover === st.name
            const dim = focusBlock && st.block !== focusBlock
            return (
              <g
                key={st.name}
                className={riskClass[lvl]}
                style={{
                  opacity: !on ? 0.12 : dim ? 0.3 : 1,
                  transition: 'opacity 450ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHover(st.name)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setFocusBlock(focusBlock === st.block ? null : st.block)}
              >
                {(lvl === 'CRITICAL' || lvl === 'HIGH') && on && (
                  <circle cx={st.p[0]} cy={st.p[1]} r={r} fill="var(--risk)" className="gwl-ping"
                    opacity="0.45" />
                )}
                <circle cx={st.p[0]} cy={st.p[1]} r={isHover ? r * 1.6 : r}
                  fill="var(--risk)" fillOpacity={isHover ? 1 : 0.85}
                  stroke="var(--bg)" strokeWidth={1.2 / view.k} />
                {/* generous invisible hit area */}
                <circle cx={st.p[0]} cy={st.p[1]} r={14 / view.k} fill="transparent" />
              </g>
            )
          })}
        </g>
      </svg>

      {/* hover readout */}
      <div
        className="absolute left-4 bottom-4 pointer-events-none transition-opacity duration-300"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        {hovered && (
          <div className={`gwl-inset px-3.5 py-2.5 ${riskClass[bandFor(hovered.score)]}`}
            style={{ background: 'color-mix(in srgb, var(--bg) 92%, transparent)', backdropFilter: 'blur(6px)' }}>
            <div className="text-[13px] font-medium">{hovered.name}</div>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="gwl-note">{hovered.block}</span>
              <span className="gwl-mono text-[11px]" style={{ color: 'var(--risk)' }}>
                {hovered.score} · {bandFor(hovered.score)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* zoom state */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {focusBlock ? (
          <button onClick={() => setFocusBlock(null)} className="gwl-tab is-active flex items-center gap-2"
            style={{ ['--tint' as string]: 'var(--aqua)' }}>
            <ZoomOut className="w-3 h-3" /> {focusBlock}
          </button>
        ) : (
          <span className="gwl-note flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Click a station to focus its block
          </span>
        )}
      </div>

      {filter !== 'ALL' && (
        <div className="absolute left-4 top-4">
          <span className={`gwl-pill ${riskClass[filter]}`}>
            <i className="gwl-dot" />Showing {filter}
          </span>
        </div>
      )}
    </LiveRegion>
  )
}

/* Andrew's monotone chain — draws the monitoring-network envelope. */
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

  const lower: [number, number][] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: [number, number][] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop(); upper.pop()
  return lower.concat(upper)
}
