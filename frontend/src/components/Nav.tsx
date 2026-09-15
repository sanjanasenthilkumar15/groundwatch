import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Droplets, LayoutDashboard, Map as MapIcon, Bell, LogOut, Moon, Sun } from 'lucide-react'
import { useRole } from '../lib/RoleContext'
import { useTheme } from '../lib/ThemeContext'

export default function Nav() {
  const { role, setRole } = useRole()
  const { theme, setTheme } = useTheme()
  const loc = useLocation()
  const navigate = useNavigate()

  if (role === 'farmer') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-card border-t border-border-ui z-50 flex items-center justify-around px-4">
        <Link to="/farmer" className={`flex flex-col items-center gap-1 ${loc.pathname === '/farmer' ? 'text-primary' : 'text-text-secondary'}`}>
          <Droplets className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-ui">தற்போதைய நிலை</span>
        </Link>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex flex-col items-center gap-1 text-text-secondary">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[10px] font-semibold font-ui">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button onClick={() => { setRole(null); navigate('/login') }} className="flex flex-col items-center gap-1 text-text-secondary">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-ui">வெளியேறு</span>
        </button>
      </nav>
    )
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/risk-map',  label: 'Risk Map',  icon: MapIcon },
    { to: '/alerts',    label: 'Alerts',    icon: Bell },
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
        <div className="px-2.5 py-1 rounded-sm border-0 bg-secondary text-white text-[10px] font-bold uppercase tracking-wider font-mono">
          {role ? role.replace('_', ' ') : 'OFFICER'}
        </div>
        <button onClick={() => { setRole(null); navigate('/login') }} className="p-1.5 text-text-secondary hover:text-text-primary transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}




