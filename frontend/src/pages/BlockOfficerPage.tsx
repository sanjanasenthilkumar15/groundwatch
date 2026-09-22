import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, ClipboardList, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, RiskMapEntry, RiskMapResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

export default function BlockOfficerPage() {
  const [data,    setData]    = useState<RiskMapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [filter,  setFilter]  = useState('ALL')

  useEffect(() => {
    api.riskMap().then(setData).finally(() => setLoading(false))
  }, [])

  const stations: RiskMapEntry[] = data?.stations ?? []
  const summary  = data?.summary ?? { total_stations:0, critical:0, high:0, moderate:0, low:0 }

  const visible = stations
    .filter(s => filter === 'ALL' || s.risk_level === filter)
    .filter(s => s.station.toLowerCase().includes(query.toLowerCase()))

  const priorityCount = summary.critical + summary.high

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-14 max-w-5xl mx-auto px-4 md:px-6 pb-12">

        {/* Page header */}
        <div className="py-6 border-b border-border-ui mb-6">
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold font-ui text-text-primary tracking-tight">
              Block / Taluk Field Console
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            Station-level groundwater intelligence · Salem District
          </p>
        </div>

        {/* Action summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label:'Need Action',  value: priorityCount, color:'var(--color-risk-critical)', icon: AlertTriangle },
            { label:'Moderate',     value: summary.moderate, color:'var(--color-risk-watch)',    icon: Clock },
            { label:'Stable',       value: summary.low,      color:'var(--color-risk-normal)',   icon: CheckCircle2 },
            { label:'Total Blocks', value: summary.total_stations, color:'var(--color-primary)',  icon: ClipboardList },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="gw-card flex items-center gap-3 py-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background:`color-mix(in srgb, ${color} 15%, transparent)` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="font-mono font-bold text-xl text-text-primary leading-none">{loading ? '—' : value}</div>
                <div className="text-xs text-text-secondary font-ui mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Priority alert banner */}
        {priorityCount > 0 && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-lg border-l-4"
               style={{ borderColor:'var(--color-risk-critical)', background:'color-mix(in srgb, var(--color-risk-critical) 8%, var(--color-surface-card))' }}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-risk-critical" />
            <div>
              <p className="font-ui font-bold text-sm text-risk-critical">Field Verification Required</p>
              <p className="font-ui text-xs text-text-secondary mt-0.5">
                {summary.critical} critical + {summary.high} high-risk stations require on-ground inspection
                and intervention planning this week.
              </p>
            </div>
          </div>
        )}

        {/* Search + Filter toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search station name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-md border border-border-ui bg-surface-card text-text-primary text-sm font-ui focus:outline-none focus-visible:ring-2"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['ALL','CRITICAL','HIGH','MODERATE','LOW'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-2 text-[11px] font-bold font-mono rounded transition-colors border ${
                  filter === lvl
                    ? lvl === 'CRITICAL' ? 'bg-risk-critical text-white border-risk-critical'
                    : lvl === 'HIGH'     ? 'bg-risk-high text-white border-risk-high'
                    : lvl === 'MODERATE' ? 'bg-risk-watch text-[#3D2E06] border-risk-watch'
                    : lvl === 'LOW'      ? 'bg-risk-normal text-white border-risk-normal'
                    : 'bg-text-primary text-surface-page border-text-primary'
                    : 'bg-surface-card text-text-secondary border-border-ui hover:text-text-primary'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Station table */}
        <div className="gw-card p-0 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border-ui bg-surface-page">
            {['Station', 'Risk Level', 'GW Depth', 'Predicted', 'Score', ''].map((h, i) => (
              <div key={i} className={`text-[10px] font-bold uppercase tracking-wider text-text-muted font-ui ${
                i === 0 ? 'col-span-4' : i === 1 ? 'col-span-2' : i === 5 ? 'col-span-1 text-right' : 'col-span-1'
              }`}>{h}</div>
            ))}
            <div className="col-span-1" />
          </div>

          {loading ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">Loading stations…</div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">No stations match your filter.</div>
          ) : (
            <div>
              {visible.map((s, i) => {
                const needsAction = s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH'
                return (
                <Link
                  key={s.station}
                  to={needsAction
                    ? `/intervention/${encodeURIComponent(s.station)}`
                    : `/block/${encodeURIComponent(s.station)}`}
                  className={`grid grid-cols-12 gap-2 px-5 py-4 items-center border-b border-border-ui hover:bg-surface-card transition-colors group ${
                    i % 2 === 0 ? '' : 'bg-surface-page/50'
                  } ${s.risk_level === 'CRITICAL' ? 'border-l-4 border-l-risk-critical' : s.risk_level === 'HIGH' ? 'border-l-2 border-l-risk-high' : ''}`}
                >
                  <div className="col-span-4 font-ui font-semibold text-sm text-text-primary truncate pr-2">
                    {s.station}
                  </div>
                  <div className="col-span-2">
                    <RiskBadge level={s.risk_level} />
                  </div>
                  <div className="col-span-2 font-mono text-sm text-text-primary">
                    {fmtGW(s.current_groundwater)}
                  </div>
                  <div className="col-span-2 font-mono text-sm text-text-secondary">
                    {fmtGW(s.predicted_groundwater)}
                  </div>
                  <div className="col-span-1 font-mono text-sm text-text-secondary">
                    {s.risk_score ?? '—'}
                  </div>
                  <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                    {needsAction && (
                      <span className="hidden md:inline text-[10px] font-bold font-ui uppercase tracking-wider text-risk-high">Action Plan</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-text-muted font-ui text-right">
          Showing {visible.length} of {stations.length} stations
        </p>
      </div>
    </div>
  )
}
