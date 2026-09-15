import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

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
  const forecast = data?.forecast?.forecasts?.[0] ? Math.abs(data.forecast.forecasts[0].predicted_groundwater) : current
  const maxDepth = 60
  const currentPct  = Math.min((current  / maxDepth) * 100, 100)
  const forecastPct = Math.min((forecast / maxDepth) * 100, 100)
  const riskLevel = data?.risk.risk_level ?? 'LOW'
  const fillCol = riskLevel === 'CRITICAL' ? 'var(--gw-critical-text)' : riskLevel === 'HIGH' ? 'var(--gw-high-text)' : riskLevel === 'MODERATE' ? 'var(--gw-moderate-text)' : 'var(--gw-low-text)'
  const fillBg  = riskLevel === 'CRITICAL' ? 'var(--gw-critical-surface)' : riskLevel === 'HIGH' ? 'var(--gw-high-surface)' : riskLevel === 'MODERATE' ? 'var(--gw-moderate-surface)' : 'var(--gw-low-surface)'

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
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><Layers className="w-4 h-4" /> Digital Twin — Aquifer Cross-Section</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-96 gw-skeleton" />
        ) : data ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <RiskBadge level={riskLevel} />
              <span className="text-text-secondary text-sm">1-month forecast comparison</span>
            </div>

            {/* Aquifer cross-section */}
            <div className="gw-card">
              <div className="gw-section-label mb-5">Aquifer Cross-Section — Depth Model</div>
              <div className="grid grid-cols-2 gap-6">

                {/* Current */}
                <div>
                  <div className="gw-section-label mb-3 text-text-secondary">Current</div>
                  <div className="relative mx-auto" style={{ width: '80px', height: '240px' }}>
                    {/* Ground surface */}
                    <div className="absolute top-0 left-0 right-0 h-4 rounded-t-sm" style={{ background: 'var(--gw-secondary-600)', opacity: 0.6 }}/>
                    <div className="text-[9px] text-text-primary0 absolute -top-4 left-0 right-0 text-center uppercase tracking-wider">Ground</div>
                    {/* Aquifer column */}
                    <div className="absolute top-4 left-0 right-0 bottom-0 rounded-b-sm border border-border-ui overflow-hidden" style={{ background: 'var(--gw-surface-sunken)' }}>
                      {/* Water fill from bottom */}
                      <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                        style={{ height: String(100 - currentPct) + '%', background: fillBg, borderTop: '1px solid ' + fillCol }}>
                        {/* Water surface ripple */}
                        <div className="absolute top-0 left-0 right-0 h-1 opacity-60" style={{ background: fillCol }} />
                      </div>
                      {/* Depth marker */}
                      <div className="absolute right-1 transition-all duration-700 ease-out text-[9px] font-mono font-bold"
                        style={{ top: String(currentPct) + '%', color: fillCol, transform: 'translateY(-50%)' }}>
                        {current.toFixed(1)}m
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <div className="text-xl font-mono font-bold text-text-primary">{fmtGW(data.current_status.groundwater)}</div>
                    <div className="text-text-primary0 text-xs">below surface</div>
                  </div>
                </div>

                {/* 1-Month Forecast */}
                <div>
                  <div className="gw-section-label mb-3 text-text-secondary">Next Month</div>
                  <div className="relative mx-auto" style={{ width: '80px', height: '240px' }}>
                    <div className="absolute top-0 left-0 right-0 h-4 rounded-t-sm" style={{ background: 'var(--gw-secondary-600)', opacity: 0.6 }}/>
                    <div className="text-[9px] text-text-primary0 absolute -top-4 left-0 right-0 text-center uppercase tracking-wider">Ground</div>
                    <div className="absolute top-4 left-0 right-0 bottom-0 rounded-b-sm border border-border-ui overflow-hidden border-dashed" style={{ background: 'var(--gw-surface-sunken)' }}>
                      <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                        style={{ height: String(100 - forecastPct) + '%', background: fillBg, opacity: 0.7, borderTop: '1px dashed ' + fillCol }}>
                        <div className="absolute top-0 left-0 right-0 h-1 opacity-40" style={{ background: fillCol }} />
                      </div>
                      <div className="absolute right-1 transition-all duration-700 ease-out text-[9px] font-mono font-bold"
                        style={{ top: String(forecastPct) + '%', color: fillCol, transform: 'translateY(-50%)', opacity: 0.8 }}>
                        {forecast.toFixed(1)}m
                      </div>
                    </div>
                    {/* Forecast label */}
                    <div className="absolute -bottom-1 left-0 right-0 text-center">
                      <span className="text-[9px] text-text-primary0 uppercase tracking-wider">Predicted</span>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <div className="text-xl font-mono font-bold text-text-primary">{fmtGW(data.forecast?.forecasts?.[0]?.predicted_groundwater ?? null)}</div>
                    <div className="text-text-primary0 text-xs">forecast depth</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-border-ui flex gap-6 justify-center text-xs text-text-secondary">
                <div className="flex items-center gap-2"><div className="w-4 h-0.5" style={{ background: fillCol }}></div>Current water table</div>
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: fillCol }}></div>Forecast water table</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: 'var(--gw-secondary-600)', opacity:0.6 }}></div>Soil layer</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="gw-card">
                <div className="gw-section-label mb-1">Aquifer depth modelled</div>
                <div className="text-lg font-mono font-bold text-text-primary mt-1">{maxDepth} m</div>
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

            <p className="text-center text-xs text-text-muted">Aquifer cross-section is a scaled representation for visualization. Not an engineering survey.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
