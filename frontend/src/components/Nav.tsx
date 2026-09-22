import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Droplets, LayoutDashboard, Map as MapIcon, Bell, LogOut, Moon, Sun } from 'lucide-react'
import { useRole, ROUTE_BY_ROLE } from '../lib/RoleContext'
import { useTheme } from '../lib/ThemeContext'

const LABEL_BY_ROLE: Record<string, string> = {
  district: 'Dashboard',
  block: 'Block Console',
  agriculture: 'Agriculture',
  admin: 'Admin',
}

export default function Nav() {
  const { role, officer, logout } = useRole()
  const { theme, setTheme } = useTheme()
  const loc = useLocation()
  const navigate = useNavigate()

  const homeTo    = (role && ROUTE_BY_ROLE[role]) || '/dashboard'
  const homeLabel = (role && LABEL_BY_ROLE[role]) || 'Dashboard'

  const links = [
    { to: homeTo,       label: homeLabel,   icon: LayoutDashboard },
    { to: '/risk-map',  label: 'Risk Map', icon: MapIcon },
    { to: '/alerts',    label: 'Alerts',   icon: Bell },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-surface-card border-b border-border-ui z-50 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Droplets className="text-primary w-5 h-5" />
          <span className="text-lg font-bold font-ui text-text-primary tracking-tight hidden sm:block">Ground<span className="text-primary">Watch</span></span>
        </div>
        <div className="flex items-center gap-1">
          {links.map(l => {
            const active = loc.pathname.startsWith(l.to)
            return (
              <Link key={l.to} to={l.to} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${active ? 'bg-secondary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'}`}>
                <l.icon className="w-4 h-4" />
                <span className="hidden sm:block">{l.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 text-text-secondary hover:text-text-primary transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="hidden md:block text-right leading-tight">
          <div className="text-xs font-semibold text-text-primary">{officer?.display_name ?? 'Officer'}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">
            {role ?? 'officer'}{officer?.assigned_block ? ` · ${officer.assigned_block}` : ''}
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="p-1.5 text-text-secondary hover:text-text-primary transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}




