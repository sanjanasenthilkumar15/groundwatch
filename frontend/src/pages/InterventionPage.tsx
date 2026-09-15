import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse } from '../lib/api'

export default function InterventionPage() {
  const { station } = useParams<{ station: string }>()
  const navigate = useNavigate()
  const stationName = station ? decodeURIComponent(station) : ''
  const [data, setData]       = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdvisory, setShowAdvisory] = useState(false)

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).finally(() => setLoading(false))
  }, [stationName])

  return (
    <div className="min-h-screen pb-20">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-4xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5 font-medium"><Target className="w-4 h-4" /> Intervention Planning</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-64 gw-skeleton"></div>
        ) : data ? (
          <>
            {/* Priority Banner */}
            <div className={`p-5 rounded-md border-l-4 ${data.risk.risk_level === 'CRITICAL' ? 'bg-surface-card border-risk-critical' : data.risk.risk_level === 'HIGH' ? 'bg-surface-card border-risk-high' : 'bg-surface-card border-ink-500'} flex items-start gap-4`}>
              {data.risk.risk_level === 'CRITICAL' || data.risk.risk_level === 'HIGH' ? (
                <AlertTriangle className={`w-6 h-6 mt-0.5 ${data.risk.risk_level === 'CRITICAL' ? 'text-risk-critical' : 'text-risk-high'}`} />
              ) : (
                <CheckCircle2 className="w-6 h-6 mt-0.5 text-success" />
              )}
              <div>
                <h2 className={`font-bold font-ui ${data.risk.risk_level === 'CRITICAL' ? 'text-risk-critical' : data.risk.risk_level === 'HIGH' ? 'text-risk-high' : 'text-text-primary'}`}>
                  {data.risk.risk_level === 'CRITICAL' || data.risk.risk_level === 'HIGH' ? 'Priority Intervention Required' : 'No Immediate Intervention Required'}
                </h2>
                <p className="text-text-secondary text-sm mt-1">
                  Model confidence: <span className="font-mono">{data.risk.risk_score}</span>/100 risk score.
                </p>
                <div className="mt-3">
                  <RiskBadge level={data.risk.risk_level} />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Primary Drivers */}
              <div className="gw-card">
                <div className="gw-section-label mb-4">Why is this flagged?</div>
                <ul className="space-y-4">
                  {data.why.top_features.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-surface-card border border-border-ui flex items-center justify-center text-xs font-mono text-text-secondary shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">{f.name}</div>
                        <div className="text-sm text-text-secondary leading-snug mt-0.5">{f.explanation}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Plan */}
              <div className="gw-card border-t-2 border-t-gw-accent-500">
                <div className="gw-section-label mb-4">Recommended Actions</div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gw-accent-500 mt-2 shrink-0"></div>
                    <p className="text-sm text-text-secondary">{data.advisory.officer_action}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gw-accent-500 mt-2 shrink-0"></div>
                    <p className="text-sm text-text-secondary">Review real-time satellite vegetation indices (NDVI) for crop stress correlation.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gw-accent-500 mt-2 shrink-0"></div>
                    <p className="text-sm text-text-secondary">Prepare localized advisory for farmers in the {stationName} catchment area.</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowAdvisory(!showAdvisory)}
                  className="mt-6 gw-btn w-full justify-center">
                  <FileText className="w-4 h-4" />
                  {showAdvisory ? 'Hide Draft Advisory' : 'Generate Farmer Advisory'}
                </button>
              </div>
            </div>

            {/* Bilingual Advisory Block */}
            {showAdvisory && (
              <div className="advisory-block animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="advisory-header flex justify-between items-center">
                  <span>Advisory Draft</span>
                  <span className="text-[10px] text-accent flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ready for dispatch</span>
                </div>
                <div className="advisory-en">
                  <div className="advisory-lang-label">English</div>
                  {data.advisory.english}
                </div>
                <div className="advisory-sep"></div>
                <div className="advisory-ta">
                  <div className="advisory-lang-label">தமிழ்</div>
                  {data.advisory.tamil}
                </div>
              </div>
            )}
            
          </>
        ) : null}
      </div>
    </div>
  )
}
