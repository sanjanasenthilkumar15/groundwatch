import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, ArrowRight } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, ConstructionProject } from '../lib/api'

export default function ConstructionProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ConstructionProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listConstructionProjects().then(res => setProjects(res.projects)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-3xl mx-auto pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">Construction Projects</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Groundwater risk review for pending construction applications</p>
          </div>
        </div>

        <div className="gw-card p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">Loading projects…</div>
          ) : (
            <div>
              {projects.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/admin/construction/${p.id}`}
                  className={`flex items-center justify-between px-5 py-4 border-b border-border-ui last:border-0 hover:bg-surface-page transition-colors group ${i % 2 === 0 ? '' : 'bg-surface-page/50'}`}
                >
                  <div>
                    <div className="font-ui font-semibold text-sm text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{p.block}, Salem</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level={p.risk_level} />
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
