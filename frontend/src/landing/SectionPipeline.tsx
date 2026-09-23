import {
  Droplets, CloudRain, Satellite, SlidersHorizontal, TrendingUp,
  Gauge, HelpCircle, GitBranch, Send,
} from 'lucide-react'
import { Reveal, SectionHead, LiveRegion, useInView } from './ui'

/* ===========================================================================
   SECTION 3 — From environmental data to actionable intelligence.
   Three inputs converge into a six-stage chain; the spine draws itself and
   a pulse travels down it while the section is on screen.
   =========================================================================== */

const SOURCES = [
  { icon: Droplets, label: 'Groundwater', sub: 'Observation wells' },
  { icon: CloudRain, label: 'Rainfall', sub: 'Meteorological record' },
  { icon: Satellite, label: 'Satellite Signals', sub: 'Surface conditions' },
]

const STAGES = [
  {
    n: '01',
    icon: SlidersHorizontal,
    title: 'Feature Engineering',
    body: 'Lagged groundwater levels, rolling trends, rainfall history and seasonal context are assembled into a monthly feature set per station.',
  },
  {
    n: '02',
    icon: TrendingUp,
    title: 'Groundwater Forecast',
    body: 'A gradient-boosted model projects the next month’s groundwater level for each observation station.',
  },
  {
    n: '03',
    icon: Gauge,
    title: 'Risk Engine',
    body: 'Forecast, recent trend and rainfall condition combine into a 0–100 operational risk score and band.',
  },
  {
    n: '04',
    icon: HelpCircle,
    title: 'WHY Analysis',
    body: 'Each score is opened up: which inputs moved the forecast, how strongly, and what that means in plain language.',
  },
  {
    n: '05',
    icon: GitBranch,
    title: 'What-If Scenarios',
    body: 'Rainfall assumptions are varied to show how the outlook shifts under below-normal, normal and above-normal seasons.',
  },
  {
    n: '06',
    icon: Send,
    title: 'Action',
    body: 'Priority locations, officer workflows and farmer advisories — the point at which intelligence becomes a decision.',
  },
]

export default function SectionPipeline() {
  return (
    <section id="how-it-works" className="gwl-sec">
      <div className="gwl-wrap">
        <SectionHead
          eyebrow="The GroundWatch idea"
          title={<>From environmental data to<br className="hidden sm:block" /> actionable intelligence.</>}
          lead="Three independent signals enter the system. What leaves it is a prioritised, explained and scenario-tested view of what may happen next."
        />

        <LiveRegion className="mt-16">
          {/* ---- inputs ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {SOURCES.map((s, i) => (
              <Reveal key={s.label} delay={i * 110}>
                <div className="gwl-card gwl-card--hover p-4 flex items-center gap-3.5 h-full">
                  <span
                    className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--aqua) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--aqua) 20%, transparent)',
                    }}
                  >
                    <s.icon className="w-[17px] h-[17px]" style={{ color: 'var(--aqua)' }} />
                  </span>
                  <span>
                    <span className="block text-[13.5px] font-medium">{s.label}</span>
                    <span className="gwl-note block mt-0.5">{s.sub}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* ---- convergence ---- */}
          <Converge />

          {/* ---- chain ---- */}
          <div className="max-w-4xl mx-auto">
            {STAGES.map((st, i) => (
              <Stage key={st.n} stage={st} last={i === STAGES.length - 1} index={i} />
            ))}
          </div>
        </LiveRegion>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------- */

function Converge() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 })
  return (
    <div ref={ref} className="max-w-4xl mx-auto">
      <svg viewBox="0 0 800 74" className="w-full h-auto block" aria-hidden="true">
        {[133, 400, 667].map((sx, i) => (
          <path
            key={sx}
            d={`M${sx} 0 C ${sx} 34, 400 30, 400 66`}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="1"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: inView ? 0 : 1,
              transition: `stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1) ${i * 120}ms`,
            }}
          />
        ))}
        {[133, 400, 667].map(sx => (
          <path
            key={`f${sx}`}
            d={`M${sx} 0 C ${sx} 34, 400 30, 400 66`}
            fill="none"
            stroke="var(--aqua)"
            strokeWidth="1.25"
            className="gwl-flow"
            opacity="0.6"
          />
        ))}
        <circle cx="400" cy="68" r="3.5" fill="var(--aqua)" />
        <circle cx="400" cy="68" r="3.5" fill="var(--aqua)" className="gwl-ping" />
      </svg>
    </div>
  )
}

/* --------------------------------------------------------------------------- */

function Stage({ stage, last, index }: { stage: typeof STAGES[number]; last: boolean; index: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.35 })

  return (
    <div ref={ref} className="grid grid-cols-[34px_minmax(0,1fr)] sm:grid-cols-[48px_minmax(0,1fr)] gap-x-4 sm:gap-x-7">
      {/* rail */}
      <div className="relative flex flex-col items-center">
        <span
          className="relative w-[30px] h-[30px] sm:w-9 sm:h-9 rounded-full grid place-items-center shrink-0 z-10 transition-all duration-700"
          style={{
            background: inView ? 'color-mix(in srgb, var(--aqua) 12%, transparent)' : 'var(--panel)',
            border: `1px solid ${inView ? 'color-mix(in srgb, var(--aqua) 45%, transparent)' : 'var(--line)'}`,
            color: inView ? 'var(--aqua)' : 'var(--ink-3)',
          }}
        >
          <stage.icon className="w-[15px] h-[15px] sm:w-[17px] sm:h-[17px]" />
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full grid place-items-center gwl-mono"
            style={{
              fontSize: 8,
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              color: 'var(--ink-3)',
            }}
          >
            {stage.n.replace(/^0/, '')}
          </span>
        </span>
        {!last && (
          <span className="relative flex-1 w-px my-1" style={{ background: 'var(--line)' }}>
            <span
              className="absolute inset-x-0 top-0 origin-top transition-transform duration-[900ms] ease-out"
              style={{
                background: 'linear-gradient(180deg, var(--aqua), color-mix(in srgb, var(--aqua) 15%, transparent))',
                bottom: 0,
                transform: inView ? 'scaleY(1)' : 'scaleY(0)',
                transitionDelay: '120ms',
              }}
            />
          </span>
        )}
      </div>

      {/* copy */}
      <div
        className="pb-9 sm:pb-12 pt-0.5 transition-all duration-700"
        style={{
          opacity: inView ? 1 : 0.3,
          transform: inView ? 'none' : 'translateY(10px)',
          transitionDelay: `${index * 30}ms`,
        }}
      >
        <h3 className="gwl-h3">{stage.title}</h3>
        <p className="gwl-body mt-2 max-w-[62ch]">{stage.body}</p>
      </div>
    </div>
  )
}
