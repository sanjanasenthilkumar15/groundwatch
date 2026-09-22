import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MessageSquare, Mail, CheckCircle2, Phone } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, ConstructionProject } from '../lib/api'

export default function ConstructionProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ConstructionProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sendingSms, setSendingSms] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [smsPreview, setSmsPreview] = useState<string | null>(null)
  const [emailPreview, setEmailPreview] = useState<{ subject: string; body: string } | null>(null)

  useEffect(() => {
    if (!id) return
    api.getConstructionProject(Number(id)).then(res => setProject(res.project)).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [id])

  const sendSms = async () => {
    if (!project) return
    setSendingSms(true)
    try {
      const res = await api.sendConstructionProjectSms(project.id)
      setSmsPreview(res.message_preview)
    } catch (e: any) {
      setError(e.message || 'Failed to send SMS')
    } finally {
      setSendingSms(false)
    }
  }

  const sendEmail = async () => {
    if (!project) return
    setSendingEmail(true)
    try {
      const res = await api.sendConstructionProjectEmail(project.id)
      setEmailPreview({ subject: res.subject, body: res.body })
    } catch (e: any) {
      setError(e.message || 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-2xl mx-auto pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">Project Details</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Construction Projects</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-96 gw-skeleton" />
        ) : error ? (
          <div className="gw-card text-center text-risk-critical text-sm py-8">{error}</div>
        ) : project ? (
          <div className="space-y-5">
            <div className="gw-card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-lg font-bold font-ui text-text-primary">{project.name}</div>
                  <div className="text-text-secondary text-sm mt-0.5">{project.block}, Salem</div>
                  <div className="text-[10px] font-ui uppercase tracking-wider text-text-muted mt-1">
                    {project.source === 'registration' ? 'From public registration · live groundwater data' : 'Manually logged case'}
                  </div>
                </div>
                <RiskBadge level={project.risk_level} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-ui">
                <div>
                  <div className="gw-section-label mb-1">Applicant</div>
                  <div className="text-sm font-ui font-semibold text-text-primary">{project.applicant_name}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Groundwater Station</div>
                  <div className="text-sm font-ui font-semibold text-text-primary">{project.station}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Current Groundwater</div>
                  <div className="text-lg font-mono font-bold text-text-primary">{Math.abs(project.current_gw).toFixed(1)} m</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Forecast</div>
                  <div className="text-lg font-mono font-bold text-text-primary">{Math.abs(project.forecast_gw).toFixed(1)} m</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Risk</div>
                  <div className="text-sm font-ui font-bold" style={{ color: 'var(--color-risk-high)' }}>{project.risk_level}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Confidence</div>
                  <div className="text-sm font-mono font-bold text-text-primary">{project.confidence}/100</div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border-ui">
                <div className="gw-section-label mb-2">Contact Information</div>
                <div className="flex flex-col gap-1.5 text-sm font-ui text-text-secondary">
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {project.contact_phone}</div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {project.contact_email || 'Not provided'}</div>
                </div>
              </div>
            </div>

            <div className="gw-card">
              <div className="gw-section-label mb-3">Action</div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={sendSms} disabled={sendingSms} className="gw-btn flex items-center justify-center gap-2 disabled:opacity-60">
                  <MessageSquare className="w-4 h-4" />
                  {sendingSms ? 'Sending…' : 'Send SMS'}
                </button>
                <button onClick={sendEmail} disabled={sendingEmail || !project.contact_email} title={!project.contact_email ? 'No email on file' : undefined} className="gw-btn flex items-center justify-center gap-2 disabled:opacity-60">
                  <Mail className="w-4 h-4" />
                  {sendingEmail ? 'Sending…' : 'Send Email'}
                </button>
              </div>

              {smsPreview && (
                <div className="mt-4 rounded-md border border-border-ui bg-surface-page p-3">
                  <div className="flex items-center gap-1.5 text-xs font-ui font-bold text-success mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SMS preview — not actually sent (demo)
                  </div>
                  <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">{smsPreview}</pre>
                </div>
              )}

              {emailPreview && (
                <div className="mt-4 rounded-md border border-border-ui bg-surface-page p-3">
                  <div className="flex items-center gap-1.5 text-xs font-ui font-bold text-success mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Email preview — not actually sent (demo)
                  </div>
                  <div className="text-xs font-mono font-bold text-text-primary mb-2">{emailPreview.subject}</div>
                  <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">{emailPreview.body}</pre>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
