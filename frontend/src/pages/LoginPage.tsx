import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, ChevronRight, LayoutDashboard, ClipboardList, Leaf, Users } from 'lucide-react'
import { useRole } from '../lib/RoleContext'

const ROLES = [
  {
    id: 'district',
    label: 'District Officer',
    ta: 'மாவட்ட அதிகாரி',
    description: 'Command dashboard · Priority intervention list · All-station KPIs',
    icon: LayoutDashboard,
    route: '/dashboard',
    accent: 'var(--color-primary)',
  },
  {
    id: 'block',
    label: 'Block / Taluk Officer',
    ta: 'வட்ட அதிகாரி',
    description: 'Station-level field console · Search & filter · Intervention planning',
    icon: ClipboardList,
    route: '/block-dashboard',
    accent: 'var(--color-secondary)',
  },
  {
    id: 'agriculture',
    label: 'Agriculture Officer',
    ta: 'வேளாண்மை அதிகாரி',
    description: 'Crop advisory status · Irrigation stress zones · Seasonal outlook',
    icon: Leaf,
    route: '/agriculture',
    accent: 'var(--color-success)',
  },
  {
    id: 'farmer',
    label: 'Farmer',
    ta: 'விவசாயி',
    description: 'Simple advisory in Tamil & English · Well status · SMS alert',
    icon: Users,
    route: '/farmer',
    accent: 'var(--color-accent)',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setRole } = useRole()
  const [selected, setSelected] = useState<string | null>(null)

  const proceed = () => {
    if (!selected) return
    const role = ROLES.find(r => r.id === selected)!
    setRole(selected as any)
    navigate(role.route)
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

        {/* Role cards */}
        <div className="space-y-2.5">
          <div className="gw-section-label mb-4">Select your role to continue</div>
          {ROLES.map(r => {
            const isSelected = selected === r.id
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className="w-full text-left p-4 rounded-lg border-2 transition-all focus:outline-none"
                style={{
                  borderColor: isSelected ? r.accent : 'var(--color-border-ui)',
                  background: isSelected
                    ? `color-mix(in srgb, ${r.accent} 12%, var(--color-surface-card))`
                    : 'var(--color-surface-card)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon pip */}
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: isSelected ? r.accent : 'var(--color-border-ui)' }}
                  >
                    <r.icon className="w-4 h-4" style={{ color: isSelected ? '#fff' : 'var(--color-text-secondary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold font-ui text-sm text-text-primary">{r.label}</div>
                    <div className="font-tamil text-xs text-text-secondary mt-0.5">{r.ta}</div>
                    <div className="text-xs text-text-muted font-ui mt-1 leading-relaxed">{r.description}</div>
                  </div>
                  {/* Radio dot */}
                  <div
                    className="w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-all"
                    style={{
                      borderColor: isSelected ? r.accent : 'var(--color-border-ui)',
                      background: isSelected ? r.accent : 'transparent',
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <button
          onClick={proceed}
          disabled={!selected}
          className="w-full py-3 rounded-lg font-ui font-bold text-base flex items-center justify-center gap-2 transition-all"
          style={{
            background: selected
              ? (ROLES.find(r => r.id === selected)?.accent ?? 'var(--color-primary)')
              : 'var(--color-border-ui)',
            color: selected ? '#fff' : 'var(--color-text-muted)',
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          Enter Dashboard <ChevronRight className="w-4 h-4" />
        </button>

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
