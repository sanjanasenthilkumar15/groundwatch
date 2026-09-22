// In development: proxied through Vite to http://localhost:8000
// In production:  set VITE_API_URL to your Render backend URL
const BASE = import.meta.env.VITE_API_URL ?? '/api'




// ── Shared types ──────────────────────────────────────────────

export interface RiskMapEntry {
  station: string
  latitude: number | null
  longitude: number | null
  latest_month: string
  current_groundwater: number | null
  predicted_groundwater: number | null
  rainfall_mm: number | null
  risk_score: number | null
  risk_level: string
  reliability: string
}

export interface RiskMapResponse {
  status: string
  summary: {
    total_stations: number
    critical: number
    high: number
    moderate: number
    low: number
  }
  stations: RiskMapEntry[]
}

export interface ForecastHorizon {
  horizon_months: number
  horizon: string
  forecast_date: string
  predicted_groundwater: number
  lower_bound: number
  upper_bound: number
  uncertainty: number
  unit: string
}

export interface IntelligenceResponse {
  status: string
  station: {
    name: string
    latitude: number
    longitude: number
    latest_month: string
  }
  current_status: {
    groundwater: number
    rainfall_mm: number
    monthly_change: number
  }
  prediction: {
    next_month: number
    unit: string
  }
  forecast: {
    status: string
    forecasts: ForecastHorizon[]
    assumption: { rainfall: string; monthly_baseline_mm: number }
    uncertainty_note: string
  }
  risk: {
    risk_score: number
    risk_level: string
    prediction_reliability: string
    prediction_weight: string
    reliability_warning: string | null
  }
  reliability: {
    training_rows: number
    training_groundwater_min: number
    training_groundwater_max: number
    current_groundwater: number
    outside_training_range: boolean
    reliability: string
  }
  why: {
    method: string
    overall_interpretation: string
    context: { recent_groundwater_change: number; current_rainfall_mm: number }
    top_features: {
      feature: string
      name: string
      value: number
      importance: number
      strength: string
      explanation: string
    }[]
    note: string
  }
  stress_clock: {
    outlook: {
      status: 'improving' | 'declining' | 'stable'
      estimated_change: number
      message: string
    }
    recent_trend: {
      status: 'improving' | 'declining' | 'stable'
      change_m: number
      magnitude_m: number
      message: string
    }
    current_groundwater: number
    predicted_groundwater: number
    threshold_status: string
    note: string
  }
  advisory: {
    english: string
    tamil: string
    officer_action: string
    rapid_decline_alert: string | null
  }
}

export interface Subscriber {
  name: string
  phone: string
  area: string
  category: 'farmer' | 'construction'
  email: string | null
  registered_at: string
  updated_at: string
}

export interface RegisterPayload {
  name: string
  phone: string
  area: string
  category: 'farmer' | 'construction'
  email?: string
}

export interface Officer {
  id: number
  username: string
  display_name: string
  role: 'district' | 'block' | 'agriculture' | 'admin'
  assigned_block: string | null
  created_at: string
}

export interface OfficerCreatePayload {
  username: string
  password: string
  display_name: string
  role: Officer['role']
  assigned_block?: string | null
}

export interface ConstructionProject {
  id: number
  name: string
  block: string
  station: string
  applicant_name: string
  current_gw: number
  forecast_gw: number
  risk_level: string
  confidence: number
  contact_phone: string
  contact_email: string | null
  source: 'registration' | 'manual'
}

export interface ExtractionRequest {
  id: number
  applicant_name: string
  block: string
  purpose: string
  required_quantity: string
  existing_well: boolean
  station: string
  current_gw: number
  forecast_gw: number
  risk_level: string
  confidence: number
  contact_phone: string
  contact_email: string | null
}

export interface ExtractionRequestCreatePayload {
  applicant_name: string
  purpose: string
  required_quantity: string
  existing_well: boolean
  station: string
  contact_phone: string
  contact_email?: string
}

// ── API client ────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('gw_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: authHeaders() })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || `API error ${r.status}: ${path}`)
  }
  return r.json()
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || `API error ${r.status}: ${path}`)
  }
  return r.json()
}

const post = <T>(path: string, body: unknown) => send<T>('POST', path, body)
const patch = <T>(path: string, body: unknown) => send<T>('PATCH', path, body)
const del = <T>(path: string) => send<T>('DELETE', path)

export const api = {
  // List all station names
  stations: () => get<{ status: string; stations: string[] }>('/stations'),

  // Risk map — all stations with risk summary
  riskMap: () => get<RiskMapResponse>('/risk-map'),

  // Block intelligence — complete data for one station
  intelligence: (station: string) =>
    get<IntelligenceResponse>(`/stations/${encodeURIComponent(station)}/intelligence`),

  // Register for groundwater SMS/email alerts
  register: (payload: RegisterPayload) =>
    post<{ status: string; message: string; subscriber: Subscriber }>('/register', payload),

  // Look up an existing alert registration by phone number
  login: (phone: string) =>
    post<{ status: string; subscriber: Subscriber }>('/login', { phone }),

  // Admin — list registered alert subscribers, optionally filtered
  listSubscribers: (params?: { area?: string; category?: string }) => {
    const qs = new URLSearchParams()
    if (params?.area) qs.set('area', params.area)
    if (params?.category) qs.set('category', params.category)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return get<{ status: string; subscribers: Subscriber[] }>(`/subscribers${suffix}`)
  },

  // Admin — trigger a demo SMS/email alert to all subscribers registered in a station's area
  notifySubscribers: (station: string) =>
    post<{
      status: string
      station: string
      risk_level: string
      notified_count: number
      subscribers: Subscriber[]
      message_preview: string
      delivery: string
    }>(`/stations/${encodeURIComponent(station)}/notify-subscribers`, {}),

  // Distinct list of blocks/taluks that have at least one assigned station
  blocks: () => get<{ status: string; blocks: string[] }>('/blocks'),

  // Officer login — real credentials, role comes back from the server
  officerLogin: (username: string, password: string) =>
    post<{ status: string; token: string; officer: Officer }>('/officer/login', { username, password }),

  // Validate/restore the current session from a stored token
  officerMe: () => get<{ status: string; officer: Officer }>('/officer/me'),

  // Admin — officer account management
  listOfficers: () => get<{ status: string; officers: Officer[] }>('/officers'),

  createOfficer: (payload: OfficerCreatePayload) =>
    post<{ status: string; officer: Officer }>('/officers', payload),

  updateOfficer: (id: number, payload: Partial<Pick<Officer, 'display_name' | 'role' | 'assigned_block'>>) =>
    patch<{ status: string; officer: Officer }>(`/officers/${id}`, payload),

  deleteOfficer: (id: number) => del<{ status: string }>(`/officers/${id}`),

  // Admin — construction projects
  listConstructionProjects: () => get<{ status: string; projects: ConstructionProject[] }>('/admin/construction-projects'),

  getConstructionProject: (id: number) => get<{ status: string; project: ConstructionProject }>(`/admin/construction-projects/${id}`),

  sendConstructionProjectSms: (id: number) =>
    post<{ status: string; message_preview: string; delivery: string }>(`/admin/construction-projects/${id}/send-sms`, {}),

  sendConstructionProjectEmail: (id: number) =>
    post<{ status: string; subject: string; body: string; delivery: string }>(`/admin/construction-projects/${id}/send-email`, {}),

  // Admin — extraction requests
  listExtractionRequests: () => get<{ status: string; requests: ExtractionRequest[] }>('/admin/extraction-requests'),

  getExtractionRequest: (id: number) => get<{ status: string; request: ExtractionRequest }>(`/admin/extraction-requests/${id}`),

  createExtractionRequest: (payload: ExtractionRequestCreatePayload) =>
    post<{ status: string; request: ExtractionRequest }>('/admin/extraction-requests', payload),

  sendExtractionRequestAlert: (id: number) =>
    post<{ status: string; message_preview: string; delivery: string }>(`/admin/extraction-requests/${id}/send-alert`, {}),

  // Admin — farmer advisory by block
  notifyFarmersInBlock: (block: string) =>
    post<{
      status: string
      block: string
      notified_count: number
      subscribers: Subscriber[]
      message_preview_english: string
      message_preview_tamil: string
      delivery: string
    }>(`/admin/blocks/${encodeURIComponent(block)}/notify-farmers`, {}),

  // Admin — construction worker advisory by block
  notifyConstructionWorkersInBlock: (block: string) =>
    post<{
      status: string
      block: string
      notified_count: number
      subscribers: Subscriber[]
      message_preview_english: string
      message_preview_tamil: string
      delivery: string
    }>(`/admin/blocks/${encodeURIComponent(block)}/notify-construction-workers`, {}),
}



