import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, ChevronRight, ArrowLeft, Sprout, HardHat, CheckCircle2 } from 'lucide-react'
import { api, Subscriber } from '../lib/api'

const CATEGORIES = [
  { id: 'farmer' as const,      label: 'Farmer',       ta: 'விவசாயி',      icon: Sprout  },
  { id: 'construction' as const, label: 'Construction', ta: 'கட்டுமானம்', icon: HardHat },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'register' | 'login'>('register')

  const [stations, setStations] = useState<string[]>([])
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [area, setArea]         = useState('')
  const [category, setCategory] = useState<'farmer' | 'construction'>('farmer')

  const [loginPhone, setLoginPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<Subscriber | null>(null)

  useEffect(() => {
    api.stations().then(d => {
      setStations(d.stations)
      if (d.stations.length > 0) setArea(d.stations[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gw_subscriber')
      if (saved) setResult(JSON.parse(saved))
    } catch {}
  }, [])

  const saveSubscriber = (s: Subscriber) => {
    setResult(s)
    try { localStorage.setItem('gw_subscriber', JSON.stringify(s)) } catch {}
  }

  const submitRegister = async () => {
    setError(null)
    if (!name.trim()) return setError('Please enter your name.')
    if (phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid 10-digit mobile number.')
    if (!area) return setError('Please select your area.')

    setSubmitting(true)
    try {
      const res = await api.register({ name, phone, area, category, email: email || undefined })
      saveSubscriber(res.subscriber)
    } catch (e: any) {
      setError(e.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitLogin = async () => {
    setError(null)
    if (loginPhone.replace(/\D/g, '').length < 10) return setError('Please enter a valid 10-digit mobile number.')

    setSubmitting(true)
    try {
      const res = await api.login(loginPhone)
      saveSubscriber(res.subscriber)
    } catch (e: any) {
      setError(e.message || 'No registration found for this number.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setName(''); setPhone(''); setEmail(''); setLoginPhone('')
    try { localStorage.removeItem('gw_subscriber') } catch {}
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">

        {/* Back */}
        <button onClick={() => navigate('/login')} className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 text-sm font-ui">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Droplets className="text-primary w-8 h-8" />
            <span className="text-2xl font-bold font-ui text-text-primary tracking-tight">
              Ground<span className="text-primary">Watch</span>
            </span>
          </div>
          <p className="text-text-secondary text-sm">Groundwater Alert Registration</p>
          <p className="font-tamil text-text-muted text-sm mt-1">
            நிலத்தடி நீர் எச்சரிக்கை பதிவு
          </p>
        </div>

        {result ? (
          /* ── Confirmation ── */
          <div className="gw-card text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
            <div>
              <div className="font-bold font-ui text-text-primary text-lg">You're registered</div>
              <p className="font-tamil text-text-muted text-sm mt-1">நீங்கள் பதிவு செய்யப்பட்டுள்ளீர்கள்</p>
            </div>
            <div className="text-left space-y-2 pt-2 border-t border-border-ui">
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Name</span><span className="text-text-primary font-semibold">{result.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Mobile</span><span className="text-text-primary font-mono">{result.phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Area</span><span className="text-text-primary font-semibold">{result.area}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Category</span><span className="text-text-primary font-semibold capitalize">{result.category}</span></div>
              {result.email && (
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Email</span><span className="text-text-primary">{result.email}</span></div>
              )}
            </div>
            <p className="text-text-muted text-xs leading-relaxed pt-2">
              You'll receive an SMS and email alert when groundwater in {result.area} reaches a CRITICAL level.
            </p>
            <button onClick={reset} className="w-full py-2.5 rounded-lg font-ui font-semibold text-sm border border-border-ui text-text-secondary hover:text-text-primary transition-colors">
              Register a different number
            </button>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setMode('register'); setError(null) }}
                className={"py-2.5 rounded-lg font-ui font-semibold text-sm transition-all " +
                  (mode === 'register' ? 'bg-primary text-white' : 'bg-surface-card text-text-secondary border border-border-ui')}
              >
                Register
              </button>
              <button
                onClick={() => { setMode('login'); setError(null) }}
                className={"py-2.5 rounded-lg font-ui font-semibold text-sm transition-all " +
                  (mode === 'login' ? 'bg-primary text-white' : 'bg-surface-card text-text-secondary border border-border-ui')}
              >
                Login
              </button>
            </div>

            {mode === 'register' ? (
              <div className="gw-card space-y-4">
                <div>
                  <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Full Name / முழு பெயர்
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Mobile Number / கைபேசி எண்
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                    className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Select Area / பகுதி
                  </label>
                  <select
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
                  >
                    {stations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    I am a / நான் ஒரு
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map(c => {
                      const isSelected = category === c.id
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCategory(c.id)}
                          className="p-3 rounded-md border-2 text-left transition-all"
                          style={{
                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border-ui)',
                            background: isSelected
                              ? 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-card))'
                              : 'var(--color-surface-card)',
                          }}
                        >
                          <c.icon className="w-5 h-5 mb-1.5" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
                          <div className="font-semibold font-ui text-sm text-text-primary">{c.label}</div>
                          <div className="font-tamil text-xs text-text-secondary">{c.ta}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Email (optional)
                  </label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
                  />
                </div>

                {error && <p className="text-risk-critical text-xs font-ui">{error}</p>}

                <button
                  onClick={submitRegister}
                  disabled={submitting}
                  className="w-full py-3 rounded-lg font-ui font-bold text-base flex items-center justify-center gap-2 text-white bg-primary transition-opacity disabled:opacity-60"
                >
                  {submitting ? 'Registering…' : 'Register for Alerts'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="gw-card space-y-4">
                <div>
                  <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Mobile Number / கைபேசி எண்
                  </label>
                  <input
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                    className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
                  />
                </div>

                {error && <p className="text-risk-critical text-xs font-ui">{error}</p>}

                <button
                  onClick={submitLogin}
                  disabled={submitting}
                  className="w-full py-3 rounded-lg font-ui font-bold text-base flex items-center justify-center gap-2 text-white bg-primary transition-opacity disabled:opacity-60"
                >
                  {submitting ? 'Checking…' : 'Find My Registration'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-center text-text-muted text-xs leading-relaxed">
              Free SMS &amp; email alerts when groundwater turns critical in your area.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
