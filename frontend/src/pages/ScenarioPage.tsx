import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CloudRain, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import Nav from '../components/Nav'
import { api, IntelligenceResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

const SCENARIOS = [
  { id: 'below_normal', label: 'Below Normal', ta: 'சாதாரணத்திற்கும் குறைவு', desc: '< 75% of average rainfall', icon: TrendingDown, cls: 'text-risk-high',     chipActive: 'gw-chip gw-chip-active-high' },
  { id: 'normal',       label: 'Normal',        ta: 'சாதாரண மழை',           desc: '75–125% of average',    icon: Minus,       cls: 'text-text-secondary',       chipActive: 'gw-chip gw-chip-active-all' },
  { id: 'above_normal', label: 'Above Normal',  ta: 'சாதாரணத்திற்கும் அதிகம்',desc: '> 125% of average',  icon: TrendingUp,  cls: 'text-success',     chipActive: 'gw-chip gw-chip-active-low' },
]

interface ScenarioResult { scenario: string; predicted_groundwater: number; risk_level: string; message: string }

export default function ScenarioPage() {
  const { station } = useParams<{ station: string }>()
  const navigate    = useNavigate()
  const stationName = station ? decodeURIComponent(station) : ''
  const [data, setData]       = useState<IntelligenceResponse | null>(null)
  const [result, setResult]   = useState<ScenarioResult | null>(null)
  const [active, setActive]   = useState<string>('normal')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).finally(() => setLoading(false))
  }, [stationName])

  const runScenario = async (scenarioId: string) => {
    setActive(scenarioId)
    setRunning(true)
    try {
      const r = await fetch((import.meta.env.VITE_API_URL ?? '/api') + '/stations/' + encodeURIComponent(stationName) + '/scenario', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rainfall_modifier: scenarioId === 'below_normal' ? 0.75 : scenarioId === 'above_normal' ? 1.25 : 1.0 }),
      })
      const json = await r.json()
      setResult(json)
    } catch {}
    setRunning(false)
  }

  const baseline = data ? Math.abs(data.current_status.groundwater) : null
  const scenarioVal = result ? Math.abs(result.predicted_groundwater) : null
  const delta = (baseline && scenarioVal) ? (scenarioVal - baseline) : null

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
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><CloudRain className="w-4 h-4" /> What-If Scenario Simulator</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-64 gw-skeleton" />
        ) : (
          <div className="space-y-5">
            <div className="gw-card">
              <div className="gw-section-label mb-4">Rainfall Scenario</div>
              <div className="grid grid-cols-3 gap-3">
                {SCENARIOS.map(s => {
                  const isActive = active === s.id
                  return (
                    <button key={s.id}
                      onClick={() => runScenario(s.id)}
                      disabled={running}
                      className={"p-4 rounded-md border text-left transition-all " +
                        (isActive
                          ? 'border-primary bg-primary'
                          : 'border-border-ui bg-surface-card hover:bg-surface-card hover:border-border-ui')}>
                      <s.icon className={"w-5 h-5 mb-2 " + s.cls} />
                      <div className={"text-sm font-semibold font-ui " + (isActive ? "text-white" : "text-text-primary")}>{s.label}</div>
                      <div className="font-tamil text-text-secondary text-[11px] mt-0.5 leading-snug">{s.ta}</div>
                      <div className="text-text-primary0 text-[10px] mt-1">{s.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Baseline */}
            {data && (
              <div className="grid grid-cols-2 gap-4">
                <div className="gw-card">
                  <div className="gw-section-label mb-1">Baseline (Current)</div>
                  <div className="text-2xl font-mono font-bold text-text-primary mt-1">{fmtGW(data.current_status.groundwater)}</div>
                  <div className="text-text-primary0 text-xs mt-1">current depth</div>
                </div>
                <div className={"gw-card " + (running ? 'gw-skeleton' : '')}>
                  <div className="gw-section-label mb-1">Scenario Result</div>
                  {result && !running ? (
                    <>
                      <div className={"text-2xl font-mono font-bold mt-1 " +
                        (result.risk_level === 'CRITICAL' ? 'text-risk-critical' : result.risk_level === 'HIGH' ? 'text-risk-high' : result.risk_level === 'MODERATE' ? 'text-risk-watch' : 'text-risk-normal')}>
                        {fmtGW(result.predicted_groundwater)}
                      </div>
                      {delta !== null && (
                        <div className={"text-xs font-mono mt-1 " + (delta > 0 ? 'text-risk-high' : 'text-success')}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(2)} m vs baseline
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-text-primary0 text-sm mt-1">{running ? 'Running…' : 'Select a scenario'}</div>
                  )}
                </div>
              </div>
            )}

            {/* Result narrative */}
            {result && !running && (
              <div className={"gw-card border-l-2 " +
                (result.risk_level === 'CRITICAL' ? 'border-l-risk-critical' : result.risk_level === 'HIGH' ? 'border-l-risk-high' : result.risk_level === 'MODERATE' ? 'border-l-risk-watch' : 'border-l-risk-normal')}>
                <div className="gw-section-label mb-2">Model Interpretation</div>
                <p className="text-text-primary text-sm leading-relaxed">{result.message}</p>
              </div>
            )}

            <div className="gw-card bg-surface-card border border-border-ui">
              <div className="gw-section-label mb-2">About this tool</div>
              <p className="text-text-secondary text-xs leading-relaxed">
                The What-If Simulator adjusts the rainfall input to the XGBoost groundwater model and re-runs the prediction. 
                All other features (NDVI, soil moisture, previous groundwater levels) remain at current observed values. 
                Results are directional — for planning purposes only, not engineering decisions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



