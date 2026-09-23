import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, LogOut, Sprout, HardHat, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse, Subscriber } from '../lib/api'
import { fmtGW } from '../lib/utils'

export default function SubscriberAdvisoryPage() {
  const navigate = useNavigate()
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [intel, setIntel]     = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let saved: Subscriber | null = null
    try {
      const raw = localStorage.getItem('gw_subscriber')
      if (raw) saved = JSON.parse(raw)
    } catch {}

    if (!saved) {
      navigate('/register', { replace: true })
      return
    }
    setSubscriber(saved)

    api.intelligence(saved.area)
      .then(setIntel)
      .catch(e => setError(e.message || 'Could not load your area\'s status.'))
      .finally(() => setLoading(false))
  }, [navigate])

  const logout = () => {
    try { localStorage.removeItem('gw_subscriber') } catch {}
    navigate('/register')
  }

  if (!subscriber) return null

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase()
  const gwCurrent  = intel ? Math.abs(intel.current_status.groundwater).toFixed(1) : '—'
  const gwForecast = intel?.forecast?.forecasts?.find(f => f.horizon_months === 1)
    ? Math.abs(intel.forecast.forecasts.find(f => f.horizon_months === 1)!.predicted_groundwater).toFixed(1)
    : '—'

  const trend = intel?.stress_clock?.recent_trend?.status
  const TrendIcon = trend === 'declining' ? TrendingDown : trend === 'improving' ? TrendingUp : Minus
  const trendColor = trend === 'declining' ? 'var(--color-risk-high)' : trend === 'improving' ? 'var(--color-risk-normal)' : 'var(--color-text-secondary)'
  const CategoryIcon = subscriber.category === 'farmer' ? Sprout : HardHat

  return (
    <div className="min-h-screen bg-surface-page" style={{ paddingBottom: '3rem' }}>
      {/* Simple header — no officer Nav, this isn't an officer session */}
      <div className="border-b border-border-ui bg-surface-card">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="text-primary w-5 h-5" />
            <span className="text-base font-bold font-ui text-text-primary tracking-tight">Ground<span className="text-primary">Watch</span></span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-xs font-ui font-semibold">
            <LogOut className="w-3.5 h-3.5" /> Change number
          </button>
        </div>
      </div>

      <div className="pt-6 px-4 max-w-md mx-auto">
        {/* Subscriber header */}
        <div className="py-4 flex items-center gap-3 border-b border-border-ui mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary)' }}>
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-ui text-text-primary leading-tight">{subscriber.name}</h1>
            <p className="text-text-secondary text-sm capitalize">{subscriber.category} · {subscriber.area}</p>
          </div>
        </div>

        {loading && (
          <div className="p-10 text-center text-text-secondary font-ui">Loading…</div>
        )}

        {error && (
          <div className="rounded-lg border-2 border-risk-critical p-6 bg-surface-card text-center">
            <p className="text-risk-critical font-semibold text-sm">{error}</p>
          </div>
        )}

        {intel && !loading && (
          <div className="space-y-5">
            {/* Risk badge */}
            <div className="flex justify-center">
              <RiskBadge level={intel.risk.risk_level} />
            </div>

            {/* Advisory block */}
            {intel.risk.risk_level === 'LOW' ? (
              <div className="rounded-lg border-2 border-risk-normal p-6 bg-surface-card text-center">
                <p className="text-2xl font-ui font-semibold text-text-primary mb-3">
                  Your area's groundwater is stable. ✓
                </p>
                <p className="font-tamil text-xl text-text-primary">
                  உங்கள் பகுதியின் நிலத்தடி நீர் நிலையானது.
                </p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-border-ui shadow-sm">
                <div className="px-4 py-3" style={{ background: 'var(--color-secondary)' }}>
                  <span className="text-white text-xs font-bold font-ui uppercase tracking-widest">
                    Advisory — {currentMonth}
                  </span>
                </div>
                <div className="px-4 py-4 bg-surface-card">
                  <p className="text-text-primary text-sm font-ui leading-relaxed">
                    {intel.advisory.english}
                  </p>
                </div>
                <div className="mx-4 border-t border-border-ui" />
                <div className="px-4 py-4 bg-surface-card">
                  <p className="font-tamil text-text-primary" style={{ fontSize: '15px', lineHeight: 1.8 }}>
                    {intel.advisory.tamil}
                  </p>
                </div>
              </div>
            )}

            {/* Rapid decline alert */}
            {intel.advisory.rapid_decline_alert && (
              <div className="rounded-lg p-4 border-2 border-risk-critical bg-surface-card">
                <p className="text-risk-critical text-sm font-ui font-bold flex items-start gap-2">
                  <span className="text-lg shrink-0">⚠</span>
                  <span>{intel.advisory.rapid_decline_alert}</span>
                </p>
              </div>
            )}

            {/* GW Status Card */}
            <div className="rounded-lg border border-border-ui bg-surface-card p-5">
              <h3 className="text-xs font-ui font-bold text-text-secondary uppercase tracking-wider mb-4">
                நிலத்தடி நீர் நிலை / Groundwater Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-l-4 pl-3 border-primary">
                  <div className="text-xs text-text-secondary font-ui uppercase tracking-wider mb-1">
                    Current / தற்போதைய
                  </div>
                  <div className="font-mono font-bold text-2xl text-primary">
                    {gwCurrent} m
                  </div>
                </div>
                <div className="border-l-4 pl-3 border-accent">
                  <div className="text-xs text-text-secondary font-ui uppercase tracking-wider mb-1">
                    1-Month Forecast / முன்னறிவிப்பு
                  </div>
                  <div className="font-mono font-bold text-2xl text-accent">
                    {gwForecast} m
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-ui flex items-center gap-2">
                <TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
                <span className="text-sm font-ui font-medium capitalize" style={{ color: trendColor }}>
                  {trend ?? 'Stable'} last month
                </span>
              </div>
            </div>

            <p className="text-center text-text-muted text-xs leading-relaxed">
              You're registered for SMS &amp; email alerts when groundwater in {subscriber.area} turns critical.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
