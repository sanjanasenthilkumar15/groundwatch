import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, TrendingDown, TrendingUp, Minus, Radar, History } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

// ─── Gauge constants ────────────────────────────────────────────────────────
const CX = 120, CY = 120, R = 88
// Arc spans from 210° to 330° (150° sweep) going clockwise... through 0°, 300° total sweep
const DEG_START = 210
const DEG_END   = 330
const SWEEP     = 300
const ARC_LEN   = R * (SWEEP * Math.PI / 180)

function degToXY(deg: number, r = R) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function arcPath(startDeg: number, endDeg: number, r = R): string {
  const s = degToXY(startDeg, r)
  const e = degToXY(endDeg, r)
  const sweep = ((endDeg - startDeg + 360) % 360)
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
}

function gaugeColor(months: number, improving: boolean, stable: boolean): string {
  if (stable)     return 'var(--color-text-secondary)'
  if (improving)  return 'var(--color-risk-normal)'
  if (months > 18) return 'var(--color-risk-critical)'
  if (months > 12) return 'var(--color-risk-high)'
  if (months > 6)  return 'var(--color-risk-watch)'
  return 'var(--color-risk-normal)'
}

function GaugeDial({ months, maxMonths, improving, stable }: { months: number; maxMonths: number; improving: boolean; stable: boolean }) {
  const pct     = Math.min(months / maxMonths, 1)
  const fillDeg = DEG_START + pct * SWEEP
  const trackPath = arcPath(DEG_START, DEG_END)
  const color = gaugeColor(months, improving, stable)

  // Needle drawn at the base (0%) angle, then rotated via CSS transform so it eases smoothly
  const needleTip  = degToXY(DEG_START, R - 16)
  const needleBase = degToXY(DEG_START, 12)
  const rotation = fillDeg - DEG_START

  const ticks = [0, 6, 12, 18, 24].map(m => {
    const deg = DEG_START + (m / maxMonths) * SWEEP
    const outer = degToXY(deg, R + 6)
    const inner = degToXY(deg, R - 6)
    const label = degToXY(deg, R + 20)
    return { outer, inner, label, m }
  })

  return (
    <svg width="240" height="180" viewBox="0 0 240 180" style={{ display: 'block', margin: '0 auto' }}>
      {/* Track arc */}
      <path d={trackPath} fill="none" stroke="var(--color-border-ui)" strokeWidth={10} strokeLinecap="round" />

      {/* Fill arc — animated via stroke-dashoffset so it eases smoothly on load/change */}
      <path
        d={trackPath}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={ARC_LEN}
        strokeDashoffset={ARC_LEN * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease' }}
      />

      {ticks.map(t => (
        <g key={t.m}>
          <line x1={t.inner.x} y1={t.inner.y} x2={t.outer.x} y2={t.outer.y} stroke="var(--color-border-ui)" strokeWidth={1.5} />
          <text x={t.label.x} y={t.label.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--color-text-muted)" fontFamily="IBM Plex Mono, monospace">
            {t.m}
          </text>
        </g>
      ))}

      {/* Needle — rotated as a group so it eases smoothly instead of snapping */}
      <g style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${rotation}deg)`, transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <line x1={needleBase.x} y1={needleBase.y} x2={needleTip.x} y2={needleTip.y} stroke={color} strokeWidth={3} strokeLinecap="round" style={{ transition: 'stroke 0.4s ease' }} />
      </g>

      <circle cx={CX} cy={CY} r={7} fill={color} stroke="var(--color-surface-card)" strokeWidth={2} style={{ transition: 'fill 0.4s ease' }} />

      <text x={CX} y={CY + 36} textAnchor="middle" fontSize={32} fontWeight={700} fill={color} fontFamily="IBM Plex Mono, monospace" style={{ transition: 'fill 0.4s ease' }}>
        {months}
      </text>
      <text x={CX} y={CY + 54} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)" fontFamily="IBM Plex Sans, sans-serif">
        months
      </text>
    </svg>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function StressPage() {
  const { station } = useParams<{ station: string }>()
  const navigate    = useNavigate()
  const stationName = station ? decodeURIComponent(station) : ''
  const [data, setData]       = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).finally(() => setLoading(false))
  }, [stationName])

  const sc      = data?.stress_clock
  const outlook = sc?.outlook.status ?? 'stable'
  const improving = outlook === 'improving'
  const stable    = outlook === 'stable'

  // baseline depths used purely for the illustrative months-projection — same
  // constants the original calc used, just now clearly separated from "recent trend"
  const RECOVERY_BASELINE = 5
  const CRITICAL_BASELINE = 10

  const atSafeBaseline = (() => {
    if (!data) return false
    return improving && Math.abs(data.current_status.groundwater) <= RECOVERY_BASELINE
  })()

  const stressMonths = (() => {
    if (!sc || !data || stable) return 0
    const current = Math.abs(data.current_status.groundwater)
    const change  = sc.outlook.estimated_change
    if (improving) {
      if (change <= 0 || atSafeBaseline) return 0
      return Math.min(Math.round((current - RECOVERY_BASELINE) / change), 24)
    }
    if (change >= 0) return 0
    const decline = current - CRITICAL_BASELINE
    if (decline <= 0) return 0
    return Math.min(Math.round(decline / Math.abs(change)), 24)
  })()

  const outlookColor = stable ? 'var(--color-text-secondary)' : improving ? 'var(--color-risk-normal)' : 'var(--color-risk-high)'
  const OutlookIcon  = stable ? Minus : improving ? TrendingUp : TrendingDown

  const recent = sc?.recent_trend
  const recentColor = !recent || recent.status === 'stable' ? 'var(--color-text-secondary)' : recent.status === 'improving' ? 'var(--color-risk-normal)' : 'var(--color-risk-high)'
  const RecentIcon   = !recent || recent.status === 'stable' ? Minus : recent.status === 'improving' ? TrendingUp : TrendingDown

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-3xl mx-auto pb-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><Clock className="w-4 h-4" /> Stress Clock</p>
            <p className="text-text-muted text-xs mt-0.5">What actually happened vs. what the model expects next</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-64 gw-skeleton" />
        ) : data && sc ? (
          <div className="space-y-5">

            <div className="flex justify-center">
              <RiskBadge level={data.risk.risk_level} />
            </div>

            {/* Model Outlook — forward-looking */}
            <div className="gw-card">
              <div className="flex items-center gap-2 mb-1">
                <Radar className="w-4 h-4 text-text-secondary" />
                <div className="gw-section-label">Model Outlook</div>
                <span className="ml-auto text-[10px] font-ui text-text-muted uppercase tracking-wider">Forecast-based</span>
              </div>
              <p className="text-text-muted text-xs mb-2">Current depth compared with next month's XGBoost prediction — not what already happened.</p>

              <div className="flex flex-col items-center py-4">
                {atSafeBaseline ? (
                  <div className="text-center py-6">
                    <div className="text-2xl font-mono font-bold text-risk-normal">Already at safe baseline</div>
                    <p className="text-text-secondary text-sm mt-2">No further recovery needed to reach the reference depth — continue routine monitoring.</p>
                  </div>
                ) : stable ? (
                  <div className="text-center py-6">
                    <Minus className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                    <div className="text-lg font-mono font-bold text-text-secondary">Stable outlook</div>
                    <p className="text-text-secondary text-sm mt-1">No significant change forecasted next month.</p>
                  </div>
                ) : (
                  <>
                    <GaugeDial months={stressMonths} maxMonths={24} improving={improving} stable={stable} />
                    <p className="text-text-secondary text-sm mt-2">
                      {stressMonths === 0 ? (
                        <>projected to reach the reference depth <span style={{ color: outlookColor, fontWeight: 700 }}>within the next month</span> at this rate</>
                      ) : (
                        <>
                          estimated months of continuous{' '}
                          <span style={{ color: outlookColor, fontWeight: 700 }}>{improving ? 'recovery' : 'stress'}</span>
                          {' '}at the model's projected rate
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border-ui">
                <OutlookIcon className="w-4 h-4" style={{ color: outlookColor }} />
                <span className="text-sm font-mono font-semibold capitalize" style={{ color: outlookColor }}>{outlook}</span>
                <span className="text-text-muted text-xs ml-auto font-mono">
                  {sc.outlook.estimated_change >= 0 ? '+' : ''}{sc.outlook.estimated_change.toFixed(2)} m (raw model delta)
                </span>
              </div>
              <p className="text-text-secondary text-xs mt-2 leading-relaxed">{sc.outlook.message}</p>
            </div>

            {/* Recent Trend — backward-looking, real data */}
            <div className="gw-card border-l-2" style={{ borderLeftColor: recentColor }}>
              <div className="flex items-center gap-2 mb-1">
                <History className="w-4 h-4 text-text-secondary" />
                <div className="gw-section-label">Recent Trend</div>
                <span className="ml-auto text-[10px] font-ui text-text-muted uppercase tracking-wider">Observed data</span>
              </div>
              <p className="text-text-muted text-xs mb-3">What actually happened last month — the same signal driving the Risk Score.</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${recentColor} 15%, transparent)` }}>
                  <RecentIcon className="w-5 h-5" style={{ color: recentColor }} />
                </div>
                <div>
                  <div className="text-lg font-mono font-bold capitalize" style={{ color: recentColor }}>{recent?.status ?? 'stable'}</div>
                  <div className="text-text-secondary text-xs">
                    {recent && recent.status !== 'stable' ? `${recent.magnitude_m.toFixed(2)} m ${recent.status === 'declining' ? 'deeper' : 'shallower'} vs. last month` : 'no significant change vs. last month'}
                  </div>
                </div>
              </div>
              {recent && <p className="text-text-secondary text-xs mt-3 pt-3 border-t border-border-ui leading-relaxed">{recent.message}</p>}
            </div>

            <div className="gw-card">
              <div className="gw-section-label mb-2">Current Depth</div>
              <div className="text-lg font-mono font-bold text-text-primary mt-1">{fmtGW(data.current_status.groundwater)}</div>
              <div className="text-text-muted text-xs mt-1">below ground level</div>
            </div>

            {sc.note && (
              <p className="text-center text-xs text-text-muted">{sc.note}</p>
            )}

          </div>
        ) : (
          <div className="gw-card text-center py-12 text-text-secondary text-sm">
            No stress data available for this station.
          </div>
        )}
      </div>
    </div>
  )
}
