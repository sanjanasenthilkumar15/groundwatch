import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, Search, Send, Users, Sprout, HardHat, MapPin, AlertTriangle, CheckCircle2, UserPlus, Trash2, ShieldCheck, Building2, Droplets, ChevronRight } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, RiskMapEntry, RiskMapResponse, Subscriber, Officer } from '../lib/api'
import { fmtGW } from '../lib/utils'

const WORKFLOWS = [
  { to: '/admin/construction',    label: 'Construction Projects', desc: 'Groundwater risk review for pending construction applications', icon: Building2, accent: 'var(--color-secondary)' },
  { to: '/admin/extraction',      label: 'Extraction Requests',   desc: 'Groundwater extraction applications pending review',            icon: Droplets,  accent: 'var(--color-primary)' },
  { to: '/admin/advisory',        label: 'Advisory Broadcasts',   desc: 'Send a seasonal groundwater advisory SMS to farmers or construction workers by block', icon: Sprout, accent: 'var(--color-risk-normal)' },
]

const ROLE_OPTIONS: { id: Officer['role']; label: string }[] = [
  { id: 'district',    label: 'District Officer' },
  { id: 'block',       label: 'Block/Taluk Officer' },
  { id: 'agriculture', label: 'Agriculture Officer' },
  { id: 'admin',       label: 'Admin' },
]

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub?: string; color?: string; icon: any }) {
  return (
    <div className="gw-card py-5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: `color-mix(in srgb, ${color ?? 'var(--color-primary)'} 15%, transparent)` }}>
        <Icon className="w-4 h-4" style={{ color: color ?? 'var(--color-primary)' }} />
      </div>
      <div>
        <div className="font-mono font-bold text-2xl text-text-primary leading-none">{value}</div>
        <div className="text-xs text-text-secondary font-ui mt-1">{label}</div>
        {sub && <div className="text-[10px] text-text-muted font-ui mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

type AlertResult = {
  notified_count: number
  risk_level: string
  message_preview: string
}

export default function AdminPage() {
  const [riskData, setRiskData]         = useState<RiskMapResponse | null>(null)
  const [subscribers, setSubscribers]   = useState<Subscriber[]>([])
  const [loading, setLoading]           = useState(true)

  const [query, setQuery]               = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'farmer' | 'construction'>('ALL')
  const [areaFilter, setAreaFilter]     = useState('ALL')

  const [sendingStation, setSendingStation] = useState<string | null>(null)
  const [alertResults, setAlertResults] = useState<Record<string, AlertResult>>({})
  const [alertError, setAlertError]     = useState<string | null>(null)

  const [officers, setOfficers] = useState<Officer[]>([])
  const [blocks, setBlocks]     = useState<string[]>([])
  const [newUsername, setNewUsername]       = useState('')
  const [newPassword, setNewPassword]       = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newRole, setNewRole]               = useState<Officer['role']>('block')
  const [newBlock, setNewBlock]             = useState('')
  const [officerError, setOfficerError]     = useState<string | null>(null)
  const [creatingOfficer, setCreatingOfficer] = useState(false)

  const loadOfficers = () => api.listOfficers().then(res => setOfficers(res.officers))

  useEffect(() => {
    Promise.all([api.riskMap(), api.listSubscribers(), api.listOfficers(), api.blocks()])
      .then(([risk, subs, offs, blks]) => {
        setRiskData(risk)
        setSubscribers(subs.subscribers)
        setOfficers(offs.officers)
        setBlocks(blks.blocks)
        if (blks.blocks.length > 0) setNewBlock(blks.blocks[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const createOfficer = async () => {
    setOfficerError(null)
    if (!newUsername.trim() || !newPassword || !newDisplayName.trim()) {
      setOfficerError('Fill in username, password, and display name.')
      return
    }
    if (newPassword.length < 6) {
      setOfficerError('Password must be at least 6 characters.')
      return
    }
    if (newRole === 'block' && !newBlock) {
      setOfficerError('Select a block for this Block Officer.')
      return
    }
    setCreatingOfficer(true)
    try {
      await api.createOfficer({
        username: newUsername.trim(),
        password: newPassword,
        display_name: newDisplayName.trim(),
        role: newRole,
        assigned_block: newRole === 'block' ? newBlock : undefined,
      })
      setNewUsername('')
      setNewPassword('')
      setNewDisplayName('')
      await loadOfficers()
    } catch (e: any) {
      setOfficerError(e.message || 'Failed to create officer account.')
    } finally {
      setCreatingOfficer(false)
    }
  }

  const removeOfficer = async (id: number) => {
    if (!confirm('Remove this officer account? They will no longer be able to log in.')) return
    try {
      await api.deleteOfficer(id)
      await loadOfficers()
    } catch (e: any) {
      setOfficerError(e.message || 'Failed to delete officer account.')
    }
  }

  const stations: RiskMapEntry[] = riskData?.stations ?? []
  const needsAlert = stations.filter(s => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH')

  const subscribersByArea = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of subscribers) map[s.area] = (map[s.area] ?? 0) + 1
    return map
  }, [subscribers])

  const areas = useMemo(() => Array.from(new Set(subscribers.map(s => s.area))).sort(), [subscribers])

  const visibleSubscribers = subscribers
    .filter(s => categoryFilter === 'ALL' || s.category === categoryFilter)
    .filter(s => areaFilter === 'ALL' || s.area === areaFilter)
    .filter(s => (s.name + s.phone).toLowerCase().includes(query.toLowerCase()))

  const sendAlert = async (station: string) => {
    setAlertError(null)
    setSendingStation(station)
    try {
      const res = await api.notifySubscribers(station)
      setAlertResults(prev => ({
        ...prev,
        [station]: {
          notified_count: res.notified_count,
          risk_level: res.risk_level,
          message_preview: res.message_preview,
        },
      }))
    } catch (e: any) {
      setAlertError(e.message || `Failed to send alert for ${station}`)
    } finally {
      setSendingStation(null)
    }
  }

  const farmerCount      = subscribers.filter(s => s.category === 'farmer').length
  const constructionCount = subscribers.filter(s => s.category === 'construction').length

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-14 max-w-5xl mx-auto px-4 md:px-6 pb-12">

        {/* Page header */}
        <div className="py-6 border-b border-border-ui mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Megaphone className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold font-ui text-text-primary tracking-tight">
              Admin — Alert Subscriber Management
            </h1>
          </div>
          <p className="text-text-secondary text-sm">
            Manage registered farmers &amp; construction crews · Trigger SMS &amp; email advisories · Salem District
          </p>
        </div>

        {/* Primary workflows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {WORKFLOWS.map(w => (
            <Link
              key={w.to}
              to={w.to}
              className="gw-card flex items-start gap-3 hover:border-primary transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: `color-mix(in srgb, ${w.accent} 15%, transparent)` }}>
                <w.icon className="w-5 h-5" style={{ color: w.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-ui font-bold text-sm text-text-primary flex items-center gap-1">
                  {w.label}
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors" />
                </div>
                <div className="text-xs text-text-secondary mt-1 leading-relaxed">{w.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Subscribers" value={loading ? '—' : String(subscribers.length)} icon={Users} />
          <StatCard label="Farmers" value={loading ? '—' : String(farmerCount)} icon={Sprout} color="var(--color-risk-normal)" />
          <StatCard label="Construction Workers" value={loading ? '—' : String(constructionCount)} icon={HardHat} color="var(--color-secondary)" />
          <StatCard label="Areas Covered" value={loading ? '—' : String(areas.length)} icon={MapPin} color="var(--color-accent)" />
        </div>

        {alertError && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-lg border-l-4"
               style={{ borderColor: 'var(--color-risk-critical)', background: 'color-mix(in srgb, var(--color-risk-critical) 8%, var(--color-surface-card))' }}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-risk-critical" />
            <p className="font-ui text-sm text-risk-critical">{alertError}</p>
          </div>
        )}

        {/* Stations needing alerts */}
        <div className="gw-card p-0 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border-ui flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-risk-high" />
            <h2 className="text-sm font-bold font-ui text-text-primary">Stations Needing Alerts</h2>
            <span className="ml-auto font-mono text-xs text-text-muted">{needsAlert.length} stations</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-text-secondary text-sm">Loading…</div>
          ) : needsAlert.length === 0 ? (
            <div className="p-6 text-center text-success text-sm font-ui font-semibold">
              ✓ No critical or high-risk stations right now
            </div>
          ) : (
            <div>
              {needsAlert.map(s => {
                const result = alertResults[s.station]
                const subCount = subscribersByArea[s.station] ?? 0
                return (
                  <div key={s.station} className="border-b border-border-ui last:border-0 px-5 py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <RiskBadge level={s.risk_level} />
                        <div>
                          <div className="font-ui font-semibold text-sm text-text-primary">{s.station}</div>
                          <div className="font-mono text-xs text-text-secondary mt-0.5">{fmtGW(s.current_groundwater)} depth · {subCount} registered subscriber{subCount === 1 ? '' : 's'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => sendAlert(s.station)}
                        disabled={sendingStation === s.station}
                        className="gw-btn flex items-center gap-2 disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        {sendingStation === s.station ? 'Sending…' : 'Send Alert'}
                      </button>
                    </div>

                    {result && (
                      <div className="mt-3 rounded-md border border-border-ui bg-surface-page p-3">
                        <div className="flex items-center gap-1.5 text-xs font-ui font-bold text-success mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Preview generated for {result.notified_count} subscriber{result.notified_count === 1 ? '' : 's'} — SMS/email not actually sent (demo)
                        </div>
                        <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">{result.message_preview}</pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Subscriber directory */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-sm font-bold font-ui text-text-primary">Subscriber Directory</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-md border border-border-ui bg-surface-card text-text-primary text-sm font-ui focus:outline-none"
            />
          </div>
          <select
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
          >
            <option value="ALL">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="flex gap-1.5">
            {(['ALL', 'farmer', 'construction'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-2 text-[11px] font-bold font-mono rounded transition-colors border capitalize ${
                  categoryFilter === c
                    ? 'bg-text-primary text-surface-page border-text-primary'
                    : 'bg-surface-card text-text-secondary border-border-ui hover:text-text-primary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="gw-card p-0 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border-ui bg-surface-page">
            {['Name', 'Phone', 'Area', 'Type', 'Email'].map((h, i) => (
              <div key={i} className={`text-[10px] font-bold uppercase tracking-wider text-text-muted font-ui ${
                i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-3' : i === 3 ? 'col-span-2' : 'col-span-2'
              }`}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">Loading subscribers…</div>
          ) : visibleSubscribers.length === 0 ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">No subscribers match your filter.</div>
          ) : (
            <div>
              {visibleSubscribers.map((s, i) => (
                <div key={s.phone} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-border-ui last:border-0 ${i % 2 === 0 ? '' : 'bg-surface-page/50'}`}>
                  <div className="col-span-3 font-ui font-semibold text-sm text-text-primary truncate pr-2">{s.name}</div>
                  <div className="col-span-2 font-mono text-sm text-text-primary">{s.phone}</div>
                  <div className="col-span-3 font-ui text-sm text-text-secondary truncate pr-2">{s.area}</div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1 text-xs font-ui font-semibold capitalize text-text-secondary">
                      {s.category === 'farmer' ? <Sprout className="w-3.5 h-3.5 text-risk-normal" /> : <HardHat className="w-3.5 h-3.5 text-secondary" />}
                      {s.category}
                    </span>
                  </div>
                  <div className="col-span-2 font-ui text-xs text-text-muted truncate">{s.email ?? '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-text-muted font-ui text-right">
          Showing {visibleSubscribers.length} of {subscribers.length} subscribers
        </p>

        {/* Officer accounts */}
        <div className="mt-10 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold font-ui text-text-primary">Officer Accounts</h2>
          <span className="ml-auto font-mono text-xs text-text-muted">{officers.length} officers</span>
        </div>

        <div className="gw-card mb-4">
          <div className="gw-section-label mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Create Officer Account
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Username"
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            />
            <input
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Temporary password"
              type="password"
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            />
            <input
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              placeholder="Display name"
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as Officer['role'])}
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            >
              {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {newRole === 'block' && (
              <select
                value={newBlock}
                onChange={e => setNewBlock(e.target.value)}
                className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none sm:col-span-2"
              >
                {blocks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
          </div>

          {officerError && <p className="text-risk-critical text-xs font-ui mt-3">{officerError}</p>}

          <button
            onClick={createOfficer}
            disabled={creatingOfficer}
            className="gw-btn mt-4 flex items-center gap-2 disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            {creatingOfficer ? 'Creating…' : 'Create Account'}
          </button>
        </div>

        <div className="gw-card p-0 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border-ui bg-surface-page">
            {['Username', 'Display Name', 'Role', 'Block', ''].map((h, i) => (
              <div key={i} className={`text-[10px] font-bold uppercase tracking-wider text-text-muted font-ui ${
                i === 0 ? 'col-span-3' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-3' : i === 3 ? 'col-span-2' : 'col-span-1 text-right'
              }`}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">Loading officers…</div>
          ) : officers.length === 0 ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">No officer accounts yet.</div>
          ) : (
            <div>
              {officers.map((o, i) => (
                <div key={o.id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-border-ui last:border-0 ${i % 2 === 0 ? '' : 'bg-surface-page/50'}`}>
                  <div className="col-span-3 font-mono text-sm text-text-primary truncate pr-2">{o.username}</div>
                  <div className="col-span-3 font-ui text-sm text-text-secondary truncate pr-2">{o.display_name}</div>
                  <div className="col-span-3 text-xs font-ui font-semibold capitalize text-text-secondary">{o.role}</div>
                  <div className="col-span-2 font-ui text-xs text-text-muted truncate">{o.assigned_block ?? '—'}</div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => removeOfficer(o.id)} className="text-text-muted hover:text-risk-critical transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
