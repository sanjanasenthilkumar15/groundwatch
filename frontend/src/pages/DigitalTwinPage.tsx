import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, Play, RotateCcw } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse } from '../lib/api'

const MAX_DEPTH = 60 // meters — Salem basin visualization estimate, not an engineering survey
const ANIMATION_MS = 2400

// easeInOutQuad
function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** Drives progress 0→1 over ANIMATION_MS on play(); value at any point is a
 *  linear interpolation between `from` and `to` — a visualization aid, not a
 *  separate model prediction. */
function useTimelapse(from: number, to: number) {
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)

  const play = () => {
    if (playing) return
    setPlaying(true)
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / ANIMATION_MS, 1)
      setProgress(ease(t))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setPlaying(false)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  return { value: from + (to - from) * progress, progress, playing, play }
}

export default function DigitalTwinPage() {
  const { station } = useParams<{ station: string }>()
  const navigate    = useNavigate()
  const stationName = station ? decodeURIComponent(station) : ''
  const [data, setData]       = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).finally(() => setLoading(false))
  }, [stationName])

  const current  = data ? Math.abs(data.current_status.groundwater) : 0
  const forecast1m = data?.forecast?.forecasts?.find(f => f.horizon_months === 1)
  const rawForecast = forecast1m ? Math.abs(forecast1m.predicted_groundwater) : current
  // Cap unrealistic single-month swings to +-4 m (typical max aquifer recharge/draw rate)
  const MAX_MONTHLY_CHANGE = 4
  const clampedChange = Math.max(-MAX_MONTHLY_CHANGE, Math.min(MAX_MONTHLY_CHANGE, rawForecast - current))
  const forecast = current + clampedChange
  const isUnrealistic = Math.abs(rawForecast - current) > MAX_MONTHLY_CHANGE

  const { value: liveDepth, progress, playing, play } = useTimelapse(current, forecast)

  const riskLevel = data?.risk.risk_level ?? 'LOW'
  const fillCol = riskLevel === 'CRITICAL' ? 'var(--color-risk-critical)' : riskLevel === 'HIGH' ? 'var(--color-risk-high)' : riskLevel === 'MODERATE' ? 'var(--color-risk-watch)' : 'var(--color-risk-normal)'
  const fillBg  = `color-mix(in srgb, ${fillCol} 20%, var(--color-surface-card))`
  const dryBg   = 'color-mix(in srgb, var(--color-text-primary) 6%, var(--color-surface-page))'

  // Auto-fit the vertical scale to this station's own range so a shallow water
  // table (a few meters down) is just as visually legible as a deep one — a
  // fixed district-wide depth scale would crush small stations into a sliver.
  const visualMax = Math.max(current, forecast, 3) * 1.5
  const pct = (m: number) => Math.min((m / visualMax) * 100, 100)
  const currentPct  = pct(current)
  const forecastPct = pct(forecast)
  const livePct     = pct(liveDepth)

  const playLabel = playing ? 'Playing…' : progress >= 1 ? 'Replay Forecast' : 'Play Forecast'
  const PlayIcon  = progress >= 1 && !playing ? RotateCcw : Play

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-3xl mx-auto pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><Layers className="w-4 h-4" /> Digital Twin — Animated Aquifer Forecast</p>
            <p className="text-text-muted text-xs mt-0.5">Observed → Predicted groundwater state</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-96 gw-skeleton" />
        ) : data ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <RiskBadge level={riskLevel} />
              <span className="text-text-secondary text-sm">1-month forecast time-lapse</span>
            </div>

            {isUnrealistic && (
              <p className="gw-card border-l-4 border-l-risk-watch text-text-secondary text-xs leading-relaxed">
                ⚠️ The model's raw 1-month prediction ({rawForecast.toFixed(1)}m) differs from today by more than 4m, which is physically implausible for a single month. The animation is capped at ±4m to reflect realistic aquifer behaviour. This indicates high model uncertainty for this station — treat the direction (rising or falling), not the exact value, as the signal.
              </p>
            )}
            {(riskLevel === 'HIGH' || riskLevel === 'CRITICAL') && forecast < current && (
              <p className="text-text-muted text-xs -mt-2 leading-relaxed">
                The water table is animated rising here because the model forecasts a rebound next month — that's a separate signal from the {riskLevel} badge, which reflects a real recent decline (or depth) driving the current risk score. Both can be true at once.
              </p>
            )}

            {/* Aquifer cross-section */}
            <div className="gw-card">
              <div className="flex items-center justify-between mb-4">
                <div className="gw-section-label">Groundwater Forecast — Time-lapse</div>
                <div className="text-right">
                  <div className="font-mono font-bold text-2xl text-text-primary leading-none">{liveDepth.toFixed(1)}m</div>
                  <div className="text-[10px] text-text-muted mt-0.5">below surface{playing || progress > 0 ? ' · interpolated' : ''}</div>
                </div>
              </div>

              <div className="relative mx-auto rounded-md border border-border-ui overflow-hidden" style={{ height: '280px' }}>
                {/* Ground surface */}
                <div className="absolute top-0 left-0 right-0 h-2 z-20" style={{ background: 'var(--color-secondary)' }} />
                <div className="absolute top-2 left-0 right-0 text-center text-[9px] font-bold tracking-widest text-text-secondary uppercase z-20 py-0.5"
                     style={{ background: 'var(--color-surface-card)' }}>
                  Ground Surface  🌱 · 🌱 · 🌱
                </div>

                {/* Soil layer (decorative band) */}
                <div className="absolute left-0 right-0 flex items-center justify-center gap-6 z-10"
                     style={{ top: '2.5rem', height: '12%', background: 'color-mix(in srgb, var(--color-secondary) 22%, var(--color-surface-page))' }}>
                  <span className="text-[8px] font-bold tracking-widest text-text-secondary uppercase absolute top-1 left-1/2 -translate-x-1/2">Soil Layer</span>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="gw-infiltrate text-text-secondary text-xs" style={{ animationDelay: `${i * 0.3}s` }}>↓</span>
                  ))}
                </div>

                {/* Aquifer zone — unsaturated (dry) above the water table */}
                <div className="absolute left-0 right-0 bottom-0" style={{ top: '4.5rem' }}>
                  <div className="absolute inset-0" style={{ background: dryBg }} />

                  {/* Saturated aquifer (below live water table) */}
                  <div className="absolute left-0 right-0 bottom-0 transition-none flex items-start justify-center pt-3"
                       style={{ top: `${livePct}%`, background: fillBg }}>
                    <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: fillCol }}>Aquifer</span>
                  </div>

                  {/* Live animated water table line */}
                  <div className="absolute left-0 right-0 h-1.5 gw-water-wave z-10" style={{ top: `${livePct}%`, color: fillCol }} />
                  <div className="absolute right-2 text-[9px] font-mono font-bold z-10" style={{ top: `${livePct}%`, color: fillCol, transform: 'translateY(-100%)' }}>
                    {liveDepth.toFixed(1)}m
                  </div>

                  {/* Static reference guides: current + forecast */}
                  <div className="absolute left-0 right-0 border-t border-dashed opacity-50" style={{ top: `${currentPct}%`, borderColor: 'var(--color-text-muted)' }} />
                  <div className="absolute left-2 text-[8px] font-mono text-text-muted opacity-70" style={{ top: `${currentPct}%`, transform: 'translateY(2px)' }}>NOW {current.toFixed(1)}m</div>

                  <div className="absolute left-0 right-0 border-t border-dashed opacity-50" style={{ top: `${forecastPct}%`, borderColor: 'var(--color-text-muted)' }} />
                  <div className="absolute left-2 text-[8px] font-mono text-text-muted opacity-70" style={{ top: `${forecastPct}%`, transform: 'translateY(2px)' }}>+1M {forecast.toFixed(1)}m</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-5">
                <div className="relative h-1.5 rounded-full bg-surface-page border border-border-ui">
                  <div className="absolute top-0 left-0 h-full rounded-full transition-none" style={{ width: `${progress * 100}%`, background: fillCol }} />
                  <div className="absolute top-1/2 w-3.5 h-3.5 rounded-full border-2 transition-none"
                       style={{ left: `calc(${progress * 100}% - 7px)`, top: '50%', transform: 'translateY(-50%)', background: 'var(--color-surface-card)', borderColor: fillCol }} />
                </div>
                <div className="flex justify-between mt-2 text-xs font-mono text-text-secondary">
                  <div><div className="font-bold text-text-primary">{current.toFixed(1)} m</div>NOW</div>
                  <div className="text-right"><div className="font-bold text-text-primary">{forecast.toFixed(1)} m</div>+1 MONTH</div>
                </div>
              </div>

              <button
                onClick={play}
                disabled={playing}
                className="gw-btn w-full justify-center mt-4 flex items-center gap-2 disabled:opacity-60"
              >
                <PlayIcon className="w-4 h-4" />
                {playLabel}
              </button>

              {/* Legend */}
              <div className="mt-5 pt-4 border-t border-border-ui flex flex-wrap gap-4 justify-center text-xs text-text-secondary">
                <div className="flex items-center gap-2"><div className="w-4 h-1.5 rounded-sm gw-water-wave" style={{ color: fillCol }}></div>Water table (live)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 border-t border-dashed" style={{ borderColor: 'var(--color-text-muted)' }}></div>Observed / forecast reference</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: 'var(--color-secondary)', opacity: 0.5 }}></div>Soil layer</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="gw-card">
                <div className="gw-section-label mb-1">Aquifer depth modelled</div>
                <div className="text-lg font-mono font-bold text-text-primary mt-1">{MAX_DEPTH} m</div>
                <div className="text-text-primary0 text-xs mt-1">Salem basin estimate</div>
              </div>
              <div className="gw-card">
                <div className="gw-section-label mb-1">Depth change</div>
                <div className={"text-lg font-mono font-bold mt-1 " + (forecast > current ? 'text-risk-high' : 'text-success')}>
                  {forecast > current ? '+' : ''}{(forecast - current).toFixed(2)} m
                </div>
                <div className="text-text-primary0 text-xs mt-1">over next month</div>
              </div>
            </div>

            <p className="text-center text-xs text-text-muted">
              This is an ML-driven groundwater state visualization — the water table position is interpolated between the observed depth and the XGBoost 1-month forecast. The vertical scale auto-fits to this station's own range so small movements stay visible. It is a scaled representation, not a hydraulic flow simulation or engineering survey.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}


