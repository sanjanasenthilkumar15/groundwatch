import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

// ─── Gauge constants ────────────────────────────────────────────────────────
const CX = 120, CY = 120, R = 88
// Arc spans from 210° to 330° (150° sweep) going clockwise
const DEG_START = 210
const DEG_END   = 330   // wraps around through 0°
const SWEEP     = 300   // total degrees of arc

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

function riskColor(months: number, improving: boolean): string {
  if (improving)  return '#2F9E44'
  if (months > 18) return '#D62828'
  if (months > 12) return '#E2691A'
  if (months > 6)  return '#F0A80C'
  return '#2F9E44'
}

function GaugeDial({ months, maxMonths, improving }: { months: number; maxMonths: number; improving: boolean }) {
  const pct    = Math.min(months / maxMonths, 1)
  const fillDeg = DEG_START + pct * SWEEP
  const trackPath = arcPath(DEG_START, DEG_END)
  const fillPath  = pct > 0 ? arcPath(DEG_START, fillDeg) : null
  const color = riskColor(months, improving)

  // Needle points from center toward current value
  const needleTip = degToXY(fillDeg, R - 16)
  const needleBase = degToXY(fillDeg, 12)

  // Tick marks at 0, 6, 12, 18, 24 months
  const ticks = [0, 6, 12, 18, 24].map(m => {
    const deg = DEG_START + (m / maxMonths) * SWEEP
    const outer = degToXY(deg, R + 6)
    const inner = degToXY(deg, R - 6)
    const label = degToXY(deg, R + 20)
    return { outer, inner, label, m, deg }
  })

  return (
    <svg
      width="240"
      height="180"
      viewBox="0 0 240 180"
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* Track arc */}
      <path
        d={trackPath}
        fill="none"
        stroke="var(--color-border-ui)"
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Fill arc */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
        />
      )}

      {/* Tick marks */}
      {ticks.map(t => (
        <g key={t.m}>
          <line
            x1={t.inner.x} y1={t.inner.y}
            x2={t.outer.x} y2={t.outer.y}
            stroke="var(--color-border-ui)"
            strokeWidth={1.5}
          />
          <text
            x={t.label.x}
            y={t.label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="var(--color-text-muted)"
            fontFamily="IBM Plex Mono, monospace"
          >
            {t.m}
          </text>
        </g>
      ))}

      {/* Needle */}
      <line
        x1={needleBase.x}
        y1={needleBase.y}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Center hub */}
      <circle
        cx={CX}
        cy={CY}
        r={7}
        fill={color}
        stroke="var(--color-surface-card)"
        strokeWidth={2}
      />

      {/* Value text */}
      <text
        x={CX}
        y={CY + 36}
        textAnchor="middle"
        fontSize={32}
        fontWeight={700}
        fill={color}
        fontFamily="IBM Plex Mono, monospace"
      >
        {months}
      </text>
      <text
        x={CX}
        y={CY + 54}
        textAnchor="middle"
        fontSize={10}
        fill="var(--color-text-secondary)"
        fontFamily="IBM Plex Sans, sans-serif"
      >
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

  const sc    = data?.stress_clock
  const trend = sc?.status ?? 'stable'
  const improving = trend === 'improving'

  const stressMonths = (() => {
    if (!sc || !data) return 0
    if (improving) {
      // If recovering, show recovery duration estimate
      const current = Math.abs(data.current_status.groundwater)
      if (sc.estimated_change <= 0) return 0
      const baseline = 5
      return Math.min(Math.round((current - baseline) / sc.estimated_change), 24)
    }
    // Declining: months until critical
    if (sc.estimated_change >= 0) return 0
    const current   = Math.abs(data.current_status.groundwater)
    const baseline  = 10
    const decline   = current - baseline
    if (decline <= 0) return 0
    return Math.min(Math.round(decline / Math.abs(sc.estimated_change)), 24)
  })()

  const statusColor =
    trend === 'declining' ? 'var(--color-risk-high)' :
    trend === 'improving' ? 'var(--color-success)'   : 'var(--color-text-secondary)'

  const TrendIcon = trend === 'declining' ? TrendingDown : trend === 'improving' ? TrendingUp : Minus

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-3xl mx-auto pb-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Stress Clock
            </p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-64 gw-skeleton" />
        ) : data && sc ? (
          <div className="space-y-5">

            {/* Gauge card */}
            <div className="gw-card flex flex-col items-center py-8 px-4">
              <GaugeDial months={stressMonths} maxMonths={24} improving={improving} />

              <div className="mt-2 text-center space-y-1">
                <p className="text-text-secondary text-sm">
                  estimated months of continuous{' '}
                  <span style={{ color: statusColor, fontWeight: 700 }}>
                    {improving ? 'recovery' : 'stress'}
                  </span>
                </p>
                <div className="flex justify-center mt-3">
                  <RiskBadge level={data.risk.risk_level} />
                </div>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="gw-card">
                <div className="gw-section-label mb-2">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <TrendIcon className="w-5 h-5" style={{ color: statusColor }} />
                  <span className="text-lg font-mono font-bold capitalize" style={{ color: statusColor }}>
                    {trend}
                  </span>
                </div>
              </div>

              <div className="gw-card">
                <div className="gw-section-label mb-2">Rate of Change</div>
                <div className="text-lg font-mono font-bold text-text-primary mt-1">
                  {sc.estimated_change >= 0 ? '+' : ''}{sc.estimated_change.toFixed(3)}{' '}
                  <span className="text-sm font-normal text-text-secondary">m/mo</span>
                </div>
              </div>

              <div className="gw-card">
                <div className="gw-section-label mb-2">Current Depth</div>
                <div className="text-lg font-mono font-bold text-text-primary mt-1">{fmtGW(data.current_status.groundwater)}</div>
                <div className="text-text-muted text-xs mt-1">below ground level</div>
              </div>

              <div className="gw-card">
                <div className="gw-section-label mb-2">Threshold Status</div>
                <div className="text-sm font-semibold text-text-primary mt-1 capitalize">{sc.threshold_status}</div>
              </div>
            </div>

            {/* Message */}
            {sc.message && (
              <div className="gw-card border-l-4 border-secondary">
                <p className="text-text-primary text-sm leading-relaxed">{sc.message}</p>
                {sc.note && (
                  <p className="text-text-secondary text-xs mt-3 leading-relaxed pt-3 border-t border-border-ui">
                    {sc.note}
                  </p>
                )}
              </div>
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
