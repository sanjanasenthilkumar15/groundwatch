import {
  useEffect, useRef, useState, type CSSProperties, type ReactNode,
} from 'react'

/* ---------------------------------------------------------------------------
   Motion preference
   --------------------------------------------------------------------------- */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/* ---------------------------------------------------------------------------
   Visibility. `once` drives reveals; continuous mode drives animation pausing
   so nothing expensive runs off-screen.
   --------------------------------------------------------------------------- */
interface InViewOpts { once?: boolean; threshold?: number; rootMargin?: string }

export function useInView<T extends Element>(opts: InViewOpts = {}) {
  const { once = true, threshold = 0.15, rootMargin = '0px 0px -8% 0px' } = opts
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        if (once) io.disconnect()
      } else if (!once) {
        setInView(false)
      }
    }, { threshold, rootMargin })

    io.observe(el)
    return () => io.disconnect()
  }, [once, threshold, rootMargin])

  return [ref, inView] as const
}

/* ---------------------------------------------------------------------------
   Reveal — CSS transition driven, one observer per block, no layout thrash.
   --------------------------------------------------------------------------- */
export function Reveal({
  children, delay = 0, className = '', style,
}: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`gwl-rv ${inView ? 'is-in' : ''} ${className}`}
      style={{ ...style, ['--rv-d' as string]: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Animated section — adds `.is-idle` when off-screen so every CSS/SVG
   animation inside pauses. Keeps a long page cheap to run.
   --------------------------------------------------------------------------- */
export function LiveRegion({
  children, className = '', id,
}: { children: ReactNode; className?: string; id?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: false, threshold: 0, rootMargin: '150px' })
  return (
    <div id={id} ref={ref} className={`${inView ? '' : 'is-idle'} ${className}`}>
      {children}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Counter
   --------------------------------------------------------------------------- */
export function Counter({
  to, decimals = 0, duration = 1100, prefix = '', suffix = '',
}: { to: number; decimals?: number; duration?: number; prefix?: string; suffix?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 })
  const reduced = usePrefersReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) { setVal(to); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      // easeOutExpo
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setVal(to * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration, reduced])

  return (
    <span ref={ref} className="gwl-num">
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  )
}

/* ---------------------------------------------------------------------------
   Small shared bits
   --------------------------------------------------------------------------- */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="gwl-eyebrow">{children}</div>
}

export function SectionHead({
  eyebrow, title, lead, align = 'left', children,
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  align?: 'left' | 'center'
  children?: ReactNode
}) {
  const center = align === 'center'
  return (
    <Reveal className={center ? 'flex flex-col items-center text-center' : ''}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="gwl-h2 mt-5">{title}</h2>
      {lead && <p className={`gwl-lead mt-5 ${center ? 'mx-auto' : ''}`}>{lead}</p>}
      {children}
    </Reveal>
  )
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export const riskClass: Record<RiskLevel, string> = {
  LOW: 'gwl-risk-low',
  MODERATE: 'gwl-risk-moderate',
  HIGH: 'gwl-risk-high',
  CRITICAL: 'gwl-risk-critical',
}

export function RiskPill({ level, className = '' }: { level: RiskLevel; className?: string }) {
  return (
    <span className={`gwl-pill ${riskClass[level]} ${className}`}>
      <i className="gwl-dot" />{level}
    </span>
  )
}

/* Stat readout used across the operational panels */
export function Stat({
  label, value, unit, tone, sub,
}: { label: string; value: ReactNode; unit?: string; tone?: RiskLevel; sub?: ReactNode }) {
  return (
    <div className={`gwl-inset p-3.5 ${tone ? riskClass[tone] : ''}`}>
      <div className="gwl-note">{label}</div>
      <div
        className="gwl-num mt-2 text-[1.45rem] leading-none font-semibold"
        style={{ color: tone ? 'var(--risk)' : 'var(--ink)' }}
      >
        {value}
        {unit && <span className="ml-1 text-[0.62em] font-normal" style={{ color: 'var(--ink-3)' }}>{unit}</span>}
      </div>
      {sub && <div className="gwl-note mt-1.5">{sub}</div>}
    </div>
  )
}
