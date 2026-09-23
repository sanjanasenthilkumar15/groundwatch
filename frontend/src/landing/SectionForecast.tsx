import { useState } from 'react'
import { ArrowRight, CloudRain, Waves, TrendingDown, Gauge } from 'lucide-react'
import { Reveal, SectionHead, Stat, LiveRegion, useInView, RiskPill, riskClass } from './ui'
import {
  KULLAMPATTI_HISTORY, SCENARIOS, FORECAST_LABELS, bandFor,
  type ScenarioKey,
} from './data'
import { makeScale, linePath, bandPath, type Pt } from './chart'

/* ===========================================================================
   SECTION 5 — See what may happen next.
   SECTION 6 — What-if water scenarios.
   =========================================================================== */

export default function SectionForecast() {
  return (
    <>
      <PredictionSection />
      <ScenarioSection />
    </>
  )
}

/* =========================== SECTION 5 ===================================== */

function PredictionSection() {
  const hist = KULLAMPATTI_HISTORY
  const base = SCENARIOS.normal
  const current = hist[hist.length - 1].depth
  const predicted = base.depths[0]

  return (
    <section className="gwl-sec">
      <div className="gwl-wrap">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-14 items-end">
          <SectionHead
            eyebrow="Prediction engine"
            title="See what may happen next."
            lead="The same station, carried forward. Observed levels run up to the present month; beyond it the model projects a monthly groundwater level with an uncertainty band that widens the further out it reaches."
          />
          <Reveal delay={120}>
            <div className="gwl-card p-5">
              <div className="gwl-note">Model</div>
              <div className="mt-2 text-[15px] font-medium">XGBoost Forecasting</div>
              <p className="gwl-note mt-3 leading-relaxed">
                Gradient-boosted trees over lagged groundwater, rolling trends and rainfall history.
                One of several model families the platform can carry in production.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <div className="gwl-panel overflow-hidden">
            <header
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--line)' }}
            >
              <div className="flex items-baseline gap-3">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em]">Kullampatti</h3>
                <span className="gwl-note">Edappadi block · observation well</span>
              </div>
              <div className="flex items-center gap-5">
                <LegendKey swatch="var(--cyan)" label="Observed" />
                <LegendKey swatch="var(--aqua)" label="Forecast" dashed />
                <LegendKey swatch="color-mix(in srgb, var(--aqua) 22%, transparent)" label="Uncertainty" block />
              </div>
            </header>

            <ForecastChart />

            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--line-soft)' }}>
              <Cell k="Station" v="Kullampatti" s="Edappadi block" />
              <Cell k="Current level" v={`${current.toFixed(2)} m`} s="below ground level · Mar 2025" />
              <Cell k="Next-month forecast" v={`${predicted.toFixed(2)} m`} s={`${(predicted - current >= 0 ? '▼ ' : '▲ ')}${Math.abs(predicted - current).toFixed(2)} m change`} />
              <Cell k="Prediction horizon" v="6 months" s="rolling, monthly step" />
            </dl>
          </div>
          <p className="gwl-note mt-3">
            Observed values are from the pilot dataset. The forecast shown here is illustrative —
            live forecasts are generated per station inside the platform.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Cell({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="px-5 py-4" style={{ background: 'var(--bg)' }}>
      <dt className="gwl-note">{k}</dt>
      <dd className="mt-1.5 text-[17px] font-semibold gwl-num tracking-[-0.02em]">{v}</dd>
      <dd className="gwl-note mt-1">{s}</dd>
    </div>
  )
}

function LegendKey({ swatch, label, dashed, block }: { swatch: string; label: string; dashed?: boolean; block?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {block
        ? <span className="w-4 h-2.5 rounded-[2px] block" style={{ background: swatch }} />
        : <span className="w-4 h-0 block" style={{ borderTop: `${dashed ? '1.5px dashed' : '2px solid'} ${swatch}` }} />}
      <span className="gwl-note">{label}</span>
    </span>
  )
}

/* --------------------------------------------------------------------------- */

function ForecastChart() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.25 })

  const hist = KULLAMPATTI_HISTORY
  const sc = SCENARIOS.normal
  const W = 980, H = 300
  const PAD = { t: 22, r: 20, b: 36, l: 44 }

  const total = hist.length + sc.depths.length - 1   // indices 0 … 26
  const maxDepth = 12
  const x = makeScale([0, total], [PAD.l, W - PAD.r])
  const y = makeScale([0, maxDepth], [PAD.t, H - PAD.b])

  const histPts: Pt[] = hist.map((d, i) => [x(i), y(d.depth)])
  const nowX = x(hist.length - 1)

  // forecast starts at the last observed point so the two lines meet
  const fPts: Pt[] = [
    [nowX, y(hist[hist.length - 1].depth)],
    ...sc.depths.map((d, i) => [x(hist.length + i), y(d)] as Pt),
  ]
  const upper: Pt[] = [
    [nowX, y(hist[hist.length - 1].depth)],
    ...sc.depths.map((d, i) => [x(hist.length + i), y(d + sc.spread[i])] as Pt),
  ]
  const lower: Pt[] = [
    [nowX, y(hist[hist.length - 1].depth)],
    ...sc.depths.map((d, i) => [x(hist.length + i), y(Math.max(0, d - sc.spread[i]))] as Pt),
  ]

  return (
    <div ref={ref} className="gwl-xscroll">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" style={{ minWidth: 720 }} role="img"
        aria-label="Observed groundwater depth at Kullampatti with a six-month forecast and uncertainty band">

        {/* forecast field */}
        <rect x={nowX} y={PAD.t - 6} width={W - PAD.r - nowX} height={H - PAD.b - PAD.t + 6}
          fill="color-mix(in srgb, var(--aqua) 4%, transparent)" />

        {/* grid */}
        {[0, 3, 6, 9, 12].map(v => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" />
            <text x={PAD.l - 9} y={y(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-3)"
              fontFamily="'IBM Plex Mono', monospace">{v}</text>
          </g>
        ))}
        <text x={PAD.l - 9} y={PAD.t - 9} textAnchor="end" fontSize="8.5" fill="var(--ink-3)"
          fontFamily="'IBM Plex Mono', monospace">m bgl</text>

        {/* uncertainty */}
        <path
          d={bandPath(upper, lower)} fill="color-mix(in srgb, var(--aqua) 16%, transparent)"
          style={{ opacity: inView ? 1 : 0, transition: 'opacity 900ms ease 1.3s' }}
        />

        {/* observed */}
        <path
          d={linePath(histPts)} fill="none" stroke="var(--cyan)" strokeWidth="2"
          strokeLinecap="round" pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: inView ? 0 : 1,
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)',
          }}
        />

        {/* forecast */}
        <path
          d={linePath(fPts)} fill="none" stroke="var(--aqua)" strokeWidth="2"
          strokeLinecap="round" strokeDasharray="6 5"
          pathLength={1}
          style={{
            strokeDasharray: inView ? '6 5' : '0 1',
            opacity: inView ? 1 : 0,
            transition: 'opacity 700ms ease 1.25s',
          }}
        />

        {/* now divider */}
        <line x1={nowX} x2={nowX} y1={PAD.t - 6} y2={H - PAD.b} stroke="var(--line-strong)" strokeDasharray="2 4" />
        <g style={{ opacity: inView ? 1 : 0, transition: 'opacity 600ms ease 1s' }}>
          <circle cx={nowX} cy={y(hist[hist.length - 1].depth)} r="4" fill="var(--bg)" stroke="var(--cyan)" strokeWidth="2" />
          <text x={nowX - 8} y={PAD.t - 8} textAnchor="end" fontSize="9" fill="var(--ink-3)"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">PAST</text>
          <text x={nowX + 8} y={PAD.t - 8} fontSize="9" fill="var(--aqua)"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">FORECAST</text>
        </g>

        {/* x labels */}
        {hist.map((d, i) => (i % 3 === 0 ? (
          <text key={d.month} x={x(i)} y={H - 12} textAnchor="middle" fontSize="9" fill="var(--ink-3)"
            fontFamily="'IBM Plex Mono', monospace">{d.label}</text>
        ) : null))}
        {FORECAST_LABELS.map((l, i) => (i % 2 === 1 ? (
          <text key={l} x={x(hist.length + i)} y={H - 12} textAnchor="middle" fontSize="9" fill="var(--aqua)"
            fontFamily="'IBM Plex Mono', monospace" opacity="0.8">{l}</text>
        ) : null))}
      </svg>
    </div>
  )
}

/* =========================== SECTION 6 ===================================== */

const ORDER: ScenarioKey[] = ['below', 'normal', 'above']

const TINT: Record<ScenarioKey, string> = {
  below: 'var(--critical)',
  normal: 'var(--aqua)',
  above: 'var(--cyan)',
}

function ScenarioSection() {
  const [key, setKey] = useState<ScenarioKey>('normal')
  const sc = SCENARIOS[key]
  const level = bandFor(sc.riskScore)

  const deepest = sc.depths.reduce(
    (acc, d, i) => (d > acc.d ? { d, m: FORECAST_LABELS[i] } : acc),
    { d: -Infinity, m: '' },
  )

  const chain = [
    { icon: CloudRain, k: 'Future rainfall forecast', v: sc.short, tint: 'var(--cyan)' },
    { icon: Waves, k: 'Expected recharge signal', v: sc.recharge, tint: 'var(--aqua)' },
    { icon: TrendingDown, k: 'Groundwater forecast', v: `${deepest.d.toFixed(1)} m by ${deepest.m}`, tint: 'var(--ink)' },
    { icon: Gauge, k: 'Groundwater risk', v: `${sc.riskScore} · ${level}`, tint: 'var(--risk)' },
  ]

  return (
    <section className="gwl-sec" style={{ background: 'var(--bg-raise)' }}>
      <div className="gwl-gridlines" />
      <div className="gwl-wrap relative">
        <SectionHead
          eyebrow="What-if water scenarios"
          title="Rainfall is an input, not an afterthought."
          lead="A groundwater outlook depends on the season ahead. GroundWatch can carry a future rainfall assumption through the chain — so the question stops being what will happen and becomes what happens if."
        />

        {/* ---- causal chain ---- */}
        <Reveal className="mt-12">
          <div className={`grid gap-3 lg:grid-cols-4 ${riskClass[level]}`}>
            {chain.map((c, i) => (
              <div key={c.k} className="relative">
                <div className="gwl-card p-4 h-full">
                  <div className="flex items-center gap-2.5">
                    <c.icon className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
                    <span className="gwl-note">{c.k}</span>
                  </div>
                  <div
                    key={`${key}-${i}`}
                    className="mt-3 text-[17px] font-semibold tracking-[-0.02em] gwl-num"
                    style={{ color: c.tint, animation: 'gwl-rise 420ms cubic-bezier(0.22,1,0.36,1) both' }}
                  >
                    {c.v}
                  </div>
                </div>
                {i < chain.length - 1 && (
                  <ArrowRight
                    className="hidden lg:block absolute top-1/2 -right-[18px] -translate-y-1/2 w-3.5 h-3.5 z-10"
                    style={{ color: 'var(--ink-3)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* ---- controls + chart ---- */}
        <Reveal className="mt-8" delay={100}>
          <div className="gwl-panel overflow-hidden">
            <header
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              style={{ borderBottom: '1px solid var(--line)' }}
            >
              <div>
                <h3 className="text-[15px] font-semibold tracking-[-0.02em]">Six-month outlook · Kullampatti</h3>
                <p className="gwl-note mt-1">Select a rainfall scenario to re-run the forecast</p>
              </div>
              <div className="flex gap-2 flex-wrap" role="group" aria-label="Rainfall scenario">
                {ORDER.map(k => (
                  <button
                    key={k}
                    onClick={() => setKey(k)}
                    aria-pressed={key === k}
                    className={`gwl-tab ${key === k ? 'is-active' : ''}`}
                    style={{ ['--tint' as string]: TINT[k] }}
                  >
                    {SCENARIOS[k].label}
                  </button>
                ))}
              </div>
            </header>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
              <ScenarioChart active={key} />

              <div className={`p-5 flex flex-col gap-3 ${riskClass[level]}`}
                style={{ borderLeft: '1px solid var(--line)' }}>
                <div>
                  <div className="gwl-note">Resulting risk</div>
                  <div className="flex items-end gap-3 mt-2">
                    <span
                      key={key}
                      className="gwl-num text-[3rem] leading-none font-semibold"
                      style={{ color: 'var(--risk)', animation: 'gwl-rise 450ms cubic-bezier(0.22,1,0.36,1) both' }}
                    >
                      {sc.riskScore}
                    </span>
                    <RiskPill level={level} className="mb-1.5" />
                  </div>
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--line-soft)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sc.riskScore}%`, background: 'var(--risk)' }}
                    />
                  </div>
                </div>

                <p className="gwl-body" style={{ fontSize: 12.5 }}>{sc.note}</p>

                <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
                  <Stat
                    label="Deepest projected level"
                    value={deepest.d.toFixed(2)}
                    unit="m bgl"
                    sub={`expected around ${deepest.m} 2025`}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="gwl-note mt-3">
            Scenario outputs are illustrative and shown to demonstrate the mechanism. Operational risk
            bands follow the platform's 0–100 scale.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------- */

function ScenarioChart({ active }: { active: ScenarioKey }) {
  const W = 700, H = 300
  const PAD = { t: 26, r: 58, b: 36, l: 44 }
  const hist = KULLAMPATTI_HISTORY
  const now = hist[hist.length - 1].depth

  const n = FORECAST_LABELS.length
  const x = makeScale([0, n], [PAD.l, W - PAD.r])
  const y = makeScale([0, 12], [PAD.t, H - PAD.b])

  const sc = SCENARIOS[active]
  const line = (key: ScenarioKey): Pt[] => [
    [x(0), y(now)],
    ...SCENARIOS[key].depths.map((d, i) => [x(i + 1), y(d)] as Pt),
  ]
  const upper: Pt[] = [[x(0), y(now)], ...sc.depths.map((d, i) => [x(i + 1), y(d + sc.spread[i])] as Pt)]
  const lower: Pt[] = [[x(0), y(now)], ...sc.depths.map((d, i) => [x(i + 1), y(Math.max(0, d - sc.spread[i]))] as Pt)]

  const activePts = line(active)
  const endPt = activePts[activePts.length - 1]

  return (
    <LiveRegion className="gwl-xscroll">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" style={{ minWidth: 520 }} role="img"
        aria-label={`Groundwater forecast under ${sc.label}`}>

        {[0, 3, 6, 9, 12].map(v => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" />
            <text x={PAD.l - 9} y={y(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-3)"
              fontFamily="'IBM Plex Mono', monospace">{v}</text>
          </g>
        ))}

        <path d={bandPath(upper, lower)} fill={TINT[active]} opacity="0.13"
          style={{ transition: 'd 600ms cubic-bezier(0.22,1,0.36,1)' }} />

        {/* the two unselected scenarios stay visible as ghosts for comparison */}
        {ORDER.filter(k => k !== active).map(k => (
          <path key={k} d={linePath(line(k))} fill="none" stroke={TINT[k]} strokeWidth="1"
            opacity="0.24" strokeDasharray="3 4" />
        ))}

        <path
          d={linePath(activePts)} fill="none" stroke={TINT[active]} strokeWidth="2.25"
          strokeLinecap="round"
          style={{ transition: 'd 600ms cubic-bezier(0.22,1,0.36,1), stroke 400ms ease' }}
        />

        {/* now anchor */}
        <circle cx={x(0)} cy={y(now)} r="4" fill="var(--bg-raise)" stroke="var(--cyan)" strokeWidth="2" />
        <text x={x(0)} y={PAD.t - 10} textAnchor="middle" fontSize="9" fill="var(--ink-3)"
          fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">NOW</text>

        {/* endpoint readout */}
        <g style={{ transition: 'transform 600ms cubic-bezier(0.22,1,0.36,1)', transform: `translate(${endPt[0]}px, ${endPt[1]}px)` }}>
          <circle r="4" fill={TINT[active]} />
          <circle r="4" fill={TINT[active]} className="gwl-ping" />
          <text x="10" y="4" fontSize="11" fill={TINT[active]} fontFamily="'IBM Plex Mono', monospace">
            {sc.depths[n - 1].toFixed(1)}m
          </text>
        </g>

        {FORECAST_LABELS.map((l, i) => (
          <text key={l} x={x(i + 1)} y={H - 12} textAnchor="middle" fontSize="9" fill="var(--ink-3)"
            fontFamily="'IBM Plex Mono', monospace">{l}</text>
        ))}
      </svg>
    </LiveRegion>
  )
}
