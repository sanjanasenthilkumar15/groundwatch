import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import HeroIllustration from './HeroIllustration'

const READOUTS = [
  { k: 'Signals', v: 'Groundwater · Rainfall · Satellite' },
  { k: 'Horizon', v: 'Monthly forecast' },
  { k: 'Output', v: 'Risk · WHY · Advisory' },
]

export default function Hero() {
  /* The hero is above the fold, so there is nothing for IntersectionObserver
     to wait for — stagger it in on the frame after mount instead. */
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const rv = (delay: number, extra = '') => ({
    className: `gwl-rv ${shown ? 'is-in' : ''} ${extra}`,
    style: { ['--rv-d' as string]: `${delay}ms` },
  })

  const toPlatform = (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="top" className="gwl-hero">
      <div className="gwl-hero-content gwl-wrap w-full">
        <div className="gwl-hero-grid">

          <div className="max-w-[34rem]">

            <div {...rv(80, 'gwl-badge')}>
              <MapPin className="w-3 h-3" style={{ color: 'var(--aqua)' }} />
              Salem District Pilot
              <span style={{ color: 'var(--ink-3)' }}>· Tamil Nadu</span>
            </div>

            <h1 {...rv(170, 'gwl-h1 mt-7')}>
              Predict groundwater stress<br />
              <span className="gwl-ink-water">before it becomes a crisis.</span>
            </h1>

            <p {...rv(290, 'gwl-lead mt-7')}>
              GroundWatch transforms groundwater, rainfall and satellite signals into
              predictive, explainable intelligence for smarter water and agricultural decisions.
            </p>

            <div {...rv(400, 'mt-9 flex flex-col sm:flex-row gap-3 sm:items-center')}>
              <Link to="/login" className="gwl-btn gwl-btn--primary">
                Explore GroundWatch <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#platform" onClick={toPlatform} className="gwl-btn gwl-btn--ghost">
                View Platform
              </a>
            </div>

            {/* quiet technical readout — sets the tone without a stat claim */}
            <dl
              {...rv(520, 'mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px max-w-2xl')}
              style={{ ...rv(520).style, background: 'var(--line-soft)' }}
            >
              {READOUTS.map(r => (
                <div key={r.k} className="py-3.5 sm:py-4 pr-4 sm:px-4 first:sm:pl-0" style={{ background: 'var(--bg)' }}>
                  <dt className="gwl-note">{r.k}</dt>
                  <dd className="mt-1.5 text-[12.5px] leading-snug" style={{ color: 'var(--ink-2)' }}>{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* DOM order = visual order on mobile (text, then illustration below it);
              the two-column grid at lg+ places this in the right-hand column. */}
          <div {...rv(240)}>
            <HeroIllustration />
          </div>
        </div>
      </div>

      <div className="gwl-scrollcue" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}
