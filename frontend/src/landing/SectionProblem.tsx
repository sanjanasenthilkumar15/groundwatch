import { useEffect, useRef, useState } from 'react'
import { Reveal, SectionHead, LiveRegion, useInView } from './ui'
import { KULLAMPATTI_HISTORY } from './data'
import { makeScale, linePath, areaPath, trend, type Pt } from './chart'

/* ===========================================================================
   SECTION 2 — Groundwater changes silently.
   A scroll-driven cross-section: the water table steps down through four
   operational states while the narrative scrolls past it.
   =========================================================================== */

const STAGES = [
  {
    key: 'NORMAL',
    tint: 'var(--low)',
    table: 108,
    title: 'Normal',
    body: 'The water table sits within its seasonal range. Wells draw comfortably and the change month to month is small enough to look like noise.',
  },
  {
    key: 'DECLINING',
    tint: 'var(--moderate)',
    table: 142,
    title: 'Declining',
    body: 'Extraction begins to outpace recharge. The signal is a trend across months, not a single bad reading — which is exactly why it is easy to miss.',
  },
  {
    key: 'STRESSED',
    tint: 'var(--high)',
    table: 178,
    title: 'Stressed',
    body: 'Shallow wells start to fail during the dry months. By this point the decline is visible in the record, but the window for a cheap intervention has narrowed.',
  },
  {
    key: 'CRITICAL',
    tint: 'var(--critical)',
    table: 210,
    title: 'Critical',
    body: 'The shortage is now a field problem — deepened borewells, failed irrigation, crop loss. Response is reactive, expensive and slow.',
  },
]

export default function SectionProblem() {
  const [stage, setStage] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  /* One observer decides which narrative step owns the middle of the screen. */
  useEffect(() => {
    const els = stepRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const i = els.indexOf(e.target as HTMLDivElement)
            if (i >= 0) setStage(i)
          }
        })
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="gwl-sec" style={{ background: 'var(--bg-raise)' }}>
      <div className="gwl-gridlines" />
      <div className="gwl-wrap relative">
        <SectionHead
          eyebrow="The problem"
          title="Groundwater changes silently."
          lead="Depletion does not arrive on a single day. It accumulates beneath the surface across seasons, until the first visible symptom is a well that has stopped yielding."
        />

        <div className="mt-16 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-10 lg:gap-16 items-start">

          {/* ---- sticky cross-section ---- */}
          <div className="lg:sticky lg:top-24">
            <Reveal>
              <div className="gwl-panel overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
                  <span className="gwl-note">Aquifer cross-section · schematic</span>
                  <span
                    className="gwl-note font-semibold transition-colors duration-500"
                    style={{ color: STAGES[stage].tint, letterSpacing: '0.14em' }}
                  >
                    {STAGES[stage].key}
                  </span>
                </div>
                <CrossSection stage={stage} />
              </div>
            </Reveal>

            {/* stage rail */}
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {STAGES.map((s, i) => (
                <div key={s.key}>
                  <div
                    className="h-[3px] rounded-full transition-all duration-500"
                    style={{ background: i <= stage ? s.tint : 'var(--line)' }}
                  />
                  <div
                    className="gwl-note mt-2 transition-colors duration-500 truncate"
                    style={{ color: i === stage ? 'var(--ink)' : 'var(--ink-3)' }}
                  >
                    {s.key}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- narrative steps ---- */}
          <div>
            {STAGES.map((s, i) => (
              <div
                key={s.key}
                ref={el => { stepRefs.current[i] = el }}
                className="py-10 lg:py-[16vh] first:pt-0"
              >
                <div className={`gwl-step ${i === stage ? 'is-on' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.tint }} />
                    <span className="gwl-note" style={{ color: s.tint, letterSpacing: '0.16em' }}>
                      0{i + 1} — {s.key}
                    </span>
                  </div>
                  <h3 className="gwl-h3 mt-4">{s.title}</h3>
                  <p className="gwl-body mt-3 max-w-[46ch]">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- what the pilot record actually looks like ---- */}
        <Reveal className="mt-4 lg:mt-12">
          <div className="gwl-card p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="gwl-eyebrow">Observed record</div>
                <h3 className="gwl-h3 mt-3">A seasonal swing with a trend inside it</h3>
                <p className="gwl-body mt-2.5 max-w-[56ch]">
                  Monthly groundwater depth at Kullampatti, Edappadi block — Jul 2023 to Mar 2025.
                  Every year the table recovers after the monsoon and falls again. The question that
                  matters for planning is where the next few months land, not where the last reading sat.
                </p>
              </div>
              <div className="flex gap-5 shrink-0">
                <Legend swatch="var(--cyan)" label="Observed depth" />
                <Legend swatch="var(--ink-3)" label="Linear trend" dashed />
              </div>
            </div>
            <HistorySpark />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------- */

function Legend({ swatch, label, dashed }: { swatch: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-4 h-0 block"
        style={{ borderTop: `${dashed ? '1px dashed' : '2px solid'} ${swatch}` }}
      />
      <span className="gwl-note">{label}</span>
    </div>
  )
}

/* --------------------------------------------------------------------------- */

function CrossSection({ stage }: { stage: number }) {
  const table = STAGES[stage].table
  const tint = STAGES[stage].tint
  const W = 480, H = 280

  // gentle ground profile
  const ground = 'M0 86 C 62 70, 108 96, 168 84 S 268 62, 332 80 S 428 96, 480 78 L480 280 L0 280 Z'
  const surface = 'M0 86 C 62 70, 108 96, 168 84 S 268 62, 332 80 S 428 96, 480 78'

  const wells = [
    { x: 92, surf: 88 },
    { x: 238, surf: 76 },
    { x: 386, surf: 84 },
  ]

  return (
    <LiveRegion>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img"
        aria-label={`Aquifer cross-section, water table in ${STAGES[stage].key} state`}>
        <defs>
          <linearGradient id="gw-sat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--cyan)' }} stopOpacity="0.55" />
            <stop offset="100%" style={{ stopColor: 'var(--deep)' }} stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="gw-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2129" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0A0F14" stopOpacity="1" />
          </linearGradient>
          <clipPath id="gw-clip"><path d={ground} /></clipPath>
        </defs>

        {/* sky + rainfall */}
        <rect x="0" y="0" width={W} height="92" fill="rgba(56,178,232,0.03)" />
        <g className="gwl-breathe" stroke="rgba(126,194,224,0.35)" strokeWidth="1" strokeLinecap="round">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={i} x1={14 + i * 30} y1={10 + (i % 4) * 9} x2={11 + i * 30} y2={22 + (i % 4) * 9} />
          ))}
        </g>

        {/* subsurface */}
        <path d={ground} fill="url(#gw-soil)" />

        <g clipPath="url(#gw-clip)">
          {/* saturated zone */}
          <rect
            x="0" width={W} height={H}
            y={table}
            fill="url(#gw-sat)"
            style={{ transition: 'y 900ms cubic-bezier(0.22,1,0.36,1)' }}
          />
          {/* water table surface */}
          <line
            x1="0" x2={W} y1={table} y2={table}
            stroke="var(--cyan)" strokeWidth="1.5"
            style={{ transition: 'all 900ms cubic-bezier(0.22,1,0.36,1)' }}
          />
          {/* strata hairlines */}
          {[132, 166, 200, 234].map(y => (
            <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="rgba(148,186,204,0.06)" strokeDasharray="2 6" />
          ))}
          {/* bedrock */}
          <path d={`M0 252 C 90 244, 160 262, 250 250 S 400 240, ${W} 252 L${W} ${H} L0 ${H} Z`}
            fill="rgba(74,112,130,0.12)" />
        </g>

        {/* ground line */}
        <path d={surface} fill="none" stroke="rgba(150,186,204,0.4)" strokeWidth="1.25" />

        {/* observation wells */}
        {wells.map((wl, i) => (
          <g key={i}>
            <rect x={wl.x - 3} y={wl.surf} width="6" height={248 - wl.surf} fill="rgba(4,7,10,0.9)"
              stroke="rgba(150,186,204,0.3)" strokeWidth="0.75" />
            <rect
              x={wl.x - 2} width="4" height={248 - table}
              y={table}
              fill="var(--cyan)" opacity="0.75"
              style={{ transition: 'all 900ms cubic-bezier(0.22,1,0.36,1)' }}
            />
            <rect x={wl.x - 6} y={wl.surf - 7} width="12" height="7" fill="#0A1017"
              stroke="rgba(150,186,204,0.5)" strokeWidth="0.75" />
            <circle cx={wl.x} cy={wl.surf - 10} r="2.4" fill={tint}
              style={{ transition: 'fill 700ms ease' }} />
            <circle cx={wl.x} cy={wl.surf - 10} r="2.4" fill={tint} className="gwl-ping" opacity="0.5"
              style={{ transition: 'fill 700ms ease' }} />
          </g>
        ))}

        {/* depth annotation */}
        <g style={{ transition: 'transform 900ms cubic-bezier(0.22,1,0.36,1)', transform: `translateY(${table}px)` }}>
          <line x1={W - 58} x2={W - 12} y1="0" y2="0" stroke={tint} strokeWidth="1" opacity="0.7"
            style={{ transition: 'stroke 700ms ease' }} />
          <text x={W - 12} y="-6" textAnchor="end" fill={tint} fontSize="9"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em"
            style={{ transition: 'fill 700ms ease' }}>
            WATER TABLE
          </text>
        </g>
      </svg>
    </LiveRegion>
  )
}

/* --------------------------------------------------------------------------- */

function HistorySpark() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 })
  const W = 960, H = 200
  const PAD = { t: 18, r: 16, b: 26, l: 40 }

  const depths = KULLAMPATTI_HISTORY.map(d => d.depth)
  const max = Math.max(...depths) + 0.8
  const x = makeScale([0, depths.length - 1], [PAD.l, W - PAD.r])
  const y = makeScale([0, max], [PAD.t, H - PAD.b])   // depth grows downward

  const pts: Pt[] = depths.map((d, i) => [x(i), y(d)])
  const tl = trend(depths)
  const trendPts: Pt[] = [[x(0), y(tl(0))], [x(depths.length - 1), y(tl(depths.length - 1))]]

  return (
    <div ref={ref} className="mt-6">
      <div className="gwl-xscroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto block w-full" style={{ minWidth: 620 }} role="img"
          aria-label="Observed monthly groundwater depth at Kullampatti, July 2023 to March 2025">
        <defs>
          <linearGradient id="gw-hist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--cyan)' }} stopOpacity="0.26" />
            <stop offset="100%" style={{ stopColor: 'var(--cyan)' }} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 3, 6, 9].map(v => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" />
            <text x={PAD.l - 8} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--ink-3)"
              fontFamily="'IBM Plex Mono', monospace">{v}m</text>
          </g>
        ))}

        <path d={areaPath(pts, H - PAD.b)} fill="url(#gw-hist)"
          style={{ opacity: inView ? 1 : 0, transition: 'opacity 1s ease 0.5s' }} />

        <path
          d={linePath(pts)} fill="none" stroke="var(--cyan)" strokeWidth="1.75"
          strokeLinecap="round" pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: inView ? 0 : 1,
            transition: 'stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)',
          }}
        />

        <path d={linePath(trendPts, 0)} fill="none" stroke="var(--ink-3)" strokeWidth="1"
          strokeDasharray="4 5"
          style={{ opacity: inView ? 1 : 0, transition: 'opacity 0.8s ease 1.4s' }} />

        {KULLAMPATTI_HISTORY.map((d, i) =>
          i % 3 === 0 ? (
            <text key={d.month} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--ink-3)"
              fontFamily="'IBM Plex Mono', monospace">{d.label}</text>
          ) : null,
        )}
      </svg>
      </div>
      <p className="gwl-note mt-3">
        Depth below ground level · pilot dataset, Kullampatti observation well.
        Deeper values sit lower on the chart.
      </p>
    </div>
  )
}
