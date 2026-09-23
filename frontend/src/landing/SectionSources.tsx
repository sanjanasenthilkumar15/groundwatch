import { Droplets, CloudRain, Satellite, Info } from 'lucide-react'
import { Reveal, SectionHead, Counter, useInView } from './ui'
import {
  KULLAMPATTI_HISTORY, STATIONS, BLOCKS,
  SAT_LABELS, NDVI_SERIES, LST_SERIES, ET_SERIES,
} from './data'
import { makeScale, linePath, type Pt } from './chart'

/* ===========================================================================
   SECTION 4 — Three data sources.
   =========================================================================== */

export default function SectionSources() {
  return (
    <section className="gwl-sec" style={{ background: 'var(--bg-raise)' }}>
      <div className="gwl-wrap">
        <SectionHead
          eyebrow="Inputs"
          title="Three signals, read together."
          lead="Each source answers a different question. None of them answers the whole one on its own — which is why GroundWatch reads them as a set."
        />

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            n="01"
            icon={Droplets}
            title="Groundwater"
            claim="Understand what is happening underground."
            body="Monthly observation-well readings across the pilot network, with the lagged levels and rolling trends the forecast depends on most."
            facts={[
              { k: 'Observation stations', v: <Counter to={STATIONS.length} /> },
              { k: 'Blocks covered', v: <Counter to={BLOCKS.length} /> },
            ]}
          >
            <WellField />
          </Card>

          <Card
            n="02"
            icon={CloudRain}
            title="Rainfall"
            claim="Understand an important recharge driver."
            body="Monthly rainfall and its recent history, flagged against the station's own average so an unusually dry or wet run stands out."
            facts={[
              { k: 'Cadence', v: <span className="gwl-mono text-[15px]">Monthly</span> },
              { k: 'Forward use', v: <span className="gwl-mono text-[15px]">Scenario input</span> },
            ]}
          >
            <RainBars />
          </Card>

          <Card
            n="03"
            icon={Satellite}
            title="Satellite Signals"
            claim="Understand environmental conditions at the surface."
            body="Vegetation vigour, land-surface temperature and evapotranspiration, derived from Earth observation and used as environmental context."
            facts={[
              { k: 'Variables', v: <span className="gwl-mono text-[15px]">NDVI · LST · ET</span> },
              { k: 'Role', v: <span className="gwl-mono text-[15px]">Context</span> },
            ]}
          >
            <SatelliteStack />
          </Card>
        </div>

        <Reveal delay={120}>
          <div
            className="mt-4 flex gap-3 p-4 rounded-[12px]"
            style={{
              background: 'color-mix(in srgb, var(--cyan) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--cyan) 18%, transparent)',
            }}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--cyan)' }} />
            <p className="gwl-body" style={{ color: 'var(--ink-2)' }}>
              <strong style={{ color: 'var(--ink)', fontWeight: 550 }}>On satellite variables.</strong>{' '}
              NDVI, land-surface temperature and evapotranspiration describe conditions at the land
              surface. They are environmental signals and context for the model — they do not measure
              groundwater directly. Groundwater levels come from observation wells.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------- */

function Card({
  n, icon: Icon, title, claim, body, facts, children,
}: {
  n: string
  icon: typeof Droplets
  title: string
  claim: string
  body: string
  facts: { k: string; v: React.ReactNode }[]
  children: React.ReactNode
}) {
  return (
    <Reveal delay={(parseInt(n, 10) - 1) * 110} className="h-full">
      <article className="gwl-card gwl-card--hover h-full flex flex-col overflow-hidden group">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="gwl-note" style={{ color: 'var(--aqua)', letterSpacing: '0.18em' }}>{n}</span>
            <Icon className="w-4 h-4 transition-colors duration-500"
              style={{ color: 'var(--ink-3)' }} />
          </div>
          <h3 className="gwl-h3 mt-5">{title}</h3>
          <p className="mt-2.5 text-[14px] leading-snug" style={{ color: 'var(--aqua)' }}>{claim}</p>
          <p className="gwl-body mt-3.5">{body}</p>
        </div>

        <div className="mt-auto">
          <div style={{ borderTop: '1px solid var(--line-soft)' }}>{children}</div>
          <dl className="grid grid-cols-2 gap-px" style={{ background: 'var(--line-soft)' }}>
            {facts.map(f => (
              <div key={f.k} className="px-5 py-3.5" style={{ background: 'var(--bg-raise)' }}>
                <dt className="gwl-note">{f.k}</dt>
                <dd className="mt-1 text-[18px] font-semibold gwl-num" style={{ color: 'var(--ink)' }}>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </article>
    </Reveal>
  )
}

/* --- 01 · well field + depth trace ---------------------------------------- */

function WellField() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 })
  const W = 340, H = 132

  const depths = KULLAMPATTI_HISTORY.map(d => d.depth)
  const x = makeScale([0, depths.length - 1], [12, W - 12])
  const y = makeScale([0, Math.max(...depths) + 1], [16, H - 34])
  const pts: Pt[] = depths.map((d, i) => [x(i), y(d)])

  // a few wells scattered along the baseline
  const wells = [40, 96, 152, 208, 264, 312]

  return (
    <div ref={ref} className="px-2 pt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" aria-hidden="true">
        <defs>
          <linearGradient id="src-gw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--cyan)' }} stopOpacity="0.3" />
            <stop offset="100%" style={{ stopColor: 'var(--cyan)' }} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`${linePath(pts)} L${x(depths.length - 1)} ${H - 30} L${x(0)} ${H - 30} Z`}
          fill="url(#src-gw)"
          style={{ opacity: inView ? 1 : 0, transition: 'opacity 900ms ease 400ms' }}
        />
        <path
          d={linePath(pts)} fill="none" stroke="var(--cyan)" strokeWidth="1.5" pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: inView ? 0 : 1,
            transition: 'stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        />

        {/* ground line + wells */}
        <line x1="0" x2={W} y1={H - 30} y2={H - 30} stroke="var(--line-strong)" />
        {wells.map((wx, i) => (
          <g key={wx}>
            <line x1={wx} x2={wx} y1={H - 30} y2={H - 8} stroke="var(--line-strong)" strokeWidth="1" />
            <circle
              cx={wx} cy={H - 30} r="2.4" fill="var(--aqua)"
              style={{ opacity: inView ? 1 : 0, transition: `opacity 500ms ease ${600 + i * 80}ms` }}
            />
          </g>
        ))}
      </svg>
      <div className="flex justify-between px-3 pb-3">
        <span className="gwl-note">Kullampatti · observed depth</span>
        <span className="gwl-note">Jul 23 → Mar 25</span>
      </div>
    </div>
  )
}

/* --- 02 · monthly rainfall with anomaly colouring -------------------------- */

function RainBars() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 })
  const W = 340, H = 132

  const vals = KULLAMPATTI_HISTORY.map(d => d.rain)
  const known = vals.filter((v): v is number => v !== null)
  const mean = known.reduce((a, b) => a + b, 0) / known.length
  const max = Math.max(...known)
  const bw = (W - 24) / vals.length

  return (
    <div ref={ref} className="px-2 pt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" aria-hidden="true">
        {/* mean line */}
        <line
          x1="12" x2={W - 12}
          y1={H - 30 - (mean / max) * (H - 54)} y2={H - 30 - (mean / max) * (H - 54)}
          stroke="var(--ink-3)" strokeDasharray="3 4" strokeWidth="1"
          style={{ opacity: inView ? 0.8 : 0, transition: 'opacity 700ms ease 700ms' }}
        />
        {vals.map((v, i) => {
          const h = v === null ? 0 : (v / max) * (H - 54)
          const above = v !== null && v >= mean
          return (
            <g key={i}>
              {v === null ? (
                <rect x={12 + i * bw + 1} y={H - 34} width={bw - 2} height="3" rx="1.5"
                  fill="var(--line-strong)" />
              ) : (
                <rect
                  x={12 + i * bw + 1}
                  y={H - 30 - h}
                  width={bw - 2}
                  height={h}
                  rx="1.5"
                  fill={above ? 'var(--cyan)' : 'var(--high)'}
                  opacity={above ? 0.85 : 0.65}
                  style={{
                    transformOrigin: `0px ${H - 30}px`,
                    transform: inView ? 'scaleY(1)' : 'scaleY(0)',
                    transition: `transform 700ms cubic-bezier(0.22,1,0.36,1) ${i * 32}ms`,
                  }}
                />
              )}
            </g>
          )
        })}
        <line x1="0" x2={W} y1={H - 30} y2={H - 30} stroke="var(--line-strong)" />
      </svg>
      <div className="flex justify-between px-3 pb-3">
        <span className="gwl-note">Monthly rainfall vs station mean</span>
        <span className="gwl-note">mm</span>
      </div>
    </div>
  )
}

/* --- 03 · NDVI / LST / ET ------------------------------------------------- */

const SAT_ROWS = [
  { key: 'NDVI', series: NDVI_SERIES, tint: '#38B05A', unit: '', dp: 2 },
  { key: 'LST', series: LST_SERIES, tint: '#EE7B33', unit: '°C', dp: 1 },
  { key: 'ET', series: ET_SERIES, tint: '#38B2E8', unit: 'mm', dp: 1 },
]

function SatelliteStack() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 })

  return (
    <div ref={ref} className="px-5 py-4 flex flex-col gap-3">
      {SAT_ROWS.map((row, ri) => {
        const W = 300, H = 26
        const lo = Math.min(...row.series), hi = Math.max(...row.series)
        const x = makeScale([0, row.series.length - 1], [0, W])
        const y = makeScale([lo, hi], [H - 3, 3])
        const pts: Pt[] = row.series.map((v, i) => [x(i), y(v)])
        const last = row.series[row.series.length - 1]

        return (
          <div key={row.key} className="grid grid-cols-[38px_minmax(0,1fr)_58px] items-center gap-2.5">
            <span className="gwl-note" style={{ color: row.tint }}>{row.key}</span>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[26px] block" preserveAspectRatio="none">
              <path
                d={linePath(pts, 0.5)} fill="none" stroke={row.tint} strokeWidth="1.25"
                vectorEffect="non-scaling-stroke" pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: inView ? 0 : 1,
                  transition: `stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1) ${ri * 180}ms`,
                }}
              />
            </svg>
            <span className="gwl-mono text-[11.5px] text-right" style={{ color: 'var(--ink-2)' }}>
              {last.toFixed(row.dp)}{row.unit}
            </span>
          </div>
        )
      })}
      <div className="flex justify-between pt-1">
        <span className="gwl-note">Kullampatti · {SAT_LABELS[0]} 24 → {SAT_LABELS[11]} 25</span>
        <span className="gwl-note">latest</span>
      </div>
    </div>
  )
}
