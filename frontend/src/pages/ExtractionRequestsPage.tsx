import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplets, ArrowRight, PlusCircle } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, ExtractionRequest } from '../lib/api'

const PURPOSES = ['Industrial', 'Commercial', 'Agricultural', 'Domestic']

export default function ExtractionRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<ExtractionRequest[]>([])
  const [stations, setStations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [applicantName, setApplicantName] = useState('')
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [requiredQuantity, setRequiredQuantity] = useState('')
  const [existingWell, setExistingWell] = useState(false)
  const [station, setStation] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const loadRequests = () => api.listExtractionRequests().then(res => setRequests(res.requests))

  useEffect(() => {
    Promise.all([api.listExtractionRequests(), api.stations()])
      .then(([reqs, stns]) => {
        setRequests(reqs.requests)
        setStations(stns.stations)
        if (stns.stations.length > 0) setStation(stns.stations[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const createRequest = async () => {
    setFormError(null)
    if (!applicantName.trim()) return setFormError('Applicant name is required.')
    if (!requiredQuantity.trim()) return setFormError('Required quantity is required.')
    if (!station) return setFormError('Select a station.')
    if (contactPhone.replace(/\D/g, '').length < 10) return setFormError('Enter a valid 10-digit contact number.')

    setCreating(true)
    try {
      await api.createExtractionRequest({
        applicant_name: applicantName.trim(),
        purpose,
        required_quantity: requiredQuantity.trim(),
        existing_well: existingWell,
        station,
        contact_phone: contactPhone,
        contact_email: contactEmail || undefined,
      })
      setApplicantName(''); setRequiredQuantity(''); setExistingWell(false); setContactPhone(''); setContactEmail('')
      await loadRequests()
    } catch (e: any) {
      setFormError(e.message || 'Failed to log extraction request.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-3xl mx-auto pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">Extraction Requests</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><Droplets className="w-4 h-4" /> Groundwater extraction applications pending review</p>
          </div>
        </div>

        <div className="gw-card">
          <div className="gw-section-label mb-3 flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Log New Extraction Request
          </div>
          <p className="text-text-muted text-xs mb-3">
            For applications received through official channels — groundwater depth, forecast, risk and confidence are pulled live from the selected station's real data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={applicantName}
              onChange={e => setApplicantName(e.target.value)}
              placeholder="Applicant / company name"
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            />
            <select
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            >
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              value={requiredQuantity}
              onChange={e => setRequiredQuantity(e.target.value)}
              placeholder="Required quantity (e.g. 250 m³/day)"
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            />
            <select
              value={station}
              onChange={e => setStation(e.target.value)}
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            >
              {stations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="Contact phone"
              inputMode="tel"
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            />
            <input
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="Contact email (optional)"
              type="email"
              className="rounded-md border border-border-ui bg-surface-card text-text-primary px-3 py-2.5 text-sm font-ui focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm font-ui text-text-secondary sm:col-span-2">
              <input type="checkbox" checked={existingWell} onChange={e => setExistingWell(e.target.checked)} className="w-4 h-4" />
              Applicant already has an existing well
            </label>
          </div>

          {formError && <p className="text-risk-critical text-xs font-ui mt-3">{formError}</p>}

          <button
            onClick={createRequest}
            disabled={creating}
            className="gw-btn mt-4 flex items-center gap-2 disabled:opacity-60"
          >
            <PlusCircle className="w-4 h-4" />
            {creating ? 'Logging…' : 'Log Request'}
          </button>
        </div>

        <div className="gw-card p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">Loading requests…</div>
          ) : (
            <div>
              {requests.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/admin/extraction/${r.id}`}
                  className={`flex items-center justify-between px-5 py-4 border-b border-border-ui last:border-0 hover:bg-surface-page transition-colors group ${i % 2 === 0 ? '' : 'bg-surface-page/50'}`}
                >
                  <div>
                    <div className="font-ui font-semibold text-sm text-text-primary">#{r.id} — {r.applicant_name}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{r.block}, Salem · {r.purpose}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level={r.risk_level} />
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
