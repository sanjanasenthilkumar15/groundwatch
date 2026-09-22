import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, ChevronRight, LogIn } from 'lucide-react'
import { useRole, ROUTE_BY_ROLE } from '../lib/RoleContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useRole()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
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
    } catch (e: any) {
      setError(e.message || 'Login failed. Check your username and password.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Droplets className="text-primary w-8 h-8" />
            <span className="text-2xl font-bold font-ui text-text-primary tracking-tight">
              Ground<span className="text-primary">Watch</span>
            </span>
          </div>
          <p className="text-text-secondary text-sm">Salem District Groundwater Intelligence</p>
          <p className="font-tamil text-text-muted text-sm mt-1">
            சேலம் மாவட்ட நிலத்தடி நீர் கண்காணிப்பு
          </p>
        </div>

        {/* Officer login form */}
        <form onSubmit={submit} className="gw-card space-y-4">
          <div className="gw-section-label mb-1 flex items-center gap-2">
            <LogIn className="w-4 h-4" /> Officer Login
          </div>

          <div>
            <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-ui font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-md border border-border-ui bg-surface-card text-text-primary px-4 py-3 text-base font-ui focus:outline-none"
            />
          </div>

          {error && <p className="text-risk-critical text-xs font-ui">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-ui font-bold text-base flex items-center justify-center gap-2 text-white bg-primary transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign In'} <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        {/* Alert subscriber entry point */}
        <button
          onClick={() => navigate('/register')}
          className="w-full text-center py-3 rounded-lg border border-border-ui text-text-secondary hover:text-text-primary hover:border-primary transition-colors text-sm font-ui font-semibold"
        >
          Farmer or Construction worker? Register for SMS &amp; Email alerts →
        </button>

        <p className="text-center text-text-muted text-xs leading-relaxed">
          NWDP Survey Data · XGBoost + GEE Satellite Model<br />
          Tamil Nadu Groundwater Board
        </p>
      </div>
    </div>
  )
}
