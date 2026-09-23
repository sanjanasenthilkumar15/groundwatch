import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Droplets, ChevronRight, ArrowLeft,
  LayoutDashboard, ClipboardList, Leaf, Megaphone, Sprout, HardHat,
} from 'lucide-react'
import { useRole, ROUTE_BY_ROLE, Role } from '../lib/RoleContext'
import { api, Subscriber } from '../lib/api'

// ── Officer roles (username + password) ───────────────────────────────────────
const OFFICER_ROLES: {
  id: Exclude<Role, null>
  label: string
  ta: string
  icon: any
  accent: string
  desc: string
}[] = [
  {
    id: 'district',
    label: 'District Officer',
    ta: 'மாவட்ட அதிகாரி',
    icon: LayoutDashboard,
    accent: 'var(--color-primary)',
    desc: 'District-wide command dashboard',
  },
  {
    id: 'block',
    label: 'Block / Taluk Officer',
    ta: 'வட்ட அதிகாரி',
    icon: ClipboardList,
    accent: 'var(--color-secondary)',
    desc: 'Your assigned block station console',
  },
  {
    id: 'agriculture',
    label: 'Agriculture Officer',
    ta: 'வேளாண்மை அதிகாரி',
    icon: Leaf,
    accent: 'var(--color-risk-normal)',
    desc: 'Crop advisory & irrigation stress zones',
  },
  {
    id: 'admin',
    label: 'Admin',
    ta: 'நிர்வாகி',
    icon: Megaphone,
    accent: 'var(--color-accent)',
    desc: 'Manage subscribers & trigger alerts',
  },
]

type View =
  | { type: 'roles' }
  | { type: 'officer'; roleId: Exclude<Role, null> }
  | { type: 'farmer' }

function saveSubscriber(sub: Subscriber) {
  localStorage.setItem('gw_subscriber', JSON.stringify(sub))
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useRole()

  // ── shared state ──────────────────────────────────────────────
  const [view, setView] = useState<View>({ type: 'roles' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── officer credentials ───────────────────────────────────────
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // ── farmer / construction ─────────────────────────────────────
  const [farmerTab, setFarmerTab] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [category, setCategory] = useState<'farmer' | 'construction'>('farmer')

  // ── helpers ───────────────────────────────────────────────────
  function back() {
    setView({ type: 'roles' })
    setError(null)
    setUsername('')
    setPassword('')
    setPhone('')
    setName('')
  }

  // ── officer submit ────────────────────────────────────────────
  const submitOfficer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setSubmitting(true)
    try {
      const officer = await login(username.trim(), password)
      navigate(ROUTE_BY_ROLE[officer.role] ?? '/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.')
      setSubmitting(false)
    }
  }

  // ── farmer login ──────────────────────────────────────────────
  const submitFarmerLogin = async () => {
    setError(null)
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.login(digits)
      saveSubscriber(res.subscriber)
      navigate('/advisory')
    } catch (err: any) {
      setError(err.message || 'No registration found for this number.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── farmer register ───────────────────────────────────────────
  const submitFarmerRegister = async () => {
    setError(null)
    const digits = phone.replace(/\D/g, '')
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!area.trim()) { setError('Please enter your area / village.'); return }
    if (digits.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return }
    setSubmitting(true)
    try {
      const res = await api.register({ name: name.trim(), area: area.trim(), phone: digits, category })
      saveSubscriber(res.subscriber)
      navigate('/advisory')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── selected officer role meta ────────────────────────────────
  const officerRole =
    view.type === 'officer' ? OFFICER_ROLES.find(r => r.id === view.roleId) : null

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">

        {/* ── Brand ─────────────────────────────────────────── */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplets className="text-primary w-7 h-7" />
            <span className="text-2xl font-bold font-ui text-text-primary tracking-tight">
              Ground<span className="text-primary">Watch</span>
            </span>
          </div>
          <p className="text-text-secondary text-sm">Salem District Groundwater Intelligence</p>
          <p className="font-tamil text-text-muted text-xs mt-0.5">
            சேலம் மாவட்ட நிலத்தடி நீர் கண்காணிப்பு
          </p>
        </div>

        {/* ════════════════════════════════════════════════════
            VIEW: Role picker
        ════════════════════════════════════════════════════ */}
        {view.type === 'roles' && (
          <div className="space-y-2.5">
            <p className="gw-section-label mb-1">Select your role to continue</p>

            {/* Officer roles */}
            {OFFICER_ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { setView({ type: 'officer', roleId: r.id }); setError(null) }}
                className="w-full text-left p-4 rounded-lg border-2 border-border-ui bg-surface-card
                           transition-all hover:border-primary focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${r.accent} 15%, transparent)` }}
                  >
                    <r.icon className="w-4 h-4" style={{ color: r.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold font-ui text-sm text-text-primary">{r.label}</div>
                    <div className="font-tamil text-xs text-text-secondary mt-0.5">{r.ta}</div>
                    <div className="text-xs text-text-muted font-ui mt-0.5">{r.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                </div>
              </button>
            ))}

            {/* Farmer / Construction — public flow */}
            <button
              onClick={() => { setView({ type: 'farmer' }); setError(null) }}
              className="w-full text-left p-4 rounded-lg border-2 border-border-ui bg-surface-card
                         transition-all hover:border-primary focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--color-risk-normal) 15%, transparent)' }}
                >
                  <Sprout className="w-4 h-4" style={{ color: 'var(--color-risk-normal)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-ui text-sm text-text-primary flex items-center gap-1.5">
                    Farmer <span className="text-text-muted">/</span>
                    <HardHat className="w-3.5 h-3.5 text-text-muted" /> Construction Worker
                  </div>
                  <div className="font-tamil text-xs text-text-secondary mt-0.5">விவசாயி / கட்டுமான தொழிலாளர்</div>
                  <div className="text-xs text-text-muted font-ui mt-0.5">Register or login with your mobile number</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
              </div>
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            VIEW: Officer credentials
        ════════════════════════════════════════════════════ */}
        {view.type === 'officer' && officerRole && (
          <>
            <button
              onClick={back}
              className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 text-sm font-ui -mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Choose a different role
            </button>

            <form onSubmit={submitOfficer} className="gw-card space-y-4">
              {/* Role header */}
              <div className="flex items-center gap-3 pb-2 border-b border-border-ui">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${officerRole.accent} 15%, transparent)` }}
                >
                  <officerRole.icon className="w-4 h-4" style={{ color: officerRole.accent }} />
                </div>
                <div>
                  <div className="font-ui font-bold text-sm text-text-primary">{officerRole.label}</div>
                  <div className="font-tamil text-xs text-text-secondary">{officerRole.ta}</div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="Enter your username"
                  className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary
                             px-4 py-3 text-base font-ui focus:outline-none focus:border-primary"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary
                             px-4 py-3 text-base font-ui focus:outline-none focus:border-primary"
                />
              </div>

              {error && <p className="text-risk-critical text-xs font-ui">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg font-ui font-bold text-base flex items-center
                           justify-center gap-2 text-white transition-opacity disabled:opacity-60"
                style={{ background: officerRole.accent }}
              >
                {submitting ? 'Signing in…' : 'Sign In'} <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            VIEW: Farmer / Construction
        ════════════════════════════════════════════════════ */}
        {view.type === 'farmer' && (
          <>
            <button
              onClick={back}
              className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 text-sm font-ui -mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Choose a different role
            </button>

            <div className="gw-card space-y-4">
              {/* Role header */}
              <div className="flex items-center gap-3 pb-2 border-b border-border-ui">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--color-risk-normal) 15%, transparent)' }}
                >
                  <Sprout className="w-4 h-4" style={{ color: 'var(--color-risk-normal)' }} />
                </div>
                <div>
                  <div className="font-ui font-bold text-sm text-text-primary">Farmer / Construction Worker</div>
                  <div className="font-tamil text-xs text-text-secondary">விவசாயி / கட்டுமான தொழிலாளர்</div>
                </div>
              </div>

              {/* Login / Register tabs */}
              <div className="grid grid-cols-2 gap-2">
                {(['login', 'register'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setFarmerTab(tab); setError(null) }}
                    className={`py-2.5 rounded-lg font-ui font-semibold text-sm capitalize transition-all ${
                      farmerTab === tab
                        ? 'bg-primary text-white'
                        : 'bg-surface-card text-text-secondary border border-border-ui'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── LOGIN tab ── */}
              {farmerTab === 'login' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      Mobile Number / மொபைல் எண்
                    </label>
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      inputMode="tel"
                      className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary
                                 px-4 py-3 text-base font-ui focus:outline-none focus:border-primary"
                    />
                  </div>
                  {error && <p className="text-risk-critical text-xs font-ui">{error}</p>}
                  <button
                    onClick={submitFarmerLogin}
                    disabled={submitting}
                    className="w-full py-3 rounded-lg font-ui font-bold text-base flex items-center
                               justify-center gap-2 text-white bg-primary transition-opacity disabled:opacity-60"
                  >
                    {submitting ? 'Looking up…' : 'Login'} <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-text-muted text-xs font-ui">
                    New here?{' '}
                    <button
                      onClick={() => { setFarmerTab('register'); setError(null) }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Register for alerts
                    </button>
                  </p>
                </div>
              )}

              {/* ── REGISTER tab ── */}
              {farmerTab === 'register' && (
                <div className="space-y-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      I am a…
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['farmer', 'construction'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-ui font-semibold capitalize transition-all ${
                            category === cat
                              ? 'border-primary bg-primary text-white'
                              : 'border-border-ui bg-surface-card text-text-secondary'
                          }`}
                        >
                          {cat === 'farmer'
                            ? <Sprout className="w-3.5 h-3.5" />
                            : <HardHat className="w-3.5 h-3.5" />}
                          {cat === 'farmer' ? 'Farmer' : 'Construction'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      Your Name / உங்கள் பெயர்
                    </label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary
                                 px-4 py-3 text-base font-ui focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      Area / Village / பகுதி
                    </label>
                    <input
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      placeholder="e.g. Amaram, Kullampatti"
                      className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary
                                 px-4 py-3 text-base font-ui focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      Mobile Number / மொபைல் எண்
                    </label>
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      inputMode="tel"
                      className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary
                                 px-4 py-3 text-base font-ui focus:outline-none focus:border-primary"
                    />
                  </div>

                  {error && <p className="text-risk-critical text-xs font-ui">{error}</p>}

                  <button
                    onClick={submitFarmerRegister}
                    disabled={submitting}
                    className="w-full py-3 rounded-lg font-ui font-bold text-base flex items-center
                               justify-center gap-2 text-white bg-primary transition-opacity disabled:opacity-60"
                  >
                    {submitting ? 'Registering…' : 'Register & Continue'} <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-text-muted text-xs font-ui">
                    Already registered?{' '}
                    <button
                      onClick={() => { setFarmerTab('login'); setError(null) }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Login with your number
                    </button>
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <p className="text-center text-text-muted text-xs leading-relaxed">
          NWDP Survey Data · XGBoost + GEE Satellite Model<br />
          Tamil Nadu Groundwater Board
        </p>
      </div>
    </div>
  )
}
