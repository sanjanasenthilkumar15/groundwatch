import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart2, HelpCircle, Clock, AlertTriangle, Target, Satellite, Layers, Sliders } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

function ConfidenceGauge({ reliability }: { reliability: string }) {
  const pct = reliability === 'normal' ? 82 : reliability === 'low' ? 45 : 20
  const fillCol = pct > 65 ? 'bg-risk-low-border' : pct > 40 ? 'bg-risk-moderate-border' : 'bg-risk-high-border'
  const colVal  = pct > 65 ? 'var(--gw-low-text)' : pct > 40 ? 'var(--gw-moderate-text)' : 'var(--gw-high-text)'
  const label   = reliability === 'normal' ? 'Reliable — based on full training data' : reliability === 'low' ? 'Low reliability — limited data' : 'Very low — treat as directional'
  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <span className="gw-section-label">Forecast Confidence</span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-mono font-bold text-text-primary">{pct}</span>
          <span className="text-base text-text-secondary font-mono">%</span>
        </div>
      </div>
      <div className="gw-gauge-track" style={{ height: '3px' }}>
        <div className={`gw-gauge-fill ${fillCol}`} style={{ width: pct + '%', height: '100%' }} />
        <div className="gw-gauge-dot" style={{ left: pct + '%', color: colVal }} />
      </div>
      <p className="text-xs text-text-primary0 mt-2">{label}</p>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="gw-card">
      <div className="gw-section-label mb-1">{label}</div>
      <div className="text-xl font-mono font-bold text-text-primary mt-1">{value}</div>
      {sub && <div className="text-text-primary0 text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function BlockPage() {
  const { station } = useParams<{ station: string }>()
  const navigate    = useNavigate()
  const [data, setData]   = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const stationName = station ? decodeURIComponent(station) : ''

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [stationName])

  const forecasts = data?.forecast?.forecasts ?? []
  const f1 = forecasts.find(f => f.horizon_months === 1)
  const f3 = forecasts.find(f => f.horizon_months === 3)
  const f6 = forecasts.find(f => f.horizon_months === 6)

  const monthsToCritical = (() => {
    if (!data) return null
    const change = data.stress_clock.outlook.estimated_change
    if (change >= 0) return null
    const current = Math.abs(data.current_status.groundwater)
    const criticalDepth = 30
    if (current >= criticalDepth) return null
    return Math.round(Math.min(Math.abs((criticalDepth - current) / change), 24))
  })()

  const recentTrend = data?.stress_clock.recent_trend
  const trendLabel = recentTrend?.status === 'declining'
    ? { display: '▼ Declining', cls: 'text-risk-high' }
    : recentTrend?.status === 'improving'
    ? { display: '▲ Improving', cls: 'text-success' }
    : { display: '— Stable',    cls: 'text-text-secondary' }

  const subScreens = [
    { to: 'forecast',     icon: BarChart2,  label: 'Full Forecast',  accent: 'text-accent'    },
    { to: 'why',          icon: HelpCircle, label: 'WHY Analysis',   accent: 'text-primary'   },
    { to: 'stress',       icon: Clock,      label: 'Stress Clock',   accent: 'text-risk-watch'    },
    { to: 'intervention', icon: Target,     label: 'Intervention',   accent: 'text-risk-normal'         },
    { to: 'satellite',    icon: Satellite,  label: 'Environment',    accent: 'text-secondary' },
    { to: 'twin',         icon: Layers,     label: 'Digital Twin',   accent: 'text-info'      },
    { to: 'scenario',     icon: Sliders,    label: 'Scenario',       accent: 'text-primary'   },
  ]

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 pb-8 max-w-5xl mx-auto">

        <div className="flex items-start gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2 mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
              {data && <RiskBadge level={data.risk.risk_level} />}
              {recentTrend?.status === 'improving' && (
                <span className="text-xs text-success font-semibold">▲ Improved last month</span>
              )}
              {recentTrend?.status === 'declining' && (
                <span className="text-xs text-risk-high font-semibold">▼ Declined last month</span>
              )}
            </div>
            {data && <p className="text-text-secondary text-sm mt-0.5">Block Intelligence · Data as of {data.station.latest_month}</p>}
            {data && data.risk.risk_level !== 'LOW' && recentTrend?.status === 'improving' && (
              <p className="text-text-muted text-xs mt-1 max-w-lg leading-relaxed">
                These aren't contradictory: the <strong className="text-text-secondary">{data.risk.risk_level}</strong> badge reflects how deep the water table currently is; "Improved" only means it moved in the right direction last month. A station can be dangerously deep and still improving.
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="gw-card h-28 gw-skeleton" />
            <div className="grid grid-cols-3 gap-4">
              {[0,1,2].map(i => <div key={i} className="gw-card h-20 gw-skeleton" />)}
            </div>
          </div>
        )}

        {error && (
          <div className="gw-card border-l-4 border-l-risk-critical bg-surface-card p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-risk-critical mx-auto mb-3" />
            <p className="text-risk-critical font-semibold">Failed to load station data</p>
            <p className="text-text-secondary text-sm mt-1">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {data.risk.reliability_warning && (
              <div className="flex gap-3 p-4 rounded-md border border-l-2 border-risk-watch border-l-risk-watch bg-surface-card">
                <AlertTriangle className="text-risk-watch w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-text-primary text-sm">{data.risk.reliability_warning}</p>
              </div>
            )}

            <div className="grid md:grid-cols-12 gap-5">
              <div className="md:col-span-7 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="gw-card col-span-2 sm:col-span-1">
                    <div className="gw-section-label mb-1">Current Depth</div>
                    <div className="text-3xl font-mono font-bold text-text-primary mt-1">{fmtGW(data.current_status.groundwater)}</div>
                    <div className="text-text-primary0 text-xs mt-1">below ground level</div>
                  </div>
                  <StatCard label="Rainfall" value={(data.current_status.rainfall_mm?.toFixed(0) ?? '—') + ' mm'} sub="current month" />
                  <div className="gw-card">
                    <div className="gw-section-label mb-1">Trend (last month)</div>
                    <div className={"text-lg font-mono font-bold mt-1 " + trendLabel.cls}>{trendLabel.display}</div>
                    <div className="text-text-primary0 text-xs mt-1">
                      {recentTrend && recentTrend.status !== 'stable'
                        ? `${recentTrend.magnitude_m.toFixed(2)} m ${recentTrend.status === 'declining' ? 'deeper' : 'shallower'}`
                        : 'no significant change'}
                    </div>
                  </div>
                  <StatCard label="Risk Score" value={data.risk.risk_score + '/100'} sub={'Weight: ' + data.risk.prediction_weight} />
                  <StatCard label="Time to Critical" value={monthsToCritical ? '~' + monthsToCritical + ' mo' : 'N/A'} sub="at current rate" />
                </div>

                <div className="gw-card">
                  <div className="gw-section-label mb-4">Forecast Horizons</div>
                  <div className="grid grid-cols-3 gap-4">
                    {[{ label: '1 Month', f: f1 }, { label: '3 Months', f: f3 }, { label: '6 Months', f: f6 }].map(({ label, f }) => (
                      <div key={label} className="text-center border-r border-border-ui last:border-0">
                        <div className="gw-section-label mb-2">{label}</div>
                        <div className="text-xl font-mono font-bold text-text-primary">{f ? fmtGW(f.predicted_groundwater) : '—'}</div>
                        {f && <div className="text-text-primary0 text-xs mt-1 font-mono">{Math.abs(f.lower_bound).toFixed(1)}–{Math.abs(f.upper_bound).toFixed(1)} m</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="gw-card border-l-2 border-l-gw-accent-500">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="text-accent w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="gw-section-label mb-2">Interpretation</div>
                      <p className="text-text-primary text-sm leading-relaxed">{data.why.overall_interpretation}</p>
                      {data.advisory.officer_action && (
                        <p className="text-text-secondary text-xs mt-3 leading-relaxed border-t border-border-ui pt-3">{data.advisory.officer_action}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 space-y-4">
                <div className="gw-card">
                  <ConfidenceGauge reliability={data.reliability.reliability} />
                </div>

                <div className="advisory-block">
                  <div className="advisory-header">
                    <span className="gw-section-label">Farmer Advisory</span>
                  </div>
                  <div className="advisory-en">
                    <div style={{ fontSize: '9px', letterSpacing: '0.15em', fontWeight: 600, color: 'var(--gw-primary-400)', textTransform: 'uppercase', marginBottom: '4px' }}>English</div>
                    {data.advisory.english}
                  </div>
                  {data.advisory.tamil && (
                    <>
                      <div className="advisory-sep" />
                      <div className="advisory-ta">
                        <div style={{ fontSize: '9px', letterSpacing: '0.15em', fontWeight: 600, color: 'var(--gw-primary-400)', textTransform: 'uppercase', marginBottom: '4px' }}>தமிழ்</div>
                        {data.advisory.tamil}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="gw-section-label mb-3">Detailed Analysis</div>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {subScreens.map(s => (
                  <button key={s.to}
                    onClick={() => navigate('/' + s.to + '/' + encodeURIComponent(stationName))}
                    className={'flex flex-col items-center gap-2 p-4 rounded-md border border-border-ui bg-surface-card transition-all hover:bg-surface-card focus-visible:outline-2'}>
                    <s.icon className={'w-5 h-5 ' + s.accent} />
                    <span className="text-text-secondary text-xs font-medium text-center leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

