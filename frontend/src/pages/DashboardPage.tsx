import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Droplets, ArrowRight } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, RiskMapEntry, RiskMapResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

type DashboardSummary = RiskMapResponse['summary']

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>({ total_stations: 0, critical: 0, high: 0, moderate: 0, low: 0 })
  const [stations, setStations] = useState<RiskMapEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.riskMap().then(d => {
      setSummary(d.summary)
      setStations(d.stations)
    }).finally(() => setLoading(false))
  }, [])

  const priority = stations.filter(s => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH').slice(0, 5)
  const rest = stations.filter(s => s.risk_level !== 'CRITICAL' && s.risk_level !== 'HIGH').slice(0, 10)

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 pb-8 max-w-6xl mx-auto">
        
        <div className="mb-6 p-6 -mx-4 md:-mx-6 px-4 md:px-6 rounded-b-xl border-b border-border-ui" style={{ background: "linear-gradient(90deg, rgba(38,125,116,0.08) 0%, transparent 100%)" }}>
          <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight uppercase">Groundwater Status — Salem</h1>
          <p className="text-text-secondary text-sm mt-0.5">District Command Dashboard · {new Date().toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'})}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
            
            {priority.length > 0 && (
              <div className="flex gap-3 p-4 rounded-md border border-risk-critical bg-surface-card border-l-2 border-l-risk-critical shadow-sm">
                <AlertTriangle className="w-5 h-5 text-risk-critical shrink-0" />
                <p className="text-text-primary text-sm">
                  <span className="font-bold">{priority.length} stations</span> require priority attention today — {summary.critical} critical, {summary.high} high risk.
                </p>
              </div>
            )}

            <div className="gw-card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border-ui flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-risk-high" />
                <h2 className="text-sm font-semibold text-text-primary font-ui">Priority Intervention List</h2>
              </div>
              <div className="w-full">
                <div className="grid grid-cols-12 gap-2 px-5 py-2 border-b border-border-ui text-xs font-semibold text-text-secondary font-ui uppercase tracking-wider bg-surface-card">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-4">Station</div>
                  <div className="col-span-3">Risk</div>
                  <div className="col-span-2">GW Now</div>
                  <div className="col-span-2 text-right">Trend</div>
                </div>
                {priority.map((s, i) => (
                  <Link key={s.station} to={`/block/${encodeURIComponent(s.station)}`} className={"grid grid-cols-12 gap-2 px-5 py-4 items-center border-b border-border-ui hover:bg-surface-card transition-colors " + (s.risk_level === 'CRITICAL' ? 'border-l-4 border-l-risk-critical bg-[color-mix(in_srgb,var(--color-risk-critical)_10%,transparent)]' : 'border-l-4 border-l-risk-high bg-[color-mix(in_srgb,var(--color-risk-high)_10%,transparent)]')}>
                    <div className={"col-span-1 font-mono font-bold " + (s.risk_level === 'CRITICAL' ? 'text-2xl text-risk-critical' : 'text-lg text-risk-high')}>#{i+1}</div>
                    <div className="col-span-4 font-semibold text-text-primary text-sm">{s.station}</div>
                    <div className="col-span-3"><RiskBadge level={s.risk_level} /></div>
                    <div className="col-span-2 font-mono text-text-primary text-sm">{fmtGW(s.current_groundwater)}</div>
                    <div className={"col-span-2 text-right font-mono text-xs flex flex-col items-end " + ((s.predicted_groundwater||0) > (s.current_groundwater||0) ? 'text-risk-high' : 'text-success')}>
                      <span>{(s.predicted_groundwater||0) > (s.current_groundwater||0) ? '▼' : '▲'}</span>
                      <span>{Math.abs((s.predicted_groundwater||0) - (s.current_groundwater||0)).toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="gw-card p-0 overflow-hidden mt-2">
              <div className="px-5 py-4 border-b border-border-ui">
                <h2 className="text-sm font-semibold text-text-primary font-ui">All Stations — Monitor Status</h2>
              </div>
              <div>
                {rest.map((s) => (
                  <Link key={s.station} to={`/block/${encodeURIComponent(s.station)}`} className="flex items-center justify-between px-5 py-3 border-b border-border-ui last:border-0 hover:bg-surface-card transition-colors">
                    <span className="text-sm font-medium text-text-primary">{s.station}</span>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-text-secondary text-sm">{fmtGW(s.current_groundwater)}</span>
                      <RiskBadge level={s.risk_level} />
                      <ArrowRight className="w-4 h-4 text-text-primary0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
            <div className="gw-card flex flex-col justify-center py-6">
              <div className="gw-section-label mb-2 flex items-center justify-between">
                <span>Total Stations</span>
                <Droplets className="w-4 h-4 text-primary" />
              </div>
              <div className="font-mono text-4xl font-bold text-text-primary">{loading ? '-' : summary.total_stations}</div>
            </div>

            <div className={`gw-card border-2 border-risk-critical bg-surface-card py-6 flex flex-col justify-center ${summary.critical > 0 ? 'critical-pulse-ring' : ''}`}>
              <div className="text-xs font-bold text-risk-critical mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Critical</span>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="font-mono text-5xl font-bold text-risk-critical leading-none">{loading ? '-' : summary.critical}</div>
            </div>

            <div className="gw-card border-l-4 border-l-risk-high bg-surface-card py-6">
              <div className="text-xs font-bold text-risk-high mb-2 uppercase tracking-wider">High Risk</div>
              <div className="font-mono text-3xl font-bold text-risk-high">{loading ? '-' : summary.high}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="gw-card border-l-2 border-l-risk-watch bg-surface-card">
                <div className="text-[10px] font-bold text-risk-watch mb-1 uppercase tracking-wider">Moderate</div>
                <div className="font-mono text-2xl font-bold text-risk-watch">{loading ? '-' : summary.moderate}</div>
              </div>
              <div className="gw-card border-l-2 border-l-risk-normal bg-surface-card">
                <div className="text-[10px] font-bold text-risk-normal mb-1 uppercase tracking-wider">Low</div>
                <div className="font-mono text-2xl font-bold text-risk-normal">{loading ? '-' : summary.low}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}



