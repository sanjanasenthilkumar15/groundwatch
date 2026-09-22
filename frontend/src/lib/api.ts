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
    status: string
    current_groundwater: number
    predicted_groundwater: number
    estimated_change: number
    threshold_status: string
    message: string
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

// ── API client ────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`)
  if (!r.ok) throw new Error(`API error ${r.status}: ${path}`)
  return r.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || `API error ${r.status}: ${path}`)
  }
  return r.json()
}

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
}



