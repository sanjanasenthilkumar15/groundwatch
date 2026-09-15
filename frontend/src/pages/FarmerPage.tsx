import { useEffect, useState } from 'react'
import { MessageSquare, Droplets, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, RiskMapEntry, IntelligenceResponse } from '../lib/api'

export default function FarmerPage() {
  const [stations, setStations] = useState<RiskMapEntry[]>([])
  const [selected, setSelected] = useState<string>('')
  const [intel,    setIntel]    = useState<IntelligenceResponse | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [smsSent,  setSmsSent]  = useState(false)

  useEffect(() => {
    api.riskMap().then(d => {
      setStations(d.stations)
      if (d.stations.length > 0) setSelected(d.stations[0].station)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setSmsSent(false)
    api.intelligence(selected).then(setIntel).finally(() => setLoading(false))
  }, [selected])

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase()
  const gwCurrent  = intel ? Math.abs(intel.current_status.groundwater).toFixed(1) : '—'
  const gwForecast = intel?.forecast?.forecasts?.[0]
    ? Math.abs(intel.forecast.forecasts[0].predicted_groundwater).toFixed(1)
    : '—'

  const trend = intel?.forecast?.status
  const TrendIcon = trend === 'declining' ? TrendingDown : trend === 'improving' ? TrendingUp : Minus
  const trendColor = trend === 'declining' ? 'var(--color-risk-high)' : trend === 'improving' ? 'var(--color-risk-normal)' : 'var(--color-text-secondary)'

  return (
    <div className="min-h-screen bg-surface-page" style={{ paddingBottom: '6rem' }}>
      <Nav />

      <div className="pt-16 px-4 max-w-md mx-auto">

        {/* Header */}
        <div className="py-6 flex items-center gap-3 border-b border-border-ui mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
               style={{ background:'var(--color-primary)' }}>
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-ui text-text-primary leading-tight">
              Farmer Advisory
            </h1>
            <p className="font-tamil text-text-secondary text-sm">விவசாயி ஆலோசனை</p>
          </div>
        </div>

        {/* Station selector */}
        <div className="mb-6">
          <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Select Area / பகுதி
          </label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
          >
            {stations.map(s => (
              <option key={s.station} value={s.station}>{s.station}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="p-10 text-center text-text-secondary font-ui">Loading…</div>
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
                  Your well is stable. ✓
                </p>
                <p className="font-tamil text-xl text-text-primary">
                  உங்கள் கிணறு நிலையானது.
                </p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-border-ui shadow-sm">
                <div className="px-4 py-3" style={{ background:'var(--color-secondary)' }}>
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
                  <p className="font-tamil text-text-primary" style={{ fontSize:'15px', lineHeight:1.8 }}>
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
                    Forecast / முன்னறிவிப்பு
                  </div>
                  <div className="font-mono font-bold text-2xl text-accent">
                    {gwForecast} m
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-ui flex items-center gap-2">
                <TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
                <span className="text-sm font-ui font-medium capitalize" style={{ color: trendColor }}>
                  {trend ?? 'Stable'} trend
                </span>
              </div>
            </div>

            {/* SMS button */}
            {!smsSent ? (
              <button
                onClick={() => setSmsSent(true)}
                className="w-full py-4 rounded-lg font-ui font-bold text-base flex items-center justify-center gap-2 text-white bg-primary border-0"
              >
                <MessageSquare className="w-5 h-5" />
                Send SMS Advisory / SMS அனுப்பு
              </button>
            ) : (
              <div className="rounded-lg p-4 text-center border-2 border-success bg-surface-card">
                <p className="font-ui font-bold text-sm mb-1 text-success">
                  ✓ SMS Advisory Sent
                </p>
                <p className="font-ui text-xs text-text-secondary">
                  Advisory sent to registered mobile number
                </p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
