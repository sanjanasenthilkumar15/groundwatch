import {
  Landmark, Building2, Users, Sprout, ArrowRight, Check, Circle, Clock,
  MapPinned, Wallet, Plug, BarChart3, Wrench,
} from 'lucide-react'
import { Reveal, SectionHead, useInView } from './ui'
import { ROADMAP } from './data'

/* ===========================================================================
   SECTION 14 — Business model
   SECTION 15 — Roadmap
   SECTION 16 — Technology
   =========================================================================== */

export default function SectionFuture() {
  return (
    <>
      <BusinessModel />
      <Roadmap />
      <Technology />
    </>
  )
}

/* =========================== SECTION 14 ==================================== */

const CUSTOMERS = [
  { icon: Landmark, text: 'Government groundwater and water-resource departments' },
  { icon: MapPinned, text: 'District administrations' },
  { icon: Sprout, text: 'Agriculture departments' },
]
const USERS = ['Groundwater officers', 'Agriculture officers', 'Field teams', 'FPOs', 'Eventually farmers']
const REVENUE = [
  { icon: Wallet, k: 'Annual platform subscription', v: 'Per district or state deployment' },
  { icon: Wrench, k: 'Deployment & integration', v: 'Data onboarding and setup' },
  { icon: Plug, k: 'Analytics / API', v: 'Programmatic access for partner systems' },
  { icon: BarChart3, k: 'Customization', v: 'Department-specific workflows' },
]

const DELIVERY = [
  { icon: Landmark, k: 'Government' },
  { icon: Building2, k: 'GroundWatch Platform' },
  { icon: Users, k: 'Officers' },
  { icon: Sprout, k: 'Farmers' },
]

function BusinessModel() {
  return (
    <section className="gwl-sec">
      <div className="gwl-wrap">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 lg:gap-16">
          <SectionHead
            eyebrow="Business model"
            title="Built for real-world deployment."
            lead="Groundwater management is a public mandate before it is a market. GroundWatch is designed to sit inside that mandate — deployed by the departments already responsible for the resource, and reaching farmers through them."
          >
            <div
              className="gwl-badge mt-7"
              style={{ borderColor: 'color-mix(in srgb, var(--aqua) 35%, transparent)', color: 'var(--aqua)' }}
            >
              B2G first
            </div>
          </SectionHead>

          <div className="flex flex-col gap-4">
            <Reveal>
              <div className="gwl-card p-5">
                <div className="gwl-note">Primary customers</div>
                <ul className="mt-3.5 flex flex-col gap-3">
                  {CUSTOMERS.map(c => (
                    <li key={c.text} className="flex gap-3 items-center text-[14px]" style={{ color: 'var(--ink-2)' }}>
                      <span
                        className="w-7 h-7 rounded-md grid place-items-center shrink-0"
                        style={{
                          background: 'color-mix(in srgb, var(--aqua) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--aqua) 22%, transparent)',
                        }}
                      >
                        <c.icon className="w-3.5 h-3.5" style={{ color: 'var(--aqua)' }} />
                      </span>
                      {c.text}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="gwl-card p-5">
                <div className="gwl-note">Users</div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {USERS.map(u => (
                    <span key={u} className="gwl-badge" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="gwl-card overflow-hidden">
                <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <div className="gwl-note">Revenue model</div>
                </div>
                <dl>
                  {REVENUE.map(r => (
                    <div key={r.k} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3"
                      style={{ borderBottom: '1px solid var(--line-soft)' }}>
                      <dt className="flex items-center gap-2.5 text-[13.5px]" style={{ color: 'var(--ink)' }}>
                        <r.icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ink-3)' }} />
                        {r.k}
                      </dt>
                      <dd className="gwl-note">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>

        {/* delivery chain */}
        <Reveal className="mt-12" delay={120}>
          <div className="gwl-panel px-5 py-7 sm:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-7 items-center gap-y-6 gap-x-2">
              {DELIVERY.map((d, i) => (
                <div key={d.k} className="contents">
                  <div className="flex flex-col items-center text-center gap-3">
                    <span className="w-11 h-11 rounded-xl grid place-items-center"
                      style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
                      <d.icon className="w-[18px] h-[18px]" style={{ color: i === 1 ? 'var(--aqua)' : 'var(--ink-2)' }} />
                    </span>
                    <span className="text-[13px] font-medium tracking-[-0.01em] leading-snug">{d.k}</span>
                  </div>
                  {i < DELIVERY.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center">
                      <ArrowRight className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* =========================== SECTION 15 ==================================== */

const STATE_STYLE = {
  live: { icon: Check, color: 'var(--aqua)', label: 'Shipped' },
  building: { icon: Clock, color: 'var(--cyan)', label: 'In progress' },
  planned: { icon: Circle, color: 'var(--ink-3)', label: 'Planned' },
} as const

function Roadmap() {
  return (
    <section id="roadmap" className="gwl-sec" style={{ background: 'var(--bg-raise)' }}>
      <div className="gwl-gridlines" />
      <div className="gwl-wrap relative">
        <SectionHead
          eyebrow="Roadmap"
          title="Salem is the starting point."
          lead="The pilot exists to prove the loop end to end in one district. Everything after it is depth — more signals, more agricultural context, and more geography."
        />

        <div className="mt-14 gwl-hscroll gwl-lg-grid">
          {ROADMAP.map((col, i) => (
            <RoadmapColumn key={col.phase} col={col} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function RoadmapColumn({ col, index }: { col: typeof ROADMAP[number]; index: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.25 })
  const st = STATE_STYLE[col.state]

  return (
    <div ref={ref} className="w-[265px]">
      {/* progress rail */}
      <div className="flex items-center gap-2.5 mb-5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-700"
          style={{
            background: inView ? st.color : 'var(--line)',
            boxShadow: inView && col.state === 'live' ? '0 0 0 4px color-mix(in srgb, var(--aqua) 14%, transparent)' : 'none',
            transitionDelay: `${index * 120}ms`,
          }}
        />
        <span
          className="h-px flex-1 origin-left transition-transform duration-[900ms]"
          style={{
            background: 'var(--line-strong)',
            transform: inView ? 'scaleX(1)' : 'scaleX(0)',
            transitionDelay: `${index * 120 + 120}ms`,
          }}
        />
      </div>

      <div
        className="gwl-card p-5 h-full transition-all duration-700"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(18px)',
          transitionDelay: `${index * 120}ms`,
          borderColor: col.state === 'live' ? 'color-mix(in srgb, var(--aqua) 30%, transparent)' : 'var(--line)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="gwl-eyebrow" style={{ color: 'var(--ink)' }}>{col.phase}</span>
          <span className="gwl-note flex items-center gap-1.5" style={{ color: st.color }}>
            <st.icon className="w-3 h-3" />{st.label}
          </span>
        </div>

        <ul className="mt-5 flex flex-col gap-3">
          {col.items.map((it, j) => (
            <li
              key={it}
              className="flex gap-2.5 items-start text-[13.5px] leading-snug transition-all duration-500"
              style={{
                color: col.state === 'planned' ? 'var(--ink-2)' : 'var(--ink)',
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateX(-6px)',
                transitionDelay: `${index * 120 + 240 + j * 70}ms`,
              }}
            >
              <st.icon className="w-3 h-3 mt-0.5 shrink-0" style={{ color: st.color, opacity: 0.75 }} />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* =========================== SECTION 16 ==================================== */

const ARCH = [
  { k: 'Data sources', v: 'Groundwater · Rainfall · Earth observation' },
  { k: 'Data ingestion', v: 'Scheduled pulls, cleaning, station matching' },
  { k: 'Feature engineering', v: 'Lags, rolling windows, seasonal context' },
  { k: 'XGBoost', v: 'Per-station monthly groundwater forecast' },
  { k: 'Risk engine', v: '0–100 operational score and band' },
  { k: 'API', v: 'FastAPI service, authenticated by role' },
  { k: 'Dashboard', v: 'React officer console, installable as a PWA' },
  { k: 'Alerts', v: 'Bilingual advisories to registered subscribers' },
]

const STACK = {
  'In production': ['Python', 'Pandas', 'NumPy', 'XGBoost', 'scikit-learn', 'Google Earth Engine', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'JWT auth', 'React', 'TypeScript', 'Vite', 'Leaflet', 'Recharts'],
  'Future architecture': ['PostGIS', 'Managed pipeline orchestration', 'WhatsApp Business API', 'Model registry & monitoring'],
}

function Technology() {
  return (
    <section id="technology" className="gwl-sec">
      <div className="gwl-wrap">
        <SectionHead
          eyebrow="Technology"
          title="A pipeline, not a notebook."
          lead="Data arrives on a schedule, becomes features, becomes a forecast, becomes a score, and leaves through an API that the dashboard and the alerting layer both consume."
        />

        <Reveal className="mt-14">
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-[14px] overflow-hidden"
            style={{ background: 'var(--line)', border: '1px solid var(--line)' }}>
            {ARCH.map((a, i) => (
              <li key={a.k} className="p-5 relative" style={{ background: 'var(--bg)' }}>
                <span className="gwl-note" style={{ color: 'var(--line-strong)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="mt-3 text-[14px] font-medium tracking-[-0.01em]">{a.k}</div>
                <p className="gwl-note mt-2 leading-relaxed">{a.v}</p>
                {i < ARCH.length - 1 && (
                  <ArrowRight
                    className="hidden lg:block absolute top-6 right-3 w-3 h-3"
                    style={{ color: 'var(--line-strong)' }}
                  />
                )}
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {Object.entries(STACK).map(([group, items], i) => (
            <Reveal key={group} delay={i * 110}>
              <div className="gwl-card p-5 h-full">
                <div className="gwl-note" style={{ color: i === 0 ? 'var(--aqua)' : 'var(--ink-3)' }}>{group}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {items.map(t => (
                    <span
                      key={t}
                      className="px-2.5 py-1.5 rounded-[6px] text-[12px]"
                      style={{
                        background: 'var(--panel)',
                        border: '1px solid var(--line)',
                        color: i === 0 ? 'var(--ink-2)' : 'var(--ink-3)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
