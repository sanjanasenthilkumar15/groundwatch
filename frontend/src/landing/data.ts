/* ===========================================================================
   Landing-page data.
   Values marked OBSERVED are read from the pilot dataset shipped with this
   repository (backend/data/Salem_ML_Ready_Satellite.csv) and from
   backend/service/*.py. Values marked ILLUSTRATIVE are shaped for the public
   page only — live figures are computed inside the platform.
   =========================================================================== */

import type { RiskLevel } from './ui'

/* --- Operational risk bands — mirrors backend/service/risk_engine.py ------- */
export const RISK_BANDS: { level: RiskLevel; from: number; to: number }[] = [
  { level: 'LOW', from: 0, to: 24 },
  { level: 'MODERATE', from: 25, to: 49 },
  { level: 'HIGH', from: 50, to: 69 },
  { level: 'CRITICAL', from: 70, to: 100 },
]

export function bandFor(score: number): RiskLevel {
  if (score >= 70) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MODERATE'
  return 'LOW'
}

/* --- Monitoring network --------------------------------------------------- */
/* OBSERVED: station names, blocks and coordinates from the pilot dataset.
   ILLUSTRATIVE: risk scores, for the sample operational view only.          */
export interface Station {
  name: string
  block: string
  lat: number
  lon: number
  score: number
}

export const STATIONS: Station[] = [
  { name: 'Kullampatti',        block: 'Edappadi',    lat: 11.5689, lon: 77.7936, score: 61 },
  { name: 'Manjakalpatti',      block: 'Sankari',     lat: 11.5031, lon: 77.8656, score: 72 },
  { name: 'Erumaipatti_1',      block: 'Sankari',     lat: 11.4719, lon: 77.8703, score: 58 },
  { name: 'Ramagudal',          block: 'Sankari',     lat: 11.4892, lon: 77.7175, score: 54 },
  { name: 'Pillukurichi',       block: 'Edappadi',    lat: 11.6397, lon: 77.7819, score: 55 },
  { name: 'Muthiyampatti',      block: 'Edappadi',    lat: 11.6494, lon: 77.8959, score: 47 },
  { name: 'Samuthiram_1',       block: 'Edappadi',    lat: 11.6530, lon: 77.9073, score: 44 },
  { name: 'Erumaipatti_2',      block: 'Edappadi',    lat: 11.5683, lon: 77.9169, score: 51 },
  { name: 'Avaniperur Keelmugam', block: 'Edappadi',  lat: 11.5967, lon: 77.8488, score: 46 },
  { name: 'Egapuram',           block: 'Edappadi',    lat: 11.6097, lon: 77.9614, score: 38 },
  { name: 'Ariyampatti',        block: 'Omalur',      lat: 11.7172, lon: 77.9117, score: 33 },
  { name: 'Thuttampatti',       block: 'Omalur',      lat: 11.6736, lon: 77.9683, score: 41 },
  { name: 'Murungapatty',       block: 'Omalur',      lat: 11.6414, lon: 78.0389, score: 29 },
  { name: 'M.Chettipatti',      block: 'Omalur',      lat: 11.7303, lon: 78.0068, score: 27 },
  { name: 'Periyakadampatty',   block: 'Omalur',      lat: 11.7234, lon: 77.9922, score: 31 },
  { name: 'Thekkampatti',       block: 'Omalur',      lat: 11.7444, lon: 78.1000, score: 22 },
  { name: 'Amaram_1',           block: 'Omalur',      lat: 11.8393, lon: 77.9605, score: 19 },
  { name: 'Moolakadu',          block: 'Mettur',      lat: 11.8139, lon: 77.7861, score: 53 },
  { name: 'Navapatti',          block: 'Mettur',      lat: 11.7464, lon: 77.7853, score: 40 },
  { name: 'Pannavadi',          block: 'Mettur',      lat: 11.8728, lon: 77.7664, score: 24 },
  { name: 'Veerakal',           block: 'Mettur',      lat: 11.7789, lon: 77.8747, score: 30 },
  { name: 'Sanarpatti',         block: 'Mettur',      lat: 11.7319, lon: 77.8669, score: 36 },
  { name: 'Gundakkal',          block: 'Kadayampatti', lat: 11.9020, lon: 78.0532, score: 21 },
  { name: 'Nadupatty',          block: 'Kadayampatti', lat: 11.8791, lon: 78.0904, score: 17 },
  { name: 'Hasthampatti',       block: 'Salem',       lat: 11.6867, lon: 78.1664, score: 43 },
  { name: 'Hasthampati',        block: 'Salem',       lat: 11.6746, lon: 78.1562, score: 39 },
  { name: 'Ammapet_1',          block: 'Salem',       lat: 11.6616, lon: 78.2003, score: 48 },
  { name: 'Ayodhiyapattinam',   block: 'Salem',       lat: 11.6731, lon: 78.2467, score: 34 },
  { name: 'Inam Bairoji',       block: 'Salem',       lat: 11.5516, lon: 78.0793, score: 45 },
  { name: 'Sandhiyur',          block: 'Salem',       lat: 11.5669, lon: 78.1414, score: 37 },
  { name: 'Sukkampatti',        block: 'Yercaud',     lat: 11.7178, lon: 78.2669, score: 12 },
  { name: 'Singipuram',         block: 'Vazhapadi',   lat: 11.6333, lon: 78.4158, score: 26 },
  { name: 'Mannarpalayam',      block: 'Vazhapadi',   lat: 11.6075, lon: 78.3989, score: 52 },
  { name: 'Veppilaipatty',      block: 'Vazhapadi',   lat: 11.5808, lon: 78.3508, score: 35 },
  { name: 'Pulluthikuttai',     block: 'Vazhapadi',   lat: 11.7708, lon: 78.4278, score: 23 },
  { name: 'Ramanaickanpalayam', block: 'Attur',       lat: 11.6281, lon: 78.5597, score: 56 },
  { name: 'Siruvachur',         block: 'Attur',       lat: 11.6389, lon: 78.7556, score: 32 },
  { name: 'Pappanaickanpatti',  block: 'Attur',       lat: 11.7772, lon: 78.5689, score: 28 },
  { name: 'Kadambur',           block: 'Gangavalli',  lat: 11.5033, lon: 78.5994, score: 50 },
  { name: 'Illupanatham_1',     block: 'Gangavalli',  lat: 11.5108, lon: 78.7581, score: 42 },
  { name: 'Sitteri',            block: 'Gangavalli',  lat: 11.5444, lon: 78.7986, score: 18 },
  { name: 'Sendarapatti',       block: 'Gangavalli',  lat: 11.4369, lon: 78.5114, score: 44 },
  { name: 'Rajapalayam (TN-MWS01)', block: 'Gangavalli', lat: 11.4300, lon: 78.8133, score: 25 },
]

export const BLOCKS = [...new Set(STATIONS.map(s => s.block))].sort()

/* --- Kullampatti monthly series ------------------------------------------- */
/* OBSERVED: Jul 2023 – Mar 2025, groundwater depth in metres below ground
   level, rainfall in mm (null where the month has no rainfall record).      */
export interface MonthPoint {
  month: string      // YYYY-MM
  label: string      // short axis label
  depth: number      // m below ground level
  rain: number | null
}

export const KULLAMPATTI_HISTORY: MonthPoint[] = [
  { month: '2023-07', label: 'Jul 23', depth: 8.12, rain: 51.25 },
  { month: '2023-08', label: 'Aug',    depth: 9.36, rain: 96.5 },
  { month: '2023-09', label: 'Sep',    depth: 8.54, rain: 262.5 },
  { month: '2023-10', label: 'Oct',    depth: 6.78, rain: 121.5 },
  { month: '2023-11', label: 'Nov',    depth: 6.82, rain: 127.0 },
  { month: '2023-12', label: 'Dec',    depth: 5.36, rain: 4.5 },
  { month: '2024-01', label: 'Jan 24', depth: 6.37, rain: 21.25 },
  { month: '2024-02', label: 'Feb',    depth: 8.22, rain: null },
  { month: '2024-03', label: 'Mar',    depth: 10.11, rain: null },
  { month: '2024-04', label: 'Apr',    depth: 6.19, rain: 6.0 },
  { month: '2024-05', label: 'May',    depth: 8.34, rain: 192.0 },
  { month: '2024-06', label: 'Jun',    depth: 9.62, rain: 131.0 },
  { month: '2024-07', label: 'Jul',    depth: 9.00, rain: 68.25 },
  { month: '2024-08', label: 'Aug',    depth: 3.92, rain: 197.75 },
  { month: '2024-09', label: 'Sep',    depth: 2.64, rain: 28.0 },
  { month: '2024-10', label: 'Oct',    depth: 2.11, rain: 207.75 },
  { month: '2024-11', label: 'Nov',    depth: 1.96, rain: 43.25 },
  { month: '2024-12', label: 'Dec',    depth: 1.90, rain: 98.25 },
  { month: '2025-01', label: 'Jan 25', depth: 2.13, rain: 5.75 },
  { month: '2025-02', label: 'Feb',    depth: 3.50, rain: null },
  { month: '2025-03', label: 'Mar',    depth: 4.89, rain: 13.25 },
]

/* --- Forecast horizon ----------------------------------------------------- */
/* ILLUSTRATIVE: a six-month horizon under three rainfall scenarios.         */
export type ScenarioKey = 'below' | 'normal' | 'above'

export interface Scenario {
  key: ScenarioKey
  label: string
  short: string
  note: string
  depths: number[]        // m below ground level, Apr–Sep 2025
  spread: number[]        // ± uncertainty band, metres
  riskScore: number
  recharge: string
}

export const FORECAST_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  below: {
    key: 'below',
    label: 'Below Normal Rainfall',
    short: 'Below normal',
    note: 'Recharge signal weak. Water table continues to fall through the dry months.',
    depths: [6.8, 8.3, 9.6, 9.85, 8.9, 7.4],
    spread: [0.9, 1.15, 1.35, 1.6, 1.8, 2.0],
    riskScore: 74,
    recharge: 'Weak',
  },
  normal: {
    key: 'normal',
    label: 'Normal Rainfall',
    short: 'Normal',
    note: 'Recharge signal near the seasonal average. Decline slows from August.',
    depths: [6.2, 7.35, 8.3, 8.05, 6.6, 4.9],
    spread: [0.85, 1.05, 1.25, 1.45, 1.65, 1.85],
    riskScore: 61,
    recharge: 'Near average',
  },
  above: {
    key: 'above',
    label: 'Above Normal Rainfall',
    short: 'Above normal',
    note: 'Recharge signal strong. Water table recovers earlier in the season.',
    depths: [5.7, 6.5, 7.1, 6.4, 4.6, 3.1],
    spread: [0.8, 0.95, 1.1, 1.3, 1.45, 1.6],
    riskScore: 42,
    recharge: 'Strong',
  },
}

/* --- Satellite signals ---------------------------------------------------- */
/* OBSERVED: Kullampatti, Apr 2024 – Mar 2025.                               */
export const SAT_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
export const NDVI_SERIES = [0.391, 0.517, 0.615, 0.569, 0.632, 0.552, 0.630, 0.656, 0.673, 0.550, 0.415, 0.427]
export const LST_SERIES  = [39.01, 36.35, 33.53, 31.88, 30.61, 33.47, 29.46, 26.70, 27.22, 27.47, 32.02, 34.20]
export const ET_SERIES   = [3.58, 10.02, 13.98, 14.87, 18.37, 14.73, 18.96, 15.27, 18.97, 12.21, 7.33, 5.29]

/* --- WHY analysis --------------------------------------------------------- */
/* OBSERVED: feature importances and names from
   backend/service/explainability.py (global XGBoost feature importance).    */
export interface WhyFactor {
  name: string
  feature: string
  importance: number
  strength: string
  note: string
}

export const WHY_FACTORS: WhyFactor[] = [
  {
    name: '2-month groundwater history',
    feature: 'gw_lag_2',
    importance: 0.3521,
    strength: 'Very strong',
    note: 'Groundwater conditions from two months earlier have a strong influence on the forecast.',
  },
  {
    name: 'Recent groundwater level',
    feature: 'gw_lag_1',
    importance: 0.3011,
    strength: 'Very strong',
    note: "The previous month's groundwater level shows a relatively low condition.",
  },
  {
    name: '3-month groundwater history',
    feature: 'gw_lag_3',
    importance: 0.2402,
    strength: 'Strong',
    note: 'The level from three months earlier contributes significantly to the prediction.',
  },
  {
    name: 'Recent 3-month groundwater trend',
    feature: 'gw_rolling_3',
    importance: 0.0694,
    strength: 'Moderate',
    note: 'The recent three-month pattern influences the predicted condition.',
  },
  {
    name: 'Monthly groundwater change',
    feature: 'gw_change_1m',
    importance: 0.0157,
    strength: 'Low',
    note: 'Groundwater shows a decline during the recent month.',
  },
  {
    name: 'Current rainfall',
    feature: 'rainfall_mm',
    importance: 0.0030,
    strength: 'Low',
    note: 'Current rainfall conditions provide additional context for the prediction.',
  },
]

export const WHY_DISCLAIMER =
  'Based on global XGBoost feature importance and the station’s input values. These indicate which factors influence the model — not causal relationships.'

/* --- Roadmap -------------------------------------------------------------- */
export const ROADMAP = [
  {
    phase: 'NOW',
    state: 'live' as const,
    items: ['Groundwater forecasting', 'Risk engine', 'WHY analysis', 'Salem pilot', 'Farmer SMS'],
  },
  {
    phase: 'NEXT',
    state: 'building' as const,
    items: ['Future rainfall integration', 'Improved satellite signals', 'Crop planning advisory', 'WhatsApp alerts'],
  },
  {
    phase: 'FUTURE',
    state: 'planned' as const,
    items: ['Soil moisture', 'More agricultural context', 'Irrigation advisory', 'Intervention tracking', 'Multi-district deployment'],
  },
  {
    phase: 'SCALE',
    state: 'planned' as const,
    items: ['Salem', 'Tamil Nadu', 'India'],
  },
]
