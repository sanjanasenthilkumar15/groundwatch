import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Droplets, Sun, CloudRain, ArrowRight, BarChart2 } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, RiskMapEntry, RiskMapResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="gw-card py-5">
      <div className="gw-section-label mb-2">{label}</div>
      <div className="font-mono font-bold text-3xl text-text-primary" style={color ? { color } : {}}>
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted font-ui mt-1">{sub}</div>}
    </div>
  )
}

export default function AgricultureOfficerPage() {
  const [data,    setData]    = useState<RiskMapResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.riskMap().then(setData).finally(() => setLoading(false))
  }, [])

  const stations: RiskMapEntry[] = data?.stations ?? []
  const summary  = data?.summary ?? { total_stations:0, critical:0, high:0, moderate:0, low:0 }

  // Group stations needing irrigation advisory
  const needsAdvisory = stations.filter(s => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH')
  const stableStations = stations.filter(s => s.risk_level === 'LOW')
  const pctAtRisk = stations.length > 0
    ? Math.round(((summary.critical + summary.high) / summary.total_stations) * 100)
    : 0

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-14 max-w-5xl mx-auto px-4 md:px-6 pb-12">

        {/* Page header */}
        <div className="py-6 border-b border-border-ui mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Leaf className="w-5 h-5 text-success" />
            <h1 className="text-xl font-bold font-ui text-text-primary tracking-tight">
              Agriculture Officer Dashboard
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            Crop advisory status · Groundwater stress overview · Salem District
          </p>
        </div>

        {/* Season + Risk summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Stations at Risk"
            value={loading ? '—' : `${pctAtRisk}%`}
            sub={`${(summary.critical + summary.high)} of ${summary.total_stations} stations`}
            color={pctAtRisk > 30 ? 'var(--color-risk-high)' : 'var(--color-risk-normal)'}
          />
          <StatCard
            label="Stable Wells"
            value={loading ? '—' : String(summary.low)}
            sub="Low risk — no advisory needed"
            color="var(--color-risk-normal)"
          />
          <StatCard
            label="Watch Areas"
            value={loading ? '—' : String(summary.moderate)}
            sub="Moderate stress — monitor weekly"
            color="var(--color-risk-watch)"
          />
          <StatCard
            label="Critical Zones"
            value={loading ? '—' : String(summary.critical)}
            sub="Irrigation restriction advised"
            color="var(--color-risk-critical)"
          />
        </div>

        {/* Seasonal advisory box */}
        <div className="gw-card mb-6 border-l-4 border-secondary">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background:'color-mix(in srgb, var(--color-secondary) 15%, transparent)' }}>
              <CloudRain className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="font-ui font-bold text-sm text-text-primary mb-1">
                Seasonal Irrigation Advisory — {new Date().toLocaleString('en-US', { month: 'long', year:'numeric' })}
              </div>
              <p className="text-text-secondary text-sm font-ui leading-relaxed">
                {pctAtRisk > 40
                  ? `${pctAtRisk}% of monitored stations show significant groundwater stress. Recommend issuing district-wide irrigation restriction notice and prioritising drip irrigation for Kharif crops.`
                  : pctAtRisk > 20
                  ? `${pctAtRisk}% of stations are under moderate-to-high stress. Farmers in HIGH and CRITICAL zones should shift to short-duration crop varieties and reduce paddy cultivation area.`
                  : `Groundwater levels are broadly stable across the district. Continue standard irrigation scheduling. Review CRITICAL zone stations individually.`
                }
              </p>
              <div className="mt-3 flex gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-ui text-text-secondary">
                  <Sun className="w-3.5 h-3.5 text-accent" />
                  Kharif season active
                </div>
                <div className="flex items-center gap-1.5 text-xs font-ui text-text-secondary">
                  <Droplets className="w-3.5 h-3.5 text-primary" />
                  XGBoost + Satellite model
                </div>
                <div className="flex items-center gap-1.5 text-xs font-ui text-text-secondary">
                  <BarChart2 className="w-3.5 h-3.5 text-info" />
                  6-month forecast available per station
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Stations needing advisory */}
          <div className="gw-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-ui flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-risk-high" />
              <h2 className="text-sm font-bold font-ui text-text-primary">Irrigation Advisory Required</h2>
              <span className="ml-auto font-mono text-xs text-text-muted">{needsAdvisory.length} stations</span>
            </div>
            {loading ? (
              <div className="p-6 text-center text-text-secondary text-sm">Loading…</div>
            ) : needsAdvisory.length === 0 ? (
              <div className="p-6 text-center text-success text-sm font-ui font-semibold">
                ✓ No high-risk stations today
              </div>
            ) : (
              <div>
                {needsAdvisory.slice(0, 8).map(s => (
                  <Link
                    key={s.station}
                    to={`/block/${encodeURIComponent(s.station)}`}
                    className="flex items-center justify-between px-5 py-3.5 border-b border-border-ui hover:bg-surface-page transition-colors group last:border-0"
                  >
                    <div>
                      <div className="font-ui font-semibold text-sm text-text-primary">{s.station}</div>
                      <div className="font-mono text-xs text-text-secondary mt-0.5">
                        {fmtGW(s.current_groundwater)} depth
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RiskBadge level={s.risk_level} />
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
                {needsAdvisory.length > 8 && (
                  <div className="px-5 py-3 text-xs text-text-muted font-ui text-center border-t border-border-ui">
                    +{needsAdvisory.length - 8} more stations →
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stable zones */}
          <div className="gw-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-ui flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-risk-normal" />
              <h2 className="text-sm font-bold font-ui text-text-primary">Stable Zones — No Action</h2>
              <span className="ml-auto font-mono text-xs text-text-muted">{stableStations.length} stations</span>
            </div>
            {loading ? (
              <div className="p-6 text-center text-text-secondary text-sm">Loading…</div>
            ) : stableStations.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-sm font-ui">No stable stations found.</div>
            ) : (
              <div>
                {stableStations.slice(0, 8).map(s => (
                  <Link
                    key={s.station}
                    to={`/satellite/${encodeURIComponent(s.station)}`}
                    className="flex items-center justify-between px-5 py-3.5 border-b border-border-ui hover:bg-surface-page transition-colors group last:border-0"
                  >
                    <div>
                      <div className="font-ui font-semibold text-sm text-text-primary">{s.station}</div>
                      <div className="font-mono text-xs text-text-secondary mt-0.5">
                        {fmtGW(s.current_groundwater)} depth
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-risk-normal">STABLE</span>
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-success transition-colors" />
                    </div>
                  </Link>
                ))}
                {stableStations.length > 8 && (
                  <div className="px-5 py-3 text-xs text-text-muted font-ui text-center border-t border-border-ui">
                    +{stableStations.length - 8} more stations
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { to: '/risk-map',          label: 'Geospatial Risk Map',     icon: '🗺️',  desc: 'View all stations on map' },
            { to: '/alerts',            label: 'Active Alerts',           icon: '🔔',  desc: 'Stations needing attention' },
            { to: '/stress/Kullampatti',label: 'Crop Stress Analysis',    icon: '🌾',  desc: 'ET · NDVI · Soil moisture' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="gw-card hover:border-primary transition-colors group flex flex-col gap-1"
            >
              <span className="text-xl">{link.icon}</span>
              <div className="font-ui font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">
                {link.label}
              </div>
              <div className="text-xs text-text-muted font-ui">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
