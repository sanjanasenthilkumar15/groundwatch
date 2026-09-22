import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplets, Send, CheckCircle2, Phone, Mail } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, ExtractionRequest } from '../lib/api'

export default function ExtractionRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [request, setRequest] = useState<ExtractionRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [smsPreview, setSmsPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.getExtractionRequest(Number(id)).then(res => setRequest(res.request)).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [id])

  const sendAlert = async () => {
    if (!request) return
    setSending(true)
    try {
      const res = await api.sendExtractionRequestAlert(request.id)
      setSmsPreview(res.message_preview)
    } catch (e: any) {
      setError(e.message || 'Failed to send alert')
    } finally {
      setSending(false)
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
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">Extraction Request</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><Droplets className="w-4 h-4" /> Extraction Requests</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-96 gw-skeleton" />
        ) : error ? (
          <div className="gw-card text-center text-risk-critical text-sm py-8">{error}</div>
        ) : request ? (
          <div className="space-y-5">
            <div className="gw-card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="text-lg font-bold font-ui text-text-primary">#{request.id}</div>
                <RiskBadge level={request.risk_level} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="gw-section-label mb-1">Applicant</div>
                  <div className="text-sm font-ui font-semibold text-text-primary">{request.applicant_name}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Location</div>
                  <div className="text-sm font-ui font-semibold text-text-primary">{request.block}, Salem</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Purpose</div>
                  <div className="text-sm font-ui font-semibold text-text-primary">{request.purpose}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Required Quantity</div>
                  <div className="text-sm font-mono font-semibold text-text-primary">{request.required_quantity}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Existing Well</div>
                  <div className="text-sm font-ui font-semibold text-text-primary">{request.existing_well ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Groundwater Station</div>
                  <div className="text-sm font-ui font-semibold text-text-primary">{request.station}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Current Groundwater</div>
                  <div className="text-lg font-mono font-bold text-text-primary">{Math.abs(request.current_gw).toFixed(1)} m</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Forecast</div>
                  <div className="text-lg font-mono font-bold text-text-primary">{Math.abs(request.forecast_gw).toFixed(1)} m</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">GroundWatch Risk</div>
                  <div className="text-sm font-ui font-bold" style={{ color: 'var(--color-risk-high)' }}>{request.risk_level}</div>
                </div>
                <div>
                  <div className="gw-section-label mb-1">Data Confidence</div>
                  <div className="text-sm font-mono font-bold text-text-primary">{request.confidence}%</div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border-ui">
                <div className="gw-section-label mb-2">Contact Information</div>
                <div className="flex flex-col gap-1.5 text-sm font-ui text-text-secondary">
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {request.contact_phone}</div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {request.contact_email || 'Not provided'}</div>
                </div>
              </div>
            </div>

            <div className="gw-card">
              <button onClick={sendAlert} disabled={sending} className="gw-btn w-full justify-center flex items-center gap-2 disabled:opacity-60">
                <Send className="w-4 h-4" />
                {sending ? 'Sending…' : 'Send Applicant Alert — Request Field Verification'}
              </button>

              {smsPreview && (
                <div className="mt-4 rounded-md border border-border-ui bg-surface-page p-3">
                  <div className="flex items-center gap-1.5 text-xs font-ui font-bold text-success mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SMS preview — not actually sent (demo)
                  </div>
                  <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">{smsPreview}</pre>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
