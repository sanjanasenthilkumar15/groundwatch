import { useEffect, useState } from 'react'
import { Bell, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, RiskMapResponse } from '../lib/api'

export default function AlertsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<RiskMapResponse | null>(null)

  useEffect(() => {
    api.riskMap().then(setData)
  }, [])

  const critical = data?.stations.filter(s => s.risk_level === 'CRITICAL') || []
  const high     = data?.stations.filter(s => s.risk_level === 'HIGH') || []
  const alerts   = [...critical, ...high]

  return (
    <div className="min-h-screen pb-20">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-4xl mx-auto space-y-6">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">Active Alerts</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5 font-medium"><Bell className="w-4 h-4" /> Stations requiring immediate attention</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-text-primary">{alerts.length}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wide">Total Alerts</div>
          </div>
        </div>

        {!data ? (
          <div className="space-y-4">
            <div className="gw-card h-24 gw-skeleton"></div>
            <div className="gw-card h-24 gw-skeleton"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="gw-card border-l-2 border-l-risk-normal bg-surface-card flex flex-col items-center justify-center p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-card border border-risk-normal flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-risk-normal" />
            </div>
            <h2 className="text-lg font-bold text-text-primary font-ui">Salem district is stable today.</h2>
            <p className="text-text-secondary text-sm mt-2 max-w-sm">No critical or high-risk groundwater stations as of {data.stations[0]?.latest_month ? new Date(data.stations[0].latest_month).toLocaleDateString('en-IN', {month:'long', year:'numeric'}) : 'today'}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((s, i) => (
              <div key={i} className={`gw-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                s.risk_level === 'CRITICAL' 
                  ? 'border-l-4 border-l-risk-critical bg-surface-card' 
                  : 'border-l-2 border-l-risk-high bg-surface-card'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-text-primary font-ui">{s.station}</h3>
                    <RiskBadge level={s.risk_level} />
                  </div>
                  <div className="flex items-center gap-6 text-sm text-text-secondary">
                    <div>Depth: <span className="font-mono text-text-primary">{Math.abs(s.current_groundwater || 0).toFixed(1)}m</span></div>
                    <div>Forecast: <span className="font-mono text-text-primary">{Math.abs(s.predicted_groundwater || 0).toFixed(1)}m</span></div>
                    <div>Score: <span className="font-mono text-text-primary">{s.risk_score}</span>/100</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/intervention/${s.station}`)}
                    className="gw-btn bg-surface-card border border-border-ui hover:bg-ink-700 text-text-primary"
                  >
                    Action Plan
                  </button>
                  <button 
                    onClick={() => navigate(`/block/${s.station}`)}
                    className="gw-btn"
                  >
                    Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
