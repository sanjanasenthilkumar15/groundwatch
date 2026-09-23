import { Link } from 'react-router-dom'
import { Droplets, ArrowRight, MapPin } from 'lucide-react'
import { Reveal } from './ui'

/* ===========================================================================
   SECTION 17 — Final CTA + footer
   =========================================================================== */

export default function SectionCTA() {
  return (
    <>
      <section className="gwl-cta-dark relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* a single deep-water wash — no blobs, no noise */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(90% 120% at 50% 118%, rgba(21,96,124,0.42) 0%, rgba(21,96,124,0.10) 42%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--line-strong), transparent)' }}
        />

        <div className="gwl-wrap relative py-28 md:py-40 text-center flex flex-col items-center">
          <Reveal>
            <div className="gwl-badge">
              <MapPin className="w-3 h-3" style={{ color: 'var(--aqua)' }} />
              Salem District Pilot
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="gwl-h1 mt-8 max-w-[18ch]">
              See groundwater <span className="gwl-ink-water">before the crisis.</span>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="gwl-lead mt-7 mx-auto text-balance">
              GroundWatch turns environmental data into predictive, explainable and actionable
              groundwater intelligence.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="gwl-btn gwl-btn--primary">
                Explore the Platform <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="gwl-btn gwl-btn--ghost">Login</Link>
            </div>
          </Reveal>

          <Reveal delay={380}>
            <Link
              to="/register"
              className="inline-block mt-7 text-[13px] transition-colors"
              style={{ color: 'var(--ink-3)' }}
            >
              Farmer or construction worker? Register for SMS &amp; email alerts →
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  )
}

function Footer() {
  const nav = [
    { id: 'platform', label: 'Platform' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'risk', label: 'Risk Intelligence' },
    { id: 'farmer', label: 'Farmer Impact' },
    { id: 'technology', label: 'Technology' },
    { id: 'roadmap', label: 'Roadmap' },
  ]

  return (
    <footer className="gwl-cta-dark" style={{ background: 'var(--bg)', borderTop: '1px solid var(--line)' }}>
      <div className="gwl-wrap py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-9">
          <div>
            <div className="flex items-center gap-2.5">
              <Droplets className="w-[18px] h-[18px]" style={{ color: 'var(--aqua)' }} />
              <span className="text-[15px] font-semibold tracking-[-0.03em]">
                GROUND<span style={{ color: 'var(--ink-3)' }}>WATCH</span>
              </span>
            </div>
            <p className="gwl-note mt-4 max-w-[38ch] leading-relaxed">
              Predictive, explainable groundwater intelligence for water and agricultural
              decision-making. Currently piloted in Salem District, Tamil Nadu.
            </p>
            <p className="font-tamil mt-4 text-[13px]" style={{ color: 'var(--ink-3)' }}>
              சேலம் மாவட்ட நிலத்தடி நீர் கண்காணிப்பு
            </p>
          </div>

          <nav className="flex flex-col gap-2.5">
            {nav.map(n => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={e => {
                  e.preventDefault()
                  document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-[13px] transition-colors"
                style={{ color: 'var(--ink-3)' }}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5">
            <Link to="/login" className="text-[13px]" style={{ color: 'var(--ink-2)' }}>Officer login</Link>
            <Link to="/register" className="text-[13px]" style={{ color: 'var(--ink-3)' }}>Register for alerts</Link>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row gap-3 justify-between"
          style={{ borderTop: '1px solid var(--line-soft)' }}>
          <p className="gwl-note">GroundWatch · Salem District Pilot</p>
          <p className="gwl-note max-w-[62ch] sm:text-right">
            Forecasts and risk bands are decision-support outputs, not official groundwater
            classifications. Satellite-derived variables provide environmental context and do not
            measure groundwater directly.
          </p>
        </div>
      </div>
    </footer>
  )
}
