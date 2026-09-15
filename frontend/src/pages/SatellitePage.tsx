import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Satellite, Droplets, CloudRain, ThermometerSun, Leaf, Wind } from 'lucide-react'
import Nav from '../components/Nav'
import RiskBadge from '../components/RiskBadge'
import { api, IntelligenceResponse } from '../lib/api'

// Score 0-100: how stressed a signal is (higher = worse)
function ndviStress(v: number | null) {
  if (v === null) return { label: 'No Data', stress: 50, col: 'text-text-secondary' }
  if (v < 0.1)   return { label: 'Bare / Dry',  stress: 95, col: 'text-risk-critical' }
  if (v < 0.2)   return { label: 'Stressed',    stress: 75, col: 'text-risk-high' }
  if (v < 0.35)  return { label: 'Moderate',    stress: 45, col: 'text-risk-watch' }
  if (v < 0.55)  return { label: 'Healthy',     stress: 20, col: 'text-risk-normal' }
  return               { label: 'Very Healthy', stress: 5,  col: 'text-success' }
}

function lstStress(v: number | null) {
  if (v === null) return { label: 'No Data', stress: 50, col: 'text-text-secondary' }
  if (v > 42)    return { label: 'Extreme Heat', stress: 95, col: 'text-risk-critical' }
  if (v > 38)    return { label: 'High Heat',    stress: 70, col: 'text-risk-high' }
  if (v > 33)    return { label: 'Elevated',     stress: 40, col: 'text-risk-watch' }
  return               { label: 'Normal',        stress: 15, col: 'text-risk-normal' }
}

function etStress(v: number | null) {
  if (v === null) return { label: 'No Data', stress: 50, col: 'text-text-secondary' }
  if (v < 10)    return { label: 'Very Low',  stress: 80, col: 'text-risk-critical' }
  if (v < 20)    return { label: 'Low',       stress: 60, col: 'text-risk-high' }
  if (v < 40)    return { label: 'Normal',    stress: 20, col: 'text-risk-normal' }
  return               { label: 'High',       stress: 35, col: 'text-risk-watch' }
}

function smStress(v: number | null) {
  if (v === null) return { label: 'No Data', stress: 50, col: 'text-text-secondary' }
  if (v < 0.10)  return { label: 'Very Dry',  stress: 90, col: 'text-risk-critical' }
  if (v < 0.20)  return { label: 'Dry',       stress: 65, col: 'text-risk-high' }
  if (v < 0.30)  return { label: 'Moderate',  stress: 35, col: 'text-risk-watch' }
  return               { label: 'Adequate',   stress: 15, col: 'text-risk-normal' }
}

function Bar({ stress }: { stress: number }) {
  const col = stress > 75 ? 'bg-risk-critical-border' : stress > 50 ? 'bg-risk-high-border' : stress > 25 ? 'bg-risk-moderate-border' : 'bg-risk-low-border'
  return (
    <div className="mt-3 gw-gauge-track w-full overflow-hidden">
      <div className={`gw-gauge-fill ${col}`} style={{ width: `${stress}%` }} />
    </div>
  )
}

export default function SatellitePage() {
  const { station } = useParams<{ station: string }>()
  const navigate = useNavigate()
  const stationName = station ? decodeURIComponent(station) : ''
  const [data, setData]       = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).finally(() => setLoading(false))
  }, [stationName])

  const sat = (data as any)?.satellite ?? null
  const ndvi = ndviStress(sat?.ndvi ?? null)
  const lst  = lstStress(sat?.lst_celsius ?? null)
  const et   = etStress(sat?.et_mm ?? null)
  const sm   = smStress(sat?.soil_moisture ?? null)
  
  const avgStress = Math.round((ndvi.stress + lst.stress + et.stress + sm.stress) / 4)
  const crossInsight = (): string => {
    if (!sat) return 'Satellite data unavailable for this station.'
    const gwRisk = data?.risk?.risk_level ?? 'LOW'
    const isCritical = ['CRITICAL', 'HIGH'].includes(gwRisk)
    const highSatStress = avgStress > 55
    if (isCritical && highSatStress)
      return `NDVI (${sat?.ndvi?.toFixed(2)}) shows vegetation stress while land surface temperature (${sat?.lst_celsius?.toFixed(1)}°C) is elevated. Two independent signals — satellite and ground sensor — both confirm water stress in this block. This is a high-confidence alert.`
    if (isCritical && !highSatStress)
      return `Groundwater sensors show stress, but satellite vegetation (NDVI: ${sat?.ndvi?.toFixed(2)}) is currently holding. This may indicate early-stage stress before crop impact is visible. Monitor closely.`
    if (!isCritical && highSatStress)
      return `Satellite signals show moderate vegetation stress (NDVI: ${sat?.ndvi?.toFixed(2)}, LST: ${sat?.lst_celsius?.toFixed(1)}°C) despite stable groundwater. Possible surface-level heat stress or crop water-use mismatch.`
    return `All environmental parameters show normal conditions. NDVI: ${sat?.ndvi?.toFixed(2)}, LST: ${sat?.lst_celsius?.toFixed(1)}°C, Soil Moisture: ${sat?.soil_moisture?.toFixed(3)} m³/m³. Satellite and ground sensors are in agreement.`
  }

  return (
    <div className="min-h-screen pb-20">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
              <p className="text-text-secondary text-sm flex items-center gap-1.5 font-medium"><Satellite className="w-4 h-4" /> Satellite Intelligence — Real GEE Data</p>
            </div>
          </div>
          {data && <RiskBadge level={data.risk.risk_level} />}
        </div>

        {loading ? (
          <div className="gw-card h-64 gw-skeleton"></div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="gw-card flex flex-col justify-between">
                <div>
                  <Leaf className={`w-6 h-6 mb-3 ${ndvi.col}`} />
                  <div className="gw-section-label mb-1">Vegetation (NDVI)</div>
                  <div className={`text-base font-semibold ${ndvi.col}`}>{ndvi.label}</div>
                  <div className="text-2xl font-mono font-bold text-text-primary mt-1">
                    {sat?.ndvi !== null && sat?.ndvi !== undefined ? sat.ndvi.toFixed(3) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-primary0 mt-4 uppercase tracking-wider font-semibold">MODIS MOD13Q1 · 250m</div>
                  <Bar stress={ndvi.stress} />
                </div>
              </div>

              <div className="gw-card flex flex-col justify-between">
                <div>
                  <ThermometerSun className={`w-6 h-6 mb-3 ${lst.col}`} />
                  <div className="gw-section-label mb-1">Land Surface Temp</div>
                  <div className={`text-base font-semibold ${lst.col}`}>{lst.label}</div>
                  <div className="text-2xl font-mono font-bold text-text-primary mt-1">
                    {sat?.lst_celsius !== null && sat?.lst_celsius !== undefined ? `${sat.lst_celsius.toFixed(1)}°C` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-primary0 mt-4 uppercase tracking-wider font-semibold">MODIS MOD11A2 · 1km</div>
                  <Bar stress={lst.stress} />
                </div>
              </div>

              <div className="gw-card flex flex-col justify-between">
                <div>
                  <Wind className={`w-6 h-6 mb-3 ${et.col}`} />
                  <div className="gw-section-label mb-1">Evapotranspiration</div>
                  <div className={`text-base font-semibold ${et.col}`}>{et.label}</div>
                  <div className="text-2xl font-mono font-bold text-text-primary mt-1">
                    {sat?.et_mm !== null && sat?.et_mm !== undefined ? `${sat.et_mm.toFixed(1)} mm` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-primary0 mt-4 uppercase tracking-wider font-semibold">MODIS MOD16A2 · 500m</div>
                  <Bar stress={et.stress} />
                </div>
              </div>

              <div className="gw-card flex flex-col justify-between">
                <div>
                  <Droplets className={`w-6 h-6 mb-3 ${sm.col}`} />
                  <div className="gw-section-label mb-1">Soil Moisture</div>
                  <div className={`text-base font-semibold ${sm.col}`}>{sm.label}</div>
                  <div className="text-2xl font-mono font-bold text-text-primary mt-1">
                    {sat?.soil_moisture !== null && sat?.soil_moisture !== undefined ? sat.soil_moisture.toFixed(3) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-primary0 mt-4 uppercase tracking-wider font-semibold">SMAP SPL4SMGP · 9km</div>
                  <Bar stress={sm.stress} />
                </div>
              </div>

            </div>

            <div className="gw-card border-l-2 border-l-gw-accent-500 bg-surface-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                  <Satellite className="w-4 h-4" /> Cross-Signal Insight
                </h3>
                <span className="font-mono text-xs text-text-secondary bg-ink-850 px-2 py-0.5 rounded-sm border border-border-ui">
                  Avg Stress: {avgStress}/100
                </span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed">{crossInsight()}</p>
            </div>

            <p className="text-center text-xs text-text-primary0 font-medium">
              Data pulled from NASA MODIS + SMAP via Google Earth Engine · Salem District, Tamil Nadu
            </p>

          </div>
        ) : null}
      </div>
    </div>
  )
}
