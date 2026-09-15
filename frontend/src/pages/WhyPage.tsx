import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import Nav from '../components/Nav'
import { api, IntelligenceResponse } from '../lib/api'

export default function WhyPage() {
  const { station } = useParams<{ station: string }>()
  const navigate    = useNavigate()
  const stationName = station ? decodeURIComponent(station) : ''
  const [data, setData]   = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).finally(() => setLoading(false))
  }, [stationName])

  const features = data?.why?.top_features ?? []
  const maxVal = features.length > 0 ? Math.max(...features.map(f => f.importance)) : 1

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-3xl mx-auto pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> WHY Analysis — Driving Factors</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-64 gw-skeleton" />
        ) : data ? (
          <>
            <div className="gw-card border-l-2 border-l-gw-accent-500">
              <p className="text-text-primary text-sm leading-relaxed">{data.why.overall_interpretation}</p>
            </div>

            <div className="gw-card">
              <div className="gw-section-label mb-5">Model Feature Importance</div>
              <div className="space-y-4">
                {features.map((f, i) => {
                  const pct = Math.round((f.importance / maxVal) * 100)
                  const isTop = i === 0
                  return (
                    <div key={i}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isTop && (
                              <span className="gw-badge gw-badge-low text-[9px] px-1.5 py-0.5">KEY</span>
                            )}
                            <span className="text-sm font-semibold text-text-primary">{f.name}</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5 leading-snug">{f.explanation}</p>
                        </div>
                        <span className="font-mono text-xs text-text-secondary shrink-0">{(f.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-[3px] bg-border-ui/50 rounded-sm overflow-hidden">
                        <div
                          className={isTop ? 'h-full bg-primary' : 'h-full bg-border-ui'}
                          style={{ width: pct + '%', transition: 'width 600ms var(--gw-ease-settle)' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

