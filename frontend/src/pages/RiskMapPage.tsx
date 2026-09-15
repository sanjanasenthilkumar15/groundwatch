import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Nav from '../components/Nav'
import { api, RiskMapEntry } from '../lib/api'
import { fmtGW, getChipClass } from '../lib/utils'
import RiskBadge from '../components/RiskBadge'

const LEVELS = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW']

// Use hardcoded hex values — CSS vars don't resolve inside Leaflet's JS context
const RISK_HEX: Record<string, string> = {
  CRITICAL: '#D62828',
  HIGH:     '#E2691A',
  MODERATE: '#F0A80C',
  LOW:      '#2F9E44',
}

const createMarkerIcon = (level: string) => {
  const hex   = RISK_HEX[level] ?? RISK_HEX.LOW
  const pulse = level === 'CRITICAL' ? 'critical-pulse-ring' : ''
  return L.divIcon({
    className: '',
    html: `<div class="${pulse}" style="
      width:20px; height:20px; border-radius:50%;
      background-color:${hex};
      border: 2px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize:    [20, 20],
    iconAnchor:  [10, 10],
    popupAnchor: [0, -12],
  })
}

export default function RiskMapPage() {
  const navigate = useNavigate()
  const [stations, setStations] = useState<RiskMapEntry[]>([])
  const [summary,  setSummary]  = useState({ critical:0, high:0, moderate:0, low:0, total_stations:0 })
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')

  useEffect(() => {
    api.riskMap()
      .then(d => { setStations(d.stations); setSummary(d.summary) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? stations : stations.filter(s => s.risk_level === filter)
  const mapped   = filtered.filter(s => s.latitude && s.longitude)

  return (
    /* Outer shell: full-screen column, nav on top, rest = map area */
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      {/* Nav sits above everything */}
      <div style={{ flexShrink:0, position:'relative', zIndex:1000 }}>
        <Nav />
      </div>

      {/* Map area */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
            <p className="text-text-secondary font-ui">Loading map data…</p>
          </div>
        ) : (
          <>
            {/* Leaflet map fills the entire area */}
            <MapContainer
              center={[11.65, 78.15]}
              zoom={10}
              zoomControl={true}
              style={{ width:'100%', height:'100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                className="map-tiles-dark"
              />
              {mapped.map(s => (
                <Marker
                  key={s.station}
                  position={[s.latitude!, s.longitude!]}
                  icon={createMarkerIcon(s.risk_level)}
                >
                  <Popup>
                    <div style={{ minWidth:220, fontFamily:'IBM Plex Sans, sans-serif' }}>
                      <div style={{ fontWeight:700, marginBottom:8, color:'var(--color-text-primary)' }}>
                        {s.station}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px', marginBottom:12 }}>
                        <div>
                          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>Risk</div>
                          <RiskBadge level={s.risk_level} />
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>Score</div>
                          <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:13 }}>{s.risk_score ?? '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>Current</div>
                          <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:13 }}>{fmtGW(s.current_groundwater)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>Predicted</div>
                          <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:13 }}>{fmtGW(s.predicted_groundwater)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/block/${encodeURIComponent(s.station)}`)}
                        style={{
                          width:'100%', padding:'8px 12px',
                          background:'var(--color-primary)', color:'#fff',
                          border:'none', borderRadius:4,
                          fontWeight:600, fontSize:13, cursor:'pointer',
                        }}
                      >
                        View Block Intelligence →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Filter panel — positioned ABOVE the map using absolute + high z-index */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              left: 16,
              zIndex: 1000,
              background: 'var(--color-surface-card)',
              border: '1px solid var(--color-border-ui)',
              borderRadius: 8,
              padding: '14px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              maxWidth: 340,
            }}>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--color-text-primary)', marginBottom:2 }}>
                Groundwater Risk Map
              </div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:12 }}>
                Salem District ·{' '}
                <span style={{ fontFamily:'IBM Plex Mono, monospace' }}>{summary.total_stations}</span> stations
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['ALL', ...LEVELS].map(lvl => {
                  const count = lvl === 'ALL'
                    ? summary.total_stations
                    : (summary as any)[lvl.toLowerCase()] ?? 0
                  return (
                    <button
                      key={lvl}
                      onClick={() => setFilter(lvl)}
                      className={getChipClass(lvl, filter)}
                    >
                      {lvl} <span style={{ opacity:0.7 }}>({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
