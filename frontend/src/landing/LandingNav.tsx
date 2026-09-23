import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react'
import { useLandingTheme } from './theme'

const LINKS = [
  { id: 'platform', label: 'Platform' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'risk', label: 'Risk Intelligence' },
  { id: 'farmer', label: 'Farmer Impact' },
  { id: 'technology', label: 'Technology' },
  { id: 'roadmap', label: 'Roadmap' },
]

export default function LandingNav() {
  const [stuck, setStuck] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('')
  const { theme, toggle } = useLandingTheme()

  /* glass-on-scroll */
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* scroll-spy — one observer for all anchored sections */
  useEffect(() => {
    const targets = LINKS
      .map(l => document.getElementById(l.id))
      .filter((el): el is HTMLElement => !!el)
    if (!targets.length) return

    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.2, 0.6] },
    )
    targets.forEach(t => io.observe(t))
    return () => io.disconnect()
  }, [])

  /* lock scroll behind the mobile drawer */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <header className={`gwl-nav ${stuck ? 'is-stuck' : ''}`}>
        <div className="gwl-wrap flex items-center justify-between gap-4 w-full">

          <a
            href="#top"
            onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center gap-2.5 shrink-0"
          >
            <Droplets className="w-[18px] h-[18px]" style={{ color: 'var(--aqua)' }} />
            <span className="text-[15px] font-semibold tracking-[-0.03em]">
              GROUND<span style={{ color: 'var(--ink-3)' }}>WATCH</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-0.5">
            {LINKS.map(l => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={go(l.id)}
                className={`gwl-navlink ${active === l.id ? 'is-active' : ''}`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggle}
              className="gwl-theme-toggle"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login" className="gwl-btn gwl-btn--primary gwl-btn--sm">
              Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setOpen(v => !v)}
              className="lg:hidden p-2 -mr-2"
              style={{ color: 'var(--ink-2)' }}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`gwl-drawer lg:hidden ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        <nav className="flex flex-col">
          {LINKS.map(l => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={go(l.id)}
              className="py-3.5 text-[17px] font-medium tracking-[-0.02em]"
              style={{ borderBottom: '1px solid var(--line-soft)', color: 'var(--ink)' }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Link to="/login" className="gwl-btn gwl-btn--primary w-full mt-7">
          Login to the platform <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={toggle}
          className="gwl-btn gwl-btn--ghost w-full mt-3"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </div>
    </>
  )
}
